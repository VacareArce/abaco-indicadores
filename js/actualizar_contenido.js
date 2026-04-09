function updateContent(content) {
    // Actualizar el texto del div central
    document.getElementById('content-display').innerText = content;

    // Desactivar todos los botones
    document.querySelectorAll('.icon-link').forEach(link => {
        link.classList.remove('active');
    });

    // Activar el botón correspondiente
    document.getElementById(content.toLowerCase().replace(/ /g, '-')).classList.add('active');
}