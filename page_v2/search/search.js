// ==================== GLOBAL SEARCH LOGIC ====================

async function initSearchPage() {
    // Cargar componentes de navegación
    await Promise.all([
        loadComponent('nav', '/header/header.html', initHeader),
        loadComponent('footer', '/footer/footer.html')
    ]);

    const searchInput = document.getElementById('globalSearchInput');
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q') || '';

    if (initialQuery) {
        searchInput.value = initialQuery;
        performSearch(initialQuery);
    }

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        // Actualizar URL sin recargar para permitir compartir búsquedas
        const newUrl = window.location.pathname + (query ? `?q=${encodeURIComponent(query)}` : '');
        window.history.replaceState({ path: newUrl }, '', newUrl);
        performSearch(query);
    });
}

function performSearch(query) {
    const grid = document.getElementById('searchResultsGrid');
    const infoText = document.getElementById('resultsInfo');
    if (!grid || !infoText) return;

    grid.innerHTML = '';
    const term = query.toLowerCase().trim();

    if (!term) {
        infoText.textContent = 'Empieza a escribir para buscar películas...';
        return;
    }

    // Filtrado en toda la base de datos
    const results = Object.entries(moviesDB).filter(([id, movie]) => {
        return movie.title.toLowerCase().includes(term) || 
               movie.genre.some(g => g.toLowerCase().includes(term)) ||
               movie.description.toLowerCase().includes(term);
    });

    infoText.textContent = results.length === 0 
        ? `No se encontraron resultados para "${query}"` 
        : `Se encontraron ${results.length} películas para "${query}"`;

    results.forEach(([id, movie]) => {
        const card = document.createElement('div');
        card.className = 'movie-card loading';
        card.onclick = () => openModal(id);
        const rating = getMovieRating(id);
        
        card.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/180x270?text=No+Image'">
            <div class="card-overlay">
                <div class="card-top-info">
                    <div class="card-rating">
                        <iconify-icon icon="lucide:star" width="12" style="color:#facc15"></iconify-icon>
                        <span class="card-rating-value">${rating}</span>
                    </div>
                    <span class="card-year-tag">${movie.year}</span>
                </div>
                <h3 class="card-title">${movie.title}</h3>
                <p class="card-meta">${movie.duration}</p>
            </div>
        `;
        grid.appendChild(card);

        // Manejo de skeleton optimizado
        const cardImg = card.querySelector('img');
        if (cardImg.complete) {
            card.classList.remove('loading');
        } else {
            cardImg.onload = () => card.classList.remove('loading');
            cardImg.onerror = () => card.classList.remove('loading');
        }
    });
}

// Iniciar la página
initSearchPage();