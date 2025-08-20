// Adiciona um listener global para capturar erros não tratados
window.addEventListener('error', function (event) {
    console.error('ERRO GLOBAL CAPTURADO:', event.error);
    document.body.innerHTML = `<div style="padding: 24px; color: white;">Ocorreu um erro crítico na aplicação. Por favor, recarregue a página. Detalhes do erro foram enviados ao console.</div>`;
});

document.addEventListener('DOMContentLoaded', () => {

    const appContent = document.getElementById('app-content');
    const navBar = document.getElementById('bottom-navbar');
    const modalContainer = document.getElementById('modal-container');
    if (!appContent || !navBar || !modalContainer) { console.error('Elementos essenciais do DOM não foram encontrados.'); return; }

    let state = {};

    function saveState() { try { localStorage.setItem('lifeOSState', JSON.stringify(state)); } catch (e) { console.error("Erro ao salvar o estado:", e); } }
    function loadState() {
        let savedState = null;
        try { savedState = localStorage.getItem('lifeOSState'); } catch (e) { console.error("Erro ao ler o localStorage:", e); }
        const defaultState = { tasks: [], notes: [], calendarEvents: [] };
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                state.tasks = Array.isArray(parsedState.tasks) ? parsedState.tasks : [];
                state.notes = Array.isArray(parsedState.notes) ? parsedState.notes : [];
                state.calendarEvents = Array.isArray(parsedState.calendarEvents) ? parsedState.calendarEvents : [];
            } catch (e) { console.error("Erro ao interpretar o estado salvo, usando padrão.", e); state = defaultState; }
        } else { state = defaultState; }
    }

    const routes = { 'home': renderHomePage, 'tasks': renderTasksPage, 'calendar': renderCalendarPage, 'notes': renderNotesPage, 'settings': renderSettingsPage };
    function render() {
        const page = window.location.hash.replace('#', '') || 'home';
        const renderer = routes[page] || routes['home'];
        const oldFab = document.querySelector('.fab');
        if (oldFab) oldFab.remove();
        appContent.innerHTML = '';
        renderer();
        updateActiveNav(page);
    }
    function updateActiveNav(page) { navBar.querySelectorAll('.nav-item').forEach(item => { item.classList.toggle('active', item.dataset.page === page); }); }

    // --- FUNÇÕES HELPER ---
    function calculateDaysRemaining(dateString) {
        const today = new Date();
        const deadline = new Date(dateString + 'T23:59:59');
        today.setHours(0, 0, 0, 0);
        const diffTime = deadline - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'Prazo encerrado';
        if (diffDays === 0) return 'Termina hoje ⌛';
        if (diffDays === 1) return 'Falta 1 dia';
        return `Faltam ${diffDays} dias`;
    }

    // NOVO: Helper para status da tarefa
    function getTaskStatus(task) {
        if (task.completed) {
            return { text: 'Concluída', className: 'status-done' };
        }
        if (task.progress > 0) {
            return { text: 'Em Progresso', className: 'status-progress' };
        }
        return { text: 'Pendente', className: 'status-pending' };
    }


    // --- FUNÇÕES DE RENDERIZAÇÃO DE PÁGINA ---
    function renderHomePage() { appContent.innerHTML = `<h1 class="page-title">Início</h1><div class="card"><div class="card-title">Bem-vindo ao LifeOS</div><div class="card-content">Este é o seu espaço. Em breve, este painel será preenchido com insights sobre sua vida.</div></div>`; }

    function renderTasksPage() {
        appContent.innerHTML = `
            <h1 class="page-title">Tarefas & Projetos</h1>
            <ul class="card-grid" id="task-list">
                ${state.tasks.map(task => `
                    <li class="task-item card ${task.completed ? 'completed' : ''}" data-id="${task.id}" draggable="true">
                        <button class="delete-btn" data-id="${task.id}">&times;</button>
                        <div class="task-header">
                            <label class="custom-checkbox-container">
                                <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                                <span class="checkmark"></span>
                            </label>
                            <div class="task-info">
                                <h3 class="card-title">${task.title}</h3>
                            </div>
                        </div>
                        <div class="card-content card-meta">
                            ${task.deadline ? `<div class="meta-item"><svg viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg><span>${calculateDaysRemaining(task.deadline)}</span></div>` : ''}
                        </div>
                        <div class="progress-container">
                            <div class="progress-bar-container">
                                <div class="progress-bar-fill" style="width: ${task.progress || 0}%;"></div>
                            </div>
                            <span class="progress-text">${task.progress || 0}%</span>
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
        appContent.innerHTML = `<h1 class="page-title">Calendário</h1><div class="card-grid">${allEvents.map(event => { const eventDate = new Date((event.date || event.deadline) + 'T12:00:00Z'); const day = eventDate.getUTCDate(); const month = months[eventDate.getUTCMonth()]; const status = event.deadline ? getTaskStatus(event) : null; return `
        <div class="event-item card">
            <div class="event-date">
                <span class="event-day">${day}</span>
                <span class="event-month">${month}</span>
            </div>
            <div class="event-details">
                <div class="event-details-header">
                    <h3 class="card-title event-title">${event.title}</h3>
                    ${event.priority ? `<span class="task-priority p${event.priority}">P${event.priority}</span>` : ''}
                </div>
                ${status ? `<span class="status-tag ${status.className}">${status.text}</span>` : ''}
                <div class="event-countdown" style="margin-top: auto; padding-top: 0.5rem;">
                    <span>${calculateDaysRemaining(event.deadline)}</span>
                </div>
            </div>
        </div>
        `}).join('')}</div>${allEvents.length === 0 ? '<div class="card"><p class="card-content">Nenhum evento ou tarefa com prazo encontrados.</p></div>' : ''}`;
    }

    function renderNotesPage() { appContent.innerHTML = `<h1 class="page-title">Notas & Ideias</h1><div class="card-grid" id="notes-grid">${state.notes.map(note => `<div class="note-card card" data-id="${note.id}"><button class="delete-btn" data-id="${note.id}">&times;</button><h3 class="card-title">${note.title}</h3><p class="card-content">${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}</p></div>`).join('')}</div>${state.notes.length === 0 ? '<div class="card"><p class="card-content">Nenhuma nota encontrada. Adicione uma nova!</p></div>' : ''}`; createFab(() => openNoteModal()); attachNoteListeners(); }
    function renderSettingsPage() { appContent.innerHTML = `<h1 class="page-title">Ajustes</h1><div class="card"><div class="card-title">LifeOS</div><div class="card-content">Versão 1.2</div></div>`; }

    // --- MODAIS E EVENTOS ---
    function createFab(onClick) { const fab = document.createElement('button');fab.className = 'fab';fab.textContent = '+';fab.onclick = onClick;document.body.appendChild(fab); }
    function closeModal() { modalContainer.innerHTML = ''; }
    function showConfirmationModal(message) {
        return new Promise((resolve, reject) => {
            modalContainer.innerHTML = `<div class="modal-overlay"><div class="modal-content confirm-modal-content"><h2 class="modal-title">Confirmação</h2><p class="card-content">${message}</p><div class="modal-footer"><button type="button" class="btn btn-secondary" id="cancel-btn">Cancelar</button><button type="button" class="btn btn-primary" id="confirm-btn">Confirmar</button></div></div></div>`;
            modalContainer.querySelector('#confirm-btn').onclick = () => { closeModal(); resolve(); };
            modalContainer.querySelector('#cancel-btn').onclick = () => { closeModal(); reject(); };
        });
    }
    
    async function attachTaskListeners() {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;
        taskList.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            const taskCard = e.target.closest('.task-item');
            const checkboxContainer = e.target.closest('.custom-checkbox-container');
            if (deleteBtn) { e.stopPropagation(); try { await showConfirmationModal('Deseja realmente excluir esta tarefa?'); state.tasks = state.tasks.filter(t => t.id !== deleteBtn.dataset.id); saveState(); render(); } catch {} return; }
            if (checkboxContainer) { e.stopPropagation(); const checkbox = checkboxContainer.querySelector('input'); const task = state.tasks.find(t => t.id === checkbox.dataset.id); if (task) { task.completed = checkbox.checked; saveState(); render(); } return; }
            if (taskCard) { const task = state.tasks.find(t => t.id === taskCard.dataset.id); if (task) openTaskModal(task); }
        });
        let draggedItemId = null; taskList.addEventListener('dragstart', (e) => {if (e.target.matches('.task-item')) {draggedItemId = e.target.dataset.id;setTimeout(() => e.target.classList.add('dragging'), 0);}}); taskList.addEventListener('dragend', (e) => {if(e.target.matches('.task-item')) e.target.classList.remove('dragging')}); taskList.addEventListener('dragover', (e) => e.preventDefault()); taskList.addEventListener('drop', (e) => {e.preventDefault();const dropTarget = e.target.closest('.task-item');if (dropTarget && draggedItemId !== dropTarget.dataset.id) {const draggedIndex = state.tasks.findIndex(t => t.id === draggedItemId);const targetIndex = state.tasks.findIndex(t => t.id === dropTarget.dataset.id);if(draggedIndex === -1 || targetIndex === -1) return;const [draggedItem] = state.tasks.splice(draggedIndex, 1);state.tasks.splice(targetIndex, 0, draggedItem);saveState();render();}});
    }
    
    async function attachNoteListeners(){
        const notesGrid = document.getElementById('notes-grid');
        if (!notesGrid) return;
        notesGrid.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            const noteCard = e.target.closest('.note-card');
            if(deleteBtn){ e.stopPropagation(); try { await showConfirmationModal('Deseja realmente excluir esta nota?'); state.notes = state.notes.filter(n => n.id !== deleteBtn.dataset.id); saveState(); render(); } catch {} return; }
            if(noteCard){ const note = state.notes.find(n => n.id === noteCard.dataset.id); if(note) openNoteModal(note); }
        });
    }

    function openTaskModal(task = null) {
        modalContainer.innerHTML = `<div class="modal-overlay"><div class="modal-content"><form id="task-form"><div class="modal-header"><h2 class="modal-title">${task ? 'Editar Tarefa' : 'Nova Tarefa'}</h2><button type="button" class="modal-close-btn">&times;</button></div><input type="hidden" id="taskId" value="${task ? task.id : ''}"><div class="form-group"><label for="taskTitle">Título</label><input type="text" id="taskTitle" class="form-control" value="${task ? task.title : ''}" required></div><div class="form-group"><label for="taskDeadline">Prazo (Opcional)</label><input type="date" id="taskDeadline" class="form-control" value="${task ? (task.deadline || '') : ''}"></div><div class="form-group"><label for="taskProgress">Progresso (0-100%)</label><input type="number" id="taskProgress" class="form-control" value="${task ? (task.progress || 0) : 0}" min="0" max="100"></div><div class="form-group"><label for="taskPriority">Prioridade</label><select id="taskPriority" class="form-control"><option value="1" ${task && task.priority == 1 ? 'selected' : ''}>P1 - Urgente</option><option value="2" ${task && task.priority == 2 ? 'selected' : ''}>P2 - Alta</option><option value="3" ${(task && task.priority == 3) || !task ? 'selected' : ''}>P3 - Média</option><option value="4" ${task && task.priority == 4 ? 'selected' : ''}>P4 - Baixa</option></select></div><div class="modal-footer"><button type="button" class="btn btn-secondary">Cancelar</button><button type="submit" class="btn btn-primary">Salvar</button></div></form></div></div>`;
        const form = modalContainer.querySelector('form'); form.addEventListener('submit', handleTaskSave); form.querySelector('.modal-close-btn').addEventListener('click', closeModal); form.querySelector('.btn-secondary').addEventListener('click', closeModal);
    }
    
    function handleTaskSave(e) {
        e.preventDefault();
        const id = document.getElementById('taskId').value;
        const taskData = { title: document.getElementById('taskTitle').value.trim(), deadline: document.getElementById('taskDeadline').value || null, progress: parseInt(document.getElementById('taskProgress').value) || 0, priority: document.getElementById('taskPriority').value };
        if (!taskData.title) return;
        if (id) { const task = state.tasks.find(t => t.id === id); if(task) Object.assign(task, taskData); } 
        else { const newTask = { id: `task-${Date.now()}`, completed: false, subtasks: [], ...taskData }; state.tasks.push(newTask); }
        saveState(); render(); closeModal();
    }
    
    function openNoteModal(note = null) {
        modalContainer.innerHTML = `<div class="modal-overlay"><div class="modal-content"><form id="note-form"><div class="modal-header"><h2 class="modal-title">${note ? 'Editar Nota' : 'Nova Nota'}</h2><button type="button" class="modal-close-btn">&times;</button></div><input type="hidden" id="noteId" value="${note ? note.id : ''}"><div class="form-group"><label for="noteTitle">Título</label><input type="text" id="noteTitle" class="form-control" value="${note ? note.title : ''}" required></div><div class="form-group"><label for="noteContent">Conteúdo</label><textarea id="noteContent" class="form-control">${note ? note.content : ''}</textarea></div><div class="modal-footer"><button type="button" class="btn btn-secondary">Cancelar</button><button type="submit" class="btn btn-primary">Salvar</button></div></form></div></div>`;
        const form = modalContainer.querySelector('form'); form.addEventListener('submit', handleNoteSave); form.querySelector('.modal-close-btn').addEventListener('click', closeModal); form.querySelector('.btn-secondary').addEventListener('click', closeModal);
    }

    function handleNoteSave(e) {
        e.preventDefault();
        const id = document.getElementById('noteId').value;
        const noteData = { title: document.getElementById('noteTitle').value.trim(), content: document.getElementById('noteContent').value.trim() };
        if(!noteData.title) return;
        if (id) { const note = state.notes.find(n => n.id === id); if(note) Object.assign(note, noteData); } 
        else { const newNote = { id: `note-${Date.now()}`, ...noteData }; state.notes.push(newNote); }
        saveState(); render(); closeModal();
    }
    
    function init() { loadState(); navBar.addEventListener('click', (e) => { const navItem = e.target.closest('.nav-item'); if (navItem) { e.preventDefault(); window.location.hash = navItem.dataset.page; } }); window.addEventListener('hashchange', render); render(); }

    init();
});
