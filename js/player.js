// Reproductor simple con playlist desde assets/music y loop al final -> primera
(function () {
    document.addEventListener('DOMContentLoaded', () => {
        const audio = document.getElementById('audio');
        const playBtn = document.getElementById('player-play');
        const pauseBtn = document.getElementById('player-pause');
        const rewBtn = document.getElementById('player-rew');
        const fwdBtn = document.getElementById('player-fwd');
        const progress = document.getElementById('player-progress');
        const progressBar = document.getElementById('player-progress-bar');
        const playerTrack = document.getElementById('player-track');
        const SEEK_SECONDS = 10;

        if (!audio || !playBtn || !pauseBtn || !rewBtn || !fwdBtn || !progress || !progressBar) {
            console.error('Player: faltan elementos en el DOM. Asegúrate de que index.html contiene el markup del player con los ids correctos.');
            return;
        }

        let playlist = [];
        let currentIndex = 0;
        let isLoaded = false;
        let isDragging = false; // Variable para controlar el arrastre

        function setButtonsEnabled(enabled) {
            [playBtn, pauseBtn, rewBtn, fwdBtn].forEach(b => b.disabled = !enabled);
        }

        // mantener siempre habilitados (según petición)
        setButtonsEnabled(true);

        function updateProgress() {
            if (!audio.duration || !isFinite(audio.duration)) return;
            const pct = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = Math.max(0, Math.min(100, pct)) + '%';
            progress.setAttribute('aria-valuenow', Math.floor(pct));
        }

        function loadPlaylistFromJson() {
            return fetch('assets/music/playlist.json')
                .then(r => { if (!r.ok) throw new Error('no playlist'); return r.json(); })
                .then(data => Array.isArray(data) ? data : [])
                .catch(err => {
                    console.info('player: no se cargó playlist.json (fallback).', err.message);
                    return [];
                });
        }

        function loadDefaultFallback() {
            // rutas relativas desde la página: assets/music/...
            return [
                'assets/music/song1.mp3',
                'assets/music/song2.mp3'
            ];
        }

        async function ensurePlaylist() {
            if (playlist.length) return;
            const remote = await loadPlaylistFromJson();
            playlist = remote.length ? remote : loadDefaultFallback();
            if (!playlist.length) console.warn('player: playlist vacía; añade archivos en assets/music o crea assets/music/playlist.json');
        }

        function loadTrack(index, autoplay = false) {
            if (!playlist.length) return;
            currentIndex = ((index % playlist.length) + playlist.length) % playlist.length;

            // Soporte para playlist con strings u objetos { src, title }
            const entry = playlist[currentIndex];
            const src = typeof entry === 'string' ? entry : (entry && entry.src) ? entry.src : '';
            const title = (entry && (entry.title || entry.name)) ? (entry.title || entry.name) : null;

            if (!src) return;

            // Guarda título en data-title si viene en la playlist
            if (title) {
                audio.dataset.title = title;
            } else {
                delete audio.dataset.title;
            }

            audio.src = src;

            // Actualiza el nombre de la pista de inmediato
            updateTrackName();

            isLoaded = true;
            progressBar.style.width = '0%';
            progress.setAttribute('aria-valuenow', 0);
            if (autoplay) {
                audio.play().catch(e => { console.info('player: autoplay bloqueado hasta interacción del usuario.'); });
            }
        }

        function playCurrent() {
            if (!isLoaded) {
                ensurePlaylist().then(() => {
                    if (!playlist.length) return;
                    loadTrack(0, true);
                });
                return;
            }
            audio.play().catch(e => {
                console.info('player: play() falló:', e && e.message);
            });
        }

        function pauseCurrent() { audio.pause(); }

        function nextTrack(autoplay = true) {
            if (!playlist.length) return;
            loadTrack(currentIndex + 1, autoplay);
        }

        function prevTrack(autoplay = true) {
            if (!playlist.length) return;
            loadTrack(currentIndex - 1, autoplay);
        }

        function extractFileName(url) {
            try {
                const u = new URL(url, window.location.href);
                const name = u.pathname.substring(u.pathname.lastIndexOf('/') + 1);
                return decodeURIComponent(name) || 'Unknown';
            } catch (e) {
                return url || 'Unknown';
            }
        }

        function updateTrackName() {
            if (!playerTrack) return;
            if (!audio || !audio.src) {
                playerTrack.textContent = 'No song selected';
                return;
            }
            const title = audio.dataset && audio.dataset.title ? audio.dataset.title : extractFileName(audio.src);
            playerTrack.textContent = title;
        }

        // Función para actualizar posición según click/arrastre
        function seekToPosition(e) {
            if (!audio.duration || !isFinite(audio.duration)) return;
            const rect = progress.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, x / rect.width));
            audio.currentTime = pct * audio.duration;
            updateProgress();
        }

        // Event listeners botones
        playBtn.addEventListener('click', () => playCurrent());
        pauseBtn.addEventListener('click', () => pauseCurrent());
        rewBtn.addEventListener('click', () => prevTrack());
        fwdBtn.addEventListener('click', () => nextTrack());

        // Event listeners del audio
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', () => {
            updateProgress();
            updateTrackName();
        });
        audio.addEventListener('loadstart', updateTrackName);
        audio.addEventListener('ended', () => nextTrack(true));
        audio.addEventListener('error', (e) => {
            console.warn('player: error cargando pista, pasando a la siguiente.', e);
            nextTrack(true);
        });

        // Event listeners para barra de progreso - ARRASTRE
        progress.addEventListener('mousedown', (e) => {
            isDragging = true;
            seekToPosition(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                seekToPosition(e);
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Soporte para dispositivos táctiles
        progress.addEventListener('touchstart', (e) => {
            isDragging = true;
            const touch = e.touches[0];
            seekToPosition(touch);
        });

        document.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches.length > 0) {
                const touch = e.touches[0];
                seekToPosition(touch);
            }
        });

        document.addEventListener('touchend', () => {
            isDragging = false;
        });

        // Cargar playlist al inicio (no bloqueante)
        ensurePlaylist().then(() => {
            if (playlist.length) loadTrack(0, false);
        });

        window._simplePlayer = { audio, playlist, loadTrack, nextTrack, prevTrack, updateProgress };
    });
})();

// Control de volumen y mute
(function() {
    const audio = document.getElementById('audio');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-value');
    const muteBtn = document.getElementById('mute-btn');
    let previousVolume = 100;

    // Configurar volumen inicial
    if (audio && volumeSlider) {
        audio.volume = 1.0;
        volumeSlider.value = 100;
        if (volumeValue) volumeValue.textContent = '100%';
    }

    // Control del slider de volumen
    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            if (audio) {
                audio.volume = volume;
                previousVolume = e.target.value;
                if (volumeValue) volumeValue.textContent = `${e.target.value}%`;
                
                // Actualizar icono del botón mute
                if (volume === 0) {
                    muteBtn.classList.remove('volume-btn-on');
                    muteBtn.classList.add('volume-btn-off');
                } else {
                    muteBtn.classList.remove('volume-btn-off');
                    muteBtn.classList.add('volume-btn-on');
                }
            }
        });
    }

    // Botón de mute/unmute
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            if (audio.volume > 0) {
                // Mutear
                previousVolume = volumeSlider.value;
                audio.volume = 0;
                volumeSlider.value = 0;
                if (volumeValue) volumeValue.textContent = '0%';
                muteBtn.classList.remove('volume-btn-on');
                muteBtn.classList.add('volume-btn-off');
                muteBtn.title = 'Activar sonido';
            } else {
                // Desmutear
                const restoreVolume = previousVolume || 100;
                audio.volume = restoreVolume / 100;
                volumeSlider.value = restoreVolume;
                if (volumeValue) volumeValue.textContent = `${restoreVolume}%`;
                muteBtn.classList.remove('volume-btn-off');
                muteBtn.classList.add('volume-btn-on');
                muteBtn.title = 'Silenciar';
            }
        });
    }
})();