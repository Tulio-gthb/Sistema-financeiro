/* ============================================
   ASSISTENTE.JS - Motor de Sugestões
   ============================================ */

console.log('✅ assistente.js carregado');

function gerarSugestoes() {
    console.log('🧠 Gerando sugestões...');
    
    const sugestoes = [];
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;
    
    const lancamentos = buscarLancamentosPorMes(ano, mes, 'todos');
    const totais = calcularTotaisDoMes(ano, mes);
    const saldoAtual = calcularSaldoAteData(hoje.toISOString().split('T')[0]);
    
    console.log('📊 Dados analisados:', { saldoAtual, receitas: totais.receitas, despesas: totais.despesas, contasPendentes: totais.contasPendentes });

    // REGRA 1: Furo de caixa
    const diasNoMes = new Date(ano, mes, 0).getDate();
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const dataStr = ano + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
        const saldoDia = calcularSaldoAteData(dataStr);
        if (saldoDia < 0) {
            sugestoes.push({
                tipo: 'perigo',
                icone: '🔴',
                titulo: 'Furo de caixa detectado',
                mensagem: 'Seu saldo ficará negativo no dia <strong>' + dia + '/' + String(mes).padStart(2, '0') + '</strong>. Faltarão <strong>' + formatarMoedaAssistente(Math.abs(saldoDia)) + '</strong>. Sugerimos negociar vencimentos ou antecipar receitas.',
                prioridade: 1
            });
            break;
        }
    }

    // REGRA 2: Contas antes do salário
    const receitasPendentes = lancamentos.filter(function(l) {
        return l.tipo === 'receita' && l.status === 'pendente';
    }).sort(function(a, b) { return new Date(a.data) - new Date(b.data); });

    const despesasPendentes = lancamentos.filter(function(l) {
        return l.tipo === 'despesa' && l.status === 'pendente';
    });

    if (receitasPendentes.length > 0) {
        const primeiraReceita = receitasPendentes[0];
        const diaReceita = parseInt(primeiraReceita.data.split('-')[2]);
        const despesasAntes = despesasPendentes.filter(function(d) {
            const diaDespesa = parseInt(d.data.split('-')[2]);
            return diaDespesa < diaReceita && diaDespesa >= hoje.getDate();
        });

        if (despesasAntes.length > 0) {
            const totalAntes = despesasAntes.reduce(function(s, d) { return s + parseFloat(d.valor || 0); }, 0);
            const nomes = despesasAntes.map(function(d) { return d.descricao; }).join(', ');
            sugestoes.push({
                tipo: 'alerta',
                icone: '⚠️',
                titulo: 'Contas antes do recebimento',
                mensagem: 'Você tem <strong>' + formatarMoedaAssistente(totalAntes) + '</strong> em contas (' + nomes + ') para pagar antes do <strong>' + primeiraReceita.descricao + '</strong> (dia ' + diaReceita + '). Verifique se seu saldo cobre.',
                prioridade: 2
            });
        }
    }

    // REGRA 3: Sobra de caixa
    if (saldoAtual > 3000 && despesasPendentes.length > 0) {
        sugestoes.push({
            tipo: 'dica',
            icone: '💡',
            titulo: 'Sobra de caixa',
            mensagem: 'Seu saldo está em <strong>' + formatarMoedaAssistente(saldoAtual) + '</strong>. Se todas as contas do mês estiverem pagas, considere reservar parte para investimentos ou reserva de emergência.',
            prioridade: 3
        });
    }

    // REGRA 4: Renda comprometida
    if (totais.receitas > 0) {
        const percentual = (totais.despesas / totais.receitas) * 100;
        if (percentual > 90) {
            sugestoes.push({
                tipo: 'alerta',
                icone: '📉',
                titulo: 'Renda muito comprometida',
                mensagem: 'Suas despesas representam <strong>' + percentual.toFixed(1) + '%</strong> da renda. Restam apenas <strong>' + formatarMoedaAssistente(totais.receitas - totais.despesas) + '</strong>. Reveja gastos não essenciais.',
                prioridade: 2
            });
        } else if (percentual < 50 && totais.receitas > 5000) {
            sugestoes.push({
                tipo: 'positivo',
                icone: '🎉',
                titulo: 'Ótima margem de economia',
                mensagem: 'Você usa apenas <strong>' + percentual.toFixed(1) + '%</strong> da renda. Sobra prevista: <strong>' + formatarMoedaAssistente(totais.receitas - totais.despesas) + '</strong>. Que tal investir?',
                prioridade: 4
            });
        }
    }

    // REGRA 5: Muitas pendentes
    if (despesasPendentes.length >= 5) {
        const totalPendente = despesasPendentes.reduce(function(s, d) { return s + parseFloat(d.valor || 0); }, 0);
        sugestoes.push({
            tipo: 'alerta',
            icone: '📋',
            titulo: 'Muitas contas pendentes',
            mensagem: 'Você tem <strong>' + despesasPendentes.length + ' contas</strong> pendentes totalizando <strong>' + formatarMoedaAssistente(totalPendente) + '</strong>. Programe os pagamentos para evitar atrasos.',
            prioridade: 3
        });
    }

    console.log('💡 Sugestões geradas:', sugestoes.length);
    return sugestoes.sort(function(a, b) { return a.prioridade - b.prioridade; });
}

function renderizarAssistente() {
    console.log('🎨 Renderizando assistente no dashboard...');
    
    const container = document.getElementById('assistenteTexto');
    const painel = document.querySelector('.assistente');
    
    if (!container) {
        console.error('❌ Elemento #assistenteTexto NÃO ENCONTRADO no HTML!');
        return;
    }
    if (!painel) {
        console.error('❌ Elemento .assistente NÃO ENCONTRADO no HTML!');
        return;
    }

    const sugestoes = gerarSugestoes();

    if (sugestoes.length === 0) {
        container.innerHTML = '📊 Tudo certo! Nenhum alerta no momento. Continue acompanhando seus lançamentos.';
        painel.style.borderLeftColor = '#38a169';
        painel.style.backgroundColor = '#f0fff4';
        console.log('✅ Assistente: nenhuma sugestão');
        return;
    }

    const principal = sugestoes[0];
    let html = '<div style="line-height:1.6;">';
    html += '<strong style="font-size:16px;">' + principal.icone + ' ' + principal.titulo + '</strong><br>';
    html += '<p style="margin-top:8px;">' + principal.mensagem + '</p>';
    html += '</div>';

    if (sugestoes.length > 1) {
        html += '<div style="margin-top:12px; padding-top:10px; border-top:1px dashed rgba(0,0,0,0.15); font-size:12px; color:#718096;">';
        html += '📌 Outras ' + (sugestoes.length - 1) + ' sugestão(ões) disponível(is).';
        html += '</div>';
    }

    container.innerHTML = html;

    const cores = {
        perigo: { borda: '#e53e3e', fundo: '#fff5f5' },
        alerta: { borda: '#dd6b20', fundo: '#fffaf0' },
        dica: { borda: '#d69e2e', fundo: '#fffff0' },
        positivo: { borda: '#38a169', fundo: '#f0fff4' }
    };
    const cor = cores[principal.tipo] || cores.dica;
    painel.style.borderLeftColor = cor.borda;
    painel.style.backgroundColor = cor.fundo;
    
    console.log('✅ Assistente renderizado com sucesso:', principal.titulo);
}

function formatarMoedaAssistente(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor || 0);
}