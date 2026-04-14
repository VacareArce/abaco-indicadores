<?php

declare(strict_types=1);

return [
    'projectId' => getenv('BQ_PROJECT_ID') ?: 'observatorio-377023',
    'datasetId' => getenv('BQ_DATASET_ID') ?: 'Indicadores',
    'tableId' => getenv('BQ_TEST_TABLE_ID') ?: 'T_Frutas_BQ',
    'credentialsPath' => getenv('GOOGLE_APPLICATION_CREDENTIALS') ?: '',
];
