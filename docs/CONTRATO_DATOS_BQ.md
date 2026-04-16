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
  "kpis": {},
  "series": {},
  "bars": {},
  "meta": {
    "source": "..."
  }
}
```

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
