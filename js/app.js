/* ============================================
   APP.JS - JavaScript base de TODAS as páginas
   ============================================ */

/**
 * Executa quando a página termina de carregar
 */
document.addEventListener('DOMContentLoaded', function() {
    atualizarData();
    marcarMenuAtivo();
});

/**
 * Mostra a data atual no formato brasileiro no cabeçalho
 * Exemplo: "Quinta-feira, 31 de Julho de 2026"
 */
function atualizarData() {
    const hoje = new Date();
    
    // Opções de formatação em português do Brasil
    const opcoes = { 
        weekday: 'long',      // dia da semana por extenso
        year: 'numeric',      // ano com 4 dígitos
        month: 'long',        // mês por extenso
        day: 'numeric'        // dia do mês
    };
    
    // Formata a data para pt-BR
    const dataFormatada = hoje.toLocaleDateString('pt-BR', opcoes);
    
    // Coloca no elemento com id="dataAtual"
    const elementoData = document.getElementById('dataAtual');
    if (elementoData) {
        elementoData.textContent = dataFormatada;
    }
}

/**
 * Destaca no menu qual página está aberta no momento
 */
function marcarMenuAtivo() {
    // Pega o nome do arquivo atual (ex: "dashboard.html")
    const paginaAtual = window.location.pathname.split('/').pop();
    
    // Pega todos os links do menu
    const linksMenu = document.querySelectorAll('.menu-item');
    
    linksMenu.forEach(function(link) {
        // Remove a classe "ativo" de todos
        link.classList.remove('ativo');
        
        // Se o href do link for igual à página atual, adiciona "ativo"
        if (link.getAttribute('href') === paginaAtual) {
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
    
    menu.classList.toggle('aberto');
    overlay.classList.toggle('ativo');
}

/**
 * Função de sair (por enquanto só volta para o login)
 */
function sair() {
    // Futuramente vamos limpar a sessão aqui
    alert('Você saiu do sistema!');
    window.location.href = 'index.html';
}