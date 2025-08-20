document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const appContent = document.getElementById('app-content');
    const navBar = document.getElementById('bottom-navbar');
    const modalContainer = document.getElementById('modal-container');

    // --- ESTADO DA APLICAÇÃO ---
    let state = {
        tasks: [],
        notes: [],
        calendarEvents: []
    };

    // --- PERSISTÊNCIA (localStorage) ---
    function saveState() {
        localStorage.setItem('lifeOSState', JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem('lifeOSState');
        if (savedState) {
            state = JSON.parse(savedState);
        }
    }

    // --- RENDERIZAÇÃO ---
    function render() {
        const currentPage = window.location.hash.replace('#', '') || 'home';
        renderPage(currentPage);
    }

    function renderPage(page) {
        appContent.innerHTML = '';
        const oldFab = document.querySelector('.fab');
        if (oldFab) oldFab.remove();

        const pageRenderer = {
            'tasks': renderTasksPage,
            'notes': renderNotesPage,
            'calendar': renderCalendarPage,
        }[page];

        if (pageRenderer) {
            pageRenderer();
        } else if (routes[page]) {
            appContent.innerHTML = routes[page];
        } else {
            appContent.innerHTML = '<h1>Página não encontrada</h1>';
        }
        updateActiveNav(page);
    }
    
    function createFab(onClick) {
        const fab = document.createElement('button');
        fab.className = 'fab';
        fab.textContent = '+';
        fab.onclick = onClick;
        document.body.appendChild(fab);
    }

    // --- MÓDULO DE TAREFAS ---
    function renderTasksPage() {
        const tasksHTML = `
            <h1 class="page-title">✅ Tarefas & Projetos</h1>
            <ul class="task-list" id="task-list">
                ${state.tasks.map(task => `
                    <li class="task-item card ${task.completed ? 'completed' : ''}" data-id="${task.id}" draggable="true">
                        <div class="task-info">
                            <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                            <span class="task-title">${task.title}</span>
                        </div>
                        <span class="task-priority p${task.priority}">P${task.priority}</span>
                    </li>
                `).join('') || '<p class="card-content">Nenhuma tarefa encontrada. Adicione uma nova!</p>'}
            </ul>`;
        appContent.innerHTML = tasksHTML;
        createFab(() => openTaskModal());
        
        const taskList = document.getElementById('task-list');
        taskList.addEventListener('change', (e) => {
            if (e.target.matches('.task-checkbox')) {
                const task = state.tasks.find(t => t.id === e.target.dataset.id);
                task.completed = e.target.checked;
                saveState();
                render();
            }
        });
        
        // Drag & Drop
        let draggedItemId = null;
        taskList.addEventListener('dragstart', (e) => {
            if (e.target.matches('.task-item')) {
                draggedItemId = e.target.dataset.id;
                setTimeout(() => e.target.classList.add('dragging'), 0);
            }
        });
        taskList.addEventListener('dragend', (e) => e.target.classList.remove('dragging'));
        taskList.addEventListener('dragover', (e) => e.preventDefault());
        taskList.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropTarget = e.target.closest('.task-item');
            if (dropTarget && draggedItemId !== dropTarget.dataset.id) {
                const draggedIndex = state.tasks.findIndex(t => t.id === draggedItemId);
                const targetIndex = state.tasks.findIndex(t => t.id === dropTarget.dataset.id);
                const [draggedItem] = state.tasks.splice(draggedIndex, 1);
                state.tasks.splice(targetIndex, 0, draggedItem);
                saveState();
                render();
            }
        });
    }

    function openTaskModal(task = null) {
        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header"><h2 class="modal-title">${task ? 'Editar Tarefa' : 'Nova Tarefa'}</h2><button class="modal-close-btn">&times;</button></div>
                    <form id="task-form">
                        <input type="hidden" id="taskId" value="${task ? task.id : ''}">
                        <div class="form-group"><label for="taskTitle">Título</label><input type="text" id="taskTitle" class="form-control" value="${task ? task.title : ''}" required></div>
                        <div class="form-group"><label for="taskDeadline">Prazo (Opcional)</label><input type="date" id="taskDeadline" class="form-control" value="${task ? task.deadline : ''}"></div>
                        <div class="form-group"><label for="taskPriority">Prioridade</label>
                            <select id="taskPriority" class="form-control">
                                <option value="1" ${task && task.priority == 1 ? 'selected' : ''}>P1 - Urgente</option>
                                <option value="2" ${task && task.priority == 2 ? 'selected' : ''}>P2 - Alta</option>
                                <option value="3" ${(task && task.priority == 3) || !task ? 'selected' : ''}>P3 - Média</option>
                                <option value="4" ${task && task.priority == 4 ? 'selected' : ''}>P4 - Baixa</option>
                            </select>
                        </div>
                        <div class="modal-footer"><button type="button" class="btn btn-secondary" id="cancel-btn">Cancelar</button><button type="submit" class="btn btn-primary">Salvar</button></div>
                    </form>
                </div>
            </div>`;
        modalContainer.innerHTML = modalHTML;
        
        modalContainer.querySelector('#task-form').addEventListener('submit', handleTaskSave);
        modalContainer.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        modalContainer.querySelector('#cancel-btn').addEventListener('click', closeModal);
    }
    
    function handleTaskSave(e) {
        e.preventDefault();
        const id = document.getElementById('taskId').value;
        const taskData = {
            title: document.getElementById('taskTitle').value,
            deadline: document.getElementById('taskDeadline').value,
            priority: document.getElementById('taskPriority').value
        };

        if (id) {
            const task = state.tasks.find(t => t.id === id);
            Object.assign(task, taskData);
        } else {
            const newTask = { id: `task-${Date.now()}`, completed: false, ...taskData };
            state.tasks.push(newTask);
        }
        saveState();
        render();
        closeModal();
    }

    // --- MÓDULO DE NOTAS ---
    function renderNotesPage() {
        const notesHTML = `
            <h1 class="page-title">📓 Notas & Ideias</h1>
            <div class="notes-grid">
                ${state.notes.map(note => `
                    <div class="note-card card" data-id="${note.id}">
                        <h3 class="card-title">${note.title}</h3>
                        <p class="note-card-content card-content">${note.content.substring(0, 150)}${note.content.length > 150 ? '...' : ''}</p>
                    </div>
                `).join('') || '<p class="card-content">Nenhuma nota encontrada. Adicione uma nova!</p>'}
            </div>`;
        appContent.innerHTML = notesHTML;
        createFab(() => openNoteModal());
    }

    function openNoteModal(note = null) {
        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header"><h2 class="modal-title">${note ? 'Editar Nota' : 'Nova Nota'}</h2><button class="modal-close-btn">&times;</button></div>
                    <form id="note-form">
                        <input type="hidden" id="noteId" value="${note ? note.id : ''}">
                        <div class="form-group"><label for="noteTitle">Título</label><input type="text" id="noteTitle" class="form-control" value="${note ? note.title : ''}" required></div>
                        <div class="form-group"><label for="noteContent">Conteúdo</label><textarea id="noteContent" class="form-control">${note ? note.content : ''}</textarea></div>
                        <div class="modal-footer"><button type="button" class="btn btn-secondary" id="cancel-btn">Cancelar</button><button type="submit" class="btn btn-primary">Salvar</button></div>
                    </form>
                </div>
            </div>`;
        modalContainer.innerHTML = modalHTML;
        
        modalContainer.querySelector('#note-form').addEventListener('submit', handleNoteSave);
        modalContainer.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        modalContainer.querySelector('#cancel-btn').addEventListener('click', closeModal);
    }

    function handleNoteSave(e) {
        e.preventDefault();
        const id = document.getElementById('noteId').value;
        const noteData = {
            title: document.getElementById('noteTitle').value,
            content: document.getElementById('noteContent').value
        };

        if (id) {
            const note = state.notes.find(n => n.id === id);
            Object.assign(note, noteData);
        } else {
            const newNote = { id: `note-${Date.now()}`, ...noteData };
            state.notes.push(newNote);
        }
        saveState();
        render();
        closeModal();
    }

    // --- MÓDULO DE CALENDÁRIO ---
    function renderCalendarPage() {
        const tasksWithDeadline = state.tasks
            .filter(task => task.deadline)
            .map(task => ({
                date: task.deadline,
                title: task.title,
                source: 'Tarefas'
            }));
            
        // Futuramente, podemos unir com state.calendarEvents
        const allEvents = [...tasksWithDeadline].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

        const calendarHTML = `
            <h1 class="page-title">📅 Calendário</h1>
            <ul class="event-list">
                ${allEvents.map(event => {
                    const eventDate = new Date(event.date + 'T00:00:00-03:00'); // Ajusta para fuso horário local
                    const day = eventDate.getDate();
                    const month = months[eventDate.getMonth()];
                    return `
                    <li class="event-item card">
                        <div class="event-date">
                            <span class="event-day">${day}</span>
                            <span class="event-month">${month}</span>
                        </div>
                        <div class="event-details">
                            <p class="event-title">${event.title}</p>
                            <span class="event-source">${event.source}</span>
                        </div>
                    </li>
                `}).join('') || '<p class="card-content">Nenhum evento ou tarefa com prazo encontrados.</p>'}
            </ul>`;
        appContent.innerHTML = calendarHTML;
    }

    // --- MODAL & NAVEGAÇÃO ---
    function closeModal() {
        modalContainer.innerHTML = '';
    }
    
    const routes = {
        'home': '<h1>🏠 Início</h1><div class="card"><div class="card-title">Bem-vindo ao LifeOS</div><div class="card-content">Seu dashboard central será construído aqui.</div></div>',
        'settings': '<h1>⚙️ Ajustes</h1><div class="card"><div class="card-title">Tema</div><div class="card-content">Opções para alterar o tema (Light/Dark/Glass) estarão aqui.</div></div>'
    };

    function updateActiveNav(page) {
        navBar.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
    }

    function navigate(e) {
        const navItem = e.target.closest('.nav-item');
        if (navItem) {
            e.preventDefault();
            window.location.hash = navItem.dataset.page;
        }
    }

    // --- INICIALIZAÇÃO ---
    function init() {
        loadState();
        navBar.addEventListener('click', navigate);
        window.addEventListener('hashchange', render);
        render(); // Renderiza a página inicial
    }

    init();
});
