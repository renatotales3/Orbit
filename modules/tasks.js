// Life OS - Módulo de Tarefas Completo
// Implementação completa baseada no script original

const Tasks = (() => {
    // Elementos DOM
    let taskInput, taskPriorityBtn, priorityPicker, addTaskBtn, taskList, clearCompletedBtn;
    
    // Estado interno
    let tasks = [];
    let currentTaskPriority = 3;
    let isInitialized = false;
    
    // Definições de prioridades
    const PRIORITIES = { 
        1: { name: 'Urgente', colorClass: 'priority-1' }, 
        2: { name: 'Alta', colorClass: 'priority-2' }, 
        3: { name: 'Média', colorClass: 'priority-3' }, 
        4: { name: 'Baixa', colorClass: 'priority-4' }
    };
    
    // Carregar tarefas salvas
    const loadTasks = () => {
        if (typeof Utils !== 'undefined') {
            tasks = Utils.loadFromLocalStorage('tasks', []);
        } else {
            tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        }
    };
    
    // Salvar tarefas
    const saveTasks = () => {
        if (typeof Utils !== 'undefined') {
            Utils.saveToLocalStorage('tasks', tasks);
        } else {
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
    };
    
    // Criar HTML de uma tarefa
    const createTaskHTML = (task) => {
        const priorityInfo = PRIORITIES[task.priority];
        const dataAttrs = (task.goalId && task.subtaskId) ? `data-goal-id="${task.goalId}" data-subtask-id="${task.subtaskId}"` : '';
        return `<li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}" ${dataAttrs}>
                    <div class="task-item-content">
                        <button class="complete-btn"><i class='bx ${task.completed ? 'bxs-check-circle' : 'bx-circle'}'></i></button>
                        <span class="priority-tag ${priorityInfo.colorClass}">${priorityInfo.name}</span>
                        <span class="task-text">${task.text}</span>
                    </div>
                    <div class="task-item-buttons">
                        <button class="soft-button icon-btn delete-btn"><i class='bx bxs-trash'></i></button>
                    </div>
                </li>`;
    };
    
    // Renderizar lista de tarefas
    const render = () => {
        if (!taskList) return;
        
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

        const hasCompleted = tasks.some(task => task.completed);
        if (clearCompletedBtn) {
            clearCompletedBtn.classList.toggle('hidden', !hasCompleted);
        }
    };
    
    // Adicionar nova tarefa
    const add = (taskData) => {
        const text = taskData.text?.trim();
        if (text) {
            // Loading state feedback
            const addBtn = document.getElementById('add-task-btn');
            if (addBtn) {
                addBtn.classList.add('loading');
                setTimeout(() => addBtn.classList.remove('loading'), 200);
            }
            
            const newTask = { 
                id: Date.now(),
                text: text, 
                completed: false, 
                priority: parseInt(taskData.priority),
                goalId: taskData.goalId || null,
                subtaskId: taskData.subtaskId || null
            };
            
            tasks.push(newTask);
            saveTasks();
            render();
        }
    };
    
    // Remover tarefa por subtarefa
    const removeTaskBySubtask = (goalId, subtaskId) => {
        tasks = tasks.filter(task => !(task.goalId === goalId && task.subtaskId === subtaskId));
        saveTasks();
        render();
    };
    
    // Definir estado de conclusão por subtarefa
    const setTaskCompletedStateBySubtask = (goalId, subtaskId, isCompleted) => {
        const taskIndex = tasks.findIndex(t => t.goalId === goalId && t.subtaskId === subtaskId);
        if (taskIndex > -1 && tasks[taskIndex].completed !== isCompleted) {
            tasks[taskIndex].completed = isCompleted;
            saveTasks();
            render();
        }
    };
    
    // Atualizar botão de prioridade
    const updatePriorityBtn = () => {
        if (taskPriorityBtn) {
            const indicator = taskPriorityBtn.querySelector('.priority-indicator-btn');
            if (indicator) {
                indicator.className = `bx bxs-circle priority-indicator-btn ${PRIORITIES[currentTaskPriority].colorClass}`;
            }
        }
    };
    
    // Inicializar módulo
    const init = () => {
        if (isInitialized) return;
        
        try {
            // Obter referências DOM
            taskInput = document.getElementById('task-input');
            taskPriorityBtn = document.getElementById('task-priority-btn');
            priorityPicker = document.getElementById('priority-picker');
            addTaskBtn = document.getElementById('add-task-btn');
            taskList = document.getElementById('task-list');
            clearCompletedBtn = document.getElementById('clear-completed-tasks-btn');
            
            if (!taskInput || !addTaskBtn || !taskList) {
                console.error('❌ Elementos de tarefas não encontrados');
                return;
            }
            
            // Carregar tarefas salvas
            loadTasks();
            
            // Configurar picker de prioridade
            if (priorityPicker) {
                priorityPicker.innerHTML = Object.keys(PRIORITIES).map(key => 
                    `<button class="priority-option" data-priority="${key}">
                        <span class="priority-dot ${PRIORITIES[key].colorClass}"></span>
                        ${PRIORITIES[key].name}
                    </button>`
                ).join('');
            }
            
            // Event listeners
            if (taskPriorityBtn) {
                taskPriorityBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (priorityPicker) {
                        priorityPicker.classList.toggle('hidden');
                    }
                });
            }
            
            if (priorityPicker) {
                priorityPicker.addEventListener('click', (e) => {
                    const option = e.target.closest('.priority-option');
                    if (option) {
                        currentTaskPriority = parseInt(option.dataset.priority);
                        updatePriorityBtn();
                        priorityPicker.classList.add('hidden');
                    }
                });
            }
            
            document.addEventListener('click', () => {
                if (priorityPicker) {
                    priorityPicker.classList.add('hidden');
                }
            });
            
            addTaskBtn.addEventListener('click', () => {
                add({ text: taskInput.value, priority: currentTaskPriority });
                taskInput.value = "";
                taskInput.focus(); // Manter foco para adicionar próxima tarefa
            });
            
            taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    add({ text: taskInput.value, priority: currentTaskPriority });
                    taskInput.value = "";
                }
            });
            
            if (clearCompletedBtn) {
                clearCompletedBtn.addEventListener('click', () => {
                    tasks = tasks.filter(task => !task.completed);
                    saveTasks();
                    render();
                });
            }
            
            taskList.addEventListener('click', (e) => {
                const item = e.target.closest('.task-item');
                if (!item) return;
                
                const taskId = Number(item.dataset.id);
                const taskIndex = tasks.findIndex(t => t.id === taskId);
                if (taskIndex === -1) return;

                if (e.target.closest('.complete-btn')) {
                    const isCompleted = !tasks[taskIndex].completed;
                    tasks[taskIndex].completed = isCompleted;
                    
                    // Adicionar data de conclusão e salvar no histórico
                    if (isCompleted) {
                        const completedDate = typeof Utils !== 'undefined' ? 
                            Utils.getTodayString() : 
                            new Date().toISOString().split('T')[0];
                        tasks[taskIndex].completedDate = completedDate;
                        
                        // Salvar no histórico para gráfico de produtividade
                        if (typeof Utils !== 'undefined' && Utils.saveCompletedTask) {
                            Utils.saveCompletedTask(tasks[taskIndex].text, completedDate);
                        }
                    } else {
                        delete tasks[taskIndex].completedDate;
                    }
                    
                    // Sincronizar com Goals se for subtarefa
                    const { goalId, subtaskId } = tasks[taskIndex];
                    if (goalId && subtaskId && window.Goals && window.Goals.setSubtaskCompletedState) {
                        window.Goals.setSubtaskCompletedState(Number(goalId), Number(subtaskId), isCompleted);
                    }
                }

                if (e.target.closest('.delete-btn')) {
                    tasks.splice(taskIndex, 1);
                }
                
                saveTasks();
                render();
            });
            
            // Renderizar e atualizar UI
            render();
            updatePriorityBtn();
            
            isInitialized = true;
            console.log('✅ Tasks module initialized');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Tasks:', error);
        }
    };
    

    
    // API pública
    return { 
        init, 
        add, 
        render, 
        setTaskCompletedStateBySubtask, 
        removeTaskBySubtask, 
        PRIORITIES,
        isInitialized: () => isInitialized 
    };
})();