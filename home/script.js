// ==================== STATE ====================
let heroMovies = [];
let genres = [];

/**
 * Transforma moviesDB de data.js al formato interno
 */
function prepareData() {
  const allMovies = Object.entries(moviesDB).map(([id, movie]) => ({
    id: id,
    title: movie.title,
    year: movie.year,
    duration: movie.duration,
    genre: movie.genre[0], // Género principal
    allGenres: movie.genre,
    synopsis: movie.description,
    img: movie.poster,
    backdrop: movie.backdrop,
    rating: getMovieRating(id),
    director: "Disponible en detalles",
    cast: "Varios artistas"
  }));

  // Primeras 5 para el Hero
  heroMovies = allMovies.slice(0, 5);

  // Agrupar por todos los géneros disponibles
  const genreMap = {};
  const genreIcons = {
    "Acción": "lucide:zap", "Comedia": "lucide:laugh", "Terror": "lucide:skull",
    "Ciencia ficción": "lucide:rocket", "Drama": "lucide:heart", "Animación": "lucide:palette",
    "Familia": "lucide:users", "Misterio": "lucide:search", "Suspenso": "lucide:alert-triangle"
  };

  allMovies.forEach(movie => {
    movie.allGenres.forEach(g => {
      if (!genreMap[g]) {
        genreMap[g] = { name: g, icon: genreIcons[g] || "lucide:film", movies: [] };
      }
      genreMap[g].movies.push(movie);
    });
  });

  genres = Object.values(genreMap);
}

// ==================== HERO CAROUSEL ====================
let currentHeroSlide = 0;
let heroInterval;

function initHeroCarousel() {
  const carousel = document.getElementById('heroCarousel');
  const dots = document.getElementById('heroDots');

  heroMovies.forEach((movie, i) => {
    const inList = isInList(movie.id);
    const backdropUrl = movie.backdrop || movie.img;
    const slide = document.createElement('div');
    slide.className = 'hero-slide loading' + (i === 0 ? ' active' : '');
    slide.innerHTML = `
      <div class="backdrop" style="background-image:url('${backdropUrl}')"></div>
      <div class="gradient-overlay"></div>
      <div class="hero-content-wrapper">
        <div class="hero-content-inner">
          <div class="hero-content">
            <div class="hero-badges">
              <span class="badge badge--red">
                <span class="pulse-dot" style="width:8px;height:8px;background:#ef4444;border-radius:50%;display:inline-block"></span>
                Destacada
              </span>
              <span class="badge badge--yellow">
                <iconify-icon icon="lucide:star" width="12"></iconify-icon> ${movie.rating}
              </span>
            </div>
            <h1 class="hero-title">${movie.title}</h1>
            <div class="hero-meta">
              <span>${movie.year}</span>
              <span class="meta-dot"></span>
              <span>${movie.duration}</span>
              <span class="meta-dot"></span>
              <span>${movie.genre}</span>
            </div>
            <p class="hero-desc line-clamp-3">${movie.synopsis}</p>
            <div class="hero-actions">
              <button onclick="openModal('${movie.id}')" class="btn btn-primary">
                <iconify-icon icon="lucide:info" width="16"></iconify-icon>
                Ver detalles
              </button>
              <button id="heroListBtn-${movie.id}" onclick="toggleList('${movie.id}')" class="btn btn-secondary ${inList ? 'btn-active-list' : ''}">
                <iconify-icon icon="${inList ? 'lucide:check' : 'lucide:plus'}" width="16"></iconify-icon>
                <span>${inList ? 'En Mi Lista' : 'Mi Lista'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    carousel.appendChild(slide);

    // Detectar carga usando la imagen ya presente en el DOM (vía background-image o img)
    // Para fondos, podemos usar un truco simple:
    const img = new Image();
    img.onload = () => slide.classList.remove('loading');
    img.onerror = () => slide.classList.remove('loading');
    img.src = backdropUrl; // Asignar el src después del onload

    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.onclick = () => goToHeroSlide(i);
    dots.appendChild(dot);
  });

  startHeroAutoPlay();
}

function goToHeroSlide(index) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.dot');
  slides[currentHeroSlide].classList.remove('active');
  dots[currentHeroSlide].classList.remove('active');
  currentHeroSlide = index;
  slides[currentHeroSlide].classList.add('active');
  dots[currentHeroSlide].classList.add('active');
}

function nextHeroSlide() {
  goToHeroSlide((currentHeroSlide + 1) % heroMovies.length);
  resetHeroAutoPlay();
}

function prevHeroSlide() {
  goToHeroSlide((currentHeroSlide - 1 + heroMovies.length) % heroMovies.length);
  resetHeroAutoPlay();
}

function startHeroAutoPlay() {
  heroInterval = setInterval(() => {
    goToHeroSlide((currentHeroSlide + 1) % heroMovies.length);
  }, 6000);
}

function resetHeroAutoPlay() {
  clearInterval(heroInterval);
  startHeroAutoPlay();
}

// ==================== GENRE SECTIONS ====================
function initGenreSections() {
  const container = document.getElementById('genreSections');
  if (!container) return;
  
  // Crear un fragmento para minimizar reflujos (reflows) del DOM
  const fragment = document.createDocumentFragment();

  genres.forEach((genre, gi) => {
    const section = document.createElement('section');
    section.className = 'genre-section';
    // Solo renderizamos el esqueleto de la fila, el contenido se llena abajo
    section.innerHTML = `
      <div class="genre-header">
        <div class="genre-header-left">
          <div class="genre-icon-box">
            <iconify-icon icon="${genre.icon}" width="16" style="color:#ef4444"></iconify-icon>
          </div>
          <h2 class="genre-title">${genre.name}</h2>
        </div>
        <a href="/home/genres.html?g=${encodeURIComponent(genre.name)}" class="genre-link">
          Ver todo <iconify-icon icon="lucide:chevron-right" width="14"></iconify-icon>
        </a>
      </div>
      <div class="genre-row-wrapper">
        <button class="scroll-arrow scroll-arrow--left" onclick="scrollRow(${gi}, -1)" aria-label="Desplazar izquierda">
          <iconify-icon icon="lucide:chevron-left" width="24"></iconify-icon>
        </button>
        <div class="genre-row" id="genreRow${gi}"></div>
        <button class="scroll-arrow scroll-arrow--right" onclick="scrollRow(${gi}, 1)" aria-label="Desplazar derecha">
          <iconify-icon icon="lucide:chevron-right" width="24"></iconify-icon>
        </button>
      </div>
    `;
    fragment.appendChild(section);
  });
  
  container.appendChild(fragment);

  // Llenado diferido de películas por fila para no saturar el hilo principal
  genres.forEach((genre, gi) => {
    const row = document.getElementById(`genreRow${gi}`);
    if (!row) return;
    
    genre.movies.slice(0, 10).forEach(m => { // Limitamos a 10 por fila inicialmente en Home
      const card = document.createElement('div');
      card.className = 'movie-card loading';
      card.onclick = () => openModal(m.id);
      card.innerHTML = `
        <img src="${m.img}" alt="${m.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/180x270?text=No+Image'">
        <div class="card-overlay">
          <div class="card-top-info">
            <div class="card-rating">
              <iconify-icon icon="lucide:star" width="12" style="color:#facc15"></iconify-icon>
              <span class="card-rating-value">${m.rating}</span>
            </div>
            <span class="card-year-tag">${m.year}</span>
          </div>
          <h3 class="card-title">${m.title}</h3>
          <p class="card-meta">${m.duration}</p>
        </div>
      `;
      row.appendChild(card);

      // Usar la imagen del DOM directamente para evitar doble carga
      const cardImg = card.querySelector('img');
      if (cardImg.complete) {
          card.classList.remove('loading');
      } else {
          cardImg.onload = () => card.classList.remove('loading');
          cardImg.onerror = () => card.classList.remove('loading');
      }
    });
  });
}

function scrollRow(index, direction) {
  const row = document.getElementById('genreRow' + index);
  if (!row) return;
  // Desplazamos aproximadamente el 80% del ancho visible de la fila
  const scrollAmount = row.clientWidth * 0.8;
  row.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
}

/**
 * Renderiza la sección "Seguir viendo" basada en el localStorage
 */
function renderContinueWatching() {
  const container = document.getElementById('continueWatchingSection');
  const history = JSON.parse(localStorage.getItem('continueWatching')) || [];
  const videoProgress = JSON.parse(localStorage.getItem('videoProgress')) || {};

  // Filtrar para mostrar solo películas con progreso real y que no estén terminadas
  const activeHistory = history.filter(id => {
    const progress = videoProgress[id];
    if (!progress || !progress.duration) return false;
    
    const percent = (progress.time / progress.duration) * 100;
    // Consideramos terminada si pasó del 95% (créditos) o si tiene menos del 1% (clic accidental)
    return percent > 1 && percent < 95;
  });

  if (activeHistory.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  container.innerHTML = `
    <div class="genre-header">
      <div class="genre-header-left">
        <div class="genre-icon-box">
          <iconify-icon icon="lucide:history" width="16" style="color:#ef4444"></iconify-icon>
        </div>
        <h2 class="genre-title">Seguir viendo</h2>
      </div>
    </div>
    <div class="genre-row-wrapper">
      <button class="scroll-arrow scroll-arrow--left" onclick="scrollRow('Continue', -1)" aria-label="Desplazar izquierda">
        <iconify-icon icon="lucide:chevron-left" width="24"></iconify-icon>
      </button>
      <div class="continue-grid" id="genreRowContinue">
        ${activeHistory.map(id => {
          const movie = moviesDB[id];
          if (!movie) return '';
          
          const progress = videoProgress[id];
          const percent = progress && progress.duration ? (progress.time / progress.duration * 100) : 0;
          
          return `
            <div class="continue-card" onclick="openModal('${id}')">
              <button class="remove-btn" onclick="removeFromContinueWatching('${id}', event)" title="Quitar de Seguir Viendo" style="width: 28px; height: 28px; top: 6px; right: 6px;">
                <iconify-icon icon="lucide:x" width="14"></iconify-icon>
              </button>
              <img src="${movie.backdrop || movie.poster}" alt="${movie.title}">
              <div class="continue-overlay">
                <span class="continue-title">${movie.title}</span>
              </div>
              ${percent > 0 ? `
                <div class="continue-progress-container">
                  <div class="continue-progress-fill" style="width: ${percent}%"></div>
                </div>
              ` : ''}
            </div>`;
        }).join('')}
      </div>
      <button class="scroll-arrow scroll-arrow--right" onclick="scrollRow('Continue', 1)" aria-label="Desplazar derecha">
        <iconify-icon icon="lucide:chevron-right" width="24"></iconify-icon>
      </button>
    </div>
  `;
}

// ==================== INIT ====================
async function initApp() {
  // Cargamos los componentes externos primero
  await Promise.all([
    loadComponent('nav', 'header/header.html', typeof initHeader === 'function' ? initHeader : null),
    loadComponent('footer', 'footer/footer.html', typeof initFooter === 'function' ? initFooter : null)
  ]);

  // Preparamos los datos de data.js
  prepareData();

  // Inicializamos componentes visuales
  initHeroCarousel();
  renderContinueWatching();
  // Optimización: Usar un delay pequeño para permitir que el Hero y el Navegador respiren
  setTimeout(() => {
    requestAnimationFrame(() => {
      initGenreSections();
    });
  }, 100);
}

initApp();