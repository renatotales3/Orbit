/**
 * MÓDULO DE TAREFAS RÁPIDAS
 * 
 * Responsabilidades:
 * - Gerenciamento de tarefas do dia
 * - Sistema de prioridades
 * - Integração com metas e subtarefas
 * - Renderização e persistência
 * 
 * Refatoração aplicada:
 * - Separação de responsabilidades
 * - Nomes de variáveis mais descritivos
 * - Comentários explicativos
 * - Lógica de prioridades otimizada
 * - Código ES6+ moderno
 */

const Tasks = (() => {
    
    // ===== ELEMENTOS DOM =====
    const taskInput = document.getElementById('task-input');
    const taskPriorityButton = document.getElementById('task-priority-btn');
    const priorityPicker = document.getElementById('priority-picker');
    const addTaskButton = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const clearCompletedButton = document.getElementById('clear-completed-tasks-btn');
    
    // ===== CONFIGURAÇÕES =====
    const PRIORITIES = {
        1: { name: 'Urgente', colorClass: 'priority-1' },
        2: { name: 'Alta', colorClass: 'priority-2' },
        3: { name: 'Média', colorClass: 'priority-3' },
        4: { name: 'Baixa', colorClass: 'priority-4' }
    };
    
    // ===== ESTADO =====
    let tasks = Utils.loadFromLocalStorage('tasks', []);
    let currentTaskPriority = 3;
    
    // ===== RENDERIZAÇÃO =====
    
    /**
     * Cria HTML para uma tarefa individual
     * @param {Object} task - Objeto da tarefa
     * @returns {string} HTML da tarefa
     */
    const createTaskHTML = (task) => {
        const priorityInfo = PRIORITIES[task.priority];
        const dataAttributes = (task.goalId && task.subtaskId) 
            ? `data-goal-id="${task.goalId}" data-subtask-id="${task.subtaskId}"` 
            : '';
        
        return `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}" ${dataAttributes}>
                <div class="task-item-content">
                    <button class="complete-btn">
                        <i class='bx bx-check-circle'></i>
                    </button>
                    <span class="priority-tag ${priorityInfo.colorClass}">${priorityInfo.name}</span>
                    <span>${task.text}</span>
                </div>
                <div class="task-item-buttons">
                    <button class="soft-button icon-btn delete-btn">
                        <i class='bx bxs-trash'></i>
                    </button>
                </div>
            </li>
        `;
    };
    
    /**
     * Renderiza a lista de tarefas
     */
    const render = () => {
        // Ordena tarefas por prioridade
        const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority);
        
        if (sortedTasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <h4>Nenhuma tarefa ainda</h4>
                    <p>Adicione sua primeira tarefa do dia para começar a organizar seu foco.</p>
                </div>
            `;
        } else {
            taskList.innerHTML = sortedTasks.map(createTaskHTML).join('');
        }
        
        // Mostra/esconde botão de limpar concluídas
        const hasCompletedTasks = tasks.some(task => task.completed);
        clearCompletedButton.classList.toggle('hidden', !hasCompletedTasks);
    };
    
    // ===== GERENCIAMENTO DE TAREFAS =====
    
    /**
     * Adiciona uma nova tarefa
     * @param {Object} taskData - Dados da tarefa
     */
    const add = (taskData) => {
        const taskText = taskData.text?.trim();
        
        if (!taskText) return;
        
        // Feedback visual de carregamento
        if (addTaskButton) {
            addTaskButton.classList.add('loading');
            setTimeout(() => addTaskButton.classList.remove('loading'), 200);
        }
        
        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            priority: parseInt(taskData.priority),
            goalId: taskData.goalId || null,
            subtaskId: taskData.subtaskId || null
        };
        
        tasks.push(newTask);
        Utils.saveToLocalStorage('tasks', tasks);
        render();
    };
    
    /**
     * Remove tarefa baseada em subtarefa de meta
     * @param {number} goalId - ID da meta
     * @param {number} subtaskId - ID da subtarefa
     */
    const removeTaskBySubtask = (goalId, subtaskId) => {
        tasks = tasks.filter(task => 
            !(task.goalId === goalId && task.subtaskId === subtaskId)
        );
        Utils.saveToLocalStorage('tasks', tasks);
        render();
    };
    
    /**
     * Atualiza estado de conclusão baseado em subtarefa
     * @param {number} goalId - ID da meta
     * @param {number} subtaskId - ID da subtarefa
     * @param {boolean} isCompleted - Estado de conclusão
     */
    const setTaskCompletedStateBySubtask = (goalId, subtaskId, isCompleted) => {
        const taskIndex = tasks.findIndex(task => 
            task.goalId === goalId && task.subtaskId === subtaskId
        );
        
        if (taskIndex > -1 && tasks[taskIndex].completed !== isCompleted) {
            tasks[taskIndex].completed = isCompleted;
            Utils.saveToLocalStorage('tasks', tasks);
            render();
        }
    };
    
    // ===== GERENCIAMENTO DE PRIORIDADES =====
    
    /**
     * Atualiza o indicador visual de prioridade
     */
    const updatePriorityButton = () => {
        const priorityIndicator = taskPriorityButton.querySelector('.priority-indicator-btn');
        if (priorityIndicator) {
            priorityIndicator.className = `bx bxs-circle priority-indicator-btn ${PRIORITIES[currentTaskPriority].colorClass}`;
        }
    };
    
    /**
     * Handler para seleção de prioridade
     * @param {Event} event - Evento de clique
     */
    const handlePrioritySelection = (event) => {
        const priorityOption = event.target.closest('.priority-option');
        if (priorityOption) {
            currentTaskPriority = parseInt(priorityOption.dataset.priority);
            updatePriorityButton();
            priorityPicker.classList.add('hidden');
        }
    };
    
    // ===== EVENT HANDLERS =====
    
    /**
     * Handler para adição de tarefa
     */
    const handleAddTask = () => {
        add({ 
            text: taskInput.value, 
            priority: currentTaskPriority 
        });
        taskInput.value = '';
        taskInput.focus(); // Mantém foco para próxima tarefa
    };
    
    /**
     * Handler para tecla Enter no input
     * @param {KeyboardEvent} event - Evento de tecla
     */
    const handleTaskInputKeypress = (event) => {
        if (event.key === 'Enter') {
            handleAddTask();
        }
    };
    
    /**
     * Handler para limpar tarefas concluídas
     */
    const handleClearCompleted = () => {
        tasks = tasks.filter(task => !task.completed);
        Utils.saveToLocalStorage('tasks', tasks);
        render();
    };
    
    /**
     * Handler para interações na lista de tarefas
     * @param {Event} event - Evento de clique
     */
    const handleTaskListClick = (event) => {
        const taskItem = event.target.closest('.task-item');
        if (!taskItem) return;
        
        const taskId = Number(taskItem.dataset.id);
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1) return;
        
        // Marcar como concluída
        if (event.target.closest('.complete-btn')) {
            const isCompleted = !tasks[taskIndex].completed;
            tasks[taskIndex].completed = isCompleted;
            
            // Sincroniza com meta se aplicável
            const { goalId, subtaskId } = tasks[taskIndex];
            if (goalId && subtaskId) {
                Goals.setSubtaskCompletedState(Number(goalId), Number(subtaskId), isCompleted);
            }
        }
        
        // Excluir tarefa
        if (event.target.closest('.delete-btn')) {
            tasks.splice(taskIndex, 1);
        }
        
        Utils.saveToLocalStorage('tasks', tasks);
        render();
    };
    
    /**
     * Handler para toggle do seletor de prioridade
     * @param {Event} event - Evento de clique
     */
    const handlePriorityButtonClick = (event) => {
        event.stopPropagation();
        priorityPicker.classList.toggle('hidden');
    };
    
    // ===== INICIALIZAÇÃO =====
    
    /**
     * Configura event listeners
     */
    const setupEventListeners = () => {
        // Renderiza opções de prioridade
        priorityPicker.innerHTML = Object.keys(PRIORITIES)
            .map(key => `
                <button class="priority-option" data-priority="${key}">
                    <span class="priority-dot ${PRIORITIES[key].colorClass}"></span>
                    ${PRIORITIES[key].name}
                </button>
            `).join('');
        
        // Event listeners
        taskPriorityButton.addEventListener('click', handlePriorityButtonClick);
        priorityPicker.addEventListener('click', handlePrioritySelection);
        addTaskButton.addEventListener('click', handleAddTask);
        taskInput.addEventListener('keypress', handleTaskInputKeypress);
        clearCompletedButton.addEventListener('click', handleClearCompleted);
        taskList.addEventListener('click', handleTaskListClick);
        
        // Fecha seletor de prioridade ao clicar fora
        document.addEventListener('click', () => {
            priorityPicker.classList.add('hidden');
        });
    };
    
    /**
     * Inicializa o módulo de tarefas
     */
    const init = () => {
        setupEventListeners();
        render();
        updatePriorityButton();
    };
    
    // ===== EXPOSIÇÃO PÚBLICA =====
    
    return {
        init,
        add,
        render,
        setTaskCompletedStateBySubtask,
        removeTaskBySubtask,
        PRIORITIES
    };
})();

// Exporta para uso global
window.Tasks = Tasks;