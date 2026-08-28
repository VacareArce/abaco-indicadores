<?php

declare(strict_types=1);

/*
 * Cache en archivos para los payloads que salen de BigQuery.
 *
 * Por que existe: las tablas de la ECV son diminutas, asi que el tiempo de
 * carga no lo manda el volumen de datos sino la latencia por job de BigQuery
 * (~0.5-2 s cada uno). Como el dato se actualiza una vez al ano, cachear el
 * JSON ya armado convierte esa espera en una lectura de disco.
 *
 * Ninguna funcion de este archivo puede lanzar: si el directorio de cache no
 * es escribible (permisos de cPanel), los endpoints deben seguir respondiendo
 * igual que antes, solo que sin cache.
 */

const BQ_CACHE_TTL = 86400;          // 24 h: red de seguridad si la metadata no responde.
const BQ_CACHE_METADATA_CHECK = 900; // 15 min: cada cuanto se revalida contra BigQuery.
const BQ_CACHE_GC_PROBABILITY = 20;  // 1 de cada N escrituras barre el directorio.

/**
 * Devuelve el directorio de cache listo para usar, o null si no se puede usar.
 */
function bqCacheDir(array $config): ?string
{
    $dir = (string) ($config['cachePath'] ?? (__DIR__ . '/../cache/bq'));

    if ($dir === '') {
        return null;
    }

    if (!is_dir($dir) && !@mkdir($dir, 0775, true) && !is_dir($dir)) {
        return null;
    }

    return is_writable($dir) ? $dir : null;
}

/**
 * Sello de version del cache.
 *
 * El cache del navegador (sessionStorage en charts_bq.js) no revalida: si tiene
 * la entrada la devuelve sin preguntar. Un endpoint no puede alcanzar el
 * sessionStorage de otra pestana, asi que la invalidacion va al reves: la app
 * consulta este sello al cargar y, si cambio, vacia lo suyo.
 *
 * Devuelve '' cuando no hay directorio utilizable: sin sello, la app no borra
 * nada y todo sigue funcionando.
 */
function bqCacheGeneration(?string $dir): string
{
    if ($dir === null) {
        return '';
    }

    $file = $dir . '/generation.txt';
    $actual = @file_get_contents($file);

    if (is_string($actual) && trim($actual) !== '') {
        return trim($actual);
    }

    return bqCacheBumpGeneration($dir);
}

/**
 * Genera un sello nuevo. Lo llama la purga para que el cambio llegue a los
 * navegadores. Devuelve el valor escrito, o '' si no se pudo guardar.
 */
function bqCacheBumpGeneration(?string $dir): string
{
    if ($dir === null) {
        return '';
    }

    $valor = dechex(time()) . '-' . bin2hex(random_bytes(4));
    $file = $dir . '/generation.txt';

    // Mismo patron atomico que bqCacheWrite(): un lector nunca ve un valor a medias.
    $tmp = $file . '.' . getmypid() . '.tmp';
    if (@file_put_contents($tmp, $valor, LOCK_EX) === false) {
        return '';
    }

    if (!@rename($tmp, $file)) {
        @unlink($tmp);
        return '';
    }

    return $valor;
}

/**
 * Nombre de archivo. Lleva el indicador por delante para que la purga por
 * indicador pueda encontrarlo con un glob, sin abrir cada archivo.
 */
function bqCacheFile(string $dir, string $indicator, string $key): string
{
    $slug = preg_replace('/[^A-Za-z0-9_]/', '', $indicator) ?? '';

    return $dir . '/' . $slug . '_' . sha1($key) . '.json';
}

/**
 * Lee una entrada. Devuelve el sobre completo (payload + metadatos) o null.
 */
function bqCacheRead(string $file, int $ttl): ?array
{
    if (!is_file($file)) {
        return null;
    }

    $age = time() - (int) @filemtime($file);
    if ($age < 0 || $age > $ttl) {
        return null;
    }

    $raw = @file_get_contents($file);
    if ($raw === false) {
        return null;
    }

    $envelope = json_decode($raw, true);
    if (!is_array($envelope) || !isset($envelope['payload']) || !is_array($envelope['payload'])) {
        return null;
    }

    $envelope['age'] = $age;

    return $envelope;
}

/**
 * Escritura atomica: en un hosting compartido dos visitantes pueden regenerar
 * la misma entrada a la vez, y un lector no debe ver un archivo a medio hacer.
 */
function bqCacheWrite(string $file, array $payload, ?string $tableModified): void
{
    $envelope = json_encode([
        'created' => time(),
        'tableModified' => $tableModified,
        'payload' => $payload,
    ], JSON_UNESCAPED_UNICODE);

    if ($envelope === false) {
        return;
    }

    $tmp = $file . '.' . getmypid() . '.tmp';
    if (@file_put_contents($tmp, $envelope, LOCK_EX) === false) {
        return;
    }

    if (!@rename($tmp, $file)) {
        @unlink($tmp);
    }
}

/**
 * Borra las entradas vencidas para que el directorio no crezca sin limite.
 * Se llama al azar en 1 de cada BQ_CACHE_GC_PROBABILITY escrituras, asi no
 * hace falta un cron en cPanel.
 */
function bqCacheGc(string $dir, int $ttl): void
{
    $files = @glob($dir . '/*.json');
    if ($files === false) {
        return;
    }

    $limit = time() - $ttl;
    foreach ($files as $file) {
        $mtime = @filemtime($file);
        if ($mtime !== false && $mtime < $limit) {
            @unlink($file);
        }
    }
}

/**
 * El patron completo: sirve del cache si sigue vigente, si no consulta.
 *
 * La revalidacion respeta el contrato de datos (docs/CONTRATO_DATOS_BQ.md):
 * un corte nuevo en BigQuery tiene que aparecer solo, sin tocar codigo. Por eso
 * se compara el lastModifiedTime de la tabla -- una llamada de metadata, no un
 * job: no factura bytes -- en lugar de esperar a que venza el TTL de 24 h.
 *
 * @param callable():?string $tableModified Se invoca solo cuando toca revalidar.
 * @param callable():array   $producer      Consulta a BigQuery y arma el payload.
 */
function bqCacheServe(
    ?string $dir,
    string $indicator,
    string $key,
    callable $tableModified,
    callable $producer,
    int $ttl = BQ_CACHE_TTL
): array {
    if ($dir === null) {
        return $producer();
    }

    $file = bqCacheFile($dir, $indicator, $key);
    $envelope = bqCacheRead($file, $ttl);

    $current = null;
    $checked = false;

    if ($envelope !== null) {
        // Recien escrito: se sirve sin preguntarle nada a BigQuery.
        if ($envelope['age'] < BQ_CACHE_METADATA_CHECK) {
            return $envelope['payload'];
        }

        $current = $tableModified();
        $checked = true;

        // Si la metadata no se pudo leer, el TTL manda y la entrada sigue valiendo.
        if ($current === null || $current === ($envelope['tableModified'] ?? null)) {
            @touch($file);
            return $envelope['payload'];
        }
    }

    $payload = $producer();
    bqCacheWrite($file, $payload, $checked ? $current : $tableModified());

    if (mt_rand(1, BQ_CACHE_GC_PROBABILITY) === 1) {
        bqCacheGc($dir, $ttl);
    }

    return $payload;
}

/**
 * Emite el JSON con cache de navegador.
 *
 * Complementa al cache de archivos: aquel ahorra el viaje a BigQuery, este
 * ahorra el viaje al servidor. Con el ETag, volver a un tablero ya visto se
 * resuelve con un 304 sin cuerpo.
 *
 * No usarlo en la exportacion CSV, que debe seguir siendo no-store.
 */
function bqSendJson(array $payload): void
{
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        http_response_code(500);
        echo '{"ok":false,"error":"No fue posible serializar la respuesta."}';
        return;
    }

    $etag = '"' . md5($json) . '"';

    // 'no-cache' no significa no cachear: significa revalidar siempre. Con el
    // ETag de abajo, una respuesta sin cambios cuesta un 304 de 0 bytes.
    // Con max-age=1800 el navegador ni preguntaba durante media hora.
    header('Cache-Control: no-cache');
    header('ETag: ' . $etag);

    $ifNoneMatch = trim((string) ($_SERVER['HTTP_IF_NONE_MATCH'] ?? ''));
    if ($ifNoneMatch !== '' && $ifNoneMatch === $etag) {
        http_response_code(304);
        return;
    }

    echo $json;
}
