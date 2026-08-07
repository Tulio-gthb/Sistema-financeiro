/* ============================================
   LANCAMENTOS.JS - Controle da tela de lançamentos
   ============================================ */

let lancamentosAtuais = [];
let lancamentoEditando = null;

// ---------- INICIALIZAÇÃO ----------
document.addEventListener('DOMContentLoaded', function() {
    try {
        preencherFiltros();
        carregarLancamentos();
    } catch (erro) {
        console.error('Erro ao inicializar lançamentos:', erro);
    }
    
    const form = document.getElementById('formLancamento');
    if (form) {
        form.addEventListener('submit', salvarLancamento);
    }
});

// ---------- CARREGAR E RENDERIZAR ----------

function carregarLancamentos() {
    const elAno = document.getElementById('filtroAno');
    const elMes = document.getElementById('filtroMes');
    const elStatus = document.getElementById('filtroStatus');
    const elBusca = document.getElementById('filtroBusca');
    
    // Proteção: se os elementos não existirem, sai
    if (!elAno || !elMes) return;
    
    const ano = parseInt(elAno.value) || new Date().getFullYear();
    const mes = parseInt(elMes.value) || (new Date().getMonth() + 1);
    const status = elStatus ? elStatus.value : 'todos';
    const busca = elBusca ? elBusca.value.toLowerCase() : '';
    
    let lista = buscarLancamentosPorMes(ano, mes, 'todos');
    
    if (status !== 'todos') {
        lista = lista.filter(function(l) {
            return l.status === status;
        });
    }
    
    if (busca) {
        lista = lista.filter(function(l) {
            return (
                l.descricao.toLowerCase().includes(busca) ||
                (l.fornecedor && l.fornecedor.toLowerCase().includes(busca)) ||
                l.categoria.toLowerCase().includes(busca)
            );
        });
    }
    
    lancamentosAtuais = lista;
    renderizarTabela();
    renderizarCardsMobile();
    atualizarResumoFiltros();
}

function renderizarTabela() {
    const tbody = document.getElementById('tabelaLancamentos');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (lancamentosAtuais.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--cor-texto-claro);">Nenhum lançamento encontrado.</td></tr>';
        return;
    }
    
    lancamentosAtuais.forEach(function(l) {
        const tr = document.createElement('tr');
        tr.className = 'linha-lancamento';
        
        const corValor = l.tipo === 'receita' ? 'receita' : 'despesa';
        const sinal = l.tipo === 'receita' ? '+' : '-';
        const iconeStatus = (l.status === 'pago' || l.status === 'recebido') ? '✅' : '⏳';
        const textoStatus = (l.status === 'pago' || l.status === 'recebido') ? 'Pago' : 'Pendente';
        const iconeRecorrente = l.recorrente ? ' 🔄' : '';
        
        tr.innerHTML = 
            '<td>' + formatarDataBR(l.data) + '</td>' +
            '<td><strong>' + escaparHTML(l.descricao) + '</strong>' + iconeRecorrente + '</td>' +
            '<td>' + escaparHTML(l.fornecedor || '-') + '</td>' +
            '<td><span class="tag-categoria">' + escaparHTML(l.categoria) + '</span></td>' +
            '<td class="valor ' + corValor + '">' + sinal + ' ' + formatarMoeda(l.valor) + '</td>' +
            '<td><span class="badge-status ' + l.status + '">' + iconeStatus + ' ' + textoStatus + '</span></td>' +
            '<td class="acoes">' +
                '<button class="btn-acao btn-baixa" onclick="toggleStatus(\'' + l.id + '\')" title="Dar baixa">' + 
                    (l.status === 'pendente' ? '✓' : '↩') + 
                '</button>' +
                '<button class="btn-acao btn-editar" onclick="abrirModal(\'' + l.id + '\')" title="Editar">✏️</button>' +
                '<button class="btn-acao btn-excluir" onclick="excluirLancamento(\'' + l.id + '\')" title="Excluir">🗑️</button>' +
            '</td>';
        
        tbody.appendChild(tr);
    });
}

function renderizarCardsMobile() {
    const container = document.getElementById('cardsMobile');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (lancamentosAtuais.length === 0) {
        container.innerHTML = '<div class="card-vazio">Nenhum lançamento encontrado.</div>';
        return;
    }
    
    lancamentosAtuais.forEach(function(l) {
        const corValor = l.tipo === 'receita' ? 'receita' : 'despesa';
        const sinal = l.tipo === 'receita' ? '+' : '-';
        const iconeStatus = (l.status === 'pago' || l.status === 'recebido') ? '✅' : '⏳';
        
        const card = document.createElement('div');
        card.className = 'card-lancamento';
        card.innerHTML = 
            '<div class="card-header">' +
                '<span class="card-data">' + formatarDataBR(l.data) + '</span>' +
                '<span class="badge-status ' + l.status + '">' + iconeStatus + ' ' + l.status + '</span>' +
            '</div>' +
            '<div class="card-descricao">' + escaparHTML(l.descricao) + (l.recorrente ? ' 🔄' : '') + '</div>' +
            '<div class="card-detalhes">' +
                '<span>' + escaparHTML(l.categoria) + '</span>' +
                '<span>' + escaparHTML(l.fornecedor || '-') + '</span>' +
            '</div>' +
            '<div class="card-valor ' + corValor + '">' + sinal + ' ' + formatarMoeda(l.valor) + '</div>' +
            '<div class="card-acoes">' +
                '<button class="btn-card btn-baixa" onclick="toggleStatus(\'' + l.id + '\')">' + 
                    (l.status === 'pendente' ? '✓ Pagar' : '↩ Reabrir') + 
                '</button>' +
                '<button class="btn-card btn-editar" onclick="abrirModal(\'' + l.id + '\')">✏️ Editar</button>' +
                '<button class="btn-card btn-excluir" onclick="excluirLancamento(\'' + l.id + '\')">🗑️ Excluir</button>' +
            '</div>';
        
        container.appendChild(card);
    });
}

function atualizarResumoFiltros() {
    const el = document.getElementById('resumoFiltros');
    if (!el) return;
    
    if (lancamentosAtuais.length === 0) {
        el.textContent = 'Nenhum lançamento encontrado para este filtro.';
    } else {
        el.textContent = lancamentosAtuais.length + ' lançamento' + (lancamentosAtuais.length !== 1 ? 's' : '') + ' encontrado' + (lancamentosAtuais.length !== 1 ? 's' : '');
    }
}

// ---------- MODAL ----------

function abrirModal(id) {
    const modal = document.getElementById('modalLancamento');
    const titulo = document.getElementById('modalTitulo');
    const form = document.getElementById('formLancamento');
    
    if (!modal || !titulo || !form) return;
    
    lancamentoEditando = id || null;
    
    if (id) {
        const l = buscarPorId(TABELAS.LANCAMENTOS, id);
        if (!l) return;
        
        titulo.textContent = '✏️ Editar Lançamento';
        document.getElementById('campoDescricao').value = l.descricao;
        document.getElementById('campoTipo').value = l.tipo;
        document.getElementById('campoCategoria').value = l.categoria;
        document.getElementById('campoValor').value = l.valor;
        document.getElementById('campoData').value = l.data;
        document.getElementById('campoFornecedor').value = l.fornecedor || '';
        document.getElementById('campoStatus').value = l.status;
        document.getElementById('campoRecorrente').checked = l.recorrente || false;
        document.getElementById('campoObservacao').value = l.observacao || '';
    } else {
        titulo.textContent = '➕ Novo Lançamento';
        form.reset();
        
        const hoje = new Date();
        const ano = document.getElementById('filtroAno').value || hoje.getFullYear();
        const mes = (document.getElementById('filtroMes').value || (hoje.getMonth() + 1)).toString().padStart(2, '0');
        const dia = hoje.getDate().toString().padStart(2, '0');
        document.getElementById('campoData').value = ano + '-' + mes + '-' + dia;
        
        document.getElementById('campoStatus').value = 'pendente';
    }
    
    modal.classList.add('visivel');
}

function fecharModal() {
    const modal = document.getElementById('modalLancamento');
    if (modal) modal.classList.remove('visivel');
    lancamentoEditando = null;
}

function salvarLancamento(evento) {
    evento.preventDefault();
    
    const dados = {
        descricao: document.getElementById('campoDescricao').value.trim(),
        tipo: document.getElementById('campoTipo').value,
        categoria: document.getElementById('campoCategoria').value,
        valor: parseFloat(document.getElementById('campoValor').value),
        data: document.getElementById('campoData').value,
        fornecedor: document.getElementById('campoFornecedor').value.trim(),
        status: document.getElementById('campoStatus').value,
        recorrente: document.getElementById('campoRecorrente').checked,
        observacao: document.getElementById('campoObservacao').value.trim()
    };
    
    if (lancamentoEditando) {
        atualizar(TABELAS.LANCAMENTOS, lancamentoEditando, dados);
    } else {
        criar(TABELAS.LANCAMENTOS, dados);
    }
    
    fecharModal();
    carregarLancamentos();
}

// ---------- AÇÕES RÁPIDAS ----------

function toggleStatus(id) {
    const l = buscarPorId(TABELAS.LANCAMENTOS, id);
    if (!l) return;
    
    const novoStatus = (l.status === 'pago' || l.status === 'recebido') 
        ? 'pendente' 
        : (l.tipo === 'receita' ? 'recebido' : 'pago');
    
    atualizar(TABELAS.LANCAMENTOS, id, { status: novoStatus });
    carregarLancamentos();
}

function excluirLancamento(id) {
    if (confirm('Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.')) {
        remover(TABELAS.LANCAMENTOS, id);
        carregarLancamentos();
    }
}

// ---------- FILTROS E BOTÃO GERAR MÊS ----------

function preencherFiltros() {
    const hoje = new Date();
    
    // Ano
    const selectAno = document.getElementById('filtroAno');
    if (selectAno) {
        selectAno.innerHTML = '';
        [hoje.getFullYear() - 1, hoje.getFullYear(), hoje.getFullYear() + 1].forEach(function(a) {
            const opt = document.createElement('option');
            opt.value = a;
            opt.textContent = a;
            if (a === hoje.getFullYear()) opt.selected = true;
            selectAno.appendChild(opt);
        });
    }
    
    // Mês
    const selectMes = document.getElementById('filtroMes');
    if (selectMes) {
        selectMes.value = hoje.getMonth() + 1;
    }
    
    // Categorias no modal
    const selectCat = document.getElementById('campoCategoria');
    if (selectCat) {
        const categorias = buscarTodos(TABELAS.CATEGORIAS);
        const valorAtual = selectCat.value;
        selectCat.innerHTML = '<option value="">Selecione...</option>';
        categorias.forEach(function(c) {
            const opt = document.createElement('option');
            opt.value = c.nome;
            opt.textContent = c.nome;
            selectCat.appendChild(opt);
        });
        if (valorAtual) selectCat.value = valorAtual;
    }
    
    // Botão "Gerar Mês"
    adicionarBotaoGerarMes();
}

function adicionarBotaoGerarMes() {
    const header = document.querySelector('.page-header');
    if (!header || document.getElementById('btnGerarMes')) return;
    
    const btnGerar = document.createElement('button');
    btnGerar.id = 'btnGerarMes';
    btnGerar.className = 'btn-novo';
    btnGerar.style.cssText = 'background-color:#dd6b20; margin-left:8px;';
    btnGerar.innerHTML = '⚡ Gerar Mês';
    btnGerar.onclick = function() {
        const ano = parseInt(document.getElementById('filtroAno').value);
        const mes = parseInt(document.getElementById('filtroMes').value);
        const mesesNomes = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        
        const quantidade = gerarLancamentosDoMes(ano, mes);
        
        if (quantidade > 0) {
            alert('✅ ' + quantidade + ' lançamento(s) recorrente(s) gerado(s) para ' + mesesNomes[mes] + '/' + ano + '!');
            carregarLancamentos();
        } else {
            alert('ℹ️ Nenhuma conta recorrente nova para gerar em ' + mesesNomes[mes] + '/' + ano + '. Todos já existem!');
        }
    };
    
    header.appendChild(btnGerar);
}

// ---------- UTILITÁRIOS ----------

function formatarDataBR(dataISO) {
    const partes = dataISO.split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0];
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function escaparHTML(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}