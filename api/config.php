<?php

declare(strict_types=1);

$config = [
    'projectId' => getenv('BQ_PROJECT_ID') ?: 'observatorio-377023',
    'datasetId' => getenv('BQ_DATASET_ID') ?: 'Indicadores',
    'tableId' => getenv('BQ_TEST_TABLE_ID') ?: 'T_Frutas_BQ',
    'credentialsPath' => getenv('GOOGLE_APPLICATION_CREDENTIALS') ?: '',

    // Directorio del cache de BigQuery. Vacio lo desactiva.
    'cachePath' => getenv('BQ_CACHE_PATH') ?: (__DIR__ . '/../cache/bq'),

    // Token de api/bq_cache_purge.php. Vacio deja el endpoint como inexistente.
    'purgeToken' => getenv('BQ_PURGE_TOKEN') ?: '',
];

$localConfigPath = __DIR__ . '/config.local.php';
if (is_file($localConfigPath)) {
    $localConfig = require $localConfigPath;
    if (is_array($localConfig)) {
        $config = array_replace($config, $localConfig);
    }
}

return $config;
