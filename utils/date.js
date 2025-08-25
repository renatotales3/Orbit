// Life OS - Utilitários de Data
// Manipulação de datas com suporte ao fuso horário brasileiro

const DateUtils = (() => {
    // Fuso horário brasileiro (UTC-3)
    const BRASILIA_OFFSET = -3;
    
    // Obter data atual no fuso brasileiro
    const getNow = () => {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        return new Date(utc + (BRASILIA_OFFSET * 3600000));
    };
    
    // Obter string da data atual (YYYY-MM-DD)
    const getTodayString = () => {
        return getNow().toISOString().split('T')[0];
    };
    
    // Obter string da data de ontem
    const getYesterdayString = () => {
        const yesterday = new Date(getNow());
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    };
    
    // Obter string da data de amanhã
    const getTomorrowString = () => {
        const tomorrow = new Date(getNow());
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };
    
    // Formatar data para exibição brasileira
    const formatToBR = (dateString, options = {}) => {
        try {
            if (!dateString) return 'N/A';
            
            const date = new Date(dateString);
            if (Number.isNaN(date.getTime())) return 'N/A';
            
            const defaultOptions = {
                dateStyle: 'long',
                timeStyle: options.timeStyle || undefined
            };
            
            return new Intl.DateTimeFormat('pt-BR', defaultOptions).format(date);
        } catch (error) {
            console.warn('Erro ao formatar data:', error);
            return 'N/A';
        }
    };
    
    // Formatar data para exibição curta
    const formatToShort = (dateString) => {
        try {
            if (!dateString) return 'N/A';
            
            const date = new Date(dateString);
            if (Number.isNaN(date.getTime())) return 'N/A';
            
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).format(date);
        } catch (error) {
            console.warn('Erro ao formatar data curta:', error);
            return 'N/A';
        }
    };
    
    // Formatar data para exibição relativa
    const formatRelative = (dateString) => {
        try {
            if (!dateString) return 'N/A';
            
            const date = new Date(dateString);
            if (Number.isNaN(date.getTime())) return 'N/A';
            
            const now = getNow();
            const diffTime = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                return 'Hoje';
            } else if (diffDays === 1) {
                return 'Ontem';
            } else if (diffDays === -1) {
                return 'Amanhã';
            } else if (diffDays > 1 && diffDays < 7) {
                return `${diffDays} dias atrás`;
            } else if (diffDays < -1 && diffDays > -7) {
                return `Em ${Math.abs(diffDays)} dias`;
            } else {
                return formatToShort(dateString);
            }
        } catch (error) {
            console.warn('Erro ao formatar data relativa:', error);
            return 'N/A';
        }
    };
    
    // Verificar se uma data é hoje
    const isToday = (dateString) => {
        if (!dateString) return false;
        return dateString === getTodayString();
    };
    
    // Verificar se uma data é ontem
    const isYesterday = (dateString) => {
        if (!dateString) return false;
        return dateString === getYesterdayString();
    };
    
    // Verificar se uma data é amanhã
    const isTomorrow = (dateString) => {
        if (!dateString) return false;
        return dateString === getTomorrowString();
    };
    
    // Obter dia da semana
    const getDayOfWeek = (dateString) => {
        try {
            if (!dateString) return 'N/A';
            
            const date = new Date(dateString);
            if (Number.isNaN(date.getTime())) return 'N/A';
            
            const days = [
                'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
                'Quinta-feira', 'Sexta-feira', 'Sábado'
            ];
            
            return days[date.getDay()];
        } catch (error) {
            console.warn('Erro ao obter dia da semana:', error);
            return 'N/A';
        }
    }
    
    // Obter mês
    const getMonth = (dateString) => {
        try {
            if (!dateString) return 'N/A';
            
            const date = new Date(dateString);
            if (Number.isNaN(date.getTime())) return 'N/A';
            
            const months = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
            ];
            
            return months[date.getMonth()];
        } catch (error) {
            console.warn('Erro ao obter mês:', error);
            return 'N/A';
        }
    };
    
    // Calcular diferença em dias entre duas datas
    const getDaysDifference = (date1, date2) => {
        try {
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            
            if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) {
                return null;
            }
            
            const diffTime = d2.getTime() - d1.getTime();
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {
            console.warn('Erro ao calcular diferença de dias:', error);
            return null;
        }
    };
    
    // Obter datas da semana atual
    const getCurrentWeekDates = () => {
        try {
            const now = getNow();
            const currentDay = now.getDay();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - currentDay);
            
            const weekDates = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + i);
                weekDates.push(date.toISOString().split('T')[0]);
            }
            
            return weekDates;
        } catch (error) {
            console.warn('Erro ao obter datas da semana:', error);
            return [];
        }
    };
    
    // Obter datas do mês atual
    const getCurrentMonthDates = () => {
        try {
            const now = getNow();
            const year = now.getFullYear();
            const month = now.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            const monthDates = [];
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                monthDates.push(date.toISOString().split('T')[0]);
            }
            
            return monthDates;
        } catch (error) {
            console.warn('Erro ao obter datas do mês:', error);
            return [];
        }
    };
    
    // Verificar se uma data está na semana atual
    const isInCurrentWeek = (dateString) => {
        if (!dateString) return false;
        const weekDates = getCurrentWeekDates();
        return weekDates.includes(dateString);
    };
    
    // Verificar se uma data está no mês atual
    const isInCurrentMonth = (dateString) => {
        if (!dateString) return false;
        const monthDates = getCurrentMonthDates();
        return monthDates.includes(dateString);
    };
    
    // Adicionar dias a uma data
    const addDays = (dateString, days) => {
        try {
            if (!dateString) return null;
            
            const date = new Date(dateString);
            if (Number.isNaN(date.getTime())) return null;
            
            date.setDate(date.getDate() + days);
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.warn('Erro ao adicionar dias:', error);
            return null;
        }
    };
    
    // Subtrair dias de uma data
    const subtractDays = (dateString, days) => {
        return addDays(dateString, -days);
    };
    
    // Obter timestamp atual
    const getCurrentTimestamp = () => {
        return getNow().toISOString();
    };
    
    // Formatar timestamp para exibição
    const formatTimestamp = (timestamp) => {
        try {
            if (!timestamp) return 'N/A';
            
            const date = new Date(timestamp);
            if (Number.isNaN(date.getTime())) return 'N/A';
            
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (error) {
            console.warn('Erro ao formatar timestamp:', error);
            return 'N/A';
        }
    };
    
    // API pública
    return {
        // Datas básicas
        getNow,
        getTodayString,
        getYesterdayString,
        getTomorrowString,
        
        // Formatação
        formatToBR,
        formatToShort,
        formatRelative,
        formatTimestamp,
        
        // Verificações
        isToday,
        isYesterday,
        isTomorrow,
        isInCurrentWeek,
        isInCurrentMonth,
        
        // Informações de data
        getDayOfWeek,
        getMonth,
        
        // Cálculos
        getDaysDifference,
        addDays,
        subtractDays,
        
        // Períodos
        getCurrentWeekDates,
        getCurrentMonthDates,
        
        // Timestamps
        getCurrentTimestamp
    };
})();