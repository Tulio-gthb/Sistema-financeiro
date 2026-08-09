/* ============================================
   DASHBOARD.JS - Painel principal dinâmico
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ dashboard.js carregado');
    carregarDashboard();
});

function carregarDashboard() {
    console.log('📊 Carregando dashboard...');
    
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;

    const totais = calcularTotaisDoMes(ano, mes);
    const saldoAtual = calcularSaldoAteData(hoje.toISOString().split('T')[0]);

    console.log('💰 Totais:', totais);
    console.log('💳 Saldo atual:', saldoAtual);

    atualizarCartao('cartaoSaldo', saldoAtual);
    atualizarCartao('cartaoReceitas', totais.receitas, 'receita');
    atualizarCartao('cartaoDespesas', totais.despesas, 'despesa');

    const elementoPendentes = document.getElementById('contasPendentes');
    if (elementoPendentes) {
        elementoPendentes.textContent = totais.contasPendentes + ' conta' + (totais.contasPendentes !== 1 ? 's' : '') + ' pendente' + (totais.contasPendentes !== 1 ? 's' : '');
    }

    // ⭐ CHAMA O ASSISTENTE
    if (typeof renderizarAssistente === 'function') {
        renderizarAssistente();
    } else {
        console.error('❌ Função renderizarAssistente NÃO EXISTE! Verifique se assistente.js está carregado antes de dashboard.js');
    }

    atualizarGraficoPlaceholder(totais);
}

function atualizarCartao(idElemento, valor, tipo) {
    const elemento = document.getElementById(idElemento);
    if (!elemento) {
        console.error('❌ Cartão #' + idElemento + ' não encontrado');
        return;
    }
    
    const formatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);

    elemento.textContent = formatado;
    elemento.classList.remove('receita', 'despesa');
    if (tipo === 'receita') elemento.classList.add('receita');
    if (tipo === 'despesa') elemento.classList.add('despesa');
}

function atualizarGraficoPlaceholder(totais) {
    const placeholder = document.getElementById('graficoPlaceholder');
    if (!placeholder) return;

    const percentual = totais.receitas > 0 
        ? Math.round((totais.despesas / totais.receitas) * 100) 
        : 0;

    placeholder.innerHTML = 
        '📊 Gráfico será inserido na próxima etapa (Chart.js)<br>' +
        '<small style="color:var(--cor-texto-claro);">Comprometimento da renda: <strong>' + percentual + '%</strong></small>';
}