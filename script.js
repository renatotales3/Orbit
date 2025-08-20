document.addEventListener('DOMContentLoaded', () => {
    // Seletores do DOM
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    const modalContainer = document.getElementById('modal-container');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalForm = document.getElementById('modal-form');
    const addButtons = document.querySelectorAll('.add-btn');
    const modalTitle = document.getElementById('modal-title');
    const editIdInput = document.getElementById('edit-id');
    const editTabInput = document.getElementById('edit-tab');

    // "Banco de Dados" em memória
    let db = {
        notas: [],
        tarefas: [],
        calendario: [],
        leituras: [],
        habitos: []
    };

    // --- LÓGICA DE DADOS (LocalStorage) ---

    const saveData = () => {
        localStorage.setItem('segundoCerebroDB', JSON.stringify(db));
    };

    const loadData = () => {
        const localData = localStorage.getItem('segundoCerebroDB');
        if (localData) {
            db = JSON.parse(localData);
        } else {
            // Adiciona dados de exemplo se for o primeiro uso
            db.notas.push({ id: Date.now(), titulo: 'Bem-vindo!', descricao: 'Clique no card para editar ou no "+" para criar uma nova nota.' });
        }
    };

    // --- LÓGICA DE RENDERIZAÇÃO ---

    const renderCards = (tab) => {
        const grid = document.getElementById(`${tab}-grid`);
        if (!grid) return;
        
        grid.innerHTML = ''; // Limpa a grid antes de renderizar
        if (db[tab] && db[tab].length > 0) {
            db[tab].forEach(item => {
                const card = document.createElement('div');
                card.className = 'card';
                card.dataset.id = item.id;
                card.dataset.tab = tab;
                
                card.innerHTML = `
                    <h3>${item.titulo}</h3>
                    <p>${item.descricao.substring(0, 100)}${item.descricao.length > 100 ? '...' : ''}</p>
                `;
                grid.appendChild(card);
            });
        } else {
             if (tab !== 'configuracoes') {
                grid.innerHTML = '<p class="config-placeholder">Nenhum item aqui. Clique em "+" para adicionar.</p>';
            }
        }
    };

    const renderAllTabs = () => {
        Object.keys(db).forEach(tab => renderCards(tab));
    };
    
    // --- LÓGICA DE NAVEGAÇÃO E MODAL ---

    const switchView = (targetId) => {
        views.forEach(view => view.classList.remove('active-view'));
        document.getElementById(targetId)?.classList.add('active-view');
        
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.target === targetId);
        });
    };

    const openModal = (mode = 'add', tab = null, id = null) => {
        modalForm.reset();
        if (mode === 'edit' && tab && id) {
            const item = db[tab].find(i => i.id == id);
            if (item) {
                modalTitle.textContent = `Editar ${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
                document.getElementById('item-title').value = item.titulo;
                document.getElementById('item-description').value = item.descricao;
                editIdInput.value = id;
                editTabInput.value = tab;
            }
        } else {
            modalTitle.textContent = `Novo em ${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
            editIdInput.value = '';
            editTabInput.value = tab;
        }
        modalContainer.classList.remove('hidden');
    };

    const closeModal = () => {
        modalContainer.classList.add('hidden');
    };

    // --- MANIPULADORES DE EVENTOS ---

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            switchView(button.dataset.target);
        });
    });

    addButtons.forEach(button => {
        button.addEventListener('click', () => {
            openModal('add', button.dataset.tab);
        });
    });

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        if (card) {
            const { id, tab } = card.dataset;
            openModal('edit', tab, id);
        }
    });

    modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = editIdInput.value;
        const tab = editTabInput.value;
        const title = document.getElementById('item-title').value.trim();
        const description = document.getElementById('item-description').value.trim();
        
        if (!title) return;

        if (id) { // Editando
            const itemIndex = db[tab].findIndex(i => i.id == id);
            if (itemIndex > -1) {
                db[tab][itemIndex] = { ...db[tab][itemIndex], titulo: title, descricao: description };
            }
        } else { // Adicionando
            db[tab].push({ id: Date.now(), titulo: title, descricao: description });
        }
        
        saveData();
        renderCards(tab);
        closeModal();
    });

    closeModalBtn.addEventListener('click', closeModal);
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            closeModal();
        }
    });

    // --- INICIALIZAÇÃO ---

    const init = () => {
        loadData();
        switchView('notas'); // Aba inicial
        renderAllTabs();
    };

    init();
});
