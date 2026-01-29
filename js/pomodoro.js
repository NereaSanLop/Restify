(function () {
    // Audio notifications - Sound Effect by "https://pixabay.com/es/users/dragon-studio-38165424/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=372476"
    const audioInicioDescanso = new Audio('assets/sounds/notificacion_ini_descanso.mp3');
    const audioInicioTrabajo = new Audio('assets/sounds/notificacion_ini_trabajo.mp3');
    
    // Helpers
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function formatSeconds(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return pad(m) + ':' + pad(sec);
    }
    // Emisor de eventos globales (work/rest start/stop)
    function emit(name) { document.dispatchEvent(new CustomEvent(name)); }
    
    // Reproducir notificación de audio
    function playNotification(audio) {
        audio.currentTime = 0;
        audio.play().catch(err => console.error('Error al reproducir audio:', err));
    }

    // Elements
    const q = id => document.getElementById(id);
    const qt1Min = q('qt1-min');
    const qt1Sec = q('qt1-sec');
    const qt2Min = q('qt2-min');
    const qt2Sec = q('qt2-sec');
    const qt1Display = q('qt1-display');
    const qt2Display = q('qt2-display');
    const startBtn = q('qt1-start');
    const pauseBtn = q('qt1-pause');
    const resetBtn = q('qt1-reset');
    const cycleCountInput = q('cycle-count');
    const inputsToToggle = [qt1Min, qt1Sec, qt2Min, qt2Sec, cycleCountInput];

    // State
    let intervalId = null;
    let currentPhase = 0; // 0 = stopped, 1 = trabajo (display1), 2 = descanso (display2)
    let rem1 = 0, rem2 = 0;
    let init1 = 0, init2 = 0;
    let cyclesInitial = 0;
    let cyclesLeft = 0;
    let isInitialized = false;

    function setInputsDisabled(disabled) {
        inputsToToggle.forEach(el => { if (el) el.disabled = Boolean(disabled); });
    }

    function readInputs() {
        let m1 = Math.max(0, parseInt(qt1Min.value || '0', 10));
        let s1 = Math.max(0, parseInt(qt1Sec.value || '0', 10));
        m1 += Math.floor(s1 / 60); s1 = s1 % 60;

        let m2 = Math.max(0, parseInt(qt2Min.value || '0', 10));
        let s2 = Math.max(0, parseInt(qt2Sec.value || '0', 10));
        m2 += Math.floor(s2 / 60); s2 = s2 % 60;

        init1 = m1 * 60 + s1;
        init2 = m2 * 60 + s2;
        rem1 = init1;
        rem2 = init2;

        cyclesInitial = Math.max(0, parseInt(cycleCountInput.value || '0', 10));
        cyclesLeft = cyclesInitial;
    }

    function renderAll() {
        qt1Display.textContent = formatSeconds(rem1);
        qt2Display.textContent = formatSeconds(rem2);
        cycleCountInput.value = cyclesLeft;
    }

    // Centraliza cambio de fase y emisión de eventos
    function updatePhase(newPhase) {
        if (currentPhase === newPhase) return;
        // Emit stop del anterior
        if (currentPhase === 1) emit('work:stop');
        if (currentPhase === 2) emit('rest:stop');

        currentPhase = newPhase;

        // Emit start del nuevo
        if (currentPhase === 1) emit('work:start');   // bloquea Sudoku
        else if (currentPhase === 2) emit('rest:start'); // desbloquea Sudoku
        else if (currentPhase === 0) {
        }
    }

    function handleCycleComplete() {
        cyclesLeft = Math.max(0, cyclesLeft - 1);
        cycleCountInput.value = cyclesLeft;

        if (cyclesLeft > 0 && (init1 > 0 || init2 > 0)) {
            rem1 = init1;
            rem2 = init2;
            qt1Display.textContent = formatSeconds(rem1);
            qt2Display.textContent = formatSeconds(rem2);
            if (rem1 > 0) updatePhase(1);
            else if (rem2 > 0) updatePhase(2);
            else endSequence();
        } else {
            endSequence();
        }
    }

    function tick() {
        if (currentPhase === 1) {
            if (rem1 > 0) {
                rem1--;
                qt1Display.textContent = formatSeconds(rem1);
            }
            if (rem1 === 0) {
                playNotification(audioInicioDescanso);
                if (rem2 > 0) {
                    updatePhase(2);
                } else {
                    handleCycleComplete();
                }
            }
        } else if (currentPhase === 2) {
            if (rem2 > 0) {
                rem2--;
                qt2Display.textContent = formatSeconds(rem2);
            }
            if (rem2 === 0) {
                playNotification(audioInicioTrabajo);
                handleCycleComplete();
            }
        }
    }

    function startSequence() {
        if (intervalId) return;
        if (!isInitialized) { readInputs(); isInitialized = true; }

        qt1Display.textContent = formatSeconds(rem1);
        qt2Display.textContent = formatSeconds(rem2);
        cycleCountInput.value = cyclesLeft;

        setInputsDisabled(true);

        if (currentPhase === 0) {
            if (rem1 > 0) updatePhase(1);
            else if (rem2 > 0) updatePhase(2);
            else {
                if (cyclesLeft > 0) handleCycleComplete();
                return;
            }
        } else {
            // Reanudación tras pausa: vuelve a emitir el start de la fase actual
            if (currentPhase === 1) emit('work:start');   // bloquea Sudoku
            else if (currentPhase === 2) emit('rest:start'); // desbloquea Sudoku
        }

        intervalId = setInterval(tick, 1000);
    }

    function stopInterval() {
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
    }

    function endSequence() {
        stopInterval();
        // Emit stop de la fase actual antes de ir a 0
        if (currentPhase === 1) emit('work:stop');
        else if (currentPhase === 2) emit('rest:stop');
        currentPhase = 0;
        isInitialized = false;
        setInputsDisabled(false);
    }

    function pauseSequence() {
        stopInterval();
        // Pausa: si estás en trabajo (display1) bloquea Sudoku; si estás en descanso (display2) no lo bloquees
        if (currentPhase === 1) {
            emit('work:stop');   // bloquea Sudoku
        }
    }

    function resetSequence() {
        endSequence();
        readInputs();
        renderAll();
        setInputsDisabled(false);
    }

    function attachInputSync(inpMin, inpSec, display, which) {
        const sync = () => {
            if (!intervalId) {
                let m = Math.max(0, parseInt(inpMin.value || '0', 10));
                let s = Math.max(0, parseInt(inpSec.value || '0', 10));
                m += Math.floor(s / 60); s = s % 60;
                const total = m * 60 + s;
                display.textContent = formatSeconds(total);
                if (which === 1) { init1 = total; rem1 = total; }
                if (which === 2) { init2 = total; rem2 = total; }
            }
        };
        inpMin.addEventListener('input', sync);
        inpSec.addEventListener('input', sync);
    }

    cycleCountInput.addEventListener('input', () => {
        if (!intervalId) {
            cyclesInitial = Math.max(0, parseInt(cycleCountInput.value || '0', 10));
            cyclesLeft = cyclesInitial;
            cycleCountInput.value = cyclesLeft;
        }
    });

    attachInputSync(qt1Min, qt1Sec, qt1Display, 1);
    attachInputSync(qt2Min, qt2Sec, qt2Display, 2);

    startBtn.addEventListener('click', startSequence);
    pauseBtn.addEventListener('click', pauseSequence);
    resetBtn.addEventListener('click', resetSequence);

    document.addEventListener('DOMContentLoaded', () => { readInputs(); renderAll(); });
    if (document.readyState !== 'loading') { readInputs(); renderAll(); }
})();