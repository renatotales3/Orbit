// Aguarda o DOM estar completamente carregado para executar o script
document.addEventListener('DOMContentLoaded', () => {

    // =================================================================
    // 1. ESTADO DA APLICAÇÃO E PERSISTÊNCIA
    // =================================================================
    let state = {
        tasks: [],
        notes: [],
    };

    // Carrega o estado do localStorage
    function loadState() {
        const savedState = localStorage.getItem('segundoCerebroState');
        if (savedState) {
            state = JSON.parse(savedState);
        } else {
            // Estado inicial de exemplo se não houver nada salvo
            state = {
                tasks: [{ id: 1, title: 'Configurar o projeto', content: 'Criar arquivos HTML, CSS e JS.' }],
                notes: [{ id: 1, title: 'Ideia para o App', content: 'Usar localStorage para persistência.' }],
            };
        }
    }

    // Salva o estado atual no localStorage
    function saveState() {
        localStorage.setItem('segundoCerebroState', JSON.stringify(state));
    }

    // =================================================================
    // 2. SELETORES DE ELEMENTOS DO DOM
    // =================================================================
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('.nav-link');
    const tasksList = document.getElementById('tasks-list');
    const notesList = document.getElementById('notes-list');
    const dashboardKpis = document.getElementById('dashboard-kpis');
    const modalContainer = document.getElementById('modal-container');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    
    // =================================================================
    // 3. LÓGICA DE RENDERIZAÇÃO
    // =================================================================

    // Renderiza a lista de tarefas
    function renderTasks() {
        tasksList.innerHTML = '';
        if (state.tasks.length === 0) {
            tasksList.innerHTML = '<p>Você não tem tarefas. Crie uma!</p>';
            return;
        }
        state.tasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = 'card';
            taskCard.innerHTML = `
                <h4 class="card-title">${task.title}</h4>
                <p class="card-content">${task.content}</p>
                <button class="delete-btn" data-id="${task.id}" data-type="task">&times;</button>
            `;
            tasksList.appendChild(taskCard);
        });
    }

    // Renderiza a lista de notas
    function renderNotes() {
        notesList.innerHTML = '';
        if (state.notes.length === 0) {
            notesList.innerHTML = '<p>Você não tem notas. Crie uma!</p>';
            return;
        }
        state.notes.forEach(note => {
            const noteCard = document.createElement('div');
            noteCard.className = 'card';
            noteCard.innerHTML = `
                <h4 class="card-title">${note.title}</h4>
                <p class="card-content">${note.content}</p>
                <button class="delete-btn" data-id="${note.id}" data-type="note">&times;</button>
            `;
            notesList.appendChild(noteCard);
        });
    }

    // Renderiza os KPIs do Dashboard
    function renderDashboard() {
        dashboardKpis.innerHTML = `
            <div class="card">
                <h4 class="card-title">Tarefas Ativas</h4>
                <p class="card-content" style="font-size: 2rem; font-weight: bold;">${state.tasks.length}</p>
            </div>
            <div class="card">
                <h4 class="card-title">Notas Criadas</h4>
                <p class="card-content" style="font-size: 2rem; font-weight: bold;">${state.notes.length}</p>
            </div>
        `;
    }

    // Função agregadora para renderizar tudo
    function renderAll() {
        renderDashboard();
        renderTasks();
        renderNotes();
    }
    
    // =================================================================
    // 4. LÓGICA DE NAVEGAÇÃO
    // =================================================================
    function showPage(pageId) {
        pages.forEach(page => page.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));

        document.getElementById(`${pageId}-page`).classList.add('active');
        document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = e.target.dataset.page;
            showPage(pageId);
            window.location.hash = pageId;
        });
    });

    // =================================================================
    // 5. LÓGICA DO MODAL
    // =================================================================
    let currentModalAction = null;

    function openModal(config) {
        modalTitle.textContent = config.title;
        modalBody.innerHTML = config.body;
        currentModalAction = config.onSave;
        modalContainer.classList.add('visible');
    }

    function closeModal() {
        modalContainer.classList.remove('visible');
        currentModalAction = null;
    }

    modalSaveBtn.addEventListener('click', () => {
        if (currentModalAction) {
            currentModalAction();
        }
    });
    modalCancelBtn.addEventListener('click', closeModal);

    // Adiciona evento para fechar modal com a tecla 'Escape'
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalContainer.classList.contains('visible')) {
            closeModal();
        }
    });

    // =================================================================
    // 6. EVENT LISTENERS E AÇÕES CRUD
    // =================================================================

    // Adicionar Tarefa
    document.getElementById('add-task-btn').addEventListener('click', () => {
        openModal({
            title: 'Nova Tarefa',
            body: `
                <div class="form-group">
                    <input type="text" id="task-title-input" class="soft-input" placeholder="Título da tarefa">
                </div>
                <div class="form-group">
                    <textarea id="task-content-input" class="soft-textarea" placeholder="Descrição..."></textarea>
                </div>
            `,
            onSave: () => {
                const title = document.getElementById('task-title-input').value;
                const content = document.getElementById('task-content-input').value;
                if (!title) return alert('O título é obrigatório.');

                state.tasks.push({ id: Date.now(), title, content });
                saveState();
                renderAll();
                closeModal();
            }
        });
    });

    // Adicionar Nota
    document.getElementById('add-note-btn').addEventListener('click', () => {
         openModal({
            title: 'Nova Nota',
            body: `
                <div class="form-group">
                    <input type="text" id="note-title-input" class="soft-input" placeholder="Título da nota">
                </div>
                <div class="form-group">
                    <textarea id="note-content-input" class="soft-textarea" rows="5" placeholder="Escreva sua ideia..."></textarea>
                </div>
            `,
            onSave: () => {
                const title = document.getElementById('note-title-input').value;
                const content = document.getElementById('note-content-input').value;
                if (!title) return alert('O título é obrigatório.');

                state.notes.push({ id: Date.now(), title, content });
                saveState();
                renderAll();
                closeModal();
            }
        });
    });

    // Deletar Itens (usando delegação de evento)
    document.querySelector('.main-content').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.dataset.id);
            const type = e.target.dataset.type;
            
            if(confirm(`Tem certeza que deseja excluir est${type === 'task' ? 'a tarefa' : 'a nota'}?`)){
                if (type === 'task') {
                    state.tasks = state.tasks.filter(t => t.id !== id);
                } else if (type === 'note') {
                    state.notes = state.notes.filter(n => n.id !== id);
                }
                saveState();
                renderAll();
            }
        }
    });

    // Ações de Configurações
    document.getElementById('export-data-btn').addEventListener('click', () => {
        const dataStr = JSON.stringify(state, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'segundo-cerebro-backup.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    });

    document.getElementById('clear-data-btn').addEventListener('click', () => {
        if(confirm('ATENÇÃO: Isso apagará TODOS os seus dados. Esta ação não pode ser desfeita. Deseja continuar?')){
            localStorage.removeItem('segundoCerebroState');
            state = { tasks: [], notes: [] };
            renderAll();
        }
    });

    // =================================================================
    // 7. INICIALIZAÇÃO DA APLICAÇÃO
    // =================================================================
    function init() {
        loadState();
        renderAll();
        const initialPage = window.location.hash.substring(1) || 'dashboard';
        showPage(initialPage);
    }

    init();
});