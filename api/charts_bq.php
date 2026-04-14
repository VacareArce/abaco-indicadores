<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$autoloadPath = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Dependencias no instaladas. Ejecuta composer install en la raiz del proyecto.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once $autoloadPath;

$config = require __DIR__ . '/config.php';

$sourceAlimentos = 'Departamento Administrativo Nacional de Estadística (DANE). Anexos estadísticos de la Encuesta Nacional de Calidad de Vida (ECV), 2021 - 2024.';

$indicatorMap = [
    'T_Verduras_BQ' => ['table' => 'T_Verduras_BQ', 'source' => $sourceAlimentos],
    'T_Legumbres_BQ' => ['table' => 'T_Legumbres_BQ', 'source' => $sourceAlimentos],
    'T_Cereales_BQ' => ['table' => 'T_Cereales_BQ', 'source' => $sourceAlimentos],
    'T_Frutas_BQ' => [
        'table' => 'T_Frutas_BQ',
        'source' => $sourceAlimentos
    ],
    'T_Productos_lacteos_BQ' => ['table' => 'T_Productos_lacteos_BQ', 'source' => $sourceAlimentos],
    'T_Productos_carnicos_BQ' => ['table' => 'T_Productos_carnicos_BQ', 'source' => $sourceAlimentos],
    'T_Raices_tuberculos_y_platanos_BQ' => ['table' => 'T_Raices_tuberculos_y_platanos_BQ', 'source' => $sourceAlimentos],
    'T_Huevos_BQ' => ['table' => 'T_Huevos_BQ', 'source' => $sourceAlimentos],
    'RT_Compra_mas_BQ' => ['table' => 'RT_Compra_mas_BQ'],
    'RT_Prepara_mas_BQ' => ['table' => 'RT_Prepara_mas_BQ'],
    'RT_Humedad_temperatura_BQ' => ['table' => 'RT_Humedad_temperatura_BQ'],
    'RT_Mala_conservacion_BQ' => ['table' => 'RT_Mala_conservacion_BQ'],
    'RT_Vencimiento_BQ' => ['table' => 'RT_Vencimiento_BQ'],
    'RT_Falta_refrigeracion_BQ' => ['table' => 'RT_Falta_refrigeracion_BQ'],
    'RT_Exceso_tiempo_BQ' => ['table' => 'RT_Exceso_tiempo_BQ'],
];

$indicator = isset($_GET['indicator']) ? trim((string) $_GET['indicator']) : '';
$codigoD = isset($_GET['codigoD']) ? strtoupper(trim((string) $_GET['codigoD'])) : '';

if (!isset($indicatorMap[$indicator])) {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => 'Indicador invalido.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!preg_match('/^D\d{2}$/', $codigoD)) {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => 'codigoD invalido. Debe tener formato D##, por ejemplo D44.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($config['credentialsPath'] ?? '') !== '' && !is_file($config['credentialsPath'])) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'No se encontro el archivo de credenciales definido en GOOGLE_APPLICATION_CREDENTIALS.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * @param mixed $value
 */
function valueToPercent($value): ?float
{
    if ($value === null) {
        return null;
    }

    return round(((float) $value) * 100, 2);
}

try {
    $clientConfig = ['projectId' => $config['projectId']];
    if (($config['credentialsPath'] ?? '') !== '') {
        $clientConfig['keyFilePath'] = $config['credentialsPath'];
    }

    $bigQuery = new Google\Cloud\BigQuery\BigQueryClient($clientConfig);

    $tableName = $indicatorMap[$indicator]['table'];
    $tableRef = sprintf('`%s.%s.%s`', $config['projectId'], $config['datasetId'], $tableName);

    $seriesSql = "
        SELECT
            CAST(A__o AS INT64) AS anio,
            AVG(Dato_Nacional) AS nacional,
            AVG(Dato_Departamento) AS departamental
        FROM {$tableRef}
        WHERE CodigoD = @codigoD
          AND A__o BETWEEN 2021 AND 2024
        GROUP BY anio
        ORDER BY anio
    ";

    $seriesQuery = $bigQuery->query($seriesSql)->parameters([
        'codigoD' => $codigoD,
    ]);

    $seriesResults = $bigQuery->runQuery($seriesQuery);

    $years = [];
    $nacional = [];
    $departamental = [];

    foreach ($seriesResults as $row) {
        $years[] = (int) $row['anio'];
        $nacional[] = valueToPercent($row['nacional']);
        $departamental[] = valueToPercent($row['departamental']);
    }

    $kpiSql = "
        SELECT
            AVG(Dato_Nacional) AS nacional_2024,
            AVG(Dato_Departamento) AS departamento_2024
        FROM {$tableRef}
        WHERE CodigoD = @codigoD
          AND A__o = 2024
    ";

    $kpiQuery = $bigQuery->query($kpiSql)->parameters([
        'codigoD' => $codigoD,
    ]);

    $kpiResults = $bigQuery->runQuery($kpiQuery);

    $kpiRow = null;
    foreach ($kpiResults as $row) {
        $kpiRow = $row;
        break;
    }

    $titleSql = "
        SELECT ANY_VALUE(Indicador_filtro) AS indicador_filtro
        FROM {$tableRef}
        WHERE CodigoD = @codigoD
          AND A__o BETWEEN 2021 AND 2024
    ";

    $titleQuery = $bigQuery->query($titleSql)->parameters([
        'codigoD' => $codigoD,
    ]);

    $titleResults = $bigQuery->runQuery($titleQuery);
    $titleFromData = null;
    foreach ($titleResults as $row) {
        $titleFromData = isset($row['indicador_filtro']) ? trim((string) $row['indicador_filtro']) : null;
        break;
    }

    echo json_encode([
        'ok' => true,
        'indicator' => $indicator,
        'title' => $titleFromData !== '' && $titleFromData !== null
            ? $titleFromData
            : $indicator,
        'kpis' => [
            'nacional_2024' => valueToPercent($kpiRow['nacional_2024'] ?? null),
            'departamento_2024' => valueToPercent($kpiRow['departamento_2024'] ?? null),
            'municipio_2024' => null,
        ],
        'series' => [
            'years' => $years,
            'nacional' => $nacional,
            'departamental' => $departamental,
        ],
        'meta' => [
            'codigoD' => $codigoD,
            'source' => $indicatorMap[$indicator]['source']
                ?? 'Departamento Administrativo Nacional de Estadistica (DANE). Encuesta Nacional de Calidad de Vida (ECV), 2021 - 2024.',
        ],
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Error consultando BigQuery.',
        'details' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
