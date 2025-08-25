// Life OS - Utilitários de Storage
// Wrapper robusto para localStorage com fallbacks e tratamento de erros

const Storage = (() => {
    // Verificar se localStorage está disponível
    const isAvailable = () => {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    };
    
    // Fallback para quando localStorage não está disponível
    const fallbackStorage = new Map();
    
    // Salvar dados no storage
    const save = (key, value) => {
        try {
            if (isAvailable()) {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } else {
                // Usar fallback
                fallbackStorage.set(key, value);
                return true;
            }
        } catch (error) {
            console.warn('Erro ao salvar no storage:', error);
            return false;
        }
    };
    
    // Carregar dados do storage
    const load = (key, defaultValue = null) => {
        try {
            if (isAvailable()) {
                const item = localStorage.getItem(key);
                if (item === null || item === undefined) {
                    return defaultValue;
                }
                return JSON.parse(item);
            } else {
                // Usar fallback
                return fallbackStorage.has(key) ? fallbackStorage.get(key) : defaultValue;
            }
        } catch (error) {
            console.warn('Erro ao carregar do storage:', error);
            // Tentar limpar item corrompido
            try {
                if (isAvailable()) {
                    localStorage.removeItem(key);
                } else {
                    fallbackStorage.delete(key);
                }
            } catch (cleanupError) {
                console.warn('Erro ao limpar item corrompido:', cleanupError);
            }
            return defaultValue;
        }
    };
    
    // Remover dados do storage
    const remove = (key) => {
        try {
            if (isAvailable()) {
                localStorage.removeItem(key);
            } else {
                fallbackStorage.delete(key);
            }
            return true;
        } catch (error) {
            console.warn('Erro ao remover do storage:', error);
            return false;
        }
    };
    
    // Verificar se uma chave existe
    const has = (key) => {
        try {
            if (isAvailable()) {
                return localStorage.getItem(key) !== null;
            } else {
                return fallbackStorage.has(key);
            }
        } catch (error) {
            console.warn('Erro ao verificar chave no storage:', error);
            return false;
        }
    };
    
    // Obter todas as chaves
    const keys = () => {
        try {
            if (isAvailable()) {
                return Object.keys(localStorage);
            } else {
                return Array.from(fallbackStorage.keys());
            }
        } catch (error) {
            console.warn('Erro ao obter chaves do storage:', error);
            return [];
        }
    };
    
    // Limpar todo o storage
    const clear = () => {
        try {
            if (isAvailable()) {
                localStorage.clear();
            } else {
                fallbackStorage.clear();
            }
            return true;
        } catch (error) {
            console.warn('Erro ao limpar storage:', error);
            return false;
        }
    };
    
    // Obter tamanho do storage
    const size = () => {
        try {
            if (isAvailable()) {
                return localStorage.length;
            } else {
                return fallbackStorage.size;
            }
        } catch (error) {
            console.warn('Erro ao obter tamanho do storage:', error);
            return 0;
        }
    };
    
    // Salvar com prefixo do Life OS
    const saveLifeOS = (key, value) => {
        return save(`lifeOS_${key}`, value);
    };
    
    // Carregar com prefixo do Life OS
    const loadLifeOS = (key, defaultValue = null) => {
        return load(`lifeOS_${key}`, defaultValue);
    };
    
    // Remover com prefixo do Life OS
    const removeLifeOS = (key) => {
        return remove(`lifeOS_${key}`);
    };
    
    // Verificar se existe com prefixo do Life OS
    const hasLifeOS = (key) => {
        return has(`lifeOS_${key}`);
    };
    
    // Obter todas as chaves do Life OS
    const getLifeOSKeys = () => {
        try {
            if (isAvailable()) {
                return Object.keys(localStorage)
                    .filter(key => key.startsWith('lifeOS_'))
                    .map(key => key.replace('lifeOS_', ''));
            } else {
                return Array.from(fallbackStorage.keys())
                    .filter(key => key.startsWith('lifeOS_'))
                    .map(key => key.replace('lifeOS_', ''));
            }
        } catch (error) {
            console.warn('Erro ao obter chaves do Life OS:', error);
            return [];
        }
    };
    
    // Limpar apenas dados do Life OS
    const clearLifeOS = () => {
        try {
            const lifeOSKeys = getLifeOSKeys();
            let successCount = 0;
            
            lifeOSKeys.forEach(key => {
                if (removeLifeOS(key)) {
                    successCount++;
                }
            });
            
            console.log(`🧹 Limpou ${successCount} chaves do Life OS`);
            return successCount;
        } catch (error) {
            console.warn('Erro ao limpar dados do Life OS:', error);
            return 0;
        }
    };
    
    // Migrar dados antigos para novo formato
    const migrateOldData = () => {
        try {
            const migrations = [
                // Migração de 'activeTab' para 'currentTab'
                {
                    oldKey: 'activeTab',
                    newKey: 'currentTab',
                    transform: (value) => value
                },
                // Migração de 'scrollPositions' para novo formato
                {
                    oldKey: 'scrollPositions',
                    newKey: 'scrollPositions',
                    transform: (value) => {
                        if (typeof value === 'string') {
                            try {
                                return JSON.parse(value);
                            } catch {
                                return {};
                            }
                        }
                        return value || {};
                    }
                }
            ];
            
            let migratedCount = 0;
            
            migrations.forEach(migration => {
                if (has(migration.oldKey)) {
                    const oldValue = load(migration.oldKey);
                    const newValue = migration.transform(oldValue);
                    
                    if (saveLifeOS(migration.newKey, newValue)) {
                        remove(migration.oldKey);
                        migratedCount++;
                        console.log(`🔄 Migrou: ${migration.oldKey} → ${migration.newKey}`);
                    }
                }
            });
            
            if (migratedCount > 0) {
                console.log(`✅ Migração concluída: ${migratedCount} itens`);
            }
            
            return migratedCount;
        } catch (error) {
            console.warn('Erro durante migração:', error);
            return 0;
        }
    };
    
    // Backup de dados para string
    const exportData = () => {
        try {
            const lifeOSKeys = getLifeOSKeys();
            const data = {};
            
            lifeOSKeys.forEach(key => {
                data[key] = loadLifeOS(key);
            });
            
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.warn('Erro ao exportar dados:', error);
            return null;
        }
    };
    
    // Restaurar dados de string
    const importData = (jsonString) => {
        try {
            const data = JSON.parse(jsonString);
            let importedCount = 0;
            
            Object.entries(data).forEach(([key, value]) => {
                if (saveLifeOS(key, value)) {
                    importedCount++;
                }
            });
            
            console.log(`📥 Importou ${importedCount} itens`);
            return importedCount;
        } catch (error) {
            console.warn('Erro ao importar dados:', error);
            return 0;
        }
    };
    
    // Inicializar o módulo
    const init = () => {
        // Executar migração se necessário
        migrateOldData();
        
        console.log('✅ Storage inicializado com sucesso');
        console.log(`📊 Storage disponível: ${isAvailable() ? 'localStorage' : 'fallback'}`);
        console.log(`🔑 Chaves Life OS: ${getLifeOSKeys().length}`);
    };
    
    // API pública
    return {
        // Métodos básicos
        save,
        load,
        remove,
        has,
        keys,
        clear,
        size,
        
        // Métodos específicos do Life OS
        saveLifeOS,
        loadLifeOS,
        removeLifeOS,
        hasLifeOS,
        getLifeOSKeys,
        clearLifeOS,
        
        // Utilitários
        migrateOldData,
        exportData,
        importData,
        init,
        isAvailable
    };
})();