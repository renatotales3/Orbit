// Life OS - Módulo de Hábitos Completo
// Implementação completa baseada no script original

const Habits = (() => {
    // Elementos DOM
    let habitsList, addHabitModalBtn, habitModal, habitForm, cancelHabitBtn, deleteHabitBtn;
    let iconPicker, colorPicker, confirmationModal, confirmDeleteBtn, cancelDeleteBtn;
    
    // Estado interno
    let habits = [];
    let habitToDeleteId = null;
    let isInitialized = false;
    
    // Ícones disponíveis
    const AVAILABLE_ICONS = [
        { name: 'bx-drink', label: 'Beber' }, 
        { name: 'bx-book-open', label: 'Ler' }, 
        { name: 'bx-run', label: 'Exercício' }, 
        { name: 'bx-spa', label: 'Meditar' }, 
        { name: 'bx-brain', label: 'Estudar' }, 
        { name: 'bx-bed', label: 'Dormir' }, 
        { name: 'bx-dollar-circle', label: 'Economizar' }, 
        { name: 'bx-user-voice', label: 'Social' }, 
        { name: 'bx-leaf', label: 'Natureza' }, 
        { name: 'bx-paint', label: 'Hobby' }
    ];
    
    // Cores disponíveis
    const AVAILABLE_COLORS = [
        '#007BFF', '#28A745', '#FFC107', '#DC3545', '#6F42C1', 
        '#FD7E14', '#17A2B8', '#FF69B4', '#0DCAF0', '#20C997'
    ];
    
    // Carregar hábitos salvos
    const loadHabits = () => {
        if (typeof Utils !== 'undefined') {
            habits = Utils.loadFromLocalStorage('habits', []);
        } else {
            habits = JSON.parse(localStorage.getItem('habits') || '[]');
        }
    };
    
    // Salvar hábitos
    const saveHabits = () => {
        if (typeof Utils !== 'undefined') {
            Utils.saveToLocalStorage('habits', habits);
        } else {
            localStorage.setItem('habits', JSON.stringify(habits));
        }
    };
    
    // Calcular sequência (streak) de dias consecutivos
    const calculateStreak = (dates) => {
        if (dates.length === 0) return 0;
        
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const completedDates = new Set(dates);
        let currentDate = new Date(today);
        
        // Se hoje não foi completado, começar de ontem
        if (!completedDates.has(currentDate.toISOString().split('T')[0])) {
            currentDate.setDate(today.getDate() - 1);
        }
        
        // Contar dias consecutivos para trás
        while (completedDates.has(currentDate.toISOString().split('T')[0])) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        return streak;
    };
    
    // Renderizar lista de hábitos
    const render = () => {
        if (!habitsList) return;
        
        habitsList.innerHTML = "";
        
        habits.forEach(habit => {
            const li = document.createElement('li');
            li.className = 'habit-item';
            li.dataset.id = habit.id;
            
            // Calcular semana atual
            const today = new Date();
            const startOfWeek = new Date(new Date().setDate(today.getDate() - today.getDay()));
            
            let weekTrackerHTML = "";
            const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
            
            for (let i = 0; i < 7; i++) {
                const day = new Date(startOfWeek);
                day.setDate(startOfWeek.getDate() + i);
                const dateString = day.toISOString().split('T')[0];
                
                const isCompleted = habit.completedDates.includes(dateString);
                const isCurrent = day.toDateString() === new Date().toDateString();
                const isFuture = day > new Date();
                
                weekTrackerHTML += `<div class="day-circle ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''} ${isFuture ? 'disabled' : ''}" data-date="${dateString}" style="${isCompleted ? '--habit-color:' + habit.color : ''}">${weekDays[i]}</div>`;
            }
            
            li.innerHTML = `
                <div class="habit-info">
                    <div class="habit-icon-name">
                        <i class='bx ${habit.icon}' style="color: ${habit.color}"></i>
                        <span class="habit-name">${habit.name}</span>
                    </div>
                    <div class="habit-info-right">
                        <div class="habit-streak">
                            <span>🔥</span>
                            <span>${calculateStreak(habit.completedDates)}</span>
                        </div>
                        <div class="habit-actions">
                            <button class="soft-button icon-btn edit-habit-btn" title="Editar Hábito">
                                <i class="bx bxs-pencil"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="habit-week-tracker">${weekTrackerHTML}</div>
            `;
            
            habitsList.appendChild(li);
        });
    };
    
    // Abrir modal de hábito
    const openHabitModal = (mode = 'add', habitId = null) => {
        if (!habitForm || !iconPicker || !colorPicker) return;
        
        habitForm.reset();
        habitForm.dataset.mode = mode;
        habitForm.dataset.habitId = habitId;
        
        // Criar picker de ícones
        iconPicker.innerHTML = AVAILABLE_ICONS.map(i => 
            `<div class="picker-option">
                <button type="button" class="picker-button" data-icon="${i.name}">
                    <i class='bx ${i.name}'></i>
                </button>
                <span class="picker-label">${i.label}</span>
            </div>`
        ).join('');
        
        // Criar picker de cores
        colorPicker.innerHTML = AVAILABLE_COLORS.map(c => 
            `<button type="button" class="picker-button" data-color="${c}">
                <div class="color-swatch" style="background-color:${c}"></div>
            </button>`
        ).join('');
        
        const modalTitle = document.getElementById('habit-modal-title');
        
        if (mode === 'edit' && habitId !== null) {
            if (modalTitle) modalTitle.textContent = "Editar Hábito";
            if (deleteHabitBtn) deleteHabitBtn.classList.remove('hidden');
            
            const habit = habits.find(h => h.id === habitId);
            if (habit) {
                const nameInput = document.getElementById('habit-name-input');
                if (nameInput) nameInput.value = habit.name;
                
                const iconBtn = iconPicker.querySelector(`[data-icon="${habit.icon}"]`);
                if (iconBtn) iconBtn.classList.add('active');
                
                const colorBtn = colorPicker.querySelector(`[data-color="${habit.color}"]`);
                if (colorBtn) colorBtn.classList.add('active');
            }
        } else {
            if (modalTitle) modalTitle.textContent = "Novo Hábito";
            if (deleteHabitBtn) deleteHabitBtn.classList.add('hidden');
        }
        
        document.body.classList.add('modal-open');
        if (habitModal) habitModal.classList.remove('hidden');
    };
    
    // Fechar modal de hábito
    const closeHabitModal = () => {
        document.body.classList.remove('modal-open');
        if (habitForm) habitForm.reset();
        if (habitModal) habitModal.classList.add('hidden');
    };
    
    // Inicializar módulo
    const init = () => {
        if (isInitialized) return;
        
        try {
            // Obter referências DOM
            habitsList = document.getElementById('habits-list');
            addHabitModalBtn = document.getElementById('add-habit-modal-btn');
            habitModal = document.getElementById('habit-modal');
            habitForm = document.getElementById('habit-form');
            cancelHabitBtn = document.getElementById('cancel-habit-btn');
            deleteHabitBtn = document.getElementById('delete-habit-btn');
            iconPicker = document.getElementById('habit-icon-picker');
            colorPicker = document.getElementById('habit-color-picker');
            confirmationModal = document.getElementById('confirmation-modal');
            confirmDeleteBtn = document.getElementById('confirmation-confirm-btn');
            cancelDeleteBtn = document.getElementById('confirmation-cancel-btn');
            
            if (!habitsList) {
                console.error('❌ Elementos de hábitos não encontrados');
                return;
            }
            
            // Carregar hábitos salvos
            loadHabits();
            
            // Event listeners
            if (addHabitModalBtn) {
                addHabitModalBtn.addEventListener('click', () => openHabitModal('add'));
            }
            
            if (cancelHabitBtn) {
                cancelHabitBtn.addEventListener('click', closeHabitModal);
            }
            
            if (habitModal) {
                habitModal.addEventListener('click', (e) => {
                    if (e.target === habitModal) closeHabitModal();
                });
            }
            
            if (iconPicker) {
                iconPicker.addEventListener('click', (e) => {
                    const button = e.target.closest('.picker-button');
                    if (button) {
                        iconPicker.querySelector('.active')?.classList.remove('active');
                        button.classList.add('active');
                    }
                });
            }
            
            if (colorPicker) {
                colorPicker.addEventListener('click', (e) => {
                    const button = e.target.closest('.picker-button');
                    if (button) {
                        colorPicker.querySelector('.active')?.classList.remove('active');
                        button.classList.add('active');
                    }
                });
            }
            
            if (habitForm) {
                habitForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    const nameInput = document.getElementById('habit-name-input');
                    const name = nameInput ? nameInput.value : '';
                    const icon = iconPicker ? iconPicker.querySelector('.active')?.dataset.icon : null;
                    const color = colorPicker ? colorPicker.querySelector('.active')?.dataset.color : null;
                    
                    if (!name || !icon || !color) {
                        return alert("Por favor, preencha todos os campos.");
                    }
                    
                    const mode = habitForm.dataset.mode;
                    const habitId = Number(habitForm.dataset.habitId);
                    
                    if (mode === 'add') {
                        habits.push({
                            id: Date.now(),
                            name,
                            icon,
                            color,
                            completedDates: []
                        });
                    } else if (mode === 'edit') {
                        const habitIndex = habits.findIndex(h => h.id === habitId);
                        if (habitIndex > -1) {
                            habits[habitIndex] = { 
                                ...habits[habitIndex], 
                                name, 
                                icon, 
                                color 
                            };
                        }
                    }
                    
                    saveHabits();
                    render();
                    closeHabitModal();
                });
            }
            
            // Event listener para interações com hábitos
            habitsList.addEventListener('click', (e) => {
                const habitItem = e.target.closest('.habit-item');
                if (!habitItem) return;
                
                const habitId = Number(habitItem.dataset.id);
                const habit = habits.find(h => h.id === habitId);
                if (!habit) return;
                
                // Marcar/desmarcar dia
                if (e.target.closest('.day-circle:not(.disabled)')) {
                    const dayCircle = e.target.closest('.day-circle');
                    const date = dayCircle.dataset.date;
                    const dateIndex = habit.completedDates.indexOf(date);
                    
                    if (dateIndex > -1) {
                        habit.completedDates.splice(dateIndex, 1);
                    } else {
                        habit.completedDates.push(date);
                    }
                    
                    saveHabits();
                    render();
                }
                
                // Editar hábito
                if (e.target.closest('.edit-habit-btn')) {
                    openHabitModal('edit', habitId);
                }
            });
            
            // Event listeners para modal de confirmação
            if (deleteHabitBtn) {
                deleteHabitBtn.addEventListener('click', () => {
                    habitToDeleteId = Number(habitForm.dataset.habitId);
                    document.body.classList.add('modal-open');
                    if (confirmationModal) confirmationModal.classList.remove('hidden');
                });
            }
            
            if (cancelDeleteBtn) {
                cancelDeleteBtn.addEventListener('click', () => {
                    document.body.classList.remove('modal-open');
                    if (confirmationModal) confirmationModal.classList.add('hidden');
                    habitToDeleteId = null;
                });
            }
            
            if (confirmDeleteBtn) {
                confirmDeleteBtn.addEventListener('click', () => {
                    if (habitToDeleteId !== null) {
                        habits = habits.filter(h => h.id !== habitToDeleteId);
                        saveHabits();
                        render();
                        habitToDeleteId = null;
                    }
                    document.body.classList.remove('modal-open');
                    if (confirmationModal) confirmationModal.classList.add('hidden');
                    closeHabitModal();
                });
            }
            
            // Renderizar hábitos
            render();
            
            isInitialized = true;
            console.log('✅ Habits module initialized');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar Habits:', error);
        }
    };
    
    // API pública
    return { 
        init, 
        render,
        isInitialized: () => isInitialized 
    };
})();
