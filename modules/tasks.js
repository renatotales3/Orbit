// Life OS - Módulo de Tarefas
// Sistema de gerenciamento de tarefas com integração ao Store

const Tasks = (() => {
    // Estado interno
    let isInitialized = false;
    let taskInput;
    let addTaskBtn;
    let taskList;
    let clearCompletedBtn;
    let priorityBtn;
    let priorityPicker;
    
    // Inicializar módulo
    const init = () => {
        if (isInitialized) return;
        
        try {
            // Obter referências DOM
            taskInput = document.getElementById('task-input');
            addTaskBtn = document.getElementById('add-task-btn');
            taskList = document.getElementById('task-list');
            clearCompletedBtn = document.getElementById('clear-completed-tasks-btn');
            priorityBtn = document.getElementById('task-priority-btn');
            priorityPicker = document.getElementById('priority-picker');
            
            if (!taskInput || !addTaskBtn || !taskList) {
                console.error('❌ Elementos de tarefas não encontrados');
                return;
            }
            
            // Configurar event listeners
            setupEventListeners();
            
            // Configurar seletor de prioridade
            setupPrioritySelector();
            
            // Renderizar tarefas existentes
            render();
            
            isInitialized = true;
            console.log('✅ Módulo de Tarefas inicializado');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar módulo de Tarefas:', error);
        }
    };
    
    // Configurar event listeners
    const setupEventListeners = () => {
        // Adicionar tarefa
        addTaskBtn.addEventListener('click', addTask);
        
        // Adicionar tarefa com Enter
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTask();
            }
        });
        
        // Limpar tarefas concluídas
        if (clearCompletedBtn) {
            clearCompletedBtn.addEventListener('click', clearCompletedTasks);
        }
        
        // Foco no input
        taskInput.addEventListener('focus', () => {
            taskInput.select();
        });
    };
    
    // Configurar seletor de prioridade
    const setupPrioritySelector = () => {
        if (!priorityBtn || !priorityPicker) return;
        
        // Criar opções de prioridade
        const priorities = [
            { value: 1, label: 'Alta', color: 'priority-1' },
            { value: 2, label: 'Média', color: 'priority-2' },
            { value: 3, label: 'Baixa', color: 'priority-3' }
        ];
        
        priorityPicker.innerHTML = '';
        priorities.forEach(priority => {
            const button = document.createElement('button');
            button.className = `priority-option ${priority.color}`;
            button.textContent = priority.label;
            button.dataset.priority = priority.value;
            
            button.addEventListener('click', () => {
                selectPriority(priority.value);
                priorityPicker.classList.add('hidden');
            });
            
            priorityPicker.appendChild(button);
        });
        
        // Toggle do picker
        priorityBtn.addEventListener('click', () => {
            priorityPicker.classList.toggle('hidden');
        });
        
        // Fechar ao clicar fora
        document.addEventListener('click', (e) => {
            if (!priorityBtn.contains(e.target) && !priorityPicker.contains(e.target)) {
                priorityPicker.classList.add('hidden');
            }
        });
        
        // Definir prioridade padrão
        selectPriority(3);
    };
    
    // Selecionar prioridade
    const selectPriority = (priority) => {
        if (!priorityBtn) return;
        
        // Atualizar botão
        const priorityIndicator = priorityBtn.querySelector('.priority-indicator-btn');
        if (priorityIndicator) {
            priorityIndicator.className = `priority-indicator-btn priority-${priority}`;
        }
        
        // Armazenar prioridade selecionada
        priorityBtn.dataset.priority = priority;
    };
    
    // Adicionar nova tarefa
    const addTask = () => {
        try {
            const text = taskInput.value.trim();
            if (!text) return;
            
            const priority = parseInt(priorityBtn.dataset.priority) || 3;
            
            const task = {
                id: Date.now() + Math.random(),
                text: text,
                priority: priority,
                completed: false,
                createdAt: new Date().toISOString(),
                completedAt: null
            };
            
            // Adicionar ao Store
            if (typeof Store !== 'undefined') {
                Store.addTask(task);
            } else {
                // Fallback para localStorage direto
                const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                tasks.push(task);
                localStorage.setItem('tasks', JSON.stringify(tasks));
            }
            
            // Limpar input
            taskInput.value = '';
            taskInput.focus();
            
            // Renderizar
            render();
            
            console.log('✅ Tarefa adicionada:', task);
            
        } catch (error) {
            console.error('❌ Erro ao adicionar tarefa:', error);
        }
    };
    
    // Marcar tarefa como concluída
    const completeTask = (taskId) => {
        try {
            if (typeof Store !== 'undefined') {
                Store.completeTask(taskId);
            } else {
                // Fallback para localStorage direto
                const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                const taskIndex = tasks.findIndex(t => t.id === taskId);
                
                if (taskIndex !== -1) {
                    const task = tasks[taskIndex];
                    task.completed = true;
                    task.completedAt = new Date().toISOString();
                    
                    // Adicionar ao histórico
                    const completedHistory = JSON.parse(localStorage.getItem('completedTasksHistory') || '[]');
                    completedHistory.push({
                        ...task,
                        completedDate: new Date().toISOString().split('T')[0]
                    });
                    localStorage.setItem('completedTasksHistory', JSON.stringify(completedHistory));
                    
                    // Remover da lista ativa
                    tasks.splice(taskIndex, 1);
                    localStorage.setItem('tasks', JSON.stringify(tasks));
                }
            }
            
            // Renderizar
            render();
            
        } catch (error) {
            console.error('❌ Erro ao concluir tarefa:', error);
        }
    };
    
    // Remover tarefa
    const removeTask = (taskId) => {
        try {
            if (typeof Store !== 'undefined') {
                Store.removeTask(taskId);
            } else {
                // Fallback para localStorage direto
                const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                const filteredTasks = tasks.filter(t => t.id !== taskId);
                localStorage.setItem('tasks', JSON.stringify(filteredTasks));
            }
            
            // Renderizar
            render();
            
        } catch (error) {
            console.error('❌ Erro ao remover tarefa:', error);
        }
    };
    
    // Limpar tarefas concluídas
    const clearCompletedTasks = () => {
        try {
            render();
        } catch (error) {
            console.error('❌ Erro ao limpar tarefas concluídas:', error);
        }
    };
    
    // Renderizar lista de tarefas
    const render = () => {
        try {
            if (!taskList) return;
            
            // Obter tarefas do Store ou localStorage
            let tasks = [];
            if (typeof Store !== 'undefined') {
                tasks = Store.getState().tasks;
            } else {
                tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            }
            
            // Limpar lista
            taskList.innerHTML = '';
            
            if (tasks.length === 0) {
                const emptyMessage = document.createElement('li');
                emptyMessage.className = 'empty-state';
                emptyMessage.innerHTML = '<p>Nenhuma tarefa pendente</p>';
                taskList.appendChild(emptyMessage);
                return;
            }
            
            // Ordenar tarefas por prioridade e criação
            const sortedTasks = tasks.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return a.priority - b.priority;
                }
                return new Date(a.createdAt) - new Date(b.createdAt);
            });
            
            // Renderizar cada tarefa
            sortedTasks.forEach(task => {
                const taskElement = createTaskElement(task);
                taskList.appendChild(taskElement);
            });
            
            // Atualizar estatísticas
            updateStats();
            
        } catch (error) {
            console.error('❌ Erro ao renderizar tarefas:', error);
        }
    };
    
    // Criar elemento de tarefa
    const createTaskElement = (task) => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.dataset.taskId = task.id;
        
        const priorityClass = `priority-${task.priority}`;
        
        li.innerHTML = `
            <div class="task-content">
                <button class="task-checkbox" aria-label="Marcar como concluída">
                    <i class='bx bx-check'></i>
                </button>
                <span class="task-text ${priorityClass}">${escapeHTML(task.text)}</span>
                <div class="task-priority ${priorityClass}">
                    <i class='bx bxs-circle'></i>
                </div>
            </div>
            <button class="task-remove" aria-label="Remover tarefa">
                <i class='bx bx-trash'></i>
            </button>
        `;
        
        // Event listeners
        const checkbox = li.querySelector('.task-checkbox');
        const removeBtn = li.querySelector('.task-remove');
        
        checkbox.addEventListener('click', () => completeTask(task.id));
        removeBtn.addEventListener('click', () => removeTask(task.id));
        
        return li;
    };
    
    // Atualizar estatísticas
    const updateStats = () => {
        try {
            // Atualizar contador de tarefas pendentes
            let tasks = [];
            if (typeof Store !== 'undefined') {
                tasks = Store.getState().tasks;
            } else {
                tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            }
            
            const pendingCount = tasks.length;
            
            // Atualizar elementos de estatísticas se existirem
            const statsElements = document.querySelectorAll('[data-stat="pending-tasks"]');
            statsElements.forEach(el => {
                el.textContent = pendingCount;
            });
            
        } catch (error) {
            console.error('❌ Erro ao atualizar estatísticas:', error);
        }
    };
    
    // Utilitário para escapar HTML
    const escapeHTML = (str) => {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    };
    
    // API pública
    return {
        init,
        render,
        addTask,
        completeTask,
        removeTask,
        clearCompletedTasks,
        isInitialized: () => isInitialized
    };
})();