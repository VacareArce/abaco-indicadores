# Manual Operativo de Indicadores (Looker + BQ)

Este manual describe como agregar y mantener indicadores en el dashboard de ABACO, incluyendo:

- indicadores tradicionales renderizados por `iframe` (Looker Studio),
- indicadores `_BQ` con visualizacion nativa (grafica, tabla y mapas Leaflet).

---

## 1) Archivos clave del flujo

- `js/menu_lista_tableros.js`: diccionario principal de indicadores y fichas.
- `index.html`: menu superior, layout principal y recursos JS/CSS.
- `api/bq_indicator_map.php`: mapeo de indicadores `_BQ` -> tabla BigQuery y fuente.
- `api/charts_bq.php`: serie historica y KPI para la grafica `_BQ`.
- `api/charts_bq_raw.php`: datos crudos para tabla `_BQ`.
- `api/charts_bq_export.php`: exportacion CSV de datos crudos.
- `api/charts_bq_map.php`: datos departamentales por año para mapas `_BQ`.
- `js/charts_bq.js`: logica frontend de vista `_BQ` (grafica/tabla/mapa).
- `map/ColDepSNVlite.geojson`: geometria de departamentos para Leaflet.

---

## 2) Tipos de indicador

### 2.1 Indicador Looker (sin sufijo `_BQ`)

Usa el flujo historico por `iframe` y parametros en URL.

Requiere:

1. Registrar el indicador en `js/menu_lista_tableros.js`.
2. Agregar la opcion en el menu de `index.html`.
3. Si aplica, ajustar el filtrado geográfico de Looker (parametros `dsXXX`).

### 2.2 Indicador BigQuery nativo (con sufijo `_BQ`)

Usa API PHP + frontend JS propio del proyecto.

Requiere:

1. Registrar el indicador en `js/menu_lista_tableros.js`.
2. Registrar tabla y metadatos en `api/bq_indicator_map.php`.
3. Agregar opcion en menu de `index.html`.
4. Verificar que la tabla de BigQuery contenga columnas esperadas:
   - `A__o`
   - `CodigoD`
   - `Departamento`
   - `Indicador_filtro`
   - `Dato_Nacional`
   - `Dato_Departamento`

---

## 3) Pasos para agregar un indicador nuevo

## Paso A: Registrar en diccionario

Editar `js/menu_lista_tableros.js`:

```javascript
"MI_INDICADOR": {
  "tablero": "p_xxxxxxxx",
  "ficha": "https://drive.google.com/..."
}
```

Si sera nativo BQ, usar convención `_BQ`:

```javascript
"MI_INDICADOR_BQ": {
  "tablero": "p_xxxxxxxx",
  "ficha": "https://drive.google.com/..."
}
```

## Paso B: Registrar en mapa de API (solo `_BQ`)

Editar `api/bq_indicator_map.php`:

```php
'MI_INDICADOR_BQ' => [
    'table' => 'MI_INDICADOR_BQ',
    'source' => 'Fuente oficial...'
],
```

## Paso C: Boton en menu

Editar `index.html` en el bloque del menu:

```html
<li><a class="submenu-item" onclick="cambiarMapa('MI_INDICADOR_BQ')">Mi Indicador</a></li>
```

---

## 4) Comportamiento de vistas `_BQ`

Para indicadores con sufijo `_BQ`, el usuario tiene:

- `Grafica`: serie temporal nacional/departamental.
- `Tabla`: datos crudos + descarga CSV.
- `Mapa`: Leaflet por departamentos.

En mapas:

- orden de años: de mas reciente a mas antiguo,
- paginacion de 4 en 4 en la vista de serie,
- modo comparacion: ultimo año vs año seleccionado,
- resaltado suave del departamento seleccionado,
- boton `Pantalla completa` que abre una ventana ampliada (compatible con entorno `iframe`).

---

## 5) Notas importantes para entorno iframe

- La accion de `Pantalla completa` en mapas abre una ventana nueva grande para evitar restricciones de fullscreen dentro de `iframe`.
- Si el navegador bloquea popups, se debe permitir ventanas emergentes para el dominio.
- En modo comparacion, la ventana ampliada abre ambos mapas.

---

## 6) Validacion funcional minima

Despues de agregar o modificar indicadores:

1. Abrir un indicador no `_BQ` y confirmar que el `iframe` carga.
2. Abrir un indicador `_BQ` y validar:
   - grafica visible,
   - tabla con datos,
   - descarga CSV,
   - mapas por año,
   - comparacion de años,
   - apertura en ventana ampliada desde `Pantalla completa`.
3. Cambiar departamento y confirmar que se actualizan KPI, serie y mapas.

---

## 7) Errores comunes

- `Indicador invalido`: falta registro en `api/bq_indicator_map.php`.
- Tabla vacia en `_BQ`: nombre de tabla incorrecto o sin datos para el territorio.
- Mapa sin geometria: falta `map/ColDepSNVlite.geojson` o ruta incorrecta.
- Popup bloqueado: el navegador no permite nuevas ventanas.
- Inconsistencia de clave: `CodigoD` no coincide con formato esperado (`D##`) en API.

---

## 8) Checklist rapido antes de subir cambios

- [ ] Indicador agregado en `js/menu_lista_tableros.js`.
- [ ] (Si aplica) indicador agregado en `api/bq_indicator_map.php`.
- [ ] Opcion del menu agregada en `index.html`.
- [ ] Probada vista `grafica`, `tabla` y `mapa` (solo `_BQ`).
- [ ] Probada apertura de mapa ampliado con `Pantalla completa`.
- [ ] Revisada ortografia de textos visibles (años, Año mas reciente, etc.).
