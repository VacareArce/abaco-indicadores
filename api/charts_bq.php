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

$indicator = isset($_GET['indicator']) ? trim((string) $_GET['indicator']) : '';
$codigoD = isset($_GET['codigoD']) ? strtoupper(trim((string) $_GET['codigoD'])) : '';
$codigoM = isset($_GET['codigoM']) ? strtoupper(trim((string) $_GET['codigoM'])) : '';

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

if (($config['credentialsPath'] ?? '') !== '' && !is_file($config['credentialsPath'])) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'No se encontro el archivo de credenciales definido en GOOGLE_APPLICATION_CREDENTIALS.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Lleva el valor guardado a su unidad de presentacion.
 *
 * La escala se declara por indicador en bq_indicator_map.php: unas tablas
 * guardan fraccion (0.0231 -> 2.31 %) y otras ya guardan el valor final
 * (51.74 %, 1496026 ha). 'Tipo_dato' no alcanza para distinguirlas.
 *
 * @param mixed $value
 */
function valueToPercent($value, float $escala = 100.0): ?float
{
    if ($value === null) {
        return null;
    }

    return round(((float) $value) * $escala, 2);
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

/**
 * Anexa las aclaraciones del indicador (anios dobles, area en litigio) despues
 * de la cita de la fuente. Solo las llevan los indicadores que las declaran en
 * bq_indicator_map.php.
 *
 * @param string[] $notas
 */
function bqConNotas(string $fuente, array $notas): string
{
    $limpias = array_filter(array_map('trim', $notas));

    return $limpias === [] ? $fuente : $fuente . ' ' . implode(' ', $limpias);
}

try {
    $bigQuery = bqClient($config);

    $tableName = $indicatorMap[$indicator]['table'];
    $escala = (float) ($indicatorMap[$indicator]['escala'] ?? 100);
    $unidad = (string) ($indicatorMap[$indicator]['unidad'] ?? '%');
    $tableRef = sprintf('`%s.%s.%s`', $config['projectId'], $config['datasetId'], $tableName);
    $cacheKey = $isMunicipal
        ? "chart:v2:{$indicator}:{$codigoD}:{$codigoM}"
        : "chart:v2:{$indicator}:{$codigoD}";

    $payload = bqCacheServe(
        bqCacheDir($config),
        $indicator,
        $cacheKey,
        bqTableModifiedProvider($bigQuery, $config['datasetId'], $tableName),
        static function () use ($bigQuery, $tableRef, $codigoD, $codigoM, $indicator, $indicatorMap, $escala, $unidad, $isMunicipal): array {
            // Una sola consulta cubre serie, KPI y titulo. El KPI es la fila del ultimo
            // anio de la serie -- mismo AVG sobre el mismo filtro -- y el titulo es el
            // mismo ANY_VALUE que antes se pedia aparte.
            $municipalSelect = $isMunicipal
                ? ', AVG(Dato_Municipio) AS municipal, ANY_VALUE(Municipio) AS municipio'
                : '';
            $municipalFilter = $isMunicipal ? ' AND CodigoM = @codigoM' : '';
            $seriesSql = "
                SELECT
                    CAST(A__o AS INT64) AS anio,
                    AVG(Dato_Nacional) AS nacional,
                    AVG(Dato_Departamento) AS departamental,
                    ANY_VALUE(Indicador_filtro) AS indicador_filtro
                    {$municipalSelect}
                FROM {$tableRef}
                WHERE CodigoD = @codigoD
                  AND A__o IS NOT NULL
                  {$municipalFilter}
                GROUP BY anio
                ORDER BY anio
            ";

            $params = ['codigoD' => $codigoD];
            if ($isMunicipal) {
                $params['codigoM'] = $codigoM;
            }
            $seriesQuery = $bigQuery->query($seriesSql)->parameters($params);

            $seriesResults = $bigQuery->runQuery($seriesQuery);

            $years = [];
            $nacional = [];
            $departamental = [];
            $municipal = [];
            $municipio = null;
            $titleFromData = null;

            foreach ($seriesResults as $row) {
                $years[] = (int) $row['anio'];
                $nacional[] = valueToPercent($row['nacional'], $escala);
                $departamental[] = valueToPercent($row['departamental'], $escala);
                $municipal[] = $isMunicipal ? valueToPercent($row['municipal'] ?? null, $escala) : null;

                if ($titleFromData === null && isset($row['indicador_filtro'])) {
                    $titleFromData = trim((string) $row['indicador_filtro']);
                }
                if ($municipio === null && isset($row['municipio'])) {
                    $municipio = trim((string) $row['municipio']);
                }
            }

            // El anio del KPI sale del propio dato, no del reloj del servidor:
            // la ECV llega con rezago y CURRENT_DATE() dejaria los KPIs vacios.
            $latestYear = $years !== [] ? max($years) : null;

            $kpiIndex = $latestYear !== null ? array_search($latestYear, $years, true) : false;
            $kpiNacional = $kpiIndex !== false ? $nacional[$kpiIndex] : null;
            $kpiDepartamento = $kpiIndex !== false ? $departamental[$kpiIndex] : null;
            $kpiMunicipio = $isMunicipal && $kpiIndex !== false ? $municipal[$kpiIndex] : null;

            return [
                'ok' => true,
                'indicator' => $indicator,
                'title' => $indicatorMap[$indicator]['title']
                    ?? ($titleFromData !== '' && $titleFromData !== null ? $titleFromData : $indicator),
                'territoryLevel' => $isMunicipal ? 'municipio' : 'departamento',
                'kpis' => [
                    'nacional' => $kpiNacional,
                    'departamento' => $kpiDepartamento,
                    'municipio' => $kpiMunicipio,
                ],
                'kpiYear' => $latestYear,
                'series' => [
                    'years' => $years,
                    'nacional' => $nacional,
                    'departamental' => $departamental,
                    'municipal' => $isMunicipal ? $municipal : [],
                ],
                'meta' => [
                    'codigoD' => $codigoD,
                    'codigoM' => $isMunicipal ? $codigoM : null,
                    'municipio' => $isMunicipal ? $municipio : null,
                    'unidad' => $unidad,
                    'source' => bqConNotas(
                        bqSourceWithRange($indicatorMap[$indicator]['source'] ?? null, $years),
                        $indicatorMap[$indicator]['notas'] ?? []
                    ),
                ],
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
