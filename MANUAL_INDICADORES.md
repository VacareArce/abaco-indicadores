# 📘 Manual Detallado: Cómo Agregar Nuevos Indicadores al Dashboard

Este manual está diseñado para guiarte de forma minuciosa en el proceso de agregar un nuevo indicador al Dashboard interactivo de ABACO. 

El sistema funciona de forma muy sencilla: no utiliza una base de datos compleja, sino que actúa como una "ventana" que muestra tableros interactivos creados previamente en **Google Looker Studio**. Por lo tanto, para agregar un indicador, solo necesitamos decirle a la página web **dónde buscar la gráfica** y **dónde crear el botón** para que el usuario pueda hacer clic en él.

---

## 📋 PREPARACIÓN: ¿Qué datos necesitas tener listos?

Antes de tocar el código, asegúrate de recopilar la siguiente información. Te recomendamos anotar esto en un bloc de notas:

### 1. El ID del Sistema (Nombre Corto)
Debes inventar una "palabra clave" corta y sin espacios que identifique a tu indicador en el código. 
* Ejemplos correctos: `pesoIdeal`, `vacunacion2024`, `pobrezaExt`.
* Ejemplos incorrectos: `Peso Ideal`, `vacunacion-2024` (mejor evitar guiones u mayúsculas al inicio por convención).

### 2. El ID de la Página en Looker Studio
Cuando estés creando o viendo la gráfica en Google Looker Studio, observa la barra de direcciones de tu navegador (la URL). Suele verse parecido a esto:
`https://lookerstudio.google.com/reporting/f2ee...aac1-91dd.../page/p_jlgbdeha4c`

Lo único que te interesa copiar es el código que está **después de la palabra `/page/`**. Normalmente empieza con `p_`.
* **Dato a copiar:** `p_jlgbdeha4c`

### 3. El Enlace de Google Drive (Ficha Técnica PDF)
Debes subir la ficha técnica que explica cómo se midió el indicador a una carpeta de Google Drive.
* Asegúrate de que los permisos del archivo de Drive estén en **"Cualquier usuario con el enlace puede leer"**.
* **Dato a copiar:** Copia el enlace para compartir, el cual se verá parecido a: `https://drive.google.com/file/d/1_ABC123XYZ.../view?usp=drive_link`

---

## 💻 PASO 1: Registrar el Indicador en el "Diccionario" de Datos

El archivo `js/menu_lista_tableros.js` es el cerebro que asocia cada "ID del Sistema" con su respectivo enlace. Vamos a añadir tu indicador a este diccionario.

**Instrucciones:**
1. En tu editor de código (VSCode, Notepad++, etc.), abre la carpeta `js` y edita el archivo `menu_lista_tableros.js`.
2. Verás que hay un gran bloque de texto que inicia con `var tableros = {`. Dentro de este bloque viven todos los indicadores agrupados.
3. Lo ideal es agrupar tu indicador cerca de otros indicadores que sean del mismo tema. Ve hasta el final o ubícate debajo del indicador que más se parezca al tuyo.
4. Agrega un bloque con esta estructura exacta:

```javascript
"TU_ID_DEL_SISTEMA": { 
    "tablero": "EL_ID_DE_LOOKER_STUDIO", 
    "ficha": "EL_ENLACE_DE_GOOGLE_DRIVE"
}
```

🚨 **¡REGLA DE ORO CON LAS COMAS! (La principal causa de errores):**
En JavaScript, cada bloque del diccionario **debe** ir separado por una coma `,`.
Si agregas tu indicador en medio de otros, debe llevar una coma al final del `}`. Si lo agregas exactamente de último (antes del `};` final), no debe llevar coma, pero el indicador que estaba justo arriba de él, ahora *SÍ* debe llevar coma.

**Ejemplo Práctico de cómo debe verse el código final:**
```javascript
				"MortMAT": {
           "tablero":"p_wgz0pvrxjd", 
           "ficha":"https://drive.google.com/file/d/.../view"
        }, // <---- OJO: Puse una coma aquí porque viene un nuevo bloque abajo
				"pesoIdeal": { 
           "tablero": "p_xysjd34c", 
           "ficha": "https://drive.google.com/file/d/.../view"
        }  // <---- OJO: Cero comas aquí porque ya es el último indicador del bloque.
			};
	return tableros;
} 
```
*Guarda el archivo cuando hayas terminado (Control + S).*

---

## 🎨 PASO 2: Agregar el Botón a la Interfaz Gráfica

Ahora que el sistema "conoce" el indicador, necesitamos crear un botón seleccionable para el usuario final.

**Instrucciones:**
1. Abre el archivo principal `index.html` en la carpeta raíz del proyecto.
2. Busca la línea donde dice `<div id="horizontal-menu">`. Allí comienza la barra superior azul de navegación.
3. Observa que el menú está organizado en grandes categorías (`<li class="dropdown">`), y que al pasar el mouse despliegan listas (`<ul class="dropdown-content">`).
4. Busca la categoría en la cual encaja tu nuevo Indicador (por ejemplo, *Indicadores Nutricionales*).
5. Posiciónate donde quieras que aparezca tu botón, copia el código que te dejo abajo, pégalo, y reemplaza los valores de ejemplo por los tuyos:

```html
<li><a class="submenu-item" onclick="cambiarMapa('TU_ID_DEL_SISTEMA')">Título que leerá el usuario en pantalla</a></li>
```

### Opcional: Crear un Título Separador
Si tu indicador pertenece a una sub-categoría nueva y quieres poner un "Título" en negrita para separarlo del resto de ítems en el menú desplegable, puedes usar `submenu-title` de esta manera:

```html
<li><a class="submenu-title" href="#">Mi Nueva Sub-Categoría</a></li>
<li><a class="submenu-item" onclick="cambiarMapa('TU_ID_DEL_SISTEMA')">Mi Indicador 1</a></li>
<li><a class="submenu-item" onclick="cambiarMapa('OTRO_ID')">Mi Indicador 2</a></li>
```

*Guarda el archivo cuando hayas terminado (Control + S).*

---

## 🔎 PASO 3: Probar el Funcionamiento

Es hora de verificar que nuestro trabajo está correcto.

1. Abre el archivo `index.html` en tu navegador favorito (Chrome, Firefox, Edge). Si ya lo tenías abierto, simplemente **refresca (F5)** la página.
2. Despliega el menú en la parte superior y busca tu nuevo botón.
3. Haz clic en él. Deberías notar que:
   * La gráfica de Looker Studio en la caja inferior cambia y empieza a cargar.
   * Si seleccionaste un Departamento y Municipio, la gráfica se filtrará correctamente.
4. **Verificación de PDF:** Ve a la barra lateral izquierda y haz clic en el icono gris cuadrado con una flecha hacia abajo (Ficha Técnica). Debería abrirse en una nueva pestaña exacta al PDF que pusiste en el diccionario de datos.

### 🆘 Posibles Soluciones a Problemas (Troubleshooting)

* **Problema:** Refresco la página en el navegador y toda la pantalla se queda en blanco o los mapas dejaron de cargar.
  * **Solución:** ¡Cometiste un error de sintaxis en `js/menu_lista_tableros.js`! Seguramente olvidaste poner una coma `,` o cerraste mal unas comillas `""`. Abre el archivo y revisa cuidadosamente. Puedes presionar F12 en el navegador, ir a la pestaña "Console" (Consola) y allí te dirá exactamente en qué línea te faltó la coma.

* **Problema:** Le doy clic al botón, pero la gráfica no hace nada.
  * **Solución:** Lo más probable es que el `TU_ID_DEL_SISTEMA` que escribiste en `index.html` (dentro de onclick="cambiarMapa('id')") no sea exactamente el mismo que escribiste en el archivo `menu_lista_tableros.js`. Diferencias de mayúsculas y minúsculas importan (`pesoideal` no es lo mismo que `pesoIdeal`).
