document.addEventListener('DOMContentLoaded', () => {

    // --- MÓDULO GERAL DO APP (Controlador Principal) ---
    const App = (() => {
        const init = () => {
            Theme.init();
            Navigation.init();
            Pomodoro.init();
            Tasks.init();
            Goals.init();
            Habits.init();
            Mood.init();
            Journal.init();
            Metrics.init();
            FocusExtras.init();
            Fitness.init();

            // Lógica de inicialização corrigida
            const content = document.querySelector('.content');
            const savedTab = Utils.loadFromLocalStorage('activeTab', 'inicio');
            Navigation.switchTab(savedTab);
            content.classList.add('js-loaded');
        };
        return { init };
    })();

    // --- MÓDULO DE UTILITÁRIOS ---
    const Utils = (() => {
        const saveToLocalStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));
        const loadFromLocalStorage = (key, defaultValue) => JSON.parse(localStorage.getItem(key)) || defaultValue;
        const getTodayString = () => new Date().toISOString().split('T')[0];
        const formatDateToBR = (dateString) => {
            const date = new Date(dateString);
            const userTimezoneOffset = date.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
            return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(adjustedDate);
        };
        const escapeHTML = (str) => {
            const div = document.createElement('div');
            div.appendChild(document.createTextNode(str));
            return div.innerHTML;
        };
        return { saveToLocalStorage, loadFromLocalStorage, getTodayString, formatDateToBR, escapeHTML };
    })();

    // --- MÓDULO DE NAVEGAÇÃO ---
    const Navigation = (() => {
        const content = document.querySelector('.content');
        const pages = document.querySelectorAll('.page');
        const allNavButtons = document.querySelectorAll('.nav-button');

        const switchTab = (targetId) => {
            const targetPage = document.getElementById(targetId);
            if (!targetPage) {
                // Se a aba salva não existir, volta para o início
                switchTab('inicio');
                return;
            }

            pages.forEach(p => p.classList.remove('active'));
            targetPage.classList.add('active');
            allNavButtons.forEach(b => b.classList.toggle('active', b.dataset.target === targetId));
            Utils.saveToLocalStorage('activeTab', targetId);
            content.scrollTop = 0;

            // Renderiza módulos relevantes para a aba ativa para garantir que estejam atualizados
            if (targetId === 'bem-estar') {
                Metrics.render();
                Mood.render();
                Journal.render();
                Habits.render();
            } else if (targetId === 'foco') {
                Goals.render();
                Tasks.render();
                FocusExtras.renderStats();
            } else if (targetId === 'fitness') {
                // Fitness não requer re-render explícito além do próprio estado inicial
            }
        };

        const init = () => {
            allNavButtons.forEach(button => button.addEventListener('click', () => switchTab(button.dataset.target)));
        };
        return { init, switchTab };
    })();

    // --- MÓDULO DE DADOS DIÁRIOS ---
    const DailyData = (() => {
        let allData = Utils.loadFromLocalStorage('dailyData', []);

        const getTodayData = () => {
            const todayString = Utils.getTodayString();
            let todayData = allData.find(d => d.date === todayString);
            if (!todayData) {
                todayData = { date: todayString, mood: null, journal: null, water: 0, sleep: null };
                allData.push(todayData);
            }
            return todayData;
        };

        const saveData = () => {
            Utils.saveToLocalStorage('dailyData', allData);
        };

        return { getTodayData, saveData, getAllData: () => allData };
    })();

    // --- MÓDULO DE TEMA E CORES ---
    const Theme = (() => {
        const htmlElement = document.documentElement;
        const themeToggleBtn = document.getElementById('theme-toggle');
        const lightPalette = document.getElementById('light-theme-palette');
        const darkPalette = document.getElementById('dark-theme-palette');
        const LIGHT_THEME_COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#17A2B8', '#FF69B4'];
        const DARK_THEME_COLORS = ['#EAEAEA', '#F0D55D', '#48E5C2', '#D27CFF', '#FF6B6B', '#3399FF', '#FD7E14'];
        const applyTheme = (theme) => { htmlElement.setAttribute('data-theme', theme); Utils.saveToLocalStorage('theme', theme); applyAccentColor(); };
        const applyAccentColor = () => { const currentTheme = htmlElement.getAttribute('data-theme'); const colors = currentTheme === 'light' ? LIGHT_THEME_COLORS : DARK_THEME_COLORS; const savedColor = Utils.loadFromLocalStorage(`${currentTheme}AccentColor`, colors[0]); htmlElement.style.setProperty('--primary-color', savedColor); const palette = document.getElementById(`${currentTheme}-theme-palette`); palette.querySelector('.color-swatch.active')?.classList.remove('active'); palette.querySelector(`.color-swatch[data-color="${savedColor}"]`)?.classList.add('active'); };
        const renderColorPickers = () => { lightPalette.innerHTML = LIGHT_THEME_COLORS.map(color => `<div class="color-swatch" data-color="${color}" style="background-color:${color}"></div>`).join(''); darkPalette.innerHTML = DARK_THEME_COLORS.map(color => `<div class="color-swatch" data-color="${color}" style="background-color:${color}"></div>`).join(''); };
        const init = () => { const savedTheme = Utils.loadFromLocalStorage('theme', 'light'); htmlElement.setAttribute('data-theme', savedTheme); renderColorPickers(); applyAccentColor(); themeToggleBtn.addEventListener('click', () => applyTheme(htmlElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light')); lightPalette.addEventListener('click', e => { if(e.target.classList.contains('color-swatch')) { Utils.saveToLocalStorage('lightAccentColor', e.target.dataset.color); applyAccentColor(); }}); darkPalette.addEventListener('click', e => { if(e.target.classList.contains('color-swatch')) { Utils.saveToLocalStorage('darkAccentColor', e.target.dataset.color); applyAccentColor(); }}); };
        return { init };
    })();

    // --- MÓDULO DE TAREFAS RÁPIDAS ---
    const Tasks = (() => {
        const taskInput = document.getElementById('task-input');
        const taskPriorityBtn = document.getElementById('task-priority-btn');
        const priorityPicker = document.getElementById('priority-picker');
        const addTaskBtn = document.getElementById('add-task-btn');
        const taskList = document.getElementById('task-list');
        const clearCompletedBtn = document.getElementById('clear-completed-tasks-btn');
        const PRIORITIES = { 1: { name: 'Urgente', colorClass: 'priority-1' }, 2: { name: 'Alta', colorClass: 'priority-2' }, 3: { name: 'Média', colorClass: 'priority-3' }, 4: { name: 'Baixa', colorClass: 'priority-4' }};
        let tasks = Utils.loadFromLocalStorage('tasks', []);
        let currentTaskPriority = 3;

        const createTaskHTML = task => {
            const priorityInfo = PRIORITIES[task.priority];
            const dataAttrs = (task.goalId && task.subtaskId) ? `data-goal-id="${task.goalId}" data-subtask-id="${task.subtaskId}"` : '';
            return `<li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}" ${dataAttrs}>
                        <div class="task-item-content">
                            <button class="complete-btn"><i class='bx bx-check-circle'></i></button>
                            <span class="priority-tag ${priorityInfo.colorClass}">${priorityInfo.name}</span>
                            <span>${task.text}</span>
                        </div>
                        <div class="task-item-buttons">
                            <button class="soft-button icon-btn delete-btn"><i class='bx bxs-trash'></i></button>
                        </div>
                    </li>`;
        };

        const render = () => {
            const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority);
            taskList.innerHTML = sortedTasks.map(createTaskHTML).join('');

            const hasCompleted = tasks.some(task => task.completed);
            clearCompletedBtn.classList.toggle('hidden', !hasCompleted);
        };

        const add = (taskData) => { 
            const text = taskData.text?.trim();
            if (text) { 
                const newTask = { 
                    id: Date.now(),
                    text: text, 
                    completed: false, 
                    priority: parseInt(taskData.priority),
                    goalId: taskData.goalId || null,
                    subtaskId: taskData.subtaskId || null
                };
                tasks.push(newTask);
                Utils.saveToLocalStorage('tasks', tasks); 
                render(); 
            }
        };

        const removeTaskBySubtask = (goalId, subtaskId) => {
            tasks = tasks.filter(task => !(task.goalId === goalId && task.subtaskId === subtaskId));
            Utils.saveToLocalStorage('tasks', tasks);
            render();
        };

        const updatePriorityBtn = () => { taskPriorityBtn.querySelector('.priority-indicator-btn').className = `bx bxs-circle priority-indicator-btn ${PRIORITIES[currentTaskPriority].colorClass}`; };

        const init = () => {
            priorityPicker.innerHTML = Object.keys(PRIORITIES).map(key => `<button class="priority-option" data-priority="${key}"><span class="priority-dot ${PRIORITIES[key].colorClass}"></span>${PRIORITIES[key].name}</button>`).join('');
            taskPriorityBtn.addEventListener('click', e => { e.stopPropagation(); priorityPicker.classList.toggle('hidden'); });
            priorityPicker.addEventListener('click', e => { const option = e.target.closest('.priority-option'); if (option) { currentTaskPriority = parseInt(option.dataset.priority); updatePriorityBtn(); priorityPicker.classList.add('hidden'); }});
            document.addEventListener('click', () => priorityPicker.classList.add('hidden'));
            addTaskBtn.addEventListener('click', () => { add({ text: taskInput.value, priority: currentTaskPriority }); taskInput.value = ""; });
            taskInput.addEventListener('keypress', e => { if (e.key === 'Enter') { add({ text: taskInput.value, priority: currentTaskPriority }); taskInput.value = ""; }});

            clearCompletedBtn.addEventListener('click', () => {
                tasks = tasks.filter(task => !task.completed);
                Utils.saveToLocalStorage('tasks', tasks);
                render();
            });

            taskList.addEventListener('click', e => {
                const item = e.target.closest('.task-item'); if (!item) return;
                const taskId = Number(item.dataset.id);
                const taskIndex = tasks.findIndex(t => t.id === taskId);
                if (taskIndex === -1) return;

                if (e.target.closest('.complete-btn')) {
                    const isCompleted = !tasks[taskIndex].completed;
                    tasks[taskIndex].completed = isCompleted;
                    const { goalId, subtaskId } = tasks[taskIndex];
                    if (goalId && subtaskId) {
                        Goals.setSubtaskCompletedState(Number(goalId), Number(subtaskId), isCompleted);
                    }
                }

                if (e.target.closest('.delete-btn')) {
                    tasks.splice(taskIndex, 1);
                }
                Utils.saveToLocalStorage('tasks', tasks);
                render();
            });
            render(); updatePriorityBtn();
        };

        const setTaskCompletedStateBySubtask = (goalId, subtaskId, isCompleted) => {
            const taskIndex = tasks.findIndex(t => t.goalId === goalId && t.subtaskId === subtaskId);
            if (taskIndex > -1 && tasks[taskIndex].completed !== isCompleted) {
                tasks[taskIndex].completed = isCompleted;
                Utils.saveToLocalStorage('tasks', tasks);
                render();
            }
        };

        return { init, add, render, setTaskCompletedStateBySubtask, removeTaskBySubtask, PRIORITIES };
    })();

    // --- MÓDULO POMODORO ---
    const Pomodoro = (() => {
        const timerDisplay = document.getElementById('timer-display'), timerStatus = document.getElementById('timer-status'), startBtn = document.getElementById('start-btn'), pauseBtn = document.getElementById('pause-btn'), resetBtn = document.getElementById('reset-btn'), focusTimeInput = document.getElementById('focus-time'), shortBreakTimeInput = document.getElementById('short-break-time'), longBreakTimeInput = document.getElementById('long-break-time');
        let timer, totalSeconds, isPaused = true;
        let currentCycle = Utils.loadFromLocalStorage('pomodoro_currentCycle', 'focus'), pomodoroCount = Utils.loadFromLocalStorage('pomodoro_pomodoroCount', 0);
        const getTimes = () => Utils.loadFromLocalStorage('pomodoroTimes', { focus: 25, shortBreak: 5, longBreak: 15 });
        const saveTimes = () => { const times = { focus: parseInt(focusTimeInput.value) || 25, shortBreak: parseInt(shortBreakTimeInput.value) || 5, longBreak: parseInt(longBreakTimeInput.value) || 15 }; Utils.saveToLocalStorage('pomodoroTimes', times); setTimerForCurrentCycle(); };
        const updateDisplay = () => { if (!timerDisplay) return; const minutes = Math.floor(totalSeconds / 60), seconds = totalSeconds % 60; timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`; document.title = `${timerDisplay.textContent} - Life OS`; };
        const switchCycle = () => { currentCycle = (currentCycle === 'focus') ? ((++pomodoroCount % 4 === 0) ? 'longBreak' : 'shortBreak') : 'focus'; if (currentCycle !== 'focus') { const times = getTimes(); FocusExtras.onFocusSessionComplete(times.focus); } Utils.saveToLocalStorage('pomodoro_pomodoroCount', pomodoroCount); Utils.saveToLocalStorage('pomodoro_currentCycle', currentCycle); setTimerForCurrentCycle(); };
        const setTimerForCurrentCycle = () => { isPaused = true; clearInterval(timer); const times = getTimes(); switch (currentCycle) { case 'focus': totalSeconds = times.focus * 60; timerStatus.textContent = "Hora de Focar!"; break; case 'shortBreak': totalSeconds = times.shortBreak * 60; timerStatus.textContent = "Pausa Curta"; break; case 'longBreak': totalSeconds = times.longBreak * 60; timerStatus.textContent = "Pausa Longa"; break; } updateDisplay(); };
        const init = () => { const times = getTimes(); focusTimeInput.value = times.focus; shortBreakTimeInput.value = times.shortBreak; longBreakTimeInput.value = times.longBreak; focusTimeInput.addEventListener('change', saveTimes); shortBreakTimeInput.addEventListener('change', saveTimes); longBreakTimeInput.addEventListener('change', saveTimes); startBtn.addEventListener('click', () => { if (isPaused) { isPaused = false; timer = setInterval(() => { if (--totalSeconds >= 0) updateDisplay(); else switchCycle(); }, 1000); } }); pauseBtn.addEventListener('click', () => { isPaused = true; clearInterval(timer); }); resetBtn.addEventListener('click', setTimerForCurrentCycle); setTimerForCurrentCycle(); };
        return { init };
    })();

    // --- MÓDULO DE METAS ---
    const Goals = (() => {
        const goalModal = document.getElementById('goal-modal'), goalForm = document.getElementById('goal-form'), goalsList = document.getElementById('goals-list'), modalTitle = document.getElementById('modal-title'), addGoalModalBtn = document.getElementById('add-goal-modal-btn'), categoryContainer = document.getElementById('goal-category-container');
        const priorityModal = document.getElementById('priority-modal-for-subtask');
        const subtaskPriorityPicker = document.getElementById('subtask-priority-picker');
        let goals = Utils.loadFromLocalStorage('goals', []);
        let subtaskToAdd = null;
        const ALL_CATEGORIES = { 'Pessoal': '#007BFF', 'Profissional': '#6F42C1', 'Acadêmica': '#28A745', 'Saúde': '#FD7E14', 'Finanças': '#FFC107' };

        const createSubtaskHTML = st => `<li class="subtask-item" data-id="${st.id}"><div class="subtask-item-content"><button class="complete-subtask-btn ${st.completed ? 'completed' : ''}"><i class='bx bx-check-circle'></i></button><span class="subtask-text ${st.completed ? 'completed' : ''}">${st.text}</span></div><div class="subtask-actions"><button class="soft-button icon-btn add-to-focus-btn" title="Adicionar ao Foco do Dia"><i class='bx bx-list-plus'></i></button><button class="soft-button icon-btn delete-subtask-btn" title="Excluir Subtarefa"><i class='bx bxs-trash'></i></button></div></li>`;
        const createGoalHTML = goal => { const progress = goal.subtasks.length > 0 ? (goal.subtasks.filter(st => st.completed).length / goal.subtasks.length) * 100 : 0; return `<li class="goal-item" data-id="${goal.id}"><div class="goal-header"><span class="goal-title">${goal.title}</span><div class="goal-actions"><button class="soft-button icon-btn edit-goal-btn" title="Editar Meta"><i class='bx bxs-pencil'></i></button><button class="soft-button icon-btn delete-goal-btn" title="Excluir Meta"><i class='bx bxs-trash'></i></button></div></div><div class="goal-progress"><div class="progress-bar-container"><div class="progress-bar" style="width: ${progress.toFixed(0)}%"></div></div></div><div class="goal-details"><div class="goal-details-content"><div class="goal-categories">${goal.categories.map(cat => `<span class="goal-category" style="background-color:${ALL_CATEGORIES[cat] || '#6c757d'}">${cat}</span>`).join('')}</div><p><strong>Motivação:</strong> ${goal.motivation || 'N/A'}</p><p><strong>Data Alvo:</strong> ${goal.targetDate ? Utils.formatDateToBR(goal.targetDate) : 'N/A'}</p><ul class="subtask-list">${goal.subtasks.map(createSubtaskHTML).join('')}</ul><form class="add-subtask-form"><input type="text" class="soft-input subtask-input" placeholder="Novo passo..."><button type="submit" class="soft-button add-subtask-btn"><i class='bx bx-plus'></i></button></form></div></div></li>`; };

        const render = () => { goalsList.innerHTML = goals.map(createGoalHTML).join(''); };
        const openGoalModal = (mode = 'add', goalId = null) => { goalForm.reset(); goalForm.dataset.mode = mode; goalForm.dataset.goalId = goalId; categoryContainer.innerHTML = Object.keys(ALL_CATEGORIES).map(cat => `<button type="button" class="category-btn">${cat}</button>`).join(''); if (mode === 'edit' && goalId !== null) { modalTitle.textContent = "Editar Meta"; const goal = goals.find(g => g.id === goalId); document.getElementById('goal-title-input').value = goal.title; document.getElementById('goal-motivation-input').value = goal.motivation; document.getElementById('goal-date-input').value = goal.targetDate; categoryContainer.querySelectorAll('.category-btn').forEach(btn => { if (goal.categories.includes(btn.textContent)) btn.classList.add('active'); }); } else { modalTitle.textContent = "Criar Nova Meta"; } goalModal.classList.remove('hidden'); };
        const closeGoalModal = () => goalModal.classList.add('hidden');

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

        const init = () => {
            const PRIORITIES = Tasks.PRIORITIES;
            subtaskPriorityPicker.innerHTML = Object.keys(PRIORITIES).map(key => `<button class="priority-option" data-priority="${key}"><span class="priority-dot ${PRIORITIES[key].colorClass}"></span>${PRIORITIES[key].name}</button>`).join('');

            addGoalModalBtn.addEventListener('click', () => openGoalModal('add'));
            document.getElementById('cancel-goal-btn').addEventListener('click', closeGoalModal);
            goalModal.addEventListener('click', e => { if (e.target === goalModal) closeGoalModal(); });
            categoryContainer.addEventListener('click', e => { if (e.target.classList.contains('category-btn')) e.target.classList.toggle('active'); });
            goalForm.addEventListener('submit', e => { e.preventDefault(); const titleInput = document.getElementById('goal-title-input'); const selectedCategories = [...categoryContainer.querySelectorAll('.category-btn.active')].map(btn => btn.textContent); if (titleInput.value.trim() === '') return alert("O título da meta é obrigatório."); if (selectedCategories.length === 0) return alert("Por favor, selecione ao menos uma categoria."); const mode = goalForm.dataset.mode; const goalId = Number(goalForm.dataset.goalId); const goalData = { title: titleInput.value, motivation: document.getElementById('goal-motivation-input').value, categories: selectedCategories, targetDate: document.getElementById('goal-date-input').value }; if (mode === 'add') { goals.push({ id: Date.now(), ...goalData, subtasks: [] }); } else if (mode === 'edit') { const goalIndex = goals.findIndex(g => g.id === goalId); if(goalIndex > -1) goals[goalIndex] = { ...goals[goalIndex], ...goalData }; } Utils.saveToLocalStorage('goals', goals); render(); closeGoalModal(); });

            goalsList.addEventListener('click', e => {
                const goalItem = e.target.closest('.goal-item'); if (!goalItem) return;
                const goalId = Number(goalItem.dataset.id);
                const goal = goals.find(g => g.id === goalId); if (!goal) return;
                let shouldReRender = false;

                if (e.target.closest('.goal-header') || e.target.closest('.goal-progress')) goalItem.classList.toggle('expanded');
                if (e.target.closest('.edit-goal-btn')) openGoalModal('edit', goalId);
                if (e.target.closest('.delete-goal-btn')) { goals = goals.filter(g => g.id !== goalId); shouldReRender = true; }

                if (e.target.closest('.complete-subtask-btn')) {
                    const subtaskId = Number(e.target.closest('.subtask-item').dataset.id);
                    const subtask = goal.subtasks.find(st => st.id === subtaskId);
                    if (subtask) {
                        const isCompleted = !subtask.completed;
                        subtask.completed = isCompleted;
                        Tasks.setTaskCompletedStateBySubtask(goalId, subtaskId, isCompleted);
                        shouldReRender = true;
                    }
                }

                if (e.target.closest('.delete-subtask-btn')) { 
                    const subtaskId = Number(e.target.closest('.subtask-item').dataset.id);
                    goal.subtasks = goal.subtasks.filter(st => st.id !== subtaskId);
                    Tasks.removeTaskBySubtask(goalId, subtaskId);
                    shouldReRender = true;
                }

                if (e.target.closest('.add-to-focus-btn')) { 
                    const subtaskId = Number(e.target.closest('.subtask-item').dataset.id);
                    subtaskToAdd = { goalId, subtaskId };
                    priorityModal.classList.remove('hidden');
                }

                if (shouldReRender) { const wasExpanded = goalItem.classList.contains('expanded'); Utils.saveToLocalStorage('goals', goals); render(); if (wasExpanded) document.querySelector(`.goal-item[data-id="${goalId}"]`)?.classList.add('expanded'); }
            });

            goalsList.addEventListener('submit', e => { e.preventDefault(); if (e.target.classList.contains('add-subtask-form')) { const goalItem = e.target.closest('.goal-item'); const goalId = Number(goalItem.dataset.id); const goal = goals.find(g => g.id === goalId); const subtaskInput = e.target.querySelector('.subtask-input'); if (subtaskInput.value.trim() && goal) { goal.subtasks.push({ id: Date.now(), text: subtaskInput.value.trim(), completed: false }); Utils.saveToLocalStorage('goals', goals); render(); document.querySelector(`.goal-item[data-id="${goalId}"]`)?.classList.add('expanded'); } } });

            priorityModal.addEventListener('click', (e) => {
                if(e.target === priorityModal) priorityModal.classList.add('hidden');
            });

            subtaskPriorityPicker.addEventListener('click', (e) => {
                const option = e.target.closest('.priority-option');
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
                    priorityModal.classList.add('hidden');
                }
            });

            render();
        };
        return { init, render, setSubtaskCompletedState };
    })();

    // --- MÓDULO DE HÁBITOS ---
    const Habits = (() => {
        const habitsList = document.getElementById('habits-list'), addHabitModalBtn = document.getElementById('add-habit-modal-btn'), habitModal = document.getElementById('habit-modal'), habitForm = document.getElementById('habit-form'), cancelHabitBtn = document.getElementById('cancel-habit-btn'), deleteHabitBtn = document.getElementById('delete-habit-btn'), iconPicker = document.getElementById('habit-icon-picker'), colorPicker = document.getElementById('habit-color-picker'), confirmationModal = document.getElementById('confirmation-modal'), confirmDeleteBtn = document.getElementById('confirmation-confirm-btn'), cancelDeleteBtn = document.getElementById('confirmation-cancel-btn');
        const AVAILABLE_ICONS = [{ name: 'bx-drink', label: 'Beber' }, { name: 'bx-book-open', label: 'Ler' }, { name: 'bx-run', label: 'Exercício' }, { name: 'bx-spa', label: 'Meditar' }, { name: 'bx-brain', label: 'Estudar' }, { name: 'bx-bed', label: 'Dormir' }, { name: 'bx-dollar-circle', label: 'Economizar' }, { name: 'bx-user-voice', label: 'Social' }, { name: 'bx-leaf', label: 'Natureza' }, { name: 'bx-paint', label: 'Hobby' }];
        const AVAILABLE_COLORS = ['#007BFF', '#28A745', '#FFC107', '#DC3545', '#6F42C1', '#FD7E14', '#17A2B8', '#FF69B4', '#0DCAF0', '#20C997'];
        let habits = Utils.loadFromLocalStorage('habits', []);
        let habitToDeleteId = null;
        const calculateStreak = dates => { if (dates.length === 0) return 0; let streak = 0; const today = new Date(); today.setHours(0, 0, 0, 0); const completedDates = new Set(dates); let currentDate = new Date(today); if (!completedDates.has(currentDate.toISOString().split('T')[0])) { currentDate.setDate(today.getDate() - 1); } while (completedDates.has(currentDate.toISOString().split('T')[0])) { streak++; currentDate.setDate(currentDate.getDate() - 1); } return streak; };
        const render = () => { habitsList.innerHTML = ""; habits.forEach(habit => { const li = document.createElement('li'); li.className = 'habit-item'; li.dataset.id = habit.id; const today = new Date(); const startOfWeek = new Date(new Date().setDate(today.getDate() - today.getDay())); let weekTrackerHTML = ""; const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']; for (let i = 0; i < 7; i++) { const day = new Date(startOfWeek); day.setDate(startOfWeek.getDate() + i); const dateString = day.toISOString().split('T')[0]; const isCompleted = habit.completedDates.includes(dateString); const isCurrent = day.toDateString() === new Date().toDateString(); const isFuture = day > new Date(); weekTrackerHTML += `<div class="day-circle ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${isFuture ? 'disabled' : ''}" data-date="${dateString}" style="${isCompleted ? '--habit-color:' + habit.color : ''}">${weekDays[i]}</div>`; } li.innerHTML = `<div class="habit-info"><div class="habit-icon-name"><i class='bx ${habit.icon}' style="color: ${habit.color}"></i><span class="habit-name">${habit.name}</span></div><div class="habit-info-right"><div class="habit-streak"><span>🔥</span><span>${calculateStreak(habit.completedDates)}</span></div><div class="habit-actions"><button class="soft-button icon-btn edit-habit-btn" title="Editar Hábito"><i class="bx bxs-pencil"></i></button></div></div></div><div class="habit-week-tracker">${weekTrackerHTML}</div>`; habitsList.appendChild(li); }); };
        const openHabitModal = (mode = 'add', habitId = null) => { habitForm.reset(); habitForm.dataset.mode = mode; habitForm.dataset.habitId = habitId; iconPicker.innerHTML = AVAILABLE_ICONS.map(i => `<div class="picker-option"><button type="button" class="picker-button" data-icon="${i.name}"><i class='bx ${i.name}'></i></button><span class="picker-label">${i.label}</span></div>`).join(''); colorPicker.innerHTML = AVAILABLE_COLORS.map(c => `<button type="button" class="picker-button" data-color="${c}"><div class="color-swatch" style="background-color:${c}"></div></button>`).join(''); const modalTitle = document.getElementById('habit-modal-title'); if (mode === 'edit' && habitId !== null) { modalTitle.textContent = "Editar Hábito"; deleteHabitBtn.classList.remove('hidden'); const habit = habits.find(h => h.id === habitId); document.getElementById('habit-name-input').value = habit.name; iconPicker.querySelector(`.picker-button[data-icon="${habit.icon}"]`)?.classList.add('active'); colorPicker.querySelector(`.picker-button[data-color="${habit.color}"]`)?.classList.add('active'); } else { modalTitle.textContent = "Novo Hábito"; deleteHabitBtn.classList.add('hidden'); } habitModal.classList.remove('hidden'); };
        const closeHabitModal = () => { habitForm.reset(); habitModal.classList.add('hidden'); };
        const init = () => { addHabitModalBtn.addEventListener('click', () => openHabitModal('add')); cancelHabitBtn.addEventListener('click', closeHabitModal); habitModal.addEventListener('click', e => { if (e.target === habitModal) closeHabitModal(); }); iconPicker.addEventListener('click', e => { const button = e.target.closest('.picker-button'); if (button) { iconPicker.querySelector('.active')?.classList.remove('active'); button.classList.add('active'); }}); colorPicker.addEventListener('click', e => { const button = e.target.closest('.picker-button'); if (button) { colorPicker.querySelector('.active')?.classList.remove('active'); button.classList.add('active'); }}); habitForm.addEventListener('submit', e => { e.preventDefault(); const name = document.getElementById('habit-name-input').value, icon = iconPicker.querySelector('.active')?.dataset.icon, color = colorPicker.querySelector('.active')?.dataset.color; if (!name || !icon || !color) return alert("Por favor, preencha todos os campos."); const mode = habitForm.dataset.mode, habitId = Number(habitForm.dataset.habitId); if (mode === 'add') { habits.push({ id: Date.now(), name, icon, color, completedDates: [] }); } else if (mode === 'edit') { const habitIndex = habits.findIndex(h => h.id === habitId); if(habitIndex > -1) habits[habitIndex] = { ...habits[habitIndex], name, icon, color }; } Utils.saveToLocalStorage('habits', habits); render(); closeHabitModal(); }); habitsList.addEventListener('click', e => { const habitItem = e.target.closest('.habit-item'); if (!habitItem) return; const habitId = Number(habitItem.dataset.id); const habit = habits.find(h => h.id === habitId); if (!habit) return; if (e.target.closest('.day-circle:not(.disabled)')) { const date = e.target.closest('.day-circle').dataset.date; const dateIndex = habit.completedDates.indexOf(date); if (dateIndex > -1) habit.completedDates.splice(dateIndex, 1); else habit.completedDates.push(date); Utils.saveToLocalStorage('habits', habits); render(); } if (e.target.closest('.edit-habit-btn')) openHabitModal('edit', habitId); }); deleteHabitBtn.addEventListener('click', () => { habitToDeleteId = Number(habitForm.dataset.habitId); confirmationModal.classList.remove('hidden'); }); cancelDeleteBtn.addEventListener('click', () => { confirmationModal.classList.add('hidden'); habitToDeleteId = null; }); confirmDeleteBtn.addEventListener('click', () => { if (habitToDeleteId !== null) { habits = habits.filter(h => h.id !== habitToDeleteId); Utils.saveToLocalStorage('habits', habits); render(); habitToDeleteId = null; } confirmationModal.classList.add('hidden'); closeHabitModal(); }); render(); };
        return { init, render };
    })();

    // --- MÓDULO DE HUMOR ---
    const Mood = (() => {
        const moodOptionsContainer = document.getElementById('mood-options');
        const MOODS = { 5: { icon: 'bxs-happy-heart-eyes', label: 'Ótimo', class: 'mood-5' }, 4: { icon: 'bxs-smile', label: 'Bom', class: 'mood-4' }, 3: { icon: 'bxs-meh', label: 'Normal', class: 'mood-3' }, 2: { icon: 'bxs-meh-alt', label: 'Ruim', class: 'mood-2' }, 1: { icon: 'bxs-sad', label: 'Terrível', class: 'mood-1' } };

        const render = () => {
             moodOptionsContainer.innerHTML = Object.keys(MOODS).sort((a, b) => b - a).map(key => `<div class="mood-option"><button class="mood-btn ${MOODS[key].class}" data-mood="${key}"><i class='bx ${MOODS[key].icon}'></i></button><span class="mood-label">${MOODS[key].label}</span></div>`).join('');
             loadMoodState();
        }

        const loadMoodState = () => {
            const todayData = DailyData.getTodayData();
            moodOptionsContainer.querySelector('.active')?.classList.remove('active');
            if (todayData.mood) {
                const btnToActivate = moodOptionsContainer.querySelector(`.mood-btn[data-mood="${todayData.mood}"]`);
                if (btnToActivate) btnToActivate.classList.add('active');
            }
        };

        const init = () => { 
            moodOptionsContainer.addEventListener('click', (e) => {
                const moodBtn = e.target.closest('.mood-btn');
                if (moodBtn) {
                    const moodValue = moodBtn.dataset.mood;
                    const todayData = DailyData.getTodayData();
                    todayData.mood = moodValue;
                    DailyData.saveData();
                    loadMoodState();
                }
            });
            render();
        };
        return { init, render, loadMoodState };
    })();

    // --- MÓDULO DE REFLEXÃO DIÁRIA ---
    const Journal = (() => {
        const journalContainer = document.getElementById('daily-journal');
        const journalForm = document.getElementById('journal-form');
        const questionEl = document.getElementById('journal-question');
        const inputEl = document.getElementById('journal-input');
        const questionCompletedEl = document.getElementById('journal-question-completed');
        const answerEl = document.getElementById('journal-answer');
        const showHistoryBtn = document.getElementById('show-journal-history-btn');
        const historyModal = document.getElementById('journal-history-modal');
        const historyList = document.getElementById('journal-history-list');
        const closeHistoryBtn = document.getElementById('close-journal-history-btn');
        const closeHistoryBtnX = document.getElementById('close-journal-history-btn-x');

        const QUESTIONS = [ "Pelo que você sentiu gratidão hoje?", "Qual foi o ponto alto do seu dia?", "O que te fez sorrir hoje?", "Que pequena vitória você conquistou?", "Algo bom que aconteceu e que você não esperava?", "O que você aprendeu de novo hoje?", "Uma gentileza que você viu ou fez hoje?", "Qual foi seu maior desafio superado no dia de hoje?", "O que te fez sentir orgulhoso(a) de si mesmo(a)?", "Cite 3 coisas boas que aconteceram hoje.", "Uma coisa simples que te trouxe alegria foi...", "Qual foi o momento mais interessante do seu dia?", "Qual foi o som, cheiro ou sabor mais agradável que você sentiu?", "Um momento de paz que você teve hoje foi...", "Um pequeno passo que você deu em direção a um grande objetivo foi...", "O que você está ansioso(a) para amanhã?", "Como você cuidou de si mesmo(a) hoje?", "Uma conversa significativa que você teve hoje foi com...", "Quem te ajudou ou te inspirou hoje?", "O que você fez hoje para se aproximar de quem você quer ser?", "Descreva uma emoção forte que você sentiu hoje.", "Qual música descreveria o seu dia?", "O que te deu energia hoje?", "Se você pudesse dar um conselho a si mesmo(a) hoje de manhã, qual seria?", "Qual obstáculo você removeu do seu caminho hoje?", "O que você está deixando para trás ao final deste dia?", "Uma coisa que você gostaria de lembrar sobre o dia de hoje é...", "Como você demonstrou amor ou carinho hoje?", "O que te surpreendeu sobre você mesmo(a) hoje?", "Qual foi a decisão mais inteligente que você tomou hoje?", "O que você fez hoje apenas por diversão?" ];

        const getDayOfYear = (date = new Date()) => { const start = new Date(date.getFullYear(), 0, 0); const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000); const oneDay = 1000 * 60 * 60 * 24; return Math.floor(diff / oneDay); };
        const getDailyQuestion = () => { const today = new Date(); const dayIndex = getDayOfYear(today); const question = QUESTIONS[dayIndex % QUESTIONS.length]; return { question }; };

        const createHistoryItemHTML = (entry) => ` <li class="journal-history-item"> <p class="history-date">${Utils.formatDateToBR(entry.date)}</p> <p class="history-question">${entry.journal.question}</p> <p class="history-answer">${entry.journal.answer}</p> </li> `;

        const openHistoryModal = () => {
            const allData = DailyData.getAllData();
            const entriesWithJournal = allData.filter(d => d.journal);

            historyList.innerHTML = '';
            if (entriesWithJournal.length === 0) {
                historyList.innerHTML = `<p class="no-history-message">Você ainda não tem nenhuma reflexão salva.</p>`;
            } else {
                const sortedEntries = entriesWithJournal.sort((a, b) => new Date(b.date) - new Date(a.date));
                historyList.innerHTML = sortedEntries.map(createHistoryItemHTML).join('');
            }
            historyModal.classList.remove('hidden');
        };

        const closeHistoryModal = () => historyModal.classList.add('hidden');

        const render = () => {
            const { question } = getDailyQuestion();
            const todayData = DailyData.getTodayData();

            if (todayData.journal) {
                journalContainer.classList.add('answered');
                questionCompletedEl.textContent = todayData.journal.question;
                answerEl.textContent = todayData.journal.answer;
            } else {
                journalContainer.classList.remove('answered');
                questionEl.textContent = question;
                inputEl.value = '';
            }
        };

        const init = () => {
            journalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const answer = inputEl.value.trim();
                if (answer) {
                    const { question } = getDailyQuestion();
                    const todayData = DailyData.getTodayData();
                    todayData.journal = { question, answer };
                    DailyData.saveData();
                    render();
                }
            });

            showHistoryBtn.addEventListener('click', openHistoryModal);
            closeHistoryBtn.addEventListener('click', closeHistoryModal);
            closeHistoryBtnX.addEventListener('click', closeHistoryModal);
            historyModal.addEventListener('click', (e) => {
                if(e.target === historyModal) closeHistoryModal();
            });

            render();
        };
        return { init, render };
    })();

    // --- MÓDULO DE MÉTRICAS (Hidratação e Sono) ---
    const Metrics = (() => {
        const waterGoalInput = document.getElementById('water-goal');
        const decreaseWaterBtn = document.getElementById('decrease-water-btn');
        const increaseWaterBtn = document.getElementById('increase-water-btn');
        const waterCountEl = document.getElementById('water-count');
        const waterGoalTextEl = document.getElementById('water-goal-text');
        const waterProgressEl = document.getElementById('water-progress');
        const waterFeedbackEl = document.getElementById('water-feedback');

        const sleepTrackerEl = document.querySelector('.sleep-tracker-card');
        const sleepForm = document.getElementById('sleep-form');
        const bedTimeInput = document.getElementById('bed-time');
        const wakeTimeInput = document.getElementById('wake-time');
        const sleepTotalEl = document.getElementById('sleep-total');
        const sleepFeedbackEl = document.getElementById('sleep-feedback');
        const editSleepBtn = document.getElementById('edit-sleep-btn');

        const waterHistoryBtn = document.getElementById('water-history-btn');
        const sleepHistoryBtn = document.getElementById('sleep-history-btn');
        const historyModal = document.getElementById('metrics-history-modal');
        const historyTitle = document.getElementById('metrics-history-title');
        const historyList = document.getElementById('metrics-history-list');
        const closeHistoryBtn = document.getElementById('close-metrics-history-btn');
        const closeHistoryBtnX = document.getElementById('close-metrics-history-btn-x');
        // Sleep quality modal
        const sleepQualityModal = document.getElementById('sleep-quality-modal');
        const sleepQualityInput = document.getElementById('sleep-quality-input');
        const sleepQualityCancel = document.getElementById('sleep-quality-cancel');
        const sleepQualityConfirm = document.getElementById('sleep-quality-confirm');
        let pendingSleepData = null;

        let waterGoal = Utils.loadFromLocalStorage('waterGoal', 8);

        const WATER_FEEDBACK = { 0: "Vamos começar o dia bem hidratado!", 25: "Bom começo! Continue assim.", 50: "Você está na metade do caminho!", 75: "Quase lá, falta pouco!", 100: "Meta atingida! Você mandou bem!" };
        const SLEEP_FEEDBACK = { 4: "Um sono muito curto. Tente descansar mais hoje.", 6: "Um pouco abaixo do ideal. Que tal ir para a cama mais cedo?", 9: "Ótima noite de sono! Isso vai te dar energia para o dia.", 12: "Um sono longo e restaurador! Seu corpo agradece." };

        const getFeedback = (value, thresholds) => {
            const keys = Object.keys(thresholds).map(Number).sort((a, b) => a - b);
            let message = thresholds[0];
            for (const key of keys) {
                if (value >= key) {
                    message = thresholds[key];
                }
            }
            return message;
        };

        const render = () => {
            const todayData = DailyData.getTodayData();

            waterCountEl.textContent = todayData.water || 0;
            waterGoalTextEl.textContent = `/ ${waterGoal} copos`;
            const waterPercentage = Math.min(100, ((todayData.water || 0) / waterGoal) * 100);
            waterProgressEl.value = waterPercentage;
            waterFeedbackEl.textContent = getFeedback(waterPercentage, WATER_FEEDBACK);

            if (todayData.sleep) {
                sleepTrackerEl.classList.add('answered');
                const hours = Math.floor(todayData.sleep.totalMinutes / 60);
                const minutes = todayData.sleep.totalMinutes % 60;
                sleepTotalEl.textContent = `${hours}h ${minutes}m`;
                const quality = todayData.sleep.quality ? ` • Qualidade: ${todayData.sleep.quality}/5` : '';
                sleepFeedbackEl.textContent = `${getFeedback(hours, SLEEP_FEEDBACK)}${quality}`;
            } else {
                sleepTrackerEl.classList.remove('answered');
                sleepForm.reset();
            }
        };

        const calculateSleep = (bedTime, wakeTime) => {
            const [bedH, bedM] = bedTime.split(':').map(Number);
            const [wakeH, wakeM] = wakeTime.split(':').map(Number);
            const bedDate = new Date(0, 0, 0, bedH, bedM, 0);
            const wakeDate = new Date(0, 0, 0, wakeH, wakeM, 0);
            if (wakeDate <= bedDate) wakeDate.setDate(wakeDate.getDate() + 1);
            return Math.floor((wakeDate - bedDate) / 60000);
        };

        const openHistoryModal = (type) => {
            const allData = DailyData.getAllData();
            let entries;
            historyTitle.textContent = `Histórico de ${type}`;

            if (type === 'Hidratação') {
                entries = allData.filter(d => d.water > 0).map(d => ({ date: d.date, value: `${d.water} / ${(d.waterGoal || Utils.loadFromLocalStorage('waterGoal', 8))} copos` }));
            } else { // Sono
                entries = allData.filter(d => d.sleep).map(d => {
                    const h = Math.floor(d.sleep.totalMinutes / 60);
                    const m = d.sleep.totalMinutes % 60;
                    const q = d.sleep.quality ? ` • Qualidade: ${d.sleep.quality}/5` : '';
                    return { date: d.date, value: `${h}h ${m}m${q}` };
                });
            }

            historyList.innerHTML = '';
            if (entries.length === 0) {
                historyList.innerHTML = `<p class="no-history-message">Nenhum registro encontrado.</p>`;
            } else {
                const sortedEntries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));
                historyList.innerHTML = sortedEntries.map(entry => `
                    <li class="metrics-history-item">
                        <p class="history-date">${Utils.formatDateToBR(entry.date)}</p>
                        <p class="history-value">${entry.value}</p>
                    </li>
                `).join('');
            }
            historyModal.classList.remove('hidden');
        };

        const closeHistoryModal = () => historyModal.classList.add('hidden');

        const init = () => {
            waterGoalInput.value = waterGoal;
            waterGoalInput.addEventListener('change', () => {
                waterGoal = parseInt(waterGoalInput.value) || 8;
                Utils.saveToLocalStorage('waterGoal', waterGoal);
                const todayData = DailyData.getTodayData();
                todayData.waterGoal = waterGoal;
                DailyData.saveData();
                render();
            });

            increaseWaterBtn.addEventListener('click', () => {
                const todayData = DailyData.getTodayData();
                todayData.water = (todayData.water || 0) + 1;
                DailyData.saveData();
                render();
            });

            decreaseWaterBtn.addEventListener('click', () => {
                const todayData = DailyData.getTodayData();
                if (todayData.water && todayData.water > 0) {
                    todayData.water -= 1;
                    DailyData.saveData();
                    render();
                }
            });

            sleepForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (bedTimeInput.value && wakeTimeInput.value) {
                    pendingSleepData = {
                        bedTime: bedTimeInput.value,
                        wakeTime: wakeTimeInput.value,
                        totalMinutes: calculateSleep(bedTimeInput.value, wakeTimeInput.value)
                    };
                    sleepQualityInput.value = '4';
                    sleepQualityModal.classList.remove('hidden');
                }
            });
            sleepQualityCancel && sleepQualityCancel.addEventListener('click', () => { pendingSleepData = null; sleepQualityModal.classList.add('hidden'); });
            sleepQualityConfirm && sleepQualityConfirm.addEventListener('click', () => { if (!pendingSleepData) return; const quality = Math.max(1, Math.min(5, parseInt(sleepQualityInput.value || '4'))); const todayData = DailyData.getTodayData(); todayData.sleep = { ...pendingSleepData, quality }; DailyData.saveData(); pendingSleepData = null; sleepQualityModal.classList.add('hidden'); render(); });

            editSleepBtn.addEventListener('click', () => {
                const todayData = DailyData.getTodayData();
                if (todayData.sleep) {
                    bedTimeInput.value = todayData.sleep.bedTime;
                    wakeTimeInput.value = todayData.sleep.wakeTime;
                }
                sleepTrackerEl.classList.remove('answered');
            });

            waterHistoryBtn.addEventListener('click', () => openHistoryModal('Hidratação'));
            sleepHistoryBtn.addEventListener('click', () => openHistoryModal('Sono'));
            closeHistoryBtn.addEventListener('click', closeHistoryModal);
            closeHistoryBtnX.addEventListener('click', closeHistoryModal);
            historyModal.addEventListener('click', e => { if(e.target === historyModal) closeHistoryModal(); });

            render();
        };

        return { init, render };
    })();

    // --- MÓDULO FOCUS EXTRAS ---
    const FocusExtras = (() => {
        // MITs do Dia
        const mitInput = document.getElementById('mit-input');
        const addMitBtn = document.getElementById('add-mit-btn');
        const mitsList = document.getElementById('mits-list');
        const clearMitsBtn = document.getElementById('clear-mits-btn');
        const carryoverMitsBtn = document.getElementById('carryover-mits-btn');
        let mits = Utils.loadFromLocalStorage('mits', []);

        const renderMits = () => { mitsList.innerHTML = mits.map((m, i) => `<li class="mit-item" data-index="${i}"><span>${Utils.escapeHTML(m.text)}</span><div class="task-item-buttons"><button class="soft-button icon-btn delete-mit-btn"><i class='bx bxs-trash'></i></button></div></li>`).join(''); };
        const addMit = (text) => { const t = text?.trim(); if(!t) return; if (mits.length >= 3) return alert('Limite de 3 MITs.'); mits.push({ text: t }); Utils.saveToLocalStorage('mits', mits); renderMits(); };
        const carryoverMits = () => { const today = Utils.getTodayString(); const key = `mits_${today}`; Utils.saveToLocalStorage(key, mits); // simples: só persistir snapshot do dia
            // levar para amanhã
            const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); const tomorrowKey = `mits_${tomorrow.toISOString().split('T')[0]}`; Utils.saveToLocalStorage(tomorrowKey, mits); };

        // Estatísticas de Foco (básico por sessão Pomodoro)
        const statsTodayMinutesEl = document.getElementById('focus-stats-today-minutes');
        const statsTodaySessionsEl = document.getElementById('focus-stats-today-sessions');
        const statsWeekMinutesEl = document.getElementById('focus-stats-week-minutes');
        let focusStats = Utils.loadFromLocalStorage('focusStats', { sessions: [] });
        const addFocusSession = (minutes) => { focusStats.sessions.push({ date: Utils.getTodayString(), minutes }); Utils.saveToLocalStorage('focusStats', focusStats); renderStats(); };
        const renderStats = () => {
            const today = Utils.getTodayString();
            const todaySessions = focusStats.sessions.filter(s => s.date === today);
            const todayMinutes = todaySessions.reduce((acc, s) => acc + (s.minutes || 0), 0);
            statsTodayMinutesEl && (statsTodayMinutesEl.textContent = String(todayMinutes));
            statsTodaySessionsEl && (statsTodaySessionsEl.textContent = String(todaySessions.length));
            const now = new Date();
            const start = new Date(now); start.setDate(now.getDate() - 6);
            const last7 = focusStats.sessions.filter(s => new Date(s.date) >= new Date(start.toISOString().split('T')[0]));
            const weekMinutes = last7.reduce((acc, s) => acc + (s.minutes || 0), 0);
            statsWeekMinutesEl && (statsWeekMinutesEl.textContent = String(weekMinutes));
        };

        // Timeboxing
        const tbForm = document.getElementById('timeboxing-form');
        const tbLabel = document.getElementById('tb-label');
        const tbStart = document.getElementById('tb-start');
        const tbDuration = document.getElementById('tb-duration');
        const tbList = document.getElementById('timeboxing-list');
        let timeboxes = Utils.loadFromLocalStorage('timeboxes', []);
        const renderTimeboxes = () => { tbList.innerHTML = timeboxes.map((tb, i) => `<li class="timeboxing-item" data-index="${i}"><span>${Utils.escapeHTML(tb.label)} — ${tb.start} • ${tb.duration}m</span><div class="task-item-buttons"><button class="soft-button icon-btn delete-tb-btn"><i class='bx bxs-trash'></i></button></div></li>`).join(''); };

        // Review do Dia
        const reviewForm = document.getElementById('review-form');
        const reviewFormView = document.getElementById('review-form-view');
        const reviewCompletedView = document.getElementById('review-completed-view');
        const reviewGood = document.getElementById('review-good');
        const reviewDelay = document.getElementById('review-delay');
        const reviewLearn = document.getElementById('review-learn');
        const reviewGoodView = document.getElementById('review-good-view');
        const reviewDelayView = document.getElementById('review-delay-view');
        const reviewLearnView = document.getElementById('review-learn-view');
        const editReviewBtn = document.getElementById('edit-review-btn');
        let reviews = Utils.loadFromLocalStorage('reviews', {});

        const init = () => {
            // MITs
            addMitBtn && addMitBtn.addEventListener('click', () => { addMit(mitInput.value); mitInput.value = ''; });
            mitsList && mitsList.addEventListener('click', (e) => { const deleteBtn = e.target.closest('.delete-mit-btn'); if (!deleteBtn) return; const i = Number(e.target.closest('.mit-item')?.dataset.index); if(Number.isInteger(i)) { mits.splice(i,1); Utils.saveToLocalStorage('mits', mits); renderMits(); }});
            clearMitsBtn && clearMitsBtn.addEventListener('click', () => { mits = []; Utils.saveToLocalStorage('mits', mits); renderMits(); });
            carryoverMitsBtn && carryoverMitsBtn.addEventListener('click', carryoverMits);
            renderMits();

            // Timeboxing
            tbForm && tbForm.addEventListener('submit', (e) => { e.preventDefault(); const label = tbLabel.value.trim(); if (!label) return; const start = tbStart.value || '--:--'; const duration = parseInt(tbDuration.value) || 30; timeboxes.push({ label, start, duration }); Utils.saveToLocalStorage('timeboxes', timeboxes); tbLabel.value=''; tbStart.value=''; tbDuration.value=''; renderTimeboxes(); });
            tbList && tbList.addEventListener('click', (e) => { const deleteBtn = e.target.closest('.delete-tb-btn'); if (!deleteBtn) return; const i = Number(e.target.closest('.timeboxing-item')?.dataset.index); if(Number.isInteger(i)) { timeboxes.splice(i,1); Utils.saveToLocalStorage('timeboxes', timeboxes); renderTimeboxes(); }});
            renderTimeboxes();

            // Review
            const today = Utils.getTodayString();
            const todayReview = reviews[today];
            if (todayReview) {
                reviewFormView && (reviewFormView.style.display = 'none');
                reviewCompletedView && (reviewCompletedView.style.display = 'block');
                reviewGoodView && (reviewGoodView.textContent = todayReview.good || '');
                reviewDelayView && (reviewDelayView.textContent = todayReview.delay || '');
                reviewLearnView && (reviewLearnView.textContent = todayReview.learn || '');
            }
            reviewForm && reviewForm.addEventListener('submit', (e) => { e.preventDefault(); reviews[today] = { good: reviewGood.value.trim(), delay: reviewDelay.value.trim(), learn: reviewLearn.value.trim() }; Utils.saveToLocalStorage('reviews', reviews); reviewFormView.style.display = 'none'; reviewCompletedView.style.display = 'block'; reviewGoodView.textContent = reviews[today].good; reviewDelayView.textContent = reviews[today].delay; reviewLearnView.textContent = reviews[today].learn; });
            editReviewBtn && editReviewBtn.addEventListener('click', () => { reviewFormView.style.display = 'block'; reviewCompletedView.style.display = 'none'; });

            // Estatísticas iniciais
            renderStats();
        };

        // Expor para Pomodoro somar sessões de foco
        const onFocusSessionComplete = (minutes) => addFocusSession(minutes);

        return { init, renderStats, onFocusSessionComplete };
    })();

    // --- MÓDULO FITNESS ---
    const Fitness = (() => {
        // Workouts simples
        const workoutForm = document.getElementById('workout-form');
        const workoutType = document.getElementById('workout-type');
        const workoutMinutes = document.getElementById('workout-minutes');
        const workoutRpe = document.getElementById('workout-rpe');
        const workoutNotes = document.getElementById('workout-notes');
        const workoutPreset = document.getElementById('workout-preset');
        const workoutList = document.getElementById('workout-list');
        const workoutWeekMinEl = document.getElementById('workout-week-min');
        const workoutWeekSessionsEl = document.getElementById('workout-week-sessions');
        const workoutTopTypeEl = document.getElementById('workout-top-type');
        let workouts = Utils.loadFromLocalStorage('workouts', []);
        const renderWorkoutStats = () => { const now = new Date(); const start = new Date(now); start.setDate(now.getDate() - 6); const recent = workouts.filter(w => new Date(w.date) >= new Date(start.toISOString().split('T')[0])); const minutes = recent.reduce((a, w) => a + (w.minutes || 0), 0); const sessions = recent.length; const typeCount = {}; recent.forEach(w => { const t = w.type || 'Treino'; typeCount[t] = (typeCount[t]||0)+1; }); const topType = Object.entries(typeCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || '-'; workoutWeekMinEl && (workoutWeekMinEl.textContent = String(minutes)); workoutWeekSessionsEl && (workoutWeekSessionsEl.textContent = String(sessions)); workoutTopTypeEl && (workoutTopTypeEl.textContent = topType); };
        const renderWorkouts = () => { workoutList.innerHTML = workouts.map((w, i) => `<li class="workout-item" data-index="${i}"><span>${Utils.escapeHTML(w.type)} — ${w.minutes}m ${w.rpe?('• RPE '+w.rpe):''}${w.notes?(' • '+Utils.escapeHTML(w.notes)) : ''}</span><div class="task-item-buttons"><button class="soft-button icon-btn delete-workout-btn"><i class='bx bxs-trash'></i></button></div></li>`).join(''); renderWorkoutStats(); };

        // Respiração guiada (display)
        const protocolSelect = document.getElementById('breath-protocol');
        const breathRounds = document.getElementById('breath-rounds');
        const startBreathBtn = document.getElementById('start-breath-btn');
        const breathDisplay = document.getElementById('breath-display');
        let breathTimer = null, currentStep = 0, remainingRounds = 0;
        const PROTOCOLS = { box: [4,4,4,4], '478': [4,7,8], coerente: [5,5] };
        const STEP_LABELS = { 3: ['Inspire','Segure','Expire','Segure'], 4: ['Inspire','Segure','Expire','Segure'] };
        const stopBreath = () => { if (breathTimer) { clearTimeout(breathTimer); breathTimer = null; } if (breathDisplay) { breathDisplay.textContent = ''; breathDisplay.classList.remove('active'); const bar = breathDisplay.querySelector('.breath-progress-bar'); if (bar) bar.remove(); } };
        const runBreath = (pattern) => {
            if (remainingRounds <= 0) { stopBreath(); return; }
            const stepSeconds = pattern[currentStep];
            const label = (pattern.length === 4 ? STEP_LABELS[4][currentStep] : (pattern.length===3 ? ['Inspire','Segure','Expire'][currentStep] : ['Inspire','Expire'][currentStep]));
            breathDisplay.textContent = `${label} • ${stepSeconds}s`;
            let bar = breathDisplay.querySelector('.breath-progress-bar');
            if (!bar) { bar = document.createElement('div'); bar.className = 'breath-progress-bar'; breathDisplay.appendChild(bar); }
            bar.style.transition = 'none'; bar.style.width = '100%';
            requestAnimationFrame(() => { requestAnimationFrame(() => { bar.style.transition = `width ${stepSeconds}s linear`; bar.style.width = '0%'; }); });
            currentStep = (currentStep + 1) % pattern.length;
            if (currentStep === 0) remainingRounds -= 1;
            breathTimer = setTimeout(() => runBreath(pattern), stepSeconds * 1000);
        };

        // Alongamento
        const stretchPreset = document.getElementById('stretch-preset');
        const startStretchBtn = document.getElementById('start-stretch-btn');
        const stretchStepsList = document.getElementById('stretch-steps');
        const STRETCH_PRESETS = {
            'pescoço': ['Inclinação lateral 30s', 'Rotação lenta 30s', 'Flexão 30s'],
            'ombros': ['Alcance cruzado 30s', 'Roda de ombro 30s', 'Alongar peitoral 30s'],
            'lombar': ['Criança 30s', 'Gato-vaca 30s', 'Torção suave 30s']
        };

        // Sol/Ar Livre
        // (removido)

        const init = () => {
            // Workouts
            workoutForm && workoutForm.addEventListener('submit', (e) => { e.preventDefault(); const type = (workoutType.value.trim() || workoutPreset.value || 'Treino'); const minutes = parseInt(workoutMinutes.value) || 20; const rpe = parseInt(workoutRpe.value) || null; const notes = workoutNotes.value.trim() || null; workouts.push({ date: Utils.getTodayString(), type, minutes, rpe, notes }); Utils.saveToLocalStorage('workouts', workouts); workoutType.value=''; workoutMinutes.value=''; workoutRpe.value=''; workoutNotes.value=''; renderWorkouts(); });
            workoutList && workoutList.addEventListener('click', (e) => { const deleteBtn = e.target.closest('.delete-workout-btn'); if (!deleteBtn) return; const i = Number(e.target.closest('.workout-item')?.dataset.index); if(Number.isInteger(i)) { workouts.splice(i,1); Utils.saveToLocalStorage('workouts', workouts); renderWorkouts(); }});
            renderWorkouts();

            // Respiração
            startBreathBtn && startBreathBtn.addEventListener('click', () => { stopBreath(); const proto = protocolSelect.value; const rounds = parseInt(breathRounds.value) || 4; currentStep = 0; remainingRounds = rounds; if (breathDisplay) breathDisplay.classList.add('active'); runBreath(PROTOCOLS[proto] || PROTOCOLS.box); });

            // Alongamento
            startStretchBtn && startStretchBtn.addEventListener('click', () => { const preset = stretchPreset.value; const steps = STRETCH_PRESETS[preset] || []; stretchStepsList.innerHTML = steps.map(s => `<li class="stretch-step"><span>${s}</span></li>`).join(''); });

            // Sons de foco removido
            // (mantido espaço para futura reintrodução)

            // Nutrição leve
            const nutritionForm = document.getElementById('nutrition-form');
            const mealType = document.getElementById('meal-type');
            const mealQuality = document.getElementById('meal-quality');
            const mealSatiety = document.getElementById('meal-satiety');
            const mealNotes = document.getElementById('meal-notes');
            const mealList = document.getElementById('meal-list');
            let meals = Utils.loadFromLocalStorage('meals', []);
            const renderMeals = () => { mealList.innerHTML = meals.slice().reverse().map((m,i)=>`<li class="workout-item"><span>${m.date} • ${Utils.escapeHTML(m.type)} — Q${m.quality}/5 • S${m.satiety}/5${m.notes?(' • '+Utils.escapeHTML(m.notes)) : ''}</span></li>`).join(''); };
            nutritionForm && nutritionForm.addEventListener('submit', (e) => { e.preventDefault(); const type = mealType.value; const q = Math.max(1, Math.min(5, parseInt(mealQuality.value||'3'))); const s = Math.max(1, Math.min(5, parseInt(mealSatiety.value||'3'))); const notes = mealNotes.value.trim() || null; meals.push({ date: Utils.getTodayString(), type, quality: q, satiety: s, notes }); Utils.saveToLocalStorage('meals', meals); mealQuality.value=''; mealSatiety.value=''; mealNotes.value=''; renderMeals(); });
            renderMeals();

            // (removido)
        };

        return { init };
    })();

    // --- INICIALIZAÇÃO GERAL ---
    App.init();
});