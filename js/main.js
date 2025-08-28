/**
 * MÓDULO PRINCIPAL - CONTROLADOR DO APP
 * 
 * Responsabilidades:
 * - Inicialização de todos os módulos
 * - Orquestração do fluxo da aplicação
 * - Gerenciamento de dependências
 * - Controle de estado global
 * 
 * Refatoração aplicada:
 * - Separação de responsabilidades
 * - Nomes de variáveis mais descritivos
 * - Comentários explicativos
 * - Lógica de inicialização otimizada
 * - Código ES6+ moderno
 */

const App = (() => {
    
    // ===== CONFIGURAÇÕES =====
    const MODULES = {
        // Módulos refatorados (carregados via script tags)
        utils: 'Utils',
        navigation: 'Navigation',
        theme: 'Theme',
        tasks: 'Tasks',
        pomodoro: 'Pomodoro',
        goals: 'Goals',
        habits: 'Habits',
        mood: 'Mood',
        metrics: 'Metrics',
        focusExtras: 'FocusExtras',
        finance: 'Finance'
    };
    
    // ===== UTILITÁRIOS =====
    
    /**
     * Verifica se um módulo está disponível
     * @param {string} moduleName - Nome do módulo
     * @returns {boolean} Se o módulo está disponível
     */
    const isModuleAvailable = (moduleName) => {
        return window[moduleName] && typeof window[moduleName].init === 'function';
    };
    
    /**
     * Inicializa um módulo com tratamento de erro
     * @param {string} moduleName - Nome do módulo
     * @param {string} displayName - Nome para exibição
     */
    const initializeModule = (moduleName, displayName) => {
        try {
            if (isModuleAvailable(moduleName)) {
                window[moduleName].init();
                console.log(`✅ ${displayName} inicializado com sucesso`);
            } else {
                console.warn(`⚠️ ${displayName} não encontrado ou não disponível`);
            }
        } catch (error) {
            console.error(`❌ Erro ao inicializar ${displayName}:`, error);
        }
    };
    
    /**
     * Inicializa módulos refatorados
     */
    const initializeRefactoredModules = () => {
        console.log('🚀 Inicializando módulos refatorados...');
        
        // Ordem de inicialização importante
        const initializationOrder = [
            { name: 'Utils', display: 'Utilitários' },
            { name: 'Navigation', display: 'Navegação' },
            { name: 'Theme', display: 'Tema' },
            { name: 'Tasks', display: 'Tarefas' },
            { name: 'Pomodoro', display: 'Pomodoro' },
            { name: 'Goals', display: 'Metas' },
            { name: 'Habits', display: 'Hábitos' },
            { name: 'Mood', display: 'Humor' },
            { name: 'Metrics', display: 'Métricas' },
            { name: 'FocusExtras', display: 'Extras do Foco' },
            { name: 'Finance', display: 'Finanças' }
        ];
        
        initializationOrder.forEach(module => {
            initializeModule(module.name, module.display);
        });
    };
    
    /**
     * Inicializa módulos não refatorados (ainda no script.js)
     */
    const initializeLegacyModules = () => {
        console.log('🔄 Inicializando módulos legados...');
        
        // Módulos que ainda estão no script.js original
        const legacyModules = [
            { name: 'DailyData', display: 'Dados Diários' },
            { name: 'Journal', display: 'Reflexão Diária' }
        ];
        
        legacyModules.forEach(module => {
            initializeModule(module.name, module.display);
        });
    };
    
    /**
     * Configura estado inicial da aplicação
     */
    const setupInitialState = () => {
        console.log('⚙️ Configurando estado inicial...');
        
        // Carrega aba ativa salva
        const savedTab = Utils.loadFromLocalStorage('activeTab', 'inicio');
        
        // Inicializa navegação
        if (isModuleAvailable('Navigation')) {
            Navigation.switchTab(savedTab);
        }
        
        // Marca conteúdo como carregado
        const contentElement = document.querySelector('.content');
        if (contentElement) {
            contentElement.classList.add('js-loaded');
        }
    };
    
    /**
     * Verifica integridade dos módulos
     */
    const verifyModuleIntegrity = () => {
        console.log('🔍 Verificando integridade dos módulos...');
        
        const requiredModules = Object.values(MODULES);
        const missingModules = requiredModules.filter(moduleName => !isModuleAvailable(moduleName));
        
        if (missingModules.length > 0) {
            console.warn('⚠️ Módulos não encontrados:', missingModules);
        } else {
            console.log('✅ Todos os módulos refatorados estão disponíveis');
        }
    };
    
    /**
     * Configura listeners globais
     */
    const setupGlobalListeners = () => {
        console.log('🎧 Configurando listeners globais...');
        
        // Listener para mudanças de tema
        document.addEventListener('themeChanged', () => {
            console.log('🎨 Tema alterado, atualizando componentes...');
            // Aqui você pode adicionar lógica para atualizar componentes que dependem do tema
        });
        
        // Listener para mudanças de dados
        document.addEventListener('dataChanged', (event) => {
            console.log('📊 Dados alterados:', event.detail);
            // Aqui você pode adicionar lógica para sincronizar dados entre módulos
        });
    };
    
    /**
     * Exibe informações de inicialização
     */
    const showInitializationInfo = () => {
        console.log(`
🎉 ORBIT - Sistema de Produtividade Pessoal
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 Versão: Refatorada (Modular)
🔧 Módulos: ${Object.keys(MODULES).length} refatorados
🚀 Status: Inicializado com sucesso
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
    };
    
    // ===== INICIALIZAÇÃO PRINCIPAL =====
    
    /**
     * Inicializa a aplicação
     */
    const init = () => {
        console.log('🚀 Iniciando ORBIT - Sistema de Produtividade Pessoal');
        
        try {
            // Verifica integridade dos módulos
            verifyModuleIntegrity();
            
            // Inicializa módulos refatorados
            initializeRefactoredModules();
            
            // Inicializa módulos legados (se necessário)
            initializeLegacyModules();
            
            // Configura estado inicial
            setupInitialState();
            
            // Configura listeners globais
            setupGlobalListeners();
            
            // Exibe informações de inicialização
            showInitializationInfo();
            
        } catch (error) {
            console.error('❌ Erro crítico durante inicialização:', error);
            
            // Tenta recuperação básica
            try {
                console.log('🔄 Tentando recuperação...');
                setupInitialState();
            } catch (recoveryError) {
                console.error('❌ Falha na recuperação:', recoveryError);
            }
        }
    };
    
    // ===== UTILITÁRIOS PÚBLICOS =====
    
    /**
     * Reinicializa um módulo específico
     * @param {string} moduleName - Nome do módulo
     */
    const reinitializeModule = (moduleName) => {
        if (isModuleAvailable(moduleName)) {
            console.log(`🔄 Reinicializando módulo: ${moduleName}`);
            window[moduleName].init();
        } else {
            console.warn(`⚠️ Módulo ${moduleName} não encontrado`);
        }
    };
    
    /**
     * Obtém status dos módulos
     * @returns {Object} Status de cada módulo
     */
    const getModuleStatus = () => {
        const status = {};
        
        Object.entries(MODULES).forEach(([key, moduleName]) => {
            status[key] = {
                available: isModuleAvailable(moduleName),
                hasInit: isModuleAvailable(moduleName) && typeof window[moduleName].init === 'function',
                hasRender: isModuleAvailable(moduleName) && typeof window[moduleName].render === 'function'
            };
        });
        
        return status;
    };
    
    // ===== EXPOSIÇÃO PÚBLICA =====
    
    return {
        init,
        reinitializeModule,
        getModuleStatus
    };
})();

// ===== INICIALIZAÇÃO AUTOMÁTICA =====

// Aguarda o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Exporta para uso global
window.App = App;