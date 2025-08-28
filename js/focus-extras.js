/**
 * MÓDULO FOCUS EXTRAS
 * 
 * Responsabilidades:
 * - Gerenciamento de MITs (Most Important Tasks)
 * - Estatísticas de foco e produtividade
 * - Review diário de atividades
 * - Integração com sistema Pomodoro
 * 
 * Refatoração aplicada:
 * - Separação de responsabilidades
 * - Nomes de variáveis mais descritivos
 * - Comentários explicativos
 * - Lógica de estatísticas otimizada
 * - Código ES6+ moderno
 */

const FocusExtras = (() => {
    
    // ===== ELEMENTOS DOM - MITS =====
    const mitInput = document.getElementById('mit-input');
    const addMitButton = document.getElementById('add-mit-btn');
    const mitsList = document.getElementById('mits-list');
    const clearMitsButton = document.getElementById('clear-mits-btn');
    const carryoverMitsButton = document.getElementById('carryover-mits-btn');
    
    // ===== ELEMENTOS DOM - ESTATÍSTICAS =====
    const statsTodayMinutesElement = document.getElementById('focus-stats-today-minutes');
    const statsTodaySessionsElement = document.getElementById('focus-stats-today-sessions');
    const statsWeekMinutesElement = document.getElementById('focus-stats-week-minutes');
    
    // ===== ELEMENTOS DOM - REVIEW =====
    const reviewForm = document.getElementById('review-form');
    const reviewFormView = document.getElementById('review-form-view');
    const reviewCompletedView = document.getElementById('review-completed-view');
    const reviewGood = document.getElementById('review-good');
    const reviewDelay = document.getElementById('review-delay');
    const reviewLearn = document.getElementById('review-learn');
    const reviewGoodView = document.getElementById('review-good-view');
    const reviewDelayView = document.getElementById('review-delay-view');
    const reviewLearnView = document.getElementById('review-learn-view');
    const editReviewButton = document.getElementById('edit-review-btn');
    
    // ===== ESTADO =====
    let mits = Utils.loadFromLocalStorage('mits', []);
    let focusStats = Utils.loadFromLocalStorage('focusStats', { sessions: [] });
    let reviews = Utils.loadFromLocalStorage('reviews', {});
    
    // ===== CONFIGURAÇÕES =====
    const MAX_MITS = 3;
    
    // ===== GERENCIAMENTO DE MITS =====
    
    /**
     * Cria HTML para um MIT individual
     * @param {Object} mit - Objeto do MIT
     * @param {number} index - Índice do MIT
     * @returns {string} HTML do MIT
     */
    const createMitHTML = (mit, index) => {
        return `
            <li class="mit-item" data-index="${index}">
                <span class="mit-text">${Utils.escapeHTML(mit.text)}</span>
                <div class="task-item-buttons">
                    <button class="soft-button icon-btn delete-mit-btn">
                        <i class='bx bxs-trash'></i>
                    </button>
                </div>
            </li>
        `;
    };
    
    /**
     * Renderiza a lista de MITs
     */
    const renderMits = () => {
        mitsList.innerHTML = mits.map((mit, index) => createMitHTML(mit, index)).join('');
    };
    
    /**
     * Adiciona um novo MIT
     * @param {string} text - Texto do MIT
     */
    const addMit = (text) => {
        const trimmedText = text?.trim();
        
        if (!trimmedText) return;
        
        if (mits.length >= MAX_MITS) {
            Utils.showNotice('Limite de 3 MITs. Conclua ou limpe antes de adicionar novos.');
            return;
        }
        
        mits.push({ text: trimmedText });
        Utils.saveToLocalStorage('mits', mits);
        renderMits();
    };
    
    /**
     * Remove um MIT
     * @param {number} index - Índice do MIT
     */
    const removeMit = (index) => {
        if (Number.isInteger(index) && index >= 0 && index < mits.length) {
            mits.splice(index, 1);
            Utils.saveToLocalStorage('mits', mits);
            renderMits();
        }
    };
    
    /**
     * Limpa todos os MITs
     */
    const clearMits = () => {
        mits = [];
        Utils.saveToLocalStorage('mits', mits);
        renderMits();
    };
    
    /**
     * Transfere MITs para o próximo dia
     */
    const carryoverMits = () => {
        const today = Utils.getTodayString();
        const todayKey = `mits_${today}`;
        
        // Salva snapshot do dia atual
        Utils.saveToLocalStorage(todayKey, mits);
        
        // Transfere para amanhã
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowKey = `mits_${tomorrow.toISOString().split('T')[0]}`;
        Utils.saveToLocalStorage(tomorrowKey, mits);
    };
    
    /**
     * Inicia edição inline de um MIT
     * @param {HTMLElement} textElement - Elemento de texto
     * @param {number} index - Índice do MIT
     */
    const startMitEdit = (textElement, index) => {
        if (!Number.isInteger(index) || index < 0 || index >= mits.length) return;
        
        const currentText = mits[index].text;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'soft-input';
        input.value = currentText;
        input.style.maxWidth = '200px';
        
        textElement.replaceWith(input);
        input.focus();
        
        const commitEdit = () => {
            mits[index].text = input.value.trim() || currentText;
            Utils.saveToLocalStorage('mits', mits);
            renderMits();
        };
        
        input.addEventListener('blur', commitEdit);
        input.addEventListener('keypress', event => {
            if (event.key === 'Enter') {
                commitEdit();
            }
        });
    };
    
    // ===== GERENCIAMENTO DE ESTATÍSTICAS =====
    
    /**
     * Adiciona uma sessão de foco
     * @param {number} minutes - Minutos da sessão
     */
    const addFocusSession = (minutes) => {
        focusStats.sessions.push({
            date: Utils.getTodayString(),
            minutes
        });
        Utils.saveToLocalStorage('focusStats', focusStats);
        renderStats();
    };
    
    /**
     * Calcula estatísticas de foco
     * @returns {Object} Dados das estatísticas
     */
    const calculateFocusStats = () => {
        const today = Utils.getTodayString();
        
        // Estatísticas de hoje
        const todaySessions = focusStats.sessions.filter(session => session.date === today);
        const todayMinutes = todaySessions.reduce((sum, session) => sum + (session.minutes || 0), 0);
        
        // Estatísticas da semana
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 6);
        
        const weekSessions = focusStats.sessions.filter(session => 
            new Date(session.date) >= new Date(startOfWeek.toISOString().split('T')[0])
        );
        
        const weekMinutes = weekSessions.reduce((sum, session) => sum + (session.minutes || 0), 0);
        
        return {
            todayMinutes,
            todaySessions: todaySessions.length,
            weekMinutes
        };
    };
    
    /**
     * Renderiza estatísticas de foco
     */
    const renderStats = () => {
        const stats = calculateFocusStats();
        
        if (statsTodayMinutesElement) {
            statsTodayMinutesElement.textContent = String(stats.todayMinutes);
        }
        
        if (statsTodaySessionsElement) {
            statsTodaySessionsElement.textContent = String(stats.todaySessions);
        }
        
        if (statsWeekMinutesElement) {
            statsWeekMinutesElement.textContent = String(stats.weekMinutes);
        }
    };
    
    // ===== GERENCIAMENTO DE REVIEW =====
    
    /**
     * Carrega review do dia atual
     */
    const loadTodayReview = () => {
        const today = Utils.getTodayString();
        const todayReview = reviews[today];
        
        if (todayReview) {
            // Mostra view de review completado
            if (reviewFormView) reviewFormView.style.display = 'none';
            if (reviewCompletedView) reviewCompletedView.style.display = 'block';
            
            // Preenche dados do review
            if (reviewGoodView) reviewGoodView.textContent = todayReview.good || '';
            if (reviewDelayView) reviewDelayView.textContent = todayReview.delay || '';
            if (reviewLearnView) reviewLearnView.textContent = todayReview.learn || '';
        }
    };
    
    /**
     * Salva review do dia
     * @param {Event} event - Evento de submissão
     */
    const saveReview = (event) => {
        event.preventDefault();
        
        const today = Utils.getTodayString();
        const reviewData = {
            good: reviewGood.value.trim(),
            delay: reviewDelay.value.trim(),
            learn: reviewLearn.value.trim()
        };
        
        reviews[today] = reviewData;
        Utils.saveToLocalStorage('reviews', reviews);
        
        // Atualiza interface
        if (reviewFormView) reviewFormView.style.display = 'none';
        if (reviewCompletedView) reviewCompletedView.style.display = 'block';
        
        if (reviewGoodView) reviewGoodView.textContent = reviewData.good;
        if (reviewDelayView) reviewDelayView.textContent = reviewData.delay;
        if (reviewLearnView) reviewLearnView.textContent = reviewData.learn;
    };
    
    /**
     * Edita review existente
     */
    const editReview = () => {
        if (reviewFormView) reviewFormView.style.display = 'block';
        if (reviewCompletedView) reviewCompletedView.style.display = 'none';
    };
    
    // ===== EVENT HANDLERS =====
    
    /**
     * Handler para adição de MIT
     */
    const handleAddMit = () => {
        addMit(mitInput.value);
        mitInput.value = '';
    };
    
    /**
     * Handler para interações na lista de MITs
     * @param {Event} event - Evento de clique
     */
    const handleMitsListClick = (event) => {
        const mitItem = event.target.closest('.mit-item');
        if (!mitItem) return;
        
        const index = Number(mitItem.dataset.index);
        
        // Excluir MIT
        if (event.target.closest('.delete-mit-btn')) {
            removeMit(index);
            return;
        }
        
        // Editar MIT inline
        const textElement = mitItem.querySelector('.mit-text');
        if (textElement) {
            startMitEdit(textElement, index);
        }
    };
    
    /**
     * Handler para limpar MITs
     */
    const handleClearMits = () => {
        clearMits();
    };
    
    /**
     * Handler para transferir MITs
     */
    const handleCarryoverMits = () => {
        carryoverMits();
    };
    
    /**
     * Handler para editar review
     */
    const handleEditReview = () => {
        editReview();
    };
    
    // ===== INICIALIZAÇÃO =====
    
    /**
     * Configura event listeners
     */
    const setupEventListeners = () => {
        // MITs
        if (addMitButton) {
            addMitButton.addEventListener('click', handleAddMit);
        }
        
        if (mitsList) {
            mitsList.addEventListener('click', handleMitsListClick);
        }
        
        if (clearMitsButton) {
            clearMitsButton.addEventListener('click', handleClearMits);
        }
        
        if (carryoverMitsButton) {
            carryoverMitsButton.addEventListener('click', handleCarryoverMits);
        }
        
        // Review
        if (reviewForm) {
            reviewForm.addEventListener('submit', saveReview);
        }
        
        if (editReviewButton) {
            editReviewButton.addEventListener('click', handleEditReview);
        }
    };
    
    /**
     * Inicializa o módulo FocusExtras
     */
    const init = () => {
        setupEventListeners();
        
        // Renderiza componentes
        renderMits();
        loadTodayReview();
        renderStats();
    };
    
    // ===== EXPOSIÇÃO PÚBLICA =====
    
    /**
     * Callback para sessão de foco completada (usado pelo Pomodoro)
     * @param {number} minutes - Minutos da sessão
     */
    const onFocusSessionComplete = (minutes) => {
        addFocusSession(minutes);
    };
    
    return {
        init,
        renderStats,
        onFocusSessionComplete
    };
})();

// Exporta para uso global
window.FocusExtras = FocusExtras;