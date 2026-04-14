<?php

declare(strict_types=1);

$sourceAlimentos = 'Departamento Administrativo Nacional de Estadística (DANE). Anexos estadísticos de la Encuesta Nacional de Calidad de Vida (ECV), 2021 - 2024.';

return [
    'indicators' => [
        'T_Verduras_BQ' => ['table' => 'T_Verduras_BQ', 'source' => $sourceAlimentos],
        'T_Legumbres_BQ' => ['table' => 'T_Legumbres_BQ', 'source' => $sourceAlimentos],
        'T_Cereales_BQ' => ['table' => 'T_Cereales_BQ', 'source' => $sourceAlimentos],
        'T_Frutas_BQ' => ['table' => 'T_Frutas_BQ', 'source' => $sourceAlimentos],
        'T_Productos_lacteos_BQ' => ['table' => 'T_Productos_lacteos_BQ', 'source' => $sourceAlimentos],
        'T_Productos_carnicos_BQ' => ['table' => 'T_Productos_carnicos_BQ', 'source' => $sourceAlimentos],
        'T_Raices_tuberculos_y_platanos_BQ' => ['table' => 'T_Raices_tuberculos_y_platanos_BQ', 'source' => $sourceAlimentos],
        'T_Huevos_BQ' => ['table' => 'T_Huevos_BQ', 'source' => $sourceAlimentos],
        'RT_Compra_mas_BQ' => ['table' => 'RT_Compra_mas_BQ'],
        'RT_Prepara_mas_BQ' => ['table' => 'RT_Prepara_mas_BQ'],
        'RT_Humedad_temperatura_BQ' => ['table' => 'RT_Humedad_temperatura_BQ'],
        'RT_Mala_conservacion_BQ' => ['table' => 'RT_Mala_conservacion_BQ'],
        'RT_Vencimiento_BQ' => ['table' => 'RT_Vencimiento_BQ'],
        'RT_Falta_refrigeracion_BQ' => ['table' => 'RT_Falta_refrigeracion_BQ'],
        'RT_Exceso_tiempo_BQ' => ['table' => 'RT_Exceso_tiempo_BQ'],
    ],
    'rawColumns' => [
        'A__o',
        'CodigoD',
        'Departamento',
        'Indicador_filtro',
        'Tipo_dato',
        'Tipo_medida',
        'Dato_Nacional',
        'Dato_Departamento',
    ],
];
