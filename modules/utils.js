// Life OS - Módulo Utils Completo
// Sistema de fallbacks e compatibilidade

const Utils = (() => {
    let isInitialized = false;
    
    // Fallback para localStorage
    const safeLocalStorage = {
        getItem: (key, defaultValue = null) => {
            try {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : defaultValue;
            } catch (error) {
                console.warn(`Erro ao ler localStorage para ${key}:`, error);
                return defaultValue;
            }
        },
        
        setItem: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.warn(`Erro ao salvar localStorage para ${key}:`, error);
                return false;
            }
        },
        
        removeItem: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.warn(`Erro ao remover localStorage para ${key}:`, error);
                return false;
            }
        }
    };
    
    // Funções de compatibilidade
    const loadFromLocalStorage = (key, defaultValue = null) => {
        return safeLocalStorage.getItem(key, defaultValue);
    };
    
    const saveToLocalStorage = (key, value) => {
        return safeLocalStorage.setItem(key, value);
    };
    
    const removeFromLocalStorage = (key) => {
        return safeLocalStorage.removeItem(key);
    };
    
    // Funções de data
    const getTodayString = () => {
        return new Date().toISOString().split('T')[0];
    };
    
    const formatDateToBR = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        } catch (error) {
            return dateString;
        }
    };
    
    // Sistema de notificações
    const showNotification = (message, type = 'info') => {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        try {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem;
                border-radius: 0.5rem;
                color: white;
                z-index: 10000;
                max-width: 300px;
                word-wrap: break-word;
                background-color: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
            
        } catch (error) {
            console.warn('Erro ao criar notificação visual:', error);
        }
    };
    
    // Sistema de health check
    const healthCheck = () => {
        const issues = [];
        
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
        } catch (error) {
            issues.push('localStorage não disponível');
        }
        
        if (!document.body) {
            issues.push('DOM não carregado');
        }
        
        const requiredModules = ['Tasks', 'Goals', 'Habits', 'Mood', 'Journal'];
        requiredModules.forEach(moduleName => {
            if (typeof window[moduleName] === 'undefined') {
                issues.push(`Módulo ${moduleName} não encontrado`);
            }
        });
        
        if (issues.length > 0) {
            console.warn('🚨 Problemas detectados:', issues);
            showNotification(`Problemas detectados: ${issues.join(', ')}`, 'warning');
        } else {
            console.log('✅ Health check passou');
        }
        
        return issues;
    };
    
    // Inicializar módulo
    const init = () => {
        if (isInitialized) return;
        
        try {
            healthCheck();
            
            window.Utils = {
                loadFromLocalStorage,
                saveToLocalStorage,
                removeFromLocalStorage,
                getTodayString,
                formatDateToBR,
                showNotification,
                healthCheck
            };
            
            isInitialized = true;
            console.log('✅ Utils module initialized');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Utils:', error);
        }
    };
    
    return {
        init,
        loadFromLocalStorage,
        saveToLocalStorage,
        removeFromLocalStorage,
        getTodayString,
        formatDateToBR,
        showNotification,
        healthCheck,
        isInitialized: () => isInitialized
    };
})();
