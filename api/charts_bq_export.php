<?php

declare(strict_types=1);

$autoloadPath = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => 'Dependencias no instaladas. Ejecuta composer install en la raiz del proyecto.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once $autoloadPath;

require_once __DIR__ . '/bq_client.php';
require_once __DIR__ . '/xlsx_writer.php';

$config = require __DIR__ . '/config.php';
$indicatorConfig = require __DIR__ . '/bq_indicator_map.php';
$indicatorMap = $indicatorConfig['indicators'];
$rawColumns = $indicatorConfig['rawColumns'];
$indicator = isset($_GET['indicator']) ? trim((string) $_GET['indicator']) : '';
$codigoD = isset($_GET['codigoD']) ? strtoupper(trim((string) $_GET['codigoD'])) : '';
$codigoM = isset($_GET['codigoM']) ? strtoupper(trim((string) $_GET['codigoM'])) : '';
$year = isset($_GET['year']) ? trim((string) $_GET['year']) : '';

if (!isset($indicatorMap[$indicator])) {
    http_response_code(422);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => 'Indicador invalido.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!preg_match('/^D\d{2}$/', $codigoD)) {
    http_response_code(422);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => 'codigoD invalido. Debe tener formato D##, por ejemplo D44.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$isMunicipal = (bool) ($indicatorMap[$indicator]['municipal'] ?? false);
if ($codigoM !== '' && !preg_match('/^M\d{5}$/', $codigoM)) {
    http_response_code(422);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => 'codigoM invalido. Debe tener formato M#####, por ejemplo M44001.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($isMunicipal && $codigoM === '') {
    http_response_code(422);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => 'codigoM es requerido para este indicador municipal.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($isMunicipal && substr($codigoM, 1, 2) !== substr($codigoD, 1, 2)) {
    http_response_code(422);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => 'codigoM no pertenece al codigoD seleccionado.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($year !== '' && !preg_match('/^\d{4}$/', $year)) {
    http_response_code(422);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => 'year invalido. Debe tener formato AAAA.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if (($config['credentialsPath'] ?? '') !== '' && !is_file($config['credentialsPath'])) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => 'No se encontro el archivo de credenciales definido en GOOGLE_APPLICATION_CREDENTIALS.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $bigQuery = bqClient($config);

    $tableName = $indicatorMap[$indicator]['table'];
    $tableRef = sprintf('`%s.%s.%s`', $config['projectId'], $config['datasetId'], $tableName);
    $rawColumnMap = $indicatorMap[$indicator]['rawColumns']
        ?? array_combine($rawColumns, $rawColumns);
    $responseColumns = array_keys($rawColumnMap);
    $exportHeaders = array_map(
        static fn (string $col): string => $col === 'A__o' ? 'Año' : $col,
        $responseColumns
    );
    $columnSql = implode(', ', array_map(
        static fn (string $alias, string $expression): string => $expression === $alias
            ? $expression
            : "{$expression} AS {$alias}",
        $responseColumns,
        array_values($rawColumnMap)
    ));

    $sql = "
        SELECT {$columnSql}
        FROM {$tableRef}
        WHERE CodigoD = @codigoD
    ";

    $params = ['codigoD' => $codigoD];
    if ($isMunicipal) {
        $sql .= ' AND CodigoM = @codigoM';
        $params['codigoM'] = $codigoM;
    }
    if ($year !== '') {
        $sql .= ' AND CAST(A__o AS INT64) = @year';
        $params['year'] = (int) $year;
    }

    $sql .= ' ORDER BY A__o DESC LIMIT 10000';

    $query = $bigQuery->query($sql)->parameters($params);
    $queryResults = $bigQuery->runQuery($query);

    $rows = [];
    foreach ($queryResults as $row) {
        $excelRow = [];
        foreach ($responseColumns as $col) {
            $excelRow[] = $row[$col] ?? null;
        }
        $rows[] = $excelRow;
    }

    $safeIndicator = preg_replace('/[^A-Za-z0-9_\-]/', '_', $indicator) ?: 'indicador';
    $timestamp = gmdate('Ymd_His');
    $territoryCode = $isMunicipal ? $codigoM : $codigoD;
    $filename = sprintf('datos_%s_%s_%s.xlsx', $safeIndicator, $territoryCode, $timestamp);
    $numericColumns = [];
    foreach ($responseColumns as $index => $column) {
        if (str_starts_with($column, 'Dato_')) {
            $numericColumns[] = $index;
        }
    }
    $workbook = xlsxWorkbook($exportHeaders, $rows, $numericColumns);

    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . strlen($workbook));
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');

    echo $workbook;
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => 'Error exportando datos de BigQuery.',
        'details' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
