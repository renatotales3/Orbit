// Life OS - Módulo Principal da Aplicação
// Controla a inicialização e coordenação de todos os módulos

const App = (() => {
    // Estado da aplicação
    let isInitialized = false;
    let modules = new Map();
    
    // Inicializar a aplicação
    const init = async () => {
        if (isInitialized) {
            console.warn('App já foi inicializado');
            return;
        }
        
        try {
            console.log('🚀 Inicializando Life OS...');
            
            // 1. Inicializar o Store primeiro
            if (typeof Store !== 'undefined') {
                Store.init();
                console.log('✅ Store inicializado');
            } else {
                console.error('❌ Store não encontrado');
                return;
            }
            
            // 2. Inicializar módulos na ordem correta
            await initializeModules();
            
            // 3. Configurar navegação inicial
            setupInitialNavigation();
            
            // 4. Marcar como inicializado
            isInitialized = true;
            
            // 5. Adicionar classe de carregamento
            const content = document.querySelector('.content');
            if (content) {
                content.classList.add('js-loaded');
            }
            
            console.log('🎉 Life OS inicializado com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Life OS:', error);
            showErrorNotification('Erro ao inicializar o aplicativo');
        }
    };
    
    // Inicializar todos os módulos
    const initializeModules = async () => {
        const moduleOrder = [
            'Theme',
            'Navigation', 
            'Pomodoro',
            'Tasks',
            'Goals',
            'Habits',
            'Mood',
            'Journal',
            'Metrics',
            'FocusExtras',
            'Finance'
        ];
        
        for (const moduleName of moduleOrder) {
            try {
                if (window[moduleName] && typeof window[moduleName].init === 'function') {
                    await window[moduleName].init();
                    modules.set(moduleName, window[moduleName]);
                    console.log(`✅ Módulo ${moduleName} inicializado`);
                } else {
                    console.warn(`⚠️ Módulo ${moduleName} não encontrado ou sem método init`);
                }
            } catch (error) {
                console.error(`❌ Erro ao inicializar módulo ${moduleName}:`, error);
            }
        }
    };
    
    // Configurar navegação inicial
    const setupInitialNavigation = () => {
        try {
            // Carregar aba salva ou usar padrão
            const savedTab = Store.getState().currentTab || 'inicio';
            
            // Verificar se a aba existe
            const targetPage = document.getElementById(savedTab);
            if (!targetPage) {
                console.warn(`Aba ${savedTab} não encontrada, usando 'inicio'`);
                Store.switchTab('inicio');
                return;
            }
            
            // Ativar navegação
            if (window.Navigation && typeof window.Navigation.switchTab === 'function') {
                window.Navigation.switchTab(savedTab);
            } else {
                // Fallback manual se o módulo de navegação não estiver disponível
                manualTabSwitch(savedTab);
            }
            
        } catch (error) {
            console.error('Erro ao configurar navegação inicial:', error);
        }
    };
    
    // Fallback para mudança de aba
    const manualTabSwitch = (targetId) => {
        try {
            const pages = document.querySelectorAll('.page');
            const navButtons = document.querySelectorAll('.nav-button');
            const content = document.querySelector('.content');
            
            if (!content) return;
            
            // Salvar posição do scroll da aba atual
            const currentActive = document.querySelector('.page.active');
            if (currentActive) {
                Store.saveScrollPosition(currentActive.id, content.scrollTop);
            }
            
            // Ativar nova aba
            pages.forEach(p => p.classList.remove('active'));
            const targetPage = document.getElementById(targetId);
            if (targetPage) {
                targetPage.classList.add('active');
            }
            
            // Atualizar botões de navegação
            navButtons.forEach(b => b.classList.toggle('active', b.dataset.target === targetId));
            
            // Restaurar posição do scroll
            const savedPosition = Store.getScrollPosition(targetId);
            if (savedPosition) {
                content.scrollTop = savedPosition;
            } else {
                content.scrollTop = 0;
            }
            
            // Renderizar módulos relevantes
            renderModulesForTab(targetId);
            
        } catch (error) {
            console.error('Erro no fallback de navegação:', error);
        }
    };
    
    // Renderizar módulos específicos para cada aba
    const renderModulesForTab = (tabId) => {
        try {
            switch (tabId) {
                case 'bem-estar':
                    if (modules.has('Metrics')) modules.get('Metrics').render();
                    if (modules.has('Mood')) modules.get('Mood').render();
                    if (modules.has('Journal')) modules.get('Journal').render();
                    if (modules.has('Habits')) modules.get('Habits').render();
                    break;
                    
                case 'foco':
                    if (modules.has('Goals')) modules.get('Goals').render();
                    if (modules.has('Tasks')) modules.get('Tasks').render();
                    if (modules.has('FocusExtras')) modules.get('FocusExtras').renderStats();
                    break;
                    
                case 'financas':
                    if (modules.has('Finance')) modules.get('Finance').render();
                    break;
                    
                case 'ajustes':
                    // Renderizar configurações se necessário
                    break;
                    
                default:
                    // Página inicial - renderizar widgets principais
                    break;
            }
        } catch (error) {
            console.error('Erro ao renderizar módulos para aba:', error);
        }
    };
    
    // Verificar se todos os módulos estão funcionando
    const healthCheck = () => {
        const health = {
            store: typeof Store !== 'undefined',
            modules: {},
            overall: true
        };
        
        modules.forEach((module, name) => {
            const isHealthy = module && typeof module.render === 'function';
            health.modules[name] = isHealthy;
            if (!isHealthy) health.overall = false;
        });
        
        return health;
    };
    
    // Reinicializar módulo específico
    const reinitModule = async (moduleName) => {
        try {
            if (modules.has(moduleName)) {
                const module = modules.get(moduleName);
                if (typeof module.init === 'function') {
                    await module.init();
                    console.log(`✅ Módulo ${moduleName} reinicializado`);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error(`❌ Erro ao reinicializar módulo ${moduleName}:`, error);
            return false;
        }
    };
    
    // Mostrar notificação de erro
    const showErrorNotification = (message) => {
        try {
            if (window.Utils && typeof window.Utils.showNotice === 'function') {
                window.Utils.showNotice(message, 'Erro');
            } else {
                // Fallback simples
                alert(`Erro: ${message}`);
            }
        } catch (error) {
            console.error('Erro ao mostrar notificação:', error);
        }
    };
    
    // API pública
    return {
        init,
        healthCheck,
        reinitModule,
        getModules: () => modules,
        isInitialized: () => isInitialized
    };
})();