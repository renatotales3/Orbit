document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS GERAIS ---
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.nav-button');
    const htmlElement = document.documentElement;

    // --- LÓGICA DE PERSISTÊNCIA E ESTADO ---
    const saveToLocalStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));
    const loadFromLocalStorage = (key, defaultValue) => JSON.parse(localStorage.getItem(key)) || defaultValue;

    const loadAppState = () => {
        applyTheme(loadFromLocalStorage('theme', 'light'));
        switchTab(loadFromLocalStorage('activeTab', 'inicio'));
    };

    // --- LÓGICA DE NAVEGAÇÃO E TEMA ---
    const switchTab = (targetId) => {
        const targetPage = document.getElementById(targetId);
        if (targetPage) {
            pages.forEach(p => p.classList.remove('active'));
            navButtons.forEach(b => b.classList.remove('active'));
            targetPage.classList.add('active');
            document.querySelector(`.nav-button[data-target="${targetId}"]`)?.classList.add('active');
        }
    };
    navButtons.forEach(button => button.addEventListener('click', () => {
        const targetId = button.dataset.target;
        switchTab(targetId);
        saveToLocalStorage('activeTab', targetId);
    }));
    const applyTheme = (theme) => htmlElement.setAttribute('data-theme', theme);
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const newTheme = htmlElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
        saveToLocalStorage('theme', newTheme);
    });

    // --- MÓDULO DE TAREFAS RÁPIDAS ---
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    let tasks = loadFromLocalStorage('tasks', []);

    const saveTasks = () => saveToLocalStorage('tasks', tasks);
    const renderTasks = () => {
        taskList.innerHTML = "";
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.index = index;
            li.innerHTML = `
                <span>${task.text}</span>
                <div class="task-item-buttons">
                    <button class="complete-btn"><i class='bx bx-check-circle'></i></button>
                    <button class="delete-btn"><i class='bx bxs-trash'></i></button>
                </div>
            `;
            taskList.appendChild(li);
        });
    };
    const addTask = (taskText) => {
        if (!taskText || taskText.trim() === "") return;
        tasks.push({ text: taskText.trim(), completed: false });
        saveTasks();
        renderTasks();
    };
    addTaskBtn.addEventListener('click', () => { addTask(taskInput.value); taskInput.value = ""; });
    taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { addTask(taskInput.value); taskInput.value = ""; } });
    taskList.addEventListener('click', (e) => {
        const item = e.target.closest('.task-item');
        if (!item) return;
        const index = parseInt(item.dataset.index);
        if (e.target.closest('.complete-btn')) tasks[index].completed = !tasks[index].completed;
        if (e.target.closest('.delete-btn')) tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    });

    // --- MÓDULO POMODORO ---
    const timerDisplay = document.getElementById('timer-display');
    const timerStatus = document.getElementById('timer-status');
    let timer, totalSeconds, isPaused = true;
    let currentCycle = loadFromLocalStorage('pomodoro_currentCycle', 'focus');
    let pomodoroCount = loadFromLocalStorage('pomodoro_pomodoroCount', 0);
    const FOCUS_TIME = 25 * 60, SHORT_BREAK_TIME = 5 * 60, LONG_BREAK_TIME = 15 * 60;
    
    const updateDisplay = () => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.title = `${timerDisplay.textContent} - Life OS`;
    };
    const switchCycle = () => {
        if (currentCycle === 'focus') {
            pomodoroCount++;
            currentCycle = (pomodoroCount % 4 === 0) ? 'longBreak' : 'shortBreak';
        } else {
            currentCycle = 'focus';
        }
        saveToLocalStorage('pomodoro_pomodoroCount', pomodoroCount);
        saveToLocalStorage('pomodoro_currentCycle', currentCycle);
        setTimerForCurrentCycle();
    };
    const setTimerForCurrentCycle = () => {
        isPaused = true;
        clearInterval(timer);
        switch (currentCycle) {
            case 'focus': totalSeconds = FOCUS_TIME; timerStatus.textContent = "Hora de Focar!"; break;
            case 'shortBreak': totalSeconds = SHORT_BREAK_TIME; timerStatus.textContent = "Pausa Curta"; break;
            case 'longBreak': totalSeconds = LONG_BREAK_TIME; timerStatus.textContent = "Pausa Longa"; break;
        }
        updateDisplay();
    };
    document.getElementById('start-btn').addEventListener('click', () => {
        if (isPaused) { isPaused = false; timer = setInterval(() => { if (totalSeconds-- > 0) updateDisplay(); else switchCycle(); }, 1000); }
    });
    document.getElementById('pause-btn').addEventListener('click', () => { isPaused = true; clearInterval(timer); });
    document.getElementById('reset-btn').addEventListener('click', setTimerForCurrentCycle);

    // --- MÓDULO DE METAS ---
    const goalModal = document.getElementById('goal-modal');
    const goalForm = document.getElementById('goal-form');
    const goalsList = document.getElementById('goals-list');
    let goals = loadFromLocalStorage('goals', []);
    const categoryColors = {
        Pessoal: '#007BFF', Profissional: '#6F42C1', Acadêmica: '#28A745',
        Saúde: '#FD7E14', Finanças: '#FFC107'
    };

    const saveGoals = () => saveToLocalStorage('goals', goals);
    const renderGoals = () => {
        goalsList.innerHTML = "";
        goals.forEach((goal, index) => {
            const progress = goal.subtasks.length > 0 ? (goal.subtasks.filter(st => st.completed).length / goal.subtasks.length) * 100 : 0;
            const li = document.createElement('li');
            li.className = 'goal-item';
            li.dataset.index = index;
            li.innerHTML = `
                <div class="goal-header">
                    <span class="goal-title">${goal.title}</span>
                    <span class="goal-category" style="background-color:${categoryColors[goal.category] || '#6c757d'}">${goal.category}</span>
                </div>
                <div class="goal-progress">
                    <div class="progress-bar-container"><div class="progress-bar" style="width: ${progress}%"></div></div>
                </div>
                <div class="goal-details">
                    <div class="goal-details-content">
                        <p class="goal-motivation"><strong>Motivação:</strong> ${goal.motivation || 'N/A'}</p>
                        <p class="goal-date"><strong>Data Alvo:</strong> ${goal.targetDate || 'N/A'}</p>
                        <ul class="subtask-list">${goal.subtasks.map((st, stIndex) => `
                            <li class="subtask-item">
                                <div>
                                    <input type="checkbox" id="st-${index}-${stIndex}" data-subtask-index="${stIndex}" ${st.completed ? 'checked' : ''}>
                                    <label for="st-${index}-${stIndex}" class="${st.completed ? 'completed' : ''}">${st.text}</label>
                                </div>
                                <div class="subtask-actions">
                                    <button class="add-to-focus-btn" data-subtask-index="${stIndex}"><i class='bx bx-list-plus'></i></button>
                                    <button class="delete-subtask-btn" data-subtask-index="${stIndex}"><i class='bx bxs-trash'></i></button>
                                </div>
                            </li>`).join('')}
                        </ul>
                        <form class="add-subtask-form">
                            <input type="text" class="subtask-input" placeholder="Novo passo...">
                            <button type="submit" class="soft-button"><i class='bx bx-plus'></i></button>
                        </form>
                    </div>
                </div>
            `;
            goalsList.appendChild(li);
        });
    };

    const openGoalModal = () => goalModal.classList.remove('hidden');
    const closeGoalModal = () => { goalModal.classList.add('hidden'); goalForm.reset(); };
    document.getElementById('add-goal-modal-btn').addEventListener('click', openGoalModal);
    document.getElementById('cancel-goal-btn').addEventListener('click', closeGoalModal);
    goalModal.addEventListener('click', (e) => { if (e.target === goalModal) closeGoalModal(); });

    goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        goals.push({
            title: document.getElementById('goal-title-input').value,
            motivation: document.getElementById('goal-motivation-input').value,
            category: document.getElementById('goal-category-input').value,
            targetDate: document.getElementById('goal-date-input').value,
            subtasks: []
        });
        saveGoals();
        renderGoals();
        closeGoalModal();
    });

    goalsList.addEventListener('click', (e) => {
        const goalItem = e.target.closest('.goal-item');
        if (!goalItem) return;
        const goalIndex = parseInt(goalItem.dataset.index);

        // Ação de expandir/recolher
        if (!e.target.closest('.goal-details-content') && !e.target.closest('.goal-header')) {
             goalItem.classList.toggle('expanded');
        }
        // Assegura que clicar no header também expande
        if (e.target.closest('.goal-header') || e.target.closest('.goal-progress')) {
             goalItem.classList.toggle('expanded');
        }

        const subtaskCheckbox = e.target.closest('input[type="checkbox"]');
        if (subtaskCheckbox) {
            const subtaskIndex = parseInt(subtaskCheckbox.dataset.subtaskIndex);
            goals[goalIndex].subtasks[subtaskIndex].completed = subtaskCheckbox.checked;
        }

        const deleteSubtaskBtn = e.target.closest('.delete-subtask-btn');
        if (deleteSubtaskBtn) {
            const subtaskIndex = parseInt(deleteSubtaskBtn.dataset.subtaskIndex);
            goals[goalIndex].subtasks.splice(subtaskIndex, 1);
        }

        const addToFocusBtn = e.target.closest('.add-to-focus-btn');
        if (addToFocusBtn) {
            const subtaskIndex = parseInt(addToFocusBtn.dataset.subtaskIndex);
            const subtaskText = goals[goalIndex].subtasks[subtaskIndex].text;
            addTask(`[${goals[goalIndex].title}] ${subtaskText}`);
        }
        
        saveGoals();
        renderGoals();
        // Mantém o estado expandido após a ação
        if(goalItem.classList.contains('expanded')) {
            const newGoalItem = document.querySelector(`.goal-item[data-index="${goalIndex}"]`);
            if(newGoalItem) newGoalItem.classList.add('expanded');
        }
    });

    goalsList.addEventListener('submit', (e) => {
        e.preventDefault();
        if (e.target.classList.contains('add-subtask-form')) {
            const goalItem = e.target.closest('.goal-item');
            const goalIndex = parseInt(goalItem.dataset.index);
            const subtaskInput = e.target.querySelector('.subtask-input');
            const subtaskText = subtaskInput.value.trim();
            if (subtaskText) {
                goals[goalIndex].subtasks.push({ text: subtaskText, completed: false });
                subtaskInput.value = "";
                saveGoals();
                renderGoals();
                // Mantém o card expandido após adicionar sub-tarefa
                document.querySelector(`.goal-item[data-index="${goalIndex}"]`).classList.add('expanded');
            }
        }
    });
    
    // --- INICIALIZAÇÃO GERAL ---
    loadAppState();
    renderTasks();
    setTimerForCurrentCycle();
    renderGoals();
});