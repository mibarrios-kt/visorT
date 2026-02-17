document.addEventListener('DOMContentLoaded', function() {
    var btnHamburger = document.getElementById('btn-hamburger');
    var menuCapas = document.getElementById('menu-capas');
    btnHamburger.addEventListener('click', function(e) {
        e.stopPropagation();
        if (menuCapas.style.display === 'block') {
            menuCapas.style.display = 'none';
        } else {
            menuCapas.style.display = 'block';
        }
    });
    // Cierra el menú si se hace clic fuera
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 700 && menuCapas.style.display === 'block' && !menuCapas.contains(e.target) && e.target !== btnHamburger) {
            menuCapas.style.display = 'none';
        }
    });
});