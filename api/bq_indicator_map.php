<?php

declare(strict_types=1);

// Sin rango de anios: lo anexa bqSourceWithRange() con los anios presentes en el dato.
$sourceAlimentos = 'Departamento Administrativo Nacional de Estadística (DANE). Anexos estadísticos de la Encuesta Nacional de Calidad de Vida (ECV)';
// Fuentes tomadas literalmente de la columna 'fuente' de
// input/20260827/InventarioIndicadores.xlsx.
$fuenteBosques = 'IDEAM – Sistema de Monitoreo de Bosques y Carbono (SMByC). Estadísticas de monitoreo de la superficie de bosque natural en Colombia';
$fuenteFrontera = 'UPRA – Unidad de Planificación Rural Agropecuaria. Sistema de Información para la Planificación Rural Agropecuaria (SIPRA), Frontera Agrícola Nacional';
$fuenteAgroFamiliar = 'UPRA – Mapa de las áreas que probablemente presentan agricultura familiar en Colombia, Sistema de Información para la Planificación Rural Agropecuaria (SIPRA)';
$fuenteErosion = 'IDEAM – Indicadores Ambientales. Indicador de proporción del área de suelos degradados por erosión';
$fuenteDesertificacion = 'IDEAM – Indicadores Ambientales. Información sobre degradación de suelos y desertificación en Colombia';
$fuenteEmpleo = 'DANE – Gran Encuesta Integrada de Hogares (GEIH), Mercado laboral por departamentos. Resultados anuales por rama de actividad económica';

// Aclaraciones que se anexan a la fuente solo donde aplican.
$notaAniosDobles = 'El dato original corresponde al periodo entre dos años consecutivos; se muestra el primero de cada par.';
$notaLitigio = 'Incluye el área en litigio entre Cauca y Huila, que no está asignada a ningún departamento.';

/*
 * 'escala': factor que convierte el dato guardado a su unidad de presentacion.
 *   100 -> la tabla guarda una fraccion (0.0231) y se muestra como porcentaje.
 *     1 -> la tabla ya guarda el valor final (51.74 %, 1496026 ha).
 *
 * Se declara por indicador a proposito: 'Tipo_dato' no alcanza para deducirlo.
 * T_Verduras_BQ y Bosque_Natural_BQ son ambos "Porcentaje", pero el primero
 * guarda fraccion y el segundo no.
 *
 * 'unidad': sufijo que se muestra junto al valor.
 */

return [
    'indicators' => [
        // --- Alimentos que botan los hogares (guardan fraccion) ---
        'T_Verduras_BQ' => ['table' => 'T_Verduras_BQ', 'source' => $sourceAlimentos, 'escala' => 100, 'unidad' => '%'],
        'T_Legumbres_BQ' => ['table' => 'T_Legumbres_BQ', 'source' => $sourceAlimentos, 'escala' => 100, 'unidad' => '%'],
        'T_Cereales_BQ' => ['table' => 'T_Cereales_BQ', 'source' => $sourceAlimentos, 'escala' => 100, 'unidad' => '%'],
        'T_Frutas_BQ' => ['table' => 'T_Frutas_BQ', 'source' => $sourceAlimentos, 'escala' => 100, 'unidad' => '%'],
        'T_Productos_lacteos_BQ' => ['table' => 'T_Productos_lacteos_BQ', 'source' => $sourceAlimentos, 'escala' => 100, 'unidad' => '%'],
        'T_Productos_carnicos_BQ' => ['table' => 'T_Productos_carnicos_BQ', 'source' => $sourceAlimentos, 'escala' => 100, 'unidad' => '%'],
        'T_Raices_tuberculos_y_platanos_BQ' => ['table' => 'T_Raices_tuberculos_y_platanos_BQ', 'source' => $sourceAlimentos, 'escala' => 100, 'unidad' => '%'],
        'T_Huevos_BQ' => ['table' => 'T_Huevos_BQ', 'source' => $sourceAlimentos, 'escala' => 100, 'unidad' => '%'],

        // --- Razones por las que se botan alimentos (guardan fraccion) ---
        'RT_Compra_mas_BQ' => ['table' => 'RT_Compra_mas_BQ', 'escala' => 100, 'unidad' => '%'],
        'RT_Prepara_mas_BQ' => ['table' => 'RT_Prepara_mas_BQ', 'escala' => 100, 'unidad' => '%'],
        'RT_Humedad_temperatura_BQ' => ['table' => 'RT_Humedad_temperatura_BQ', 'escala' => 100, 'unidad' => '%'],
        'RT_Mala_conservacion_BQ' => ['table' => 'RT_Mala_conservacion_BQ', 'escala' => 100, 'unidad' => '%'],
        'RT_Vencimiento_BQ' => ['table' => 'RT_Vencimiento_BQ', 'escala' => 100, 'unidad' => '%'],
        'RT_Falta_refrigeracion_BQ' => ['table' => 'RT_Falta_refrigeracion_BQ', 'escala' => 100, 'unidad' => '%'],
        'RT_Exceso_tiempo_BQ' => ['table' => 'RT_Exceso_tiempo_BQ', 'escala' => 100, 'unidad' => '%'],

        // --- Uso del suelo (valor ya en su unidad final) ---
        'Frontera_Agricola_BQ' => ['table' => 'Frontera_Agricola_BQ', 'source' => $fuenteFrontera, 'notas' => [$notaLitigio], 'escala' => 1, 'unidad' => 'ha'],
        'Bosque_Natural_BQ' => ['table' => 'Bosque_Natural_BQ', 'source' => $fuenteBosques, 'escala' => 1, 'unidad' => '%'],
        'Cambio_Bosque_BQ' => ['table' => 'Cambio_Bosque_BQ', 'source' => $fuenteBosques, 'notas' => [$notaAniosDobles], 'escala' => 1, 'unidad' => 'ha/año'],
        'Tasa_Deforestacion_BQ' => ['table' => 'Tasa_Deforestacion_BQ', 'source' => $fuenteBosques, 'notas' => [$notaAniosDobles], 'escala' => 1, 'unidad' => '%'],
        'Erosion_Suelos_BQ' => ['table' => 'Erosion_Suelos_BQ', 'source' => $fuenteErosion, 'escala' => 1, 'unidad' => '%'],
        'Desertificacion_BQ' => ['table' => 'Desertificacion_BQ', 'source' => $fuenteDesertificacion, 'escala' => 1, 'unidad' => '%'],

        // --- Produccion ---
        'Agro_Familiar_BQ' => ['table' => 'Agro_Familiar_BQ', 'source' => $fuenteAgroFamiliar, 'escala' => 1, 'unidad' => 'ha'],

        // --- Socioeconomicos ---
        'Empleo_Agro_BQ' => ['table' => 'Empleo_Agro_BQ', 'source' => $fuenteEmpleo, 'escala' => 1, 'unidad' => '%'],
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
