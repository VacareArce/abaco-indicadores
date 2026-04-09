# Manual para Agregar Nuevos Indicadores

Este documento explica paso a paso cómo integrar un nuevo indicador al Dashboard interactivo de ABACO. 

Para agregar un nuevo indicador sin afectar lo existente, necesitarás tener a la mano tres datos clave:
1. **Un nombre corto de identificación (ID) para el código** (por ejemplo: `miNuevoIndicador`).
2. **El ID de la página del tablero en Looker Studio**. Lo puedes obtener observando la URL de tu reporte en Looker Studio (suele ser el segmento al final de la URL que empieza con `p_`, por ejemplo: `p_jlgbdeha4c`).
3. **El enlace de Google Drive** hacia la ficha técnica del indicador en formato PDF (preferiblemente que termine en `/view`).

Para que el indicador se refleje en la página web, solo tienes que modificar dos archivos:

---

## Modificación 1: Configurar el enlace en `js/menu_lista_tableros.js`

Este archivo guarda el "diccionario" maestro que conecta cada indicador con su respectiva gráfica y PDF.

1. Abre el archivo `js/menu_lista_tableros.js` en tu editor de código.
2. Ubica la creación de la variable `var tableros = { ... };`.
3. Añade una nueva clave-valor en la parte del listado que más te convenga (por organización) con el ID, el tablero y la ficha técnica.

El bloque a añadir tiene la siguiente estructura:

```javascript
"ID_DE_TU_INDICADOR": { 
    "tablero": "ID_DE_PAGINA_LOOKER_STUDIO", 
    "ficha": "ENLACE_A_CARPETA_O_ARCHIVO_GOOGLE_DRIVE"
},
```

> [!WARNING]
> La sintaxis de JavaScript requiere separar todos los elementos del "diccionario" con **comas** `,`. 
> Si añades el nuevo indicador al final del diccionario, asegúrate de ponerle una coma al indicador que anterior era el último, y dejar tu nuevo indicador sin coma al final de las llaves `}`.

**Ejemplo Práctico:**
Supongamos que deseas registrar un indicador con el ID interno `pesoAdecuado`.
```javascript
"PDA": {
    "tablero":"p_boz6i686kd", 
    "ficha":"https://drive.google.com/file/d/1_PgW.../view"
}, // <-- NOTA COMO EL ANTERIOR TERMINA EN COMA
"pesoAdecuado": { 
    "tablero": "p_wxx8c", 
    "ficha": "https://drive.google.com/file/d/1_ABC_xyz/view?usp=drive_link"
} // <-- EL ÚLTIMO NO LLEVA COMA
```

---

## Modificación 2: Agregar el botón visible en `index.html`

Una vez el indicador ha sido "registrado" en el JavaScript, debes crear la opción visible en el menú desplegable para que los usuarios puedan seleccionarlo.

1. Abre el archivo principal `index.html`.
2. Busca la zona del menú horizontal en la parte superior. Todo esto se encuentra envuelto dentro de un `<div id="horizontal-menu">`.
3. Verás que las categorías principales (como *"Demográficos y Socioeconómicos"* o *"Indicadores en Salud"*) son elementos `<li class="dropdown">`. Y dentro de ellas hay listas `<ul class="dropdown-content">`.
4. Encuentra la categoría donde quieres que viva tu nuevo indicador.
5. Inserta una nueva línea de código `<li>` invocando la función `cambiarMapa`, pasándole el mismo **ID del Sistema** que elegiste en el paso anterior.

**El código a añadir debe verse así:**
```html
<li><a class="submenu-item" onclick="cambiarMapa('ID_DE_TU_INDICADOR')">Texto Visible para el Usuario</a></li>
```

**Ejemplo Práctico:**
Si quisieras agregar el indicador anterior bajo el subtítulo de *Malnutrición*, buscarías ese bloque y lo dejarías así:
```html
<li><a class="submenu-title" href="#">Malnutrición</a></li> <!-- Titulo-->
<li><a class="submenu-item" onclick="cambiarMapa('retTalla')">Retraso en talla</a></li>
<li><a class="submenu-item" onclick="cambiarMapa('exePeso')">Exceso de peso</a></li>

<!-- Aquí agregamos la nueva línea -->
<li><a class="submenu-item" onclick="cambiarMapa('pesoAdecuado')">Porcentaje con peso adecuado</a></li>
```

> [!TIP]
> Si el nuevo indicador justifica crear agrupadores o requiere un título de separación distinto, puedes insertar `<li><a class="submenu-title" href="#">TU NUEVO TÍTULO</a></li>` justo antes de agregar el botón.

Una vez hayas insertado la información en ambos archivos y recargues la página en el navegador, el indicador aparecerá listo y enlazado.
