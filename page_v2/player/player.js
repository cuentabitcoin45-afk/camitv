const video = document.getElementById('mainVideo');
const playPauseBtn = document.getElementById('playPauseBtn');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const timeDisplay = document.getElementById('timeDisplay');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const videoWrapper = document.getElementById('videoWrapper');
const videoLoader = document.getElementById('videoLoader');
const muteBtn = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider');
const centerPlayBtn = document.getElementById('centerPlayBtn');

let controlsTimeout;
let saveProgressInterval = null; // Para almacenar el ID del intervalo de guardado
let currentMovieId = null; // Para rastrear el ID de la película actual

// 1. Inicialización
function init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id || !moviesDB[id]) {
        window.location.href = '../index.html';
        return;
    }

    const movie = moviesDB[id];
    document.getElementById('videoTitle').textContent = movie.title;
    video.src = movie.videoSrc;
    
    // 1. Asignar el ID para que las funciones de guardado sepan qué película trackear
    currentMovieId = id;
    // 2. Intentar cargar el progreso guardado inmediatamente
    loadSavedTime(id);
    
    // Guardar en "Seguir viendo"
    saveToHistory(id);
    
    setupEventListeners();

    // Intentar reproducir automáticamente (útil si el atributo HTML es bloqueado)
    video.play().catch(error => {
        console.log("La reproducción automática fue pausada por el navegador:", error);
    });
}

function saveToHistory(id) {
    let list = JSON.parse(localStorage.getItem('continueWatching')) || [];
    list = list.filter(item => item !== id);
    list.unshift(id);
    localStorage.setItem('continueWatching', JSON.stringify(list.slice(0, 10)));
}

// Guarda la posición actual de reproducción del video
function saveVideoProgress() {
    if (currentMovieId && !isNaN(video.currentTime) && video.currentTime > 0 && !video.ended) {
        let videoProgress = JSON.parse(localStorage.getItem('videoProgress')) || {};
        videoProgress[currentMovieId] = {
            time: video.currentTime,
            duration: video.duration
        };
        localStorage.setItem('videoProgress', JSON.stringify(videoProgress));
        // console.log(`Saved progress for ${currentMovieId}: ${video.currentTime}`); // Para depuración
    }
}

// Carga la posición de reproducción guardada
function loadSavedTime(id) {
    let videoProgress = JSON.parse(localStorage.getItem('videoProgress')) || {};
    if (videoProgress[id] && videoProgress[id].time) {
        video.currentTime = videoProgress[id].time;
        // console.log(`Loaded progress for ${id}: ${videoProgress[id]}`); // Para depuración
    }
}

// Borra la posición de reproducción guardada cuando el video termina
function clearSavedTime() {
    if (!currentMovieId) return;
    let videoProgress = JSON.parse(localStorage.getItem('videoProgress')) || {};
    delete videoProgress[currentMovieId];
    localStorage.setItem('videoProgress', JSON.stringify(videoProgress));
    clearInterval(saveProgressInterval); // Detener el intervalo de guardado
    saveProgressInterval = null; // Resetear el ID del intervalo
}

// 2. Eventos
function setupEventListeners() {
    playPauseBtn.addEventListener('click', togglePlay);
    if (centerPlayBtn) centerPlayBtn.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);
    video.addEventListener('timeupdate', updateProgress);
    progressContainer.addEventListener('click', seek);
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    // Adelantar/Atrasar 10s
    document.getElementById('rewindBtn').onclick = () => video.currentTime -= 10;
    document.getElementById('forwardBtn').onclick = () => video.currentTime += 10;

    // Control de Volumen
    volumeSlider.addEventListener('input', (e) => {
        video.volume = e.target.value;
        video.muted = false;
    });

    muteBtn.addEventListener('click', () => {
        video.muted = !video.muted;
    });

    video.addEventListener('volumechange', () => {
        volumeSlider.value = video.muted ? 0 : video.volume;
        updateVolumeIcon();
    });

    // Sincronización inicial
    video.volume = volumeSlider.value;
    updateVolumeIcon();

    // Auto-ocultar controles
    videoWrapper.addEventListener('mousemove', showControls);
    video.addEventListener('play', showControls);
    video.addEventListener('pause', showControls); // Mostrar controles al pausar

    // Gestionar el guardado del progreso
    video.addEventListener('play', () => {
        playPauseBtn.innerHTML = '<iconify-icon icon="lucide:pause" width="24"></iconify-icon>';
        if (centerPlayBtn) centerPlayBtn.innerHTML = '<iconify-icon icon="lucide:pause" width="64"></iconify-icon>';
        if (!saveProgressInterval) {
            saveProgressInterval = setInterval(saveVideoProgress, 5000); // Guardar cada 5 segundos
        }
    });
    video.addEventListener('pause', () => {
        playPauseBtn.innerHTML = '<iconify-icon icon="lucide:play" width="24"></iconify-icon>';
        if (centerPlayBtn) centerPlayBtn.innerHTML = '<iconify-icon icon="lucide:play" width="64"></iconify-icon>';
        clearInterval(saveProgressInterval);
        saveProgressInterval = null;
        saveVideoProgress(); // Guardar inmediatamente al pausar
    });
    video.addEventListener('ended', clearSavedTime); // Borrar progreso cuando el video termina

    // Control del Loader (Buffering)
    video.addEventListener('waiting', () => videoLoader.classList.add('active'));
    video.addEventListener('playing', () => videoLoader.classList.remove('active'));
    video.addEventListener('canplay', () => videoLoader.classList.remove('active'));
}

function updateVolumeIcon() {
    const icon = muteBtn.querySelector('iconify-icon');
    if (video.muted || video.volume === 0) {
        icon.setAttribute('icon', 'lucide:volume-x');
    } else if (video.volume < 0.5) {
        icon.setAttribute('icon', 'lucide:volume-1');
    } else {
        icon.setAttribute('icon', 'lucide:volume-2');
    }
}

function togglePlay() {
    // Feedback visual para el botón central
    if (centerPlayBtn) {
        centerPlayBtn.classList.remove('animate');
        void centerPlayBtn.offsetWidth; // Truco para reiniciar la animación (reflow)
        centerPlayBtn.classList.add('animate');
        
        // Limpiamos la clase después de que termine la animación (500ms)
        setTimeout(() => {
            centerPlayBtn.classList.remove('animate');
        }, 500);
    }

    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

function updateProgress() {
    const percent = (video.currentTime / video.duration) * 100;
    progressBar.style.width = `${percent}%`;
    
    const current = formatTime(video.currentTime);
    const duration = formatTime(video.duration || 0);
    timeDisplay.textContent = `${current} / ${duration}`;
}

function seek(e) {
    const pos = (e.pageX - progressContainer.getBoundingClientRect().left) / progressContainer.offsetWidth;
    video.currentTime = pos * video.duration;
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

async function toggleFullscreen() {
    if (!document.fullscreenElement) {
        try {
            await videoWrapper.requestFullscreen();
            fullscreenBtn.innerHTML = '<iconify-icon icon="lucide:minimize" width="24"></iconify-icon>';
            
            // Intentar bloquear la orientación a horizontal
            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('landscape').catch(err => {
                    console.warn("El bloqueo de orientación fue rechazado o no es compatible:", err);
                });
            }
        } catch (err) {
            console.error("Error al intentar entrar en pantalla completa:", err);
        }
    } else {
        document.exitFullscreen();
        fullscreenBtn.innerHTML = '<iconify-icon icon="lucide:maximize" width="24"></iconify-icon>';
        
        // Desbloquear la orientación al salir
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
    }
}

function showControls() {
    const controls = document.getElementById('videoControls');
    controls.classList.add('active');
    videoWrapper.classList.remove('hide-cursor');
    
    clearTimeout(controlsTimeout);
    if (!video.paused) {
        controlsTimeout = setTimeout(() => {
            controls.classList.remove('active');
            videoWrapper.classList.add('hide-cursor');
        }, 3000);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    // Controles de teclado para adelantar/atrasar
    if (e.key === 'ArrowLeft') {
        video.currentTime -= 10;
        showControls(); // Mostrar controles brevemente después de buscar
    }
    if (e.key === 'ArrowRight') {
        video.currentTime += 10;
        showControls(); // Mostrar controles brevemente después de buscar
    }
});

init();