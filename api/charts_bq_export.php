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

$config = require __DIR__ . '/config.php';
$indicatorConfig = require __DIR__ . '/bq_indicator_map.php';
$indicatorMap = $indicatorConfig['indicators'];
$rawColumns = $indicatorConfig['rawColumns'];
$exportHeaders = array_map(
    static function (string $col): string {
        return $col === 'A__o' ? 'Año' : $col;
    },
    $rawColumns
);

$indicator = isset($_GET['indicator']) ? trim((string) $_GET['indicator']) : '';
$codigoD = isset($_GET['codigoD']) ? strtoupper(trim((string) $_GET['codigoD'])) : '';
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

/**
 * @param mixed $value
 */
function csvSafeCell($value): string
{
    if ($value === null) {
        return '';
    }

    if (is_int($value)) {
        $text = (string) $value;
    } elseif (is_float($value)) {
        $text = rtrim(rtrim((string) $value, '0'), '.');
        if ($text === '') {
            $text = '0';
        }
        $text = str_replace('.', ',', $text);
    } else {
        $text = (string) $value;
    }

    if (!is_float($value) && is_numeric($text) && str_contains($text, '.')) {
        $text = str_replace('.', ',', $text);
    }

    if ($text !== '' && preg_match('/^[=+\-@]/', $text)) {
        return "'" . $text;
    }

    return $text;
}

function encodeExcelText(string $text): string
{
    if (function_exists('mb_convert_encoding')) {
        return mb_convert_encoding($text, 'UTF-16LE', 'UTF-8');
    }

    if (function_exists('iconv')) {
        $converted = iconv('UTF-8', 'UTF-16LE//IGNORE', $text);
        if ($converted !== false) {
            return $converted;
        }
    }

    return $text;
}

function writeCsvRowUtf16($output, array $fields, string $delimiter = ';'): void
{
    $tmp = fopen('php://temp', 'wb+');
    if ($tmp === false) {
        throw new RuntimeException('No fue posible crear buffer temporal para CSV.');
    }

    fputcsv($tmp, $fields, $delimiter);
    rewind($tmp);
    $line = stream_get_contents($tmp);
    fclose($tmp);

    if ($line === false) {
        throw new RuntimeException('No fue posible leer fila temporal para CSV.');
    }

    fwrite($output, encodeExcelText($line));
}

try {
    $bigQuery = bqClient($config);

    $tableName = $indicatorMap[$indicator]['table'];
    $tableRef = sprintf('`%s.%s.%s`', $config['projectId'], $config['datasetId'], $tableName);
    $columnSql = implode(', ', $rawColumns);

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
        $csvRow = [];
        foreach ($rawColumns as $col) {
            $csvRow[] = csvSafeCell($row[$col] ?? null);
        }
        $rows[] = $csvRow;
    }

    $safeIndicator = preg_replace('/[^A-Za-z0-9_\-]/', '_', $indicator) ?: 'indicador';
    $timestamp = gmdate('Ymd_His');
    $filename = sprintf('raw_%s_%s_%s.csv', $safeIndicator, $codigoD, $timestamp);

    header('Content-Type: text/csv; charset=UTF-16LE');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');

    echo "\xFF\xFE";
    $output = fopen('php://output', 'wb');
    if ($output === false) {
        throw new RuntimeException('No fue posible abrir el flujo de salida para CSV.');
    }

    fwrite($output, encodeExcelText("sep=;\r\n"));
    writeCsvRowUtf16($output, $exportHeaders, ';');
    foreach ($rows as $row) {
        writeCsvRowUtf16($output, $row, ';');
    }

    fclose($output);
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => 'Error exportando datos de BigQuery.',
        'details' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
