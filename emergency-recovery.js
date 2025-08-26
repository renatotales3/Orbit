// SISTEMA DE EMERGÊNCIA - Detecta e corrige problemas automaticamente
(() => {
    console.log('🚨 Sistema de Emergência Ativado');
    
    // Verificar se há problemas críticos
    const checkCriticalIssues = () => {
        const issues = [];
        
        // Verificar se elementos básicos existem
        const criticalElements = [
            'task-input', 'task-list', 'goals-list', 'habits-list',
            'mood-options', 'daily-journal', 'timer-display'
        ];
        
        criticalElements.forEach(id => {
            if (!document.getElementById(id)) {
                issues.push(`Elemento crítico não encontrado: ${id}`);
            }
        });
        
        // Verificar se módulos estão funcionando
        const requiredModules = ['Tasks', 'Goals', 'Habits', 'Mood', 'Journal'];
        requiredModules.forEach(moduleName => {
            if (typeof window[moduleName] === 'undefined') {
                issues.push(`Módulo ${moduleName} não encontrado`);
            }
        });
        
        return issues;
    };
    
    // Restaurar funcionalidade básica
    const restoreBasicFunctionality = () => {
        console.log('🔧 Restaurando funcionalidade básica...');
        
        // Restaurar navegação
        const navButtons = document.querySelectorAll('.nav-btn');
        const pages = document.querySelectorAll('.page');
        
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.dataset.target;
                
                // Ativar aba
                pages.forEach(p => p.classList.remove('active'));
                navButtons.forEach(b => b.classList.remove('active'));
                
                const targetPage = document.getElementById(targetId);
                if (targetPage) targetPage.classList.add('active');
                btn.classList.add('active');
                
                // Salvar aba ativa
                localStorage.setItem('activeTab', targetId);
                localStorage.setItem('lifeOS_currentTab', targetId);
                
                console.log(`✅ Navegação restaurada para: ${targetId}`);
            });
        });
        
        // Restaurar funcionalidade de tarefas básica
        const taskInput = document.getElementById('task-input');
        const addTaskBtn = document.getElementById('add-task-btn');
        const taskList = document.getElementById('task-list');
        
        if (taskInput && addTaskBtn && taskList) {
            addTaskBtn.addEventListener('click', () => {
                const text = taskInput.value.trim();
                if (text) {
                    const task = {
                                        id: Date.now(),
                                        text: text,
                                        completed: false,
                                        priority: 3
                                    };
                    
                    // Salvar no localStorage
                    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                    tasks.push(task);
                    localStorage.setItem('tasks', JSON.stringify(tasks));
                    
                    // Renderizar
                    renderTasks(tasks);
                    
                    // Limpar input
                    taskInput.value = '';
                    taskInput.focus();
                    
                    console.log('✅ Tarefa adicionada via sistema de emergência');
                                }
                            });
            
            // Carregar tarefas existentes
            const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            renderTasks(tasks);
        }
        
        console.log('✅ Funcionalidade básica restaurada');
    };
    
    // Renderizar tarefas
    const renderTasks = (tasks) => {
        const taskList = document.getElementById('task-list');
        if (!taskList) return;
        
        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <h4>Nenhuma tarefa ainda</h4>
                    <p>Adicione sua primeira tarefa do dia para começar a organizar seu foco.</p>
                </div>
            `;
        } else {
            taskList.innerHTML = tasks.map(task => `
                <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    <div class="task-item-content">
                        <button class="complete-btn" onclick="toggleTask(${task.id})">
                            <i class='bx ${task.completed ? 'bxs-check-circle' : 'bx-circle'}'></i>
                        </button>
                        <span class="priority-tag priority-3">Média</span>
                        <span class="task-text">${task.text}</span>
                    </div>
                    <div class="task-item-buttons">
                        <button class="soft-button icon-btn delete-btn" onclick="deleteTask(${task.id})">
                            <i class='bx bxs-trash'></i>
                        </button>
                    </div>
                </li>
            `).join('');
        }
    };
    
    // Funções globais para tarefas
    window.toggleTask = (taskId) => {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks(tasks);
        }
    };
    
    window.deleteTask = (taskId) => {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        localStorage.setItem('tasks', JSON.stringify(filteredTasks));
        renderTasks(filteredTasks);
    };
    
    // Executar verificação e restauração
    setTimeout(() => {
        const issues = checkCriticalIssues();
        
        if (issues.length > 0) {
            console.warn('🚨 Problemas críticos detectados:', issues);
            restoreBasicFunctionality();
        } else {
            console.log('✅ Nenhum problema crítico detectado');
        }
    }, 1000);
    
})();
