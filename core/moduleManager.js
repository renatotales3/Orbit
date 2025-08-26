// Life OS - Sistema de Gerenciamento de Módulos
// Implementa Dependency Injection e controle de ciclo de vida dos módulos

const ModuleManager = (() => {
    // Registro de módulos
    const modules = new Map();
    
    // Dependências de cada módulo
    const dependencies = new Map();
    
    // Estado de inicialização
    const initializationState = new Map();
    
    // Ordem de inicialização (respeitando dependências)
    const initializationOrder = [
        'Utils',
        'Store', 
        'EventBus',
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
    
    // Registrar um módulo
    const register = (name, moduleInstance, deps = []) => {
        try {
            if (modules.has(name)) {
                console.warn(`⚠️ Módulo '${name}' já registrado, sobrescrevendo...`);
            }
            
            modules.set(name, moduleInstance);
            dependencies.set(name, deps);
            initializationState.set(name, 'registered');
            
            console.log(`📦 Módulo '${name}' registrado com dependências: [${deps.join(', ')}]`);
            
        } catch (error) {
            console.error(`❌ Erro ao registrar módulo '${name}':`, error);
        }
    };
    
    // Obter um módulo
    const get = (name) => {
        const module = modules.get(name);
        if (!module) {
            console.warn(`⚠️ Módulo '${name}' não encontrado`);
            return null;
        }
        return module;
    };
    
    // Verificar se um módulo está disponível
    const has = (name) => {
        return modules.has(name);
    };
    
    // Verificar se um módulo está inicializado
    const isInitialized = (name) => {
        const state = initializationState.get(name);
        return state === 'initialized';
    };
    
    // Resolver dependências de um módulo
    const resolveDependencies = (moduleName) => {
        const deps = dependencies.get(moduleName) || [];
        const resolved = {};
        
        for (const dep of deps) {
            const depModule = get(dep);
            if (!depModule) {
                throw new Error(`Dependência '${dep}' não encontrada para módulo '${moduleName}'`);
            }
            
            if (!isInitialized(dep)) {
                throw new Error(`Dependência '${dep}' não inicializada para módulo '${moduleName}'`);
            }
            
            resolved[dep] = depModule;
        }
        
        return resolved;
    };
    
    // Inicializar um módulo específico
    const initializeModule = async (moduleName) => {
        try {
            if (isInitialized(moduleName)) {
                console.debug(`✅ Módulo '${moduleName}' já inicializado`);
                return true;
            }
            
            const module = get(moduleName);
            if (!module) {
                console.error(`❌ Módulo '${moduleName}' não encontrado`);
                return false;
            }
            
            // Verificar se o módulo tem método init
            if (typeof module.init !== 'function') {
                console.warn(`⚠️ Módulo '${moduleName}' não tem método init`);
                initializationState.set(moduleName, 'initialized');
                return true;
            }
            
            // Resolver dependências
            const deps = resolveDependencies(moduleName);
            
            // Marcar como inicializando
            initializationState.set(moduleName, 'initializing');
            
            // Inicializar módulo com dependências injetadas
            if (deps && Object.keys(deps).length > 0) {
                await module.init(deps);
            } else {
                await module.init();
            }
            
            // Marcar como inicializado
            initializationState.set(moduleName, 'initialized');
            
            // Emitir evento de inicialização
            if (typeof EventBus !== 'undefined') {
                EventBus.emit(EVENTS.MODULE_INITIALIZED, { module: moduleName });
            }
            
            console.log(`✅ Módulo '${moduleName}' inicializado com sucesso`);
            return true;
            
        } catch (error) {
            console.error(`❌ Erro ao inicializar módulo '${moduleName}':`, error);
            initializationState.set(moduleName, 'error');
            
            // Emitir evento de erro
            if (typeof EventBus !== 'undefined') {
                EventBus.emit(EVENTS.MODULE_ERROR, { module: moduleName, error });
            }
            
            return false;
        }
    };
    
    // Inicializar todos os módulos na ordem correta
    const initializeAll = async () => {
        console.log('🔄 Inicializando todos os módulos...');
        
        const results = [];
        
        for (const moduleName of initializationOrder) {
            if (has(moduleName)) {
                const success = await initializeModule(moduleName);
                results.push({ module: moduleName, success });
                
                if (!success) {
                    console.warn(`⚠️ Falha na inicialização de '${moduleName}', continuando...`);
                }
            } else {
                console.warn(`⚠️ Módulo '${moduleName}' não registrado, pulando...`);
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        
        console.log(`📊 Inicialização concluída: ${successCount}/${totalCount} módulos inicializados`);
        
        return results;
    };
    
    // Renderizar módulos de uma aba específica
    const renderModulesForTab = async (tabId) => {
        const tabModules = {
            'inicio': [],
            'foco': ['Goals', 'Tasks', 'FocusExtras', 'Pomodoro'],
            'bem-estar': ['Metrics', 'Mood', 'Journal', 'Habits'],
            'financas': ['Finance']
        };
        
        const modulesToRender = tabModules[tabId] || [];
        
        for (const moduleName of modulesToRender) {
            const module = get(moduleName);
            if (module && typeof module.render === 'function' && isInitialized(moduleName)) {
                try {
                    await module.render();
                    
                    // Emitir evento de renderização
                    if (typeof EventBus !== 'undefined') {
                        EventBus.emit(EVENTS.MODULE_RENDERED, { module: moduleName, tab: tabId });
                    }
                    
                } catch (error) {
                    console.error(`❌ Erro ao renderizar módulo '${moduleName}':`, error);
                }
            }
        }
    };
    
    // Listar todos os módulos registrados
    const listModules = () => {
        const list = {};
        modules.forEach((module, name) => {
            list[name] = {
                state: initializationState.get(name),
                hasInit: typeof module.init === 'function',
                hasRender: typeof module.render === 'function',
                dependencies: dependencies.get(name) || []
            };
        });
        return list;
    };
    
    // Limpar todos os módulos (para testes)
    const clear = () => {
        modules.clear();
        dependencies.clear();
        initializationState.clear();
        console.log('🧹 Todos os módulos foram removidos');
    };
    
    return {
        register,
        get,
        has,
        isInitialized,
        initializeModule,
        initializeAll,
        renderModulesForTab,
        listModules,
        clear
    };
})();