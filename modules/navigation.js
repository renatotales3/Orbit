// Life OS - Módulo de Navegação
// Sistema completo de navegação entre abas

const Navigation = (() => {
    let isInitialized = false;
    let content;
    let pages;
    let navButtons;
    
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
            
            isInitialized = true;
            console.log('✅ Navigation module initialized');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Navigation:', error);
        }
    };
    
    const setupEventListeners = () => {
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = button.dataset.target;
                if (targetTab) {
                    switchTab(targetTab);
                }
            });
        });
    };
    
    const switchTab = (targetId) => {
        try {
            const targetPage = document.getElementById(targetId);
            if (!targetPage) {
                console.warn(`Aba ${targetId} não encontrada`);
                return;
            }
            
            // Salvar posição do scroll da aba atual
            const currentActive = document.querySelector('.page.active');
            if (currentActive && content) {
                const scrollPosition = content.scrollTop;
                if (typeof Store !== 'undefined') {
                    Store.saveScrollPosition(currentActive.id, scrollPosition);
                }
            }
            
            // Atualizar páginas
            pages.forEach(page => page.classList.remove('active'));
            targetPage.classList.add('active');
            
            // Atualizar botões de navegação
            navButtons.forEach(button => button.classList.remove('active'));
            const targetButton = document.querySelector(`[data-target="${targetId}"]`);
            if (targetButton) {
                targetButton.classList.add('active');
            }
            
            // Salvar aba atual
            if (typeof Store !== 'undefined') {
                Store.switchTab(targetId);
            } else {
                localStorage.setItem('lifeOS_currentTab', targetId);
                localStorage.setItem('activeTab', targetId);
            }
            
            // Restaurar posição do scroll
            if (content && typeof Store !== 'undefined') {
                const savedPosition = Store.getScrollPosition(targetId);
                content.scrollTop = savedPosition || 0;
            } else if (content) {
                content.scrollTop = 0;
            }
            
            // Renderizar módulos relevantes
            renderModulesForTab(targetId);
            
            console.log(`🔄 Navegou para aba: ${targetId}`);
            
        } catch (error) {
            console.error('Erro ao navegar para aba:', error);
        }
    };
    
    const renderModulesForTab = (tabId) => {
        try {
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
                    if (window.Pomodoro && typeof window.Pomodoro.render === 'function') {
                        window.Pomodoro.render();
                    }
                    break;
                    
                case 'financas':
                    if (window.Finance && typeof window.Finance.render === 'function') {
                        window.Finance.render();
                    }
                    break;
            }
        } catch (error) {
            console.error('Erro ao renderizar módulos para aba:', error);
        }
    };
    
    return { 
        init, 
        switchTab,
        isInitialized: () => isInitialized
    };
})();
