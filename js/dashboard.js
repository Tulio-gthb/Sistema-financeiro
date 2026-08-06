/* ============================================
   DASHBOARD.JS - Painel principal dinâmico
   ============================================
   Busca os dados reais no storage e atualiza
   os cartões, gráficos e o assistente.
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    carregarDashboard();
});

function carregarDashboard() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;
    
    // 1. Busca os totais reais do mês atual
    const totais = calcularTotaisDoMes(ano, mes);
    
    // 2. Calcula saldo acumulado até hoje
    const saldoAtual = calcularSaldoAteData(hoje.toISOString().split('T')[0]);
    
    // 3. Atualiza os cartões
    atualizarCartao('cartaoSaldo', saldoAtual);
    atualizarCartao('cartaoReceitas', totais.receitas, 'receita');
    atualizarCartao('cartaoDespesas', totais.despesas, 'despesa');
    
    // 4. Atualiza contador de contas pendentes
    const elementoPendentes = document.getElementById('contasPendentes');
    if (elementoPendentes) {
        elementoPendentes.textContent = totais.contasPendentes + ' conta' + (totais.contasPendentes !== 1 ? 's' : '');
    }
    
    // 5. Atualiza o assistente com dicas reais
    atualizarAssistente(totais, saldoAtual);
    
    // 6. Atualiza o gráfico placeholder com números reais
    atualizarGraficoPlaceholder(totais);
}

/**
 * Atualiza o valor de um cartão com animação simples.
 */
function atualizarCartao(idElemento, valor, tipo) {
    const elemento = document.getElementById(idElemento);
    if (!elemento) return;
    
    // Formata como moeda brasileira: R$ 12.450,00
    const formatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
    
    elemento.textContent = formatado;
    
    // Adiciona classe de cor se for receita/despesa
    if (tipo === 'receita') {
        elemento.classList.add('receita');
    } else if (tipo === 'despesa') {
        elemento.classList.add('despesa');
    }
}

/**
 * Gera dicas do assistente baseadas em dados reais.
 */
function atualizarAssistente(totais, saldo) {
    const assistenteTexto = document.getElementById('assistenteTexto');
    if (!assistenteTexto) return;
    
    const hoje = new Date();
    const dia = hoje.getDate();
    
    let mensagem = '';
    
    // Dica 1: Saldo negativo
    if (saldo < 0) {
        mensagem = '⚠️ Seu saldo está negativo em ' + formatarMoeda(Math.abs(saldo)) + 
                   '. Recomendamos revisar as despesas pendentes do mês.';
    }
    // Dica 2: Muitas contas pendentes no começo do mês
    else if (totais.contasPendentes > 2 && dia < 15) {
        mensagem = '💡 Você tem ' + totais.contasPendentes + ' contas pendentes. ' +
                   'O total de despesas previstas é ' + formatarMoeda(totais.despesas) + 
                   '. Fique de olho nos vencimentos!';
    }
    // Dica 3: Sobra de caixa
    else if (saldo > 3000 && totais.contasPendentes === 0) {
        mensagem = '🎉 Excelente! Você tem ' + formatarMoeda(saldo) + 
                   ' de saldo e nenhuma conta pendente. ' +
                   'Que tal reservar uma parte para investimentos?';
    }
    // Dica 4: Padrão
    else {
        mensagem = '📊 Este mês você tem ' + formatarMoeda(totais.receitas) + 
                   ' em receitas e ' + formatarMoeda(totais.despesas) + 
                   ' em despesas. Saldo projetado: ' + formatarMoeda(totais.saldo) + '.';
    }
    
    assistenteTexto.textContent = mensagem;
}

/**
 * Atualiza o texto do placeholder do gráfico.
 */
function atualizarGraficoPlaceholder(totais) {
    const placeholder = document.getElementById('graficoPlaceholder');
    if (!placeholder) return;
    
    const percentual = totais.receitas > 0 
        ? Math.round((totais.despesas / totais.receitas) * 100) 
        : 0;
    
    placeholder.innerHTML = 
        '📊 Gráfico será inserido aqui na próxima etapa (Chart.js)<br>' +
        '<small>Comprometimento da renda: <strong>' + percentual + '%</strong></small>';
}

/**
 * Formata número para moeda brasileira.
 */
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}