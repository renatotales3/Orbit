document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA PARA TROCA DE ABAS ---
    const navButtons = document.querySelectorAll('.nav-button');
    const pages = document.querySelectorAll('.page');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const targetPage = document.getElementById(targetId);
            navButtons.forEach(btn => btn.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active'));
            button.classList.add('active');
            targetPage.classList.add('active');
        });
    });

    // --- LÓGICA PARA TROCA DE TEMA ---
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    const applyTheme = (theme) => {
        htmlElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    };
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });

    // --- LÓGICA: GERENCIADOR DE TAREFAS (TO-DO LIST) ---
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const createTaskElement = (taskText) => {
        const li = document.createElement('li'); li.className = 'task-item';
        const span = document.createElement('span'); span.textContent = taskText;
        const divButtons = document.createElement('div'); divButtons.className = 'task-item-buttons';
        const completeBtn = document.createElement('button'); completeBtn.className = 'complete-btn'; completeBtn.innerHTML = `<i class='bx bx-check-circle'></i>`;
        const deleteBtn = document.createElement('button'); deleteBtn.className = 'delete-btn'; deleteBtn.innerHTML = `<i class='bx bxs-trash'></i>`;
        divButtons.appendChild(completeBtn); divButtons.appendChild(deleteBtn);
        li.appendChild(span); li.appendChild(divButtons);
        return li;
    };
    const addTask = () => {
        const taskText = taskInput.value.trim();
        if (taskText === "") { alert("Por favor, digite uma tarefa."); return; }
        const taskElement = createTaskElement(taskText);
        taskList.appendChild(taskElement);
        taskInput.value = "";
    };
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') { addTask(); } });
    taskList.addEventListener('click', (event) => {
        const clickedElement = event.target;
        if (clickedElement.closest('.complete-btn')) { clickedElement.closest('.task-item').classList.toggle('completed'); }
        if (clickedElement.closest('.delete-btn')) {
            const taskItem = clickedElement.closest('.task-item');
            taskItem.style.opacity = '0';
            setTimeout(() => { taskItem.remove(); }, 300);
        }
    });

    // --- NOVA LÓGICA: POMODORO TIMER ---
    const timerDisplay = document.getElementById('timer-display');
    const timerStatus = document.getElementById('timer-status');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');

    // Constantes de tempo em minutos
    const FOCUS_TIME = 25;
    const SHORT_BREAK_TIME = 5;
    const LONG_BREAK_TIME = 15;

    let timer; // Variável para o setInterval
    let totalSeconds;
    let isPaused = true;
    let currentCycle = 'focus'; // 'focus', 'shortBreak', 'longBreak'
    let pomodoroCount = 0;

    // Função para atualizar o display do timer
    const updateDisplay = () => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Função para trocar de ciclo
    const switchCycle = () => {
        if (currentCycle === 'focus') {
            pomodoroCount++;
            if (pomodoroCount % 4 === 0) {
                currentCycle = 'longBreak';
                totalSeconds = LONG_BREAK_TIME * 60;
                timerStatus.textContent = "Pausa Longa";
            } else {
                currentCycle = 'shortBreak';
                totalSeconds = SHORT_BREAK_TIME * 60;
                timerStatus.textContent = "Pausa Curta";
            }
        } else {
            currentCycle = 'focus';
            totalSeconds = FOCUS_TIME * 60;
            timerStatus.textContent = "Hora de Focar!";
        }
        updateDisplay();
    };

    // Função principal do timer que roda a cada segundo
    const countdown = () => {
        if (isPaused) return;

        if (totalSeconds > 0) {
            totalSeconds--;
            updateDisplay();
        } else {
            clearInterval(timer);
            isPaused = true;
            // Alerta sonoro (opcional, requer um arquivo de áudio)
            // new Audio('notification.mp3').play();
            switchCycle();
        }
    };

    // Funções dos botões
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

    const resetTimer = () => {
        pauseTimer(); // Para o timer
        // Reseta para o início do ciclo atual
        if (currentCycle === 'focus') totalSeconds = FOCUS_TIME * 60;
        else if (currentCycle === 'shortBreak') totalSeconds = SHORT_BREAK_TIME * 60;
        else totalSeconds = LONG_BREAK_TIME * 60;
        updateDisplay();
    };
    
    // Configuração inicial do timer
    const initializeTimer = () => {
        totalSeconds = FOCUS_TIME * 60;
        updateDisplay();
    };
    
    // Adiciona os eventos aos botões
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);

    // Inicia o estado visual do timer ao carregar a página
    initializeTimer();
});