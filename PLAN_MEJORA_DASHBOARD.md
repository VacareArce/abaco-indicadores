# Plan de Mejora: Escalar el modulo de las 15 graficas de desperdicio al resto del tablero

Este documento proyecta como convertir el modulo `_BQ` actual (desarrollado para las 15 graficas de desperdicio) en el estandar de visualizacion para el resto de indicadores.

El foco de esta version es:

- crear una libreria de plantillas de graficas reutilizable,
- soportar linea, histograma y histograma invertido,
- definir una estrategia tecnica para indicadores con datos a nivel municipio,
- establecer estado actual vs estado objetivo.

---

## 1) Estado actual (diagnostico tecnico)

## Lo que ya existe y funciona

- Flujo `_BQ` con APIs reutilizables:
  - `api/charts_bq.php`
  - `api/charts_bq_raw.php`
  - `api/charts_bq_export.php`
  - `api/charts_bq_map.php`
- Mapeo central de indicadores en `api/bq_indicator_map.php`.
- Frontend consolidado en `js/charts_bq.js` con vistas:
  - grafica,
  - tabla,
  - mapa (serie y comparacion de años).
- Soporte de mapa departamental con Leaflet + GeoJSON (`map/ColDepSNVlite.geojson`).

## Limite actual

- La vista de grafica esta implementada practicamente con una sola plantilla visual (linea temporal nacional/departamental).
- No existe una libreria formal de tipos de grafica por plantilla.
- No hay contrato explicito para datos municipales en el frontend `_BQ`.
- No hay pipeline estandar para actualizar y agregar capas municipales (geometria + agregacion + filtros).

---

## 2) Objetivo de arquitectura

Estandarizar todos los indicadores en un modulo nativo `_BQ` con esta estructura:

1. **Libreria de plantillas de graficas** (motor reusable).
2. **Contrato de datos por tipo de plantilla** (linea, histograma, histograma invertido).
3. **Capa de transformacion territorial** (departamento y municipio).
4. **Playbook de migracion por lotes** para salir de `iframe` gradualmente.

---

## 3) Libreria de plantillas de graficas (propuesta)

## 3.1 Estructura sugerida

Crear en `js/charts/`:

- `js/charts/chart_registry.js`
- `js/charts/chart_factory.js`
- `js/charts/templates/line_trend.js`
- `js/charts/templates/histogram.js`
- `js/charts/templates/histogram_inverted.js`
- `js/charts/transforms/normalize_series.js`
- `js/charts/transforms/normalize_histogram.js`

Integrar en `js/charts_bq.js` via `renderChartByTemplate(templateKey, payload, context)`.

## 3.2 Contrato de plantilla

Cada plantilla debe exponer:

- `id`: nombre unico de plantilla.
- `validate(payload)`: valida estructura minima.
- `buildDataset(payload, context)`: convierte payload a dataset de Chart.js.
- `buildOptions(payload, context)`: opciones de ejes, tooltip, etiquetas.
- `postRender(chart, payload, context)`: ajustes finales (opcional).

## 3.3 Registro por indicador

Extender `api/bq_indicator_map.php` para incluir metadato `chartTemplate`:

```php
'MI_INDICADOR_BQ' => [
    'table' => 'MI_INDICADOR_BQ',
    'source' => 'Fuente ...',
    'chartTemplate' => 'histogram_inverted'
],
```

Si no se define, fallback a `line_trend`.

---

## 4) Plantillas a implementar

## 4.1 `line_trend` (estado actual mejorado)

Uso:

- series temporales por año (nacional y departamental).

Payload minimo:

- `series.years[]`
- `series.nacional[]`
- `series.departamental[]`

Mejoras:

- normalizar escalas por rango de indicador,
- soporte de uno o dos datasets sin romper layout,
- opcional: banda de variacion o promedio movil.

## 4.2 `histogram`

Uso:

- distribucion o comparacion por categorias (barras positivas convencionales).

Payload minimo sugerido:

- `bars.labels[]`
- `bars.values[]`
- `bars.unit` (ej. `%`)

Consideraciones:

- ordenar barras por valor o orden natural,
- datalabels en extremo superior,
- truncado + tooltip para etiquetas largas.

## 4.3 `histogram_inverted`

Uso:

- comparaciones donde visualmente conviene invertir orientacion (barras horizontales, ranking descendente, lectura de arriba hacia abajo).

Payload minimo sugerido:

- `bars.labels[]`
- `bars.values[]`
- `bars.unit`
- `bars.order` (`desc` recomendado)

Implementacion tecnica:

- en Chart.js usar `indexAxis: 'y'`,
- eje de valores en X,
- labels en Y,
- opcion de color por umbral o ranking.

---

## 5) Datos municipales: estrategia tecnica

## 5.1 Problema a resolver

Hay indicadores con granularidad municipal. Si no se modelan bien, se pierde consistencia entre:

- filtro seleccionado (departamento/municipio),
- KPI mostrados,
- grafica,
- mapa,
- tabla cruda.

## 5.2 Contrato territorial unificado

Definir claves canonicas en backend:

- `CodigoD` (departamento, formato `D##`),
- `CodigoM` (municipio, formato `M#####`),
- `A__o`.

Reglas:

1. Si existe `CodigoM`, el payload debe informar `territoryLevel: 'municipio'`.
2. Si no existe `CodigoM`, usar `territoryLevel: 'departamento'`.
3. En frontend, la consulta siempre enviara `codigoD`; `codigoM` sera opcional.

## 5.3 Endpoints y filtros

Extender endpoints BQ para aceptar:

- `indicator` (requerido),
- `codigoD` (requerido),
- `codigoM` (opcional),
- `year` (opcional).

Logica sugerida:

- si `codigoM` viene y el indicador soporta municipio, filtrar por `CodigoM` para series/KPI,
- mantener referencia departamental para comparacion cuando aplique,
- en tabla cruda incluir ambos codigos para trazabilidad.

## 5.4 Mapa municipal (proyeccion)

Nivel base:

- mantener mapa departamental para todos,
- si indicador es municipal, agregar tooltip con valor municipal seleccionado y contexto departamental.

Nivel evolucionado:

- incorporar GeoJSON simplificado municipal por departamento (carga bajo demanda),
- render condicional cuando el usuario seleccione municipio.

## 5.5 Actualizacion de informacion municipal

Proyectar un proceso de actualizacion con 3 capas:

1. **Ingestion**: tablas BQ versionadas por corte (`dataset.tabla_YYYYMM`).
2. **Vista estable**: vista SQL canonica consumida por API (`vw_indicador_municipal_actual`).
3. **Validacion automatica**:
   - cobertura de municipios esperados,
   - duplicados por `A__o + CodigoM`,
   - rangos de valor validos.

---

## 6) Implementacion tecnica sugerida (paso a paso)

## Paso 1: Introducir metadatos de plantilla y nivel territorial

Actualizar `api/bq_indicator_map.php` con:

- `chartTemplate`
- `territoryLevel` (`departamento` | `municipio`)
- `supportsMap` (bool)

## Paso 2: Normalizar payload de APIs

Crear respuesta estandar para `charts_bq.php`:

```json
{
  "ok": true,
  "indicator": "...",
  "template": "histogram_inverted",
  "territoryLevel": "municipio",
  "kpis": {},
  "series": {},
  "bars": {},
  "meta": {}
}
```

## Paso 3: Construir `chart_factory`

`chart_factory` decide la plantilla segun `payload.template` y delega render.

Fallback:

- plantilla desconocida -> `line_trend` + warning en consola.

## Paso 4: Implementar histogramas

- `histogram.js` para barras verticales.
- `histogram_inverted.js` para barras horizontales.
- misma paleta y sistema de labels del diseño actual.

## Paso 5: Incorporar filtros municipales

- actualizar llamadas frontend para enviar `codigoM` cuando exista seleccion,
- actualizar SQL de endpoints para priorizar `CodigoM` en indicadores municipales,
- validar consistencia de region en pie de grafica.

## Paso 6: QA por plantilla

Definir pruebas minimas por tipo:

- **linea**: serie + kpi + ejes,
- **histograma**: barras + orden + labels,
- **histograma invertido**: orientacion + orden descendente + legibilidad.

---

## 7) Estado objetivo (cuando termine la migracion)

- Todos los indicadores nuevos entran por ruta `_BQ`.
- Las graficas se renderizan por plantilla, no por codigo hardcodeado.
- Existe soporte tecnico para niveles departamental y municipal.
- Se reduce dependencia de iframes a casos excepcionales.
- Se mantiene una sola experiencia de usuario en todo el tablero.

---

## 8) Riesgos y mitigaciones especificas

- **Heterogeneidad de tablas BQ**
  - Mitigar con vistas SQL de normalizacion por indicador.

- **Complejidad creciente en `charts_bq.js`**
  - Mitigar migrando a libreria por modulos (registry/factory/templates).

- **Costo de render municipal (muchas geometrías)**
  - Mitigar con simplificacion de GeoJSON y carga bajo demanda.

- **Regresiones visuales entre plantillas**
  - Mitigar con snapshots visuales y checklist por plantilla.

---

## 9) Backlog de mejoras y pendientes (sin horizonte temporal)

## 9.1 Pendientes de arquitectura

- Crear `chart_registry` y `chart_factory` para desacoplar `js/charts_bq.js`.
- Definir contrato estable de payload para todas las plantillas (`template`, `territoryLevel`, `bars`, `series`, `meta`).
- Separar transformaciones de datos en modulos (`normalize_series`, `normalize_histogram`).

## 9.2 Pendientes de visualizacion

- Implementar plantilla `histogram` con orden configurable y datalabels estables.
- Implementar plantilla `histogram_inverted` para ranking horizontal.
- Estandarizar leyendas, formatos de porcentaje y fallback visual entre plantillas.

## 9.3 Pendientes de territorialidad municipal

- Incorporar `codigoM` en flujo frontend/backend de forma opcional y controlada por indicador.
- Definir fallback oficial cuando un indicador no tenga cobertura municipal completa.
- Diseñar estrategia de carga de geometrias municipales por demanda para evitar degradacion de rendimiento.

## 9.4 Pendientes de calidad y operacion

- Crear suite minima de pruebas funcionales por plantilla (linea/histograma/histograma invertido).
- Crear bitacora de migracion por indicador con estado y hallazgos.
- Documentar procedimiento de rollback por indicador en caso de regresion.

## 9.5 Pendientes de migracion funcional

- Clasificar indicadores legacy en: migracion directa, media y compleja.
- Definir plantilla objetivo por indicador antes de migrarlo.
- Retirar dependencias `iframe` solo cuando exista paridad funcional validada.

---

## 10) Entregables documentales

- `MANUAL_INDICADORES.md` actualizado con plantillas y flujo municipal.
- `docs/PLANTILLAS_GRAFICAS_BQ.md` (especificacion tecnica de cada plantilla).
- `docs/CONTRATO_DATOS_BQ.md` (schema, filtros y validaciones).
- `docs/MIGRACION_BQ_BITACORA.md` (seguimiento por indicador).

Este plan permite que el modulo de desperdicio no sea un caso aislado, sino la base tecnica para escalar todo el tablero de forma controlada y mantenible.
