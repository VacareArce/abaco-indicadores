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
          AND A__o IS NOT NULL
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

    // El anio del KPI sale del propio dato, no del reloj del servidor:
    // la ECV llega con rezago y CURRENT_DATE() dejaria los KPIs vacios.
    $latestYear = $years !== [] ? max($years) : null;

    $kpiRow = null;

    if ($latestYear !== null) {
        $kpiSql = "
            SELECT
                AVG(Dato_Nacional) AS nacional,
                AVG(Dato_Departamento) AS departamento
            FROM {$tableRef}
            WHERE CodigoD = @codigoD
              AND CAST(A__o AS INT64) = @latestYear
        ";

        $kpiQuery = $bigQuery->query($kpiSql)->parameters([
            'codigoD' => $codigoD,
            'latestYear' => $latestYear,
        ]);

        foreach ($bigQuery->runQuery($kpiQuery) as $row) {
            $kpiRow = $row;
            break;
        }
    }

    $titleSql = "
        SELECT ANY_VALUE(Indicador_filtro) AS indicador_filtro
        FROM {$tableRef}
        WHERE CodigoD = @codigoD
          AND A__o IS NOT NULL
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
            'nacional' => valueToPercent($kpiRow['nacional'] ?? null),
            'departamento' => valueToPercent($kpiRow['departamento'] ?? null),
            'municipio' => null,
        ],
        'kpiYear' => $latestYear,
        'series' => [
            'years' => $years,
            'nacional' => $nacional,
            'departamental' => $departamental,
        ],
        'meta' => [
            'codigoD' => $codigoD,
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
        'error' => 'Error consultando BigQuery.',
        'details' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
