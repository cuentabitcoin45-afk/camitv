// ==================== MOVIES PAGE LOGIC ====================

function renderAllMovies() {
    const grid = document.getElementById('allMoviesGrid');
    const movies = Object.entries(moviesDB);

    grid.innerHTML = movies.map(([id, movie]) => `
        <div class="movie-card" onclick="openModal('${id}')">
            <img src="${movie.poster}" alt="${movie.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/180x270?text=No+Image'">
            <div class="card-overlay">
                <div class="card-top-info">
                    <div class="card-rating">
                        <iconify-icon icon="lucide:star" width="12" style="color:#facc15"></iconify-icon>
                        <span class="card-rating-value">${(Math.random() * 2 + 7.5).toFixed(1)}</span>
                    </div>
                    <span class="card-year-tag">${movie.year}</span>
                </div>
                <h3 class="card-title">${movie.title}</h3>
                <p class="card-meta">${movie.duration}</p>
            </div>
        </div>
    `).join('');
}

// Inicialización
async function init() {
    await Promise.all([
        loadComponent('nav', '../header/header.html', () => {
            if(typeof initHeader === 'function') initHeader(); // initHeader will call setActiveNavLink
        }),
        loadComponent('footer', '../footer/footer.html', typeof initFooter === 'function' ? initFooter : null)
    ]);
    renderAllMovies();
}

document.addEventListener('DOMContentLoaded', init);