// ==================== SHARED UTILITIES ====================

/**
 * Carga componentes HTML dinámicamente (Header/Footer)
 */
async function loadComponent(id, path, callback) {
    const container = document.getElementById(id);
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`No se pudo cargar: ${path}`);
        const html = await response.text();
        
        if (container) {
            container.innerHTML = html;
            // Marcamos como cargado para animaciones suaves si fuera necesario
            container.setAttribute('data-loaded', 'true');
        }
        if (callback) callback();
    } catch (error) {
        console.error("Error cargando componente:", error);
    }
}

/**
 * Comprueba si una película ya está en localStorage
 */
function isInList(id) {
    const myList = JSON.parse(localStorage.getItem('myList')) || [];
    return myList.includes(id);
}

/**
 * Calcula una puntuación consistente para una película basada en su ID
 */
function getMovieRating(id) {
    if (!id) return "7.5";
    return (7.5 + (id.length % 20) / 10).toFixed(1);
}

// ==================== MODAL LOGIC ====================
let isModalOpen = false;

function openModal(id) {
    const movie = moviesDB[id];
    if (!movie) return;

    const modal = document.getElementById('movieModal');
    const content = document.getElementById('modalContent');
    if (!modal || !content) return;

    const rating = getMovieRating(id);
    const inList = isInList(id);

    // Verificar si hay progreso guardado para cambiar el texto del botón
    const videoProgress = JSON.parse(localStorage.getItem('videoProgress')) || {};
    const progress = videoProgress[id];
    // Consideramos que está "continuando" si tiene más de 2 segundos y menos del 95%
    const isContinuing = progress && progress.duration && 
                         progress.time > 2 && (progress.time / progress.duration) < 0.95;

    // Optimización: Selección aleatoria de recomendaciones sin sort completo
    const filteredEntries = Object.entries(moviesDB)
        .filter(([mId, mData]) => mId !== id && mData.genre.some(g => movie.genre.includes(g)));
    
    const recommendations = [];
    const pool = [...filteredEntries];
    const limit = Math.min(pool.length, 4);
    
    for (let i = 0; i < limit; i++) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        recommendations.push(pool.splice(randomIndex, 1)[0]);
    }

    content.innerHTML = `
        <button onclick="closeModal()" class="modal-close-btn">
            <iconify-icon icon="lucide:x" width="16"></iconify-icon>
        </button>
        <div class="modal-hero">
            <img src="${movie.backdrop || movie.poster}" alt="${movie.title}" class="modal-hero-img">
            <div class="modal-hero-gradient"></div>
            <div class="video-container" id="videoContainer"></div>
            <div class="modal-hero-content">
                <div class="modal-badges">
                    <span class="badge badge--red badge--sm">${movie.genre[0]}</span>
                    <span class="badge badge--yellow badge--sm">
                        <iconify-icon icon="lucide:star" width="11"></iconify-icon> ${rating}
                    </span>
                </div>
                <h2 class="modal-title">${movie.title}</h2>
            </div>
        </div>
        <div class="modal-body">
            <div class="modal-meta">
                <div class="modal-meta-item">
                    <iconify-icon icon="lucide:calendar" width="14" style="color:#737373"></iconify-icon>
                    ${movie.year}
                </div>
                <div class="modal-meta-item">
                    <iconify-icon icon="lucide:clock" width="14" style="color:#737373"></iconify-icon>
                    ${movie.duration}
                </div>
                <div class="modal-meta-item">
                    <iconify-icon icon="lucide:clapperboard" width="14" style="color:#737373"></iconify-icon>
                    ${movie.genre.join(', ')}
                </div>
            </div>
            <div class="modal-actions">
                <button onclick="playMovie('${id}')" class="btn btn-primary">
                    <iconify-icon icon="${isContinuing ? 'lucide:play-circle' : 'lucide:play'}" width="16"></iconify-icon>
                    ${isContinuing ? 'Seguir viendo' : 'Reproducir'}
                </button>
                <button id="modalListBtn" onclick="toggleList('${id}')" class="btn btn-secondary ${inList ? 'btn-active-list' : ''}">
                    <iconify-icon icon="${inList ? 'lucide:check' : 'lucide:plus'}" width="16"></iconify-icon>
                    <span>${inList ? 'En Mi Lista' : 'Mi Lista'}</span>
                </button>
            </div>
            <div class="modal-section">
                <h3 class="modal-section-title">Sinopsis</h3>
                <p class="modal-section-text">${movie.description}</p>
            </div>

            <div class="modal-section modal-recommendations">
                <h3 class="modal-section-title">Películas que te pueden gustar</h3>
                <div class="recommendations-grid">
                    ${recommendations.length > 0 
                        ? recommendations.map(([rId, rMovie]) => `
                        <div class="recommendation-card" onclick="openModal('${rId}')">
                            <img src="${rMovie.poster}" alt="${rMovie.title}" onerror="this.src='https://via.placeholder.com/180x270?text=No+Image'">
                            <div class="recommendation-info">
                                <span class="recommendation-card-title">${rMovie.title}</span>
                                <span class="recommendation-card-year">${rMovie.year}</span>
                            </div>
                        </div>
                    `).join('')
                        : '<p class="modal-section-text">No hay recomendaciones similares en este momento.</p>'
                    }
                </div>
            </div>
        </div>
    `;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    isModalOpen = true;
}

function closeModal() {
    const modal = document.getElementById('movieModal');
    if (modal) modal.classList.remove('open');
    document.body.style.overflow = '';
    isModalOpen = false;

    // Detener y limpiar el reproductor de video
    const container = document.getElementById('videoContainer');
    if (container) {
        container.innerHTML = '';
        container.classList.remove('active');
    }
}

function closeModalBackdrop(e) {
    if (e.target.id === 'movieModal' || e.target === e.currentTarget) closeModal();
}

/**
 * Guarda la película en la lista de historial de reproducción
 */
function saveToContinueWatching(id) {
    let list = JSON.parse(localStorage.getItem('continueWatching')) || [];
    // Evitar duplicados y mover al principio
    list = list.filter(itemId => itemId !== id);
    list.unshift(id);
    // Limitar a los últimos 10
    localStorage.setItem('continueWatching', JSON.stringify(list.slice(0, 10)));
}

/**
 * Elimina una película del historial de "Seguir viendo" y su progreso
 */
function removeFromContinueWatching(id, event) {
    if (event) event.stopPropagation();
    
    // Eliminar del historial
    let history = JSON.parse(localStorage.getItem('continueWatching')) || [];
    history = history.filter(itemId => itemId !== id);
    localStorage.setItem('continueWatching', JSON.stringify(history));
    
    // Eliminar progreso de video
    let videoProgress = JSON.parse(localStorage.getItem('videoProgress')) || {};
    delete videoProgress[id];
    localStorage.setItem('videoProgress', JSON.stringify(videoProgress));

    if (typeof renderContinueWatching === 'function') renderContinueWatching();
}

/**
 * Inyecta el reproductor de video en el contenedor del modal
 */
function playMovie(id) {
    if (!moviesDB[id]) return;
    
    // Detectar si estamos en una subcarpeta (home, search, etc.)
    const isSubfolder = window.location.pathname.split('/').filter(p => p).length > 1;
    const prefix = isSubfolder ? '../' : '';
    
    window.location.href = `${prefix}player/player.html?id=${id}`;
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isModalOpen) closeModal();
});

// ==================== TOAST LOGIC ====================
let toastTimeout;
function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    const toastIcon = toast?.querySelector('iconify-icon');

    if (toast && toastMsg && toastIcon) {
        toastMsg.textContent = msg;
        
        // Cambiar estilo e icono según el tipo
        if (type === 'error') {
            toast.classList.add('toast--error');
            toastIcon.setAttribute('icon', 'lucide:alert-circle');
            toastIcon.style.color = '#ef4444'; // Rojo
        } else {
            toast.classList.remove('toast--error');
            toastIcon.setAttribute('icon', 'lucide:check-circle');
            toastIcon.style.color = '#22c55e'; // Verde
        }

        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 2500);
    }
}

/**
 * Agrega o elimina una película de la lista y actualiza la UI
 */
function toggleList(id) {
    const movie = moviesDB[id];
    if (!movie) return;

    let myList = JSON.parse(localStorage.getItem('myList')) || [];
    const index = myList.indexOf(id);
    const isAdding = index === -1;

    if (isAdding) {
        myList.push(id);
        showToast('"' + movie.title + '" añadida a Mi Lista', 'success');
    } else {
        myList.splice(index, 1);
        showToast('"' + movie.title + '" eliminada de Mi Lista', 'error');
    }

    localStorage.setItem('myList', JSON.stringify(myList));
    
    // Actualizar todos los botones relacionados (Modal y Carrusel)
    const buttons = [
        document.getElementById('modalListBtn'),
        document.getElementById(`heroListBtn-${id}`)
    ];

    buttons.forEach(btn => {
        if (!btn) return;
        const icon = btn.querySelector('iconify-icon');
        const span = btn.querySelector('span');

        if (isAdding) {
            btn.classList.add('btn-active-list');
            if (icon) icon.setAttribute('icon', 'lucide:check');
            if (span) span.textContent = 'En Mi Lista';
        } else {
            btn.classList.remove('btn-active-list');
            if (icon) icon.setAttribute('icon', 'lucide:plus');
            if (span) span.textContent = 'Mi Lista';
        }
    });

    // Si estamos en la página de Mi Lista, refrescamos el grid
    if (typeof renderMyList === 'function') {
        renderMyList();
    }
}