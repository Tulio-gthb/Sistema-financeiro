/* ============================================
   LANCAMENTOS.JS - Controle da tela de lançamentos
   ============================================ */

// ---------- VARIÁVEIS GLOBAIS ----------
let lancamentosAtuais = [];       // Lista que está sendo mostrada na tela
let lancamentoEditando = null;    // Guarda o ID do lançamento em edição (null = novo)

// ---------- INICIALIZAÇÃO ----------
document.addEventListener('DOMContentLoaded', function() {
    preencherFiltros();
    carregarLancamentos();
    
    // Configura o formulário do modal
    const form = document.getElementById('formLancamento');
    if (form) {
        form.addEventListener('submit', salvarLancamento);
    }
});

// ---------- CARREGAR E RENDERIZAR ----------

/**
 * Busca os lançamentos do banco e aplica os filtros da tela.
 */
function carregarLancamentos() {
    const ano = parseInt(document.getElementById('filtroAno').value);
    const mes = parseInt(document.getElementById('filtroMes').value);
    const status = document.getElementById('filtroStatus').value;
    const busca = document.getElementById('filtroBusca').value.toLowerCase();
    
    // Busca todos do mês selecionado (tipo 'todos' traz receitas e despesas)
    let lista = buscarLancamentosPorMes(ano, mes, 'todos');
    
    // Aplica filtro de status (se não for "todos")
    if (status !== 'todos') {
        lista = lista.filter(function(l) {
            return l.status === status;
        });
    }
    
    // Aplica filtro de busca por texto
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

/**
 * Desenha a tabela no desktop.
 */
function renderizarTabela() {
    const tbody = document.getElementById('tabelaLancamentos');
    if (!tbody) return;
    
    tbody.innerHTML = ''; // Limpa antes de redesenhar
    
    if (lancamentosAtuais.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--cor-texto-claro);">Nenhum lançamento encontrado.</td></tr>';
        return;
    }
    
    lancamentosAtuais.forEach(function(l) {
        const tr = document.createElement('tr');
        tr.className = 'linha-lancamento';
        
        const corValor = l.tipo === 'receita' ? 'receita' : 'despesa';
        const sinal = l.tipo === 'receita' ? '+' : '-';
        const iconeStatus = l.status === 'pago' || l.status === 'recebido' ? '✅' : '⏳';
        const textoStatus = l.status === 'pago' || l.status === 'recebido' ? 'Pago' : 'Pendente';
        
        tr.innerHTML = 
            '<td>' + formatarDataBR(l.data) + '</td>' +
            '<td><strong>' + escaparHTML(l.descricao) + '</strong></td>' +
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

/**
 * Desenha os cards para mobile.
 */
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
        const iconeStatus = l.status === 'pago' || l.status === 'recebido' ? '✅' : '⏳';
        
        const card = document.createElement('div');
        card.className = 'card-lancamento';
        card.innerHTML = 
            '<div class="card-header">' +
                '<span class="card-data">' + formatarDataBR(l.data) + '</span>' +
                '<span class="badge-status ' + l.status + '">' + iconeStatus + ' ' + l.status + '</span>' +
            '</div>' +
            '<div class="card-descricao">' + escaparHTML(l.descricao) + '</div>' +
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

/**
 * Atualiza o contador de resultados.
 */
function atualizarResumoFiltros() {
    const el = document.getElementById('resumoFiltros');
    if (el) {
        el.textContent = lancamentosAtuais.length + ' lançamento' + (lancamentosAtuais.length !== 1 ? 's' : '') + ' encontrado' + (lancamentosAtuais.length !== 1 ? 's' : '');
    }
}

// ---------- MODAL (NOVO / EDITAR) ----------

/**
 * Abre o modal. Se id for passado, carrega os dados para edição.
 */
function abrirModal(id) {
    const modal = document.getElementById('modalLancamento');
    const titulo = document.getElementById('modalTitulo');
    const form = document.getElementById('formLancamento');
    
    lancamentoEditando = id || null;
    
    if (id) {
        // Modo edição
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
        // Modo novo
        titulo.textContent = '➕ Novo Lançamento';
        form.reset();
        
        // Preenche data com hoje e mês/ano do filtro atual
        const hoje = new Date();
        const ano = document.getElementById('filtroAno').value;
        const mes = document.getElementById('filtroMes').value.padStart(2, '0');
        const dia = hoje.getDate().toString().padStart(2, '0');
        document.getElementById('campoData').value = ano + '-' + mes + '-' + dia;
        
        document.getElementById('campoStatus').value = 'pendente';
    }
    
    modal.classList.add('visivel');
}

/**
 * Fecha o modal.
 */
function fecharModal() {
    const modal = document.getElementById('modalLancamento');
    if (modal) modal.classList.remove('visivel');
    lancamentoEditando = null;
}

/**
 * Salva o lançamento (cria novo ou atualiza existente).
 */
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

/**
 * Alterna o status entre pago/recebido e pendente.
 */
function toggleStatus(id) {
    const l = buscarPorId(TABELAS.LANCAMENTOS, id);
    if (!l) return;
    
    const novoStatus = (l.status === 'pago' || l.status === 'recebido') ? 'pendente' : (l.tipo === 'receita' ? 'recebido' : 'pago');
    
    atualizar(TABELAS.LANCAMENTOS, id, { status: novoStatus });
    carregarLancamentos();
}

/**
 * Exclui um lançamento com confirmação.
 */
function excluirLancamento(id) {
    if (confirm('Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.')) {
        remover(TABELAS.LANCAMENTOS, id);
        carregarLancamentos();
    }
}

// ---------- FILTROS ----------

/**
 * Preenche os selects de ano, mês e categoria com valores úteis.
 */
function preencherFiltros() {
    const hoje = new Date();
    
    // Ano (atual e próximo)
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
    
    // Categorias
    const selectCat = document.getElementById('campoCategoria');
    if (selectCat) {
        const categorias = buscarTodos(TABELAS.CATEGORIAS);
        selectCat.innerHTML = '<option value="">Selecione...</option>';
        categorias.forEach(function(c) {
            const opt = document.createElement('option');
            opt.value = c.nome;
            opt.textContent = c.nome;
            selectCat.appendChild(opt);
        });
    }
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