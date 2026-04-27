// ==================== GENRES PAGE LOGIC ====================

function renderGenreMovies() {
    const params = new URLSearchParams(window.location.search);
    const genreTarget = params.get('g');
    
    if (!genreTarget) return window.location.href = '/index.html';

    document.getElementById('genreTitle').textContent = genreTarget;
    const grid = document.getElementById('genreMoviesGrid');
    
    // Filtrar películas que contengan el género en su array
    const filtered = Object.entries(moviesDB).filter(([id, movie]) => 
        movie.genre.includes(genreTarget)
    );

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="color: #737373;">No se encontraron películas en este género.</p>`;
        return;
    }

    grid.innerHTML = filtered.map(([id, movie]) => `
        <div class="movie-card" onclick="openModal('${id}')">
            <img src="${movie.poster}" alt="${movie.title}" loading="lazy">
            <div class="card-overlay">
                <div class="card-top-info">
                    <div class="card-rating">
                        <iconify-icon icon="lucide:star" width="12" style="color:#facc15"></iconify-icon>
                        <span class="card-rating-value">${getMovieRating(id)}</span>
                    </div>
                    <span class="card-year-tag">${movie.year}</span>
                </div>
                <h3 class="card-title">${movie.title}</h3>
                <p class="card-meta">${movie.duration}</p>
            </div>
        </div>
    `).join('');
}

async function init() {
    await Promise.all([
        loadComponent('nav', '../header/header.html', () => {
            if(typeof initHeader === 'function') initHeader(); // initHeader will call setActiveNavLink
        }), 
        loadComponent('footer', '../footer/footer.html', typeof initFooter === 'function' ? initFooter : null)
    ]);
    renderGenreMovies();
}

document.addEventListener('DOMContentLoaded', init);