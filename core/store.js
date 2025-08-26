// Life OS - Sistema de Estado Centralizado
// Gerencia todo o estado da aplicação com padrão Observer

const Store = (() => {
    // Estado global da aplicação
    const state = {
        // Navegação
        currentTab: 'inicio',
        scrollPositions: {},
        
        // Tarefas
        tasks: [],
        completedTasks: [],
        completedTasksHistory: [],
        
        // Pomodoro
        pomodoroState: {
            isRunning: false,
            isPaused: false,
            currentTime: 25 * 60, // 25 minutos em segundos
            totalTime: 25 * 60,
            mode: 'work', // 'work', 'shortBreak', 'longBreak'
            completedSessions: 0
        },
        
        // Metas
        goals: [],
        
        // Hábitos
        habits: [],
        habitStreaks: {},
        
        // Humor e Diário
        moodEntries: [],
        journalEntries: [],
        
        // Métricas
        productivityStats: {
            streak: 0,
            dailyGoal: 3,
            weeklyAverage: 0,
            focusMinutes: 0,
            focusSessions: 0
        },
        
        // MITs (Most Important Tasks)
        mits: [],
        
        // Review do dia
        dailyReview: null,
        
        // Finanças
        transactions: [],
        categories: [],
        balance: 0,
        
        // Configurações
        settings: {
            theme: 'light',
            pomodoroDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 15,
            autoStartBreaks: false,
            autoStartPomodoros: false
        }
    };
    
    // Sistema de listeners para notificar mudanças
    const listeners = new Map();
    
    // Métodos para gerenciar o estado
    const getState = () => ({ ...state });
    
    const setState = (path, value) => {
        const pathArray = path.split('.');
        let current = state;
        
        // Navegar até o penúltimo nível
        for (let i = 0; i < pathArray.length - 1; i++) {
            if (!(pathArray[i] in current)) {
                current[pathArray[i]] = {};
            }
            current = current[pathArray[i]];
        }
        
        // Definir o valor final
        const lastKey = pathArray[pathArray.length - 1];
        const oldValue = current[lastKey];
        current[lastKey] = value;
        
        // Notificar listeners
        notify(path, value, oldValue);
        
        // Persistir no localStorage se necessário
        persistState(path);
    };
    
    const updateState = (path, updater) => {
        const currentValue = getNestedValue(state, path);
        const newValue = typeof updater === 'function' ? updater(currentValue) : updater;
        setState(path, newValue);
    };
    
    const getNestedValue = (obj, path) => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    };
    
    // Sistema de listeners
    const subscribe = (path, callback) => {
        if (!listeners.has(path)) {
            listeners.set(path, new Set());
        }
        listeners.get(path).add(callback);
        
        // Retornar função para unsubscribe
        return () => {
            const pathListeners = listeners.get(path);
            if (pathListeners) {
                pathListeners.delete(callback);
                if (pathListeners.size === 0) {
                    listeners.delete(path);
                }
            }
        };
    };
    
    const notify = (path, newValue, oldValue) => {
        // Notificar listeners específicos do path
        if (listeners.has(path)) {
            listeners.get(path).forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error('Erro no listener:', error);
                }
            });
        }
        
        // Notificar listeners globais (path = '*')
        if (listeners.has('*')) {
            listeners.get('*').forEach(callback => {
                try {
                    callback(newValue, oldValue, path);
                } catch (error) {
                    console.error('Erro no listener global:', error);
                }
            });
        }
    };
    
    // Persistência automática no localStorage
    const persistState = (path) => {
        try {
            const value = getNestedValue(state, path);
            const key = `lifeOS_${path.replace(/\./g, '_')}`;
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('Erro ao persistir estado:', error);
        }
    };
    
    // Carregar estado do localStorage
    const loadPersistedState = () => {
        try {
            // Carregar configurações
            const settings = localStorage.getItem('lifeOS_settings');
            if (settings) {
                state.settings = { ...state.settings, ...JSON.parse(settings) };
            }
            
            // Carregar tarefas
            const tasks = localStorage.getItem('lifeOS_tasks');
            if (tasks) {
                state.tasks = JSON.parse(tasks);
            }
            
            // Carregar metas
            const goals = localStorage.getItem('lifeOS_goals');
            if (goals) {
                state.goals = JSON.parse(goals);
            }
            
            // Carregar hábitos
            const habits = localStorage.getItem('lifeOS_habits');
            if (habits) {
                state.habits = JSON.parse(habits);
            }
            
            // Carregar histórico de tarefas completadas
            const completedHistory = localStorage.getItem('lifeOS_completedTasksHistory');
            if (completedHistory) {
                state.completedTasksHistory = JSON.parse(completedHistory);
            }
            
            // Carregar transações financeiras
            const transactions = localStorage.getItem('lifeOS_transactions');
            if (transactions) {
                state.transactions = JSON.parse(transactions);
            }
            
            // Carregar categorias
            const categories = localStorage.getItem('lifeOS_categories');
            if (categories) {
                state.categories = JSON.parse(categories);
            }
            
            // Carregar MITs
            const mits = localStorage.getItem('lifeOS_mits');
            if (mits) {
                state.mits = JSON.parse(mits);
            }
            
            // Carregar review do dia
            const dailyReview = localStorage.getItem('lifeOS_dailyReview');
            if (dailyReview) {
                state.dailyReview = JSON.parse(dailyReview);
            }
            
            // Carregar posições de scroll
            const scrollPositions = localStorage.getItem('lifeOS_scrollPositions');
            if (scrollPositions) {
                state.scrollPositions = JSON.parse(scrollPositions);
            }
            
            // Carregar aba ativa (com fallback para formato antigo)
            let activeTab = localStorage.getItem('lifeOS_currentTab');
            if (!activeTab) {
                // Fallback para formato antigo
                activeTab = localStorage.getItem('activeTab');
            }
            if (activeTab) {
                state.currentTab = activeTab;
            }
            
        } catch (error) {
            console.warn('Erro ao carregar estado persistido:', error);
        }
    };
    
    // Inicializar o store
    const init = () => {
        loadPersistedState();
        
        // Garantir que a aba atual seja válida
        if (!state.currentTab || !['inicio', 'foco', 'bem-estar', 'financas', 'ajustes'].includes(state.currentTab)) {
            state.currentTab = 'inicio';
        }
        
        console.log('✅ Store inicializado com sucesso');
        console.log(`📍 Aba atual: ${state.currentTab}`);
    };
    
    // API pública
    return {
        getState,
        setState,
        updateState,
        subscribe,
        init,
        
        // Métodos de conveniência para operações comuns
        addTask: (task) => {
            const currentTasks = [...state.tasks, task];
            setState('tasks', currentTasks);
        },
        
        removeTask: (taskId) => {
            const currentTasks = state.tasks.filter(task => task.id !== taskId);
            setState('tasks', currentTasks);
        },
        
        updateTask: (taskId, updates) => {
            const currentTasks = state.tasks.map(task => 
                task.id === taskId ? { ...task, ...updates } : task
            );
            setState('tasks', currentTasks);
        },
        
        completeTask: (taskId) => {
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                // Adicionar ao histórico
                const completedTask = {
                    ...task,
                    completedAt: new Date().toISOString(),
                    completedDate: new Date().toISOString().split('T')[0]
                };
                
                const newHistory = [...state.completedTasksHistory, completedTask];
                setState('completedTasksHistory', newHistory);
                
                // Remover da lista de tarefas ativas
                const currentTasks = state.tasks.filter(t => t.id !== taskId);
                setState('tasks', currentTasks);
            }
        },
        
        switchTab: (tabId) => {
            setState('currentTab', tabId);
            // Também salvar no localStorage diretamente para garantir persistência
            localStorage.setItem('lifeOS_currentTab', tabId);
            localStorage.setItem('activeTab', tabId); // Compatibilidade
        },
        
        saveScrollPosition: (tabId, position) => {
            const newScrollPositions = { ...state.scrollPositions, [tabId]: position };
            setState('scrollPositions', newScrollPositions);
        },
        
        getScrollPosition: (tabId) => {
            return state.scrollPositions[tabId] || 0;
        }
    };
})();