window.addEventListener('error', function (event) {
    console.error('ERRO GLOBAL CAPTURADO:', event.error);
    document.body.innerHTML = `<div style="padding: 24px; color: #1a1a1a;">Ocorreu um erro crítico. Recarregue a página.</div>`;
});

document.addEventListener('DOMContentLoaded', () => {

    const appContent = document.getElementById('app-content');
    const navBar = document.getElementById('bottom-navbar');
    const modalContainer = document.getElementById('modal-container');
    if (!appContent || !navBar || !modalContainer) { console.error('Elementos essenciais do DOM não foram encontrados.'); return; }

    const ICONS = {
        home: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        tasks: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
        habits: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 12c0-5.25-4.25-9.5-9.5-9.5S2.5 6.75 2.5 12s4.25 9.5 9.5 9.5s9.5-4.25 9.5-9.5z"/><path d="M12 2v20"/><path d="M2.5 12h19"/></svg>`,
        calendar: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        notes: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        settings: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
        edit: `<svg viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
        delete: `<svg viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`
    };
    let state = {};

    function setupNavbar() {
        const navItems = [
            { id: 'home', icon: ICONS.home, text: 'Início' },
            { id: 'tasks', icon: ICONS.tasks, text: 'Tarefas' },
            { id: 'habits', icon: ICONS.habits, text: 'Hábitos' },
            { id: 'calendar', icon: ICONS.calendar, text: 'Calendário' },
            { id: 'notes', icon: ICONS.notes, text: 'Notas' },
            { id: 'settings', icon: ICONS.settings, text: 'Ajustes' }
        ];
        navBar.innerHTML = navItems.map(item => `
            <a href="#${item.id}" class="nav-item" data-page="${item.id}">
                ${item.icon}
                <span class="nav-text">${item.text}</span>
            </a>
        `).join('');
    }

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

    function saveState() { try { localStorage.setItem('lifeOSState', JSON.stringify(state)); } catch (e) { console.error("Erro ao salvar o estado:", e); } }

    const routes = {
        'home': renderHomePage,
        'tasks': renderTasksPage,
        'habits': renderHabitsPage,
        'calendar': renderCalendarPage,
        'notes': renderNotesPage,
        'settings': renderSettingsPage
    };

    function render() {
        const page = window.location.hash.replace('#', '') || 'home';
        const renderer = routes[page] || routes['home'];
        
        const oldFab = document.querySelector('.fab');
        if (oldFab) oldFab.remove();

        appContent.innerHTML = '';
        renderer(); // Executa a função de renderização da página
        updateActiveNav(page);

        if (page === 'notes' && state.pendingHighlightNoteId) {
            highlightNote(state.pendingHighlightNoteId);
            state.pendingHighlightNoteId = null; 
            saveState();
        }
    }
    
    function updateActiveNav(page) {
        navBar.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
    }

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

    // Funções de Renderização das Páginas
    function renderHomePage() { appContent.innerHTML = `<h1 class="page-title">Início</h1><div class="card"><div class="card-content">O redesign será aplicado aqui.</div></div>`; }
    function renderCalendarPage() { appContent.innerHTML = `<h1 class="page-title">Calendário</h1><div class="card"><div class="card-content">O redesign será aplicado aqui.</div></div>`; }
    function renderSettingsPage() { appContent.innerHTML = `<h1 class="page-title">Ajustes</h1><div class="card"><div class="card-title">LifeOS</div><div class="card-content">Redesign - Versão 2.0</div></div>`; }

    function renderTasksPage() {
        // Esta função está agora vazia, aguardando a implementação completa do redesign
        appContent.innerHTML = `<h1 class="page-title">Tarefas & Projetos</h1><div class="card-grid" id="task-list"></div>`;
        // Adicionar um FAB de exemplo
        createFab();
    }

    function renderNotesPage() {
        appContent.innerHTML = `<h1 class="page-title">Notas & Ideias</h1><div class="card-grid" id="notes-grid"></div>`;
        createFab();
    }

    function renderHabitsPage() {
        appContent.innerHTML = `<h1 class="page-title">Hábitos & Rotinas</h1><div class="card-grid" id="habit-list"></div>`;
        createFab();
    }
    
    function createFab() {
        const fab = document.createElement('button');
        fab.className = 'fab';
        fab.textContent = '+';
        document.body.appendChild(fab);
    }
    
    // --- INICIALIZAÇÃO ---
    function init() {
        setupNavbar();
        loadState();
        render();
        window.addEventListener('hashchange', render);
    }

    init();
});