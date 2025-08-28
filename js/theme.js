/**
 * MÓDULO DE TEMA E CORES
 * 
 * Responsabilidades:
 * - Controle de tema claro/escuro
 * - Gerenciamento de cores de destaque
 * - Persistência de preferências
 * - Renderização de paletas de cores
 * 
 * Refatoração aplicada:
 * - Separação de responsabilidades
 * - Nomes de variáveis mais descritivos
 * - Comentários explicativos
 * - Lógica de cores otimizada
 * - Código ES6+ moderno
 */

const Theme = (() => {
    
    // ===== ELEMENTOS DOM =====
    const htmlElement = document.documentElement;
    const themeToggleButton = document.getElementById('theme-toggle');
    const lightThemePalette = document.getElementById('light-theme-palette');
    const darkThemePalette = document.getElementById('dark-theme-palette');
    
    // ===== CONFIGURAÇÕES DE CORES =====
    const LIGHT_THEME_COLORS = [
        '#007AFF', // Azul
        '#34C759', // Verde
        '#FF9500', // Laranja
        '#AF52DE', // Roxo
        '#FF3B30', // Vermelho
        '#17A2B8', // Ciano
        '#FF69B4'  // Rosa
    ];
    
    const DARK_THEME_COLORS = [
        '#6C7EFF', // Azul escuro
        '#FD7E14', // Laranja escuro
        '#48E5C2', // Verde água
        '#FF69B4', // Rosa
        '#FF6B6B', // Vermelho claro
        '#F0D55D', // Amarelo
        '#8B95FF'  // Roxo claro
    ];
    
    // ===== GERENCIAMENTO DE TEMA =====
    
    /**
     * Aplica um tema específico
     * @param {string} theme - 'light' ou 'dark'
     */
    const applyTheme = (theme) => {
        htmlElement.setAttribute('data-theme', theme);
        Utils.saveToLocalStorage('theme', theme);
        applyAccentColor();
    };
    
    /**
     * Obtém as cores disponíveis para o tema atual
     * @returns {Array} Array de cores hexadecimais
     */
    const getCurrentThemeColors = () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        return currentTheme === 'light' ? LIGHT_THEME_COLORS : DARK_THEME_COLORS;
    };
    
    /**
     * Aplica a cor de destaque salva para o tema atual
     */
    const applyAccentColor = () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const availableColors = getCurrentThemeColors();
        
        // Carrega cor salva ou usa a primeira como padrão
        const savedColor = Utils.loadFromLocalStorage(
            `${currentTheme}AccentColor`, 
            availableColors[0]
        );
        
        // Aplica a cor no CSS
        htmlElement.style.setProperty('--primary-color', savedColor);
        
        // Atualiza indicador visual na paleta
        updatePaletteActiveIndicator(currentTheme, savedColor);
    };
    
    /**
     * Atualiza o indicador de cor ativa na paleta
     * @param {string} theme - Tema atual
     * @param {string} activeColor - Cor ativa
     */
    const updatePaletteActiveIndicator = (theme, activeColor) => {
        const palette = document.getElementById(`${theme}-theme-palette`);
        if (!palette) return;
        
        // Remove indicador ativo anterior
        const previousActive = palette.querySelector('.color-swatch.active');
        if (previousActive) {
            previousActive.classList.remove('active');
        }
        
        // Adiciona indicador ativo na cor atual
        const activeSwatch = palette.querySelector(`.color-swatch[data-color="${activeColor}"]`);
        if (activeSwatch) {
            activeSwatch.classList.add('active');
        }
    };
    
    // ===== RENDERIZAÇÃO DE PALETAS =====
    
    /**
     * Cria HTML para uma paleta de cores
     * @param {Array} colors - Array de cores hexadecimais
     * @returns {string} HTML da paleta
     */
    const createPaletteHTML = (colors) => {
        return colors.map(color => 
            `<div class="color-swatch" data-color="${color}" style="background-color:${color}"></div>`
        ).join('');
    };
    
    /**
     * Renderiza as paletas de cores
     */
    const renderColorPickers = () => {
        if (lightThemePalette) {
            lightThemePalette.innerHTML = createPaletteHTML(LIGHT_THEME_COLORS);
        }
        
        if (darkThemePalette) {
            darkThemePalette.innerHTML = createPaletteHTML(DARK_THEME_COLORS);
        }
    };
    
    // ===== EVENT HANDLERS =====
    
    /**
     * Handler para troca de tema
     */
    const handleThemeToggle = () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    };
    
    /**
     * Handler para seleção de cor na paleta
     * @param {Event} event - Evento de clique
     * @param {string} theme - Tema da paleta
     */
    const handleColorSelection = (event, theme) => {
        const colorSwatch = event.target;
        
        if (colorSwatch.classList.contains('color-swatch')) {
            const selectedColor = colorSwatch.dataset.color;
            
            // Salva a cor selecionada
            Utils.saveToLocalStorage(`${theme}AccentColor`, selectedColor);
            
            // Aplica a cor se for o tema atual
            const currentTheme = htmlElement.getAttribute('data-theme');
            if (currentTheme === theme) {
                applyAccentColor();
            }
        }
    };
    
    /**
     * Configura event listeners para as paletas
     */
    const setupPaletteEventListeners = () => {
        if (lightThemePalette) {
            lightThemePalette.addEventListener('click', (event) => 
                handleColorSelection(event, 'light')
            );
        }
        
        if (darkThemePalette) {
            darkThemePalette.addEventListener('click', (event) => 
                handleColorSelection(event, 'dark')
            );
        }
    };
    
    // ===== INICIALIZAÇÃO =====
    
    /**
     * Inicializa o módulo de tema
     */
    const init = () => {
        // Carrega tema salvo ou usa 'light' como padrão
        const savedTheme = Utils.loadFromLocalStorage('theme', 'light');
        
        // Aplica tema inicial
        htmlElement.setAttribute('data-theme', savedTheme);
        
        // Renderiza paletas
        renderColorPickers();
        
        // Aplica cor de destaque
        applyAccentColor();
        
        // Configura event listeners
        if (themeToggleButton) {
            themeToggleButton.addEventListener('click', handleThemeToggle);
        }
        
        setupPaletteEventListeners();
    };
    
    // ===== EXPOSIÇÃO PÚBLICA =====
    
    return {
        init
    };
})();

// Exporta para uso global
window.Theme = Theme;