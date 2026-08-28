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

function normalizeDeptCode(string $codigoD): string
{
    $numeric = preg_replace('/\D+/', '', $codigoD) ?? '';
    return str_pad($numeric, 2, '0', STR_PAD_LEFT);
}

try {
    $bigQuery = bqClient($config);

    $tableName = $indicatorMap[$indicator]['table'];
    $escala = (float) ($indicatorMap[$indicator]['escala'] ?? 100);
    $unidad = (string) ($indicatorMap[$indicator]['unidad'] ?? '%');
    $tableRef = sprintf('`%s.%s.%s`', $config['projectId'], $config['datasetId'], $tableName);

    // La clave no lleva codigoD: el payload del mapa no depende del departamento.
    // Lo unico que varia es meta.selectedCode, que se inyecta despues de leer el
    // cache. Asi 1 entrada por indicador sirve las ~33 combinaciones.
    $payload = bqCacheServe(
        bqCacheDir($config),
        $indicator,
        "map:{$indicator}",
        bqTableModifiedProvider($bigQuery, $config['datasetId'], $tableName),
        static function () use ($bigQuery, $tableRef, $indicator, $indicatorMap, $escala, $unidad): array {

            // Una sola consulta cubre valores, anios y titulo: los anios son las claves
            // distintas del propio resultado y el titulo es el mismo ANY_VALUE de antes.
            $valuesSql = "
                SELECT
                    CAST(A__o AS INT64) AS anio,
                    CodigoD,
                    AVG(Dato_Departamento) AS departamental,
                    ANY_VALUE(Indicador_filtro) AS indicador_filtro
                FROM {$tableRef}
                WHERE A__o IS NOT NULL
                  AND CodigoD IS NOT NULL
                GROUP BY anio, CodigoD
                ORDER BY anio, CodigoD
            ";
            $valuesResults = $bigQuery->runQuery($bigQuery->query($valuesSql));

            $years = [];
            $valuesByYear = [];
            $allValues = [];
            $titleFromData = null;

            foreach ($valuesResults as $row) {
                $anio = (int) $row['anio'];
                $yearKey = (string) $anio;
                $depCode = normalizeDeptCode((string) $row['CodigoD']);
                $value = valueToPercent($row['departamental'], $escala);

                if (!isset($valuesByYear[$yearKey])) {
                    $valuesByYear[$yearKey] = [];
                    $years[] = $anio;
                }

                $valuesByYear[$yearKey][$depCode] = $value;

                if ($value !== null) {
                    $allValues[] = $value;
                }

                if ($titleFromData === null && isset($row['indicador_filtro'])) {
                    $titleFromData = trim((string) $row['indicador_filtro']);
                }
            }

            return [
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
                    'unidad' => $unidad,
                    'source' => bqConNotas(
                        bqSourceWithRange($indicatorMap[$indicator]['source'] ?? null, $years),
                        $indicatorMap[$indicator]['notas'] ?? []
                    ),
                ],
            ];
        }
    );

    $payload['meta'] = ['selectedCode' => $codigoD !== '' ? normalizeDeptCode($codigoD) : null]
        + $payload['meta'];

    bqSendJson($payload);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Error consultando BigQuery para mapas.',
        'details' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
