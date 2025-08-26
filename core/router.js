// Life OS - Sistema de Roteamento Unificado
// Gerencia navegação entre abas, sincronização com Store e eventos centralizados

const Router = (() => {
    // Estado interno
    let currentTab = 'inicio';
    let isInitialized = false;
    
    // Elementos DOM
    let content;
    let pages;
    let navButtons;
    
    // Inicializar o roteador
    const init = (deps = {}) => {
        if (isInitialized) return;
        
        try {
            // Obter referências DOM
            content = document.querySelector('.content');
            pages = document.querySelectorAll('.page');
            navButtons = document.querySelectorAll('.nav-button');
            
            if (!content || !pages.length || !navButtons.length) {
                console.error('❌ Elementos de navegação não encontrados');
                return;
            }
            
            // Configurar event listeners
            setupEventListeners();
            
            // Carregar estado inicial
            loadInitialState();
            
            isInitialized = true;
            console.log('✅ Router inicializado com sucesso');
            
            // Emitir evento de inicialização
            if (deps.EventBus) {
                deps.EventBus.emit(EVENTS.MODULE_INITIALIZED, { module: 'Router' });
            }
            
            // Forçar renderização dos módulos da aba atual
            setTimeout(() => {
                renderModulesForTab(currentTab);
            }, 100);
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Router:', error);
        }
    };
    
    // Configurar event listeners
    const setupEventListeners = () => {
        // Event listeners para botões de navegação
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = button.dataset.target;
                if (targetTab) {
                    navigateToTab(targetTab);
                }
            });
        });
        
        // Listener para mudanças no Store
        if (typeof Store !== 'undefined') {
            Store.subscribe('currentTab', (newTab) => {
                if (newTab !== currentTab) {
                    updateUI(newTab);
                }
            });
        }
        
        // Listener para eventos do EventBus
        if (typeof EventBus !== 'undefined') {
            EventBus.on(EVENTS.TAB_SWITCHED, (data) => {
                if (data.tab && data.tab !== currentTab) {
                    navigateToTab(data.tab);
                }
            }, 'Router');
        }
        
        // Listener para mudanças de hash na URL (para deep linking futuro)
        window.addEventListener('hashchange', handleHashChange);
        
        // Listener para teclas de atalho
        document.addEventListener('keydown', handleKeyboardNavigation);
    };
    
    // Carregar estado inicial
    const loadInitialState = () => {
        try {
            let savedTab = null;
            
            // 1. Tentar carregar do Store primeiro
            if (typeof Store !== 'undefined') {
                savedTab = Store.getState().currentTab;
                console.log(`📦 Store currentTab: ${savedTab}`);
            }
            
            // 2. Se Store não tem ou é 'inicio', tentar localStorage novo formato
            if (!savedTab || savedTab === 'inicio') {
                savedTab = localStorage.getItem('lifeOS_currentTab');
                console.log(`💾 localStorage lifeOS_currentTab: ${savedTab}`);
            }
            
            // 3. Se ainda não tem, tentar formato antigo
            if (!savedTab || savedTab === 'inicio') {
                savedTab = localStorage.getItem('activeTab');
                console.log(`💾 localStorage activeTab: ${savedTab}`);
            }
            
            // 4. Validar se a aba existe
            if (savedTab && isValidTab(savedTab)) {
                currentTab = savedTab;
                console.log(`✅ Aba válida encontrada: ${currentTab}`);
            } else {
                currentTab = 'inicio';
                console.log(`⚠️ Nenhuma aba válida encontrada, usando 'inicio'`);
            }
            
            // 5. Atualizar UI
            updateUI(currentTab);
            
        } catch (error) {
            console.error('Erro ao carregar estado inicial:', error);
            currentTab = 'inicio';
            updateUI(currentTab);
        }
    };
    
    // Navegar para uma aba específica
    const navigateToTab = (tabId) => {
        if (!isValidTab(tabId)) {
            console.warn(`Aba inválida: ${tabId}`);
            return;
        }
        
        if (tabId === currentTab) {
            return; // Já estamos na aba
        }
        
        try {
            // Salvar posição do scroll da aba atual
            const previousTab = currentTab;
            saveCurrentScrollPosition();
            
            // Atualizar estado
            currentTab = tabId;
            
            // Sincronizar com o Store E localStorage
            if (typeof Store !== 'undefined') {
                Store.switchTab(tabId);
            }
            
            // SEMPRE salvar no localStorage também (garantia dupla)
            localStorage.setItem('lifeOS_currentTab', tabId);
            localStorage.setItem('activeTab', tabId);
            
            console.log(`💾 Aba salva: ${tabId}`);
            
            // Atualizar UI
            updateUI(tabId);
            
            // Emitir eventos de navegação
            if (typeof EventBus !== 'undefined') {
                EventBus.emit(EVENTS.NAVIGATION_CHANGED, { 
                    from: previousTab, 
                    to: tabId 
                });
                EventBus.emit(EVENTS.TAB_SWITCHED, { 
                    tab: tabId,
                    previousTab: previousTab
                });
            }
            
            // Renderizar módulos relevantes
            renderModulesForTab(tabId);
            
            console.log(`🔄 Navegou para aba: ${tabId}`);
            
        } catch (error) {
            console.error('Erro ao navegar para aba:', error);
        }
    };
    
    // Atualizar interface do usuário
    const updateUI = (tabId) => {
        try {
            // Atualizar páginas
            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === tabId) {
                    page.classList.add('active');
                }
            });
            
            // Atualizar botões de navegação
            navButtons.forEach(button => {
                button.classList.remove('active');
                if (button.dataset.target === tabId) {
                    button.classList.add('active');
                }
            });
            
            // Restaurar posição do scroll
            restoreScrollPosition(tabId);
            
        } catch (error) {
            console.error('Erro ao atualizar UI:', error);
        }
    };
    
    // Salvar posição do scroll da aba atual
    const saveCurrentScrollPosition = () => {
        if (!content || !currentTab) return;
        
        try {
            const scrollPosition = content.scrollTop;
            
            if (typeof Store !== 'undefined') {
                Store.saveScrollPosition(currentTab, scrollPosition);
            } else {
                // Fallback para localStorage
                const scrollPositions = JSON.parse(localStorage.getItem('scrollPositions') || '{}');
                scrollPositions[currentTab] = scrollPosition;
                localStorage.setItem('scrollPositions', JSON.stringify(scrollPositions));
            }
            
        } catch (error) {
            console.error('Erro ao salvar posição do scroll:', error);
        }
    };
    
    // Restaurar posição do scroll de uma aba
    const restoreScrollPosition = (tabId) => {
        if (!content) return;
        
        try {
            let scrollPosition = 0;
            
            if (typeof Store !== 'undefined') {
                scrollPosition = Store.getScrollPosition(tabId);
            } else {
                // Fallback para localStorage
                const scrollPositions = JSON.parse(localStorage.getItem('scrollPositions') || '{}');
                scrollPosition = scrollPositions[tabId] || 0;
            }
            
            if (scrollPosition > 0) {
                content.scrollTop = scrollPosition;
            } else {
                content.scrollTop = 0;
            }
            
        } catch (error) {
            console.error('Erro ao restaurar posição do scroll:', error);
            content.scrollTop = 0;
        }
    };
    
    // Renderizar módulos específicos para cada aba
    const renderModulesForTab = (tabId) => {
        try {
            // Aguardar um frame para garantir que a UI foi atualizada
            requestAnimationFrame(() => {
                // Usar ModuleManager se disponível, senão fallback para window
                if (typeof ModuleManager !== 'undefined') {
                    ModuleManager.renderModulesForTab(tabId);
                } else {
                    // Fallback para o sistema antigo
                    switch (tabId) {
                        case 'bem-estar':
                            if (window.Metrics && typeof window.Metrics.render === 'function') {
                                window.Metrics.render();
                            }
                            if (window.Mood && typeof window.Mood.render === 'function') {
                                window.Mood.render();
                            }
                            if (window.Journal && typeof window.Journal.render === 'function') {
                                window.Journal.render();
                            }
                            if (window.Habits && typeof window.Habits.render === 'function') {
                                window.Habits.render();
                            }
                            break;
                            
                        case 'foco':
                            if (window.Goals && typeof window.Goals.render === 'function') {
                                window.Goals.render();
                            }
                            if (window.Tasks && typeof window.Tasks.render === 'function') {
                                window.Tasks.render();
                            }
                            if (window.FocusExtras && typeof window.FocusExtras.renderStats === 'function') {
                                window.FocusExtras.renderStats();
                            }
                            break;
                            
                        case 'financas':
                            if (window.Finance && typeof window.Finance.render === 'function') {
                                window.Finance.render();
                            }
                            break;
                            
                        case 'ajustes':
                            // Renderizar configurações se necessário
                            break;
                            
                        default:
                            // Página inicial - renderizar widgets principais
                            break;
                    }
                }
            });
            
        } catch (error) {
            console.error('Erro ao renderizar módulos para aba:', error);
        }
    };
    
    // Verificar se uma aba é válida
    const isValidTab = (tabId) => {
        return pages && Array.from(pages).some(page => page.id === tabId);
    };
    
    // Manipular mudanças de hash (para deep linking futuro)
    const handleHashChange = () => {
        const hash = window.location.hash.slice(1);
        if (hash && isValidTab(hash)) {
            navigateToTab(hash);
        }
    };
    
    // Navegação por teclado
    const handleKeyboardNavigation = (e) => {
        // Ctrl/Cmd + número para navegar para abas
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
            e.preventDefault();
            const tabIndex = parseInt(e.key) - 1;
            const tabButtons = Array.from(navButtons);
            if (tabButtons[tabIndex]) {
                navigateToTab(tabButtons[tabIndex].dataset.target);
            }
        }
        
        // Escape para voltar ao início
        if (e.key === 'Escape' && currentTab !== 'inicio') {
            e.preventDefault();
            navigateToTab('inicio');
        }
    };
    
    // Obter aba atual
    const getCurrentTab = () => currentTab;
    
    // Obter todas as abas disponíveis
    const getAvailableTabs = () => {
        return Array.from(pages).map(page => ({
            id: page.id,
            title: page.querySelector('h1')?.textContent || page.id,
            isActive: page.id === currentTab
        }));
    };
    
    // Forçar atualização da UI
    const refresh = () => {
        if (isInitialized) {
            updateUI(currentTab);
        }
    };
    
    // API pública
    return {
        init,
        navigateToTab,
        getCurrentTab,
        getAvailableTabs,
        refresh,
        isInitialized: () => isInitialized
    };
})();