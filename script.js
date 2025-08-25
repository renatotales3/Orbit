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
            Finance.init();
            // Fitness removido
            // Fitness.init && Fitness.init();

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
        const loadFromLocalStorage = (key, defaultValue) => {
            try {
                const raw = localStorage.getItem(key);
                if (raw === null || raw === undefined) return defaultValue;
                return JSON.parse(raw);
            } catch (e) {
                console.warn('Invalid localStorage for', key, e);
                try { localStorage.removeItem(key); } catch (_) {}
                return defaultValue;
            }
        };
        const getTodayString = () => {
            const now = new Date();
            const brasiliaOffset = -3; // UTC-3
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const brasiliaTime = new Date(utc + (brasiliaOffset * 3600000));
            return brasiliaTime.toISOString().split('T')[0];
        };
        const formatDateToBR = (dateString) => {
            try {
                if (!dateString) return 'N/A';
                const date = new Date(dateString);
                if (Number.isNaN(date.getTime())) return 'N/A';
                return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
            } catch (_) {
                return 'N/A';
            }
        };
        const escapeHTML = (str) => {
            const div = document.createElement('div');
            div.appendChild(document.createTextNode(str));
            return div.innerHTML;
        };
        // Modal simples de aviso
        const showNotice = (message, titleOrCallback = 'Aviso', callback = null) => {
            const modal = document.getElementById('app-notice-modal');
            const titleEl = document.getElementById('app-notice-title');
            const textEl = document.getElementById('app-notice-text');
            const okBtn = document.getElementById('app-notice-ok');
            const cancelBtn = document.getElementById('app-notice-cancel');
            if (!modal || !titleEl || !textEl || !okBtn) return;
            
            // Se o segundo parâmetro é uma função, é o callback
            let title = 'Aviso';
            let onConfirm = null;
            if (typeof titleOrCallback === 'function') {
                onConfirm = titleOrCallback;
            } else {
                title = titleOrCallback;
                onConfirm = callback;
            }
            
            titleEl.textContent = title; 
            textEl.textContent = message;
            document.body.classList.add('modal-open'); modal.classList.remove('hidden');
            
            // Se há callback, mostra como confirmação (2 botões)
            if (onConfirm && cancelBtn) {
                cancelBtn.classList.remove('hidden');
                okBtn.textContent = 'Confirmar';
                okBtn.className = 'soft-button danger';
            } else {
                if (cancelBtn) cancelBtn.classList.add('hidden');
                okBtn.textContent = 'OK';
                okBtn.className = 'soft-button';
            }
            
            const close = () => {
                document.body.classList.remove('modal-open'); modal.classList.add('hidden');
            };
            
            const confirm = () => {
                close();
                if (onConfirm) onConfirm();
            };
            
            okBtn.onclick = onConfirm ? confirm : close;
            if (cancelBtn) cancelBtn.onclick = close;
            modal.onclick = (e) => { if (e.target === modal) close(); };
        };
        return { saveToLocalStorage, loadFromLocalStorage, getTodayString, formatDateToBR, escapeHTML, showNotice };
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

            // Salvar posição do scroll da aba atual
            const currentActive = document.querySelector('.page.active');
            if (currentActive) {
                currentActive.dataset.scrollPosition = content.scrollTop;
            }

            pages.forEach(p => p.classList.remove('active'));
            targetPage.classList.add('active');
            allNavButtons.forEach(b => b.classList.toggle('active', b.dataset.target === targetId));
            Utils.saveToLocalStorage('activeTab', targetId);
            
            // Restaurar posição do scroll se existir
            const savedScrollPosition = targetPage.dataset.scrollPosition;
            if (savedScrollPosition) {
                content.scrollTop = parseInt(savedScrollPosition);
            } else {
                content.scrollTop = 0;
            }

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
            } else if (targetId === 'financas') {
                Finance && Finance.render();
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
        const DARK_THEME_COLORS = ['#6C7EFF', '#FD7E14', '#48E5C2', '#FF69B4', '#FF6B6B', '#F0D55D', '#8B95FF'];
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
            clearCompletedBtn.classList.toggle('hidden', !hasCompleted);
        };

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
            addTaskBtn.addEventListener('click', () => { 
                add({ text: taskInput.value, priority: currentTaskPriority }); 
                taskInput.value = ""; 
                taskInput.focus(); // Manter foco para adicionar próxima tarefa
            });
            taskInput.addEventListener('keypress', e => { 
                if (e.key === 'Enter') { 
                    add({ text: taskInput.value, priority: currentTaskPriority }); 
                    taskInput.value = ""; 
                }
            });

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
        const updateDisplay = () => { if (!timerDisplay) return; const minutes = Math.floor(totalSeconds / 60), seconds = totalSeconds % 60; timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`; document.title = `${timerDisplay.textContent} - Life OS`; const times = getTimes(); const max = (currentCycle==='focus'?times.focus: currentCycle==='shortBreak'?times.shortBreak: times.longBreak) * 60; const progressDeg = 360 * (1 - (totalSeconds / max)); const ring = timerDisplay.parentElement; ring && ring.style.setProperty('--progress', `${progressDeg}deg`); };
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
        const openGoalModal = (mode = 'add', goalId = null) => { goalForm.reset(); goalForm.dataset.mode = mode; goalForm.dataset.goalId = goalId; categoryContainer.innerHTML = Object.keys(ALL_CATEGORIES).map(cat => `<button type="button" class="category-btn">${cat}</button>`).join(''); if (mode === 'edit' && goalId !== null) { modalTitle.textContent = "Editar Meta"; const goal = goals.find(g => g.id === goalId); document.getElementById('goal-title-input').value = goal.title; document.getElementById('goal-motivation-input').value = goal.motivation; document.getElementById('goal-date-input').value = goal.targetDate; categoryContainer.querySelectorAll('.category-btn').forEach(btn => { if (goal.categories.includes(btn.textContent)) btn.classList.add('active'); }); } else { modalTitle.textContent = "Criar Nova Meta"; } document.body.classList.add('modal-open'); goalModal.classList.remove('hidden'); };
        const closeGoalModal = () => { document.body.classList.remove('modal-open'); goalModal.classList.add('hidden'); };

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
                    document.body.classList.add('modal-open');
                    document.body.classList.add('modal-open'); priorityModal.classList.remove('hidden');
                }

                if (shouldReRender) { const wasExpanded = goalItem.classList.contains('expanded'); Utils.saveToLocalStorage('goals', goals); render(); if (wasExpanded) document.querySelector(`.goal-item[data-id="${goalId}"]`)?.classList.add('expanded'); }
            });

            goalsList.addEventListener('submit', e => { e.preventDefault(); if (e.target.classList.contains('add-subtask-form')) { const goalItem = e.target.closest('.goal-item'); const goalId = Number(goalItem.dataset.id); const goal = goals.find(g => g.id === goalId); const subtaskInput = e.target.querySelector('.subtask-input'); if (subtaskInput.value.trim() && goal) { goal.subtasks.push({ id: Date.now(), text: subtaskInput.value.trim(), completed: false }); Utils.saveToLocalStorage('goals', goals); render(); document.querySelector(`.goal-item[data-id="${goalId}"]`)?.classList.add('expanded'); } } });

            priorityModal.addEventListener('click', (e) => {
                if(e.target === priorityModal) { document.body.classList.remove('modal-open'); priorityModal.classList.add('hidden'); }
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
                    document.body.classList.remove('modal-open');
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
        const openHabitModal = (mode = 'add', habitId = null) => { habitForm.reset(); habitForm.dataset.mode = mode; habitForm.dataset.habitId = habitId; iconPicker.innerHTML = AVAILABLE_ICONS.map(i => `<div class="picker-option"><button type="button" class="picker-button" data-icon="${i.name}"><i class='bx ${i.name}'></i></button><span class="picker-label">${i.label}</span></div>`).join(''); colorPicker.innerHTML = AVAILABLE_COLORS.map(c => `<button type="button" class="picker-button" data-color="${c}"><div class="color-swatch" style="background-color:${c}"></div></button>`).join(''); const modalTitle = document.getElementById('habit-modal-title'); if (mode === 'edit' && habitId !== null) { modalTitle.textContent = "Editar Hábito"; deleteHabitBtn.classList.remove('hidden'); const habit = habits.find(h => h.id === habitId); document.getElementById('habit-name-input').value = habit.name; iconPicker.querySelector(`.picker-button[data-icon="${habit.icon}"]`)?.classList.add('active'); colorPicker.querySelector(`.picker-button[data-color="${habit.color}"]`)?.classList.add('active'); } else { modalTitle.textContent = "Novo Hábito"; deleteHabitBtn.classList.add('hidden'); } document.body.classList.add('modal-open'); habitModal.classList.remove('hidden'); };
        const closeHabitModal = () => { document.body.classList.remove('modal-open'); habitForm.reset(); habitModal.classList.add('hidden'); };
        const init = () => { addHabitModalBtn.addEventListener('click', () => openHabitModal('add')); cancelHabitBtn.addEventListener('click', closeHabitModal); habitModal.addEventListener('click', e => { if (e.target === habitModal) closeHabitModal(); }); iconPicker.addEventListener('click', e => { const button = e.target.closest('.picker-button'); if (button) { iconPicker.querySelector('.active')?.classList.remove('active'); button.classList.add('active'); }}); colorPicker.addEventListener('click', e => { const button = e.target.closest('.picker-button'); if (button) { colorPicker.querySelector('.active')?.classList.remove('active'); button.classList.add('active'); }}); habitForm.addEventListener('submit', e => { e.preventDefault(); const name = document.getElementById('habit-name-input').value, icon = iconPicker.querySelector('.active')?.dataset.icon, color = colorPicker.querySelector('.active')?.dataset.color; if (!name || !icon || !color) return alert("Por favor, preencha todos os campos."); const mode = habitForm.dataset.mode, habitId = Number(habitForm.dataset.habitId); if (mode === 'add') { habits.push({ id: Date.now(), name, icon, color, completedDates: [] }); } else if (mode === 'edit') { const habitIndex = habits.findIndex(h => h.id === habitId); if(habitIndex > -1) habits[habitIndex] = { ...habits[habitIndex], name, icon, color }; } Utils.saveToLocalStorage('habits', habits); render(); closeHabitModal(); }); habitsList.addEventListener('click', e => { const habitItem = e.target.closest('.habit-item'); if (!habitItem) return; const habitId = Number(habitItem.dataset.id); const habit = habits.find(h => h.id === habitId); if (!habit) return; if (e.target.closest('.day-circle:not(.disabled)')) { const date = e.target.closest('.day-circle').dataset.date; const dateIndex = habit.completedDates.indexOf(date); if (dateIndex > -1) habit.completedDates.splice(dateIndex, 1); else habit.completedDates.push(date); Utils.saveToLocalStorage('habits', habits); render(); } if (e.target.closest('.edit-habit-btn')) openHabitModal('edit', habitId); }); deleteHabitBtn.addEventListener('click', () => { habitToDeleteId = Number(habitForm.dataset.habitId); document.body.classList.add('modal-open'); confirmationModal.classList.remove('hidden'); }); cancelDeleteBtn.addEventListener('click', () => { document.body.classList.remove('modal-open'); confirmationModal.classList.add('hidden'); habitToDeleteId = null; }); confirmDeleteBtn.addEventListener('click', () => { if (habitToDeleteId !== null) { habits = habits.filter(h => h.id !== habitToDeleteId); Utils.saveToLocalStorage('habits', habits); render(); habitToDeleteId = null; } document.body.classList.remove('modal-open'); confirmationModal.classList.add('hidden'); closeHabitModal(); }); render(); };
        return { init, render };
    })();

    // --- MÓDULO DE HUMOR ---
    const Mood = (() => {
        const moodOptionsContainer = document.getElementById('mood-options');
        const MOODS = { 5: { icon: 'bxs-happy-heart-eyes', label: 'Ótimo', class: 'mood-5' }, 4: { icon: 'bxs-smile', label: 'Bom', class: 'mood-4' }, 3: { icon: 'bxs-meh', label: 'Normal', class: 'mood-3' }, 2: { icon: 'bxs-meh-alt', label: 'Ruim', class: 'mood-2' }, 1: { icon: 'bxs-sad', label: 'Terrível', class: 'mood-1' } };
        const MOOD_JOKES = { 5: 'Energia radiante e contagiante', 4: 'Equilibrio e bem-estar em harmonia', 3: 'Serenidade em estado natural', 2: 'Momento de pausa e cuidado', 1: 'Gentileza consigo mesmo é essencial' };
        const moodNoteEl = document.createElement('p'); moodNoteEl.className = 'mood-note';

        const render = () => {
             moodOptionsContainer.innerHTML = Object.keys(MOODS).sort((a, b) => b - a).map(key => `<div class="mood-option"><button class="mood-btn ${MOODS[key].class}" data-mood="${key}"><i class='bx ${MOODS[key].icon}'></i></button><span class="mood-label">${MOODS[key].label}</span></div>`).join('');
             loadMoodState();
             // anexar nota engraçada abaixo do picker
             moodOptionsContainer.parentElement?.appendChild(moodNoteEl);
        }

        const loadMoodState = () => {
            const todayData = DailyData.getTodayData();
            moodOptionsContainer.querySelector('.active')?.classList.remove('active');
            if (todayData.mood) {
                const btnToActivate = moodOptionsContainer.querySelector(`.mood-btn[data-mood="${todayData.mood}"]`);
                if (btnToActivate) btnToActivate.classList.add('active');
                moodNoteEl.textContent = MOOD_JOKES[todayData.mood] || '';
            } else {
                moodNoteEl.textContent = '';
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
            document.body.classList.add('modal-open'); historyModal.classList.remove('hidden');
        };

        const closeHistoryModal = () => { document.body.classList.remove('modal-open'); historyModal.classList.add('hidden'); };

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
        const waterCupMlInput = document.getElementById('water-cup-ml');
        const decreaseWaterBtn = document.getElementById('decrease-water-btn');
        const increaseWaterBtn = document.getElementById('increase-water-btn');
        const waterCountEl = document.getElementById('water-count');
        const waterGoalTextEl = document.getElementById('water-goal-text');
        const waterProgressEl = document.getElementById('water-progress');
        const waterFeedbackEl = document.getElementById('water-feedback');
        const weeklySummaryList = document.getElementById('weekly-summary-list');
        const weeklyShareBtn = document.getElementById('share-weekly-summary-btn');

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
        let waterCupMl = Utils.loadFromLocalStorage('waterCupMl', 250);

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
            const totalMl = (todayData.water || 0) * waterCupMl;
            const goalMl = waterGoal * waterCupMl;
            waterGoalTextEl.textContent = `= ${totalMl} ml / ${goalMl} ml`;
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
            renderSleepWeekBars();
        };
        const renderSleepWeekBars = () => {
            const container = document.getElementById('sleep-week-bars'); if (!container) return;
            const all = DailyData.getAllData();
            const now = new Date(); const start = new Date(now); start.setDate(now.getDate()-6);
            const days = [];
            for (let i=0;i<7;i++){ const d=new Date(start); d.setDate(start.getDate()+i); const key=d.toISOString().split('T')[0]; const entry = all.find(x=>x.date===key); const min = entry?.sleep?.totalMinutes||0; const h = Math.round(min/60); let lv='lv1'; if (h>=7 && h<8) lv='lv3'; else if (h>=8) lv='lv4'; else if (h>=5) lv='lv2'; days.push(`<div class="sleep-week-bar ${lv}" title="${h}h"></div>`); }
            container.innerHTML = days.join('');
        };
        const renderWeeklySummary = () => {
            if (!weeklySummaryList) return;
            const allData = DailyData.getAllData();
            const now = new Date();
            const start = new Date(now); start.setDate(now.getDate() - 6);
            const span = allData.filter(d => new Date(d.date) >= new Date(start.toISOString().split('T')[0]));
            const totalWater = span.reduce((a,d)=> a + (d.water||0), 0);
            const totalWaterMl = totalWater * waterCupMl;
            const sleepAvg = (()=>{ const minutes = span.filter(d=>d.sleep).map(d=>d.sleep.totalMinutes); if(!minutes.length) return '-'; const avg = Math.round(minutes.reduce((a,b)=>a+b,0)/minutes.length); const h = Math.floor(avg/60), m = avg%60; return `${h}h ${m}m`; })();
            const focusStats = Utils.loadFromLocalStorage('focusStats', { sessions: [] });
            const focusSpan = focusStats.sessions.filter(s=> new Date(s.date) >= new Date(start.toISOString().split('T')[0]));
            const focusMin = focusSpan.reduce((a,s)=> a + (s.minutes||0), 0);
            const focusSes = focusSpan.length;
            const moodAvgVal = (()=>{ const vals = span.map(d=> Number(d.mood||0)).filter(v=> v>0); if(!vals.length) return null; return Number((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1)); })();
            const moodAvg = moodAvgVal ? `${moodAvgVal}/5` : '-';
            const MOOD_WEEK_JOKES = [ {max:1.9, text:'Semana pedindo feriado'}, {max:2.9, text:'Precisamos de memes e sol'}, {max:3.9, text:'Ok, mas pode melhorar'}, {max:4.5, text:'Clima excelente'}, {max:5.1, text:'MVP do bom humor'} ];
            const moodNote = moodAvgVal ? (MOOD_WEEK_JOKES.find(j=> moodAvgVal <= j.max)?.text || '') : '';
            weeklySummaryList.innerHTML = [
                `<li>Água: ${totalWater} copos (${totalWaterMl} ml)</li>`,
                `<li>Sono médio: ${sleepAvg}</li>`,
                `<li>Foco: ${focusMin} min • ${focusSes} sessões</li>`,
                `<li>Humor médio: ${moodAvg} ${moodNote?('- '+moodNote):''}</li>`
            ].join('');
        };
        const shareWeeklySummary = () => {
            const text = weeklySummaryList?.innerText || 'Resumo da semana - Life OS';
            if (navigator.share) { navigator.share({ text }).catch(()=>{}); }
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
            document.body.classList.add('modal-open'); historyModal.classList.remove('hidden');
        };

        const closeHistoryModal = () => { document.body.classList.remove('modal-open'); historyModal.classList.add('hidden'); };

        const init = () => {
            waterGoalInput.value = waterGoal;
            waterGoalInput.addEventListener('change', () => {
                waterGoal = parseInt(waterGoalInput.value) || 8;
                Utils.saveToLocalStorage('waterGoal', waterGoal);
                const todayData = DailyData.getTodayData();
                todayData.waterGoal = waterGoal;
                DailyData.saveData();
                render(); renderWeeklySummary();
            });
            if (waterCupMlInput) {
                waterCupMlInput.value = waterCupMl;
                waterCupMlInput.addEventListener('change', ()=>{ waterCupMl = Math.max(50, parseInt(waterCupMlInput.value)||250); Utils.saveToLocalStorage('waterCupMl', waterCupMl); render(); renderWeeklySummary(); });
            }

            increaseWaterBtn.addEventListener('click', () => {
                const todayData = DailyData.getTodayData();
                todayData.water = (todayData.water || 0) + 1;
                DailyData.saveData();
                render(); renderWeeklySummary();
            });

            decreaseWaterBtn.addEventListener('click', () => {
                const todayData = DailyData.getTodayData();
                if (todayData.water && todayData.water > 0) {
                    todayData.water -= 1;
                    DailyData.saveData();
                    render(); renderWeeklySummary();
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
                    document.body.classList.add('modal-open'); sleepQualityModal.classList.remove('hidden');
                }
            });
            sleepQualityCancel && sleepQualityCancel.addEventListener('click', () => { pendingSleepData = null; document.body.classList.remove('modal-open'); sleepQualityModal.classList.add('hidden'); });
            sleepQualityConfirm && sleepQualityConfirm.addEventListener('click', () => { if (!pendingSleepData) return; const quality = Math.max(1, Math.min(5, parseInt(sleepQualityInput.value || '4'))); const todayData = DailyData.getTodayData(); todayData.sleep = { ...pendingSleepData, quality }; DailyData.saveData(); pendingSleepData = null; document.body.classList.remove('modal-open'); sleepQualityModal.classList.add('hidden'); render(); });

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

            weeklyShareBtn && weeklyShareBtn.addEventListener('click', shareWeeklySummary);
            render(); renderWeeklySummary();
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

        const renderMits = () => { mitsList.innerHTML = mits.map((m, i) => `<li class="mit-item" data-index="${i}"><span class="mit-text">${Utils.escapeHTML(m.text)}</span><div class="task-item-buttons"><button class="soft-button icon-btn delete-mit-btn"><i class='bx bxs-trash'></i></button></div></li>`).join(''); };
        const addMit = (text) => { const t = text?.trim(); if(!t) return; if (mits.length >= 3) { Utils.showNotice('Limite de 3 MITs. Conclua ou limpe antes de adicionar novos.'); return; } mits.push({ text: t }); Utils.saveToLocalStorage('mits', mits); renderMits(); };
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
        const renderTimeboxes = () => { tbList.innerHTML = timeboxes.map((tb, i) => `<li class="timeboxing-item" data-index="${i}"><span class="tb-label">${Utils.escapeHTML(tb.label)}</span><span> — ${tb.start} • ${tb.duration}m</span><div class="task-item-buttons"><button class="soft-button icon-btn delete-tb-btn"><i class='bx bxs-trash'></i></button></div></li>`).join(''); updateNowHighlight(); };
        const getMinutesFromHHMM = (s) => { const [h, m] = (s || '00:00').split(':').map(Number); return (h||0)*60 + (m||0); };
        const updateNowHighlight = () => { if (!tbList) return; const now = new Date(); const nowMin = now.getHours()*60 + now.getMinutes(); tbList.querySelectorAll('.timeboxing-item').forEach(li => { const i = Number(li.dataset.index); const tb = timeboxes[i]; if (!tb) return; const start = getMinutesFromHHMM(tb.start); const dur = parseInt(tb.duration)||0; const active = nowMin >= start && nowMin < (start + dur); li.classList.toggle('now', !!active); }); };

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
            mitsList && mitsList.addEventListener('click', (e) => {
                const item = e.target.closest('.mit-item'); if (!item) return;
                if (e.target.closest('.delete-mit-btn')) { const i = Number(item.dataset.index); if(Number.isInteger(i)) { mits.splice(i,1); Utils.saveToLocalStorage('mits', mits); renderMits(); } return; }
                const textEl = item.querySelector('.mit-text'); if (!textEl) return;
                const i = Number(item.dataset.index); if(!Number.isInteger(i)) return;
                const current = mits[i].text;
                const input = document.createElement('input'); input.type='text'; input.className='soft-input'; input.value=current; input.style.maxWidth='200px';
                textEl.replaceWith(input); input.focus();
                const commit = () => { mits[i].text = input.value.trim() || current; Utils.saveToLocalStorage('mits', mits); renderMits(); };
                input.addEventListener('blur', commit); input.addEventListener('keypress', ev => { if (ev.key==='Enter') { commit(); }});
            });
            clearMitsBtn && clearMitsBtn.addEventListener('click', () => { mits = []; Utils.saveToLocalStorage('mits', mits); renderMits(); });
            carryoverMitsBtn && carryoverMitsBtn.addEventListener('click', carryoverMits);
            renderMits();

            // Timeboxing
            tbForm && tbForm.addEventListener('submit', (e) => { e.preventDefault(); const label = tbLabel.value.trim(); if (!label) return; const start = tbStart.value || '--:--'; const duration = parseInt(tbDuration.value) || 30; timeboxes.push({ label, start, duration }); Utils.saveToLocalStorage('timeboxes', timeboxes); tbLabel.value=''; tbStart.value=''; tbDuration.value=''; renderTimeboxes(); });
            tbList && tbList.addEventListener('click', (e) => {
                const item = e.target.closest('.timeboxing-item'); if(!item) return;
                if (e.target.closest('.delete-tb-btn')) { const i = Number(item.dataset.index); if(Number.isInteger(i)) { timeboxes.splice(i,1); Utils.saveToLocalStorage('timeboxes', timeboxes); renderTimeboxes(); } return; }
                const labelEl = item.querySelector('.tb-label'); if(!labelEl) return;
                const i = Number(item.dataset.index); if(!Number.isInteger(i)) return;
                const current = timeboxes[i].label;
                const input = document.createElement('input'); input.type='text'; input.className='soft-input'; input.value=current; input.style.maxWidth='180px';
                labelEl.replaceWith(input); input.focus();
                const commit = () => { timeboxes[i].label = input.value.trim() || current; Utils.saveToLocalStorage('timeboxes', timeboxes); renderTimeboxes(); };
                input.addEventListener('blur', commit); input.addEventListener('keypress', ev => { if (ev.key==='Enter') { commit(); }});
            });
            renderTimeboxes(); updateNowHighlight(); setInterval(updateNowHighlight, 60000);

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

    // --- MÓDULO TUTORIAL & DADOS ---
    (() => {
        const tutorialBtn = document.getElementById('open-tutorial-btn');
        const tutorialModal = document.getElementById('tutorial-modal');
        const tutorialContent = document.getElementById('tutorial-content');
        const closeTutorialBtn = document.getElementById('close-tutorial-btn');
        const closeTutorialBtnX = document.getElementById('close-tutorial-btn-x');
        const purgeBtn = document.getElementById('purge-old-data-btn');
        const resetBtn = document.getElementById('reset-all-data-btn');
        const TUTORIAL_HTML = `
<h3>Como usar o Life OS</h3>
<p>O Life OS é seu painel diário para foco e bem‑estar. Tudo fica salvo localmente no seu dispositivo.</p>

<h4>Navegação</h4>
<ul>
  <li>Use a barra inferior para trocar de aba.</li>
  <li>O app lembra a última aba aberta automaticamente.</li>
  </ul>

<h4>Foco</h4>
<h5>MITs do Dia (até 3)</h5>
<ul>
  <li>Adicionar: digite "Revisar proposta" e toque em +.</li>
  <li>Editar: toque no texto (ex.: "Revisar proposta") e altere para "Revisar proposta final".</li>
  <li>Levar para amanhã: toque em "Levar para amanhã" para copiar a lista.</li>
  <li>Limite: ao tentar cadastrar o 4º, o app avisa para priorizar.</li>
  </ul>
<h5>Timeboxing</h5>
<ul>
  <li>Exemplo: rótulo "Inglês", início 08:00, duração 30.</li>
  <li>Editar rótulo: toque no texto e confirme com Enter.</li>
  </ul>
<h5>Pomodoro</h5>
<ul>
  <li>Defina tempos em Ajustes &gt; Pomodoro.</li>
  <li>As sessões contam em Estatísticas de Foco.</li>
  </ul>

<h4>Bem‑estar</h4>
<h5>Hidratação</h5>
<ul>
  <li>Ajuste a meta em unidades e a unidade em ml por copo.</li>
  <li>Exemplo: meta 8 copos de 250 ml (2 L/dia).</li>
  <li>Use +/– para registrar.</li>
  </ul>
<h5>Sono</h5>
<ul>
  <li>Registre dormi/acordei e escolha a qualidade (1–5).</li>
  <li>Exemplo: 22:30 a 06:30 = 8h; qualidade 4/5.</li>
  </ul>
<h5>Humor</h5>
<ul>
  <li>Toque no emoji que representa seu humor (1–5).</li>
  </ul>
<h5>Reflexão do Dia</h5>
<ul>
  <li>Responda a pergunta diária. Ex.: "Ponto alto do dia?" → "Treino concluído".</li>
  </ul>

<h4>Resumo da Semana</h4>
<ul>
  <li>Mostra água total (ml), sono médio, foco (min/sessões) e humor médio.</li>
  <li>Compartilhe com o botão (ex.: WhatsApp).</li>
  </ul>

<h4>Metas</h4>
<ul>
  <li>Crie metas com categorias e subtarefas.</li>
  <li>Envie subtarefas ao Foco &gt; Tarefas.</li>
  </ul>

<h4>Hábitos</h4>
<ul>
  <li>Crie com ícone/cor e marque os dias da semana.</li>
  <li>O contador mostra sua sequência (streak).</li>
  </ul>

<h4>Ajustes</h4>
<ul>
  <li>Aparência: tema e cor de destaque.</li>
  <li>Pomodoro: tempos de foco e pausas.</li>
  <li>Hidratação: meta (unidades) e unidade (ml por copo).</li>
  <li>Dados: limpar históricos antigos e resetar tudo (cuidado).</li>
  </ul>

<h4>Dicas</h4>
<ul>
  <li>Use MITs para garantir o essencial do dia.</li>
  <li>Mantenha rótulos curtos.</li>
  <li>Revise seu resumo no domingo.</li>
  </ul>`;
        if (tutorialContent && !tutorialContent.innerHTML) tutorialContent.innerHTML = TUTORIAL_HTML;
        if (tutorialBtn && tutorialModal) tutorialBtn.addEventListener('click', (e) => { e.preventDefault(); document.body.classList.add('modal-open'); tutorialModal.classList.remove('hidden'); });
        if (closeTutorialBtn) closeTutorialBtn.addEventListener('click', (e)=>{ e.preventDefault(); document.body.classList.remove('modal-open'); tutorialModal.classList.add('hidden'); });
        if (closeTutorialBtnX) closeTutorialBtnX.addEventListener('click', (e)=>{ e.preventDefault(); document.body.classList.remove('modal-open'); tutorialModal.classList.add('hidden'); });
        if (tutorialModal) tutorialModal.addEventListener('click', (e)=>{ if (e.target === tutorialModal) document.body.classList.remove('modal-open'); tutorialModal.classList.add('hidden'); });

        if (purgeBtn) purgeBtn.addEventListener('click', () => {
            const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 180);
            // dailyData
            const all = Utils.loadFromLocalStorage('dailyData', []);
            const kept = all.filter(d => new Date(d.date) >= new Date(cutoff.toISOString().split('T')[0]));
            Utils.saveToLocalStorage('dailyData', kept);
            // focusStats
            const focusStats = Utils.loadFromLocalStorage('focusStats', { sessions: [] });
            focusStats.sessions = focusStats.sessions.filter(s => new Date(s.date) >= new Date(cutoff.toISOString().split('T')[0]));
            Utils.saveToLocalStorage('focusStats', focusStats);
            Utils.showNotice('Histórico anterior a 180 dias limpo.');
        });
        if (resetBtn) resetBtn.addEventListener('click', () => {
            const proceed = () => { localStorage.clear(); location.reload(); };
            const modal = document.getElementById('app-notice-modal');
            const titleEl = document.getElementById('app-notice-title');
            const textEl = document.getElementById('app-notice-text');
            const okBtn = document.getElementById('app-notice-ok');
            if (!modal || !titleEl || !textEl || !okBtn) { proceed(); return; }
            titleEl.textContent = 'Confirmar'; textEl.textContent = 'Isso apagará todos os dados locais. Continuar?';
            document.body.classList.add('modal-open'); modal.classList.remove('hidden');
            okBtn.onclick = proceed;
            modal.onclick = (e)=>{ if (e.target === modal) document.body.classList.remove('modal-open'); modal.classList.add('hidden'); };
        });
    })();

    // --- MÓDULO FINANÇAS (removido) ---
    /* const Finance = (() => {
        const periodChips = document.getElementById('fin-period-chips');
        const categoryFilter = document.getElementById('fin-category-filter');
        const sumInEl = document.getElementById('fin-sum-in');
        const sumOutEl = document.getElementById('fin-sum-out');
        const balanceEl = document.getElementById('fin-balance');
        const varianceEl = document.getElementById('fin-variance');
        const txList = document.getElementById('fin-transactions-list');
        const budgetsList = document.getElementById('fin-budgets-list');
        const savingsList = document.getElementById('fin-savings-list');
        const recurringList = document.getElementById('fin-recurring-list');
        const billsList = document.getElementById('fin-bills-list');
        const txModal = document.getElementById('transaction-modal');
        const txForm = document.getElementById('transaction-form');
        const txOpenBtn = document.getElementById('open-transaction-modal-btn');
        const txCancelBtn = document.getElementById('tr-cancel');
        const bdgModal = document.getElementById('budget-modal');
        const bdgForm = document.getElementById('budget-form');
        const bdgOpenBtn = document.getElementById('open-budget-modal-btn');
        const bdgCancelBtn = document.getElementById('bdg-cancel');
        const svModal = document.getElementById('savings-modal');
        const svForm = document.getElementById('savings-form');
        const svOpenBtn = document.getElementById('open-savings-modal-btn');
        const svCancelBtn = document.getElementById('sv-cancel');
        const rcModal = document.getElementById('recurring-modal');
        const rcForm = document.getElementById('recurring-form');
        const rcOpenBtn = document.getElementById('open-recurring-modal-btn');
        const rcCancelBtn = document.getElementById('rc-cancel');
        const blModal = document.getElementById('bill-modal');
        const blForm = document.getElementById('bill-form');
        const blOpenBtn = document.getElementById('open-bill-modal-btn');
        const blCancelBtn = document.getElementById('bl-cancel');

        const CATS = ['Alimentação','Transporte','Moradia','Lazer','Saúde','Educação','Outros'];
        const CURRENCY = 'R$';

        let transactions = Utils.loadFromLocalStorage('fin_transactions', []);
        let budgets = Utils.loadFromLocalStorage('fin_budgets', {});
        let savings = Utils.loadFromLocalStorage('fin_savings', []);
        let recurring = Utils.loadFromLocalStorage('fin_recurring', []);
        let bills = Utils.loadFromLocalStorage('fin_bills', []);
        let currentPeriod = Utils.loadFromLocalStorage('fin_period', 'month');
        let currentCategory = Utils.loadFromLocalStorage('fin_category', 'Todas');

        const fmt = v => `${CURRENCY} ${(Number(v)||0).toFixed(2).replace('.', ',')}`;
        const getPeriodRange = () => {
            const d = new Date();
            if (currentPeriod === 'today') {
                const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                const e = new Date(d.getFullYear(), d.getMonth(), d.getDate()+1);
                return { start: s, end: e };
            } else if (currentPeriod === 'week') {
                const day = d.getDay();
                const s = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
                const e = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (7-day));
                return { start: s, end: e };
            }
            // month default
            const s = new Date(d.getFullYear(), d.getMonth(), 1);
            const e = new Date(d.getFullYear(), d.getMonth()+1, 1);
            return { start: s, end: e };
        };
        const inRange = (dateStr) => {
            const { start, end } = getPeriodRange();
            const dd = new Date(dateStr);
            if (Number.isNaN(dd.getTime())) return true; // tolerante a datas inválidas para não quebrar
            return dd >= start && dd < end;
        };

        const renderFilters = () => {
            if (!periodChips || !categoryFilter) return;
            const periods = [
                { key:'today', label:'Hoje' },
                { key:'week', label:'Semana' },
                { key:'month', label:'Mês' }
            ];
            periodChips.innerHTML = periods.map(p=>`<button type="button" class="category-btn ${currentPeriod===p.key?'active':''}" data-period="${p.key}">${p.label}</button>`).join('');
            categoryFilter.innerHTML = ['Todas',...CATS].map(c=>`<option ${currentCategory===c?'selected':''}>${c}</option>`).join('');
            const quickAmounts = [10,25,50,100,200,500];
            const qa = document.getElementById('fin-quick-amounts');
            if (qa) qa.innerHTML = quickAmounts.map(v=>`<button type="button" class="category-btn" data-qa="${v}">+${v}</button>`).join('');
            const qc = document.getElementById('fin-quick-cats');
            if (qc) qc.innerHTML = CATS.slice(0,5).map(c=>`<button type="button" class="category-btn" data-qc="${c}">${c}</button>`).join('');
        };

        const renderSummary = () => {
            const inTx = transactions.filter(t => inRange(t.date) && (currentCategory==='Todas' || t.category===currentCategory) && t.type==='in');
            const outTx = transactions.filter(t => inRange(t.date) && (currentCategory==='Todas' || t.category===currentCategory) && t.type==='out');
            const sumIn = inTx.reduce((a,t)=>a+Number(t.value||0),0);
            const sumOut = outTx.reduce((a,t)=>a+Number(t.value||0),0);
            const balance = sumIn - sumOut;
            sumInEl && (sumInEl.textContent = fmt(sumIn));
            sumOutEl && (sumOutEl.textContent = fmt(sumOut));
            balanceEl && (balanceEl.textContent = fmt(balance));
            // variance vs previous month
            const now = new Date();
            const prevStart = new Date(now.getFullYear(), now.getMonth()-1, 1);
            const prevEnd = new Date(now.getFullYear(), now.getMonth(), 1);
            const prev = transactions.filter(t=> { const d = new Date(t.date); return d>=prevStart && d<prevEnd; });
            const prevIn = prev.filter(t=>t.type==='in').reduce((a,t)=>a+Number(t.value||0),0);
            const prevOut = prev.filter(t=>t.type==='out').reduce((a,t)=>a+Number(t.value||0),0);
            const prevBal = prevIn - prevOut;
            const diff = balance - prevBal;
            varianceEl && (varianceEl.textContent = `Variação vs mês anterior: ${diff>=0?'+':''}${fmt(diff)}`);
        };

        const renderTransactions = () => {
            if (!txList) return;
            const filtered = transactions.filter(t => inRange(t.date) && (currentCategory==='Todas' || t.category===currentCategory));
            const items = filtered.sort((a,b)=> new Date(b.date) - new Date(a.date)).map(t=>
                `<li class="finance-item" data-id="${t.id}">`+
                `<div class="left"><span class="title">${Utils.escapeHTML(t.category||'Sem categoria')}</span><span class="meta">${new Date(t.date).toLocaleDateString('pt-BR')}${t.note?(' • '+Utils.escapeHTML(t.note)) : ''}</span></div>`+
                `<div class="actions"><button class="soft-button icon-btn edit-tx"><i class='bx bxs-pencil'></i></button><button class="soft-button icon-btn del-tx"><i class='bx bxs-trash'></i></button></div>`+
                `<div class="finance-amount ${t.type}">${fmt(t.value)}</div>`+
                `</li>`).join('');
            txList.innerHTML = items || '<p style="opacity:.7; text-align:center;">Sem lançamentos no período.</p>';
        };

        const renderBudgets = () => {
            if (!budgetsList) return;
            const cats = Object.keys(budgets);
            budgetsList.innerHTML = cats.length? cats.map(cat=>{
                const limit = Number(budgets[cat]||0);
                const spent = transactions.filter(t=> t.type==='out' && t.category===cat && inRange(t.date)).reduce((a,t)=>a+Number(t.value||0),0);
                const pct = limit>0? Math.min(100, Math.round((spent/limit)*100)) : 0;
                return `<li class="finance-item"><div class="left"><span class="title">${Utils.escapeHTML(cat)}</span><span class="meta">${fmt(spent)} / ${fmt(limit)}</span><div class="progress-bar-outer"><div class="progress-bar-inner" style="width:${pct}%"></div></div></div><div class="actions"><button class="soft-button icon-btn del-bdg"><i class='bx bxs-trash'></i></button></div></li>`;
            }).join('') : '<p style="opacity:.7; text-align:center;">Nenhum orçamento definido.</p>';
        };

        const renderSavings = () => {
            if (!savingsList) return;
            savingsList.innerHTML = savings.length? savings.map(s=>{
                const pct = s.current && s.target? Math.min(100, Math.round((Number(s.current)/Number(s.target))*100)) : 0;
                return `<li class="finance-item" data-id="${s.id}"><div class="left"><span class="title">${Utils.escapeHTML(s.title)}</span><span class="meta">Meta ${fmt(s.target)} • Até ${s.due || '-'}</span><div class="progress-bar-outer"><div class="progress-bar-inner" style="width:${pct}%"></div></div></div><div class="actions"><button class="soft-button icon-btn add-sv"><i class='bx bx-plus'></i></button><button class="soft-button icon-btn del-sv"><i class='bx bxs-trash'></i></button></div></li>`;
            }).join('') : '<p style="opacity:.7; text-align:center;">Nenhuma meta de poupança.</p>';
        };

        const renderRecurring = () => {
            if (!recurringList) return;
            recurringList.innerHTML = recurring.length? recurring.map(r=> `<li class="finance-item" data-id="${r.id}"><div class="left"><span class="title">${Utils.escapeHTML(r.category||'-')}</span><span class="meta">${r.type==='in'?'Entrada':'Saída'} • Dia ${r.day} • ${fmt(r.value)}</span></div><div class="actions"><button class="soft-button icon-btn del-rc"><i class='bx bxs-trash'></i></button></div></li>`).join('') : '<p style="opacity:.7; text-align:center;">Nenhuma recorrência.</p>';
        };

        const renderBills = () => {
            if (!billsList) return;
            billsList.innerHTML = bills.length? bills.sort((a,b)=> new Date(a.due) - new Date(b.due)).map(b=> `<li class="finance-item" data-id="${b.id}"><div class="left"><span class="title">${Utils.escapeHTML(b.title)}</span><span class="meta">Vence em ${new Date(b.due).toLocaleDateString('pt-BR')} • ${Utils.escapeHTML(b.category||'-')}</span></div><div class="actions"><button class="soft-button icon-btn del-bl"><i class='bx bxs-trash'></i></button></div><div class="finance-amount out">${fmt(b.value)}</div></li>`).join('') : '<p style="opacity:.7; text-align:center;">Nenhuma conta a pagar.</p>';
        };

        const openModal = (m) => m && m.classList.remove('hidden');
        const closeModal = (m) => m && m.classList.add('hidden');

        const addTransaction = (tx) => { transactions.push({ id: Date.now(), ...tx }); Utils.saveToLocalStorage('fin_transactions', transactions); renderAll(); };
        const deleteTransaction = (id) => { transactions = transactions.filter(t=> t.id!==id); Utils.saveToLocalStorage('fin_transactions', transactions); renderAll(); };

        const saveBudget = (cat, amount) => { budgets[cat] = Number(amount)||0; Utils.saveToLocalStorage('fin_budgets', budgets); renderBudgets(); };
        const deleteBudget = (cat) => { delete budgets[cat]; Utils.saveToLocalStorage('fin_budgets', budgets); renderBudgets(); };

        const addSavings = (data) => { savings.push({ id: Date.now(), current: 0, ...data }); Utils.saveToLocalStorage('fin_savings', savings); renderSavings(); };
        const incSavings = (id, amount) => { const i = savings.findIndex(s=>s.id===id); if (i>-1) { savings[i].current = Number(savings[i].current||0) + Number(amount||0); Utils.saveToLocalStorage('fin_savings', savings); renderSavings(); } };
        const deleteSavings = (id) => { savings = savings.filter(s=> s.id!==id); Utils.saveToLocalStorage('fin_savings', savings); renderSavings(); };

        const addRecurring = (r) => { recurring.push({ id: Date.now(), ...r }); Utils.saveToLocalStorage('fin_recurring', recurring); renderRecurring(); };
        const deleteRecurring = (id) => { recurring = recurring.filter(x=> x.id!==id); Utils.saveToLocalStorage('fin_recurring', recurring); renderRecurring(); };

        const addBill = (b) => { bills.push({ id: Date.now(), ...b }); Utils.saveToLocalStorage('fin_bills', bills); renderBills(); };
        const deleteBill = (id) => { bills = bills.filter(x=> x.id!==id); Utils.saveToLocalStorage('fin_bills', bills); renderBills(); };

        const renderAll = () => { renderFilters(); renderSummary(); renderTransactions(); renderBudgets(); renderSavings(); renderRecurring(); renderBills(); };

        const applyRecurringForToday = () => {
            const today = new Date(); const day = today.getDate(); const todayKey = Utils.getTodayString();
            const appliedKey = 'fin_recurring_applied_'+todayKey;
            if (Utils.loadFromLocalStorage(appliedKey, false)) return; // evitar duplicar no mesmo dia
            recurring.forEach(r=> { if (Number(r.day)===day) { addTransaction({ type:r.type, value:r.value, category:r.category, date: todayKey, note: r.note||'recorrente' }); }});
            Utils.saveToLocalStorage(appliedKey, true);
        };

        const init = () => {
            if (!periodChips) return; // aba pode não estar montada
            // filtros
            periodChips.addEventListener('click', (e)=>{ const btn=e.target.closest('.category-btn'); if(!btn) return; if (btn.dataset.period) { currentPeriod = btn.dataset.period; Utils.saveToLocalStorage('fin_period', currentPeriod); renderAll(); } });
            categoryFilter.addEventListener('change', ()=>{ currentCategory = categoryFilter.value; Utils.saveToLocalStorage('fin_category', currentCategory); renderAll(); });
            const qa = document.getElementById('fin-quick-amounts');
            qa && qa.addEventListener('click', (e)=>{ const b=e.target.closest('[data-qa]'); if(!b) return; const val=Number(b.dataset.qa); openModal(txModal); document.getElementById('tr-value').value = String(val); });
            const qc = document.getElementById('fin-quick-cats');
            qc && qc.addEventListener('click', (e)=>{ const b=e.target.closest('[data-qc]'); if(!b) return; const cat=b.dataset.qc; openModal(txModal); document.getElementById('tr-category').value = cat; });

            // transações
            txOpenBtn && txOpenBtn.addEventListener('click', ()=> openModal(txModal));
            txCancelBtn && txCancelBtn.addEventListener('click', ()=> closeModal(txModal));
            txModal && txModal.addEventListener('click', (e)=>{ if (e.target===txModal) closeModal(txModal); });
            txForm && txForm.addEventListener('submit', (e)=>{ e.preventDefault(); const tx = { type: document.getElementById('tr-type').value, value: Number(document.getElementById('tr-value').value||0), category: document.getElementById('tr-category').value.trim()||'Outros', date: document.getElementById('tr-date').value || Utils.getTodayString(), note: document.getElementById('tr-note').value.trim()||null }; addTransaction(tx); closeModal(txModal); txForm.reset(); renderAll(); });
            txList && txList.addEventListener('click', (e)=>{ const li=e.target.closest('.finance-item'); if (!li) return; const id = Number(li.dataset.id); if (e.target.closest('.del-tx')) deleteTransaction(id); if (e.target.closest('.edit-tx')) { // simples: abre modal com valores
                const t = transactions.find(x=>x.id===id); if (!t) return; openModal(txModal); document.getElementById('tr-type').value=t.type; document.getElementById('tr-value').value=t.value; document.getElementById('tr-category').value=t.category; document.getElementById('tr-date').value=t.date; document.getElementById('tr-note').value=t.note||''; txForm.onsubmit = (ev)=>{ ev.preventDefault(); t.type=document.getElementById('tr-type').value; t.value=Number(document.getElementById('tr-value').value||0); t.category=document.getElementById('tr-category').value.trim()||'Outros'; t.date=document.getElementById('tr-date').value || Utils.getTodayString(); t.note=document.getElementById('tr-note').value.trim()||null; Utils.saveToLocalStorage('fin_transactions', transactions); closeModal(txModal); renderAll(); txForm.onsubmit=null; }; }});

            // budgets
            bdgOpenBtn && bdgOpenBtn.addEventListener('click', ()=> openModal(bdgModal));
            bdgCancelBtn && bdgCancelBtn.addEventListener('click', ()=> closeModal(bdgModal));
            bdgModal && bdgModal.addEventListener('click', (e)=>{ if (e.target===bdgModal) closeModal(bdgModal); });
            bdgForm && bdgForm.addEventListener('submit', (e)=>{ e.preventDefault(); const cat = document.getElementById('bdg-category').value.trim()||'Outros'; const amount = Number(document.getElementById('bdg-amount').value||0); saveBudget(cat, amount); closeModal(bdgModal); bdgForm.reset(); });
            budgetsList && budgetsList.addEventListener('click', (e)=>{ const li=e.target.closest('.finance-item'); if(!li) return; const titleEl = li.querySelector('.title'); const title = titleEl ? titleEl.textContent.trim() : null; if (e.target.closest('.del-bdg') && title) deleteBudget(title); });

            // savings
            svOpenBtn && svOpenBtn.addEventListener('click', ()=> openModal(svModal));
            svCancelBtn && svCancelBtn.addEventListener('click', ()=> closeModal(svModal));
            svModal && svModal.addEventListener('click', (e)=>{ if (e.target===svModal) closeModal(svModal); });
            svForm && svForm.addEventListener('submit', (e)=>{ e.preventDefault(); const data = { title: document.getElementById('sv-title').value.trim()||'Meta', target: Number(document.getElementById('sv-target').value||0), due: document.getElementById('sv-due').value||null, note: document.getElementById('sv-note').value.trim()||null }; addSavings(data); closeModal(svModal); svForm.reset(); });
            savingsList && savingsList.addEventListener('click', (e)=>{ const li=e.target.closest('.finance-item'); if(!li) return; const id = Number(li.dataset.id); if (e.target.closest('.del-sv')) deleteSavings(id); if (e.target.closest('.add-sv')) { const val = window.prompt('Quanto adicionar?'); const n = Number(val||0); if (n>0) incSavings(id, n); }});

            // recurring
            rcOpenBtn && rcOpenBtn.addEventListener('click', ()=> openModal(rcModal));
            rcCancelBtn && rcCancelBtn.addEventListener('click', ()=> closeModal(rcModal));
            rcModal && rcModal.addEventListener('click', (e)=>{ if (e.target===rcModal) closeModal(rcModal); });
            rcForm && rcForm.addEventListener('submit', (e)=>{ e.preventDefault(); const r = { type: document.getElementById('rc-type').value, value: Number(document.getElementById('rc-value').value||0), category: document.getElementById('rc-category').value.trim()||'Outros', day: Number(document.getElementById('rc-day').value||1), note: document.getElementById('rc-note').value.trim()||null }; addRecurring(r); closeModal(rcModal); rcForm.reset(); });
            recurringList && recurringList.addEventListener('click', (e)=>{ const li=e.target.closest('.finance-item'); if(!li) return; const id = Number(li.dataset.id); if (e.target.closest('.del-rc')) deleteRecurring(id); });

            // bills
            blOpenBtn && blOpenBtn.addEventListener('click', ()=> openModal(blModal));
            blCancelBtn && blCancelBtn.addEventListener('click', ()=> closeModal(blModal));
            blModal && blModal.addEventListener('click', (e)=>{ if (e.target===blModal) closeModal(blModal); });
            blForm && blForm.addEventListener('submit', (e)=>{ e.preventDefault(); const b = { title: document.getElementById('bl-title').value.trim()||'Conta', value: Number(document.getElementById('bl-value').value||0), due: document.getElementById('bl-due').value||Utils.getTodayString(), category: document.getElementById('bl-category').value.trim()||null }; addBill(b); closeModal(blModal); blForm.reset(); });
            billsList && billsList.addEventListener('click', (e)=>{ const li=e.target.closest('.finance-item'); if(!li) return; const id = Number(li.dataset.id); if (e.target.closest('.del-bl')) deleteBill(id); });

            // bootstrap
            applyRecurringForToday();
            renderAll();
        };

        return { init, renderAll };
    })(); */

    // --- MÓDULO DE FINANÇAS ---
    const Finance = (() => {
        // Elementos DOM
        const financeSection = document.getElementById('financas');
        const addTransactionBtn = document.getElementById('add-transaction-btn');
        const addIncomeBtn = document.getElementById('add-income-btn');
        const addExpenseBtn = document.getElementById('add-expense-btn');
        const transactionModal = document.getElementById('transaction-modal');
        const transactionForm = document.getElementById('transaction-form');
        const closeTransactionBtn = document.getElementById('close-transaction-btn');
        const cancelTransactionBtn = document.getElementById('cancel-transaction-btn');
        const deleteTransactionBtn = document.getElementById('delete-transaction-btn');
        
        // Modais de filtro
        const categoryModal = document.getElementById('finance-category-modal');
        const periodFilterBtn = document.getElementById('finance-period-filter-btn');
        const transactionsFilterBtn = document.getElementById('finance-transactions-filter-btn');
        const closeCategoryModalBtn = document.getElementById('close-category-modal-btn');
        const closeCategoryModalFooterBtn = document.getElementById('close-category-modal-footer-btn');
        const clearCategoryFilterBtn = document.getElementById('clear-category-filter-btn');
        const categoryFilterGrid = document.getElementById('finance-category-filter-grid');
        
        // Form elements
        const transactionAmount = document.getElementById('transaction-amount');
        const transactionDate = document.getElementById('transaction-date');
        const transactionDescription = document.getElementById('transaction-description');
        const quickAmounts = document.getElementById('finance-quick-amounts');
        const categoryGrid = document.getElementById('finance-category-grid');
        
        // Novos elementos do seletor de categorias
        const transactionCategoryBtn = document.getElementById('transaction-category-btn');
        const transactionCategoryIcon = document.getElementById('transaction-category-icon');
        const transactionCategoryText = document.getElementById('transaction-category-text');
        const transactionCategoryPicker = document.getElementById('transaction-category-picker');
        
        // Variable to track current transaction type
        let currentTransactionType = 'expense';
        let selectedCategory = null;
        
        // Summary elements
        const totalIncomeEl = document.getElementById('finance-total-income');
        const totalExpenseEl = document.getElementById('finance-total-expense');
        const balanceEl = document.getElementById('finance-balance');
        const progressFill = document.getElementById('finance-progress-fill');
        const progressText = document.getElementById('finance-progress-text');
        const summaryTitle = document.getElementById('finance-summary-title');
        
        // Filter elements
        const transactionsList = document.getElementById('finance-transactions-list');
        
        // Data
        let transactions = Utils.loadFromLocalStorage('finance_transactions', []);
        // Categorias para despesas
        let expenseCategories = Utils.loadFromLocalStorage('finance_expense_categories', [
            { id: 'alimentacao', name: 'Alimentação', icon: 'bx-restaurant', color: '#F59E0B' },
            { id: 'transporte', name: 'Transporte', icon: 'bx-car', color: '#3B82F6' },
            { id: 'moradia', name: 'Moradia', icon: 'bx-home', color: '#8B5CF6' },
            { id: 'lazer', name: 'Lazer', icon: 'bx-game', color: '#EC4899' },
            { id: 'saude', name: 'Saúde', icon: 'bx-plus-medical', color: '#10B981' },
            { id: 'educacao', name: 'Educação', icon: 'bx-book', color: '#6366F1' },
            { id: 'compras', name: 'Compras', icon: 'bx-shopping-bag', color: '#EF4444' },
            { id: 'servicos', name: 'Serviços', icon: 'bx-wrench', color: '#F97316' },
            { id: 'outros', name: 'Outros', icon: 'bx-dots-horizontal', color: '#6B7280' }
        ]);
        
        // Categorias para receitas
        let incomeCategories = Utils.loadFromLocalStorage('finance_income_categories', [
            { id: 'salario', name: 'Salário', icon: 'bx-money', color: '#10B981' },
            { id: 'freelance', name: 'Freelance', icon: 'bx-briefcase', color: '#3B82F6' },
            { id: 'investimentos', name: 'Investimentos', icon: 'bx-trending-up', color: '#8B5CF6' },
            { id: 'vendas', name: 'Vendas', icon: 'bx-store', color: '#F59E0B' },
            { id: 'bonus', name: 'Bônus', icon: 'bx-gift', color: '#EC4899' },
            { id: 'aluguel', name: 'Aluguel', icon: 'bx-home-heart', color: '#6366F1' },
            { id: 'outros', name: 'Outros', icon: 'bx-dots-horizontal', color: '#6B7280' }
        ]);
        
        let currentPeriod = Utils.loadFromLocalStorage('finance_period', 'month');
        let currentCategory = Utils.loadFromLocalStorage('finance_category', 'all');
        let editingTransaction = null;

        // Utility functions
        const formatCurrency = (value) => {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(value || 0);
        };
        
        const renderCategories = (type = 'expense') => {
            if (!transactionCategoryPicker) return;
            
            const categories = type === 'income' ? incomeCategories : expenseCategories;
            
            transactionCategoryPicker.innerHTML = categories.map(category => `
                <button type="button" class="category-option" data-category="${category.id}" data-icon="${category.icon}" data-color="${category.color}">
                    <i class='bx ${category.icon}' style="color: ${category.color}"></i>
                    <span>${category.name}</span>
                </button>
            `).join('');
        };

        const updateCategorySelector = (category) => {
            if (!category || !transactionCategoryIcon || !transactionCategoryText) return;
            
            selectedCategory = category;
            transactionCategoryIcon.className = `bx ${category.icon}`;
            transactionCategoryIcon.style.color = category.color;
            transactionCategoryText.textContent = category.name;
        };

        const resetCategorySelector = () => {
            if (!transactionCategoryIcon || !transactionCategoryText) return;
            
            selectedCategory = null;
            transactionCategoryIcon.className = 'bx bx-category';
            transactionCategoryIcon.style.color = '';
            transactionCategoryText.textContent = 'Selecionar categoria';
        };

        const formatDate = (dateString) => {
            try {
                const date = new Date(dateString + 'T12:00:00'); // Add time to avoid timezone issues
                const now = new Date();
                const brasiliaOffset = -3;
                const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                const today = new Date(utc + (brasiliaOffset * 3600000));
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (date.toDateString() === today.toDateString()) {
                    return 'Hoje';
                } else if (date.toDateString() === yesterday.toDateString()) {
                    return 'Ontem';
                } else {
                    return date.toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'short' 
                    });
                }
            } catch (e) {
                return dateString;
            }
        };

        const getCurrentMonthYear = () => {
            const now = new Date();
            const brasiliaOffset = -3;
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const brasiliaTime = new Date(utc + (brasiliaOffset * 3600000));
            return brasiliaTime.toLocaleDateString('pt-BR', { 
                month: 'long', 
                year: 'numeric' 
            });
        };

        // Variáveis para período personalizado
        let customStartDate = null;
        let customEndDate = null;

        const getPeriodRange = () => {
            const now = new Date();
            let start, end;
            
            switch (currentPeriod) {
                case 'today':
                    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    end.setHours(23, 59, 59, 999); // Incluir todo o dia
                    break;
                case 'week':
                    const dayOfWeek = now.getDay();
                    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
                    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - dayOfWeek));
                    end.setHours(23, 59, 59, 999); // Incluir todo o último dia da semana
                    break;
                case 'month':
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último dia do mês
                    end.setHours(23, 59, 59, 999);
                    break;
                case 'all':
                    start = new Date(2000, 0, 1); // Data muito antiga
                    end = new Date(2100, 0, 1);   // Data muito futura
                    break;
                case 'custom':
                    if (customStartDate && customEndDate) {
                        start = new Date(customStartDate);
                        end = new Date(customEndDate);
                        end.setHours(23, 59, 59, 999); // Incluir todo o dia final
                    } else {
                        // Fallback para mês atual se não houver datas customizadas
                        start = new Date(now.getFullYear(), now.getMonth(), 1);
                        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                        end.setHours(23, 59, 59, 999);
                    }
                    break;
                default:
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    end.setHours(23, 59, 59, 999);
                    break;
            }
            
            return { start, end };
        };

        const isInCurrentPeriod = (dateString) => {
            try {
                if (!dateString) return false;
                
                // Normalizar a data da transação para formato YYYY-MM-DD
                let transactionDateStr;
                if (dateString.includes('T')) {
                    transactionDateStr = dateString.split('T')[0];
                } else {
                    transactionDateStr = dateString;
                }
                
                // Para período personalizado, usar comparação de strings
                if (currentPeriod === 'custom' && customStartDate && customEndDate) {
                    return transactionDateStr >= customStartDate && transactionDateStr <= customEndDate;
                }
                
                // Para filtro "hoje", comparar diretamente com data de hoje
                if (currentPeriod === 'today') {
                    const todayStr = Utils.getTodayString();
                    return transactionDateStr === todayStr;
                }
                
                // Para outros períodos, usar comparação de datas
                const { start, end } = getPeriodRange();
                const startStr = start.toISOString().split('T')[0];
                const endStr = end.toISOString().split('T')[0];
                
                // Usar comparação de strings que é mais confiável para datas
                const result = transactionDateStr >= startStr && transactionDateStr <= endStr;
                
                return result;
            } catch (e) {
                console.error('Error in isInCurrentPeriod:', e, dateString);
                return false;
            }
        };

        const getFilteredTransactions = () => {
            return transactions.filter(transaction => {
                const matchesPeriod = isInCurrentPeriod(transaction.date);
                const matchesCategory = currentCategory === 'all' || transaction.categoryId === currentCategory;
                return matchesPeriod && matchesCategory;
            });
        };

        const getCategoryById = (id) => {
            // Procurar em ambas as listas de categorias
            const allCategories = [...expenseCategories, ...incomeCategories];
            return allCategories.find(cat => cat.id === id) || { name: 'Outros', icon: 'bx-dots-horizontal', color: '#6B7280' };
        };

        // Render functions
        const renderSummary = () => {
            const filteredTransactions = getFilteredTransactions();
            
            // Update title based on period
            if (summaryTitle) {
                let title = 'Resumo ';
                switch (currentPeriod) {
                    case 'today':
                        title += 'de Hoje';
                        break;
                    case 'week':
                        title += 'da Semana';
                        break;
                    case 'month':
                    default:
                        title += `de ${getCurrentMonthYear()}`;
                        break;
                }
                summaryTitle.textContent = title;
            }
            
            const totalIncome = filteredTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
                
            const totalExpense = filteredTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
                
            const balance = totalIncome - totalExpense;
            
            if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(totalIncome);
            if (totalExpenseEl) totalExpenseEl.textContent = formatCurrency(totalExpense);
            if (balanceEl) {
                balanceEl.textContent = formatCurrency(balance);
                balanceEl.parentElement.className = `finance-summary-item balance ${balance >= 0 ? 'income' : 'expense'}`;
            }
            
            // Progress bar (gastos vs receitas)
            if (progressFill && progressText) {
                const percentage = totalIncome > 0 ? Math.min(100, (totalExpense / totalIncome) * 100) : 0;
                progressFill.style.width = `${percentage}%`;
                
                let progressMessage;
                if (totalIncome === 0) {
                    progressMessage = "Adicione receitas para ver sua análise";
                } else if (percentage <= 50) {
                    progressMessage = `Você está gastando ${Math.round(percentage)}% das suas receitas`;
                } else if (percentage <= 80) {
                    progressMessage = `Cuidado! Você está gastando ${Math.round(percentage)}% das suas receitas`;
                } else if (percentage < 100) {
                    progressMessage = `Atenção! Você está gastando ${Math.round(percentage)}% das suas receitas`;
                } else {
                    progressMessage = `Alerta! Seus gastos estão ${Math.round(percentage - 100)}% acima das receitas`;
                }
                
                progressText.textContent = progressMessage;
            }
        };



        const renderCategoryFilterGrid = () => {
            if (!categoryFilterGrid) return;
            
            categoryFilterGrid.innerHTML = `
                <button type="button" class="finance-category-btn ${currentCategory === 'all' ? 'active' : ''}" data-category="all">
                    <i class='bx bx-category finance-category-icon'></i>
                    <span>Todas</span>
                </button>
                ${[...expenseCategories, ...incomeCategories].map(category => `
                    <button type="button" class="finance-category-btn ${currentCategory === category.id ? 'active' : ''}" data-category="${category.id}">
                        <i class='bx ${category.icon} finance-category-icon'></i>
                        <span>${category.name}</span>
                    </button>
                `).join('')}
            `;
        };

        const renderTransactions = () => {
            if (!transactionsList) return;
            
            const filteredTransactions = getFilteredTransactions();
            
            if (filteredTransactions.length === 0) {
                transactionsList.innerHTML = `
                    <div class="empty-state">
                        <h4>Nenhuma transação encontrada</h4>
                        <p>Adicione sua primeira transação para começar a acompanhar suas finanças.</p>
                    </div>
                `;
                return;
            }
            
            // Group by date
            const groupedByDate = {};
            filteredTransactions.forEach(transaction => {
                const dateKey = transaction.date;
                if (!groupedByDate[dateKey]) {
                    groupedByDate[dateKey] = [];
                }
                groupedByDate[dateKey].push(transaction);
            });
            
            // Sort dates descending
            const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));
            
            const html = sortedDates.map(date => {
                const dayTransactions = groupedByDate[date].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
                
                return `
                    <div class="finance-date-group">
                        <h4 class="finance-date-header">${formatDate(date)}</h4>
                        ${dayTransactions.map(transaction => {
                            const category = getCategoryById(transaction.categoryId);
                            return `
                                <li class="finance-transaction-item" data-id="${transaction.id}">
                                    <div class="finance-transaction-left">
                                        <div class="finance-transaction-icon ${transaction.type}">
                                            <i class='bx ${category.icon}'></i>
                                        </div>
                                        <div class="finance-transaction-info">
                                            <div class="finance-transaction-category">${category.name}</div>
                                            ${transaction.description ? `<div class="finance-transaction-description">${Utils.escapeHTML(transaction.description)}</div>` : ''}
                                        </div>
                                    </div>
                                    <div class="finance-transaction-amount ${transaction.type}">
                                        ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(Math.abs(parseFloat(transaction.amount) || 0))}
                                    </div>
                                </li>
                            `;
                        }).join('')}
                    </div>
                `;
            }).join('');
            
            transactionsList.innerHTML = html;
        };

        const render = () => {
            renderSummary();
            renderCategories();
            renderCategoryFilterGrid();
            renderTransactions();
        };

        // Modal functions (openPeriodModal e closePeriodModal removidas - usando modal unificado)

        const openCategoryModal = () => {
            if (!categoryModal) return;
            renderCategoryFilterGrid();
            document.body.classList.add('modal-open'); categoryModal.classList.remove('hidden');
        };

        const closeCategoryModal = () => {
            if (!categoryModal) return;
            document.body.classList.remove('modal-open'); categoryModal.classList.add('hidden');
        };

        const clearCategoryFilter = () => {
            currentCategory = 'all';
            Utils.saveToLocalStorage('finance_category', currentCategory);
            renderCategoryFilterGrid();
            render();
        };

        // Transactions filter modal functions
        const transactionsFilterModal = document.getElementById('transactions-filter-modal');
        const closeTransactionsFilterBtn = document.getElementById('close-transactions-filter-btn');
        const closeTransactionsFilterFooterBtn = document.getElementById('close-transactions-filter-footer-btn');
        const clearTransactionsFilterBtn = document.getElementById('clear-transactions-filter-btn');
        const transactionsPeriodChips = document.getElementById('transactions-period-chips');
        const transactionsCategoryFilterGrid = document.getElementById('transactions-category-filter-grid');
        const transactionsStartDate = document.getElementById('transactions-start-date');
        const transactionsEndDate = document.getElementById('transactions-end-date');
        const applyTransactionsPeriodBtn = document.getElementById('apply-transactions-period-btn');

        const openTransactionsFilterModal = () => {
            if (!transactionsFilterModal) return;
            
            // Sync current filters with modal
            if (transactionsPeriodChips) {
                transactionsPeriodChips.querySelectorAll('.category-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.period === currentPeriod);
                });
            }
            
            // Load custom dates if they exist
            if (customStartDate && transactionsStartDate) transactionsStartDate.value = customStartDate;
            if (customEndDate && transactionsEndDate) transactionsEndDate.value = customEndDate;
            
            renderTransactionsCategoryFilterGrid();
            document.body.classList.add('modal-open');
            transactionsFilterModal.classList.remove('hidden');
        };

        const closeTransactionsFilterModal = () => {
            if (!transactionsFilterModal) return;
            document.body.classList.remove('modal-open');
            transactionsFilterModal.classList.add('hidden');
        };

        const renderTransactionsCategoryFilterGrid = () => {
            if (!transactionsCategoryFilterGrid) return;
            
            const allCategories = [...expenseCategories, ...incomeCategories];
            
            transactionsCategoryFilterGrid.innerHTML = allCategories.map(category => `
                <button class="finance-category-btn ${currentCategory === category.id ? 'active' : ''}" data-category="${category.id}">
                    <i class='bx ${category.icon}' style="color: ${category.color}"></i>
                    <span>${category.name}</span>
                </button>
            `).join('') + `
                <button class="finance-category-btn ${currentCategory === 'all' ? 'active' : ''}" data-category="all">
                    <i class='bx bx-list-ul' style="color: #6B7280"></i>
                    <span>Todas</span>
                </button>
            `;
        };

        const openTransactionModal = (transaction = null) => {
            if (!transactionModal) return;
            
            editingTransaction = transaction;
            
            // Reset form
            transactionForm.reset();
            
            // Set today as default date
            if (transactionDate) {
                transactionDate.value = Utils.getTodayString();
            }
            
            if (transaction) {
                // Edit mode
                currentTransactionType = transaction.type;
                const titleText = transaction.type === 'income' ? 'Editar Receita' : 'Editar Despesa';
                document.getElementById('transaction-modal-title').textContent = titleText;
                deleteTransactionBtn.classList.remove('hidden');
                
                // Fill form with transaction data
                if (transactionAmount) transactionAmount.value = transaction.amount;
                if (transactionDate) transactionDate.value = transaction.date;
                if (transactionDescription) transactionDescription.value = transaction.description || '';
                
                // Renderizar categorias corretas para o tipo da transação
                renderCategories(transaction.type);
                
                // Set category in selector
                const category = getCategoryById(transaction.categoryId);
                if (category) {
                    updateCategorySelector(category);
                }
            } else {
                // Create mode - título será definido pelos botões específicos
                deleteTransactionBtn.classList.add('hidden');
                
                // Renderizar categorias baseadas no tipo atual
                renderCategories(currentTransactionType);
                
                // Reset category selector
                resetCategorySelector();
            }
            
            document.body.classList.add('modal-open');
            transactionModal.classList.remove('hidden');
            // Removido foco automático que causava deslocamento do modal
            // if (transactionAmount) transactionAmount.focus();
        };

        const closeTransactionModal = () => {
            if (!transactionModal) return;
            document.body.classList.remove('modal-open');
            transactionModal.classList.add('hidden');
            transactionCategoryPicker?.classList.add('hidden');
            transactionCategoryBtn?.classList.remove('open');
            resetCategorySelector();
            editingTransaction = null;
        };

        const saveTransaction = () => {
            const type = currentTransactionType;
            const amount = parseFloat(transactionAmount.value);
            const date = transactionDate.value;
            const description = transactionDescription.value.trim();
            const categoryId = selectedCategory?.id;
            
            if (!amount || amount <= 0 || !date || !categoryId) {
                Utils.showNotice('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            const transactionData = {
                id: editingTransaction ? editingTransaction.id : Date.now(),
                type,
                amount,
                date,
                description: description || null,
                categoryId,
                createdAt: editingTransaction ? editingTransaction.createdAt : new Date().toISOString()
            };
            
            if (editingTransaction) {
                // Update existing transaction
                const index = transactions.findIndex(t => t.id === editingTransaction.id);
                if (index !== -1) {
                    transactions[index] = transactionData;
                }
            } else {
                // Add new transaction
                transactions.push(transactionData);
            }
            
            Utils.saveToLocalStorage('finance_transactions', transactions);
            closeTransactionModal();
            render();
        };

        const deleteTransaction = () => {
            if (!editingTransaction) return;
            
            Utils.showNotice('Tem certeza que deseja excluir esta transação?', 'Confirmar Exclusão', () => {
                transactions = transactions.filter(t => t.id !== editingTransaction.id);
                Utils.saveToLocalStorage('finance_transactions', transactions);
                closeTransactionModal();
                render();
            });
        };

        // Event handlers
        const init = () => {
            if (!financeSection) return; // Finance tab não existe
            
            // Modal events - Transaction
            if (addTransactionBtn) {
                addTransactionBtn.addEventListener('click', () => openTransactionModal());
            }
            
            if (addIncomeBtn) {
                addIncomeBtn.addEventListener('click', () => {
                    currentTransactionType = 'income';
                    document.getElementById('transaction-modal-title').textContent = 'Nova Receita';
                    openTransactionModal();
                });
            }
            
            if (addExpenseBtn) {
                addExpenseBtn.addEventListener('click', () => {
                    currentTransactionType = 'expense';
                    document.getElementById('transaction-modal-title').textContent = 'Nova Despesa';
                    openTransactionModal();
                });
            }
            
            if (closeTransactionBtn) {
                closeTransactionBtn.addEventListener('click', closeTransactionModal);
            }
            
            if (cancelTransactionBtn) {
                cancelTransactionBtn.addEventListener('click', closeTransactionModal);
            }
            
            if (deleteTransactionBtn) {
                deleteTransactionBtn.addEventListener('click', deleteTransaction);
            }
            
            if (transactionModal) {
                transactionModal.addEventListener('click', (e) => {
                    if (e.target === transactionModal) closeTransactionModal();
                });
            }

            // Modal events - Period Filter (usando o novo modal unificado)
            if (periodFilterBtn) {
                periodFilterBtn.addEventListener('click', openTransactionsFilterModal);
            }



            // Modal events - Category Filter (removido - agora usa modal unificado)

            if (transactionsFilterBtn) {
                transactionsFilterBtn.addEventListener('click', openTransactionsFilterModal);
            }

            if (closeCategoryModalBtn) {
                closeCategoryModalBtn.addEventListener('click', closeCategoryModal);
            }

            if (closeCategoryModalFooterBtn) {
                closeCategoryModalFooterBtn.addEventListener('click', closeCategoryModal);
            }

            if (clearCategoryFilterBtn) {
                clearCategoryFilterBtn.addEventListener('click', clearCategoryFilter);
            }

            if (categoryModal) {
                categoryModal.addEventListener('click', (e) => {
                    if (e.target === categoryModal) closeCategoryModal();
                });
            }

            // Transactions filter modal events
            if (closeTransactionsFilterBtn) {
                closeTransactionsFilterBtn.addEventListener('click', closeTransactionsFilterModal);
            }

            if (closeTransactionsFilterFooterBtn) {
                closeTransactionsFilterFooterBtn.addEventListener('click', closeTransactionsFilterModal);
            }

            if (clearTransactionsFilterBtn) {
                clearTransactionsFilterBtn.addEventListener('click', () => {
                    currentPeriod = 'all';
                    currentCategory = 'all';
                    customStartDate = null;
                    customEndDate = null;
                    Utils.saveToLocalStorage('finance_period', currentPeriod);
                    Utils.saveToLocalStorage('finance_category', currentCategory);
                    Utils.saveToLocalStorage('finance_custom_start', null);
                    Utils.saveToLocalStorage('finance_custom_end', null);
                    
                    if (transactionsStartDate) transactionsStartDate.value = '';
                    if (transactionsEndDate) transactionsEndDate.value = '';
                    
                    render();
                    closeTransactionsFilterModal();
                });
            }

            if (transactionsFilterModal) {
                transactionsFilterModal.addEventListener('click', (e) => {
                    if (e.target === transactionsFilterModal) closeTransactionsFilterModal();
                });
            }

            // Tab switching in transactions filter modal
            const filterTabs = document.querySelectorAll('.filter-tab-btn');
            const filterPanels = document.querySelectorAll('.filter-tab-panel');
            
            filterTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetTab = tab.dataset.tab;
                    
                    filterTabs.forEach(t => t.classList.remove('active'));
                    filterPanels.forEach(p => p.classList.remove('active'));
                    
                    tab.classList.add('active');
                    document.getElementById(`transactions-${targetTab}-panel`).classList.add('active');
                });
            });

            // Transactions period chips
            if (transactionsPeriodChips) {
                transactionsPeriodChips.addEventListener('click', (e) => {
                    const periodBtn = e.target.closest('[data-period]');
                    if (periodBtn) {
                        currentPeriod = periodBtn.dataset.period;
                        Utils.saveToLocalStorage('finance_period', currentPeriod);
                        
                        transactionsPeriodChips.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
                        periodBtn.classList.add('active');
                        
                        render();
                        // Não fecha o modal automaticamente - usuário pode continuar configurando filtros
                    }
                });
            }

            // Transactions category filter
            if (transactionsCategoryFilterGrid) {
                transactionsCategoryFilterGrid.addEventListener('click', (e) => {
                    const categoryBtn = e.target.closest('.finance-category-btn');
                    if (categoryBtn) {
                        currentCategory = categoryBtn.dataset.category;
                        Utils.saveToLocalStorage('finance_category', currentCategory);
                        renderTransactionsCategoryFilterGrid();
                        render();
                        // Não fecha o modal automaticamente - usuário pode continuar configurando filtros
                    }
                });
            }

            // Transactions custom period
            if (applyTransactionsPeriodBtn) {
                applyTransactionsPeriodBtn.addEventListener('click', () => {
                    const startDate = transactionsStartDate?.value;
                    const endDate = transactionsEndDate?.value;
                    
                    if (startDate && endDate) {
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        
                        if (start <= end) {
                            customStartDate = startDate;
                            customEndDate = endDate;
                            currentPeriod = 'custom';
                            Utils.saveToLocalStorage('finance_period', currentPeriod);
                            Utils.saveToLocalStorage('finance_custom_start', customStartDate);
                            Utils.saveToLocalStorage('finance_custom_end', customEndDate);
                            
                            transactionsPeriodChips?.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
                            
                            render();
                            closeTransactionsFilterModal();
                        } else {
                            Utils.showNotice('A data inicial deve ser anterior ou igual à data final.');
                        }
                    } else {
                        Utils.showNotice('Por favor, selecione ambas as datas.');
                    }
                });
            }
            
            // Form events
            if (transactionForm) {
                transactionForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    saveTransaction();
                });
            }
            
            // Quick amounts
            if (quickAmounts) {
                quickAmounts.addEventListener('click', (e) => {
                    const amountBtn = e.target.closest('[data-amount]');
                    if (amountBtn && transactionAmount) {
                        transactionAmount.value = amountBtn.dataset.amount;
                        
                        // Efeito visual
                        amountBtn.style.transform = 'scale(0.95)';
                        amountBtn.style.backgroundColor = 'var(--primary-color)';
                        amountBtn.style.color = 'white';
                        
                        setTimeout(() => {
                            amountBtn.style.transform = '';
                            amountBtn.style.backgroundColor = '';
                            amountBtn.style.color = '';
                        }, 200);
                    }
                });
            }
            
            // Category selector events
            if (transactionCategoryBtn) {
                transactionCategoryBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    transactionCategoryPicker.classList.toggle('hidden');
                    transactionCategoryBtn.classList.toggle('open');
                });
            }

            if (transactionCategoryPicker) {
                transactionCategoryPicker.addEventListener('click', (e) => {
                    const categoryOption = e.target.closest('.category-option');
                    if (categoryOption) {
                        const categoryData = {
                            id: categoryOption.dataset.category,
                            name: categoryOption.querySelector('span').textContent,
                            icon: categoryOption.dataset.icon,
                            color: categoryOption.dataset.color
                        };
                        
                        updateCategorySelector(categoryData);
                        transactionCategoryPicker.classList.add('hidden');
                        transactionCategoryBtn.classList.remove('open');
                    }
                });
            }

            // Close category picker when clicking outside
            document.addEventListener('click', (e) => {
                if (!transactionCategoryBtn?.contains(e.target) && !transactionCategoryPicker?.contains(e.target)) {
                    transactionCategoryPicker?.classList.add('hidden');
                    transactionCategoryBtn?.classList.remove('open');
                }
            });
            
            // Period filters (removido - agora usa o modal unificado)
            
            // Category filter modal
            if (categoryFilterGrid) {
                categoryFilterGrid.addEventListener('click', (e) => {
                    const categoryBtn = e.target.closest('.finance-category-btn');
                    if (categoryBtn) {
                        currentCategory = categoryBtn.dataset.category;
                        Utils.saveToLocalStorage('finance_category', currentCategory);
                        renderCategoryFilterGrid();
                        render();
                        closeCategoryModal();
                    }
                });
            }
            
            // Transaction list clicks
            if (transactionsList) {
                transactionsList.addEventListener('click', (e) => {
                    const transactionItem = e.target.closest('.finance-transaction-item');
                    if (transactionItem) {
                        const transactionId = parseInt(transactionItem.dataset.id);
                        const transaction = transactions.find(t => t.id === transactionId);
                        if (transaction) {
                            openTransactionModal(transaction);
                        }
                    }
                });
            }
            
            // Custom period functionality (removido - agora usa o modal unificado)
            
            // Load saved custom dates
            customStartDate = Utils.loadFromLocalStorage('finance_custom_start', null);
            customEndDate = Utils.loadFromLocalStorage('finance_custom_end', null);
            
            render();
        };

        return { init, render };
    })();

    // --- INICIALIZAÇÃO GERAL ---
    App.init();
});