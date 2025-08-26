// Life OS - Sistema de Eventos Centralizado
// Implementa o padrão Event Bus para comunicação desacoplada entre módulos

const EventBus = (() => {
    // Registro de event listeners
    const listeners = new Map();
    
    // Contador para IDs únicos de listeners
    let listenerIdCounter = 0;
    
    // Emitir evento
    const emit = (event, data = null) => {
        try {
            const eventListeners = listeners.get(event) || [];
            
            if (eventListeners.length === 0) {
                console.debug(`📡 Evento '${event}' emitido, mas sem listeners`);
                return;
            }
            
            console.debug(`📡 Emitindo evento '${event}':`, data);
            
            // Executar todos os listeners registrados para este evento
            eventListeners.forEach(({ id, handler, module }) => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`❌ Erro no listener ${id} (${module}) para evento '${event}':`, error);
                }
            });
            
        } catch (error) {
            console.error(`❌ Erro ao emitir evento '${event}':`, error);
        }
    };
    
    // Registrar listener para um evento
    const on = (event, handler, module = 'unknown') => {
        if (!listeners.has(event)) {
            listeners.set(event, []);
        }
        
        const listenerId = ++listenerIdCounter;
        const listener = { id: listenerId, handler, module };
        
        listeners.get(event).push(listener);
        
        console.debug(`📡 Listener ${listenerId} (${module}) registrado para evento '${event}'`);
        
        // Retornar função para remover o listener
        return () => off(event, listenerId);
    };
    
    // Remover listener específico
    const off = (event, listenerId) => {
        const eventListeners = listeners.get(event);
        if (!eventListeners) return;
        
        const index = eventListeners.findIndex(listener => listener.id === listenerId);
        if (index !== -1) {
            const removed = eventListeners.splice(index, 1)[0];
            console.debug(`📡 Listener ${listenerId} (${removed.module}) removido do evento '${event}'`);
        }
    };
    
    // Remover todos os listeners de um evento
    const offAll = (event) => {
        if (listeners.has(event)) {
            const count = listeners.get(event).length;
            listeners.delete(event);
            console.debug(`📡 Todos os ${count} listeners removidos do evento '${event}'`);
        }
    };
    
    // Limpar todos os listeners
    const clear = () => {
        const totalListeners = Array.from(listeners.values()).reduce((sum, listeners) => sum + listeners.length, 0);
        listeners.clear();
        console.debug(`📡 Todos os ${totalListeners} listeners foram removidos`);
    };
    
    // Listar todos os eventos registrados (para debug)
    const listEvents = () => {
        const events = {};
        listeners.forEach((eventListeners, event) => {
            events[event] = eventListeners.map(l => ({ id: l.id, module: l.module }));
        });
        return events;
    };
    
    // Verificar se há listeners para um evento
    const hasListeners = (event) => {
        return listeners.has(event) && listeners.get(event).length > 0;
    };
    
    return {
        emit,
        on,
        off,
        offAll,
        clear,
        listEvents,
        hasListeners
    };
})();

// Eventos padrão do sistema
const EVENTS = {
    // Navegação
    NAVIGATION_CHANGED: 'navigation:changed',
    TAB_SWITCHED: 'tab:switched',
    SCROLL_POSITION_SAVED: 'scroll:position:saved',
    
    // Estado
    STATE_CHANGED: 'state:changed',
    DATA_LOADED: 'data:loaded',
    DATA_SAVED: 'data:saved',
    
    // Módulos
    MODULE_INITIALIZED: 'module:initialized',
    MODULE_RENDERED: 'module:rendered',
    MODULE_ERROR: 'module:error',
    
    // Tarefas
    TASK_ADDED: 'task:added',
    TASK_COMPLETED: 'task:completed',
    TASK_DELETED: 'task:deleted',
    
    // Pomodoro
    POMODORO_STARTED: 'pomodoro:started',
    POMODORO_PAUSED: 'pomodoro:paused',
    POMODORO_COMPLETED: 'pomodoro:completed',
    
    // Metas
    GOAL_ADDED: 'goal:added',
    GOAL_UPDATED: 'goal:updated',
    GOAL_COMPLETED: 'goal:completed',
    
    // Hábitos
    HABIT_TRACKED: 'habit:tracked',
    HABIT_STREAK_UPDATED: 'habit:streak:updated',
    
    // Humor
    MOOD_RECORDED: 'mood:recorded',
    
    // Diário
    JOURNAL_ENTRY_ADDED: 'journal:entry:added',
    
    // Finanças
    TRANSACTION_ADDED: 'transaction:added',
    BALANCE_UPDATED: 'balance:updated',
    
    // Sistema
    APP_READY: 'app:ready',
    THEME_CHANGED: 'theme:changed',
    ERROR_OCCURRED: 'error:occurred'
};