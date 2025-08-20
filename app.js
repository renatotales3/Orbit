// Adiciona um listener global para capturar erros não tratados
window.addEventListener('error', function (event) {
    console.error('ERRO GLOBAL CAPTURADO:', event.error);
    document.body.innerHTML = `<div style="padding: 24px; color: white;">Ocorreu um erro crítico. Recarregue a página.</div>`;
});

document.addEventListener('DOMContentLoaded', () => {

    const appContent = document.getElementById('app-content');
    const navBar = document.getElementById('bottom-navbar');
    const modalContainer = document.getElementById('modal-container');
    if (!appContent || !navBar || !modalContainer) { console.error('Elementos essenciais do DOM não foram encontrados.'); return; }

    // Ícones SVG para reutilização
    const ICONS = {
        edit: `<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
        delete: `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`,
        calendar: `<svg viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>`,
        note: `<svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`
    };

    let state = {};

    function saveState() { try { localStorage.setItem('lifeOSState', JSON.stringify(state)); } catch (e) { console.error("Erro ao salvar o estado:", e); } }
    function loadState() {
        let savedState = null;
        try { savedState = localStorage.getItem('lifeOSState'); } catch (e) { console.error("Erro ao ler o localStorage:", e); }
        const defaultState = { tasks: [], notes: [], calendarEvents: [], pendingHighlightNoteId: null };
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                state = { ...defaultState, ...parsedState };
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

        // Lógica de Destaque
        if (page === 'notes' && state.pendingHighlightNoteId) {
            highlightNote(state.pendingHighlightNoteId);
            state.pendingHighlightNoteId = null;
            saveState();
        }
    }
    function updateActiveNav(page) { navBar.querySelectorAll('.nav-item').forEach(item => { item.classList.toggle('active', item.dataset.page === page); }); }
    
    function highlightNote(noteId) {
        setTimeout(() => {
            const noteCard = document.querySelector(`.note-card[data-id="${noteId}"]`);
            if (noteCard) {
                noteCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                noteCard.classList.add('highlight');
                setTimeout(() => noteCard.classList.remove('highlight'), 2000);
            }
        }, 100);
    }

    function calculateDaysRemaining(dateString) { const today = new Date(); today.setHours(0, 0, 0, 0); const deadline = new Date(dateString); deadline.setHours(0, 0, 0, 0); const diffTime = deadline - today; const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); if (diffDays < 0) return 'Prazo encerrado'; if (diffDays === 0) return 'Termina hoje'; if (diffDays === 1) return 'Falta 1 dia'; return `Faltam ${diffDays} dias`; }
    function getTaskStatus(task) { if (task.completed) { return { text: 'Concluída', className: 'status-done' }; } if (task.progress > 0) { return { text: 'Em Progresso', className: 'status-progress' }; } return { text: 'Pendente', className: 'status-pending' }; }

    function renderHomePage() { appContent.innerHTML = `<h1 class="page-title">Início</h1><div class="card"><div class="card-title">Bem-vindo ao LifeOS</div><div class="card-content">Este é o seu espaço. Em breve, este painel será preenchido com insights sobre sua vida.</div></div>`; }

    function renderTasksPage() {
        appContent.innerHTML = `
            <h1 class="page-title">Tarefas & Projetos</h1>
            <ul class="card-grid" id="task-list">
                ${state.tasks.map(task => `
                    <li class="task-item card ${task.completed ? 'completed' : ''}" data-id="${task.id}" draggable="true">
                        <div class="card-actions">
                            <button class="card-action-btn edit-btn" data-id="${task.id}">${ICONS.edit}</button>
                            <button class="card-action-btn delete-btn" data-id="${task.id}">${ICONS.delete}</button>
                        </div>
                        <div class="task-header">
                            <label class="custom-checkbox-container">
                                <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                                <span class="checkmark"></span>
                            </label>
                            <div class="task-info"><h3 class="card-title">${task.title}</h3></div>
                        </div>
                        <div class="card-content card-meta">
                            ${task.deadline ? `<div class="meta-item">${ICONS.calendar}<span>${calculateDaysRemaining(task.deadline)}</span></div>` : ''}
                        </div>
                        <div class="progress-container">
                            <div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${task.progress || 0}%;"></div></div>
                            <span class="progress-text">${task.progress || 0}%</span>
                        </div>
                        <div class="task-footer">
                            ${task.attachedNoteId ? `<button class="attached-note-link" data-note-id="${task.attachedNoteId}">${ICONS.note} Ver Nota</button>` : '<div></div>'}
                            <span class="task-priority p${task.priority}">P${task.priority}</span>
                        </div>
                    </li>
                `).join('')}
            </ul>
            ${state.tasks.length === 0 ? '<div class="card"><p class="card-content">Nenhuma tarefa encontrada.</p></div>' : ''}
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
            <div class="event-date"><span class="event-day">${day}</span><span class="event-month">${month}</span></div>
            <div class="event-details">
                <div class="event-details-header">
                    <h3 class="card-title event-title">${event.title}</h3>
                    ${event.priority ? `<span class="task-priority p${event.priority}">P${event.priority}</span>` : ''}
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem;">
                    ${status ? `<span class="status-tag ${status.className}">${status.text}</span>` : ''}
                    <div class="event-countdown"><span>${calculateDaysRemaining(event.deadline)}</span></div>
                </div>
            </div>
        </div>
        `}).join('')}</div>${allEvents.length === 0 ? '<div class="card"><p class="card-content">Nenhum evento com prazo.</p></div>' : ''}`;
    }

    function renderNotesPage() { 
        appContent.innerHTML = `
            <h1 class="page-title">Notas & Ideias</h1>
            <div class="card-grid" id="notes-grid">
                ${state.notes.map(note => `
                    <div class="note-card card" data-id="${note.id}">
                        <div class="card-actions">
                            <button class="card-action-btn edit-btn" data-id="${note.id}">${ICONS.edit}</button>
                            <button class="card-action-btn delete-btn" data-id="${note.id}">${ICONS.delete}</button>
                        </div>
                        <h3 class="card-title">${note.title}</h3>
                        <p class="card-content">${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}</p>
                    </div>
                `).join('')}
            </div>
            ${state.notes.length === 0 ? '<div class="card"><p class="card-content">Nenhuma nota encontrada.</p></div>' : ''}
        `;
        createFab(() => openNoteModal()); 
        attachNoteListeners(); 
    }
    function renderSettingsPage() { appContent.innerHTML = `<h1 class="page-title">Ajustes</h1><div class="card"><div class="card-title">LifeOS</div><div class="card-content">Versão 1.3</div></div>`; }

    function createFab(onClick) { const fab = document.createElement('button');fab.className = 'fab';fab.textContent = '+';fab.onclick = onClick;document.body.appendChild(fab); }
    function closeModal() { modalContainer.innerHTML = ''; }
    function showConfirmationModal(message) { return new Promise((resolve, reject) => { modalContainer.innerHTML = `<div class="modal-overlay"><div class="modal-content confirm-modal-content"><h2 class="modal-title">Confirmação</h2><p class="card-content">${message}</p><div class="modal-footer"><button type="button" class="btn btn-secondary" id="cancel-btn">Cancelar</button><button type="button" class="btn btn-primary" id="confirm-btn">Confirmar</button></div></div></div>`; modalContainer.querySelector('#confirm-btn').onclick = () => { closeModal(); resolve(); }; modalContainer.querySelector('#cancel-btn').onclick = () => { closeModal(); reject(); }; }); }
    
    async function attachTaskListeners() {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;
        taskList.addEventListener('click', async (e) => {
            const card = e.target.closest('.task-item');
            if (!card) return;
            const id = card.dataset.id;
            
            if (e.target.closest('.delete-btn')) { e.stopPropagation(); try { await showConfirmationModal('Deseja realmente excluir esta tarefa?'); state.tasks = state.tasks.filter(t => t.id !== id); saveState(); render(); } catch {} return; }
            if (e.target.closest('.edit-btn')) { e.stopPropagation(); const task = state.tasks.find(t => t.id === id); if (task) openTaskModal(task); return; }
            if (e.target.closest('.custom-checkbox-container')) { e.stopPropagation(); const checkbox = e.target.closest('.custom-checkbox-container').querySelector('input'); const task = state.tasks.find(t => t.id === id); if (task) { task.completed = checkbox.checked; saveState(); render(); } return; }
            if (e.target.closest('.attached-note-link')) { e.stopPropagation(); state.pendingHighlightNoteId = e.target.closest('.attached-note-link').dataset.noteId; saveState(); window.location.hash = '#notes'; return; }
            
            const task = state.tasks.find(t => t.id === id); if (task) openTaskViewer(task);
        });
        let draggedItemId = null; taskList.addEventListener('dragstart', (e) => {if (e.target.matches('.task-item')) {draggedItemId = e.target.dataset.id;setTimeout(() => e.target.classList.add('dragging'), 0);}}); taskList.addEventListener('dragend', (e) => {if(e.target.matches('.task-item')) e.target.classList.remove('dragging')}); taskList.addEventListener('dragover', (e) => e.preventDefault()); taskList.addEventListener('drop', (e) => {e.preventDefault();const dropTarget = e.target.closest('.task-item');if (dropTarget && draggedItemId !== dropTarget.dataset.id) {const draggedIndex = state.tasks.findIndex(t => t.id === draggedItemId);const targetIndex = state.tasks.findIndex(t => t.id === dropTarget.dataset.id);if(draggedItemId === -1 || targetIndex === -1) return;const [draggedItem] = state.tasks.splice(draggedIndex, 1);state.tasks.splice(targetIndex, 0, draggedItem);saveState();render();}});
    }
    
    async function attachNoteListeners(){
        const notesGrid = document.getElementById('notes-grid');
        if (!notesGrid) return;
        notesGrid.addEventListener('click', async (e) => {
            const card = e.target.closest('.note-card');
            if (!card) return;
            const id = card.dataset.id;

            if(e.target.closest('.delete-btn')){ e.stopPropagation(); try { await showConfirmationModal('Deseja realmente excluir esta nota?'); state.notes = state.notes.filter(n => n.id !== id); saveState(); render(); } catch {} return; }
            if(e.target.closest('.edit-btn')){ e.stopPropagation(); const note = state.notes.find(n => n.id === id); if(note) openNoteModal(note); return; }
            
            const note = state.notes.find(n => n.id === id); if(note) openNoteViewer(note);
        });
    }

    function openTaskModal(task = null) {
        const notesOptions = state.notes.map(note => `<option value="${note.id}" ${task && task.attachedNoteId === note.id ? 'selected' : ''}>${note.title}</option>`).join('');
        modalContainer.innerHTML = `<div class="modal-overlay"><div class="modal-content"><form id="task-form"><div class="modal-header"><h2 class="modal-title">${task ? 'Editar Tarefa' : 'Nova Tarefa'}</h2><button type="button" class="modal-close-btn">&times;</button></div><input type="hidden" id="taskId" value="${task ? task.id : ''}"><div class="form-group"><label for="taskTitle">Título</label><input type="text" id="taskTitle" class="form-control" value="${task ? task.title : ''}" required></div><div class="form-group"><label for="taskDeadline">Prazo</label><input type="date" id="taskDeadline" class="form-control" value="${task ? (task.deadline || '') : ''}"></div><div class="form-group"><label for="taskProgress">Progresso (%)</label><input type="number" id="taskProgress" class="form-control" value="${task ? (task.progress || 0) : 0}" min="0" max="100"></div><div class="form-group"><label for="taskPriority">Prioridade</label><select id="taskPriority" class="form-control"><option value="1" ${task && task.priority == 1 ? 'selected' : ''}>P1</option><option value="2" ${task && task.priority == 2 ? 'selected' : ''}>P2</option><option value="3" ${(task && task.priority == 3) || !task ? 'selected' : ''}>P3</option><option value="4" ${task && task.priority == 4 ? 'selected' : ''}>P4</option></select></div><div class="form-group"><label for="attachedNoteId">Anexar Nota</label><select id="attachedNoteId" class="form-control"><option value="">Nenhuma</option>${notesOptions}</select></div><div class="modal-footer"><button type="button" class="btn btn-secondary">Cancelar</button><button type="submit" class="btn btn-primary">Salvar</button></div></form></div></div>`;
        const form = modalContainer.querySelector('form'); form.addEventListener('submit', handleTaskSave); form.querySelector('.modal-close-btn').addEventListener('click', closeModal); form.querySelector('.btn-secondary').addEventListener('click', closeModal);
    }
    function handleTaskSave(e) { e.preventDefault(); const id = document.getElementById('taskId').value; const taskData = { title: document.getElementById('taskTitle').value.trim(), deadline: document.getElementById('taskDeadline').value || null, progress: parseInt(document.getElementById('taskProgress').value) || 0, priority: document.getElementById('taskPriority').value, attachedNoteId: document.getElementById('attachedNoteId').value || null }; if (!taskData.title) return; if (id) { const task = state.tasks.find(t => t.id === id); if(task) Object.assign(task, taskData); } else { const newTask = { id: `task-${Date.now()}`, completed: false, subtasks: [], ...taskData }; state.tasks.push(newTask); } saveState(); render(); closeModal(); }
    function openNoteModal(note = null) {
        modalContainer.innerHTML = `<div class="modal-overlay"><div class="modal-content"><form id="note-form"><div class="modal-header"><h2 class="modal-title">${note ? 'Editar Nota' : 'Nova Nota'}</h2><button type="button" class="modal-close-btn">&times;</button></div><input type="hidden" id="noteId" value="${note ? note.id : ''}"><div class="form-group"><label for="noteTitle">Título</label><input type="text" id="noteTitle" class="form-control" value="${note ? note.title : ''}" required></div><div class="form-group"><label for="noteContent">Conteúdo</label><textarea id="noteContent" class="form-control">${note ? note.content : ''}</textarea></div><div class="form-group"><label for="noteLink">Link/Anexo (URL)</label><input type="url" id="noteLink" class="form-control" value="${note && note.link ? note.link : ''}" placeholder="https://..."></div><div class="modal-footer"><button type="button" class="btn btn-secondary">Cancelar</button><button type="submit" class="btn btn-primary">Salvar</button></div></form></div></div>`;
        const form = modalContainer.querySelector('form'); form.addEventListener('submit', handleNoteSave); form.querySelector('.modal-close-btn').addEventListener('click', closeModal); form.querySelector('.btn-secondary').addEventListener('click', closeModal);
    }
    function handleNoteSave(e) { e.preventDefault(); const id = document.getElementById('noteId').value; const noteData = { title: document.getElementById('noteTitle').value.trim(), content: document.getElementById('noteContent').value.trim(), link: document.getElementById('noteLink').value.trim() || null }; if(!noteData.title) return; if (id) { const note = state.notes.find(n => n.id === id); if(note) Object.assign(note, noteData); } else { const newNote = { id: `note-${Date.now()}`, ...noteData }; state.notes.push(newNote); } saveState(); render(); closeModal(); }
    
    // --- NOVOS MODAIS DE VISUALIZAÇÃO ---
    function openTaskViewer(task) {
        const noteLinkHTML = task.attachedNoteId ? `<button class="attached-note-link" data-note-id="${task.attachedNoteId}">${ICONS.note} Ver Nota de Referência</button>` : '';
        modalContainer.innerHTML = `<div class="modal-overlay"><div class="modal-content viewer-modal-content"><div class="modal-header"><h2 class="modal-title">${task.title}</h2><button type="button" class="modal-close-btn">&times;</button></div><div class="viewer-content"><div class="progress-container" style="margin-top:0;"><div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${task.progress || 0}%;"></div></div><span class="progress-text">${task.progress || 0}%</span></div><div class="card-meta" style="margin-top: 1.5rem;">${task.deadline ? `<div class="meta-item">${ICONS.calendar}<span>${calculateDaysRemaining(task.deadline)}</span></div>` : ''}${noteLinkHTML}</div></div><div class="modal-footer"><button type="button" class="btn btn-secondary" id="edit-from-viewer-btn">Editar</button></div></div></div>`;
        
        modalContainer.querySelector('.modal-close-btn').onclick = closeModal;
        modalContainer.querySelector('#edit-from-viewer-btn').onclick = () => openTaskModal(task);
        
        // *** CORREÇÃO: Adiciona o event listener para o link da nota ***
        const noteLinkButton = modalContainer.querySelector('.attached-note-link');
        if (noteLinkButton) {
            noteLinkButton.onclick = (e) => {
                e.stopPropagation();
                closeModal();
                state.pendingHighlightNoteId = noteLinkButton.dataset.noteId;
                saveState();
                window.location.hash = '#notes';
            };
        }
    }

    function openNoteViewer(note) {
        const linkHTML = note.link ? `<a href="${note.link}" target="_blank" class="viewer-link">Acessar Link/Anexo</a>` : '';
        modalContainer.innerHTML = `<div class="modal-overlay"><div class="modal-content viewer-modal-content"><div class="modal-header"><h2 class="modal-title">${note.title}</h2><button type="button" class="modal-close-btn">&times;</button></div><div class="viewer-content"><p class="viewer-text">${note.content}</p>${linkHTML}</div><div class="modal-footer"><button type="button" class="btn btn-secondary" id="edit-from-viewer-btn">Editar</button></div></div></div>`;
        modalContainer.querySelector('.modal-close-btn').onclick = closeModal;
        modalContainer.querySelector('#edit-from-viewer-btn').onclick = () => openNoteModal(note);
    }

    function init() { loadState(); navBar.addEventListener('click', (e) => { const navItem = e.target.closest('.nav-item'); if (navItem) { e.preventDefault(); window.location.hash = navItem.dataset.page; } }); window.addEventListener('hashchange', render); render(); }
    init();
});
