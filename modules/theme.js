// Life OS - Módulo Theme Completo
const Theme = (() => {
    let isInitialized = false;
    let currentTheme = 'light';
    
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        currentTheme = theme;
        if (typeof Utils !== 'undefined') {
            Utils.saveToLocalStorage('theme', theme);
        } else {
            localStorage.setItem('theme', theme);
        }
    };
    
    const toggleTheme = () => {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    };
    
    const init = () => {
        if (isInitialized) return;
        try {
            // Carregar tema salvo
            let savedTheme = 'light';
            if (typeof Utils !== 'undefined') {
                savedTheme = Utils.loadFromLocalStorage('theme', 'light');
            } else {
                savedTheme = localStorage.getItem('theme') || 'light';
            }
            
            applyTheme(savedTheme);
            
            // Event listener para botão de tema
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', toggleTheme);
            }
            
            isInitialized = true;
            console.log('✅ Theme module initialized');
        } catch (error) {
            console.error('❌ Erro ao inicializar Theme:', error);
        }
    };
    
    const render = () => {
        console.log('Theme rendered');
    };
    
    return { init, render, toggleTheme, applyTheme, isInitialized: () => isInitialized };
})();
