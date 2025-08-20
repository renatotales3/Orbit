window.addEventListener('error', function (event) {
    console.error('ERRO GLOBAL CAPTURADO:', event.error);
    document.body.innerHTML = `<div style="padding: 24px; color: #1a1a1a;">Ocorreu um erro crítico. Recarregue a página.</div>`;
});

document.addEventListener('DOMContentLoaded', () => {

    const appContent = document.getElementById('app-content');
    const navBar = document.getElementById('bottom-navbar');
    const modalContainer = document.getElementById('modal-container');
    if (!appContent || !navBar || !modalContainer) { console.error('Elementos essenciais do DOM não foram encontrados.'); return; }

    // Ícones 2D da biblioteca Lucide
    const ICONS = {
        home: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        tasks: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6.5A3.5 3.5 0 0 0 8.5 3 3.5 3.5 0 0 0 5 6.5a3.5 3.5 0 0 0 3.5 3.5h7a3.5 3.5 0 0 0 3.5-3.5 3.5 3.5 0 0 0-3.5-3.5z"/><path d="M15 17.5a3.5 3.5 0 0 0 3.5-3.5 3.5 3.5 0 0 0-3.5-3.5h-7a3.5 3.5 0 0 0-3.5 3.5 3.5 3.5 0 0 0 3.5 3.5a3.5 3.5 0 0 0 3.5-3.5"/></svg>`,
        habits: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`,
        calendar: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        notes: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
        settings: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
        edit: `<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
        delete: `<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`
    };
    let state = {}; // O estado será populado pelo loadState

    // Função para renderizar a barra de navegação com os ícones corretos
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

    // A lógica de estado e as funções de renderização antigas ainda existem aqui
    // mas estão ocultadas para focar no protótipo.
    // Em uma implementação real, todo o código anterior estaria aqui.
    
    // RENDERER PROTÓTIPO PARA TAREFAS
    function renderTasksPage() {
        appContent.innerHTML = `
            <h1 class="page-title">Tarefas & Projetos</h1>
            <ul class="card-grid" id="task-list">
                <li class="task-item card" data-id="task-1">
                    <div class="card-actions">
                        <button class="card-action-btn edit-btn" title="Editar">${ICONS.edit}</button>
                        <button class="card-action-btn delete-btn" title="Excluir">${ICONS.delete}</button>
                    </div>
                    <div class="task-header">
                        <label class="custom-checkbox-container">
                            <input type="checkbox">
                            <span class="checkmark"></span>
                        </label>
                        <div class="task-info">
                            <h3 class="card-title">Prototipar o novo design Soft UI</h3>
                        </div>
                    </div>
                    <div class="card-content" style="flex-grow: 0; min-height: 20px;"></div>
                    <div class="progress-container">
                        <div class="progress-bar-container"><div class="progress-bar-fill" style="width: 75%;"></div></div>
                        <span class="progress-text">75%</span>
                    </div>
                    <div class="task-footer">
                        <div class="meta-item">
                            ${ICONS.calendar}<span>Termina hoje</span>
                        </div>
                        <span class="task-priority p1">P1</span>
                    </div>
                </li>
                <li class="task-item card completed" data-id="task-2">
                    <div class="card-actions">
                        <button class="card-action-btn edit-btn">${ICONS.edit}</button>
                        <button class="card-action-btn delete-btn">${ICONS.delete}</button>
                    </div>
                    <div class="task-header">
                        <label class="custom-checkbox-container">
                            <input type="checkbox" checked>
                            <span class="checkmark"></span>
                        </label>
                        <div class="task-info">
                            <h3 class="card-title">Corrigir bugs de deploy</h3>
                        </div>
                    </div>
                </li>
            </ul>
        `;
        createFab();
        // attachTaskListeners() seria chamado aqui em uma versão funcional completa
    }

    // Funções placeholder para as outras páginas, para manter a navegação funcional
    function renderHomePage() { appContent.innerHTML = `<h1 class="page-title">Início</h1><p>O redesign será aplicado aqui.</p>`; }
    function renderHabitsPage() { appContent.innerHTML = `<h1 class="page-title">Hábitos & Rotinas</h1><p>O redesign será aplicado aqui.</p>`; }
    function renderCalendarPage() { appContent.innerHTML = `<h1 class="page-title">Calendário</h1><p>O redesign será aplicado aqui.</p>`; }
    function renderNotesPage() { appContent.innerHTML = `<h1 class="page-title">Notas & Ideias</h1><p>O redesign será aplicado aqui.</p>`; }
    function renderSettingsPage() { appContent.innerHTML = `<h1 class="page-title">Ajustes</h1><div class="card"><div class="card-content">Redesign - Versão 2.0</div></div>`; }
    function createFab() {
        const fab = document.createElement('button');
        fab.className = 'fab';
        fab.textContent = '+';
        document.body.appendChild(fab);
    }
    
    // --- INICIALIZAÇÃO ---
    function init() {
        setupNavbar();
        const routes = {
            'home': renderHomePage,
            'tasks': renderTasksPage,
            'habits': renderHabitsPage,
            'calendar': renderCalendarPage,
            'notes': renderNotesPage,
            'settings': renderSettingsPage
        };
        const page = window.location.hash.replace('#', '') || 'home';
        const renderer = routes[page] || routes.home;
        renderer();
        updateActiveNav(page);

        window.addEventListener('hashchange', () => {
            const newPage = window.location.hash.replace('#', '') || 'home';
            const newRenderer = routes[newPage] || routes.home;
            newRenderer();
            updateActiveNav(newPage);
        });
    }

    init();
});
