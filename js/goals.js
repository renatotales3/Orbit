/**
 * MÓDULO DE METAS
 * 
 * Responsabilidades:
 * - Gerenciamento de metas e objetivos
 * - Sistema de subtarefas
 * - Categorização e progresso
 * - Integração com sistema de foco
 * 
 * Refatoração aplicada:
 * - Separação de responsabilidades
 * - Nomes de variáveis mais descritivos
 * - Comentários explicativos
 * - Lógica de renderização otimizada
 * - Código ES6+ moderno
 */

const Goals = (() => {
    
    // ===== ELEMENTOS DOM =====
    const goalModal = document.getElementById('goal-modal');
    const goalForm = document.getElementById('goal-form');
    const goalsList = document.getElementById('goals-list');
    const modalTitle = document.getElementById('modal-title');
    const addGoalModalButton = document.getElementById('add-goal-modal-btn');
    const categoryContainer = document.getElementById('goal-category-container');
    const priorityModal = document.getElementById('priority-modal-for-subtask');
    const subtaskPriorityPicker = document.getElementById('subtask-priority-picker');
    
    // ===== ESTADO =====
    let goals = Utils.loadFromLocalStorage('goals', []);
    let subtaskToAdd = null;
    
    // ===== CONFIGURAÇÕES =====
    const ALL_CATEGORIES = {
        'Pessoal': '#007BFF',
        'Profissional': '#6F42C1',
        'Acadêmica': '#28A745',
        'Saúde': '#FD7E14',
        'Finanças': '#FFC107'
    };
    
    // ===== RENDERIZAÇÃO =====
    
    /**
     * Cria HTML para uma subtarefa
     * @param {Object} subtask - Objeto da subtarefa
     * @returns {string} HTML da subtarefa
     */
    const createSubtaskHTML = (subtask) => {
        return `
            <li class="subtask-item" data-id="${subtask.id}">
                <div class="subtask-item-content">
                    <button class="complete-subtask-btn ${subtask.completed ? 'completed' : ''}">
                        <i class='bx bx-check-circle'></i>
                    </button>
                    <span class="subtask-text ${subtask.completed ? 'completed' : ''}">${subtask.text}</span>
                </div>
                <div class="subtask-actions">
                    <button class="soft-button icon-btn add-to-focus-btn" title="Adicionar ao Foco do Dia">
                        <i class='bx bx-list-plus'></i>
                    </button>
                    <button class="soft-button icon-btn delete-subtask-btn" title="Excluir Subtarefa">
                        <i class='bx bxs-trash'></i>
                    </button>
                </div>
            </li>
        `;
    };
    
    /**
     * Calcula o progresso de uma meta
     * @param {Object} goal - Objeto da meta
     * @returns {number} Percentual de progresso (0-100)
     */
    const calculateGoalProgress = (goal) => {
        if (goal.subtasks.length === 0) return 0;
        
        const completedSubtasks = goal.subtasks.filter(subtask => subtask.completed).length;
        return (completedSubtasks / goal.subtasks.length) * 100;
    };
    
    /**
     * Cria HTML para uma meta
     * @param {Object} goal - Objeto da meta
     * @returns {string} HTML da meta
     */
    const createGoalHTML = (goal) => {
        const progress = calculateGoalProgress(goal);
        
        return `
            <li class="goal-item" data-id="${goal.id}">
                <div class="goal-header">
                    <span class="goal-title">${goal.title}</span>
                    <div class="goal-actions">
                        <button class="soft-button icon-btn edit-goal-btn" title="Editar Meta">
                            <i class='bx bxs-pencil'></i>
                        </button>
                        <button class="soft-button icon-btn delete-goal-btn" title="Excluir Meta">
                            <i class='bx bxs-trash'></i>
                        </button>
                    </div>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${progress.toFixed(0)}%"></div>
                    </div>
                </div>
                <div class="goal-details">
                    <div class="goal-details-content">
                        <div class="goal-categories">
                            ${goal.categories.map(category => 
                                `<span class="goal-category" style="background-color:${ALL_CATEGORIES[category] || '#6c757d'}">${category}</span>`
                            ).join('')}
                        </div>
                        <p><strong>Motivação:</strong> ${goal.motivation || 'N/A'}</p>
                        <p><strong>Data Alvo:</strong> ${goal.targetDate ? Utils.formatDateToBR(goal.targetDate) : 'N/A'}</p>
                        <ul class="subtask-list">
                            ${goal.subtasks.map(createSubtaskHTML).join('')}
                        </ul>
                        <form class="add-subtask-form">
                            <input type="text" class="soft-input subtask-input" placeholder="Novo passo...">
                            <button type="submit" class="soft-button add-subtask-btn">
                                <i class='bx bx-plus'></i>
                            </button>
                        </form>
                    </div>
                </div>
            </li>
        `;
    };
    
    /**
     * Renderiza a lista de metas
     */
    const render = () => {
        if (goals.length === 0) {
            goalsList.innerHTML = `
                <div class="empty-state">
                    <h4>Nenhuma meta definida</h4>
                    <p>Crie sua primeira meta para começar a acompanhar seus objetivos.</p>
                </div>
            `;
        } else {
            goalsList.innerHTML = goals.map(createGoalHTML).join('');
        }
    };
    
    // ===== GERENCIAMENTO DE MODAL =====
    
    /**
     * Abre o modal de meta
     * @param {string} mode - 'add' ou 'edit'
     * @param {number|null} goalId - ID da meta (para edição)
     */
    const openGoalModal = (mode = 'add', goalId = null) => {
        // Reseta formulário
        goalForm.reset();
        goalForm.dataset.mode = mode;
        goalForm.dataset.goalId = goalId;
        
        // Renderiza categorias
        categoryContainer.innerHTML = Object.keys(ALL_CATEGORIES)
            .map(category => `<button type="button" class="category-btn">${category}</button>`)
            .join('');
        
        if (mode === 'edit' && goalId !== null) {
            // Modo edição
            modalTitle.textContent = "Editar Meta";
            const goal = goals.find(g => g.id === goalId);
            
            if (goal) {
                document.getElementById('goal-title-input').value = goal.title;
                document.getElementById('goal-motivation-input').value = goal.motivation;
                document.getElementById('goal-date-input').value = goal.targetDate;
                
                // Marca categorias selecionadas
                categoryContainer.querySelectorAll('.category-btn').forEach(button => {
                    if (goal.categories.includes(button.textContent)) {
                        button.classList.add('active');
                    }
                });
            }
        } else {
            // Modo criação
            modalTitle.textContent = "Criar Nova Meta";
        }
        
        // Exibe modal
        document.body.classList.add('modal-open');
        goalModal.classList.remove('hidden');
    };
    
    /**
     * Fecha o modal de meta
     */
    const closeGoalModal = () => {
        document.body.classList.remove('modal-open');
        goalModal.classList.add('hidden');
    };
    
    // ===== GERENCIAMENTO DE METAS =====
    
    /**
     * Valida dados do formulário de meta
     * @param {string} title - Título da meta
     * @param {Array} selectedCategories - Categorias selecionadas
     * @returns {boolean} Se os dados são válidos
     */
    const validateGoalData = (title, selectedCategories) => {
        if (title.trim() === '') {
            alert("O título da meta é obrigatório.");
            return false;
        }
        
        if (selectedCategories.length === 0) {
            alert("Por favor, selecione ao menos uma categoria.");
            return false;
        }
        
        return true;
    };
    
    /**
     * Salva uma meta (criar ou editar)
     * @param {Object} goalData - Dados da meta
     * @param {string} mode - 'add' ou 'edit'
     * @param {number|null} goalId - ID da meta (para edição)
     */
    const saveGoal = (goalData, mode, goalId) => {
        if (mode === 'add') {
            goals.push({
                id: Date.now(),
                ...goalData,
                subtasks: []
            });
        } else if (mode === 'edit') {
            const goalIndex = goals.findIndex(g => g.id === goalId);
            if (goalIndex > -1) {
                goals[goalIndex] = {
                    ...goals[goalIndex],
                    ...goalData
                };
            }
        }
        
        Utils.saveToLocalStorage('goals', goals);
        render();
        closeGoalModal();
    };
    
    /**
     * Handler para submissão do formulário de meta
     * @param {Event} event - Evento de submissão
     */
    const handleGoalFormSubmit = (event) => {
        event.preventDefault();
        
        const titleInput = document.getElementById('goal-title-input');
        const selectedCategories = [...categoryContainer.querySelectorAll('.category-btn.active')]
            .map(button => button.textContent);
        
        if (!validateGoalData(titleInput.value, selectedCategories)) {
            return;
        }
        
        const mode = goalForm.dataset.mode;
        const goalId = Number(goalForm.dataset.goalId);
        
        const goalData = {
            title: titleInput.value,
            motivation: document.getElementById('goal-motivation-input').value,
            categories: selectedCategories,
            targetDate: document.getElementById('goal-date-input').value
        };
        
        saveGoal(goalData, mode, goalId);
    };
    
    // ===== GERENCIAMENTO DE SUBTAREFAS =====
    
    /**
     * Define o estado de conclusão de uma subtarefa
     * @param {number} goalId - ID da meta
     * @param {number} subtaskId - ID da subtarefa
     * @param {boolean} isCompleted - Estado de conclusão
     */
    const setSubtaskCompletedState = (goalId, subtaskId, isCompleted) => {
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
            const subtask = goal.subtasks.find(st => st.id === subtaskId);
            if (subtask && subtask.completed !== isCompleted) {
                subtask.completed = isCompleted;
                Utils.saveToLocalStorage('goals', goals);
                render();
            }
        }
    };
    
    /**
     * Adiciona uma nova subtarefa
     * @param {number} goalId - ID da meta
     * @param {string} subtaskText - Texto da subtarefa
     */
    const addSubtask = (goalId, subtaskText) => {
        const goal = goals.find(g => g.id === goalId);
        if (goal && subtaskText.trim()) {
            goal.subtasks.push({
                id: Date.now(),
                text: subtaskText.trim(),
                completed: false
            });
            
            Utils.saveToLocalStorage('goals', goals);
            render();
            
            // Expande a meta para mostrar a nova subtarefa
            document.querySelector(`.goal-item[data-id="${goalId}"]`)?.classList.add('expanded');
        }
    };
    
    /**
     * Remove uma subtarefa
     * @param {number} goalId - ID da meta
     * @param {number} subtaskId - ID da subtarefa
     */
    const removeSubtask = (goalId, subtaskId) => {
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
            goal.subtasks = goal.subtasks.filter(st => st.id !== subtaskId);
            Tasks.removeTaskBySubtask(goalId, subtaskId);
            Utils.saveToLocalStorage('goals', goals);
            render();
        }
    };
    
    // ===== EVENT HANDLERS =====
    
    /**
     * Handler para interações na lista de metas
     * @param {Event} event - Evento de clique
     */
    const handleGoalsListClick = (event) => {
        const goalItem = event.target.closest('.goal-item');
        if (!goalItem) return;
        
        const goalId = Number(goalItem.dataset.id);
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;
        
        let shouldReRender = false;
        
        // Expandir/colapsar meta
        if (event.target.closest('.goal-header') || event.target.closest('.goal-progress')) {
            goalItem.classList.toggle('expanded');
        }
        
        // Editar meta
        if (event.target.closest('.edit-goal-btn')) {
            openGoalModal('edit', goalId);
        }
        
        // Excluir meta
        if (event.target.closest('.delete-goal-btn')) {
            goals = goals.filter(g => g.id !== goalId);
            shouldReRender = true;
        }
        
        // Marcar subtarefa como concluída
        if (event.target.closest('.complete-subtask-btn')) {
            const subtaskId = Number(event.target.closest('.subtask-item').dataset.id);
            const subtask = goal.subtasks.find(st => st.id === subtaskId);
            if (subtask) {
                const isCompleted = !subtask.completed;
                subtask.completed = isCompleted;
                Tasks.setTaskCompletedStateBySubtask(goalId, subtaskId, isCompleted);
                shouldReRender = true;
            }
        }
        
        // Excluir subtarefa
        if (event.target.closest('.delete-subtask-btn')) {
            const subtaskId = Number(event.target.closest('.subtask-item').dataset.id);
            removeSubtask(goalId, subtaskId);
            shouldReRender = true;
        }
        
        // Adicionar subtarefa ao foco
        if (event.target.closest('.add-to-focus-btn')) {
            const subtaskId = Number(event.target.closest('.subtask-item').dataset.id);
            subtaskToAdd = { goalId, subtaskId };
            document.body.classList.add('modal-open');
            priorityModal.classList.remove('hidden');
        }
        
        // Re-renderiza se necessário
        if (shouldReRender) {
            const wasExpanded = goalItem.classList.contains('expanded');
            Utils.saveToLocalStorage('goals', goals);
            render();
            if (wasExpanded) {
                document.querySelector(`.goal-item[data-id="${goalId}"]`)?.classList.add('expanded');
            }
        }
    };
    
    /**
     * Handler para adição de subtarefas
     * @param {Event} event - Evento de submissão
     */
    const handleAddSubtaskSubmit = (event) => {
        event.preventDefault();
        
        if (event.target.classList.contains('add-subtask-form')) {
            const goalItem = event.target.closest('.goal-item');
            const goalId = Number(goalItem.dataset.id);
            const subtaskInput = event.target.querySelector('.subtask-input');
            
            addSubtask(goalId, subtaskInput.value);
            subtaskInput.value = '';
        }
    };
    
    /**
     * Handler para seleção de prioridade para subtarefa
     * @param {Event} event - Evento de clique
     */
    const handleSubtaskPrioritySelection = (event) => {
        const option = event.target.closest('.priority-option');
        if (option && subtaskToAdd) {
            const { goalId, subtaskId } = subtaskToAdd;
            const goal = goals.find(g => g.id === goalId);
            const subtask = goal?.subtasks.find(st => st.id === subtaskId);
            
            if (goal && subtask) {
                Tasks.add({
                    text: `[${goal.title}] ${subtask.text}`,
                    priority: option.dataset.priority,
                    goalId,
                    subtaskId
                });
            }
            
            subtaskToAdd = null;
            document.body.classList.remove('modal-open');
            priorityModal.classList.add('hidden');
        }
    };
    
    // ===== INICIALIZAÇÃO =====
    
    /**
     * Configura event listeners
     */
    const setupEventListeners = () => {
        // Renderiza opções de prioridade
        const PRIORITIES = Tasks.PRIORITIES;
        subtaskPriorityPicker.innerHTML = Object.keys(PRIORITIES)
            .map(key => `
                <button class="priority-option" data-priority="${key}">
                    <span class="priority-dot ${PRIORITIES[key].colorClass}"></span>
                    ${PRIORITIES[key].name}
                </button>
            `).join('');
        
        // Event listeners
        addGoalModalButton.addEventListener('click', () => openGoalModal('add'));
        document.getElementById('cancel-goal-btn').addEventListener('click', closeGoalModal);
        goalModal.addEventListener('click', event => {
            if (event.target === goalModal) closeGoalModal();
        });
        
        categoryContainer.addEventListener('click', event => {
            if (event.target.classList.contains('category-btn')) {
                event.target.classList.toggle('active');
            }
        });
        
        goalForm.addEventListener('submit', handleGoalFormSubmit);
        goalsList.addEventListener('click', handleGoalsListClick);
        goalsList.addEventListener('submit', handleAddSubtaskSubmit);
        
        priorityModal.addEventListener('click', event => {
            if (event.target === priorityModal) {
                document.body.classList.remove('modal-open');
                priorityModal.classList.add('hidden');
            }
        });
        
        subtaskPriorityPicker.addEventListener('click', handleSubtaskPrioritySelection);
    };
    
    /**
     * Inicializa o módulo de metas
     */
    const init = () => {
        setupEventListeners();
        render();
    };
    
    // ===== EXPOSIÇÃO PÚBLICA =====
    
    return {
        init,
        render,
        setSubtaskCompletedState
    };
})();

// Exporta para uso global
window.Goals = Goals;