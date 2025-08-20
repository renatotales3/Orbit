// Adiciona um listener global para capturar erros não tratados
window.addEventListener('error', function (event) {
    console.error('ERRO GLOBAL CAPTURADO:', event.error);
    document.body.innerHTML = `<div style="padding: 24px; color: white;">Ocorreu um erro crítico na aplicação. Por favor, recarregue a página. Detalhes do erro foram enviados ao console.</div>`;
});

document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DO DOM ---
    const appContent = document.getElementById('app-content');
    const navBar = document.getElementById('bottom-navbar');
    const modalContainer = document.getElementById('modal-container');

    if (!appContent || !navBar || !modalContainer) {
        console.error('Elementos essenciais do DOM não foram encontrados.');
        return;
    }

    // --- ESTADO DA APLICAÇÃO ---
    let state = {};

    // --- PERSISTÊNCIA ROBUSTA ---
    function saveState() {
        try {
            localStorage.setItem('lifeOSState', JSON.stringify(state));
        } catch (e) {
            console.error("Erro ao salvar o estado:", e);
        }
    }

    function loadState() {
        let savedState = null;
        try {
            savedState = localStorage.getItem('lifeOSState');
        } catch (e) {
            console.error("Erro ao ler o localStorage:", e);
        }

        const defaultState = {
            tasks: [],
            notes: [],
            calendarEvents: []
        };
        
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                state.tasks = Array.isArray(parsedState.tasks) ? parsedState.tasks : [];
                state.notes = Array.isArray(parsedState.notes) ? parsedState.notes : [];
                state.calendarEvents = Array.isArray(parsedState.calendarEvents) ? parsedState.calendarEvents : [];
            } catch (e) {
                console.error("Erro ao interpretar o estado salvo, usando padrão.", e);
                state = defaultState;
            }
        } else {
            state = defaultState;
        }
    }

    // --- ROTEAMENTO E RENDERIZAÇÃO ---
    const routes = {
        'home': renderHomePage,
        'tasks': renderTasksPage,
        'calendar': renderCalendarPage,
        'notes': renderNotesPage,
        'settings': renderSettingsPage
    };

    function render() {
        const page = window.location.hash.replace('#', '') || 'home';
        const renderer = routes[page] || routes['home'];
        
        const oldFab = document.querySelector('.fab');
        if (oldFab) oldFab.remove();

        appContent.innerHTML = ''; // Limpa a tela antes de renderizar
        renderer(); // Executa a função de renderização da página
        updateActiveNav(page);
    }
    
    function updateActiveNav(page) {
        navBar.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page || '');
        });
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO DE PÁGINA ---
    function renderHomePage() {
        appContent.innerHTML = `
            <h1 class="page-title">Início</h1>
            <div class="card"><div class="card-title">Bem-vindo ao LifeOS</div><div class="card-content">Este é o seu espaço. Em breve, este painel será preenchido com insights sobre sua vida.</div></div>
        `;
    }

    function renderTasksPage() {
        appContent.innerHTML = `
            <h1 class="page-title">Tarefas & Projetos</h1>
            <ul class="task-list" id="task-list">
                ${state.tasks.map(task => `
                    <li class="task-item card ${task.completed ? 'completed' : ''}" data-id="${task.id}" draggable="true">
                        <div class="task-info">
                            <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                            <span class="task-title">${task.title}</span>
                        </div>
                        <span class="task-priority p${task.priority}">P${task.priority}</span>
                    </li>
                `).join('')}
            </ul>
            ${state.tasks.length === 0 ? '<div class="card"><p class="card-content">Nenhuma tarefa encontrada. Adicione uma nova!</p></div>' : ''}
        `;
        createFab(() => openTaskModal());
        attachTaskListeners();
    }
    
    function renderCalendarPage() {
        const tasksWithDeadline = state.tasks.filter(task => task.deadline);
        const allEvents = [...tasksWithDeadline, ...state.calendarEvents].sort((a, b) => new Date(a.date || a.deadline) - new Date(b.date || b.deadline));
        const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
        appContent.innerHTML = `
            <h1 class="page-title">Calendário</h1>
            <ul class="event-list">
                ${allEvents.map(event => {
                    const eventDate = new Date((event.date || event.deadline) + 'T12:00:00Z');
                    const day = eventDate.getUTCDate();
                    const month = months[eventDate.getUTCMonth()];
                    const source = event.deadline ? 'Tarefas' : 'Calendário';
                    return `
                    <li class="event-item card">
                        <div class="event-date"><span class="event-day">${day}</span><span class="event-month">${month}</span></div>
                        <div class="event-details"><p class="event-title">${event.title}</p><span class="event-source">${source}</span></div>
                    </li>
                    `;
                }).join('')}
            </ul>
            ${allEvents.length === 0 ? '<div class="card"><p class="card-content">Nenhum evento ou tarefa com prazo encontrados.</p></div>' : ''}
        `;
    }

    function renderNotesPage() {
        appContent.innerHTML = `
            <h1 class="page-title">Notas & Ideias</h1>
            <div class="notes-grid">
                ${state.notes.map(note => `
                    <div class="note-card card" data-id="${note.id}">
                        <h3 class="card-title">${note.title}</h3>
                        <p class="note-card-content card-content">${note.content.substring(0, 150)}${note.content.length > 150 ? '...' : ''}</p>
                    </div>
                `).join('')}
            </div>
            ${state.notes.length === 0 ? '<div class="card"><p class="card-content">Nenhuma nota encontrada. Adicione uma nova!</p></div>' : ''}
        `;
        createFab(() => openNoteModal());
    }

    function renderSettingsPage() {
        appContent.innerHTML = `
            <h1 class="page-title">Ajustes</h1>
            <div class="card"><div class="card-title">Em Breve</div><div class="card-content">Configurações de tema, importação/exportação e outras opções aparecerão aqui.</div></div>
        `;
    }

    // --- LÓGICA DE EVENTOS & MODAIS ---
    function createFab(onClick) {
        const fab = document.createElement('button');
        fab.className = 'fab';
        fab.textContent = '+';
        fab.onclick = onClick;
        document.body.appendChild(fab);
    }
    
    function closeModal() {
        modalContainer.innerHTML = '';
    }
    
    // Anexa listeners para a lista de tarefas
    function attachTaskListeners() {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;

        taskList.addEventListener('click', (e) => {
            if (e.target.matches('.task-checkbox')) {
                const task = state.tasks.find(t => t.id === e.target.dataset.id);
                if (task) {
                    task.completed = e.target.checked;
                    saveState();
                    render();
                }
            }
        });
        
        let draggedItemId = null;
        taskList.addEventListener('dragstart', (e) => {
            if (e.target.matches('.task-item')) {
                draggedItemId = e.target.dataset.id;
                setTimeout(() => e.target.classList.add('dragging'), 0);
            }
        });
        taskList.addEventListener('dragend', (e) => {
            if(e.target.matches('.task-item')) e.target.classList.remove('dragging')
        });
        taskList.addEventListener('dragover', (e) => e.preventDefault());
        taskList.addEventListener('drop', (e) => {
            e.preventDefault();
            const dropTarget = e.target.closest('.task-item');
            if (dropTarget && draggedItemId !== dropTarget.dataset.id) {
                const draggedIndex = state.tasks.findIndex(t => t.id === draggedItemId);
                const targetIndex = state.tasks.findIndex(t => t.id === dropTarget.dataset.id);
                if(draggedIndex === -1 || targetIndex === -1) return;
                const [draggedItem] = state.tasks.splice(draggedIndex, 1);
                state.tasks.splice(targetIndex, 0, draggedItem);
                saveState();
                render();
            }
        });
    }

    // Modal de Tarefas
    function openTaskModal(task = null) {
        modalContainer.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <form id="task-form">
                        <div class="modal-header"><h2 class="modal-title">${task ? 'Editar Tarefa' : 'Nova Tarefa'}</h2><button type="button" class="modal-close-btn">&times;</button></div>
                        <input type="hidden" id="taskId" value="${task ? task.id : ''}">
                        <div class="form-group"><label for="taskTitle">Título</label><input type="text" id="taskTitle" class="form-control" value="${task ? task.title : ''}" required></div>
                        <div class="form-group"><label for="taskDeadline">Prazo (Opcional)</label><input type="date" id="taskDeadline" class="form-control" value="${task ? (task.deadline || '') : ''}"></div>
                        <div class="form-group"><label for="taskPriority">Prioridade</label>
                            <select id="taskPriority" class="form-control">
                                <option value="1" ${task && task.priority == 1 ? 'selected' : ''}>P1 - Urgente</option>
                                <option value="2" ${task && task.priority == 2 ? 'selected' : ''}>P2 - Alta</option>
                                <option value="3" ${(task && task.priority == 3) || !task ? 'selected' : ''}>P3 - Média</option>
                                <option value="4" ${task && task.priority == 4 ? 'selected' : ''}>P4 - Baixa</option>
                            </select>
                        </div>
                        <div class="modal-footer"><button type="button" class="btn btn-secondary">Cancelar</button><button type="submit" class="btn btn-primary">Salvar</button></div>
                    </form>
                </div>
            </div>`;
        
        modalContainer.querySelector('form').addEventListener('submit', handleTaskSave);
        modalContainer.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        modalContainer.querySelector('.btn-secondary').addEventListener('click', closeModal);
    }
    
    function handleTaskSave(e) {
        e.preventDefault();
        const id = document.getElementById('taskId').value;
        const taskData = {
            title: document.getElementById('taskTitle').value.trim(),
            deadline: document.getElementById('taskDeadline').value || null,
            priority: document.getElementById('taskPriority').value
        };
        if (!taskData.title) return;

        if (id) {
            const task = state.tasks.find(t => t.id === id);
            if(task) Object.assign(task, taskData);
        } else {
            const newTask = { id: `task-${Date.now()}`, completed: false, ...taskData };
            state.tasks.push(newTask);
        }
        saveState();
        render();
        closeModal();
    }
    
    // Modal de Notas
    function openNoteModal(note = null) {
        modalContainer.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <form id="note-form">
                        <div class="modal-header"><h2 class="modal-title">${note ? 'Editar Nota' : 'Nova Nota'}</h2><button type="button" class="modal-close-btn">&times;</button></div>
                        <input type="hidden" id="noteId" value="${note ? note.id : ''}">
                        <div class="form-group"><label for="noteTitle">Título</label><input type="text" id="noteTitle" class="form-control" value="${note ? note.title : ''}" required></div>
                        <div class="form-group"><label for="noteContent">Conteúdo</label><textarea id="noteContent" class="form-control">${note ? note.content : ''}</textarea></div>
                        <div class="modal-footer"><button type="button" class="btn btn-secondary">Cancelar</button><button type="submit" class="btn btn-primary">Salvar</button></div>
                    </form>
                </div>
            </div>`;
        
        modalContainer.querySelector('form').addEventListener('submit', handleNoteSave);
        modalContainer.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        modalContainer.querySelector('.btn-secondary').addEventListener('click', closeModal);
    }

    function handleNoteSave(e) {
        e.preventDefault();
        const id = document.getElementById('noteId').value;
        const noteData = {
            title: document.getElementById('noteTitle').value.trim(),
            content: document.getElementById('noteContent').value.trim()
        };
        if(!noteData.title) return;

        if (id) {
            const note = state.notes.find(n => n.id === id);
            if(note) Object.assign(note, noteData);
        } else {
            const newNote = { id: `note-${Date.now()}`, ...noteData };
            state.notes.push(newNote);
        }
        saveState();
        render();
        closeModal();
    }
    
    // --- INICIALIZAÇÃO ---
    function init() {
        loadState();
        
        navBar.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                window.location.hash = navItem.dataset.page;
            }
        });
        
        window.addEventListener('hashchange', render);
        
        render(); // Renderiza a página inicial
    }

    init();
});
