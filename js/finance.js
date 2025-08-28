/**
 * MÓDULO DE FINANÇAS
 * 
 * Responsabilidades:
 * - Gerenciamento de transações financeiras
 * - Categorização de receitas e despesas
 * - Filtros e relatórios
 * - Persistência de dados
 * 
 * Refatoração aplicada:
 * - Separação de responsabilidades
 * - Nomes de variáveis mais descritivos
 * - Comentários explicativos
 * - Lógica de cálculos otimizada
 * - Código ES6+ moderno
 */

const Finance = (() => {
    
    // ===== ELEMENTOS DOM - PRINCIPAIS =====
    const addTransactionButton = document.getElementById('add-transaction-btn');
    const addIncomeButton = document.getElementById('add-income-btn');
    const addExpenseButton = document.getElementById('add-expense-btn');
    const transactionModal = document.getElementById('transaction-modal');
    const transactionForm = document.getElementById('transaction-form');
    const closeTransactionButton = document.getElementById('close-transaction-btn');
    const cancelTransactionButton = document.getElementById('cancel-transaction-btn');
    const deleteTransactionButton = document.getElementById('delete-transaction-btn');
    
    // ===== ELEMENTOS DOM - FORMULÁRIO =====
    const transactionAmount = document.getElementById('transaction-amount');
    const transactionDate = document.getElementById('transaction-date');
    const transactionDescription = document.getElementById('transaction-description');
    const quickAmounts = document.getElementById('finance-quick-amounts');
    const categoryGrid = document.getElementById('finance-category-grid');
    
    // ===== ELEMENTOS DOM - CATEGORIA =====
    const transactionCategoryButton = document.getElementById('transaction-category-btn');
    const transactionCategoryIcon = document.getElementById('transaction-category-icon');
    const transactionCategoryText = document.getElementById('transaction-category-text');
    const transactionCategoryPicker = document.getElementById('transaction-category-picker');
    
    // ===== ELEMENTOS DOM - RESUMO =====
    const totalIncomeElement = document.getElementById('finance-total-income');
    const totalExpenseElement = document.getElementById('finance-total-expense');
    const balanceElement = document.getElementById('finance-balance');
    const progressFill = document.getElementById('finance-progress-fill');
    const progressText = document.getElementById('finance-progress-text');
    const summaryTitle = document.getElementById('finance-summary-title');
    
    // ===== ELEMENTOS DOM - FILTROS =====
    const categoryModal = document.getElementById('finance-category-modal');
    const periodFilterButton = document.getElementById('finance-period-filter-btn');
    const transactionsFilterButton = document.getElementById('finance-transactions-filter-btn');
    const closeCategoryModalButton = document.getElementById('close-category-modal-btn');
    const clearCategoryFilterButton = document.getElementById('clear-category-filter-btn');
    const categoryFilterGrid = document.getElementById('finance-category-filter-grid');
    const transactionsList = document.getElementById('finance-transactions-list');
    
    // ===== ESTADO =====
    let currentTransactionType = 'expense';
    let selectedCategory = null;
    let currentPeriod = Utils.loadFromLocalStorage('finance_period', 'month');
    let currentCategory = Utils.loadFromLocalStorage('finance_category', 'all');
    let editingTransaction = null;
    
    // ===== DADOS =====
    let transactions = Utils.loadFromLocalStorage('finance_transactions', []);
    
    // ===== CONFIGURAÇÕES =====
    const EXPENSE_CATEGORIES = [
        { id: 'alimentacao', name: 'Alimentação', icon: 'bx-restaurant', color: '#F59E0B' },
        { id: 'transporte', name: 'Transporte', icon: 'bx-car', color: '#3B82F6' },
        { id: 'moradia', name: 'Moradia', icon: 'bx-home', color: '#8B5CF6' },
        { id: 'lazer', name: 'Lazer', icon: 'bx-game', color: '#EC4899' },
        { id: 'saude', name: 'Saúde', icon: 'bx-plus-medical', color: '#10B981' },
        { id: 'educacao', name: 'Educação', icon: 'bx-book', color: '#6366F1' },
        { id: 'compras', name: 'Compras', icon: 'bx-shopping-bag', color: '#EF4444' },
        { id: 'servicos', name: 'Serviços', icon: 'bx-wrench', color: '#F97316' },
        { id: 'outros', name: 'Outros', icon: 'bx-dots-horizontal', color: '#6B7280' }
    ];
    
    const INCOME_CATEGORIES = [
        { id: 'salario', name: 'Salário', icon: 'bx-money', color: '#10B981' },
        { id: 'freelance', name: 'Freelance', icon: 'bx-briefcase', color: '#3B82F6' },
        { id: 'investimentos', name: 'Investimentos', icon: 'bx-trending-up', color: '#8B5CF6' },
        { id: 'vendas', name: 'Vendas', icon: 'bx-store', color: '#F59E0B' },
        { id: 'bonus', name: 'Bônus', icon: 'bx-gift', color: '#EC4899' },
        { id: 'aluguel', name: 'Aluguel', icon: 'bx-home-heart', color: '#6366F1' },
        { id: 'outros', name: 'Outros', icon: 'bx-dots-horizontal', color: '#6B7280' }
    ];
    
    // ===== UTILITÁRIOS =====
    
    /**
     * Formata valor para moeda brasileira
     * @param {number} value - Valor a ser formatado
     * @returns {string} Valor formatado
     */
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };
    
    /**
     * Obtém categorias baseado no tipo
     * @param {string} type - 'income' ou 'expense'
     * @returns {Array} Array de categorias
     */
    const getCategories = (type) => {
        return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    };
    
    // ===== RENDERIZAÇÃO =====
    
    /**
     * Renderiza categorias no seletor
     * @param {string} type - Tipo de transação
     */
    const renderCategories = (type = 'expense') => {
        if (!transactionCategoryPicker) return;
        
        const categories = getCategories(type);
        
        transactionCategoryPicker.innerHTML = categories.map(category => `
            <button type="button" class="category-option" 
                    data-category="${category.id}" 
                    data-icon="${category.icon}" 
                    data-color="${category.color}">
                <i class='bx ${category.icon}' style="color: ${category.color}"></i>
                <span>${category.name}</span>
            </button>
        `).join('');
    };
    
    /**
     * Atualiza o seletor de categoria
     * @param {Object} category - Categoria selecionada
     */
    const updateCategorySelector = (category) => {
        if (!category) return;
        
        if (transactionCategoryIcon) {
            transactionCategoryIcon.className = `bx ${category.icon}`;
            transactionCategoryIcon.style.color = category.color;
        }
        
        if (transactionCategoryText) {
            transactionCategoryText.textContent = category.name;
        }
        
        selectedCategory = category;
    };
    
    /**
     * Cria HTML para uma transação
     * @param {Object} transaction - Objeto da transação
     * @returns {string} HTML da transação
     */
    const createTransactionHTML = (transaction) => {
        const category = getCategories(transaction.type).find(cat => cat.id === transaction.category);
        
        return `
            <div class="finance-transaction-item" data-id="${transaction.id}">
                <div class="transaction-icon">
                    <i class='bx ${category?.icon || 'bx-dots-horizontal'}' 
                       style="color: ${category?.color || '#6B7280'}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-description">${transaction.description}</div>
                    <div class="transaction-category">${category?.name || 'Sem categoria'}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}
                </div>
            </div>
        `;
    };
    
    /**
     * Renderiza lista de transações
     */
    const renderTransactions = () => {
        if (!transactionsList) return;
        
        const filteredTransactions = getFilteredTransactions();
        
        if (filteredTransactions.length === 0) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <h4>Nenhuma transação encontrada</h4>
                    <p>Adicione sua primeira transação para começar a controlar suas finanças.</p>
                </div>
            `;
        } else {
            transactionsList.innerHTML = filteredTransactions.map(createTransactionHTML).join('');
        }
    };
    
    /**
     * Calcula e renderiza resumo financeiro
     */
    const renderSummary = () => {
        const filteredTransactions = getFilteredTransactions();
        
        const totalIncome = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpense = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const balance = totalIncome - totalExpense;
        
        // Atualiza elementos
        if (totalIncomeElement) totalIncomeElement.textContent = formatCurrency(totalIncome);
        if (totalExpenseElement) totalExpenseElement.textContent = formatCurrency(totalExpense);
        if (balanceElement) balanceElement.textContent = formatCurrency(balance);
        
        // Atualiza progresso
        if (progressFill && progressText) {
            const percentage = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
            progressFill.style.width = `${Math.min(percentage, 100)}%`;
            progressText.textContent = `${percentage.toFixed(1)}%`;
        }
    };
    
    // ===== FILTROS =====
    
    /**
     * Obtém transações filtradas
     * @returns {Array} Transações filtradas
     */
    const getFilteredTransactions = () => {
        let filtered = [...transactions];
        
        // Filtro por categoria
        if (currentCategory !== 'all') {
            filtered = filtered.filter(t => t.category === currentCategory);
        }
        
        // Filtro por período
        const now = new Date();
        const startDate = new Date();
        
        switch (currentPeriod) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }
        
        filtered = filtered.filter(t => new Date(t.date) >= startDate);
        
        return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    };
    
    // ===== GERENCIAMENTO DE TRANSAÇÕES =====
    
    /**
     * Abre modal de transação
     * @param {string} type - Tipo de transação
     * @param {Object|null} transaction - Transação para edição
     */
    const openTransactionModal = (type, transaction = null) => {
        currentTransactionType = type;
        editingTransaction = transaction;
        
        // Reseta formulário
        transactionForm.reset();
        
        // Configura data atual
        if (transactionDate) {
            transactionDate.value = new Date().toISOString().split('T')[0];
        }
        
        // Renderiza categorias
        renderCategories(type);
        
        // Preenche dados se for edição
        if (transaction) {
            transactionAmount.value = transaction.amount;
            transactionDate.value = transaction.date;
            transactionDescription.value = transaction.description;
            
            const category = getCategories(type).find(cat => cat.id === transaction.category);
            updateCategorySelector(category);
            
            deleteTransactionButton.classList.remove('hidden');
        } else {
            deleteTransactionButton.classList.add('hidden');
            selectedCategory = null;
        }
        
        // Exibe modal
        document.body.classList.add('modal-open');
        transactionModal.classList.remove('hidden');
    };
    
    /**
     * Fecha modal de transação
     */
    const closeTransactionModal = () => {
        document.body.classList.remove('modal-open');
        transactionModal.classList.add('hidden');
        editingTransaction = null;
        selectedCategory = null;
    };
    
    /**
     * Salva transação
     * @param {Event} event - Evento de submissão
     */
    const saveTransaction = (event) => {
        event.preventDefault();
        
        const amount = parseFloat(transactionAmount.value);
        const date = transactionDate.value;
        const description = transactionDescription.value.trim();
        
        if (!amount || !date || !description || !selectedCategory) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        
        const transactionData = {
            id: editingTransaction?.id || Date.now(),
            type: currentTransactionType,
            amount,
            date,
            description,
            category: selectedCategory.id
        };
        
        if (editingTransaction) {
            // Edição
            const index = transactions.findIndex(t => t.id === editingTransaction.id);
            if (index > -1) {
                transactions[index] = transactionData;
            }
        } else {
            // Nova transação
            transactions.push(transactionData);
        }
        
        Utils.saveToLocalStorage('finance_transactions', transactions);
        renderTransactions();
        renderSummary();
        closeTransactionModal();
    };
    
    /**
     * Remove transação
     */
    const deleteTransaction = () => {
        if (!editingTransaction) return;
        
        if (confirm('Tem certeza que deseja excluir esta transação?')) {
            transactions = transactions.filter(t => t.id !== editingTransaction.id);
            Utils.saveToLocalStorage('finance_transactions', transactions);
            renderTransactions();
            renderSummary();
            closeTransactionModal();
        }
    };
    
    // ===== EVENT HANDLERS =====
    
    /**
     * Handler para seleção de categoria
     * @param {Event} event - Evento de clique
     */
    const handleCategorySelection = (event) => {
        const categoryOption = event.target.closest('.category-option');
        if (categoryOption) {
            const categoryData = {
                id: categoryOption.dataset.category,
                name: categoryOption.querySelector('span').textContent,
                icon: categoryOption.dataset.icon,
                color: categoryOption.dataset.color
            };
            
            updateCategorySelector(categoryData);
            transactionCategoryPicker.classList.add('hidden');
            transactionCategoryButton.classList.remove('open');
        }
    };
    
    /**
     * Handler para valores rápidos
     * @param {Event} event - Evento de clique
     */
    const handleQuickAmounts = (event) => {
        const amountButton = event.target.closest('[data-amount]');
        if (amountButton && transactionAmount) {
            transactionAmount.value = amountButton.dataset.amount;
            
            // Efeito visual
            amountButton.style.transform = 'scale(0.95)';
            amountButton.style.backgroundColor = 'var(--primary-color)';
            amountButton.style.color = 'white';
            
            setTimeout(() => {
                amountButton.style.transform = '';
                amountButton.style.backgroundColor = '';
                amountButton.style.color = '';
            }, 200);
        }
    };
    
    // ===== INICIALIZAÇÃO =====
    
    /**
     * Configura event listeners
     */
    const setupEventListeners = () => {
        // Botões principais
        if (addTransactionButton) {
            addTransactionButton.addEventListener('click', () => openTransactionModal('expense'));
        }
        
        if (addIncomeButton) {
            addIncomeButton.addEventListener('click', () => openTransactionModal('income'));
        }
        
        if (addExpenseButton) {
            addExpenseButton.addEventListener('click', () => openTransactionModal('expense'));
        }
        
        // Modal de transação
        if (closeTransactionButton) {
            closeTransactionButton.addEventListener('click', closeTransactionModal);
        }
        
        if (cancelTransactionButton) {
            cancelTransactionButton.addEventListener('click', closeTransactionModal);
        }
        
        if (deleteTransactionButton) {
            deleteTransactionButton.addEventListener('click', deleteTransaction);
        }
        
        // Formulário
        if (transactionForm) {
            transactionForm.addEventListener('submit', saveTransaction);
        }
        
        // Categoria
        if (transactionCategoryButton) {
            transactionCategoryButton.addEventListener('click', (event) => {
                event.stopPropagation();
                transactionCategoryPicker.classList.toggle('hidden');
                transactionCategoryButton.classList.toggle('open');
            });
        }
        
        if (transactionCategoryPicker) {
            transactionCategoryPicker.addEventListener('click', handleCategorySelection);
        }
        
        // Valores rápidos
        if (quickAmounts) {
            quickAmounts.addEventListener('click', handleQuickAmounts);
        }
        
        // Fechar seletor de categoria ao clicar fora
        document.addEventListener('click', () => {
            if (transactionCategoryPicker) {
                transactionCategoryPicker.classList.add('hidden');
            }
            if (transactionCategoryButton) {
                transactionCategoryButton.classList.remove('open');
            }
        });
        
        // Lista de transações
        if (transactionsList) {
            transactionsList.addEventListener('click', (event) => {
                const transactionItem = event.target.closest('.finance-transaction-item');
                if (transactionItem) {
                    const transactionId = parseInt(transactionItem.dataset.id);
                    const transaction = transactions.find(t => t.id === transactionId);
                    if (transaction) {
                        openTransactionModal(transaction.type, transaction);
                    }
                }
            });
        }
        
        // Fechar modal ao clicar fora
        if (transactionModal) {
            transactionModal.addEventListener('click', (event) => {
                if (event.target === transactionModal) {
                    closeTransactionModal();
                }
            });
        }
    };
    
    /**
     * Inicializa o módulo de finanças
     */
    const init = () => {
        setupEventListeners();
        renderTransactions();
        renderSummary();
    };
    
    /**
     * Renderiza todos os componentes
     */
    const render = () => {
        renderTransactions();
        renderSummary();
    };
    
    // ===== EXPOSIÇÃO PÚBLICA =====
    
    return {
        init,
        render
    };
})();

// Exporta para uso global
window.Finance = Finance;