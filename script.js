document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS GERAIS E ESTADO DO APP ---
    const htmlElement = document.documentElement;
    const saveToLocalStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));
    const loadFromLocalStorage = (key, defaultValue) => JSON.parse(localStorage.getItem(key)) || defaultValue;

    // --- NAVEGAÇÃO E TEMA ---
    const applyTheme = (theme) => htmlElement.setAttribute('data-theme', theme);
    // ... (código de navegação e tema permanece o mesmo) ...

    // --- MÓDULO DE TAREFAS RÁPIDAS (COM NOVO SISTEMA DE PRIORIDADE) ---
    const taskInput = document.getElementById('task-input');
    const taskPriorityBtn = document.getElementById('task-priority-btn');
    const priorityPicker = document.getElementById('priority-picker');
    const taskList = document.getElementById('task-list');
    
    const PRIORITIES = {
        1: { name: 'Urgente', colorClass: 'priority-1' },
        2: { name: 'Alta', colorClass: 'priority-2' },
        3: { name: 'Média', colorClass: 'priority-3' },
        4: { name: 'Baixa', colorClass: 'priority-4' }
    };

    let tasks = loadFromLocalStorage('tasks', []);
    let currentTaskPriority = 3; // Padrão: Média

    const saveTasks = () => saveToLocalStorage('tasks', tasks);
    
    const renderTasks = () => {
        // Ordena as tarefas por prioridade antes de renderizar
        tasks.sort((a, b) => a.priority - b.priority);

        taskList.innerHTML = "";
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.index = index; // Usado para encontrar a tarefa no array original após ordenar
            const priorityInfo = PRIORITIES[task.priority];

            li.innerHTML = `
                <div class="task-item-content">
                    <span class="priority-tag ${priorityInfo.colorClass}">${priorityInfo.name}</span>
                    <span>${task.text}</span>
                </div>
                <div class="task-item-buttons">
                    <button class="complete-btn"><i class='bx bx-check-circle'></i></button>
                    <button class="delete-btn"><i class='bx bxs-trash'></i></button>
                </div>`;
            taskList.appendChild(li);
        });
    };

    const addTask = (taskText, priority) => {
        if (!taskText?.trim()) return;
        tasks.push({ text: taskText.trim(), completed: false, priority: priority });
        saveTasks();
        renderTasks();
    };

    // Lógica do seletor de prioridade customizado
    const updatePriorityBtn = () => {
        const indicator = taskPriorityBtn.querySelector('.priority-indicator-btn');
        indicator.className = `bx bxs-circle priority-indicator-btn ${PRIORITIES[currentTaskPriority].colorClass}`;
    };

    priorityPicker.innerHTML = Object.keys(PRIORITIES).map(key => `
        <button class="priority-option" data-priority="${key}">
            <span class="priority-dot ${PRIORITIES[key].colorClass}"></span>
            ${PRIORITIES[key].name}
        </button>
    `).join('');

    taskPriorityBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        priorityPicker.classList.toggle('hidden');
    });

    priorityPicker.addEventListener('click', (e) => {
        const option = e.target.closest('.priority-option');
        if (option) {
            currentTaskPriority = parseInt(option.dataset.priority);
            updatePriorityBtn();
            priorityPicker.classList.add('hidden');
        }
    });

    document.addEventListener('click', () => priorityPicker.classList.add('hidden'));

    document.getElementById('add-task-btn').addEventListener('click', () => {
        addTask(taskInput.value, currentTaskPriority);
        taskInput.value = "";
    });
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask(taskInput.value, currentTaskPriority);
            taskInput.value = "";
        }
    });

    taskList.addEventListener('click', (e) => {
        const item = e.target.closest('.task-item');
        if (!item) return;

        // Encontra o objeto da tarefa real no array não ordenado
        const originalIndex = tasks.findIndex(task => task.text === item.querySelector('.task-item-content span:last-child').textContent);
        
        if (e.target.closest('.complete-btn')) {
            tasks[originalIndex].completed = !tasks[originalIndex].completed;
        }
        if (e.target.closest('.delete-btn')) {
            tasks.splice(originalIndex, 1);
        }
        saveTasks();
        renderTasks();
    });

    // --- INICIALIZAÇÃO GERAL ---
    const initApp = () => {
        // ... código de inicialização de tema, abas, pomodoro, metas ...
        updatePriorityBtn();
        renderTasks();
        // ... resto da inicialização
    };
    initApp();

    // Restante do seu código JS (Pomodoro, Metas, etc.) permanece aqui.
    // ... (Copie e cole o restante do seu código JS funcional aqui) ...
});