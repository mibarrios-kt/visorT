document.addEventListener('DOMContentLoaded', function() {
    // Oculta todos los contenidos de sección al inicio
    document.querySelectorAll('.menu-section-content').forEach(function(content) {
        content.classList.remove('active');
    });
    document.querySelectorAll('.menu-section-title').forEach(function(title) {
        title.classList.add('collapsed');
        title.addEventListener('click', function() {
            // Cierra todas las secciones
            document.querySelectorAll('.menu-section-content').forEach(function(content) {
                content.classList.remove('active');
            });
            document.querySelectorAll('.menu-section-title').forEach(function(t) {
                t.classList.add('collapsed');
            });
            // Abre solo la seleccionada
            this.nextElementSibling.classList.add('active');
            this.classList.remove('collapsed');
        });
    });
});
