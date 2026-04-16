# Bitacora de Migracion a Modulo BQ

Registro operativo para migrar indicadores al modelo nativo `_BQ`.

## Como usar esta bitacora

Por cada indicador migrado, agrega una entrada con:

- alcance funcional,
- cambios de backend/frontend,
- validaciones ejecutadas,
- riesgos o deuda tecnica pendiente.

---

## Plantilla de entrada

### Indicador

- `id`: 
- `nombre`: 
- `origen`: `iframe` | `_BQ`
- `destino`: `_BQ`
- `plantilla`: `line_trend` | `histogram` | `histogram_inverted`
- `territoryLevel`: `departamento` | `municipio`

### Cambios aplicados

- `menu_lista_tableros.js`: 
- `bq_indicator_map.php`: 
- `api/charts_bq*.php`: 
- `js/charts_bq.js`: 
- `index.html` / `css`: 

### QA funcional

- [ ] Carga de grafica
- [ ] Carga de tabla cruda
- [ ] Exportacion CSV
- [ ] Mapa (si aplica)
- [ ] Comparacion de años (si aplica)
- [ ] Cambio de departamento sin error
- [ ] Cambio de municipio (si aplica)
- [ ] Boton Pantalla completa (ventana ampliada)

### Resultado

- estado: `completado` | `parcial` | `bloqueado`
- observaciones:
- deuda tecnica:

---

## Registro

### [Pendiente] Ejemplo de migracion

- `id`: MI_INDICADOR_BQ
- `nombre`: Mi indicador
- `origen`: iframe
- `destino`: _BQ
- `plantilla`: histogram
- `territoryLevel`: departamento

Cambios aplicados:

- menu: agregado item en submenu correspondiente.
- backend: agregado mapping en `bq_indicator_map.php`.
- api: payload compatible con `histogram`.
- frontend: render por `chart_factory`.

Resultado:

- estado: parcial
- observaciones: pendiente validar comportamiento en mobile.
- deuda tecnica: revisar truncado de labels largos.
