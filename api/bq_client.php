<?php

declare(strict_types=1);

/*
 * Construccion centralizada del cliente de BigQuery.
 *
 * Antes cada endpoint armaba este mismo bloque por su cuenta. Ademas de quitar
 * la duplicacion, aqui se enchufa el cache de token: PHP muere al terminar cada
 * request, asi que sin este cache cada visita vuelve a firmar el JWT contra
 * Google (~200-400 ms) antes de poder consultar nada.
 */

require_once __DIR__ . '/bq_cache.php';

function bqClient(array $config): Google\Cloud\BigQuery\BigQueryClient
{
    $clientConfig = ['projectId' => $config['projectId']];

    if (($config['credentialsPath'] ?? '') !== '') {
        $clientConfig['keyFilePath'] = $config['credentialsPath'];
    }

    $cacheDir = bqCacheDir($config);
    if ($cacheDir !== null) {
        $authDir = $cacheDir . '/auth';
        if (is_dir($authDir) || @mkdir($authDir, 0775, true) || is_dir($authDir)) {
            $clientConfig['authCache'] = new Google\Auth\Cache\FileSystemCacheItemPool($authDir);
        }
    }

    return new Google\Cloud\BigQuery\BigQueryClient($clientConfig);
}

/**
 * Devuelve una funcion que consulta el lastModifiedTime de la tabla.
 *
 * Es una llamada de metadata (tables.get), no un job: no factura bytes y es un
 * orden de magnitud mas barata que una consulta. Devuelve null si falla, y en
 * ese caso el cache se queda con su TTL como unico criterio.
 *
 * @return callable():?string
 */
function bqTableModifiedProvider(
    Google\Cloud\BigQuery\BigQueryClient $bigQuery,
    string $datasetId,
    string $tableName
): callable {
    return static function () use ($bigQuery, $datasetId, $tableName): ?string {
        try {
            $info = $bigQuery->dataset($datasetId)->table($tableName)->info();

            return isset($info['lastModifiedTime']) ? (string) $info['lastModifiedTime'] : null;
        } catch (Throwable $e) {
            return null;
        }
    };
}
