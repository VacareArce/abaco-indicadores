<?php

declare(strict_types=1);

/*
 * Sello de version del cache.
 *
 * La app lo consulta al cargar y al volver a la pestana. Si cambio respecto al
 * que tenia guardado, vacia su sessionStorage: es la unica forma de que una
 * purga en el servidor llegue al navegador, porque desde aqui no se puede
 * alcanzar el almacenamiento de otra pestana.
 *
 * Tiene que ser barato: no construye el cliente de BigQuery ni carga el mapa de
 * indicadores, solo lee un archivo.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/bq_cache.php';

$config = require __DIR__ . '/config.php';

echo json_encode([
    'ok' => true,
    'generation' => bqCacheGeneration(bqCacheDir($config)),
], JSON_UNESCAPED_UNICODE);
