// Life OS - Módulo Pomodoro Completo
// Implementação completa baseada no script original

const Pomodoro = (() => {
    // Elementos DOM
    let timerDisplay, timerStatus, startBtn, pauseBtn, resetBtn;
    let focusTimeInput, shortBreakTimeInput, longBreakTimeInput;
    
    // Estado interno
    let timer, totalSeconds, isPaused = true;
    let currentCycle, pomodoroCount;
    let isInitialized = false;
    
    // Carregar configurações salvas
    const getTimes = () => {
        if (typeof Utils !== 'undefined') {
            return Utils.loadFromLocalStorage('pomodoroTimes', { focus: 25, shortBreak: 5, longBreak: 15 });
        }
        return JSON.parse(localStorage.getItem('pomodoroTimes') || '{"focus": 25, "shortBreak": 5, "longBreak": 15}');
    };
    
    // Salvar configurações
    const saveTimes = () => {
        const times = { 
            focus: parseInt(focusTimeInput?.value) || 25, 
            shortBreak: parseInt(shortBreakTimeInput?.value) || 5, 
            longBreak: parseInt(longBreakTimeInput?.value) || 15 
        };
        
        if (typeof Utils !== 'undefined') {
            Utils.saveToLocalStorage('pomodoroTimes', times);
        } else {
            localStorage.setItem('pomodoroTimes', JSON.stringify(times));
        }
        
        setTimerForCurrentCycle();
    };
    
    // Atualizar display do timer
    const updateDisplay = () => {
        if (!timerDisplay) return;
        
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        timerDisplay.textContent = timeString;
        document.title = `${timeString} - Life OS`;
        
        // Atualizar progresso visual se existir
        const times = getTimes();
        const max = (currentCycle === 'focus' ? times.focus : 
                    currentCycle === 'shortBreak' ? times.shortBreak : 
                    times.longBreak) * 60;
        const progressDeg = 360 * (1 - (totalSeconds / max));
        const ring = timerDisplay.parentElement;
        
        if (ring) {
            ring.style.setProperty('--progress', `${progressDeg}deg`);
        }
    };
    
    // Trocar ciclo (foco -> pausa -> foco)
    const switchCycle = () => {
        if (currentCycle === 'focus') {
            pomodoroCount++;
            currentCycle = (pomodoroCount % 4 === 0) ? 'longBreak' : 'shortBreak';
            
            // Notificar FocusExtras sobre sessão completa
            const times = getTimes();
            if (window.FocusExtras && typeof window.FocusExtras.onFocusSessionComplete === 'function') {
                window.FocusExtras.onFocusSessionComplete(times.focus);
            }
        } else {
            currentCycle = 'focus';
        }
        
        // Salvar estado
        if (typeof Utils !== 'undefined') {
            Utils.saveToLocalStorage('pomodoro_pomodoroCount', pomodoroCount);
            Utils.saveToLocalStorage('pomodoro_currentCycle', currentCycle);
        } else {
            localStorage.setItem('pomodoro_pomodoroCount', pomodoroCount.toString());
            localStorage.setItem('pomodoro_currentCycle', currentCycle);
        }
        
        setTimerForCurrentCycle();
    };
    
    // Configurar timer para ciclo atual
    const setTimerForCurrentCycle = () => {
        isPaused = true;
        clearInterval(timer);
        
        const times = getTimes();
        
        switch (currentCycle) {
            case 'focus':
                totalSeconds = times.focus * 60;
                if (timerStatus) timerStatus.textContent = "Hora de Focar!";
                break;
            case 'shortBreak':
                totalSeconds = times.shortBreak * 60;
                if (timerStatus) timerStatus.textContent = "Pausa Curta";
                break;
            case 'longBreak':
                totalSeconds = times.longBreak * 60;
                if (timerStatus) timerStatus.textContent = "Pausa Longa";
                break;
        }
        
        updateDisplay();
    };
    
    // Inicializar módulo
    const init = () => {
        if (isInitialized) return;
        
        try {
            // Obter referências DOM
            timerDisplay = document.getElementById('timer-display');
            timerStatus = document.getElementById('timer-status');
            startBtn = document.getElementById('start-btn');
            pauseBtn = document.getElementById('pause-btn');
            resetBtn = document.getElementById('reset-btn');
            focusTimeInput = document.getElementById('focus-time');
            shortBreakTimeInput = document.getElementById('short-break-time');
            longBreakTimeInput = document.getElementById('long-break-time');
            
            if (!timerDisplay || !timerStatus || !startBtn || !pauseBtn || !resetBtn) {
                console.error('❌ Elementos do Pomodoro não encontrados');
                return;
            }
            
            // Carregar estado salvo
            if (typeof Utils !== 'undefined') {
                currentCycle = Utils.loadFromLocalStorage('pomodoro_currentCycle', 'focus');
                pomodoroCount = Utils.loadFromLocalStorage('pomodoro_pomodoroCount', 0);
            } else {
                currentCycle = localStorage.getItem('pomodoro_currentCycle') || 'focus';
                pomodoroCount = parseInt(localStorage.getItem('pomodoro_pomodoroCount')) || 0;
            }
            
            // Configurar inputs de tempo se existirem
            const times = getTimes();
            if (focusTimeInput) {
                focusTimeInput.value = times.focus;
                focusTimeInput.addEventListener('change', saveTimes);
            }
            if (shortBreakTimeInput) {
                shortBreakTimeInput.value = times.shortBreak;
                shortBreakTimeInput.addEventListener('change', saveTimes);
            }
            if (longBreakTimeInput) {
                longBreakTimeInput.value = times.longBreak;
                longBreakTimeInput.addEventListener('change', saveTimes);
            }
            
            // Event listeners dos botões
            startBtn.addEventListener('click', () => {
                if (isPaused) {
                    isPaused = false;
                    timer = setInterval(() => {
                        if (--totalSeconds >= 0) {
                            updateDisplay();
                        } else {
                            switchCycle();
                        }
                    }, 1000);
                }
            });
            
            pauseBtn.addEventListener('click', () => {
                isPaused = true;
                clearInterval(timer);
            });
            
            resetBtn.addEventListener('click', setTimerForCurrentCycle);
            
            // Configurar timer inicial
            setTimerForCurrentCycle();
            
            isInitialized = true;
            console.log('✅ Pomodoro module initialized');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Pomodoro:', error);
        }
    };
    
    // Renderizar (atualizar display)
    const render = () => {
        if (isInitialized) {
            updateDisplay();
        }
    };
    
    // API pública
    return { 
        init, 
        render, 
        isInitialized: () => isInitialized 
    };
})();
