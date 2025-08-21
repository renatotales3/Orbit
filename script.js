document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS GERAIS ---
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.nav-button');
    const htmlElement = document.documentElement;

    // --- FUNÇÕES DE PERSISTÊNCIA (localStorage) ---
    const saveAppState = (key, value) => {
        localStorage.setItem(key, value);
    };

    const loadAppState = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        const savedTab = localStorage.getItem('activeTab') || 'inicio';
        switchTab(savedTab);
    };

    // --- LÓGICA PARA TROCA DE ABAS ---
    const switchTab = (targetId) => {
        const targetPage = document.getElementById(targetId);
        if (targetPage) {
            pages.forEach(page => page.classList.remove('active'));
            navButtons.forEach(btn => btn.classList.remove('active'));
            targetPage.classList.add('active');
            const activeButton = document.querySelector(`.nav-button[data-target="${targetId}"]`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
        }
    };

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            switchTab(targetId);
            saveAppState('activeTab', targetId);
        });
    });

    // --- LÓGICA PARA TROCA DE TEMA ---
    const themeToggle = document.getElementById('theme-toggle');
    const applyTheme = (theme) => {
        htmlElement.setAttribute('data-theme', theme);
    };

    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
        saveAppState('theme', newTheme);
    });

    // --- LÓGICA: GERENCIADOR DE TAREFAS (COM PERSISTÊNCIA) ---
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    const renderTasks = () => {
        taskList.innerHTML = "";
        tasks.forEach((task, index) => {
            const taskElement = createTaskElement(task.text, task.completed, index);
            taskList.appendChild(taskElement);
        });
    };

    const createTaskElement = (taskText, isCompleted, index) => {
        const li = document.createElement('li');
        li.className = `task-item ${isCompleted ? 'completed' : ''}`;
        li.dataset.index = index;
        const span = document.createElement('span');
        span.textContent = taskText;
        const divButtons = document.createElement('div');
        divButtons.className = 'task-item-buttons';
        const completeBtn = document.createElement('button');
        completeBtn.className = 'complete-btn';
        completeBtn.innerHTML = `<i class='bx bx-check-circle'></i>`;
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = `<i class='bx bxs-trash'></i>`;
        divButtons.appendChild(completeBtn);
        divButtons.appendChild(deleteBtn);
        li.appendChild(span);
        li.appendChild(divButtons);
        return li;
    };

    const addTask = () => {
        const taskText = taskInput.value.trim();
        if (taskText === "") { return; }
        tasks.push({ text: taskText, completed: false });
        saveTasks();
        renderTasks();
        taskInput.value = "";
    };

    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') addTask(); });

    taskList.addEventListener('click', (event) => {
        const clickedElement = event.target.closest('.task-item');
        if (!clickedElement) return;
        const index = parseInt(clickedElement.dataset.index);
        if (event.target.closest('.complete-btn')) {
            tasks[index].completed = !tasks[index].completed;
        }
        if (event.target.closest('.delete-btn')) {
            tasks.splice(index, 1);
        }
        saveTasks();
        renderTasks();
    });

    // --- LÓGICA: POMODORO TIMER (PERSISTÊNCIA SIMPLIFICADA) ---
    const timerDisplay = document.getElementById('timer-display');
    const timerStatus = document.getElementById('timer-status');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');

    const FOCUS_TIME = 25 * 60;
    const SHORT_BREAK_TIME = 5 * 60;
    const LONG_BREAK_TIME = 15 * 60;

    let timer;
    let totalSeconds;
    let isPaused = true;
    let currentCycle = localStorage.getItem('pomodoro_currentCycle') || 'focus';
    let pomodoroCount = parseInt(localStorage.getItem('pomodoro_pomodoroCount')) || 0;

    const updateDisplay = () => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.title = `${timerDisplay.textContent} - Life OS`;
    };

    const switchCycle = () => {
        if (currentCycle === 'focus') {
            pomodoroCount++;
            localStorage.setItem('pomodoro_pomodoroCount', pomodoroCount);
            currentCycle = (pomodoroCount % 4 === 0) ? 'longBreak' : 'shortBreak';
        } else {
            currentCycle = 'focus';
        }
        localStorage.setItem('pomodoro_currentCycle', currentCycle);
        setTimerForCurrentCycle();
        updateDisplay();
    };

    const countdown = () => {
        if (isPaused) return;
        if (totalSeconds > 0) {
            totalSeconds--;
            updateDisplay();
        } else {
            clearInterval(timer);
            isPaused = true;
            switchCycle();
        }
    };

    const startTimer = () => {
        if (isPaused) {
            isPaused = false;
            timer = setInterval(countdown, 1000);
        }
    };

    const pauseTimer = () => {
        isPaused = true;
        clearInterval(timer);
    };

    const setTimerForCurrentCycle = () => {
        pauseTimer();
        switch (currentCycle) {
            case 'focus':
                totalSeconds = FOCUS_TIME;
                timerStatus.textContent = "Hora de Focar!";
                break;
            case 'shortBreak':
                totalSeconds = SHORT_BREAK_TIME;
                timerStatus.textContent = "Pausa Curta";
                break;
            case 'longBreak':
                totalSeconds = LONG_BREAK_TIME;
                timerStatus.textContent = "Pausa Longa";
                break;
        }
        updateDisplay();
    };

    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', setTimerForCurrentCycle);

    // --- INICIALIZAÇÃO DO APLICATIVO ---
    loadAppState();
    renderTasks();
    setTimerForCurrentCycle(); // Função que inicializa o estado do Pomodoro
});