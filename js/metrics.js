/**
 * MÓDULO DE MÉTRICAS (Hidratação e Sono)
 * 
 * Responsabilidades:
 * - Rastreamento de hidratação diária
 * - Registro de sono e qualidade
 * - Resumo semanal de métricas
 * - Histórico de dados
 * 
 * Refatoração aplicada:
 * - Separação de responsabilidades
 * - Nomes de variáveis mais descritivos
 * - Comentários explicativos
 * - Lógica de cálculos otimizada
 * - Código ES6+ moderno
 */

const Metrics = (() => {
    
    // ===== ELEMENTOS DOM - HIDRATAÇÃO =====
    const waterGoalInput = document.getElementById('water-goal');
    const waterCupMlInput = document.getElementById('water-cup-ml');
    const decreaseWaterButton = document.getElementById('decrease-water-btn');
    const increaseWaterButton = document.getElementById('increase-water-btn');
    const waterCountElement = document.getElementById('water-count');
    const waterGoalTextElement = document.getElementById('water-goal-text');
    const waterProgressElement = document.getElementById('water-progress');
    const waterFeedbackElement = document.getElementById('water-feedback');
    
    // ===== ELEMENTOS DOM - SONO =====
    const sleepTrackerElement = document.querySelector('.sleep-tracker-card');
    const sleepForm = document.getElementById('sleep-form');
    const bedTimeInput = document.getElementById('bed-time');
    const wakeTimeInput = document.getElementById('wake-time');
    const sleepTotalElement = document.getElementById('sleep-total');
    const sleepFeedbackElement = document.getElementById('sleep-feedback');
    const editSleepButton = document.getElementById('edit-sleep-btn');
    
    // ===== ELEMENTOS DOM - HISTÓRICO =====
    const waterHistoryButton = document.getElementById('water-history-btn');
    const sleepHistoryButton = document.getElementById('sleep-history-btn');
    const historyModal = document.getElementById('metrics-history-modal');
    const historyTitle = document.getElementById('metrics-history-title');
    const historyList = document.getElementById('metrics-history-list');
    const closeHistoryButton = document.getElementById('close-metrics-history-btn');
    const closeHistoryButtonX = document.getElementById('close-metrics-history-btn-x');
    
    // ===== ELEMENTOS DOM - RESUMO SEMANAL =====
    const weeklySummaryList = document.getElementById('weekly-summary-list');
    const weeklyShareButton = document.getElementById('share-weekly-summary-btn');
    
    // ===== CONFIGURAÇÕES =====
    const WATER_FEEDBACK = {
        0: "Vamos começar o dia bem hidratado!",
        25: "Bom começo! Continue assim.",
        50: "Você está na metade do caminho!",
        75: "Quase lá, falta pouco!",
        100: "Meta atingida! Você mandou bem!"
    };
    
    const SLEEP_FEEDBACK = {
        4: "Um sono muito curto. Tente descansar mais hoje.",
        6: "Um pouco abaixo do ideal. Que tal ir para a cama mais cedo?",
        9: "Ótima noite de sono! Isso vai te dar energia para o dia.",
        12: "Um sono longo e restaurador! Seu corpo agradece."
    };
    
    // ===== ESTADO =====
    let waterGoal = Utils.loadFromLocalStorage('waterGoal', 8);
    let waterCupMl = Utils.loadFromLocalStorage('waterCupMl', 250);
    
    // ===== UTILITÁRIOS =====
    
    /**
     * Obtém feedback baseado em valor e limiares
     * @param {number} value - Valor atual
     * @param {Object} thresholds - Objeto com limiares e mensagens
     * @returns {string} Mensagem de feedback
     */
    const getFeedback = (value, thresholds) => {
        const keys = Object.keys(thresholds).map(Number).sort((a, b) => a - b);
        let message = thresholds[0];
        
        for (const key of keys) {
            if (value >= key) {
                message = thresholds[key];
            }
        }
        
        return message;
    };
    
    /**
     * Calcula diferença entre dois horários
     * @param {string} startTime - Horário de início (HH:MM)
     * @param {string} endTime - Horário de fim (HH:MM)
     * @returns {number} Diferença em minutos
     */
    const calculateTimeDifference = (startTime, endTime) => {
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        let startTotalMinutes = startHour * 60 + startMinute;
        let endTotalMinutes = endHour * 60 + endMinute;
        
        // Se o horário de fim é menor que o de início, passou para o dia seguinte
        if (endTotalMinutes < startTotalMinutes) {
            endTotalMinutes += 24 * 60;
        }
        
        return endTotalMinutes - startTotalMinutes;
    };
    
    // ===== RENDERIZAÇÃO - HIDRATAÇÃO =====
    
    /**
     * Renderiza dados de hidratação
     */
    const renderHydration = () => {
        const todayData = DailyData.getTodayData();
        const waterCount = todayData.water || 0;
        
        // Atualiza contador
        waterCountElement.textContent = waterCount;
        
        // Calcula e exibe totais em ml
        const totalMl = waterCount * waterCupMl;
        const goalMl = waterGoal * waterCupMl;
        waterGoalTextElement.textContent = `= ${totalMl} ml / ${goalMl} ml`;
        
        // Calcula e exibe progresso
        const waterPercentage = Math.min(100, (waterCount / waterGoal) * 100);
        waterProgressElement.value = waterPercentage;
        
        // Exibe feedback
        waterFeedbackElement.textContent = getFeedback(waterPercentage, WATER_FEEDBACK);
    };
    
    // ===== RENDERIZAÇÃO - SONO =====
    
    /**
     * Renderiza dados de sono
     */
    const renderSleep = () => {
        const todayData = DailyData.getTodayData();
        
        if (todayData.sleep) {
            sleepTrackerElement.classList.add('answered');
            
            const hours = Math.floor(todayData.sleep.totalMinutes / 60);
            const minutes = todayData.sleep.totalMinutes % 60;
            sleepTotalElement.textContent = `${hours}h ${minutes}m`;
            
            const quality = todayData.sleep.quality 
                ? ` • Qualidade: ${todayData.sleep.quality}/5` 
                : '';
            sleepFeedbackElement.textContent = `${getFeedback(hours, SLEEP_FEEDBACK)}${quality}`;
        } else {
            sleepTrackerElement.classList.remove('answered');
            sleepForm.reset();
        }
        
        renderSleepWeekBars();
    };
    
    /**
     * Renderiza barras da semana de sono
     */
    const renderSleepWeekBars = () => {
        const container = document.getElementById('sleep-week-bars');
        if (!container) return;
        
        const allData = DailyData.getAllData();
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        
        const days = [];
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            const dateKey = day.toISOString().split('T')[0];
            
            const entry = allData.find(data => data.date === dateKey);
            const minutes = entry?.sleep?.totalMinutes || 0;
            const hours = Math.round(minutes / 60);
            
            // Determina nível baseado nas horas de sono
            let level = 'lv1'; // < 5h
            if (hours >= 7 && hours < 8) level = 'lv3';
            else if (hours >= 8) level = 'lv4';
            else if (hours >= 5) level = 'lv2';
            
            days.push(`<div class="sleep-week-bar ${level}" title="${hours}h"></div>`);
        }
        
        container.innerHTML = days.join('');
    };
    
    // ===== RENDERIZAÇÃO - RESUMO SEMANAL =====
    
    /**
     * Calcula dados do resumo semanal
     * @returns {Object} Dados calculados
     */
    const calculateWeeklyData = () => {
        const allData = DailyData.getAllData();
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        
        // Filtra dados da última semana
        const weekData = allData.filter(data => 
            new Date(data.date) >= new Date(start.toISOString().split('T')[0])
        );
        
        // Calcula hidratação
        const totalWater = weekData.reduce((sum, data) => sum + (data.water || 0), 0);
        const totalWaterMl = totalWater * waterCupMl;
        
        // Calcula média de sono
        const sleepMinutes = weekData
            .filter(data => data.sleep)
            .map(data => data.sleep.totalMinutes);
        
        let sleepAverage = '-';
        if (sleepMinutes.length > 0) {
            const avgMinutes = Math.round(sleepMinutes.reduce((sum, min) => sum + min, 0) / sleepMinutes.length);
            const hours = Math.floor(avgMinutes / 60);
            const minutes = avgMinutes % 60;
            sleepAverage = `${hours}h ${minutes}m`;
        }
        
        // Calcula estatísticas de foco
        const focusStats = Utils.loadFromLocalStorage('focusStats', { sessions: [] });
        const focusWeekData = focusStats.sessions.filter(session => 
            new Date(session.date) >= new Date(start.toISOString().split('T')[0])
        );
        
        const focusMinutes = focusWeekData.reduce((sum, session) => sum + (session.minutes || 0), 0);
        const focusSessions = focusWeekData.length;
        
        // Calcula média de humor
        const moodValues = weekData
            .map(data => Number(data.mood || 0))
            .filter(value => value > 0);
        
        let moodAverage = '-';
        if (moodValues.length > 0) {
            const avgMood = (moodValues.reduce((sum, value) => sum + value, 0) / moodValues.length).toFixed(1);
            moodAverage = `${avgMood}/5`;
        }
        
        return {
            totalWater,
            totalWaterMl,
            sleepAverage,
            focusMinutes,
            focusSessions,
            moodAverage
        };
    };
    
    /**
     * Renderiza resumo semanal
     */
    const renderWeeklySummary = () => {
        if (!weeklySummaryList) return;
        
        const data = calculateWeeklyData();
        
        weeklySummaryList.innerHTML = `
            <div class="summary-item">
                <span class="summary-label">Água consumida:</span>
                <span class="summary-value">${data.totalWater} copos (${data.totalWaterMl}ml)</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Média de sono:</span>
                <span class="summary-value">${data.sleepAverage}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Tempo de foco:</span>
                <span class="summary-value">${data.focusMinutes}min (${data.focusSessions} sessões)</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Humor médio:</span>
                <span class="summary-value">${data.moodAverage}</span>
            </div>
        `;
    };
    
    // ===== GERENCIAMENTO DE HIDRATAÇÃO =====
    
    /**
     * Aumenta contador de água
     */
    const increaseWater = () => {
        const todayData = DailyData.getTodayData();
        todayData.water = (todayData.water || 0) + 1;
        DailyData.saveData();
        renderHydration();
    };
    
    /**
     * Diminui contador de água
     */
    const decreaseWater = () => {
        const todayData = DailyData.getTodayData();
        if (todayData.water > 0) {
            todayData.water--;
            DailyData.saveData();
            renderHydration();
        }
    };
    
    /**
     * Salva configurações de hidratação
     */
    const saveHydrationSettings = () => {
        waterGoal = parseInt(waterGoalInput.value) || 8;
        waterCupMl = parseInt(waterCupMlInput.value) || 250;
        
        Utils.saveToLocalStorage('waterGoal', waterGoal);
        Utils.saveToLocalStorage('waterCupMl', waterCupMl);
        
        renderHydration();
    };
    
    // ===== GERENCIAMENTO DE SONO =====
    
    /**
     * Salva dados de sono
     * @param {Event} event - Evento de submissão
     */
    const saveSleepData = (event) => {
        event.preventDefault();
        
        const bedTime = bedTimeInput.value;
        const wakeTime = wakeTimeInput.value;
        
        if (!bedTime || !wakeTime) {
            alert('Por favor, preencha ambos os horários.');
            return;
        }
        
        const totalMinutes = calculateTimeDifference(bedTime, wakeTime);
        
        const todayData = DailyData.getTodayData();
        todayData.sleep = {
            bedTime,
            wakeTime,
            totalMinutes
        };
        
        DailyData.saveData();
        renderSleep();
    };
    
    /**
     * Edita dados de sono
     */
    const editSleep = () => {
        const todayData = DailyData.getTodayData();
        
        if (todayData.sleep) {
            bedTimeInput.value = todayData.sleep.bedTime;
            wakeTimeInput.value = todayData.sleep.wakeTime;
        }
        
        sleepTrackerElement.classList.remove('answered');
    };
    
    // ===== GERENCIAMENTO DE HISTÓRICO =====
    
    /**
     * Abre modal de histórico
     * @param {string} type - Tipo de histórico ('water' ou 'sleep')
     */
    const openHistoryModal = (type) => {
        const allData = DailyData.getAllData();
        const title = type === 'water' ? 'Histórico de Hidratação' : 'Histórico de Sono';
        
        historyTitle.textContent = title;
        
        const historyItems = allData
            .filter(data => type === 'water' ? data.water : data.sleep)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(data => {
                if (type === 'water') {
                    return `
                        <div class="history-item">
                            <span class="history-date">${Utils.formatDateToBR(data.date)}</span>
                            <span class="history-value">${data.water} copos</span>
                        </div>
                    `;
                } else {
                    const hours = Math.floor(data.sleep.totalMinutes / 60);
                    const minutes = data.sleep.totalMinutes % 60;
                    return `
                        <div class="history-item">
                            <span class="history-date">${Utils.formatDateToBR(data.date)}</span>
                            <span class="history-value">${hours}h ${minutes}m</span>
                        </div>
                    `;
                }
            })
            .join('');
        
        historyList.innerHTML = historyItems || '<p>Nenhum dado encontrado.</p>';
        
        document.body.classList.add('modal-open');
        historyModal.classList.remove('hidden');
    };
    
    /**
     * Fecha modal de histórico
     */
    const closeHistoryModal = () => {
        document.body.classList.remove('modal-open');
        historyModal.classList.add('hidden');
    };
    
    // ===== EVENT HANDLERS =====
    
    /**
     * Handler para mudança nas configurações de hidratação
     */
    const handleHydrationSettingsChange = () => {
        saveHydrationSettings();
    };
    
    /**
     * Handler para botões de hidratação
     * @param {Event} event - Evento de clique
     */
    const handleHydrationButtons = (event) => {
        if (event.target === increaseWaterButton) {
            increaseWater();
        } else if (event.target === decreaseWaterButton) {
            decreaseWater();
        }
    };
    
    /**
     * Handler para botões de histórico
     * @param {Event} event - Evento de clique
     */
    const handleHistoryButtons = (event) => {
        if (event.target === waterHistoryButton) {
            openHistoryModal('water');
        } else if (event.target === sleepHistoryButton) {
            openHistoryModal('sleep');
        }
    };
    
    /**
     * Handler para fechar modal de histórico
     * @param {Event} event - Evento de clique
     */
    const handleCloseHistory = (event) => {
        if (event.target === closeHistoryButton || event.target === closeHistoryButtonX) {
            closeHistoryModal();
        }
    };
    
    // ===== INICIALIZAÇÃO =====
    
    /**
     * Configura event listeners
     */
    const setupEventListeners = () => {
        // Hidratação
        waterGoalInput.addEventListener('change', handleHydrationSettingsChange);
        waterCupMlInput.addEventListener('change', handleHydrationSettingsChange);
        increaseWaterButton.addEventListener('click', handleHydrationButtons);
        decreaseWaterButton.addEventListener('click', handleHydrationButtons);
        
        // Sono
        sleepForm.addEventListener('submit', saveSleepData);
        editSleepButton.addEventListener('click', editSleep);
        
        // Histórico
        waterHistoryButton.addEventListener('click', handleHistoryButtons);
        sleepHistoryButton.addEventListener('click', handleHistoryButtons);
        closeHistoryButton.addEventListener('click', handleCloseHistory);
        closeHistoryButtonX.addEventListener('click', handleCloseHistory);
        
        // Fechar modal ao clicar fora
        historyModal.addEventListener('click', event => {
            if (event.target === historyModal) {
                closeHistoryModal();
            }
        });
    };
    
    /**
     * Inicializa o módulo de métricas
     */
    const init = () => {
        setupEventListeners();
        render();
    };
    
    /**
     * Renderiza todos os componentes
     */
    const render = () => {
        renderHydration();
        renderSleep();
        renderWeeklySummary();
    };
    
    // ===== EXPOSIÇÃO PÚBLICA =====
    
    return {
        init,
        render
    };
})();

// Exporta para uso global
window.Metrics = Metrics;