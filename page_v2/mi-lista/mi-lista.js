// ==================== MY LIST PAGE LOGIC ====================

function renderMyList() {
    const grid = document.getElementById('myListGrid');
    const myList = JSON.parse(localStorage.getItem('myList')) || [];

    if (myList.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <iconify-icon icon="lucide:clapperboard" width="48" style="margin-bottom:16px; opacity:0.5"></iconify-icon>
                <p>Tu lista está vacía.</p>
                <a href="../movies/movies.html" class="btn btn-primary" style="margin-top: 24px;">Explorar películas</a>
            </div>`;
        return;
    }

    grid.innerHTML = myList.map(id => {
        const movie = moviesDB[id];
        if (!movie) return '';
        return `
            <div class="movie-card">
                <button class="remove-btn" onclick="removeFromList('${id}')" title="Quitar de mi lista">
                    <iconify-icon icon="lucide:trash-2" width="16"></iconify-icon>
                </button>
                <img src="${movie.poster}" alt="${movie.title}" onclick="openModal('${id}')" loading="lazy">
                <div class="card-overlay" onclick="openModal('${id}')">
                    <h3 class="card-title">${movie.title}</h3>
                    <p class="card-meta">${movie.year}</p>
                </div>
            </div>
        `;
    }).join('');
}

function removeFromList(id) {
    let myList = JSON.parse(localStorage.getItem('myList')) || [];
    myList = myList.filter(item => item !== id);
    localStorage.setItem('myList', JSON.stringify(myList));
    
    renderMyList(); // Volver a renderizar la cuadrícula
    showToast("Eliminado de Mi Lista");
}

async function init() {
    await Promise.all([
        loadComponent('nav', '../header/header.html', () => {
            if(typeof initHeader === 'function') initHeader();
            // Activar visualmente el link de Mi Lista
            document.querySelectorAll('.nav-link').forEach(link => {
                if(link.textContent.trim() === 'Mi Lista') {
                    link.classList.add('nav-link--active');
                    link.classList.remove('nav-link--inactive');
                }
            });
        }),
        loadComponent('footer', '../footer/footer.html', typeof initFooter === 'function' ? initFooter : null)
    ]);
    
    renderMyList();
}

document.addEventListener('DOMContentLoaded', init);