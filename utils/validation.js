// Life OS - Sistema de Validação
// Validações para dados de entrada com regras específicas do Life OS

const Validation = (() => {
    // Regras de validação
    const rules = {
        // Tarefas
        task: {
            text: {
                required: true,
                minLength: 1,
                maxLength: 200,
                pattern: /^[^<>{}]*$/
            },
            priority: {
                required: true,
                allowedValues: [1, 2, 3]
            }
        },
        
        // Metas
        goal: {
            title: {
                required: true,
                minLength: 3,
                maxLength: 100,
                pattern: /^[^<>{}]*$/
            },
            description: {
                required: false,
                maxLength: 500,
                pattern: /^[^<>{}]*$/
            },
            deadline: {
                required: false,
                type: 'date',
                futureOnly: true
            }
        },
        
        // Hábitos
        habit: {
            name: {
                required: true,
                minLength: 2,
                maxLength: 50,
                pattern: /^[^<>{}]*$/
            },
            frequency: {
                required: true,
                allowedValues: ['daily', 'weekly', 'monthly']
            }
        },
        
        // Entradas de humor
        mood: {
            value: {
                required: true,
                allowedValues: [1, 2, 3, 4, 5]
            },
            note: {
                required: false,
                maxLength: 300,
                pattern: /^[^<>{}]*$/
            }
        },
        
        // Entradas de diário
        journal: {
            content: {
                required: true,
                minLength: 10,
                maxLength: 2000,
                pattern: /^[^<>{}]*$/
            }
        },
        
        // MITs
        mit: {
            text: {
                required: true,
                minLength: 3,
                maxLength: 150,
                pattern: /^[^<>{}]*$/
            }
        },
        
        // Review do dia
        review: {
            good: {
                required: false,
                maxLength: 500,
                pattern: /^[^<>{}]*$/
            },
            delay: {
                required: false,
                maxLength: 500,
                pattern: /^[^<>{}]*$/
            },
            learn: {
                required: false,
                maxLength: 500,
                pattern: /^[^<>{}]*$/
            }
        },
        
        // Transações financeiras
        transaction: {
            amount: {
                required: true,
                type: 'number',
                min: 0.01,
                max: 999999.99
            },
            description: {
                required: true,
                minLength: 3,
                maxLength: 100,
                pattern: /^[^<>{}]*$/
            },
            category: {
                required: true,
                minLength: 1,
                maxLength: 50
            },
            date: {
                required: true,
                type: 'date',
                pastOnly: false
            }
        }
    };
    
    // Validar campo individual
    const validateField = (value, fieldRules) => {
        const errors = [];
        
        try {
            // Verificar se é obrigatório
            if (fieldRules.required && (value === null || value === undefined || value === '')) {
                errors.push('Campo obrigatório');
                return errors;
            }
            
            // Se não é obrigatório e está vazio, é válido
            if (!fieldRules.required && (value === null || value === undefined || value === '')) {
                return errors;
            }
            
            // Verificar comprimento mínimo
            if (fieldRules.minLength && String(value).length < fieldRules.minLength) {
                errors.push(`Mínimo de ${fieldRules.minLength} caracteres`);
            }
            
            // Verificar comprimento máximo
            if (fieldRules.maxLength && String(value).length > fieldRules.maxLength) {
                errors.push(`Máximo de ${fieldRules.maxLength} caracteres`);
            }
            
            // Verificar padrão (regex)
            if (fieldRules.pattern && !fieldRules.pattern.test(String(value))) {
                errors.push('Formato inválido');
            }
            
            // Verificar valores permitidos
            if (fieldRules.allowedValues && !fieldRules.allowedValues.includes(value)) {
                errors.push(`Valor deve ser um dos seguintes: ${fieldRules.allowedValues.join(', ')}`);
            }
            
            // Verificar tipo
            if (fieldRules.type === 'number') {
                const numValue = Number(value);
                if (Number.isNaN(numValue)) {
                    errors.push('Deve ser um número');
                } else {
                    // Verificar valor mínimo
                    if (fieldRules.min !== undefined && numValue < fieldRules.min) {
                        errors.push(`Valor mínimo: ${fieldRules.min}`);
                    }
                    
                    // Verificar valor máximo
                    if (fieldRules.max !== undefined && numValue > fieldRules.max) {
                        errors.push(`Valor máximo: ${fieldRules.max}`);
                    }
                }
            }
            
            // Verificar tipo de data
            if (fieldRules.type === 'date') {
                const date = new Date(value);
                if (Number.isNaN(date.getTime())) {
                    errors.push('Data inválida');
                } else {
                    // Verificar se deve ser apenas futura
                    if (fieldRules.futureOnly) {
                        const now = new Date();
                        if (date <= now) {
                            errors.push('Data deve ser futura');
                        }
                    }
                    
                    // Verificar se deve ser apenas passada
                    if (fieldRules.pastOnly) {
                        const now = new Date();
                        if (date >= now) {
                            errors.push('Data deve ser passada');
                        }
                    }
                }
            }
            
        } catch (error) {
            console.error('Erro durante validação:', error);
            errors.push('Erro de validação');
        }
        
        return errors;
    };
    
    // Validar objeto completo
    const validateObject = (data, schema) => {
        const errors = {};
        let isValid = true;
        
        try {
            Object.keys(schema).forEach(fieldName => {
                const fieldRules = schema[fieldName];
                const fieldValue = data[fieldName];
                
                const fieldErrors = validateField(fieldValue, fieldRules);
                
                if (fieldErrors.length > 0) {
                    errors[fieldName] = fieldErrors;
                    isValid = false;
                }
            });
            
        } catch (error) {
            console.error('Erro durante validação do objeto:', error);
            errors.general = ['Erro de validação'];
            isValid = false;
        }
        
        return {
            isValid,
            errors
        };
    };
    
    // Sanitizar texto (remover caracteres perigosos)
    const sanitizeText = (text) => {
        if (typeof text !== 'string') return text;
        
        return text
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/{/g, '&#123;')
            .replace(/}/g, '&#125;')
            .trim();
    };
    
    // API pública
    return {
        // Validações específicas
        validateTask: (data) => validateObject(data, rules.task),
        validateGoal: (data) => validateObject(data, rules.goal),
        validateHabit: (data) => validateObject(data, rules.habit),
        validateMood: (data) => validateObject(data, rules.mood),
        validateJournal: (data) => validateObject(data, rules.journal),
        validateMIT: (data) => validateObject(data, rules.mit),
        validateReview: (data) => validateObject(data, rules.review),
        validateTransaction: (data) => validateObject(data, rules.transaction),
        
        // Validações genéricas
        validateField,
        validateObject,
        
        // Utilitários
        sanitizeText,
        
        // Regras disponíveis
        rules
    };
})();