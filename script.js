// ===== SCRIPT.JS - MÓDULOS NÃO REFATORADOS =====
// 
// Este arquivo contém apenas os módulos que ainda não foram refatorados.
// Os módulos refatorados estão em arquivos separados na pasta js/.
// 
// Módulos refatorados (removidos):
// - Utils (js/utils.js)
// - Navigation (js/navigation.js) 
// - Theme (js/theme.js)
// - Tasks (js/tasks.js)
// - Pomodoro (js/pomodoro.js)
// - Goals (js/goals.js)
// - Habits (js/habits.js)
// - Mood (js/mood.js)
// - Metrics (js/metrics.js)
// - FocusExtras (js/focus-extras.js)
// - Finance (js/finance.js)
//
// Módulos mantidos (não refatorados):
// - DailyData
// - Journal

document.addEventListener('DOMContentLoaded', () => {

    // --- MÓDULO DE DADOS DIÁRIOS ---
    const DailyData = (() => {
        let allData = Utils.loadFromLocalStorage('dailyData', []);

        const getTodayData = () => {
            const todayString = Utils.getTodayString();
            let todayData = allData.find(d => d.date === todayString);
            if (!todayData) {
                todayData = { date: todayString, mood: null, journal: null, water: 0, sleep: null };
                allData.push(todayData);
            }
            return todayData;
        };

        const saveData = () => {
            Utils.saveToLocalStorage('dailyData', allData);
        };

        return { getTodayData, saveData, getAllData: () => allData };
    })();

    // --- MÓDULO DE REFLEXÃO DIÁRIA ---
    const Journal = (() => {
        const journalContainer = document.getElementById('daily-journal');
        const journalForm = document.getElementById('journal-form');
        const questionEl = document.getElementById('journal-question');
        const inputEl = document.getElementById('journal-input');
        const questionCompletedEl = document.getElementById('journal-question-completed');
        const answerEl = document.getElementById('journal-answer');
        const showHistoryBtn = document.getElementById('show-journal-history-btn');
        const historyModal = document.getElementById('journal-history-modal');
        const historyList = document.getElementById('journal-history-list');
        const closeHistoryBtn = document.getElementById('close-journal-history-btn');
        const closeHistoryBtnX = document.getElementById('close-journal-history-btn-x');

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

        const getDayOfYear = (date = new Date()) => {
            const start = new Date(date.getFullYear(), 0, 0);
            const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
            const oneDay = 1000 * 60 * 60 * 24;
            return Math.floor(diff / oneDay);
        };

        const getDailyQuestion = () => {
            const today = new Date();
            const dayIndex = getDayOfYear(today);
            const question = QUESTIONS[dayIndex % QUESTIONS.length];
            return { question };
        };

        const createHistoryItemHTML = (entry) => `
            <li class="journal-history-item">
                <p class="history-date">${Utils.formatDateToBR(entry.date)}</p>
                <p class="history-question">${entry.journal.question}</p>
                <p class="history-answer">${entry.journal.answer}</p>
            </li>
        `;

        const openHistoryModal = () => {
            const allData = DailyData.getAllData();
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

        const closeHistoryModal = () => {
            document.body.classList.remove('modal-open');
            historyModal.classList.add('hidden');
        };

        const render = () => {
            const { question } = getDailyQuestion();
            const todayData = DailyData.getTodayData();

            if (todayData.journal) {
                // Já respondido hoje
                questionEl.textContent = question;
                questionCompletedEl.style.display = 'block';
                answerEl.textContent = todayData.journal.answer;
                journalForm.style.display = 'none';
            } else {
                // Não respondido hoje
                questionEl.textContent = question;
                questionCompletedEl.style.display = 'none';
                journalForm.style.display = 'block';
                inputEl.value = '';
            }
        };

        const init = () => {
            // Event listeners
            journalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const answer = inputEl.value.trim();
                if (answer) {
                    const todayData = DailyData.getTodayData();
                    todayData.journal = {
                        question: questionEl.textContent,
                        answer: answer
                    };
                    DailyData.saveData();
                    render();
                }
            });

            showHistoryBtn.addEventListener('click', openHistoryModal);
            closeHistoryBtn.addEventListener('click', closeHistoryModal);
            closeHistoryBtnX.addEventListener('click', closeHistoryModal);
            historyModal.addEventListener('click', (e) => {
                if (e.target === historyModal) closeHistoryModal();
            });

            render();
        };

        return { init, render };
    })();

    // --- INICIALIZAÇÃO DOS MÓDULOS NÃO REFATORADOS ---
    
    // Expor DailyData globalmente para outros módulos
    window.DailyData = DailyData;
    
    // Inicializa módulos não refatorados
    DailyData && DailyData.init && DailyData.init();
    Journal && Journal.init && Journal.init();

    console.log('✅ Módulos não refatorados inicializados com sucesso');
});