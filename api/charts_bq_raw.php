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
$codigoM = isset($_GET['codigoM']) ? strtoupper(trim((string) $_GET['codigoM'])) : '';
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

$isMunicipal = (bool) ($indicatorMap[$indicator]['municipal'] ?? false);
if ($codigoM !== '' && !preg_match('/^M\d{5}$/', $codigoM)) {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => 'codigoM invalido. Debe tener formato M#####, por ejemplo M44001.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($isMunicipal && $codigoM === '') {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => 'codigoM es requerido para este indicador municipal.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($isMunicipal && substr($codigoM, 1, 2) !== substr($codigoD, 1, 2)) {
    http_response_code(422);
    echo json_encode([
        'ok' => false,
        'error' => 'codigoM no pertenece al codigoD seleccionado.'
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
    $rawColumnMap = $indicatorMap[$indicator]['rawColumns']
        ?? array_combine($rawColumns, $rawColumns);
    $responseColumns = array_keys($rawColumnMap);
    $columnSql = implode(', ', array_map(
        static fn (string $alias, string $expression): string => $expression === $alias
            ? $expression
            : "{$expression} AS {$alias}",
        $responseColumns,
        array_values($rawColumnMap)
    ));
    $cacheKey = $isMunicipal
        ? "raw:v2:{$indicator}:{$codigoD}:{$codigoM}:{$year}"
        : "raw:v2:{$indicator}:{$codigoD}:{$year}";

    $payload = bqCacheServe(
        bqCacheDir($config),
        $indicator,
        $cacheKey,
        bqTableModifiedProvider($bigQuery, $config['datasetId'], $tableName),
        static function () use ($bigQuery, $tableRef, $columnSql, $codigoD, $codigoM, $year, $indicator, $responseColumns, $isMunicipal): array {

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
                $formatted = [];
                foreach ($responseColumns as $col) {
                    $formatted[$col] = $row[$col] ?? null;
                }
                $rows[] = $formatted;
            }

            return [
                'ok' => true,
                'indicator' => $indicator,
                'territoryLevel' => $isMunicipal ? 'municipio' : 'departamento',
                'columns' => $responseColumns,
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
