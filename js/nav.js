document.addEventListener('DOMContentLoaded', function() {
    // Función disponible para fijar la variable CSS con la altura del navbar
    function setNavbarHeightVar() {
        const navEl = document.querySelector('nav');
        if (navEl) {
            let h = navEl.offsetHeight || 84;
            // Clamp to reasonable bounds to avoid pushing content out of view
            if (h < 56) h = 56;
            if (h > 160) h = 84;
            document.documentElement.style.setProperty('--navbar-height', h + 'px');
            // NO aplicar padding-top porque el navbar es sticky y flota sobre el contenido
            document.querySelectorAll('main, .main-content').forEach(el => {
                try {
                    el.style.paddingTop = '0px';
                    el.style.display = 'block';
                } catch (e) { /* ignore */ }
            });
            // Log para debugging (se puede remover luego)
            console.debug('[nav] navbar height set to', h);
        }
    }

    // Función para forzar visibilidad del navbar
    function ensureNavbarVisible() {
        const navEl = document.querySelector('nav');
        if (navEl) {
            navEl.style.display = 'block';
            navEl.style.visibility = 'visible';
            navEl.style.opacity = '1';
            navEl.style.position = 'sticky';
            navEl.style.top = '0';
            navEl.style.zIndex = '50';
            navEl.style.backgroundColor = 'white';
            navEl.style.width = '100%';
        }
    }

    // Asegurar que la versión de escritorio del navbar se muestre en anchos >= 640px
    function ensureDesktopNavVisible() {
        try {
            // selector genérico que busca el contenedor con la clase responsive sm:flex
            const desktop = document.querySelector('nav [class*="sm:flex"]');
            if (!desktop) return;
            if (window.innerWidth >= 640) {
                desktop.classList.remove('hidden');
                desktop.style.display = 'flex';
                desktop.style.visibility = 'visible';
            } else {
                desktop.classList.add('hidden');
                desktop.style.display = '';
            }
        } catch(e) { /* ignore */ }
    }

    // Ejecutar al inicio (si el nav ya existe) y escuchar cambios de tamaño
    setNavbarHeightVar();
    window.addEventListener('resize', setNavbarHeightVar);
    window.addEventListener('resize', ensureDesktopNavVisible);
    
    // Forzar visibilidad del navbar inmediatamente y después de un delay
    ensureNavbarVisible();
    ensureDesktopNavVisible();
    setTimeout(ensureNavbarVisible, 100);
    setTimeout(ensureDesktopNavVisible, 100);
    setTimeout(ensureNavbarVisible, 500);
    setTimeout(ensureDesktopNavVisible, 500);
    
    // Inicializar dropdown de precios inmediatamente
    initializePricesDropdown();

    // Forzar visibilidad y posicionamiento del sidebar en pantallas md+ (por si Tailwind classes no aplican por cache)
    function ensureSidebar() {
        const side = document.getElementById('links-sidebar');
        if (!side) return;
        if (window.innerWidth >= 768) {
            side.classList.remove('hidden');
            side.style.display = 'block';
            side.style.position = 'fixed';
            side.style.right = '18px';
            side.style.top = 'calc(var(--navbar-height, 84px) + 8px)';
            side.style.width = '240px';
            side.style.maxHeight = 'calc(100vh - 120px)';
            side.style.overflowY = 'auto';
            side.style.zIndex = '60';
            // ajustar padding del main
            document.querySelectorAll('.main-content').forEach(el => el.style.paddingRight = '280px');
        } else {
            // Restablecer para móvil
            side.classList.add('hidden');
            side.style.display = '';
            document.querySelectorAll('.main-content').forEach(el => el.style.paddingRight = '');
        }
    }

    ensureSidebar();
    window.addEventListener('resize', ensureSidebar);

    // Si se abre por file://, evitar el fetch (bloqueado por CORS). Aplicar fallback y salir.
    if (location.protocol === 'file:') {
        console.debug('[nav] file:// detected — skipping fetch and using in-page navbar');
        // Asegurar padding-top del main por si algún script anterior lo cambió
        const navEl = document.querySelector('nav');
        const h = (navEl && navEl.offsetHeight) ? navEl.offsetHeight : 84;
        document.querySelectorAll('main, .main-content').forEach(el => {
            el.style.paddingTop = '0px';
            el.style.display = 'block';
            el.style.visibility = 'visible';
            el.style.opacity = '1';
        });
        if (document.getElementById('menu-overlay')) {
            document.getElementById('menu-overlay').classList.remove('menu-overlay-visible');
            document.getElementById('menu-overlay').classList.add('hidden');
        }
        // No hacer fetch
        // Fallback: asegurar que elementos con .fade-up estén visibles (si product.js no pudo correr)
        try {
            document.querySelectorAll('.fade-up').forEach(el => el.classList.add('show'));
            console.debug('[nav] fallback: added .show to .fade-up elements');
            console.info('[nav] file:// fallback applied — forcing main visible');
        } catch(e){}
        // Asegurar visibilidad del navbar y versión escritorio
        ensureNavbarVisible();
        ensureDesktopNavVisible();
        initializePricesDropdown();
        return;
    }

    // Cargar el navbar desde components siempre y reemplazar el existente si lo hubiera
    fetch('./components/navbar.html')
        .then(response => response.text())
        .then(data => {
            // Primera: reemplazar nav marcado o, si existe cualquier <nav> estático, reemplazar el primero
            const existingInserted = document.querySelector('nav[data-main-inserted]');
            if (existingInserted) {
                existingInserted.outerHTML = data;
            } else {
                const firstNav = document.querySelector('nav');
                if (firstNav) {
                    firstNav.outerHTML = data;
                } else {
                    document.body.insertAdjacentHTML('afterbegin', data);
                }
            }
            // Recalcular ahora que el navbar fue insertado/reemplazado
            setNavbarHeightVar();
            ensureNavbarVisible();
            ensureSidebar();
            initializeNavbar();
            initializeMobileMenu();
            initializeSearchModal();
            initializePricesDropdown();
            addDynamicStyles();
        })
        .catch(error => console.error('Error loading navbar:', error));
});

function initializeNavbar() {
    // Menú hamburguesa (versión simplificada que será reemplazada por initializeMobileMenu)
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    if (mobileMenuButton) {
        const icon = mobileMenuButton.querySelector('i');
        mobileMenuButton.addEventListener('click', function() {
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
    }
}

function initializeMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const closeMenuButton = document.getElementById('close-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOverlay = document.getElementById('menu-overlay');

    if (!mobileMenuButton || !mobileMenu) return;

    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.remove('-translate-x-full');
        mobileMenu.classList.remove('hidden');
        if (menuOverlay) menuOverlay.classList.add('menu-overlay-visible');
        document.body.style.overflow = 'hidden';
        
        // Cambiar ícono
        const icon = mobileMenuButton.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        }
    });

    if (closeMenuButton) {
        closeMenuButton.addEventListener('click', closeMobileMenu);
    }

    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMobileMenu);
    }

    function closeMobileMenu() {
        mobileMenu.classList.add('-translate-x-full');
        if (menuOverlay) menuOverlay.classList.remove('menu-overlay-visible');
        document.body.style.overflow = '';
        
        // Cambiar ícono
        const icon = mobileMenuButton.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
}

function initializeSearchModal() {
    const searchModal = document.getElementById('search-modal');
    const searchButton = document.getElementById('search-button');
    const mobileSearchButton = document.getElementById('mobile-search-button');
    const closeSearch = document.getElementById('close-search');

    function openSearchModal() {
        if (searchModal) {
            searchModal.classList.remove('none');
            searchModal.classList.add('anim');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeSearchModal() {
        if (searchModal) {
            searchModal.classList.add('none');
            document.body.style.overflow = '';
        }
    }

    if (searchButton) searchButton.addEventListener('click', openSearchModal);
    if (mobileSearchButton) mobileSearchButton.addEventListener('click', openSearchModal);
    if (closeSearch) closeSearch.addEventListener('click', closeSearchModal);

    if (searchModal) {
        searchModal.addEventListener('click', function(e) {
            if (e.target === searchModal) {
                closeSearchModal();
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && searchModal && !searchModal.classList.contains('none')) {
            closeSearchModal();
        }
    });
}

function initializePricesDropdown() {
    const pricesButton = document.getElementById('prices-button');
    const mobilePricesButton = document.getElementById('mobile-prices-button');
    const pricesDropdown = document.getElementById('prices-dropdown');
    const pricesModal = document.getElementById('prices-modal');

    // Desktop dropdown
    if (pricesButton && pricesDropdown) {
        const pricesButtonParent = pricesButton.closest('.relative');
        
        pricesButton.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            // Toggle simple del dropdown
            if (pricesDropdown.classList.contains('hidden')) {
                pricesDropdown.classList.remove('hidden');
            } else {
                pricesDropdown.classList.add('hidden');
            }
        });

        // Cerrar al hacer click fuera
        document.addEventListener('click', function(e) {
            if (pricesButtonParent && !pricesButtonParent.contains(e.target)) {
                pricesDropdown.classList.add('hidden');
            }
        });

        // Cerrar al presionar Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !pricesDropdown.classList.contains('hidden')) {
                pricesDropdown.classList.add('hidden');
            }
        });
    }

    // Mobile modal
    if (mobilePricesButton && pricesModal) {
        function openPricesModal() {
            pricesModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function closePricesModal() {
            pricesModal.classList.add('hidden');
            document.body.style.overflow = '';
        }

        mobilePricesButton.addEventListener('click', openPricesModal);
        
        const closePricesModalBtn = document.getElementById('close-prices-modal');
        if (closePricesModalBtn) {
            closePricesModalBtn.addEventListener('click', closePricesModal);
        }

        pricesModal.addEventListener('click', function(e) {
            if (e.target === pricesModal) {
                closePricesModal();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !pricesModal.classList.contains('hidden')) {
                closePricesModal();
            }
        });
    }
}

function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
        
        .anim {
            animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .none {
            display: none;
        }
        
        /* Estilos para el menú móvil */
        .-translate-x-full {
            transform: translateX(-100%);
        }
        
        #mobile-menu {
            transition: transform 0.3s ease-in-out;
        }
        
        #menu-overlay {
            background-color: rgba(0, 0, 0, 0.5);
        }
    `;
    document.head.appendChild(style);
}