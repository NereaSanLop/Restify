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
        const SEEK_SECONDS = 10;

        if (!audio || !playBtn || !pauseBtn || !rewBtn || !fwdBtn || !progress || !progressBar) {
            console.error('Player: faltan elementos en el DOM. Asegúrate de que index.html contiene el markup del player con los ids correctos.');
            return;
        }

        let playlist = [];
        let currentIndex = 0;
        let isLoaded = false;

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
            audio.src = playlist[currentIndex];
            isLoaded = true;
            progressBar.style.width = '0%';
            progress.setAttribute('aria-valuenow', 0);
            if (autoplay) {
                // play puede estar bloqueado hasta interactuar; intentamos y silenciosamente ignoramos el fallo
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

        playBtn.addEventListener('click', () => playCurrent());
        pauseBtn.addEventListener('click', () => pauseCurrent());
        rewBtn.addEventListener('click', () => prevTrack());
        fwdBtn.addEventListener('click', () => nextTrack());

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', updateProgress);
        audio.addEventListener('ended', () => nextTrack(true));
        // si el src falla (404 u otro error), avanzar a la siguiente pista
        audio.addEventListener('error', (e) => {
            console.warn('player: error cargando pista, pasando a la siguiente.', e);
            // intentar siguiente pista para evitar quedarse bloqueado
            nextTrack(true);
        });

        progress.addEventListener('click', (e) => {
            if (!audio.duration || !isFinite(audio.duration)) return;
            const rect = progress.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, x / rect.width));
            audio.currentTime = pct * audio.duration;
            updateProgress();
        });

        // Cargar playlist al inicio (no bloqueante)
        ensurePlaylist().then(() => {
            if (playlist.length) loadTrack(0, false);
        });

        window._simplePlayer = { audio, playlist, loadTrack, nextTrack, prevTrack, updateProgress };
    });
})();