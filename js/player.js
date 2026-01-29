// Reproductor simple con playlist desde assets/music y loop al final -> primera
(function () {
    let _playerInitDone = false;
    let _playerInitRetries = 0;

    function initPlayer() {
        if (_playerInitDone) return;

        const audio = document.getElementById('audio');
        const playPauseBtn = document.getElementById('player-play-pause');
        const rewBtn = document.getElementById('player-rew');
        const fwdBtn = document.getElementById('player-fwd');
        const progress = document.getElementById('player-progress');
        const progressBar = document.getElementById('player-progress-bar');
        const playerTrack = document.getElementById('player-track');
        const SEEK_SECONDS = 10;

        if (!audio || !playPauseBtn || !rewBtn || !fwdBtn || !progress || !progressBar) {
            if (_playerInitRetries < 20) {
                _playerInitRetries++;
                setTimeout(initPlayer, 100);
                return;
            }
            console.error('Player: faltan elementos en el DOM. Asegúrate de que index.html contiene el markup del player con los ids correctos.');
            return;
        }

        _playerInitDone = true;

        let playlist = [];
        let currentIndex = 0;
        let isLoaded = false;
        let isDragging = false;

        function setButtonsEnabled(enabled) {
            [playPauseBtn, rewBtn, fwdBtn].forEach(b => b.disabled = !enabled);
        }

        setButtonsEnabled(true);

        function updatePlayPauseButton() {
            if (audio.paused) {
                playPauseBtn.classList.remove('player-btn-pause');
                playPauseBtn.classList.add('player-btn-play');
                playPauseBtn.title = 'Reproducir';
                playPauseBtn.setAttribute('aria-label', 'Reproducir');
            } else {
                playPauseBtn.classList.remove('player-btn-play');
                playPauseBtn.classList.add('player-btn-pause');
                playPauseBtn.title = 'Pausar';
                playPauseBtn.setAttribute('aria-label', 'Pausar');
            }
        }

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

            const entry = playlist[currentIndex];
            const src = typeof entry === 'string' ? entry : (entry && entry.src) ? entry.src : '';
            const title = (entry && (entry.title || entry.name)) ? (entry.title || entry.name) : null;

            if (!src) return;

            if (title) {
                audio.dataset.title = title;
            } else {
                delete audio.dataset.title;
            }

            audio.src = src;
            updateTrackName();

            isLoaded = true;
            progressBar.style.width = '0%';
            progress.setAttribute('aria-valuenow', 0);
            if (autoplay) {
                audio.play().catch(e => { console.info('player: autoplay bloqueado hasta interacción del usuario.'); });
            }
        }

        function togglePlayPause() {
            if (!isLoaded) {
                ensurePlaylist().then(() => {
                    if (!playlist.length) return;
                    loadTrack(0, true);
                });
                return;
            }

            if (audio.paused) {
                audio.play().catch(e => {
                    console.info('player: play() falló:', e && e.message);
                });
            } else {
                audio.pause();
            }
        }

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

        function seekToPosition(e) {
            if (!audio.duration || !isFinite(audio.duration)) return;
            const rect = progress.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, x / rect.width));
            audio.currentTime = pct * audio.duration;
            updateProgress();
        }

        // Event listeners botones
        playPauseBtn.addEventListener('click', () => togglePlayPause());
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

        // Actualizar botón cuando cambia el estado de reproducción
        audio.addEventListener('play', updatePlayPauseButton);
        audio.addEventListener('pause', updatePlayPauseButton);

        // Event listeners para barra de progreso
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

        // Cargar playlist al inicio
        ensurePlaylist().then(() => {
            if (playlist.length) {
                loadTrack(0, false);
                updatePlayPauseButton(); // Inicializar el botón en estado pause
            }
        });

        window._simplePlayer = { audio, playlist, loadTrack, nextTrack, prevTrack, updateProgress };
    }

    if (document.readyState !== 'loading') {
        initPlayer();
    } else {
        document.addEventListener('DOMContentLoaded', initPlayer);
    }
})();

// Control de volumen y mute
(function() {
    function initVolumeControls() {
        const audio = document.getElementById('audio');
        const volumeSlider = document.getElementById('volume-slider');
        const volumeValue = document.getElementById('volume-value');
        const muteBtn = document.getElementById('mute-btn');
        let previousVolume = 100;

        if (audio && volumeSlider) {
            audio.volume = 1.0;
            volumeSlider.value = 100;
            if (volumeValue) volumeValue.textContent = '100%';
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                if (audio) {
                    audio.volume = volume;
                    previousVolume = e.target.value;
                    if (volumeValue) volumeValue.textContent = `${e.target.value}%`;
                    
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

        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                if (audio.volume > 0) {
                    previousVolume = volumeSlider.value;
                    audio.volume = 0;
                    volumeSlider.value = 0;
                    if (volumeValue) volumeValue.textContent = '0%';
                    muteBtn.classList.remove('volume-btn-on');
                    muteBtn.classList.add('volume-btn-off');
                    muteBtn.title = 'Activar sonido';
                } else {
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
    }

    if (document.readyState !== 'loading') {
        initVolumeControls();
    } else {
        document.addEventListener('DOMContentLoaded', initVolumeControls);
    }
})();