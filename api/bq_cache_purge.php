<?php

declare(strict_types=1);

/*
 * Purga manual del cache de BigQuery.
 *
 * La purga automatica (revalidacion contra lastModifiedTime cada 15 min y TTL
 * de 24 h) ya hace que un corte nuevo aparezca solo. Esto es para cuando cargas
 * datos y quieres verlos YA, sin esperar esos 15 minutos.
 *
 * Herramienta administrativa: no hay boton ni atajo en la interfaz. Se usa
 * abriendo la URL con el token.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/bq_cache.php';

$config = require __DIR__ . '/config.php';
$indicatorConfig = require __DIR__ . '/bq_indicator_map.php';
$indicatorMap = $indicatorConfig['indicators'];

$expected = (string) ($config['purgeToken'] ?? '');
$given = isset($_GET['token']) ? (string) $_GET['token'] : '';

// Sin purgeToken configurado, el endpoint no existe. Y un token equivocado se
// responde igual que la ausencia de configuracion: no confirma que exista.
if ($expected === '' || !hash_equals($expected, $given)) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'No encontrado.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$dir = bqCacheDir($config);
if ($dir === null) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'El directorio de cache no existe o no es escribible.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$all = isset($_GET['all']) && $_GET['all'] !== '0' && $_GET['all'] !== '';
$indicator = isset($_GET['indicator']) ? trim((string) $_GET['indicator']) : '';

if (!$all) {
    if (!isset($indicatorMap[$indicator])) {
        http_response_code(422);
        echo json_encode([
            'ok' => false,
            'error' => 'Indica un indicador valido, o usa all=1 para vaciar todo.',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

$scope = $all ? 'all' : $indicator;

/*
 * Limite de frecuencia. No es seguridad: es proteger el rendimiento. Una URL GET
 * la disparan solos los prefetchers del navegador, los crawlers y las vistas
 * previa de enlaces de WhatsApp o Slack, sin que nadie haga clic. Sin este
 * limite el cache podria quedar permanentemente frio.
 */
const BQ_PURGE_MIN_INTERVAL = 300; // 5 minutos

$stamp = $dir . '/purge_' . sha1($scope) . '.stamp';
$transcurrido = is_file($stamp) ? time() - (int) @filemtime($stamp) : PHP_INT_MAX;
if ($transcurrido < BQ_PURGE_MIN_INTERVAL) {
    $faltan = BQ_PURGE_MIN_INTERVAL - $transcurrido;

    // ok:false y 429 a proposito: antes respondia ok:true con removed:0, y eso
    // se leia como "purgado" cuando en realidad no habia borrado nada.
    http_response_code(429);
    header('Retry-After: ' . $faltan);
    echo json_encode([
        'ok' => false,
        'scope' => $scope,
        'removed' => 0,
        'skipped' => true,
        'retryAfter' => $faltan,
        'error' => 'Purga reciente: faltan ' . $faltan . ' segundos para poder purgar este alcance.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($all) {
    $files = @glob($dir . '/*.json');
} else {
    $slug = preg_replace('/[^A-Za-z0-9_]/', '', $indicator) ?? '';
    $files = @glob($dir . '/' . $slug . '_*.json');
}

$removed = 0;
foreach ($files === false ? [] : $files as $file) {
    if (@unlink($file)) {
        $removed++;
    }
}

/*
 * El token OAuth vive en auth/ y no termina en .json, asi que el glob de arriba
 * nunca lo alcanzaba: por eso este endpoint no servia cuando el sitio caia con
 * 401. Se borra solo con all=1, porque su efecto es distinto -- la siguiente
 * peticion vuelve a firmar el JWT contra Google (~300 ms, una vez).
 */
$removedAuth = 0;
if ($all) {
    foreach ((array) @glob($dir . '/auth/*') as $token) {
        if (is_file($token) && @unlink($token)) {
            $removedAuth++;
        }
    }
}

@touch($stamp);

// Cambiar el sello es lo que hace que la purga llegue a los navegadores: la app
// lo compara al cargar y vacia su sessionStorage si difiere.
$generation = bqCacheBumpGeneration($dir);

echo json_encode([
    'ok' => true,
    'scope' => $scope,
    'removed' => $removed,
    'removedAuth' => $removedAuth,
    'skipped' => false,
    'generation' => $generation,
], JSON_UNESCAPED_UNICODE);
