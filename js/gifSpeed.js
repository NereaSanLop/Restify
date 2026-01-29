document.addEventListener('DOMContentLoaded', () => {
    const speedSlider = document.getElementById('gif-speed');
    const speedValue = document.getElementById('speed-value');
    
    // Crear elemento video
    const video = document.createElement('video');
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.style.position = 'fixed';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.zIndex = '-1';
    
    // Detectar tema
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    video.src = isDarkMode ? 'assets/img/pinkbasegif.webm' : 'assets/img/bluebasegif.webm';
    
    document.body.insertBefore(video, document.body.firstChild);
    document.body.style.backgroundImage = 'none';
    
    // Controlar velocidad
    speedSlider.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        speedValue.textContent = `${speed.toFixed(1)}x`;
        video.playbackRate = speed;
    });
});