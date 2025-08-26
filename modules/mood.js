// Life OS - Módulo de Humor Completo
// Implementação completa baseada no script original

const Mood = (() => {
    // Elementos DOM
    let moodOptionsContainer;
    let moodNoteEl;
    
    // Estado interno
    let isInitialized = false;
    
    // Definições de humor
    const MOODS = { 
        5: { icon: 'bxs-happy-heart-eyes', label: 'Ótimo', class: 'mood-5' }, 
        4: { icon: 'bxs-smile', label: 'Bom', class: 'mood-4' }, 
        3: { icon: 'bxs-meh', label: 'Normal', class: 'mood-3' }, 
        2: { icon: 'bxs-meh-alt', label: 'Ruim', class: 'mood-2' }, 
        1: { icon: 'bxs-sad', label: 'Terrível', class: 'mood-1' } 
    };
    
    // Mensagens motivacionais
    const MOOD_JOKES = { 
        5: 'Energia radiante e contagiante', 
        4: 'Equilibrio e bem-estar em harmonia', 
        3: 'Serenidade em estado natural', 
        2: 'Momento de pausa e cuidado', 
        1: 'Gentileza consigo mesmo é essencial' 
    };
    
    // Carregar estado do humor
    const loadMoodState = () => {
        if (!moodOptionsContainer) return;
        
        let todayData = {};
        if (window.DailyData && window.DailyData.getTodayData) {
            todayData = window.DailyData.getTodayData();
        } else {
            // Fallback para localStorage direto
            const today = new Date().toISOString().split('T')[0];
            const dailyData = JSON.parse(localStorage.getItem('dailyData') || '{}');
            todayData = dailyData[today] || {};
        }
        
        moodOptionsContainer.querySelector('.active')?.classList.remove('active');
        
        if (todayData.mood) {
            const btnToActivate = moodOptionsContainer.querySelector(`.mood-btn[data-mood="${todayData.mood}"]`);
            if (btnToActivate) btnToActivate.classList.add('active');
            if (moodNoteEl) moodNoteEl.textContent = MOOD_JOKES[todayData.mood] || '';
        } else {
            if (moodNoteEl) moodNoteEl.textContent = '';
        }
    };
    
    // Renderizar seletor de humor
    const render = () => {
        if (!moodOptionsContainer) return;
        
        moodOptionsContainer.innerHTML = Object.keys(MOODS)
            .sort((a, b) => b - a)
            .map(key => 
                `<div class="mood-option">
                    <button class="mood-btn ${MOODS[key].class}" data-mood="${key}">
                        <i class='bx ${MOODS[key].icon}'></i>
                    </button>
                    <span class="mood-label">${MOODS[key].label}</span>
                </div>`
            ).join('');
        
        loadMoodState();
        
        // Anexar nota motivacional abaixo do picker
        if (moodOptionsContainer.parentElement && moodNoteEl) {
            moodOptionsContainer.parentElement.appendChild(moodNoteEl);
        }
    };
    
    // Salvar humor selecionado
    const saveMood = (moodValue) => {
        if (window.DailyData && window.DailyData.getTodayData && window.DailyData.saveData) {
            const todayData = window.DailyData.getTodayData();
            todayData.mood = moodValue;
            window.DailyData.saveData();
        } else {
            // Fallback para localStorage direto
            const today = new Date().toISOString().split('T')[0];
            const dailyData = JSON.parse(localStorage.getItem('dailyData') || '{}');
            if (!dailyData[today]) dailyData[today] = {};
            dailyData[today].mood = moodValue;
            localStorage.setItem('dailyData', JSON.stringify(dailyData));
        }
    };
    
    // Inicializar módulo
    const init = () => {
        if (isInitialized) return;
        
        try {
            // Obter referências DOM
            moodOptionsContainer = document.getElementById('mood-options');
            
            if (!moodOptionsContainer) {
                console.error('❌ Elementos de humor não encontrados');
                return;
            }
            
            // Criar elemento para nota motivacional
            moodNoteEl = document.createElement('p');
            moodNoteEl.className = 'mood-note';
            
            // Event listener para seleção de humor
            moodOptionsContainer.addEventListener('click', (e) => {
                const moodBtn = e.target.closest('.mood-btn');
                if (moodBtn) {
                    const moodValue = moodBtn.dataset.mood;
                    saveMood(moodValue);
                    loadMoodState();
                }
            });
            
            // Renderizar
            render();
            
            isInitialized = true;
            console.log('✅ Mood module initialized');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Mood:', error);
        }
    };
    
    // API pública
    return { 
        init, 
        render, 
        loadMoodState,
        isInitialized: () => isInitialized 
    };
})();
