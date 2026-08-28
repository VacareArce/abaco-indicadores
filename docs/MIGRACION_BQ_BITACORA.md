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

---

### [2026-08-27] Rendimiento: fusion de consultas y cache

No es una migracion de indicador sino una intervencion transversal sobre los
endpoints `charts_bq*.php`. Se registra aqui porque cambia como se consulta
BigQuery para todos los indicadores.

#### Problema

Cada carga de tablero disparaba **7 jobs de BigQuery**: 3 en `charts_bq.php`,
3 en `charts_bq_map.php` y 1 en `charts_bq_raw.php`, secuenciales dentro de cada
PHP. Las tablas son diminutas, asi que el tiempo no lo mandaba el volumen de
datos sino la latencia por job (~0.5-2 s) mas una re-autenticacion OAuth completa
en cada request. No habia cache en ningun nivel, y cambiar de municipio dentro
del mismo departamento repetia las 3 peticiones para obtener lo mismo.

#### Cambios aplicados

- `api/charts_bq.php`: las 3 consultas se fusionan en 1. El KPI no necesita
  consulta propia (es la fila del ultimo anio de la serie, mismo AVG sobre el
  mismo filtro) y el titulo entra como `ANY_VALUE` en el mismo `GROUP BY`.
- `api/charts_bq_map.php`: las 3 consultas se fusionan en 1. Los anios son las
  claves distintas del propio resultado.
- `api/bq_cache.php` (nuevo): cache en archivos, escritura atomica, TTL de 24 h,
  recoleccion de basura probabilistica y emision de JSON con `ETag`/`304`.
  Si el directorio no es escribible, no cachea y todo sigue funcionando.
- `api/bq_client.php` (nuevo): construccion centralizada del `BigQueryClient`
  con `authCache` en disco, para no volver a firmar el JWT en cada request.
- `api/bq_cache_purge.php` (nuevo): purga manual protegida por `purgeToken`,
  con limite de 5 minutos por alcance. Sin token configurado responde 404.
- `js/charts_bq.js`: cache de sesion por `indicator + codigoD` en los 3 fetch.
- `api/config.php`: nuevas claves `cachePath` y `purgeToken`.
- `cache/` (nuevo, fuera de git): con `.htaccess` que niega acceso web.

#### Frescura del dato

Se respeta la regla de anios de `CONTRATO_DATOS_BQ.md`. La entrada de cache
guarda el `lastModifiedTime` de la tabla y lo revalida a los 15 minutos con una
llamada de **metadata** (no un job, no factura bytes). Un corte nuevo en BigQuery
aparece solo en <= 15 minutos, sin tocar codigo. El TTL de 24 h es la red de
seguridad por si la metadata no respondiera.

#### QA funcional

- [x] Carga de grafica
- [x] Carga de tabla cruda
- [x] Exportacion CSV (sin cambios: sigue siendo `no-store`)
- [x] Mapa (4 SVG, 132 departamentos, paginacion correcta)
- [x] Comparacion de anios
- [x] Cambio de departamento sin error
- [x] Cambio de municipio sin error, y ahora **sin peticiones nuevas**
- [x] Boton Pantalla completa

Verificacion de no-regresion: 15 payloads (5 combinaciones de indicador y
departamento x 3 endpoints) comparados byte a byte contra el baseline capturado
antes de tocar nada. **0 diferencias.** Incluye un `T_*` con `source`, un `RT_*`
sin `source`, un departamento con datos escasos (D88) y los indicadores de uso
del suelo con `escala` 1 y unidad `ha`.

Tiempos medidos en local (`charts_bq.php`, `T_Frutas_BQ`, `D44`):

| Escenario | Antes | Despues |
|---|---|---|
| Cache frio | 1.62 s | 1.09 s |
| Cache caliente | 1.62 s | 0.04 s |

#### Resultado

- estado: `completado`
- observaciones: en produccion hay que anadir `purgeToken` a `api/config.local.php`
  del servidor y comprobar que `cache/` queda escribible para el usuario de PHP.
- deuda tecnica: `A__o` sigue siendo STRING y obliga a `CAST(... AS INT64)` en
  cada `WHERE`; `api/bigquery_test.php` compara `A__o = @year` sin castear.
