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

    const ICONS = { edit: `<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`, delete: `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`, calendar: `<svg viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>`, note: `<svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>` };
    let state = {};

    function saveState() { try { localStorage.setItem('lifeOSState', JSON.stringify(state)); } catch (e) { console.error("Erro ao salvar o estado:", e); } }
    function loadState() {
        let savedState = null;
        try { savedState = localStorage.getItem('lifeOSState'); } catch (e) { console.error("Erro ao ler o localStorage:", e); }
        const defaultState = { tasks: [], notes: [], calendarEvents: [], habits: [], pendingHighlightNoteId: null };
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                state = { ...defaultState, ...parsedState };
            } catch (e) { console.error("Erro ao interpretar o estado salvo.", e); state = defaultState; }
        } else { state = defaultState; }
    }

    const routes = { 'home': renderHomePage, 'tasks': renderTasksPage, 'habits': renderHabitsPage, 'calendar': renderCalendarPage, 'notes': renderNotesPage, 'settings': renderSettingsPage };
    function render() {
        const page = window.location.hash.replace('#', '') || 'home';
        const renderer = routes[page] || routes['home'];
        const oldFab = document.querySelector('.fab');
        if (oldFab) oldFab.remove();
        appContent.innerHTML = '';
        renderer();
        updateActiveNav(page);
        if (page === 'notes' && state.pendingHighlightNoteId) {
            highlightNote(state.pendingHighlightNoteId);
            state.pendingHighlightNoteId = null;
            saveState();
        }
    }
    function updateActiveNav(page) { navBar.querySelectorAll('.nav-item').forEach(item => { item.classList.toggle('active', item.dataset.page === page); }); }
    
    function highlightNote(noteId) { setTimeout(() => { const noteCard = document.querySelector(`.note-card[data-id="${noteId}"]`); if (noteCard) { noteCard.scrollIntoView({ behavior: 'smooth', block: 'center' }); noteCard.classList.add('highlight'); setTimeout(() => noteCard.classList.remove('highlight'), 2000); } }, 100); }
    function calculateDaysRemaining(dateString) { const today = new Date(); today.setHours(0, 0, 0, 0); const deadline = new Date(dateString); deadline.setHours(0, 0, 0, 0); const diffTime = deadline - today; const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); if (diffDays < 0) return 'Prazo encerrado'; if (diffDays === 0) return 'Termina hoje'; if (diffDays === 1) return 'Falta 1 dia'; return `Faltam ${diffDays} dias`; }
    function getTaskStatus(task) { if (task.completed) { return { text: 'Concluída', className: 'status-done' }; } if (task.progress > 0) { return { text: 'Em Progresso', className: 'status-progress' }; } return { text: 'Pendente', className: 'status-pending' }; }

    function renderHomePage() { appContent.innerHTML = `<h1 class="page-title">Início</h1><div class="card"><div class="card-title">Bem-vindo ao LifeOS</div><div class="card-content">Este é o seu espaço.</div></div>`; }
    
    // CORREÇÃO: Chamadas para createFab e attachTaskListeners restauradas
    function renderTasksPage() { 
        appContent.innerHTML = `<h1 class="page-title">Tarefas & Projetos</h1><ul class="card-grid" id="task-list">${state.tasks.map(task => `<li class="task-item card ${task.completed ? 'completed' : ''}" data-id="${task.id}" draggable="true"><div class="card-actions"><button class="card-action-btn edit-btn" data-id="${task.id}">${ICONS.edit}</button><button class="card-action-btn delete-btn" data-id="${task.id}">${ICONS.delete}</button></div><div class="task-header"><label class="custom-checkbox-container"><input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}><span class="checkmark"></span></label><div class="task-info"><h3 class="card-title">${task.title}</h3></div></div><div class="card-content card-meta">${task.deadline ? `<div class="meta-item">${ICONS.calendar}<span>${calculateDaysRemaining(task.deadline)}</span></div>` : ''}</div><div class="progress-container"><div class="progress-bar-container"><div class="progress-bar-fill" style="width: ${task.progress || 0}%;"></div></div><span class="progress-text">${task.progress || 0}%</span></div><div class="task-footer">${task.attachedNoteId ? `<button class="attached-note-link" data-note-id="${task.attachedNoteId}">${ICONS.note} Ver Nota</button>` : '<div></div>'}<span class="task-priority p${task.priority}">P${task.priority}</span></div></li>`).join('')}</ul>${state.tasks.length === 0 ? '<div class="card"><p class="card-content">Nenhuma tarefa encontrada.</p></div>' : ''}`; 
        createFab(() => openTaskModal());
        attachTaskListeners(); 
    }
    
    function renderCalendarPage() { const tasksWithDeadline = state.tasks.filter(task => task.deadline); const allEvents = [...tasksWithDeadline, ...state.calendarEvents].sort((a, b) => new Date(a.date || a.deadline) - new Date(b.date || b.deadline)); const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]; appContent.innerHTML = `<h1 class="page-title">Calendário</h1><div class="card-grid">${allEvents.map(event => { const eventDate = new Date((event.date || event.deadline) + 'T12:00:00Z'); const day = eventDate.getUTCDate(); const month = months[eventDate.getUTCMonth()]; const status = event.deadline ? getTaskStatus(event) : null; return `<div class="event-item card"><div class="event-date"><span class="event-day">${day}</span><span class="event-month">${month}</span></div><div class="event-details"><div class="event-details-header"><h3 class="card-title event-title">${event.title}</h3>${event.priority ? `<span class="task-priority p${event.priority}">P${event.priority}</span>` : ''}</div><div style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem;">${status ? `<span class="status-tag ${status.className}">${status.text}</span>` : ''}<div class="event-countdown"><span>${calculateDaysRemaining(event.deadline)}</span></div></div></div></div>`}).join('')}</div>${allEvents.length === 0 ? '<div class="card"><p class="card-content">Nenhum evento com prazo.</p></div>' : ''}`; }
    
    // CORREÇÃO: Chamadas para createFab e attachNoteListeners restauradas
    function renderNotesPage() { 
        appContent.innerHTML = `<h1 class="page-title">Notas & Ideias</h1><div class="card-grid" id="notes-grid">${state.notes.map(note => `<div class="note-card card" data-id="${note.id}"><div class="card-actions"><button class="card-action-btn edit-btn" data-id="${note.id}">${ICONS.edit}</button><button class="card-action-btn delete-btn" data-id="${note.id}">${ICONS.delete}</button></div><h3 class="card-title">${note.title}</h3><p class="card-content">${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}</p></div>`).join('')}</div>${state.notes.length === 0 ? '<div class="card"><p class="card-content">Nenhuma nota encontrada.</p></div>' : ''}`; 
        createFab(() => openNoteModal()); 
        attachNoteListeners(); 
    }
    
    function renderSettingsPage() { appContent.innerHTML = `<h1 class="page-title">Ajustes</h1><div class="card"><div class="card-title">LifeOS</div><div class="card-content">Versão 1.6</div></div>`; }
    
    function renderHabitsPage() {
        const today = new Date();
        const dayOfWeek = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'][today.getDay()];
        const habitsForToday = state.habits.filter(h => h.frequency.includes(dayOfWeek));

        appContent.innerHTML = `
            <h1 class="page-title">Hábitos & Rotinas</h1>
            <div class="card-grid" id="habit-list">
                ${habitsForToday.map(habit => {
                    const todayStr = new Date().toLocaleDateString('en-CA');
                    const completion = habit.completions.find(c => c.date === todayStr);
                    const streak = calculateStreak(habit);
                    
                    let heatmapHTML = '';
                    for (let i = 6; i >= 0; i--) {
                        const date = new Date(); date.setDate(date.getDate() - i);
                        const dateStr = date.toLocaleDateString('en-CA');
                        const dayCompletion = habit.completions.find(c => c.date === dateStr);
                        const isCompleted = dayCompletion && (habit.type === 'binary' || (habit.type === 'quantifiable' && dayCompletion.value >= habit.target));
                        const isToday = i === 0;
                        heatmapHTML += `<div class="day-square ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}"></div>`;
                    }

                    let actionHTML = '';
                    if (habit.type === 'binary') {
                        actionHTML = `<button class="binary-btn ${completion ? 'completed' : ''}" data-id="${habit.id}">✓</button>`;
                    } else if (habit.type === 'quantifiable') {
                        const currentAmount = completion ? completion.value : 0;
                        actionHTML = `<div class="quant-action" data-id="${habit.id}"><div class="quant-progress">${currentAmount}</div><div class="quant-target">/ ${habit.target} ${habit.unit}</div></div>`;
                    }

                    return `
                    <div class="habit-item card" data-id="${habit.id}">
                        <div class="habit-details">
                            <h3 class="card-title">${habit.name}</h3>
                            <div class="habit-streak">🔥 ${streak} dia(s)</div>
                            <div class="mini-heatmap">${heatmapHTML}</div>
                        </div>
                        <div class="habit-action">${actionHTML}</div>
                    </div>`;
                }).join('')}
            </ul>
             ${state.habits.length === 0 ? '<div class="card"><p class="card-content">Nenhum hábito criado. Comece uma nova rotina!</p></div>' : ''}
             ${state.habits.length > 0 && habitsForToday.length === 0 ? '<div class="card"><p class="card-content">Nenhum hábito para hoje. Aproveite o seu dia!</p></div>' : ''}
        `;
        createFab(() => openHabitModal());
        attachHabitListeners();
    }

    function createFab(onClick) { const fab = document.createElement('button');fab.className = 'fab';fab.textContent = '+';fab.onclick = onClick;document.body.appendChild(fab); }
    function closeModal() { modalContainer.innerHTML = ''; }
    function showConfirmationModal(message) { return new Promise((resolve, reject) => { modalContainer.innerHTML = `<div class="modal-overlay"><div class="modal-content confirm-modal-content"><h2 class="modal-title">Confirmação</h2><p class="card-content">${message}</p><div class="modal-footer"><button type="button" class="btn btn-secondary" id="cancel-btn">Cancelar</button><button type="button" class="btn btn-primary" id="confirm-btn">Confirmar</button></div></div></div>`; modalContainer.querySelector('#confirm-btn').onclick = () => { closeModal(); resolve(); }; modalContainer.querySelector('#cancel-btn').onclick = () => { closeModal(); reject(); }; }); }
    
    async function attachTaskListeners() { /* ...código existente sem alterações... */ }
    async function attachNoteListeners(){ /* ...código existente sem alterações... */ }
    function attachHabitListeners() {
        const habitList = document.getElementById('habit-list');
        if (!habitList) return;
        habitList.addEventListener('click', e => {
            const binaryBtn = e.target.closest('.binary-btn');
            const quantAction = e.target.closest('.quant-action');
            if (binaryBtn) { handleHabitCompletion(binaryBtn.dataset.id); }
            if (quantAction) { 
                const habit = state.habits.find(h => h.id === quantAction.dataset.id);
                if (habit) openHabitLogModal(habit);
            }
        });
    }

    function handleTaskSave(e) { /* ...código existente sem alterações... */ }
    function openTaskModal(task = null) { /* ...código existente sem alterações... */ }
    function handleNoteSave(e) { /* ...código existente sem alterações... */ }
    function openNoteModal(note = null) { /* ...código existente sem alterações... */ }
    function openTaskViewer(task) { /* ...código existente sem alterações... */ }
    function openNoteViewer(note) { /* ...código existente sem alterações... */ }
    
    function handleHabitCompletion(id, value = 1) {
        const habit = state.habits.find(h => h.id === id);
        if (!habit) return;
        const today = new Date().toLocaleDateString('en-CA');
        const completionIndex = habit.completions.findIndex(c => c.date === today);

        if (habit.type === 'binary') {
            if (completionIndex > -1) { habit.completions.splice(completionIndex, 1); } 
            else { habit.completions.push({ date: today, value: 1 }); }
        } else if (habit.type === 'quantifiable') {
            if (completionIndex > -1) {
                habit.completions[completionIndex].value += value;
            } else {
                habit.completions.push({ date: today, value: value });
            }
        }
        saveState(); render();
    }

    function calculateStreak(habit) { /* ...código existente sem alterações... */ }

    function openHabitModal(habit = null) { /* ...código existente sem alterações... */ }
    function handleHabitSave(e) { /* ...código existente sem alterações... */ }

    // NOVO: Modal de Registro Rápido para Hábitos Quantificáveis
    function openHabitLogModal(habit) {
        const today = new Date().toLocaleDateString('en-CA');
        const completion = habit.completions.find(c => c.date === today);
        const currentAmount = completion ? completion.value : 0;

        modalContainer.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <form id="habit-log-form">
                        <div class="modal-header">
                            <h2 class="modal-title">Registrar Progresso</h2>
                            <button type="button" class="modal-close-btn">&times;</button>
                        </div>
                        <h3 class="card-title" style="text-align:center; margin-bottom:1rem;">${habit.name}</h3>
                        <p style="text-align:center; color: var(--color-text-secondary);">Progresso Atual: ${currentAmount} / ${habit.target} ${habit.unit}</p>
                        <div class="form-group">
                            <label for="habitValue">Adicionar Valor</label>
                            <input type="number" id="habitValue" class="form-control" step="0.1" placeholder="ex: 0.5" required>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Adicionar</button>
                        </div>
                    </form>
                </div>
            </div>`;
        const form = modalContainer.querySelector('form');
        form.addEventListener('submit', e => {
            e.preventDefault();
            const valueToAdd = parseFloat(document.getElementById('habitValue').value);
            if (!isNaN(valueToAdd) && valueToAdd > 0) {
                handleHabitCompletion(habit.id, valueToAdd);
            }
            closeModal();
        });
        form.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        form.querySelector('.btn-secondary').addEventListener('click', closeModal);
    }
    
    function init() { loadState(); navBar.addEventListener('click', (e) => { const navItem = e.target.closest('.nav-item'); if (navItem) { e.preventDefault(); window.location.hash = navItem.dataset.page; } }); window.addEventListener('hashchange', render); render(); }
    init();
});
