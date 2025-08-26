// Life OS - Módulo de Reflexão Diária Completo
// Implementação completa baseada no script original

const Journal = (() => {
    // Elementos DOM
    let journalContainer, journalForm, questionEl, inputEl;
    let questionCompletedEl, answerEl, showHistoryBtn, historyModal;
    let historyList, closeHistoryBtn, closeHistoryBtnX;
    
    // Estado interno
    let isInitialized = false;
    
    // Perguntas diárias
    const QUESTIONS = [
        "Pelo que você sentiu gratidão hoje?",
        "Qual foi o ponto alto do seu dia?",
        "O que te fez sorrir hoje?",
        "Que pequena vitória você conquistou?",
        "Algo bom que aconteceu e que você não esperava?",
        "O que você aprendeu de novo hoje?",
        "Uma gentileza que você viu ou fez hoje?",
        "Qual foi seu maior desafio superado no dia de hoje?",
        "O que te fez sentir orgulhoso(a) de si mesmo(a)?",
        "Cite 3 coisas boas que aconteceram hoje.",
        "Uma coisa simples que te trouxe alegria foi...",
        "Qual foi o momento mais interessante do seu dia?",
        "Qual foi o som, cheiro ou sabor mais agradável que você sentiu?",
        "Um momento de paz que você teve hoje foi...",
        "Um pequeno passo que você deu em direção a um grande objetivo foi...",
        "O que você está ansioso(a) para amanhã?",
        "Como você cuidou de si mesmo(a) hoje?",
        "Uma conversa significativa que você teve hoje foi com...",
        "Quem te ajudou ou te inspirou hoje?",
        "O que você fez hoje para se aproximar de quem você quer ser?",
        "Descreva uma emoção forte que você sentiu hoje.",
        "Qual música descreveria o seu dia?",
        "O que te deu energia hoje?",
        "Se você pudesse dar um conselho a si mesmo(a) hoje de manhã, qual seria?",
        "Qual obstáculo você removeu do seu caminho hoje?",
        "O que você está deixando para trás ao final deste dia?",
        "Uma coisa que você gostaria de lembrar sobre o dia de hoje é...",
        "Como você demonstrou amor ou carinho hoje?",
        "O que te surpreendeu sobre você mesmo(a) hoje?",
        "Qual foi a decisão mais inteligente que você tomou hoje?",
        "O que você fez hoje apenas por diversão?"
    ];
    
    // Calcular dia do ano
    const getDayOfYear = (date = new Date()) => {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    };
    
    // Obter pergunta diária
    const getDailyQuestion = () => {
        const today = new Date();
        const dayIndex = getDayOfYear(today);
        const question = QUESTIONS[dayIndex % QUESTIONS.length];
        return { question };
    };
    
    // Criar HTML do item de histórico
    const createHistoryItemHTML = (entry) => {
        const formattedDate = typeof Utils !== 'undefined' ? 
            Utils.formatDateToBR(entry.date) : 
            new Date(entry.date).toLocaleDateString('pt-BR');
        
        return `
            <li class="journal-history-item">
                <p class="history-date">${formattedDate}</p>
                <p class="history-question">${entry.journal.question}</p>
                <p class="history-answer">${entry.journal.answer}</p>
            </li>
        `;
    };
    
    // Abrir modal de histórico
    const openHistoryModal = () => {
        if (!historyModal || !historyList) return;
        
        let allData = [];
        if (window.DailyData && window.DailyData.getAllData) {
            allData = window.DailyData.getAllData();
        } else {
            // Fallback para localStorage direto
            const dailyData = JSON.parse(localStorage.getItem('dailyData') || '{}');
            allData = Object.keys(dailyData).map(date => ({
                date,
                ...dailyData[date]
            }));
        }
        
        const entriesWithJournal = allData.filter(d => d.journal);

        historyList.innerHTML = '';
        if (entriesWithJournal.length === 0) {
            historyList.innerHTML = `<p class="no-history-message">Você ainda não tem nenhuma reflexão salva.</p>`;
        } else {
            const sortedEntries = entriesWithJournal.sort((a, b) => new Date(b.date) - new Date(a.date));
            historyList.innerHTML = sortedEntries.map(createHistoryItemHTML).join('');
        }
        
        document.body.classList.add('modal-open');
        historyModal.classList.remove('hidden');
    };
    
    // Fechar modal de histórico
    const closeHistoryModal = () => {
        document.body.classList.remove('modal-open');
        if (historyModal) historyModal.classList.add('hidden');
    };
    
    // Renderizar journal
    const render = () => {
        if (!journalContainer || !questionEl || !inputEl) return;
        
        const { question } = getDailyQuestion();
        
        let todayData = {};
        if (window.DailyData && window.DailyData.getTodayData) {
            todayData = window.DailyData.getTodayData();
        } else {
            // Fallback para localStorage direto
            const today = new Date().toISOString().split('T')[0];
            const dailyData = JSON.parse(localStorage.getItem('dailyData') || '{}');
            todayData = dailyData[today] || {};
        }

        if (todayData.journal) {
            journalContainer.classList.add('answered');
            if (questionCompletedEl) questionCompletedEl.textContent = todayData.journal.question;
            if (answerEl) answerEl.textContent = todayData.journal.answer;
        } else {
            journalContainer.classList.remove('answered');
            questionEl.textContent = question;
            inputEl.value = '';
        }
    };
    
    // Salvar reflexão
    const saveJournal = (question, answer) => {
        if (window.DailyData && window.DailyData.getTodayData && window.DailyData.saveData) {
            const todayData = window.DailyData.getTodayData();
            todayData.journal = { question, answer };
            window.DailyData.saveData();
        } else {
            // Fallback para localStorage direto
            const today = new Date().toISOString().split('T')[0];
            const dailyData = JSON.parse(localStorage.getItem('dailyData') || '{}');
            if (!dailyData[today]) dailyData[today] = {};
            dailyData[today].journal = { question, answer };
            localStorage.setItem('dailyData', JSON.stringify(dailyData));
        }
    };
    
    // Inicializar módulo
    const init = () => {
        if (isInitialized) return;
        
        try {
            // Obter referências DOM
            journalContainer = document.getElementById('daily-journal');
            journalForm = document.getElementById('journal-form');
            questionEl = document.getElementById('journal-question');
            inputEl = document.getElementById('journal-input');
            questionCompletedEl = document.getElementById('journal-question-completed');
            answerEl = document.getElementById('journal-answer');
            showHistoryBtn = document.getElementById('show-journal-history-btn');
            historyModal = document.getElementById('journal-history-modal');
            historyList = document.getElementById('journal-history-list');
            closeHistoryBtn = document.getElementById('close-journal-history-btn');
            closeHistoryBtnX = document.getElementById('close-journal-history-btn-x');
            
            if (!journalContainer || !journalForm) {
                console.error('❌ Elementos de journal não encontrados');
                return;
            }
            
            // Event listener para submissão do formulário
            journalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const answer = inputEl.value.trim();
                if (answer) {
                    const { question } = getDailyQuestion();
                    saveJournal(question, answer);
                    render();
                }
            });
            
            // Event listeners para histórico
            if (showHistoryBtn) {
                showHistoryBtn.addEventListener('click', openHistoryModal);
            }
            
            if (closeHistoryBtn) {
                closeHistoryBtn.addEventListener('click', closeHistoryModal);
            }
            
            if (closeHistoryBtnX) {
                closeHistoryBtnX.addEventListener('click', closeHistoryModal);
            }
            
            if (historyModal) {
                historyModal.addEventListener('click', (e) => {
                    if (e.target === historyModal) closeHistoryModal();
                });
            }
            
            // Renderizar
            render();
            
            isInitialized = true;
            console.log('✅ Journal module initialized');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Journal:', error);
        }
    };
    
    // API pública
    return { 
        init, 
        render,
        isInitialized: () => isInitialized 
    };
})();
