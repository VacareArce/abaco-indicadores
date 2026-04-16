# Plantillas de Graficas BQ

Este documento define las plantillas de graficas para el modulo `_BQ`.

## Objetivo

- Estandarizar el render de graficas por tipo.
- Evitar logica hardcodeada por indicador.
- Facilitar migracion de indicadores legacy (`iframe`) a nativo `_BQ`.

## Plantillas objetivo

## 1) `line_trend`

Uso:

- Series historicas por año.
- Comparacion nacional vs departamental.

Payload minimo esperado:

```json
{
  "template": "line_trend",
  "series": {
    "years": [2021, 2022, 2023, 2024],
    "nacional": [12.1, 12.8, 11.5, 10.9],
    "departamental": [13.4, 13.0, 12.2, 11.7]
  }
}
```

## 2) `histogram`

Uso:

- Comparacion por categorias en barras verticales.

Payload minimo esperado:

```json
{
  "template": "histogram",
  "bars": {
    "labels": ["Categoria A", "Categoria B", "Categoria C"],
    "values": [35.2, 22.8, 41.1],
    "unit": "%"
  }
}
```

## 3) `histogram_inverted`

Uso:

- Ranking horizontal (lectura de arriba hacia abajo).

Payload minimo esperado:

```json
{
  "template": "histogram_inverted",
  "bars": {
    "labels": ["Categoria A", "Categoria B", "Categoria C"],
    "values": [35.2, 22.8, 41.1],
    "unit": "%",
    "order": "desc"
  }
}
```

## Contrato tecnico por plantilla

Cada plantilla debe exponer:

- `id`
- `validate(payload)`
- `buildDataset(payload, context)`
- `buildOptions(payload, context)`
- `postRender(chart, payload, context)` (opcional)

## Integracion sugerida

- `chart_registry`: mapea `template` -> modulo.
- `chart_factory`: selecciona plantilla y aplica fallback a `line_trend`.
- `charts_bq.js`: solo orquesta estado y llama la fabrica.

## Reglas de calidad visual

- Formato numerico consistente (`xx,xx %`).
- Mismos colores base por tipo de serie.
- Tooltip y datalabels legibles en desktop y mobile.
- Mensaje estandar cuando no hay datos.
