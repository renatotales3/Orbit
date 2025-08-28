/**
 * MÓDULO DE HÁBITOS
 * 
 * Responsabilidades:
 * - Gerenciamento de hábitos diários
 * - Rastreamento de sequência (streak)
 * - Interface de criação e edição
 * - Persistência de dados
 * 
 * Refatoração aplicada:
 * - Separação de responsabilidades
 * - Nomes de variáveis mais descritivos
 * - Comentários explicativos
 * - Lógica de streak otimizada
 * - Código ES6+ moderno
 */

const Habits = (() => {
    
    // ===== ELEMENTOS DOM =====
    const habitsList = document.getElementById('habits-list');
    const addHabitModalButton = document.getElementById('add-habit-modal-btn');
    const habitModal = document.getElementById('habit-modal');
    const habitForm = document.getElementById('habit-form');
    const cancelHabitButton = document.getElementById('cancel-habit-btn');
    const deleteHabitButton = document.getElementById('delete-habit-btn');
    const iconPicker = document.getElementById('habit-icon-picker');
    const colorPicker = document.getElementById('habit-color-picker');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmDeleteButton = document.getElementById('confirmation-confirm-btn');
    const cancelDeleteButton = document.getElementById('confirmation-cancel-btn');
    
    // ===== CONFIGURAÇÕES =====
    const AVAILABLE_ICONS = [
        { name: 'bx-drink', label: 'Beber' },
        { name: 'bx-book-open', label: 'Ler' },
        { name: 'bx-run', label: 'Exercício' },
        { name: 'bx-spa', label: 'Meditar' },
        { name: 'bx-brain', label: 'Estudar' },
        { name: 'bx-bed', label: 'Dormir' },
        { name: 'bx-dollar-circle', label: 'Economizar' },
        { name: 'bx-user-voice', label: 'Social' },
        { name: 'bx-leaf', label: 'Natureza' },
        { name: 'bx-paint', label: 'Hobby' }
    ];
    
    const AVAILABLE_COLORS = [
        '#007BFF', '#28A745', '#FFC107', '#DC3545', '#6F42C1',
        '#FD7E14', '#17A2B8', '#FF69B4', '#0DCAF0', '#20C997'
    ];
    
    // ===== ESTADO =====
    let habits = Utils.loadFromLocalStorage('habits', []);
    let habitToDeleteId = null;
    
    // ===== CÁLCULOS =====
    
    /**
     * Calcula a sequência atual de dias consecutivos
     * @param {Array} dates - Array de datas completadas
     * @returns {number} Número de dias na sequência
     */
    const calculateStreak = (dates) => {
        if (dates.length === 0) return 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const completedDates = new Set(dates);
        let currentDate = new Date(today);
        
        // Se hoje não foi completado, começa de ontem
        if (!completedDates.has(currentDate.toISOString().split('T')[0])) {
            currentDate.setDate(today.getDate() - 1);
        }
        
        let streak = 0;
        
        // Conta dias consecutivos para trás
        while (completedDates.has(currentDate.toISOString().split('T')[0])) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        return streak;
    };
    
    // ===== RENDERIZAÇÃO =====
    
    /**
     * Cria HTML para o rastreador semanal de um hábito
     * @param {Object} habit - Objeto do hábito
     * @returns {string} HTML do rastreador
     */
    const createWeekTrackerHTML = (habit) => {
        const today = new Date();
        const startOfWeek = new Date(new Date().setDate(today.getDate() - today.getDay()));
        const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
        
        let weekTrackerHTML = '';
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            
            const dateString = day.toISOString().split('T')[0];
            const isCompleted = habit.completedDates.includes(dateString);
            const isCurrent = day.toDateString() === new Date().toDateString();
            const isFuture = day > new Date();
            
            weekTrackerHTML += `
                <div class="day-circle ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${isFuture ? 'disabled' : ''}" 
                     data-date="${dateString}" 
                     style="${isCompleted ? '--habit-color:' + habit.color : ''}">
                    ${weekDays[i]}
                </div>
            `;
        }
        
        return weekTrackerHTML;
    };
    
    /**
     * Cria HTML para um hábito individual
     * @param {Object} habit - Objeto do hábito
     * @returns {string} HTML do hábito
     */
    const createHabitHTML = (habit) => {
        const streak = calculateStreak(habit.completedDates);
        const weekTrackerHTML = createWeekTrackerHTML(habit);
        
        return `
            <div class="habit-info">
                <div class="habit-icon-name">
                    <i class='bx ${habit.icon}' style="color: ${habit.color}"></i>
                    <span class="habit-name">${habit.name}</span>
                </div>
                <div class="habit-info-right">
                    <div class="habit-streak">
                        <span>🔥</span>
                        <span>${streak}</span>
                    </div>
                    <div class="habit-actions">
                        <button class="soft-button icon-btn edit-habit-btn" title="Editar Hábito">
                            <i class="bx bxs-pencil"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="habit-week-tracker">
                ${weekTrackerHTML}
            </div>
        `;
    };
    
    /**
     * Renderiza a lista de hábitos
     */
    const render = () => {
        habitsList.innerHTML = '';
        
        habits.forEach(habit => {
            const listItem = document.createElement('li');
            listItem.className = 'habit-item';
            listItem.dataset.id = habit.id;
            listItem.innerHTML = createHabitHTML(habit);
            
            habitsList.appendChild(listItem);
        });
    };
    
    // ===== GERENCIAMENTO DE MODAL =====
    
    /**
     * Abre o modal de hábito
     * @param {string} mode - 'add' ou 'edit'
     * @param {number|null} habitId - ID do hábito (para edição)
     */
    const openHabitModal = (mode = 'add', habitId = null) => {
        // Reseta formulário
        habitForm.reset();
        habitForm.dataset.mode = mode;
        habitForm.dataset.habitId = habitId;
        
        // Renderiza ícones disponíveis
        iconPicker.innerHTML = AVAILABLE_ICONS
            .map(icon => `
                <div class="picker-option">
                    <button type="button" class="picker-button" data-icon="${icon.name}">
                        <i class='bx ${icon.name}'></i>
                    </button>
                    <span class="picker-label">${icon.label}</span>
                </div>
            `).join('');
        
        // Renderiza cores disponíveis
        colorPicker.innerHTML = AVAILABLE_COLORS
            .map(color => `
                <button type="button" class="picker-button" data-color="${color}">
                    <div class="color-swatch" style="background-color:${color}"></div>
                </button>
            `).join('');
        
        const modalTitle = document.getElementById('habit-modal-title');
        
        if (mode === 'edit' && habitId !== null) {
            // Modo edição
            modalTitle.textContent = "Editar Hábito";
            deleteHabitButton.classList.remove('hidden');
            
            const habit = habits.find(h => h.id === habitId);
            if (habit) {
                document.getElementById('habit-name-input').value = habit.name;
                
                // Marca ícone e cor selecionados
                iconPicker.querySelector(`.picker-button[data-icon="${habit.icon}"]`)?.classList.add('active');
                colorPicker.querySelector(`.picker-button[data-color="${habit.color}"]`)?.classList.add('active');
            }
        } else {
            // Modo criação
            modalTitle.textContent = "Novo Hábito";
            deleteHabitButton.classList.add('hidden');
        }
        
        // Exibe modal
        document.body.classList.add('modal-open');
        habitModal.classList.remove('hidden');
    };
    
    /**
     * Fecha o modal de hábito
     */
    const closeHabitModal = () => {
        document.body.classList.remove('modal-open');
        habitForm.reset();
        habitModal.classList.add('hidden');
    };
    
    // ===== GERENCIAMENTO DE HÁBITOS =====
    
    /**
     * Valida dados do formulário de hábito
     * @param {string} name - Nome do hábito
     * @param {string} icon - Ícone selecionado
     * @param {string} color - Cor selecionada
     * @returns {boolean} Se os dados são válidos
     */
    const validateHabitData = (name, icon, color) => {
        if (!name || !icon || !color) {
            alert("Por favor, preencha todos os campos.");
            return false;
        }
        return true;
    };
    
    /**
     * Salva um hábito (criar ou editar)
     * @param {Object} habitData - Dados do hábito
     * @param {string} mode - 'add' ou 'edit'
     * @param {number|null} habitId - ID do hábito (para edição)
     */
    const saveHabit = (habitData, mode, habitId) => {
        if (mode === 'add') {
            habits.push({
                id: Date.now(),
                ...habitData,
                completedDates: []
            });
        } else if (mode === 'edit') {
            const habitIndex = habits.findIndex(h => h.id === habitId);
            if (habitIndex > -1) {
                habits[habitIndex] = {
                    ...habits[habitIndex],
                    ...habitData
                };
            }
        }
        
        Utils.saveToLocalStorage('habits', habits);
        render();
        closeHabitModal();
    };
    
    /**
     * Toggle do estado de conclusão de um dia
     * @param {number} habitId - ID do hábito
     * @param {string} date - Data no formato YYYY-MM-DD
     */
    const toggleDayCompletion = (habitId, date) => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;
        
        const dateIndex = habit.completedDates.indexOf(date);
        
        if (dateIndex > -1) {
            // Remove a data se já estava completada
            habit.completedDates.splice(dateIndex, 1);
        } else {
            // Adiciona a data se não estava completada
            habit.completedDates.push(date);
        }
        
        Utils.saveToLocalStorage('habits', habits);
        render();
    };
    
    /**
     * Remove um hábito
     * @param {number} habitId - ID do hábito
     */
    const deleteHabit = (habitId) => {
        habits = habits.filter(h => h.id !== habitId);
        Utils.saveToLocalStorage('habits', habits);
        render();
        habitToDeleteId = null;
    };
    
    // ===== EVENT HANDLERS =====
    
    /**
     * Handler para seleção de ícone
     * @param {Event} event - Evento de clique
     */
    const handleIconSelection = (event) => {
        const button = event.target.closest('.picker-button');
        if (button) {
            iconPicker.querySelector('.active')?.classList.remove('active');
            button.classList.add('active');
        }
    };
    
    /**
     * Handler para seleção de cor
     * @param {Event} event - Evento de clique
     */
    const handleColorSelection = (event) => {
        const button = event.target.closest('.picker-button');
        if (button) {
            colorPicker.querySelector('.active')?.classList.remove('active');
            button.classList.add('active');
        }
    };
    
    /**
     * Handler para submissão do formulário de hábito
     * @param {Event} event - Evento de submissão
     */
    const handleHabitFormSubmit = (event) => {
        event.preventDefault();
        
        const name = document.getElementById('habit-name-input').value;
        const icon = iconPicker.querySelector('.active')?.dataset.icon;
        const color = colorPicker.querySelector('.active')?.dataset.color;
        
        if (!validateHabitData(name, icon, color)) {
            return;
        }
        
        const mode = habitForm.dataset.mode;
        const habitId = Number(habitForm.dataset.habitId);
        
        const habitData = { name, icon, color };
        saveHabit(habitData, mode, habitId);
    };
    
    /**
     * Handler para interações na lista de hábitos
     * @param {Event} event - Evento de clique
     */
    const handleHabitsListClick = (event) => {
        const habitItem = event.target.closest('.habit-item');
        if (!habitItem) return;
        
        const habitId = Number(habitItem.dataset.id);
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;
        
        // Toggle de conclusão de dia
        if (event.target.closest('.day-circle:not(.disabled)')) {
            const date = event.target.closest('.day-circle').dataset.date;
            toggleDayCompletion(habitId, date);
        }
        
        // Editar hábito
        if (event.target.closest('.edit-habit-btn')) {
            openHabitModal('edit', habitId);
        }
    };
    
    /**
     * Handler para exclusão de hábito
     */
    const handleDeleteHabit = () => {
        habitToDeleteId = Number(habitForm.dataset.habitId);
        document.body.classList.add('modal-open');
        confirmationModal.classList.remove('hidden');
    };
    
    /**
     * Handler para cancelar exclusão
     */
    const handleCancelDelete = () => {
        document.body.classList.remove('modal-open');
        confirmationModal.classList.add('hidden');
        habitToDeleteId = null;
    };
    
    /**
     * Handler para confirmar exclusão
     */
    const handleConfirmDelete = () => {
        if (habitToDeleteId !== null) {
            deleteHabit(habitToDeleteId);
        }
        document.body.classList.remove('modal-open');
        confirmationModal.classList.add('hidden');
        closeHabitModal();
    };
    
    // ===== INICIALIZAÇÃO =====
    
    /**
     * Configura event listeners
     */
    const setupEventListeners = () => {
        // Botões do modal
        addHabitModalButton.addEventListener('click', () => openHabitModal('add'));
        cancelHabitButton.addEventListener('click', closeHabitModal);
        
        // Fechar modal ao clicar fora
        habitModal.addEventListener('click', event => {
            if (event.target === habitModal) closeHabitModal();
        });
        
        // Seletores de ícone e cor
        iconPicker.addEventListener('click', handleIconSelection);
        colorPicker.addEventListener('click', handleColorSelection);
        
        // Formulário
        habitForm.addEventListener('submit', handleHabitFormSubmit);
        
        // Lista de hábitos
        habitsList.addEventListener('click', handleHabitsListClick);
        
        // Exclusão
        deleteHabitButton.addEventListener('click', handleDeleteHabit);
        cancelDeleteButton.addEventListener('click', handleCancelDelete);
        confirmDeleteButton.addEventListener('click', handleConfirmDelete);
    };
    
    /**
     * Inicializa o módulo de hábitos
     */
    const init = () => {
        setupEventListeners();
        render();
    };
    
    // ===== EXPOSIÇÃO PÚBLICA =====
    
    return {
        init,
        render
    };
})();

// Exporta para uso global
window.Habits = Habits;