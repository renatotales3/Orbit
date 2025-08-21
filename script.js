document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS GERAIS E ESTADO DO APP ---
    const htmlElement = document.documentElement;
    const pages = document.querySelectorAll('.page');
    // ... (restante das variáveis globais)

    // --- NAVEGAÇÃO E TEMA ---
    // ... (código existente de navegação e tema)

    // --- MÓDULO DE TAREFAS RÁPIDAS ---
    // ... (código existente de tarefas)

    // --- MÓDULO POMODORO ---
    // ... (código existente do pomodoro)

    // --- MÓDULO DE METAS ---
    const goalModal = document.getElementById('goal-modal');
    const goalForm = document.getElementById('goal-form');
    const goalsList = document.getElementById('goals-list');
    // ... (restante das variáveis de metas)
    
    let goals = loadFromLocalStorage('goals', []);

    const saveGoals = () => saveToLocalStorage('goals', goals);

    const renderGoals = () => {
        goalsList.innerHTML = "";
        goals.forEach((goal, index) => {
            const progress = goal.subtasks.length > 0 ? (goal.subtasks.filter(st => st.completed).length / goal.subtasks.length) * 100 : 0;
            const li = document.createElement('li');
            li.className = 'goal-item';
            li.dataset.index = index;
            li.innerHTML = `
                <div class="goal-header">
                    <span class="goal-title">${goal.title}</span>
                    <div class="goal-actions">
                        <button class="edit-goal-btn" title="Editar Meta"><i class='bx bxs-pencil'></i></button>
                        <button class="delete-goal-btn" title="Excluir Meta"><i class='bx bxs-trash'></i></button>
                    </div>
                </div>
                <div class="goal-progress"><div class="progress-bar-container"><div class="progress-bar" style="width: ${progress.toFixed(0)}%"></div></div></div>
                <div class="goal-details">
                    <div class="goal-details-content">
                        <div class="goal-categories">${goal.categories.map(cat => `<span class="goal-category" style="background-color:${ALL_CATEGORIES[cat] || '#6c757d'}">${cat}</span>`).join('')}</div>
                        <p><strong>Motivação:</strong> ${goal.motivation || 'N/A'}</p>
                        <p><strong>Data Alvo:</strong> ${goal.targetDate || 'N/A'}</p>
                        <ul class="subtask-list">${goal.subtasks.map((st, stIndex) => `
                            <li class="subtask-item">
                                <div class="subtask-item-content">
                                    <button class="complete-subtask-btn ${st.completed ? 'completed' : ''}" data-subtask-index="${stIndex}"><i class='bx bx-check-circle'></i></button>
                                    <span class="subtask-text ${st.completed ? 'completed' : ''}">${st.text}</span>
                                </div>
                                <div class="subtask-actions">
                                    <button class="add-to-focus-btn" data-subtask-index="${stIndex}" title="Adicionar ao Foco do Dia"><i class='bx bx-list-plus'></i></button>
                                    <button class="delete-subtask-btn" data-subtask-index="${stIndex}" title="Excluir Subtarefa"><i class='bx bxs-trash'></i></button>
                                </div>
                            </li>`).join('')}
                        </ul>
                        <form class="add-subtask-form"><input type="text" class="soft-input subtask-input" placeholder="Novo passo..."><button type="submit" class="soft-button add-subtask-btn"><i class='bx bx-plus'></i></button></form>
                    </div>
                </div>`;
            goalsList.appendChild(li);
        });
    };
    
    // ... (Restante do seu código JS, que já estava correto)

    goalsList.addEventListener('click', (e) => {
        const goalItem = e.target.closest('.goal-item');
        if (!goalItem) return;
        const goalIndex = parseInt(goalItem.dataset.index);
        let shouldReRender = false;

        if (e.target.closest('.goal-header') || e.target.closest('.goal-progress')) {
            goalItem.classList.toggle('expanded');
        }
        
        const completeSubtaskBtn = e.target.closest('.complete-subtask-btn');
        if (completeSubtaskBtn) {
            const subtaskIndex = parseInt(completeSubtaskBtn.dataset.subtaskIndex);
            goals[goalIndex].subtasks[subtaskIndex].completed = !goals[goalIndex].subtasks[subtaskIndex].completed;
            shouldReRender = true;
        }

        // ... (resto dos eventos de clique que já estavam funcionando)
        
        if (shouldReRender) {
            const wasExpanded = goalItem.classList.contains('expanded');
            saveGoals();
            renderGoals();
            if (wasExpanded) {
                const newGoalItem = document.querySelector(`.goal-item[data-index="${goalIndex}"]`);
                if (newGoalItem) newGoalItem.classList.add('expanded');
            }
        }
    });

    // --- INICIALIZAÇÃO GERAL ---
    // ... (código de inicialização)
});