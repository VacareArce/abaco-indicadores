# Manual para Agregar Nuevos Indicadores al Dashboard

Este manual documenta el procedimiento completo para agregar un nuevo indicador al Dashboard interactivo de ABACO. 

El sistema vincula tableros de Google Looker Studio (construidos sobre BigQuery) a nuestra interfaz. Para que el proceso sea exitoso, debes configurar el diccionario de datos, actualizar la lógica de filtrado según la granularidad de tu indicador, y finalmente crear el botón en el menú.

---

## Preparación: Datos Requeridos

Antes de tocar el código fuente, recopile la siguiente información sobre el nuevo indicador:

1. **ID del Sistema:** Palabra clave sin espacios para identificar el indicador (ej. `pesoIdeal`, `pobrezaExt`).
2. **ID de Looker Studio:** El código al final de la URL pública de su gráfica, después de `/page/` (ej. `p_jlgbdeha4c`).
3. **Enlace de Google Drive:** URL pública de la ficha técnica en PDF.
4. **Nivel de Granularidad (Territorialidad):** Determine si los datos en BigQuery de este indicador están desglosados detalladamente a nivel de **Municipio** o agregados a nivel de **Departamento**.
5. **ID de la Fuente de Datos (`dsXXX`):** Si esto requiere una conexión nueva a BigQuery en Looker Studio, este le asignará un identificador (ej. `ds025`). Deberá conocer cuál es.

---

## Paso 1: Registrar el Indicador en el Diccionario

El archivo `js/menu_lista_tableros.js` asocia su nuevo "ID del Sistema" con Looker Studio y Google Drive.

1. Abra el archivo `js/menu_lista_tableros.js`.
2. Dentro del bloque de la variable `var tableros = {`, agregue la siguiente estructura:

```javascript
"TU_ID_DEL_SISTEMA": { 
    "tablero": "EL_ID_DE_LOOKER_STUDIO", 
    "ficha": "EL_ENLACE_DE_GOOGLE_DRIVE"
}
```

**Uso de Comas:** Como regla de JavaScript, todos los elementos del bloque deben separarse por coma `,`. Si este es su último indicador antes del cierre `};`, no escriba coma al final del bloque, pero asegúrese de colocar una al bloque que quedó arriba.

---

## Paso 2: Configurar el Filtrado Geográfico (Granularidad)

El sistema inyecta directamente el código geográfico a todas las fuentes de datos (BigQuery) para filtrar la vista actual. Debemos enseñarle al código cómo aplicar el filtro para nuestro nuevo indicador.

1. Abra el archivo `index.html`.
2. Localice la función `actualizarTablero(codeMunicipio)`.
3. Verá una larga lista de variables de fuentes de datos (`ds001`, `ds002`, etc.) que están siendo concatenadas en la variable `url2`.
4. Añada la nueva fuente de Looker Studio (`dsXXX`) escogiendo estrictamente la variable adecuada en base a su nivel de agregación:

* **Para datos en BigQuery a nivel Municipal:**
Debe cruzar obligatoriamente usando la variable `codeMunicipio` para que el filtro calce. Añada esta línea:
```javascript
+'"ds025.pcodigom":"'+codeMunicipio+'"'+','
```

* **Para datos en BigQuery a nivel Departamental:**
Si los datos carecen de desglose municipal, inyectar el código de un municipio fallaría devolviendo listas vacías. Debe usar obligatoriamente la variable `codeDep`:
```javascript
+'"ds025.pcodigom":"'+codeDep+'"'+','
```

*(Cambie `ds025` por el código secuencial asignado que corresponda).*

---

## Paso 3: Agregar el Botón al Menú

Por último, crearemos la opción en la barrar superior para que el usuario pueda visualizar el gráfico en pantalla.

1. En el mismo archivo `index.html`, busque el contenedor superior llamado `<div id="horizontal-menu">`.
2. Navegue en las categorías existentes (`<li class="dropdown">`) y seleccione en qué lista desplegable encaja su indicador.
3. Inserte el botón, verificando usar su ID exacto:

```html
<li><a class="submenu-item" onclick="cambiarMapa('TU_ID_DEL_SISTEMA')">Título de mi nuevo Indicador</a></li>
```
*(Si desea crear una nueva categoría separadora para el botón, use: `<li><a class="submenu-title" href="#">Nueva Sección</a></li>` justo arriba).*

Guarde todos los cambios (`Ctrl + S`).

---

## Confirmación y Errores Comunes

Para revisar que la instalación fue exitosa, actualice `index.html` (`F5`) en el navegador.

* **Fallo general (pantalla blanca):** Error de sintaxis en el Paso 1 (`js/menu_lista_tableros.js`). Revise si faltó o sobró una coma.
* **El botón no hace nada:** Discrepancia de texto entre el `onclick` que escribió en el Paso 3 y el diccionario del Paso 1. Las mayúsculas importan.
* **La gráfica se muestra a nivel nacional en vez de filtrarse:** Con alta seguridad, obvió el Paso 2 o se equivocó de variable (`codeMunicipio` vs `codeDep`). Looker Studio no está recibiendo el código geográfico que esperaba.
