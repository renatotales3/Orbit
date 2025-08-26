// Life OS - Sistema de Lazy Loading
// Carrega módulos sob demanda para melhorar performance

const LazyLoader = (() => {
    // Cache de módulos carregados
    const loadedModules = new Map();
    
    // Módulos em processo de carregamento
    const loadingModules = new Map();
    
    // Configuração de módulos
    const moduleConfig = {
        'Utils': { path: 'utils/', priority: 'critical' },
        'Store': { path: 'core/', priority: 'critical' },
        'EventBus': { path: 'core/', priority: 'critical' },
        'Router': { path: 'core/', priority: 'critical' },
        'ModuleManager': { path: 'core/', priority: 'critical' },
        'Theme': { path: 'modules/', priority: 'high' },
        'Navigation': { path: 'modules/', priority: 'high' },
        'Pomodoro': { path: 'modules/', priority: 'medium' },
        'Tasks': { path: 'modules/', priority: 'medium' },
        'Goals': { path: 'modules/', priority: 'medium' },
        'Habits': { path: 'modules/', priority: 'low' },
        'Mood': { path: 'modules/', priority: 'low' },
        'Journal': { path: 'modules/', priority: 'low' },
        'Metrics': { path: 'modules/', priority: 'low' },
        'FocusExtras': { path: 'modules/', priority: 'low' },
        'Finance': { path: 'modules/', priority: 'low' }
    };
    
    // Carregar um módulo específico
    const loadModule = async (moduleName) => {
        try {
            // Verificar se já está carregado
            if (loadedModules.has(moduleName)) {
                console.debug(`📦 Módulo '${moduleName}' já carregado`);
                return loadedModules.get(moduleName);
            }
            
            // Verificar se está em processo de carregamento
            if (loadingModules.has(moduleName)) {
                console.debug(`⏳ Módulo '${moduleName}' em carregamento, aguardando...`);
                return loadingModules.get(moduleName);
            }
            
            // Verificar se o módulo existe na configuração
            const config = moduleConfig[moduleName];
            if (!config) {
                throw new Error(`Módulo '${moduleName}' não configurado`);
            }
            
            console.log(`📦 Carregando módulo '${moduleName}'...`);
            
            // Criar promise de carregamento
            const loadPromise = createLoadPromise(moduleName, config);
            loadingModules.set(moduleName, loadPromise);
            
            // Aguardar carregamento
            const module = await loadPromise;
            
            // Adicionar ao cache
            loadedModules.set(moduleName, module);
            loadingModules.delete(moduleName);
            
            console.log(`✅ Módulo '${moduleName}' carregado com sucesso`);
            
            // Emitir evento de carregamento
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('module:loaded', { module: moduleName });
            }
            
            return module;
            
        } catch (error) {
            console.error(`❌ Erro ao carregar módulo '${moduleName}':`, error);
            loadingModules.delete(moduleName);
            
            // Emitir evento de erro
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('module:load:error', { module: moduleName, error });
            }
            
            throw error;
        }
    };
    
    // Criar promise de carregamento
    const createLoadPromise = (moduleName, config) => {
        return new Promise((resolve, reject) => {
            // Para módulos já disponíveis no window (carregamento síncrono)
            if (window[moduleName]) {
                resolve(window[moduleName]);
                return;
            }
            
            // Para módulos que precisam ser carregados dinamicamente
            const script = document.createElement('script');
            script.src = `${config.path}${moduleName.toLowerCase()}.js`;
            script.async = true;
            
            script.onload = () => {
                // Aguardar um frame para garantir que o módulo foi inicializado
                setTimeout(() => {
                    if (window[moduleName]) {
                        resolve(window[moduleName]);
                    } else {
                        reject(new Error(`Módulo '${moduleName}' não encontrado após carregamento`));
                    }
                }, 10);
            };
            
            script.onerror = () => {
                reject(new Error(`Falha ao carregar script para módulo '${moduleName}'`));
            };
            
            document.head.appendChild(script);
        });
    };
    
    // Carregar módulos críticos
    const loadCriticalModules = async () => {
        const criticalModules = Object.keys(moduleConfig)
            .filter(name => moduleConfig[name].priority === 'critical');
        
        console.log('🚀 Carregando módulos críticos...');
        
        const results = [];
        for (const moduleName of criticalModules) {
            try {
                const module = await loadModule(moduleName);
                results.push({ module: moduleName, success: true, moduleInstance: module });
            } catch (error) {
                results.push({ module: moduleName, success: false, error });
            }
        }
        
        return results;
    };
    
    // Carregar módulos por prioridade
    const loadModulesByPriority = async (priority) => {
        const modules = Object.keys(moduleConfig)
            .filter(name => moduleConfig[name].priority === priority);
        
        console.log(`📦 Carregando módulos de prioridade '${priority}'...`);
        
        const results = [];
        for (const moduleName of modules) {
            try {
                const module = await loadModule(moduleName);
                results.push({ module: moduleName, success: true, moduleInstance: module });
            } catch (error) {
                results.push({ module: moduleName, success: false, error });
            }
        }
        
        return results;
    };
    
    // Pré-carregar módulos em background
    const preloadModules = async (moduleNames) => {
        console.log('🔄 Pré-carregando módulos em background...');
        
        const promises = moduleNames.map(async (moduleName) => {
            try {
                await loadModule(moduleName);
                return { module: moduleName, success: true };
            } catch (error) {
                return { module: moduleName, success: false, error };
            }
        });
        
        // Executar em paralelo, mas não aguardar
        Promise.allSettled(promises).then(results => {
            const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            console.log(`✅ Pré-carregamento concluído: ${successCount}/${moduleNames.length} módulos`);
        });
    };
    
    // Verificar se um módulo está carregado
    const isLoaded = (moduleName) => {
        return loadedModules.has(moduleName);
    };
    
    // Verificar se um módulo está carregando
    const isLoading = (moduleName) => {
        return loadingModules.has(moduleName);
    };
    
    // Obter módulo carregado
    const getLoadedModule = (moduleName) => {
        return loadedModules.get(moduleName);
    };
    
    // Listar módulos carregados
    const getLoadedModules = () => {
        return Array.from(loadedModules.keys());
    };
    
    // Limpar cache (para testes)
    const clearCache = () => {
        loadedModules.clear();
        loadingModules.clear();
        console.log('🧹 Cache de módulos limpo');
    };
    
    return {
        loadModule,
        loadCriticalModules,
        loadModulesByPriority,
        preloadModules,
        isLoaded,
        isLoading,
        getLoadedModule,
        getLoadedModules,
        clearCache
    };
})();