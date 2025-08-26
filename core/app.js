// Life OS - Core Application
// Coordenador principal da aplicação com nova arquitetura

const App = (() => {
    let isInitialized = false;
    let emergencyMode = false;
    
    // Ordem de inicialização dos módulos (usando ModuleManager)
    const moduleOrder = [
        'Utils',
        'Store', 
        'EventBus',
        'ModuleManager',
        'Router',
        'Theme',
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
    
    // Sistema de recuperação de emergência
    const emergencyRecovery = () => {
        console.warn('🚨 ATIVANDO MODO DE EMERGÊNCIA');
        emergencyMode = true;
        
        // Verificar se script original ainda funciona
        if (typeof window.Navigation !== 'undefined' && typeof window.Navigation.switchTab === 'function') {
            console.log('✅ Script original disponível - usando como fallback');
            return true;
        }
        
        // Tentar restaurar funcionalidade básica
        try {
            if (confirm('A aplicação está com problemas. Deseja recarregar a página?')) {
                window.location.reload();
                return true;
            }
        } catch (error) {
            console.error('❌ Falha na recuperação de emergência:', error);
        }
        
        return false;
    };
    
    // Verificar saúde dos módulos
    const healthCheck = () => {
        const issues = [];
        
        // Verificar se ModuleManager está disponível
        if (typeof ModuleManager === 'undefined') {
            issues.push('ModuleManager não encontrado');
            return false;
        }
        
        // Verificar módulos críticos
        const criticalModules = ['Utils', 'Store', 'EventBus', 'Router'];
        criticalModules.forEach(moduleName => {
            if (!ModuleManager.has(moduleName)) {
                issues.push(`Módulo crítico ${moduleName} não registrado`);
            } else if (!ModuleManager.isInitialized(moduleName)) {
                issues.push(`Módulo crítico ${moduleName} não inicializado`);
            }
        });
        
        if (issues.length > 0) {
            console.warn('🚨 Problemas de saúde detectados:', issues);
            return false;
        }
        
        return true;
    };
    
    // Inicializar módulos usando ModuleManager
    const initializeModules = async () => {
        console.log('🔄 Inicializando módulos com ModuleManager...');
        
        try {
            // Registrar módulos disponíveis no ModuleManager
            moduleOrder.forEach(moduleName => {
                if (window[moduleName]) {
                    const dependencies = getModuleDependencies(moduleName);
                    ModuleManager.register(moduleName, window[moduleName], dependencies);
                }
            });
            
            // Inicializar todos os módulos
            const results = await ModuleManager.initializeAll();
            
            const successCount = results.filter(r => r.success).length;
            console.log(`📊 Inicialização concluída: ${successCount}/${results.length} módulos`);
            
        } catch (error) {
            console.error('❌ Erro na inicialização dos módulos:', error);
        }
    };
    
    // Obter dependências de um módulo
    const getModuleDependencies = (moduleName) => {
        const dependencyMap = {
            'Router': ['EventBus'],
            'Tasks': ['Store', 'EventBus'],
            'Goals': ['Store', 'EventBus'],
            'Habits': ['Store', 'EventBus'],
            'Mood': ['Store', 'EventBus'],
            'Journal': ['Store', 'EventBus'],
            'Finance': ['Store', 'EventBus'],
            'Pomodoro': ['Store', 'EventBus'],
            'Theme': ['EventBus']
        };
        
        return dependencyMap[moduleName] || [];
    };
    
    // Configurar navegação inicial
    const setupInitialNavigation = () => {
        try {
            const savedTab = localStorage.getItem('lifeOS_currentTab') || 
                           localStorage.getItem('activeTab') || 'inicio';
            
            if (typeof Router !== 'undefined' && Router.navigateToTab) {
                Router.navigateToTab(savedTab);
            } else if (typeof Navigation !== 'undefined' && Navigation.switchTab) {
                Navigation.switchTab(savedTab);
            }
            
        } catch (error) {
            console.error('❌ Erro ao configurar navegação inicial:', error);
        }
    };
    
    // Fallback manual para troca de abas
    const manualTabSwitch = (tabId) => {
        try {
            if (typeof Navigation !== 'undefined' && Navigation.switchTab) {
                Navigation.switchTab(tabId);
            } else if (typeof Router !== 'undefined' && Router.navigateToTab) {
                Router.navigateToTab(tabId);
            } else {
                // Fallback direto
                const pages = document.querySelectorAll('.page');
                const navButtons = document.querySelectorAll('.nav-btn');
                
                pages.forEach(p => p.classList.remove('active'));
                navButtons.forEach(b => b.classList.remove('active'));
                
                const targetPage = document.getElementById(tabId);
                const targetButton = document.querySelector(`[data-target="${tabId}"]`);
                
                if (targetPage) targetPage.classList.add('active');
                if (targetButton) targetButton.classList.add('active');
                
                localStorage.setItem('activeTab', tabId);
                localStorage.setItem('lifeOS_currentTab', tabId);
            }
        } catch (error) {
            console.error('❌ Erro no fallback de navegação:', error);
        }
    };
    
    // Inicializar aplicação
    const init = async () => {
        if (isInitialized) return;
        
        try {
            console.log('🚀 Inicializando Life OS...');
            
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            await initializeModules();
            setupInitialNavigation();
            
            // Event listeners de navegação
            document.addEventListener('click', (e) => {
                const navBtn = e.target.closest('.nav-btn');
                if (navBtn && navBtn.dataset.target) {
                    manualTabSwitch(navBtn.dataset.target);
                }
            });
            
            isInitialized = true;
            console.log('✅ Life OS inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ Erro crítico na inicialização:', error);
            emergencyRecovery();
        }
    };
    
    return {
        init,
        healthCheck,
        emergencyRecovery,
        manualTabSwitch,
        isInitialized: () => isInitialized,
        isEmergencyMode: () => emergencyMode
    };
})();
