(function () {
    // Helpers
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function formatSeconds(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return pad(m) + ':' + pad(sec);
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
    // inputs que deben inhabilitarse/habilitarse
    const inputsToToggle = [qt1Min, qt1Sec, qt2Min, qt2Sec, cycleCountInput];

    // State
    let intervalId = null;
    let currentPhase = 0; // 0 = stopped, 1 = timer1, 2 = timer2
    let rem1 = 0, rem2 = 0;
    let init1 = 0, init2 = 0;
    let cyclesInitial = 0;
    let cyclesLeft = 0;
    let isInitialized = false; // si ya leímos inputs para iniciar la secuencia

    function setInputsDisabled(disabled) {
        inputsToToggle.forEach(el => {
            if (el) el.disabled = Boolean(disabled);
        });
    }

    function readInputs() {
        // Normalize seconds > 59
        let m1 = Math.max(0, parseInt(qt1Min.value || '0', 10));
        let s1 = Math.max(0, parseInt(qt1Sec.value || '0', 10));
        m1 += Math.floor(s1 / 60);
        s1 = s1 % 60;

        let m2 = Math.max(0, parseInt(qt2Min.value || '0', 10));
        let s2 = Math.max(0, parseInt(qt2Sec.value || '0', 10));
        m2 += Math.floor(s2 / 60);
        s2 = s2 % 60;

        init1 = m1 * 60 + s1;
        init2 = m2 * 60 + s2;
        rem1 = init1;
        rem2 = init2;

        // Read cycles (allow 0 in logic; input has min=1 but keep robust)
        cyclesInitial = Math.max(0, parseInt(cycleCountInput.value || '0', 10));
        cyclesLeft = cyclesInitial;
    }

    function renderAll() {
        qt1Display.textContent = formatSeconds(rem1);
        qt2Display.textContent = formatSeconds(rem2);
        // reflect remaining cycles in the input so user sees decrement
        cycleCountInput.value = cyclesLeft;
    }

    function handleCycleComplete() {
        // Called when both timers have reached 0
        // Decrement cycles and either reset times and continue or stop.
        cyclesLeft = Math.max(0, cyclesLeft - 1);
        cycleCountInput.value = cyclesLeft;

        if (cyclesLeft > 0 && (init1 > 0 || init2 > 0)) {
            // Reset timers to initial values and start again
            rem1 = init1;
            rem2 = init2;
            qt1Display.textContent = formatSeconds(rem1);
            qt2Display.textContent = formatSeconds(rem2);
            currentPhase = rem1 > 0 ? 1 : (rem2 > 0 ? 2 : 0);

            // If both inits are zero, stop to avoid infinite loop
            if (currentPhase === 0) {
                endSequence();
            }
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
                // switch to phase 2 if it has time
                if (rem2 > 0) {
                    currentPhase = 2;
                } else {
                    // both may be zero -> handle cycle completion
                    handleCycleComplete();
                }
            }
        } else if (currentPhase === 2) {
            if (rem2 > 0) {
                rem2--;
                qt2Display.textContent = formatSeconds(rem2);
            }
            if (rem2 === 0) {
                // cycle finished (both timers are 00:00 now)
                handleCycleComplete();
            }
        } else {
            // nothing
        }
    }

    function startSequence() {
        if (intervalId) return; // already running
        // Si no hemos inicializado (primera vez o tras reset), leer inputs.
        if (!isInitialized) {
            readInputs();
            isInitialized = true;
        }

        // show current remaining times
        qt1Display.textContent = formatSeconds(rem1);
        qt2Display.textContent = formatSeconds(rem2);
        cycleCountInput.value = cyclesLeft;

        // bloquear inputs al iniciar
        setInputsDisabled(true);

        // Si currentPhase está a 0 (por ejemplo tras pausa) elegir fase según rem
        if (currentPhase === 0) {
            if (rem1 > 0) currentPhase = 1;
            else if (rem2 > 0) currentPhase = 2;
            else {
                // ambos a 0 -> quizá quedan ciclos
                if (cyclesLeft > 0) {
                    handleCycleComplete();
                }
                return;
            }
        }

        intervalId = setInterval(tick, 1000);
    }

    // detiene el intervalo pero NO cambia currentPhase (útil para "pause")
    function stopInterval() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    // detiene todo y marca secuencia parada
    function endSequence() {
        stopInterval();
        currentPhase = 0;
        isInitialized = false;
        // al terminar la secuencia, permitir editar de nuevo
        setInputsDisabled(false);
    }

    function pauseSequence() {
        // pause: detener intervalo pero conservar currentPhase y rem*
        stopInterval();
    }

    function resetSequence() {
        endSequence();
        readInputs(); // reset to inputs (también establece cyclesLeft)
        renderAll();
        // asegurar que al reset se habilitan los inputs
        setInputsDisabled(false);
    }

    // Keep displays updated when changing inputs (only when stopped)
    function attachInputSync(inpMin, inpSec, display, which) {
        const sync = () => {
            if (!intervalId) {
                let m = Math.max(0, parseInt(inpMin.value || '0', 10));
                let s = Math.max(0, parseInt(inpSec.value || '0', 10));
                m += Math.floor(s / 60);
                s = s % 60;
                const total = m * 60 + s;
                display.textContent = formatSeconds(total);
                if (which === 1) { init1 = total; rem1 = total; }
                if (which === 2) { init2 = total; rem2 = total; }
            }
        };
        inpMin.addEventListener('input', sync);
        inpSec.addEventListener('input', sync);
    }

    // Update cycles input when changed (only when stopped)
    cycleCountInput.addEventListener('input', () => {
        if (!intervalId) {
            cyclesInitial = Math.max(0, parseInt(cycleCountInput.value || '0', 10));
            cyclesLeft = cyclesInitial;
            cycleCountInput.value = cyclesLeft;
        }
    });

    attachInputSync(qt1Min, qt1Sec, qt1Display, 1);
    attachInputSync(qt2Min, qt2Sec, qt2Display, 2);

    // Button events
    startBtn.addEventListener('click', startSequence);
    pauseBtn.addEventListener('click', pauseSequence);
    resetBtn.addEventListener('click', resetSequence);

    // initialize displays from inputs on load
    document.addEventListener('DOMContentLoaded', () => {
        readInputs();
        renderAll();
    });

    // If script runs after DOMContentLoaded, initialize immediately
    if (document.readyState !== 'loading') {
        readInputs();
        renderAll();
    }
})();