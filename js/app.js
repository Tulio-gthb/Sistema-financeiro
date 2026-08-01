/* ============================================
   APP.JS - JavaScript base de TODAS as páginas
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    // Se esta página NÃO for o login, verifica autenticação
    const ehPaginaLogin = window.location.pathname.includes('index.html');
    
    if (!ehPaginaLogin) {
        // Protege a página: só entra se estiver logado
        preencherUsuarioLogado();
    }
    
    atualizarData();
    marcarMenuAtivo();
});

/**
 * Mostra a data atual no formato brasileiro no cabeçalho
 */
function atualizarData() {
    const hoje = new Date();
    const opcoes = { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const dataFormatada = hoje.toLocaleDateString('pt-BR', opcoes);
    const elementoData = document.getElementById('dataAtual');
    if (elementoData) {
        elementoData.textContent = dataFormatada;
    }
}

/**
 * Destaca no menu qual página está aberta no momento
 */
function marcarMenuAtivo() {
    const paginaAtual = window.location.pathname.split('/').pop() || 'dashboard.html';
    const linksMenu = document.querySelectorAll('.menu-item');
    
    linksMenu.forEach(function(link) {
        link.classList.remove('ativo');
        const href = link.getAttribute('href');
        if (href === paginaAtual || (paginaAtual === '' && href === 'dashboard.html')) {
            link.classList.add('ativo');
        }
    });
}

/**
 * Abre/fecha o menu lateral no celular
 */
function toggleMenu() {
    const menu = document.getElementById('menuLateral');
    const overlay = document.getElementById('overlay');
    if (menu && overlay) {
        menu.classList.toggle('aberto');
        overlay.classList.toggle('ativo');
    }
}