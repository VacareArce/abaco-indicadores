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

require_once __DIR__ . '/bq_client.php';

$config = require __DIR__ . '/config.php';
$indicatorConfig = require __DIR__ . '/bq_indicator_map.php';
$indicatorMap = $indicatorConfig['indicators'];
$rawColumns = $indicatorConfig['rawColumns'];

$indicator = isset($_GET['indicator']) ? trim((string) $_GET['indicator']) : '';
$codigoD = isset($_GET['codigoD']) ? strtoupper(trim((string) $_GET['codigoD'])) : '';
$year = isset($_GET['year']) ? trim((string) $_GET['year']) : '';

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

if ($year !== '' && !preg_match('/^\d{4}$/', $year)) {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => 'year invalido. Debe tener formato AAAA.'
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

try {
    $bigQuery = bqClient($config);

    $tableName = $indicatorMap[$indicator]['table'];
    $tableRef = sprintf('`%s.%s.%s`', $config['projectId'], $config['datasetId'], $tableName);
    $columnSql = implode(', ', $rawColumns);

    $payload = bqCacheServe(
        bqCacheDir($config),
        $indicator,
        "raw:{$indicator}:{$codigoD}:{$year}",
        bqTableModifiedProvider($bigQuery, $config['datasetId'], $tableName),
        static function () use ($bigQuery, $tableRef, $columnSql, $codigoD, $year, $indicator, $rawColumns): array {

            $sql = "
                SELECT {$columnSql}
                FROM {$tableRef}
                WHERE CodigoD = @codigoD
            ";

            $params = ['codigoD' => $codigoD];
            if ($year !== '') {
                $sql .= ' AND CAST(A__o AS INT64) = @year';
                $params['year'] = (int) $year;
            }

            $sql .= ' ORDER BY A__o DESC LIMIT 10000';

            $query = $bigQuery->query($sql)->parameters($params);
            $queryResults = $bigQuery->runQuery($query);

            $rows = [];
            foreach ($queryResults as $row) {
                $formatted = [];
                foreach ($rawColumns as $col) {
                    $formatted[$col] = $row[$col] ?? null;
                }
                $rows[] = $formatted;
            }

            return [
                'ok' => true,
                'indicator' => $indicator,
                'columns' => $rawColumns,
                'rows' => $rows,
                'total' => count($rows),
            ];
        }
    );

    bqSendJson($payload);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Error consultando BigQuery.',
        'details' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
