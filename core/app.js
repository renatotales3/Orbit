// Life OS - Core Application
// Coordenador principal da aplicação

const App = (() => {
    let isInitialized = false;
    let modules = {};
    let emergencyMode = false;
    
    // Ordem de inicialização dos módulos
    const moduleOrder = [
        'Utils',
        'Store', 
        'Router',
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
        
        moduleOrder.forEach(moduleName => {
            if (typeof window[moduleName] === 'undefined') {
                issues.push(`Módulo ${moduleName} não encontrado`);
            } else if (typeof window[moduleName].isInitialized !== 'function') {
                issues.push(`Módulo ${moduleName} sem método isInitialized`);
            } else if (!window[moduleName].isInitialized()) {
                issues.push(`Módulo ${moduleName} não inicializado`);
            }
        });
        
        if (issues.length > 0) {
            console.warn('🚨 Problemas de saúde detectados:', issues);
            return false;
        }
        
        return true;
    };
    
    // Inicializar módulos com fallback
    const initializeModules = async () => {
        console.log('🔄 Inicializando módulos...');
        
        for (const moduleName of moduleOrder) {
            try {
                if (window[moduleName] && typeof window[moduleName].init === 'function') {
                    window[moduleName].init();
                    modules[moduleName] = window[moduleName];
                    console.log(`✅ ${moduleName} inicializado`);
                } else {
                    console.warn(`⚠️ Módulo ${moduleName} não disponível`);
                }
            } catch (error) {
                console.error(`❌ Erro ao inicializar ${moduleName}:`, error);
            }
        }
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
