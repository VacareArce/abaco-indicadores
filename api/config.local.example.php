<?php

declare(strict_types=1);

/*
 * Copia este archivo como api/config.local.php y ajusta tus valores locales.
 * El archivo config.local.php esta ignorado por git para no exponer rutas sensibles.
 */

return [
    // Proyecto de BigQuery
    'projectId' => 'observatorio-377023',

    // Dataset donde viven las tablas
    'datasetId' => 'Indicadores',

    // Tabla de prueba para api/bigquery_test.php
    'tableId' => 'T_Frutas_BQ',

    // Ruta local de credenciales (ejemplo)
    'credentialsPath' => 'C:/ruta/privada/bq-observatorio.json',
];
