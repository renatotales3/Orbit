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

    function renderHomePage() { /* ...código sem alterações... */ }
    function renderTasksPage() { /* ...código sem alterações... */ }
    function renderCalendarPage() { /* ...código sem alterações... */ }
    function renderNotesPage() { /* ...código sem alterações... */ }
    function renderSettingsPage() { appContent.innerHTML = `<h1 class="page-title">Ajustes</h1><div class="card"><div class="card-title">LifeOS</div><div class="card-content">Versão 1.5</div></div>`; }
    
    // RENDERER DE HÁBITOS (REESCRITO v3.0)
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
                        const date = new Date();
                        date.setDate(date.getDate() - i);
                        const dateStr = date.toLocaleDateString('en-CA');
                        const completed = habit.completions.some(c => c.date === dateStr);
                        const isToday = i === 0;
                        heatmapHTML += `<div class="day-square ${completed ? 'completed' : ''} ${isToday ? 'today' : ''}"></div>`;
                    }

                    let actionHTML = '';
                    if (habit.type === 'binary') {
                        actionHTML = `<button class="binary-btn ${completion ? 'completed' : ''}" data-id="${habit.id}">✓</button>`;
                    } else if (habit.type === 'quantifiable') {
                        const currentAmount = completion ? completion.value : 0;
                        actionHTML = `
                            <div class="quant-action" data-id="${habit.id}">
                                <div class="quant-progress">${currentAmount}</div>
                                <div class="quant-target">/ ${habit.target} ${habit.unit}</div>
                            </div>
                        `;
                    }

                    return `
                    <div class="habit-item card" data-id="${habit.id}">
                        <div class="habit-details">
                            <h3 class="card-title">${habit.name}</h3>
                            <div class="habit-streak">🔥 ${streak} dia(s)</div>
                            <div class="mini-heatmap">${heatmapHTML}</div>
                        </div>
                        <div class="habit-action">
                            ${actionHTML}
                        </div>
                    </div>
                    `;
                }).join('')}
            </ul>
             ${state.habits.length === 0 ? '<div class="card"><p class="card-content">Nenhum hábito criado. Comece uma nova rotina!</p></div>' : ''}
             ${state.habits.length > 0 && habitsForToday.length === 0 ? '<div class="card"><p class="card-content">Nenhum hábito para hoje. Aproveite o seu dia!</p></div>' : ''}
        `;
        createFab(() => openHabitModal());
        attachHabitListeners();
    }

    function createFab(onClick) { /* ...código sem alterações... */ }
    function closeModal() { modalContainer.innerHTML = ''; }
    function showConfirmationModal(message) { /* ...código sem alterações... */ }
    
    function attachTaskListeners() { /* ...código sem alterações... */ }
    function attachNoteListeners(){ /* ...código sem alterações... */ }
    function attachHabitListeners() {
        const habitList = document.getElementById('habit-list');
        if (!habitList) return;
        habitList.addEventListener('click', e => {
            const binaryBtn = e.target.closest('.binary-btn');
            const quantAction = e.target.closest('.quant-action');
            if (binaryBtn) { handleHabitCompletion(binaryBtn.dataset.id); }
            if (quantAction) { /* Futuramente abre mini-modal quantitativo */ }
        });
    }

    function handleTaskSave(e) { /* ...código sem alterações... */ }
    function openTaskModal(task = null) { /* ...código sem alterações... */ }
    function handleNoteSave(e) { /* ...código sem alterações... */ }
    function openNoteModal(note = null) { /* ...código sem alterações... */ }
    function openTaskViewer(task) { /* ...código sem alterações... */ }
    function openNoteViewer(note) { /* ...código sem alterações... */ }

    function handleHabitCompletion(id) {
        const habit = state.habits.find(h => h.id === id);
        if (!habit || habit.type !== 'binary') return;
        const today = new Date().toLocaleDateString('en-CA');
        const completionIndex = habit.completions.findIndex(c => c.date === today);

        if (completionIndex > -1) {
            habit.completions.splice(completionIndex, 1);
        } else {
            habit.completions.push({ date: today, value: 1 });
        }
        saveState();
        render();
    }

    function calculateStreak(habit) {
        if (!habit.completions || habit.completions.length === 0) return 0;
        const completionDates = new Set(habit.completions.map(c => c.date));
        let streak = 0;
        let currentDate = new Date();
        
        if (!completionDates.has(currentDate.toLocaleDateString('en-CA'))) {
            currentDate.setDate(currentDate.getDate() - 1);
        }

        while (completionDates.has(currentDate.toLocaleDateString('en-CA'))) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }
        return streak;
    }

    function openHabitModal(habit = null) {
        const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
        const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
        const selectedDays = habit ? habit.frequency : [];

        modalContainer.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <form id="habit-form">
                    <div class="modal-header"><h2 class="modal-title">${habit ? 'Editar Hábito' : 'Novo Hábito'}</h2><button type="button" class="modal-close-btn">&times;</button></div>
                    <input type="hidden" id="habitId" value="${habit ? habit.id : ''}">
                    <div class="form-group"><label for="habitName">Nome</label><input type="text" id="habitName" class="form-control" value="${habit ? habit.name : ''}" required></div>
                    <div class="form-group"><label for="habitType">Tipo de Hábito</label>
                        <select id="habitType" class="form-control">
                            <option value="binary" ${habit && habit.type === 'binary' ? 'selected' : ''}>Sim/Não</option>
                            <option value="quantifiable" ${habit && habit.type === 'quantifiable' ? 'selected' : ''}>Quantificável</option>
                        </select>
                    </div>
                    <div class="form-group ${habit && habit.type === 'quantifiable' ? '' : 'hidden'}" id="quant-fields">
                        <label for="habitTarget">Meta Diária</label><input type="number" id="habitTarget" class="form-control" value="${habit ? (habit.target || 1) : 1}" min="1">
                        <label for="habitUnit" style="margin-top:1rem;">Unidade (ex: L, km, pág)</label><input type="text" id="habitUnit" class="form-control" value="${habit ? (habit.unit || '') : ''}">
                    </div>
                    <div class="form-group"><label>Frequência</label><div class="day-selector">${days.map((day, index) => `<button type="button" class="day-toggle ${selectedDays.includes(day) ? 'selected' : ''}" data-day="${day}">${dayLabels[index]}</button>`).join('')}</div></div>
                    <div class="modal-footer"><button type="button" class="btn btn-secondary">Cancelar</button><button type="submit" class="btn btn-primary">Salvar</button></div>
                </form>
            </div>
        </div>`;
        const form = modalContainer.querySelector('form');
        form.querySelector('#habitType').addEventListener('change', e => {
            document.getElementById('quant-fields').classList.toggle('hidden', e.target.value !== 'quantifiable');
        });
        form.querySelector('.day-selector').addEventListener('click', e => { if (e.target.matches('.day-toggle')) { e.target.classList.toggle('selected'); } });
        form.addEventListener('submit', handleHabitSave);
        form.querySelector('.modal-close-btn').addEventListener('click', closeModal);
        form.querySelector('.btn-secondary').addEventListener('click', closeModal);
    }

    function handleHabitSave(e) {
        e.preventDefault();
        const id = document.getElementById('habitId').value;
        const name = document.getElementById('habitName').value.trim();
        const type = document.getElementById('habitType').value;
        const frequency = [...document.querySelectorAll('.day-toggle.selected')].map(btn => btn.dataset.day);

        if (!name || frequency.length === 0) { alert('Preencha o nome e selecione pelo menos um dia.'); return; }

        let habitData = { name, type, frequency };
        if (type === 'quantifiable') {
            habitData.target = parseFloat(document.getElementById('habitTarget').value) || 1;
            habitData.unit = document.getElementById('habitUnit').value.trim();
        }

        if (id) {
            const existingHabit = state.habits.find(h => h.id === id);
            if (existingHabit) Object.assign(existingHabit, habitData);
        } else {
            const newHabit = { id: `habit-${Date.now()}`, completions: [], ...habitData };
            state.habits.push(newHabit);
        }
        saveState(); render(); closeModal();
    }
    
    function init() { loadState(); navBar.addEventListener('click', (e) => { const navItem = e.target.closest('.nav-item'); if (navItem) { e.preventDefault(); window.location.hash = navItem.dataset.page; } }); window.addEventListener('hashchange', render); render(); }
    init();
});
