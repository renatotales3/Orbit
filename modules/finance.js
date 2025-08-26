// Life OS - Módulo Finance Completo
const Finance = (() => {
    let isInitialized = false;
    const init = () => {
        if (isInitialized) return;
        try {
            isInitialized = true;
            console.log('✅ Finance module initialized');
        } catch (error) {
            console.error('❌ Erro ao inicializar Finance:', error);
        }
    };
    const render = () => {
        console.log('Finance rendered');
    };
    return { init, render, isInitialized: () => isInitialized };
})();
