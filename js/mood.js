/**
 * MÓDULO DE HUMOR
 * 
 * Responsabilidades:
 * - Registro de humor diário
 * - Feedback motivacional baseado no humor
 * - Integração com dados diários
 * - Persistência de estado
 * 
 * Refatoração aplicada:
 * - Separação de responsabilidades
 * - Nomes de variáveis mais descritivos
 * - Comentários explicativos
 * - Lógica de feedback otimizada
 * - Código ES6+ moderno
 */

const Mood = (() => {
    
    // ===== ELEMENTOS DOM =====
    const moodOptionsContainer = document.getElementById('mood-options');
    
    // ===== CONFIGURAÇÕES =====
    const MOODS = {
        5: { icon: 'bxs-happy-heart-eyes', label: 'Ótimo', class: 'mood-5' },
        4: { icon: 'bxs-smile', label: 'Bom', class: 'mood-4' },
        3: { icon: 'bxs-meh', label: 'Normal', class: 'mood-3' },
        2: { icon: 'bxs-meh-alt', label: 'Ruim', class: 'mood-2' },
        1: { icon: 'bxs-sad', label: 'Terrível', class: 'mood-1' }
    };
    
    const MOOD_FEEDBACK = {
        5: 'Energia radiante e contagiante',
        4: 'Equilibrio e bem-estar em harmonia',
        3: 'Serenidade em estado natural',
        2: 'Momento de pausa e cuidado',
        1: 'Gentileza consigo mesmo é essencial'
    };
    
    // ===== ELEMENTOS DINÂMICOS =====
    const moodNoteElement = document.createElement('p');
    moodNoteElement.className = 'mood-note';
    
    // ===== RENDERIZAÇÃO =====
    
    /**
     * Cria HTML para uma opção de humor
     * @param {number} moodValue - Valor do humor (1-5)
     * @param {Object} moodData - Dados do humor
     * @returns {string} HTML da opção
     */
    const createMoodOptionHTML = (moodValue, moodData) => {
        return `
            <div class="mood-option">
                <button class="mood-btn ${moodData.class}" data-mood="${moodValue}">
                    <i class='bx ${moodData.icon}'></i>
                </button>
                <span class="mood-label">${moodData.label}</span>
            </div>
        `;
    };
    
    /**
     * Renderiza as opções de humor
     */
    const render = () => {
        // Ordena do melhor para o pior humor
        const sortedMoodKeys = Object.keys(MOODS).sort((a, b) => b - a);
        
        moodOptionsContainer.innerHTML = sortedMoodKeys
            .map(key => createMoodOptionHTML(parseInt(key), MOODS[key]))
            .join('');
        
        loadMoodState();
        
        // Adiciona nota de feedback abaixo do picker
        const parentElement = moodOptionsContainer.parentElement;
        if (parentElement && !parentElement.contains(moodNoteElement)) {
            parentElement.appendChild(moodNoteElement);
        }
    };
    
    // ===== GERENCIAMENTO DE ESTADO =====
    
    /**
     * Carrega e exibe o estado atual do humor
     */
    const loadMoodState = () => {
        const todayData = DailyData.getTodayData();
        
        // Remove classe ativa anterior
        moodOptionsContainer.querySelector('.active')?.classList.remove('active');
        
        if (todayData.mood) {
            // Ativa o botão correspondente ao humor salvo
            const buttonToActivate = moodOptionsContainer.querySelector(`.mood-btn[data-mood="${todayData.mood}"]`);
            if (buttonToActivate) {
                buttonToActivate.classList.add('active');
            }
            
            // Exibe feedback correspondente
            moodNoteElement.textContent = MOOD_FEEDBACK[todayData.mood] || '';
        } else {
            // Limpa feedback se não há humor registrado
            moodNoteElement.textContent = '';
        }
    };
    
    /**
     * Salva o humor selecionado
     * @param {number} moodValue - Valor do humor (1-5)
     */
    const saveMood = (moodValue) => {
        const todayData = DailyData.getTodayData();
        todayData.mood = moodValue;
        DailyData.saveData();
        
        // Atualiza interface
        loadMoodState();
    };
    
    // ===== EVENT HANDLERS =====
    
    /**
     * Handler para seleção de humor
     * @param {Event} event - Evento de clique
     */
    const handleMoodSelection = (event) => {
        const moodButton = event.target.closest('.mood-btn');
        if (moodButton) {
            const moodValue = parseInt(moodButton.dataset.mood);
            saveMood(moodValue);
        }
    };
    
    // ===== INICIALIZAÇÃO =====
    
    /**
     * Configura event listeners
     */
    const setupEventListeners = () => {
        moodOptionsContainer.addEventListener('click', handleMoodSelection);
    };
    
    /**
     * Inicializa o módulo de humor
     */
    const init = () => {
        setupEventListeners();
        render();
    };
    
    // ===== EXPOSIÇÃO PÚBLICA =====
    
    return {
        init,
        render,
        loadMoodState
    };
})();

// Exporta para uso global
window.Mood = Mood;