document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS GERAIS E ESTADO DO APP ---
    const htmlElement = document.documentElement;
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.nav-button');
    const saveToLocalStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));
    const loadFromLocalStorage = (key, defaultValue) => JSON.parse(localStorage.getItem(key)) || defaultValue;

    // --- NAVEGAÇÃO E TEMA ---
    const applyTheme = (theme) => htmlElement.setAttribute('data-theme', theme);
    const switchTab = (targetId) => {
        const targetPage = document.getElementById(targetId);
        if (!targetPage) return;
        pages.forEach(p => p.classList.remove('active'));
        navButtons.forEach(b => b.classList.remove('active'));
        targetPage.classList.add('active');
        document.querySelector(`.nav-button[data-target="${targetId}"]`)?.classList.add('active');
    };
    navButtons.forEach(button => button.addEventListener('click', () => {
        const targetId = button.dataset.target;
        switchTab(targetId);
        saveToLocalStorage('activeTab', targetId);
    }));
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const newTheme = htmlElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
        saveToLocalStorage('theme', newTheme);
    });

    // --- MÓDULO DE TAREFAS RÁPIDAS ---
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    let tasks = loadFromLocalStorage('tasks', []);
    const saveTasks = () => saveToLocalStorage('tasks', tasks);
    const renderTasks = () => {
        taskList.innerHTML = "";
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.index = index;
            li.innerHTML = `<span>${task.text}</span><div class="task-item-buttons"><button class="complete-btn"><i class='bx bx-check-circle'></i></button><button class="delete-btn"><i class='bx bxs-trash'></i></button></div>`;
            taskList.appendChild(li);
        });
    };
    const addTask = (taskText) => {
        if (!taskText?.trim()) return;
        tasks.push({ text: taskText.trim(), completed: false });
        saveTasks();
        renderTasks();
    };
    document.getElementById('add-task-btn').addEventListener('click', () => { addTask(taskInput.value); taskInput.value = ""; });
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
        if (!timerDisplay) return;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.title = `${timerDisplay.textContent} - Life OS`;
    };
    const switchCycle = () => {
        currentCycle = (currentCycle === 'focus') ? ((++pomodoroCount % 4 === 0) ? 'longBreak' : 'shortBreak') : 'focus';
        saveToLocalStorage('pomodoro_pomodoroCount', pomodoroCount);
        saveToLocalStorage('pomodoro_currentCycle', currentCycle);
        setTimerForCurrentCycle();
    };
    const setTimerForCurrentCycle = () => {
        isPaused = true; clearInterval(timer);
        switch (currentCycle) {
            case 'focus': totalSeconds = FOCUS_TIME; timerStatus.textContent = "Hora de Focar!"; break;
            case 'shortBreak': totalSeconds = SHORT_BREAK_TIME; timerStatus.textContent = "Pausa Curta"; break;
            case 'longBreak': totalSeconds = LONG_BREAK_TIME; timerStatus.textContent = "Pausa Longa"; break;
        }
        updateDisplay();
    };
    document.getElementById('start-btn').addEventListener('click', () => {
        if (isPaused) { isPaused = false; timer = setInterval(() => { if (--totalSeconds >= 0) updateDisplay(); else switchCycle(); }, 1000); }
    });
    document.getElementById('pause-btn').addEventListener('click', () => { isPaused = true; clearInterval(timer); });
    document.getElementById('reset-btn').addEventListener('click', setTimerForCurrentCycle);

    // --- MÓDULO DE METAS ---
    const goalModal = document.getElementById('goal-modal');
    const goalForm = document.getElementById('goal-form');
    const goalsList = document.getElementById('goals-list');
    const modalTitle = document.getElementById('modal-title');
    const categoryContainer = document.getElementById('goal-category-container');
    let goals = loadFromLocalStorage('goals', []);
    const ALL_CATEGORIES = { 'Pessoal': '#007BFF', 'Profissional': '#6F42C1', 'Acadêmica': '#28A745', 'Saúde': '#FD7E14', 'Finanças': '#FFC107' };

    const saveGoals = () => saveToLocalStorage('goals', goals);
    const renderGoals = () => {
        goalsList.innerHTML = "";
        goals.forEach((goal, index) => {
            const progress = goal.subtasks.length > 0 ? (goal.subtasks.filter(st => st.completed).length / goal.subtasks.length) * 100 : 0;
            const li = document.createElement('li');
            li.className = 'goal-item'; li.dataset.index = index;
            li.innerHTML = `
                <div class="goal-header">
                    <span class="goal-title">${goal.title}</span>
                    <div class="goal-actions">
                        <button class="edit-goal-btn" title="Editar Meta"><i class='bx bxs-pencil'></i></button>
                        <button class="delete-goal-btn" title="Excluir Meta"><i class='bx bxs-trash'></i></button>
                    </div>
                </div>
                <div class="goal-progress"><div class="progress-bar-container"><div class="progress-bar" style="width: ${progress.toFixed(0)}%"></div></div></div>
                <div class="goal-details">
                    <div class="goal-details-content">
                        <div class="goal-categories">${goal.categories.map(cat => `<span class="goal-category" style="background-color:${ALL_CATEGORIES[cat] || '#6c757d'}">${cat}</span>`).join('')}</div>
                        <div class="goal-meta-info">
                            <p class="goal-motivation"><strong>Motivação:</strong> ${goal.motivation || 'N/A'}</p>
                            <p class="goal-date"><strong>Data Alvo:</strong> ${goal.targetDate || 'N/A'}</p>
                        </div>
                        <ul class="subtask-list">${goal.subtasks.map((st, stIndex) => `
                            <li class="subtask-item">
                                <input type="checkbox" id="st-${index}-${stIndex}" data-subtask-index="${stIndex}" ${st.completed ? 'checked' : ''}>
                                <label for="st-${index}-${stIndex}" class="subtask-item-label ${st.completed ? 'completed' : ''}">
                                    <span class="custom-checkbox"></span>
                                    ${st.text}
                                </label>
                                <div class="subtask-actions">
                                    <button class="add-to-focus-btn" data-subtask-index="${stIndex}" title="Adicionar ao Foco do Dia"><i class='bx bx-list-plus'></i></button>
                                    <button class="delete-subtask-btn" data-subtask-index="${stIndex}" title="Excluir Subtarefa"><i class='bx bxs-trash'></i></button>
                                </div>
                            </li>`).join('')}
                        </ul>
                        <form class="add-subtask-form"><input type="text" class="soft-input subtask-input" placeholder="Novo passo..."><button type="submit" class="soft-button add-subtask-btn"><i class='bx bx-plus'></i></button></form>
                    </div>
                </div>`;
            goalsList.appendChild(li);
        });
    };

    const openGoalModal = (mode = 'add', index = null) => {
        goalForm.reset();
        goalForm.dataset.mode = mode;
        goalForm.dataset.index = index;
        categoryContainer.innerHTML = Object.keys(ALL_CATEGORIES).map(cat => `<button type="button" class="category-btn">${cat}</button>`).join('');
        
        if (mode === 'edit' && index !== null) {
            modalTitle.textContent = "Editar Meta";
            const goal = goals[index];
            document.getElementById('goal-title-input').value = goal.title;
            document.getElementById('goal-motivation-input').value = goal.motivation;
            document.getElementById('goal-date-input').value = goal.targetDate;
            categoryContainer.querySelectorAll('.category-btn').forEach(btn => {
                if (goal.categories.includes(btn.textContent)) btn.classList.add('active');
            });
        } else {
            modalTitle.textContent = "Criar Nova Meta";
        }
        goalModal.classList.remove('hidden');
    };
    const closeGoalModal = () => goalModal.classList.add('hidden');

    document.getElementById('add-goal-modal-btn').addEventListener('click', () => openGoalModal('add'));
    document.getElementById('cancel-goal-btn').addEventListener('click', closeGoalModal);
    goalModal.addEventListener('click', (e) => { if (e.target === goalModal) closeGoalModal(); });
    categoryContainer.addEventListener('click', (e) => { if (e.target.classList.contains('category-btn')) e.target.classList.toggle('active'); });

    goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const selectedCategories = [...categoryContainer.querySelectorAll('.category-btn.active')].map(btn => btn.textContent);
        if (document.getElementById('goal-title-input').value.trim() === '') {
            alert("O título da meta é obrigatório.");
            return;
        }
        if (selectedCategories.length === 0) {
            alert("Por favor, selecione ao menos uma categoria.");
            return;
        }
        const mode = goalForm.dataset.mode;
        const index = goalForm.dataset.index;
        const goalData = {
            title: document.getElementById('goal-title-input').value,
            motivation: document.getElementById('goal-motivation-input').value,
            categories: selectedCategories,
            targetDate: document.getElementById('goal-date-input').value,
            subtasks: (mode === 'edit' && goals[index]) ? goals[index].subtasks : []
        };
        if (mode === 'add') {
            goals.push(goalData);
        } else if (mode === 'edit') {
            goals[index] = goalData;
        }
        saveGoals();
        renderGoals();
        closeGoalModal();
    });

    goalsList.addEventListener('click', (e) => {
        const goalItem = e.target.closest('.goal-item');
        if (!goalItem) return;
        const goalIndex = parseInt(goalItem.dataset.index);
        let shouldReRender = false;

        if (e.target.closest('.goal-header') || e.target.closest('.goal-progress')) goalItem.classList.toggle('expanded');
        if (e.target.closest('.edit-goal-btn')) openGoalModal('edit', goalIndex);
        if (e.target.closest('.delete-goal-btn')) { goals.splice(goalIndex, 1); shouldReRender = true; }
        
        if (e.target.closest('.subtask-item-label') || e.target.closest('.custom-checkbox')) {
            const checkbox = goalItem.querySelector(`input[id^="st-${goalIndex}-"][data-subtask-index="${e.target.closest('.subtask-item').querySelector('input').dataset.subtaskIndex}"]`);
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                goals[goalIndex].subtasks[checkbox.dataset.subtaskIndex].completed = checkbox.checked;
                shouldReRender = true;
            }
        }
        if (e.target.closest('.delete-subtask-btn')) {
            goals[goalIndex].subtasks.splice(e.target.closest('.delete-subtask-btn').dataset.subtaskIndex, 1);
            shouldReRender = true;
        }
        if (e.target.closest('.add-to-focus-btn')) {
            const subtaskText = goals[goalIndex].subtasks[e.target.closest('.add-to-focus-btn').dataset.subtaskIndex].text;
            addTask(`[${goals[goalIndex].title}] ${subtaskText}`);
        }
        
        if (shouldReRender) {
            const wasExpanded = goalItem.classList.contains('expanded');
            saveGoals();
            renderGoals();
            if (wasExpanded) document.querySelector(`.goal-item[data-index="${goalIndex}"]`)?.classList.add('expanded');
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
                saveGoals();
                renderGoals();
                document.querySelector(`.goal-item[data-index="${goalIndex}"]`)?.classList.add('expanded');
            }
        }
    });
    
    // --- INICIALIZAÇÃO GERAL ---
    const initApp = () => {
        applyTheme(loadFromLocalStorage('theme', 'light'));
        renderTasks();
        setTimerForCurrentCycle();
        renderGoals();
        switchTab(loadFromLocalStorage('activeTab', 'inicio'));
    };
    initApp();
});