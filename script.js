// Espera o documento HTML ser completamente carregado
document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA PARA TROCA DE ABAS ---

    const navButtons = document.querySelectorAll('.nav-button');
    const pages = document.querySelectorAll('.page');

    // Adiciona um evento de clique para cada botão do menu
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const targetPage = document.getElementById(targetId);

            // Remove a classe 'active' de todos os botões e páginas
            navButtons.forEach(btn => btn.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active'));

            // Adiciona a classe 'active' ao botão clicado e à página correspondente
            button.classList.add('active');
            targetPage.classList.add('active');
        });
    });

    // --- LÓGICA PARA TROCA DE TEMA ---

    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement; // A tag <html>

    // Função para aplicar o tema salvo
    const applyTheme = (theme) => {
        htmlElement.setAttribute('data-theme', theme);
        // Salva a preferência do usuário no armazenamento local
        localStorage.setItem('theme', theme);
    };

    // Verifica se já existe um tema salvo no armazenamento local
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // Adiciona o evento de clique ao botão de toggle
    themeToggle.addEventListener('click', () => {
        // Verifica qual o tema atual e troca para o outro
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });

});