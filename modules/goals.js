// Life OS - Módulo de Metas Completo
// Implementação completa baseada no script original

const Goals = (() => {
    // Elementos DOM
    let goalModal, goalForm, goalsList, modalTitle, addGoalModalBtn, categoryContainer;
    let priorityModal, subtaskPriorityPicker;
    
    // Estado interno
    let goals = [];
    let subtaskToAdd = null;
    let isInitialized = false;
    
    // Categorias disponíveis
    const ALL_CATEGORIES = { 
        'Pessoal': '#007BFF', 
        'Profissional': '#6F42C1', 
        'Acadêmica': '#28A745', 
        'Saúde': '#FD7E14', 
        'Finanças': '#FFC107' 
    };
    
    // Carregar metas salvas
    const loadGoals = () => {
        if (typeof Utils !== 'undefined') {
            goals = Utils.loadFromLocalStorage('goals', []);
        } else {
            goals = JSON.parse(localStorage.getItem('goals') || '[]');
        }
    };
    
    // Salvar metas
    const saveGoals = () => {
        if (typeof Utils !== 'undefined') {
            Utils.saveToLocalStorage('goals', goals);
        } else {
            localStorage.setItem('goals', JSON.stringify(goals));
        }
    };
    
    // Criar HTML de subtarefa
    const createSubtaskHTML = (st) => {
        return `<li class="subtask-item" data-id="${st.id}">
            <div class="subtask-item-content">
                <button class="complete-subtask-btn ${st.completed ? 'completed' : ''}">
                    <i class='bx ${st.completed ? 'bxs-check-circle' : 'bx-circle'}'></i>
                </button>
                <span class="subtask-text ${st.completed ? 'completed' : ''}">${st.text}</span>
            </div>
            <div class="subtask-actions">
                <button class="soft-button icon-btn add-to-focus-btn" title="Adicionar ao Foco do Dia">
                    <i class='bx bx-list-plus'></i>
                </button>
                <button class="soft-button icon-btn delete-subtask-btn" title="Excluir Subtarefa">
                    <i class='bx bxs-trash'></i>
                </button>
            </div>
        </li>`;
    };
    
    // Criar HTML de meta
    const createGoalHTML = (goal) => {
        const progress = goal.subtasks.length > 0 ? 
            (goal.subtasks.filter(st => st.completed).length / goal.subtasks.length) * 100 : 0;
        
        return `<li class="goal-item" data-id="${goal.id}">
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
                        ${goal.categories.map(cat => 
                            `<span class="goal-category" style="background-color:${ALL_CATEGORIES[cat] || '#6c757d'}">${cat}</span>`
                        ).join('')}
                    </div>
                    <p><strong>Motivação:</strong> ${goal.motivation || 'N/A'}</p>
                    <p><strong>Data Alvo:</strong> ${goal.targetDate ? 
                        (typeof Utils !== 'undefined' ? Utils.formatDateToBR(goal.targetDate) : goal.targetDate) : 'N/A'}</p>
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
        </li>`;
    };
    
    // Renderizar lista de metas
    const render = () => {
        if (!goalsList) return;
        
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
    
    // Definir estado de conclusão da subtarefa
    const setSubtaskCompletedState = (goalId, subtaskId, isCompleted) => {
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
            const subtask = goal.subtasks.find(st => st.id === subtaskId);
            if (subtask && subtask.completed !== isCompleted) {
                subtask.completed = isCompleted;
                saveGoals();
                render();
            }
        }
    };
    
    // Inicializar módulo
    const init = () => {
        if (isInitialized) return;
        
        try {
            // Obter referências DOM
            goalModal = document.getElementById('goal-modal');
            goalForm = document.getElementById('goal-form');
            goalsList = document.getElementById('goals-list');
            modalTitle = document.getElementById('modal-title');
            addGoalModalBtn = document.getElementById('add-goal-modal-btn');
            categoryContainer = document.getElementById('goal-category-container');
            priorityModal = document.getElementById('priority-modal-for-subtask');
            subtaskPriorityPicker = document.getElementById('subtask-priority-picker');
            
            if (!goalsList) {
                console.error('❌ Elementos de metas não encontrados');
                return;
            }
            
            // Carregar metas salvas
            loadGoals();
            
            // Renderizar metas
            render();
            
            isInitialized = true;
            console.log('✅ Goals module initialized');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Goals:', error);
        }
    };
    
    // API pública
    return { 
        init, 
        render, 
        setSubtaskCompletedState,
        isInitialized: () => isInitialized 
    };
})();
