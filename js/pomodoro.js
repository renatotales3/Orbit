/**
 * MÓDULO POMODORO
 * 
 * Responsabilidades:
 * - Timer Pomodoro com ciclos de foco e pausa
 * - Controle de tempo personalizável
 * - Persistência de estado
 * - Integração com sistema de foco
 * 
 * Refatoração aplicada:
 * - Separação de responsabilidades
 * - Nomes de variáveis mais descritivos
 * - Comentários explicativos
 * - Lógica de timer otimizada
 * - Código ES6+ moderno
 */

const Pomodoro = (() => {
    
    // ===== ELEMENTOS DOM =====
    const timerDisplay = document.getElementById('timer-display');
    const timerStatus = document.getElementById('timer-status');
    const startButton = document.getElementById('start-btn');
    const pauseButton = document.getElementById('pause-btn');
    const resetButton = document.getElementById('reset-btn');
    const focusTimeInput = document.getElementById('focus-time');
    const shortBreakTimeInput = document.getElementById('short-break-time');
    const longBreakTimeInput = document.getElementById('long-break-time');
    
    // ===== ESTADO =====
    let timerInterval = null;
    let totalSeconds = 0;
    let isPaused = true;
    let currentCycle = Utils.loadFromLocalStorage('pomodoro_currentCycle', 'focus');
    let pomodoroCount = Utils.loadFromLocalStorage('pomodoro_pomodoroCount', 0);
    
    // ===== CONFIGURAÇÕES =====
    const DEFAULT_TIMES = {
        focus: 25,
        shortBreak: 5,
        longBreak: 15
    };
    
    // ===== GERENCIAMENTO DE TEMPOS =====
    
    /**
     * Obtém os tempos salvos ou usa padrões
     * @returns {Object} Objeto com tempos em minutos
     */
    const getTimes = () => {
        return Utils.loadFromLocalStorage('pomodoroTimes', DEFAULT_TIMES);
    };
    
    /**
     * Salva os tempos configurados
     */
    const saveTimes = () => {
        const times = {
            focus: parseInt(focusTimeInput.value) || DEFAULT_TIMES.focus,
            shortBreak: parseInt(shortBreakTimeInput.value) || DEFAULT_TIMES.shortBreak,
            longBreak: parseInt(longBreakTimeInput.value) || DEFAULT_TIMES.longBreak
        };
        
        Utils.saveToLocalStorage('pomodoroTimes', times);
        setTimerForCurrentCycle();
    };
    
    // ===== CONTROLE DE TIMER =====
    
    /**
     * Atualiza a exibição do timer
     */
    const updateDisplay = () => {
        if (!timerDisplay) return;
        
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Atualiza display
        timerDisplay.textContent = timeString;
        
        // Atualiza título da página
        document.title = `${timeString} - Orbit`;
        
        // Atualiza progresso visual
        updateProgressRing();
    };
    
    /**
     * Atualiza o anel de progresso visual
     */
    const updateProgressRing = () => {
        const times = getTimes();
        let maxSeconds = 0;
        
        // Determina tempo máximo baseado no ciclo atual
        switch (currentCycle) {
            case 'focus':
                maxSeconds = times.focus * 60;
                break;
            case 'shortBreak':
                maxSeconds = times.shortBreak * 60;
                break;
            case 'longBreak':
                maxSeconds = times.longBreak * 60;
                break;
        }
        
        // Calcula progresso em graus (360° = completo)
        const progressDegrees = 360 * (1 - (totalSeconds / maxSeconds));
        const ring = timerDisplay.parentElement;
        
        if (ring) {
            ring.style.setProperty('--progress', `${progressDegrees}deg`);
        }
    };
    
    /**
     * Troca para o próximo ciclo
     */
    const switchCycle = () => {
        if (currentCycle === 'focus') {
            // Incrementa contador de pomodoros
            pomodoroCount++;
            
            // Decide se é pausa longa (a cada 4 pomodoros)
            currentCycle = (pomodoroCount % 4 === 0) ? 'longBreak' : 'shortBreak';
            
            // Notifica conclusão da sessão de foco
            const times = getTimes();
            FocusExtras.onFocusSessionComplete(times.focus);
        } else {
            // Volta para o foco
            currentCycle = 'focus';
        }
        
        // Salva estado
        Utils.saveToLocalStorage('pomodoro_pomodoroCount', pomodoroCount);
        Utils.saveToLocalStorage('pomodoro_currentCycle', currentCycle);
        
        // Configura timer para o novo ciclo
        setTimerForCurrentCycle();
    };
    
    /**
     * Configura o timer para o ciclo atual
     */
    const setTimerForCurrentCycle = () => {
        // Para o timer atual
        isPaused = true;
        clearInterval(timerInterval);
        
        const times = getTimes();
        
        // Define tempo baseado no ciclo
        switch (currentCycle) {
            case 'focus':
                totalSeconds = times.focus * 60;
                timerStatus.textContent = "Hora de Focar!";
                break;
            case 'shortBreak':
                totalSeconds = times.shortBreak * 60;
                timerStatus.textContent = "Pausa Curta";
                break;
            case 'longBreak':
                totalSeconds = times.longBreak * 60;
                timerStatus.textContent = "Pausa Longa";
                break;
        }
        
        updateDisplay();
    };
    
    // ===== CONTROLES DE TIMER =====
    
    /**
     * Inicia o timer
     */
    const startTimer = () => {
        if (isPaused) {
            isPaused = false;
            
            timerInterval = setInterval(() => {
                if (--totalSeconds >= 0) {
                    updateDisplay();
                } else {
                    switchCycle();
                }
            }, 1000);
        }
    };
    
    /**
     * Pausa o timer
     */
    const pauseTimer = () => {
        isPaused = true;
        clearInterval(timerInterval);
    };
    
    /**
     * Reseta o timer para o ciclo atual
     */
    const resetTimer = () => {
        setTimerForCurrentCycle();
    };
    
    // ===== EVENT HANDLERS =====
    
    /**
     * Handler para mudança nos inputs de tempo
     */
    const handleTimeInputChange = () => {
        saveTimes();
    };
    
    /**
     * Handler para botão de iniciar
     */
    const handleStartClick = () => {
        startTimer();
    };
    
    /**
     * Handler para botão de pausar
     */
    const handlePauseClick = () => {
        pauseTimer();
    };
    
    /**
     * Handler para botão de resetar
     */
    const handleResetClick = () => {
        resetTimer();
    };
    
    // ===== INICIALIZAÇÃO =====
    
    /**
     * Configura valores iniciais dos inputs
     */
    const setupTimeInputs = () => {
        const times = getTimes();
        
        focusTimeInput.value = times.focus;
        shortBreakTimeInput.value = times.shortBreak;
        longBreakTimeInput.value = times.longBreak;
    };
    
    /**
     * Configura event listeners
     */
    const setupEventListeners = () => {
        // Inputs de tempo
        focusTimeInput.addEventListener('change', handleTimeInputChange);
        shortBreakTimeInput.addEventListener('change', handleTimeInputChange);
        longBreakTimeInput.addEventListener('change', handleTimeInputChange);
        
        // Botões de controle
        startButton.addEventListener('click', handleStartClick);
        pauseButton.addEventListener('click', handlePauseClick);
        resetButton.addEventListener('click', handleResetClick);
    };
    
    /**
     * Inicializa o módulo Pomodoro
     */
    const init = () => {
        setupTimeInputs();
        setupEventListeners();
        setTimerForCurrentCycle();
    };
    
    // ===== EXPOSIÇÃO PÚBLICA =====
    
    return {
        init
    };
})();

// Exporta para uso global
window.Pomodoro = Pomodoro;