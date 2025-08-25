// Life OS - Sistema de Roteamento
// Gerencia navegação entre abas e sincronização com o Store

const Router = (() => {
    // Estado interno
    let currentTab = 'inicio';
    let isInitialized = false;
    
    // Elementos DOM
    let content;
    let pages;
    let navButtons;
    
    // Inicializar o roteador
    const init = () => {
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
        
        // Listener para mudanças de hash na URL (para deep linking futuro)
        window.addEventListener('hashchange', handleHashChange);
        
        // Listener para teclas de atalho
        document.addEventListener('keydown', handleKeyboardNavigation);
    };
    
    // Carregar estado inicial
    const loadInitialState = () => {
        try {
            // Tentar carregar do Store primeiro
            if (typeof Store !== 'undefined') {
                const savedTab = Store.getState().currentTab;
                if (savedTab && isValidTab(savedTab)) {
                    currentTab = savedTab;
                }
            }
            
            // Fallback para localStorage direto
            if (!currentTab) {
                const savedTab = localStorage.getItem('activeTab');
                if (savedTab && isValidTab(savedTab)) {
                    currentTab = savedTab;
                }
            }
            
            // Garantir que temos uma aba válida
            if (!isValidTab(currentTab)) {
                currentTab = 'inicio';
            }
            
            // Atualizar UI
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
            saveCurrentScrollPosition();
            
            // Atualizar estado
            currentTab = tabId;
            
            // Sincronizar com o Store
            if (typeof Store !== 'undefined') {
                Store.switchTab(tabId);
            } else {
                // Fallback para localStorage
                localStorage.setItem('activeTab', tabId);
            }
            
            // Atualizar UI
            updateUI(tabId);
            
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