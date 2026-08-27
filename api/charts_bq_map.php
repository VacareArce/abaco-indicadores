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
$indicatorConfig = require __DIR__ . '/bq_indicator_map.php';
$indicatorMap = $indicatorConfig['indicators'];

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

if ($codigoD !== '' && !preg_match('/^D\d{2}$/', $codigoD)) {
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

/**
 * Cierra la cita de la fuente con el rango de anios realmente presente en el dato,
 * para que no quede un rango fijo desactualizado cuando entre un anio nuevo.
 *
 * @param int[] $years
 */
function bqSourceWithRange(?string $source, array $years): string
{
    $base = $source !== null && trim($source) !== ''
        ? rtrim(trim($source), '.')
        : 'Departamento Administrativo Nacional de Estadistica (DANE). Encuesta Nacional de Calidad de Vida (ECV)';

    if ($years === []) {
        return $base . '.';
    }

    $min = min($years);
    $max = max($years);

    return $base . ', ' . ($min === $max ? (string) $min : $min . ' - ' . $max) . '.';
}

function normalizeDeptCode(string $codigoD): string
{
    $numeric = preg_replace('/\D+/', '', $codigoD) ?? '';
    return str_pad($numeric, 2, '0', STR_PAD_LEFT);
}

try {
    $clientConfig = ['projectId' => $config['projectId']];
    if (($config['credentialsPath'] ?? '') !== '') {
        $clientConfig['keyFilePath'] = $config['credentialsPath'];
    }

    $bigQuery = new Google\Cloud\BigQuery\BigQueryClient($clientConfig);

    $tableName = $indicatorMap[$indicator]['table'];
    $tableRef = sprintf('`%s.%s.%s`', $config['projectId'], $config['datasetId'], $tableName);

    $yearsSql = "
        SELECT DISTINCT CAST(A__o AS INT64) AS anio
        FROM {$tableRef}
        WHERE A__o IS NOT NULL
        ORDER BY anio
    ";
    $yearsResults = $bigQuery->runQuery($bigQuery->query($yearsSql));

    $years = [];
    foreach ($yearsResults as $row) {
        $years[] = (int) $row['anio'];
    }

    $valuesSql = "
        SELECT
            CAST(A__o AS INT64) AS anio,
            CodigoD,
            AVG(Dato_Departamento) AS departamental
        FROM {$tableRef}
        WHERE A__o IS NOT NULL
          AND CodigoD IS NOT NULL
        GROUP BY anio, CodigoD
        ORDER BY anio, CodigoD
    ";
    $valuesResults = $bigQuery->runQuery($bigQuery->query($valuesSql));

    $valuesByYear = [];
    $allValues = [];
    foreach ($valuesResults as $row) {
        $yearKey = (string) ((int) $row['anio']);
        $depCode = normalizeDeptCode((string) $row['CodigoD']);
        $value = valueToPercent($row['departamental']);
        if (!isset($valuesByYear[$yearKey])) {
            $valuesByYear[$yearKey] = [];
        }
        $valuesByYear[$yearKey][$depCode] = $value;
        if ($value !== null) {
            $allValues[] = $value;
        }
    }

    $titleSql = "
        SELECT ANY_VALUE(Indicador_filtro) AS indicador_filtro
        FROM {$tableRef}
        WHERE A__o IS NOT NULL
    ";
    $titleResults = $bigQuery->runQuery($bigQuery->query($titleSql));
    $titleFromData = null;
    foreach ($titleResults as $row) {
        $titleFromData = isset($row['indicador_filtro']) ? trim((string) $row['indicador_filtro']) : null;
        break;
    }

    $selectedCode = $codigoD !== '' ? normalizeDeptCode($codigoD) : null;

    echo json_encode([
        'ok' => true,
        'indicator' => $indicator,
        'title' => $titleFromData !== '' && $titleFromData !== null
            ? $titleFromData
            : $indicator,
        'years' => $years,
        'valuesByYear' => $valuesByYear,
        'scale' => [
            'min' => $allValues !== [] ? min($allValues) : null,
            'max' => $allValues !== [] ? max($allValues) : null,
        ],
        'meta' => [
            'selectedCode' => $selectedCode,
            'source' => bqSourceWithRange(
                $indicatorMap[$indicator]['source'] ?? null,
                $years
            ),
        ],
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Error consultando BigQuery para mapas.',
        'details' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
