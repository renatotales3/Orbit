document.addEventListener('DOMContentLoaded', () => {
    // 1. Tenta encontrar os elementos essenciais da página.
    const appContent = document.getElementById('app-content');
    const navBar = document.getElementById('bottom-navbar');

    // Se um dos elementos principais não for encontrado, o app não pode funcionar.
    if (!appContent || !navBar) {
        console.error("Erro Crítico: Elementos essenciais do HTML (app-content ou bottom-navbar) não foram encontrados.");
        document.body.innerHTML = "Erro Crítico de Inicialização. Verifique o HTML.";
        return; // Interrompe a execução
    }

    // 2. Define um conteúdo SIMPLES e ESTÁTICO para cada página.
    const diagnosticRoutes = {
        'home': `
            <h1 class="page-title">🏠 Início</h1>
            <div class="card"><div class="card-title">Diagnóstico</div><div class="card-content">A página de Início carregou.</div></div>
        `,
        'tasks': `
            <h1 class="page-title">✅ Tarefas</h1>
            <div class="card"><div class="card-title">Diagnóstico</div><div class="card-content">A página de Tarefas carregou.</div></div>
        `,
        'calendar': `
            <h1 class="page-title">📅 Calendário</h1>
            <div class="card"><div class="card-title">Diagnóstico</div><div class="card-content">A página de Calendário carregou.</div></div>
        `,
        'notes': `
            <h1 class="page-title">📓 Notas</h1>
            <div class="card"><div class="card-title">Diagnóstico</div><div class="card-content">A página de Notas carregou.</div></div>
        `,
        'settings': `
            <h1 class="page-title">⚙️ Ajustes</h1>
            <div class="card"><div class="card-title">Diagnóstico</div><div class="card-content">A página de Ajustes carregou.</div></div>
        `
    };

    // 3. Função de renderização simplificada.
    function renderPage(page) {
        // Se a página não existir no nosso mapa de rotas, vai para a home.
        const content = diagnosticRoutes[page] || diagnosticRoutes['home'];
        appContent.innerHTML = content;
        updateActiveNav(page);
        console.log(`Página renderizada: ${page}`);
    }

    // 4. Função para atualizar o ícone ativo na navbar.
    function updateActiveNav(page) {
        navBar.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
    }

    // 5. Função de navegação principal.
    function navigate(e) {
        const navItem = e.target.closest('.nav-item');
        if (navItem) {
            e.preventDefault();
            window.location.hash = navItem.dataset.page;
        }
    }

    // 6. Função de inicialização
    function init() {
        console.log("LifeOS Diagnóstico: Iniciando aplicação...");
        navBar.addEventListener('click', navigate);

        // Ouve por mudanças na URL (ex: #home -> #tasks)
        window.addEventListener('hashchange', () => {
            const page = window.location.hash.replace('#', '') || 'home';
            renderPage(page);
        });

        // Renderiza a página inicial ou a que estiver na URL.
        const initialPage = window.location.hash.replace('#', '') || 'home';
        renderPage(initialPage);
        console.log("LifeOS Diagnóstico: Aplicação iniciada.");
    }

    // Inicia tudo.
    init();
});
