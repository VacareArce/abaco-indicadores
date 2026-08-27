# Contrato de Datos BQ

Este documento define el contrato minimo para endpoints y tablas usados por el modulo `_BQ`.

## Campos base recomendados

- `A__o` (año)
- `CodigoD` (departamento, formato `D##`)
- `Departamento`
- `Indicador_filtro`
- `Dato_Nacional`
- `Dato_Departamento`

Campos opcionales (segun indicador):

- `CodigoM` (municipio, formato `M#####`)
- `Municipio`
- `Tipo_dato`
- `Tipo_medida`

## Parametros de API

Todos los endpoints `_BQ` deben soportar:

- `indicator` (requerido)
- `codigoD` (requerido)

Opcionales:

- `codigoM` (si indicador municipal)
- `year`

## Estructura de respuesta estandar

```json
{
  "ok": true,
  "indicator": "T_Verduras_BQ",
  "template": "line_trend",
  "territoryLevel": "departamento",
  "kpis": {
    "nacional": 2.93,
    "departamento": 3.27,
    "municipio": null
  },
  "kpiYear": 2025,
  "series": {
    "years": [2021, 2022, 2023, 2024, 2025],
    "nacional": [],
    "departamental": []
  },
  "bars": {},
  "meta": {
    "source": "..."
  }
}
```

Las claves de `kpis` **no llevan el anio en el nombre**. El anio al que corresponden
se informa aparte, en `kpiYear`. Nombrarlas `nacional_2024` obliga a tocar backend y
frontend cada vez que entra un corte nuevo, y deja la clave mintiendo si se olvida.

## Regla de anios: nunca un rango literal

Ningun endpoint `_BQ` debe filtrar por un rango de anios escrito a mano
(`A__o BETWEEN 2021 AND 2024`). El rango sale siempre del dato:

- Para la serie: `WHERE A__o IS NOT NULL`, y el rango se deduce de lo que vuelva.
- Para el KPI del ultimo corte: usar `MAX(A__o)` **del propio dato**, nunca
  `CURRENT_DATE()`. La ECV llega con rezago; el anio calendario actual puede no
  existir todavia en la tabla y el KPI saldria vacio.
- Para el texto de fuente: anexar el rango calculado (ver `bqSourceWithRange()`
  en `api/charts_bq.php` y `api/charts_bq_map.php`), no incrustarlo en la cadena.

Asi, cuando se cargue un anio nuevo a BigQuery aparece solo, sin tocar codigo.

## Reglas de territorialidad

- Si un indicador soporta municipio, debe informarse `territoryLevel: "municipio"`.
- Si no soporta municipio, debe informarse `territoryLevel: "departamento"`.
- Si llega `codigoM` y no aplica para el indicador, ignorar y usar `codigoD`.

## Validaciones recomendadas

- `codigoD` valida regex `^D\d{2}$`.
- `codigoM` valida regex `^M\d{5}$`.
- `year` valida regex `^\d{4}$`.
- Evitar nulos silenciosos en campos criticos de visualizacion.

## Reglas para datos municipales

- Incluir ambos codigos (`CodigoD`, `CodigoM`) en tabla cruda cuando existan.
- Definir vista SQL canonica por indicador municipal (ej. `vw_indicador_municipal_actual`).
- Garantizar unicidad por `A__o + CodigoM` en capa de consumo.

## Versionado sugerido

- Mantener tablas de ingesta por corte (`tabla_YYYYMM`).
- Exponer siempre vistas estables para la API.
- Registrar cambios de schema en bitacora tecnica.
