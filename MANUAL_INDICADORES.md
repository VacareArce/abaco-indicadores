# Manual para Agregar Nuevos Indicadores al Dashboard

Este manual explica el proceso para agregar un nuevo indicador al Dashboard interactivo de ABACO. 

El sistema utiliza tableros creados previamente en Google Looker Studio. Para agregar un indicador, es necesario configurar la ubicación de la gráfica y crear el enlace en el menú de navegación.

---

## Preparación: Datos Requeridos

Antes de modificar el código, asegúrese de tener la siguiente información:

### 1. ID del Sistema
Es una palabra clave corta y sin espacios que identifica al indicador en el código. 
* Ejemplos correctos: `pesoIdeal`, `vacunacion2024`, `pobrezaExt`.
* Ejemplos incorrectos: `Peso Ideal`, `vacunacion-2024` (evite espacios y caracteres especiales).

### 2. ID de la Página en Looker Studio
En la barra de direcciones de su navegador al visualizar la gráfica en Google Looker Studio, ubique la URL:
`https://lookerstudio.google.com/reporting/f2ee...aac1-91dd.../page/p_jlgbdeha4c`

Copie únicamente el código posterior a la palabra `/page/`.
* **Dato a copiar:** `p_jlgbdeha4c`

### 3. Enlace de Google Drive (Ficha Técnica PDF)
Debe subir la ficha técnica en PDF a Google Drive.
* Verifique que los permisos del archivo estén en **"Cualquier usuario con el enlace puede leer"**.
* **Dato a copiar:** Copie el enlace para compartir (`https://drive.google.com/file/d/.../view?usp=drive_link`).

---

## Paso 1: Registrar el Indicador en el Diccionario de Datos

El archivo `js/menu_lista_tableros.js` asocia cada "ID del Sistema" con su respectivo enlace.

**Instrucciones:**
1. Abra el archivo `js/menu_lista_tableros.js` en su editor de texto o código.
2. Ubique el bloque de la variable `var tableros = {`.
3. Agregue un bloque con la siguiente estructura, preferiblemente junto a indicadores de temática similar:

```javascript
"TU_ID_DEL_SISTEMA": { 
    "tablero": "EL_ID_DE_LOOKER_STUDIO", 
    "ficha": "EL_ENLACE_DE_GOOGLE_DRIVE"
}
```

**Uso de Comas en JavaScript:**
Cada elemento dentro del objeto `tableros` debe estar separado por una coma `,`.
* Si el nuevo indicador no es el último elemento, debe terminar con una coma.
* Si el nuevo indicador es el último elemento antes del cierre `};`, no lleva coma al final, pero el penúltimo elemento sí debe llevarla.

**Ejemplo de estructura final:**
```javascript
				"MortMAT": {
           "tablero":"p_wgz0pvrxjd", 
           "ficha":"https://drive.google.com/file/d/.../view"
        }, // OJO: Requiere coma porque le sigue un nuevo bloque
				"pesoIdeal": { 
           "tablero": "p_xysjd34c", 
           "ficha": "https://drive.google.com/file/d/.../view"
        }  // OJO: Sin coma porque es el último elemento del objeto
			};
	return tableros;
} 
```
Guarde el archivo (`Ctrl + S`).

---

## Paso 2: Agregar el Botón a la Interfaz

A continuación, se debe crear un botón visible en el menú principal.

**Instrucciones:**
1. Abra el archivo `index.html`.
2. Ubique el contenedor `<div id="horizontal-menu">`.
3. Busque la categoría (`<li class="dropdown">`) y lista correspondiente (`<ul class="dropdown-content">`) para su indicador.
4. Inserte la siguiente línea de código, reemplazando los valores por los suyos:

```html
<li><a class="submenu-item" onclick="cambiarMapa('TU_ID_DEL_SISTEMA')">Título del indicador</a></li>
```

### Categorías Nuevas
Si el indicador requiere un nuevo título organizador dentro del menú, utilice la clase `submenu-title`:

```html
<li><a class="submenu-title" href="#">Nueva Sub-Categoría</a></li>
<li><a class="submenu-item" onclick="cambiarMapa('TU_ID_DEL_SISTEMA')">Indicador 1</a></li>
```

Guarde el archivo (`Ctrl + S`).

---

## Paso 3: Verificación

Para corroborar los cambios:

1. Abra o actualice (`F5`) el archivo `index.html` en su navegador web.
2. En el menú de navegación superior, ubique y haga clic en su nuevo indicador.
3. Compruebe que la gráfica en el área central se cargue correctamente.
4. Haga clic en el ícono de descarga en el menú lateral izquierdo para verificar que el enlace de la Ficha Técnica direcciona al documento PDF correspondiente.

### Resolución de Problemas

* **La pantalla se muestra en blanco o el menú no funciona:**
  * **Causa probable:** Error de sintaxis en `js/menu_lista_tableros.js`, típicamente la ausencia o exceso de una coma `,`. Revise el archivo para corregirlo. Puede apoyarse en la consola del navegador (`F12` -> Pestaña Console) para identificar la línea exacta del error.

* **La gráfica no carga al hacer clic en el botón:**
  * **Causa probable:** El valor dentro de `onclick="cambiarMapa('id')"` en el archivo `index.html` no coincide de forma exacta con el ID registrado en `menu_lista_tableros.js`. Tenga en cuenta las mayúsculas y minúsculas.

### Nota Técnica Avanzada: Nuevas Fuentes de Datos (BigQuery)

El filtrado por municipio funciona mediante la inyección directa de parámetros en la URL hacia **todas** las fuentes de datos conectadas al tablero de Looker Studio. En el archivo `index.html` (dentro de la función `actualizarTablero`), existe un bloque encargado de asignar el código de municipio a cada fuente de datos (`ds001`, `ds002`... `ds024`).

**Si un nuevo indicador utiliza una fuente de datos de BigQuery completamente nueva** que no estuviera previamente en el tablero, Looker Studio le asignará un nuevo identificador interno (por ejemplo, `ds025`).

Para que el filtro de municipio funcione en esa gráfica específica, deberá abrir `index.html`, localizar la función `actualizarTablero`, y añadir manualmente la nueva fuente a la cadena de texto de la variable `url2`:
```javascript
+'"ds025.pcodigom":"'+codeMunicipio+'"'+','
```
Si se omite este paso, el nuevo indicador mostrará datos a nivel nacional y no responderá a la selección de municipio.

**Importante: Granularidad (Municipal vs Departamental)**
Preste especial atención al nivel de agregación de la nueva fuente de datos en BigQuery para decidir qué variable enviar:
* **Datos a nivel municipal:** Se debe cruzar utilizando la variable `codeMunicipio` (ej. `+'"ds025.pcodigom":"'+codeMunicipio+'"'+','`).
* **Datos agregados a nivel departamental:** Si la tabla carece de desglose municipal, intentar enviarle `codeMunicipio` generará un cruce fallido (resultados vacíos). En este caso, obligatoriamente debe inyectarse la variable `codeDep` (ej. `+'"ds025.pcodigom":"'+codeDep+'"'+','`).
