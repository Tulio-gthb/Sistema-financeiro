/* ============================================
   CALENDARIO.JS - Calendário de Fluxo de Caixa
   ============================================ */

let anoAtual, mesAtual;

document.addEventListener('DOMContentLoaded', function() {
    const hoje = new Date();
    anoAtual = hoje.getFullYear();
    mesAtual = hoje.getMonth() + 1;
    
    preencherSeletorAno();
    document.getElementById('seletorMes').value = mesAtual;
    document.getElementById('seletorAno').value = anoAtual;
    
    renderizarCalendario(anoAtual, mesAtual);
    
    // Eventos dos controles
    document.getElementById('seletorMes').addEventListener('change', function() {
        mesAtual = parseInt(this.value);
        renderizarCalendario(anoAtual, mesAtual);
    });
    
    document.getElementById('seletorAno').addEventListener('change', function() {
        anoAtual = parseInt(this.value);
        renderizarCalendario(anoAtual, mesAtual);
    });
});

function preencherSeletorAno() {
    const sel = document.getElementById('seletorAno');
    const hoje = new Date();
    for (let a = hoje.getFullYear() - 2; a <= hoje.getFullYear() + 2; a++) {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        sel.appendChild(opt);
    }
}

/**
 * Renderiza a grade do calendário e a lista mobile.
 */
function renderizarCalendario(ano, mes) {
    // Busca todos os lançamentos do mês
    const lancamentos = buscarLancamentosPorMes(ano, mes, 'todos');
    
    // Organiza por dia (1 a 31)
    const dias = {};
    for (let d = 1; d <= 31; d++) {
        dias[d] = { entradas: 0, saidas: 0, itens: [] };
    }
    
    lancamentos.forEach(function(l) {
        const dia = parseInt(l.data.split('-')[2]);
        if (!dias[dia]) return;
        if (l.tipo === 'receita') {
            dias[dia].entradas += parseFloat(l.valor);
        } else {
            dias[dia].saidas += parseFloat(l.valor);
        }
        dias[dia].itens.push(l);
    });
    
    // Saldo inicial = tudo que acumulou até o ÚLTIMO DIA do mês anterior
    const ultimoDiaMesAnterior = new Date(ano, mes - 1, 0);
    const dataUltimoDiaAnterior = ultimoDiaMesAnterior.toISOString().split('T')[0];
    let saldoAcumulado = calcularSaldoAteData(dataUltimoDiaAnterior);
    
    // Limpa containers
    const grade = document.getElementById('gradeCalendario');
    const listaMobile = document.getElementById('listaMobile');
    grade.innerHTML = '';
    listaMobile.innerHTML = '';
    
    // Cabeçalho dos dias da semana
    const semana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    semana.forEach(function(d) {
        const th = document.createElement('div');
        th.className = 'cal-dia-header';
        th.textContent = d;
        grade.appendChild(th);
    });
    
    // Configurações do mês
    const primeiroDiaSemana = new Date(ano, mes - 1, 1).getDay(); // 0=Domingo
    const totalDiasMes = new Date(ano, mes, 0).getDate();
    const hojeStr = new Date().toISOString().split('T')[0];
    
    // Células vazias antes do dia 1
    for (let i = 0; i < primeiroDiaSemana; i++) {
        const vazio = document.createElement('div');
        vazio.className = 'cal-celula vazio';
        grade.appendChild(vazio);
    }
    
    // Preenche cada dia do mês
    for (let dia = 1; dia <= totalDiasMes; dia++) {
        const dataStr = ano + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
        const info = dias[dia];
        
        // Atualiza saldo acumulado com o movimento deste dia
        saldoAcumulado += info.entradas - info.saidas;
        
        // --- DESKTOP: Grade ---
        const celula = document.createElement('div');
        celula.className = 'cal-celula';
        if (saldoAcumulado < 0) celula.classList.add('negativo');
        if (temLancamento(info)) celula.classList.add('tem-lancamento');
        if (dataStr === hojeStr) celula.classList.add('hoje');
        
        celula.innerHTML = 
            '<div class="cal-numero">' + dia + '</div>' +
            (info.entradas > 0 ? '<div class="cal-entrada">+' + formatarCurto(info.entradas) + '</div>' : '') +
            (info.saidas > 0 ? '<div class="cal-saida">-' + formatarCurto(info.saidas) + '</div>' : '') +
            '<div class="cal-saldo ' + (saldoAcumulado < 0 ? 'neg' : 'pos') + '">' + formatarCurto(saldoAcumulado) + '</div>';
        
        celula.onclick = function() { abrirDetalhesDia(dataStr, info, saldoAcumulado); };
        grade.appendChild(celula);
        
        // --- MOBILE: Lista (só mostra dias com movimento ou negativo) ---
        if (temLancamento(info) || saldoAcumulado < 0) {
            const item = document.createElement('div');
            item.className = 'lista-item';
            if (saldoAcumulado < 0) item.classList.add('negativo');
            if (dataStr === hojeStr) item.classList.add('hoje');
            
            let html = 
                '<div class="lista-header">' +
                    '<span class="lista-dia">Dia ' + dia + '</span>' +
                    '<span class="lista-saldo ' + (saldoAcumulado < 0 ? 'neg' : 'pos') + '">Saldo: ' + formatarMoeda(saldoAcumulado) + '</span>' +
                '</div>';
            
            if (info.entradas > 0) {
                html += '<div class="lista-linha entrada">⬆ Entradas: ' + formatarMoeda(info.entradas) + '</div>';
            }
            if (info.saidas > 0) {
                html += '<div class="lista-linha saida">⬇ Saídas: ' + formatarMoeda(info.saidas) + '</div>';
            }
            
            info.itens.forEach(function(it) {
                html += 
                    '<div class="lista-detalhe ' + it.tipo + '">' +
                        '<span>' + escaparHTML(it.descricao) + '</span>' +
                        '<span>' + (it.tipo === 'receita' ? '+' : '-') + ' ' + formatarMoeda(it.valor) + '</span>' +
                    '</div>';
            });
            
            if (saldoAcumulado < 0) {
                html += '<div class="lista-alerta">⚠️ Faltarão ' + formatarMoeda(Math.abs(saldoAcumulado)) + ' neste dia</div>';
            }
            
            item.innerHTML = html;
            listaMobile.appendChild(item);
        }
    }
}

function temLancamento(info) {
    return info.entradas > 0 || info.saidas > 0 || info.itens.length > 0;
}

/**
 * Abre o painel lateral com detalhes do dia clicado.
 */
function abrirDetalhesDia(dataStr, info, saldo) {
    const painel = document.getElementById('painelLateral');
    const overlay = document.getElementById('painelOverlay');
    const titulo = document.getElementById('painelTitulo');
    const conteudo = document.getElementById('painelConteudo');
    
    const partes = dataStr.split('-');
    const dataBR = partes[2] + '/' + partes[1] + '/' + partes[0];
    
    titulo.textContent = '📅 ' + dataBR;
    
    let html = '<div class="painel-resumo">';
    html += '<div class="painel-linha"><span>Saldo Projetado:</span><span class="' + (saldo < 0 ? 'neg' : 'pos') + '">' + formatarMoeda(saldo) + '</span></div>';
    if (info.entradas > 0) {
        html += '<div class="painel-linha entrada"><span>Entradas:</span><span>+' + formatarMoeda(info.entradas) + '</span></div>';
    }
    if (info.saidas > 0) {
        html += '<div class="painel-linha saida"><span>Saídas:</span><span>-' + formatarMoeda(info.saidas) + '</span></div>';
    }
    html += '</div>';
    
    if (info.itens.length === 0) {
        html += '<p style="color:var(--cor-texto-claro);margin-top:16px;">Nenhum lançamento neste dia.</p>';
    } else {
        html += '<div class="painel-lista">';
        info.itens.forEach(function(it) {
            html += 
                '<div class="painel-item ' + it.tipo + '">' +
                    '<div class="painel-item-info">' +
                        '<strong>' + escaparHTML(it.descricao) + '</strong>' +
                        '<small>' + escaparHTML(it.categoria) + (it.fornecedor ? ' • ' + escaparHTML(it.fornecedor) : '') + '</small>' +
                    '</div>' +
                    '<div class="painel-item-valor ' + it.tipo + '">' + (it.tipo === 'receita' ? '+' : '-') + ' ' + formatarMoeda(it.valor) + '</div>' +
                '</div>';
        });
        html += '</div>';
    }
    
    if (saldo < 0) {
        html += '<div class="painel-alerta">⚠️ Atenção: saldo negativo de ' + formatarMoeda(Math.abs(saldo)) + ' neste dia!</div>';
    }
    
    conteudo.innerHTML = html;
    painel.classList.add('visivel');
    overlay.classList.add('visivel');
}

function fecharPainel() {
    document.getElementById('painelLateral').classList.remove('visivel');
    document.getElementById('painelOverlay').classList.remove('visivel');
}

/* ---------- UTILITÁRIOS ---------- */

function formatarCurto(valor) {
    // Formato curto para caber nas células: R$ 1,2k ou R$ 1.234
    if (Math.abs(valor) >= 1000) {
        return 'R$ ' + (valor / 1000).toFixed(1).replace('.', ',') + 'k';
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor);
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function escaparHTML(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}