/**
 * MÓDULO DE UTILITÁRIOS GERAIS
 * 
 * Responsabilidades:
 * - Gerenciamento de localStorage
 * - Formatação de datas
 * - Utilitários de DOM
 * - Sistema de notificações
 * 
 * Refatoração aplicada:
 * - Separação em funções mais específicas
 * - Nomes de variáveis mais descritivos
 * - Comentários explicativos
 * - Tratamento de erros melhorado
 * - Código ES6+ moderno
 */

const Utils = (() => {
    
    // ===== GERENCIAMENTO DE LOCALSTORAGE =====
    
    /**
     * Salva dados no localStorage com tratamento de erro
     * @param {string} key - Chave de identificação
     * @param {any} value - Valor a ser salvo
     */
    const saveToLocalStorage = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Erro ao salvar no localStorage (${key}):`, error);
        }
    };

    /**
     * Carrega dados do localStorage com valor padrão
     * @param {string} key - Chave de identificação
     * @param {any} defaultValue - Valor padrão se não existir
     * @returns {any} Dados carregados ou valor padrão
     */
    const loadFromLocalStorage = (key, defaultValue) => {
        try {
            const rawData = localStorage.getItem(key);
            
            // Retorna valor padrão se não existir
            if (rawData === null || rawData === undefined) {
                return defaultValue;
            }
            
            return JSON.parse(rawData);
        } catch (error) {
            console.warn(`Dados inválidos no localStorage para ${key}:`, error);
            
            // Remove dados corrompidos
            try {
                localStorage.removeItem(key);
            } catch (removeError) {
                console.error('Erro ao remover dados corrompidos:', removeError);
            }
            
            return defaultValue;
        }
    };

    // ===== FORMATAÇÃO DE DATAS =====
    
    /**
     * Obtém a data atual no formato YYYY-MM-DD (fuso horário Brasil)
     * @returns {string} Data formatada
     */
    const getTodayString = () => {
        const now = new Date();
        const brasiliaOffset = -3; // UTC-3 (Brasil)
        
        // Converte para fuso horário de Brasília
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        const brasiliaTime = new Date(utcTime + (brasiliaOffset * 3600000));
        
        return brasiliaTime.toISOString().split('T')[0];
    };

    /**
     * Formata data para formato brasileiro longo
     * @param {string} dateString - Data em formato ISO
     * @returns {string} Data formatada em português
     */
    const formatDateToBR = (dateString) => {
        try {
            if (!dateString) return 'N/A';
            
            const date = new Date(dateString);
            
            // Verifica se a data é válida
            if (Number.isNaN(date.getTime())) {
                return 'N/A';
            }
            
            return new Intl.DateTimeFormat('pt-BR', { 
                dateStyle: 'long' 
            }).format(date);
        } catch (error) {
            console.warn('Erro ao formatar data:', error);
            return 'N/A';
        }
    };

    // ===== UTILITÁRIOS DE DOM =====
    
    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text - Texto a ser escapado
     * @returns {string} Texto seguro para HTML
     */
    const escapeHTML = (text) => {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    };

    // ===== SISTEMA DE NOTIFICAÇÕES =====
    
    /**
     * Exibe modal de notificação/confirmação
     * @param {string} message - Mensagem a ser exibida
     * @param {string|function} titleOrCallback - Título ou função de callback
     * @param {function|null} callback - Função de callback (opcional)
     */
    const showNotice = (message, titleOrCallback = 'Aviso', callback = null) => {
        // Elementos do modal
        const modal = document.getElementById('app-notice-modal');
        const titleElement = document.getElementById('app-notice-title');
        const textElement = document.getElementById('app-notice-text');
        const okButton = document.getElementById('app-notice-ok');
        const cancelButton = document.getElementById('app-notice-cancel');
        
        // Verifica se todos os elementos existem
        if (!modal || !titleElement || !textElement || !okButton) {
            console.error('Elementos do modal de notificação não encontrados');
            return;
        }
        
        // Determina título e callback baseado nos parâmetros
        let title = 'Aviso';
        let onConfirm = null;
        
        if (typeof titleOrCallback === 'function') {
            onConfirm = titleOrCallback;
        } else {
            title = titleOrCallback;
            onConfirm = callback;
        }
        
        // Configura conteúdo do modal
        titleElement.textContent = title;
        textElement.textContent = message;
        
        // Exibe modal
        document.body.classList.add('modal-open');
        modal.classList.remove('hidden');
        
        // Configura botões baseado no tipo de modal
        if (onConfirm && cancelButton) {
            // Modal de confirmação (2 botões)
            cancelButton.classList.remove('hidden');
            okButton.textContent = 'Confirmar';
            okButton.className = 'soft-button danger';
        } else {
            // Modal de aviso (1 botão)
            if (cancelButton) {
                cancelButton.classList.add('hidden');
            }
            okButton.textContent = 'OK';
            okButton.className = 'soft-button';
        }
        
        // Função para fechar modal
        const closeModal = () => {
            document.body.classList.remove('modal-open');
            modal.classList.add('hidden');
        };
        
        // Event listeners
        okButton.onclick = () => {
            closeModal();
            if (onConfirm) {
                onConfirm();
            }
        };
        
        if (cancelButton) {
            cancelButton.onclick = closeModal;
        }
        
        // Fecha ao clicar fora do modal
        modal.onclick = (event) => {
            if (event.target === modal) {
                closeModal();
            }
        };
    };

    // ===== EXPOSIÇÃO PÚBLICA =====
    
    return {
        // LocalStorage
        saveToLocalStorage,
        loadFromLocalStorage,
        
        // Datas
        getTodayString,
        formatDateToBR,
        
        // DOM
        escapeHTML,
        
        // Notificações
        showNotice
    };
})();

// Exporta para uso global
window.Utils = Utils;