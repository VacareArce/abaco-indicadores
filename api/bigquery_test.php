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

if ($config['credentialsPath'] !== '' && !is_file($config['credentialsPath'])) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'No se encontro el archivo de credenciales definido en GOOGLE_APPLICATION_CREDENTIALS.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $clientConfig = [
        'projectId' => $config['projectId'],
    ];

    if ($config['credentialsPath'] !== '') {
        $clientConfig['keyFilePath'] = $config['credentialsPath'];
    }

    $bigQuery = new Google\Cloud\BigQuery\BigQueryClient($clientConfig);

    $tableRef = sprintf('`%s.%s.%s`', $config['projectId'], $config['datasetId'], $config['tableId']);
    // Sin ?year=, usar el anio mas reciente de la tabla en vez de un literal
    // que envejece en silencio.
    if (isset($_GET['year']) && ctype_digit((string) $_GET['year'])) {
        $year = (int) $_GET['year'];
    } else {
        $year = null;
        $maxYearSql = "SELECT MAX(CAST(A__o AS INT64)) AS anio FROM {$tableRef}";
        foreach ($bigQuery->runQuery($bigQuery->query($maxYearSql)) as $maxRow) {
            $year = isset($maxRow['anio']) ? (int) $maxRow['anio'] : null;
            break;
        }
    }
    $codigoD = isset($_GET['codigoD']) ? strtoupper(trim((string) $_GET['codigoD'])) : 'D44';

    if (!preg_match('/^D\d{2}$/', $codigoD)) {
        http_response_code(422);
        echo json_encode([
            'ok' => false,
            'error' => 'codigoD invalido. Debe tener formato D##, por ejemplo D44.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $sql = "
        SELECT
            CAST(A__o AS INT64) AS anio,
            CodigoD,
            Dato_Nacional,
            Dato_Departamento
        FROM {$tableRef}
        WHERE A__o = @year
          AND CodigoD = @codigoD
        LIMIT 5
    ";

    $query = $bigQuery->query($sql)
        ->parameters([
            'year' => $year,
            'codigoD' => $codigoD,
        ]);

    $job = $bigQuery->startQuery($query);
    $job->reload();

    if (!$job->isComplete()) {
        $job->reload();
    }

    if (!$job->isComplete()) {
        http_response_code(504);
        echo json_encode([
            'ok' => false,
            'error' => 'La consulta a BigQuery no finalizo a tiempo.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $rows = [];
    foreach ($job->queryResults() as $row) {
        $rows[] = $row;
    }

    echo json_encode([
        'ok' => true,
        'project' => $config['projectId'],
        'dataset' => $config['datasetId'],
        'table' => $config['tableId'],
        'filters' => [
            'year' => $year,
            'codigoD' => $codigoD,
        ],
        'rows_found' => count($rows),
        'sample_rows' => $rows,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'Error consultando BigQuery.',
        'details' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
