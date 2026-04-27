// ==================== HEADER / MOBILE MENU ====================
function initHeader() {
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileGenresToggle = document.getElementById('mobileGenresToggle');
    const mobileGenresContent = document.getElementById('mobileGenresContent');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('open');
            menuToggle.classList.toggle('active', isOpen);
            
            // Cambiar el icono de hamburguesa a X según el estado
            const toggleIcon = menuToggle.querySelector('iconify-icon');
            if (toggleIcon) {
                toggleIcon.setAttribute('icon', isOpen ? 'lucide:x' : 'lucide:menu');
            }

            // Bloquear el scroll del fondo cuando el menú está abierto
            if (isOpen) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
    }

    // Cerrar el menú móvil automáticamente al hacer clic en cualquier enlace (incluyendo géneros)
    if (mobileMenu) {
        mobileMenu.addEventListener('click', (e) => {
            // Efecto Ripple para mejorar el feedback táctil
            const rippleTarget = e.target.closest('.mobile-link, .mobile-dropdown-btn');
            if (rippleTarget) {
                const rect = rippleTarget.getBoundingClientRect();
                const diameter = Math.max(rippleTarget.clientWidth, rippleTarget.clientHeight);
                const radius = diameter / 2;

                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                ripple.style.width = ripple.style.height = `${diameter}px`;
                ripple.style.left = `${e.clientX - rect.left - radius}px`;
                ripple.style.top = `${e.clientY - rect.top - radius}px`;

                rippleTarget.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            }

            // Si el elemento clickeado es un enlace (<a>) o está dentro de uno
            if (e.target.closest('a')) {
                mobileMenu.classList.remove('open');
                menuToggle?.classList.remove('active');
                document.body.style.overflow = '';
                const toggleIcon = menuToggle?.querySelector('iconify-icon');
                if (toggleIcon) toggleIcon.setAttribute('icon', 'lucide:menu');

                // Reiniciar el estado del submenú de géneros para la próxima apertura
                mobileGenresContent?.classList.remove('open');
                mobileGenresToggle?.classList.remove('active');
            }
        });
    }

    // Toggle para el acordeón de géneros en móvil
    if (mobileGenresToggle && mobileGenresContent) {
        mobileGenresToggle.addEventListener('click', () => {
            mobileGenresContent.classList.toggle('open');
            mobileGenresToggle.classList.toggle('active');
        });
    }

    // Insertar el enlace de políticas de privacidad al final del menú móvil
    // Se mueve la inserción a mobileMenu para que quede fuera del scrollable mobile-menu-inner
    if (mobileMenu && !document.getElementById('mobilePrivacyLink')) {
        const privacyLinkHTML = `
            <a href="/assets/politicas.html" id="mobilePrivacyLink" class="mobile-link mobile-link--inactive">
                Privacidad
            </a>`;
        mobileMenu.insertAdjacentHTML('beforeend', privacyLinkHTML);
    }

    // Inyectar iconos en los links principales del móvil basándose en su texto
    const iconMap = {
        "Mi Perfil": "lucide:user", // Añadido para el avatar en el menú móvil
        "Buscar": "lucide:search",
        "Inicio": "lucide:home",
        "Películas": "lucide:film",
        "Mi Lista": "lucide:list",
        "Géneros": "lucide:layers",
        "Privacidad": "lucide:shield-check"
    };

    // Buscamos enlaces y el botón de acordeón de géneros
    document.querySelectorAll('.mobile-link, .mobile-dropdown-btn').forEach(el => {
        // Buscamos el contenedor de texto (span) o el elemento mismo
        const textTarget = el.querySelector('span') || el;
        const textContent = textTarget.textContent.trim();
        
        if (iconMap[textContent]) {
            // Verificamos si ya tiene el icono del mapa para no duplicarlo
            const alreadyHasIcon = el.querySelector(`iconify-icon[icon="${iconMap[textContent]}"]`);
            if (alreadyHasIcon) return;

            const iconHTML = `<iconify-icon icon="${iconMap[textContent]}" width="20" height="20" style="color: #ef4444;"></iconify-icon>`;
            
            // Insertamos el icono al inicio del contenedor de texto
            textTarget.insertAdjacentHTML('afterbegin', iconHTML);
        }
    });

    // Poblar los menús de géneros dinámicamente desde moviesDB (data.js)
    renderGenreMenus();
    
    // Resaltar el enlace activo según la página actual
    updateActiveLinks();
}

/**
 * Genera los enlaces de géneros basados en los datos de las películas
 */
function renderGenreMenus() {
    const desktopContainer = document.getElementById('genresDropdownContent');
    const mobileContainer = document.getElementById('mobileGenresContent');

    if (!desktopContainer && !mobileContainer) return;

    // Optimización: Usar caché global para evitar re-procesar moviesDB en cada página
    if (!window._cachedGenres) {
        const genresSet = new Set();
        if (typeof moviesDB !== 'undefined') {
            Object.values(moviesDB).forEach(movie => {
                if (movie.genre) movie.genre.forEach(g => genresSet.add(g));
            });
        }
        window._cachedGenres = Array.from(genresSet).sort();
    }

    const sortedGenres = window._cachedGenres;

    // Render para escritorio (Dropdown)
    if (desktopContainer) {
        desktopContainer.innerHTML = sortedGenres.map(genre => 
            `<a href="/home/genres.html?g=${encodeURIComponent(genre)}">${genre}</a>`
        ).join('');
    }

    // Render para móvil
    if (mobileContainer) {
        mobileContainer.innerHTML = sortedGenres.map(genre => 
            `<a href="/home/genres.html?g=${encodeURIComponent(genre)}" class="mobile-link mobile-link--inactive" style="padding-left: 32px; font-size: 13px; opacity: 0.8;">
                <iconify-icon icon="lucide:hash" width="14" style="color: #ef4444"></iconify-icon>
                ${genre}
            </a>`
        ).join('');
    }
}

/**
 * Gestiona las clases de estado activo/inactivo para la navegación
 */
function updateActiveLinks() {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const fullCurrentPath = currentPath + currentSearch;
    const allLinks = document.querySelectorAll('.nav-link, .mobile-link');

    allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;

        // Lógica de comparación: exacta para Home, por inclusión para el resto
        const isHome = (currentPath === '/' || currentPath === '/index.html') && (href === '/index.html' || href === '/');
        const isMatch = href !== '/' && href !== '/index.html' && fullCurrentPath.includes(href);

        if (isHome || isMatch) {
            link.classList.add(link.classList.contains('nav-link') ? 'nav-link--active' : 'mobile-link--active');
            link.classList.remove(link.classList.contains('nav-link') ? 'nav-link--inactive' : 'mobile-link--inactive');
        } else {
            link.classList.add(link.classList.contains('nav-link') ? 'nav-link--inactive' : 'mobile-link--inactive');
            link.classList.remove(link.classList.contains('nav-link') ? 'nav-link--active' : 'mobile-link--active');
        }
    });

    // Caso especial: El botón "Géneros" debe estar activo si estamos en una página de género
    const genresToggle = document.getElementById('genresDropdownToggle');
    const mobileGenresToggle = document.getElementById('mobileGenresToggle');
    if (currentPath.includes('genres.html')) {
        if (genresToggle) {
            genresToggle.classList.add('nav-link--active');
            genresToggle.classList.remove('nav-link--inactive');
        }
        if (mobileGenresToggle) {
            mobileGenresToggle.classList.add('mobile-link--active');
            mobileGenresToggle.classList.remove('mobile-link--inactive');
        }
    }
}