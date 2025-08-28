/**
 * MÓDULO DE NAVEGAÇÃO
 * 
 * Responsabilidades:
 * - Controle de navegação entre abas
 * - Persistência da aba ativa
 * - Gerenciamento de scroll position
 * - Renderização automática de módulos
 * 
 * Refatoração aplicada:
 * - Separação de responsabilidades
 * - Nomes de variáveis mais descritivos
 * - Comentários explicativos
 * - Lógica de renderização otimizada
 * - Código ES6+ moderno
 */

const Navigation = (() => {
    
    // ===== ELEMENTOS DOM =====
    const contentElement = document.querySelector('.content');
    const pageElements = document.querySelectorAll('.page');
    const navigationButtons = document.querySelectorAll('.nav-button');
    
    // ===== CONFIGURAÇÕES =====
    const TAB_RENDER_CONFIG = {
        'bem-estar': ['Metrics', 'Mood', 'Journal', 'Habits'],
        'foco': ['Goals', 'Tasks', 'FocusExtras'],
        'financas': ['Finance']
    };
    
    // ===== GERENCIAMENTO DE SCROLL =====
    
    /**
     * Salva a posição do scroll da aba atual
     * @param {string} tabId - ID da aba ativa
     */
    const saveScrollPosition = (tabId) => {
        const currentActivePage = document.querySelector('.page.active');
        if (currentActivePage && contentElement) {
            currentActivePage.dataset.scrollPosition = contentElement.scrollTop;
        }
    };
    
    /**
     * Restaura a posição do scroll da aba de destino
     * @param {string} tabId - ID da aba de destino
     */
    const restoreScrollPosition = (tabId) => {
        const targetPage = document.getElementById(tabId);
        if (!targetPage || !contentElement) return;
        
        const savedScrollPosition = targetPage.dataset.scrollPosition;
        
        if (savedScrollPosition) {
            contentElement.scrollTop = parseInt(savedScrollPosition);
        } else {
            contentElement.scrollTop = 0;
        }
    };
    
    // ===== RENDERIZAÇÃO DE MÓDULOS =====
    
    /**
     * Renderiza módulos específicos para a aba ativa
     * @param {string} tabId - ID da aba ativa
     */
    const renderTabModules = (tabId) => {
        const modulesToRender = TAB_RENDER_CONFIG[tabId] || [];
        
        modulesToRender.forEach(moduleName => {
            const module = window[moduleName];
            if (module && typeof module.render === 'function') {
                try {
                    module.render();
                } catch (error) {
                    console.warn(`Erro ao renderizar módulo ${moduleName}:`, error);
                }
            }
        });
    };
    
    // ===== CONTROLE DE NAVEGAÇÃO =====
    
    /**
     * Ativa uma aba específica
     * @param {string} targetTabId - ID da aba de destino
     */
    const activateTab = (targetTabId) => {
        // Salva posição da aba atual
        const currentActivePage = document.querySelector('.page.active');
        if (currentActivePage) {
            saveScrollPosition(currentActivePage.id);
        }
        
        // Remove classe ativa de todas as páginas
        pageElements.forEach(page => page.classList.remove('active'));
        
        // Adiciona classe ativa na página de destino
        const targetPage = document.getElementById(targetTabId);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Atualiza botões de navegação
        navigationButtons.forEach(button => {
            const isActive = button.dataset.target === targetTabId;
            button.classList.toggle('active', isActive);
        });
        
        // Restaura posição do scroll
        restoreScrollPosition(targetTabId);
        
        // Renderiza módulos específicos da aba
        renderTabModules(targetTabId);
    };
    
    /**
     * Troca para uma aba específica com validação
     * @param {string} targetTabId - ID da aba de destino
     */
    const switchTab = (targetTabId) => {
        const targetPage = document.getElementById(targetTabId);
        
        // Se a aba não existir, volta para o início
        if (!targetPage) {
            console.warn(`Aba ${targetTabId} não encontrada, redirecionando para início`);
            switchTab('inicio');
            return;
        }
        
        // Ativa a aba
        activateTab(targetTabId);
        
        // Salva a aba ativa no localStorage
        Utils.saveToLocalStorage('activeTab', targetTabId);
    };
    
    // ===== INICIALIZAÇÃO =====
    
    /**
     * Configura event listeners para navegação
     */
    const setupEventListeners = () => {
        navigationButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTabId = button.dataset.target;
                if (targetTabId) {
                    switchTab(targetTabId);
                }
            });
        });
    };
    
    /**
     * Inicializa o módulo de navegação
     */
    const init = () => {
        setupEventListeners();
        
        // Carrega a aba salva ou usa 'inicio' como padrão
        const savedTab = Utils.loadFromLocalStorage('activeTab', 'inicio');
        switchTab(savedTab);
        
        // Marca o conteúdo como carregado
        if (contentElement) {
            contentElement.classList.add('js-loaded');
        }
    };
    
    // ===== EXPOSIÇÃO PÚBLICA =====
    
    return {
        init,
        switchTab
    };
})();

// Exporta para uso global
window.Navigation = Navigation;