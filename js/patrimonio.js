/* ============================================
   PATRIMONIO.JS - Controle de Bens e Patrimônio
   ============================================ */

const TABELA_CUSTOS = 'custosBens';
let bemEditando = null;
let bemCustoAtual = null;
let valoresVisiveis = true;

document.addEventListener('DOMContentLoaded', function() {
    carregarPatrimonio();
    
    // Formulário de bem
    const formBem = document.getElementById('formBem');
    if (formBem) formBem.addEventListener('submit', salvarBem);
    
    // Formulário de custo
    const formCusto = document.getElementById('formCusto');
    if (formCusto) formCusto.addEventListener('submit', salvarCusto);
});

// ---------- CARREGAR E RENDERIZAR ----------

function carregarPatrimonio() {
    const bens = buscarTodos(TABELAS.BENS);
    const custos = buscarTodos(TABELA_CUSTOS);
    
    // Calcula totais
    let totalAquisicao = 0;
    let totalMercado = 0;
    let totalCustos = 0;
    
    bens.forEach(function(b) {
        totalAquisicao += parseFloat(b.valorAquisicao || 0);
        totalMercado += parseFloat(b.valorMercado || b.valorAquisicao || 0);
        
        // Soma custos deste bem
        const custosDoBem = custos.filter(function(c) { return c.bemId === b.id; });
        const somaCustos = custosDoBem.reduce(function(s, c) { return s + parseFloat(c.valor || 0); }, 0);
        b._custosTotais = somaCustos;
        b._listaCustos = custosDoBem;
        totalCustos += somaCustos;
    });
    
    // Atualiza topo
    atualizarTopo(totalMercado, totalCustos);
    
    // Renderiza cards
    renderizarCards(bens);
    renderizarListaMobile(bens);
}

function atualizarTopo(totalMercado, totalCustos) {
    const elTotal = document.getElementById('patrimonioTotal');
    const elInvestido = document.getElementById('totalInvestido');
    const elCustos = document.getElementById('totalCustos');
    
    if (elTotal) {
        elTotal.textContent = valoresVisiveis ? formatarMoeda(totalMercado) : 'R$ ••••••';
        // Adiciona/remove a classe de estilo oculto
        if (!valoresVisiveis) {
            elTotal.classList.add('oculto');
        } else {
            elTotal.classList.remove('oculto');
        }
    }
    
    if (elInvestido) {
        elInvestido.textContent = valoresVisiveis ? formatarMoeda(totalMercado - totalCustos) : 'R$ ••••••';
    }
    
    if (elCustos) {
        elCustos.textContent = valoresVisiveis ? formatarMoeda(totalCustos) : 'R$ ••••••';
    }
}

// ---------- CARDS DESKTOP ----------

function renderizarCards(bens) {
    const container = document.getElementById('gridBens');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (bens.length === 0) {
        container.innerHTML = '<div class="mensagem-vazio">Nenhum bem cadastrado. Clique em "Novo Bem" para começar.</div>';
        return;
    }
    
    bens.forEach(function(b) {
        const card = document.createElement('div');
        card.className = 'card-bem';
        
        const icone = iconePorTipo(b.tipo);
        const valorDisplay = valoresVisiveis ? formatarMoeda(b.valorMercado || b.valorAquisicao) : 'R$ ••••••';
        const aquisicaoDisplay = valoresVisiveis ? formatarMoeda(b.valorAquisicao) : 'R$ ••••••';
        const custoDisplay = valoresVisiveis ? formatarMoeda(b._custosTotais || 0) : 'R$ ••••••';
        
        card.innerHTML = 
            '<div class="card-bem-header">' +
                '<div class="card-bem-icone">' + icone + '</div>' +
                '<div class="card-bem-acoes">' +
                    '<button class="btn-acao-bem" onclick="abrirModalCusto(\'' + b.id + '\')" title="Adicionar custo">➕</button>' +
                    '<button class="btn-acao-bem" onclick="abrirModalBem(\'' + b.id + '\')" title="Editar">✏️</button>' +
                    '<button class="btn-acao-bem btn-excluir-bem" onclick="excluirBem(\'' + b.id + '\')" title="Excluir">🗑️</button>' +
                '</div>' +
            '</div>' +
            '<h4 class="card-bem-nome">' + escaparHTML(b.nome) + '</h4>' +
            '<span class="card-bem-tipo">' + escaparHTML(b.tipo) + '</span>' +
            '<div class="card-bem-dados">' +
                '<div class="bem-linha">' +
                    '<span class="bem-label">Valor Mercado</span>' +
                    '<span class="bem-valor">' + valorDisplay + '</span>' +
                '</div>' +
                '<div class="bem-linha">' +
                    '<span class="bem-label">Valor Aquisição</span>' +
                    '<span class="bem-valor secundario">' + aquisicaoDisplay + '</span>' +
                '</div>' +
                '<div class="bem-linha">' +
                    '<span class="bem-label">Custos/Manutenção</span>' +
                    '<span class="bem-valor alerta">' + custoDisplay + '</span>' +
                '</div>' +
                '<div class="bem-linha">' +
                    '<span class="bem-label">Aquisição em</span>' +
                    '<span class="bem-valor secundario">' + formatarDataBR(b.dataAquisicao) + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="card-bem-custos">' +
                renderizarMiniCustos(b._listaCustos || []) +
            '</div>';
        
        container.appendChild(card);
    });
}

function renderizarListaMobile(bens) {
    const container = document.getElementById('listaBensMobile');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (bens.length === 0) {
        container.innerHTML = '<div class="mensagem-vazio">Nenhum bem cadastrado.</div>';
        return;
    }
    
    bens.forEach(function(b) {
        const icone = iconePorTipo(b.tipo);
        const valorDisplay = valoresVisiveis ? formatarMoeda(b.valorMercado || b.valorAquisicao) : 'R$ ••••••';
        
        const item = document.createElement('div');
        item.className = 'item-bem-mobile';
        
        item.innerHTML = 
            '<div class="item-header" onclick="toggleAccordion(this)">' +
                '<div class="item-titulo">' +
                    '<span class="item-icone">' + icone + '</span>' +
                    '<div>' +
                        '<strong>' + escaparHTML(b.nome) + '</strong>' +
                        '<small>' + escaparHTML(b.tipo) + '</small>' +
                    '</div>' +
                '</div>' +
                '<span class="item-valor">' + valorDisplay + '</span>' +
            '</div>' +
            '<div class="item-conteudo">' +
                '<div class="item-linha"><span>Valor Mercado</span><span>' + (valoresVisiveis ? formatarMoeda(b.valorMercado || b.valorAquisicao) : '•••') + '</span></div>' +
                '<div class="item-linha"><span>Valor Aquisição</span><span>' + (valoresVisiveis ? formatarMoeda(b.valorAquisicao) : '•••') + '</span></div>' +
                '<div class="item-linha"><span>Custos</span><span>' + (valoresVisiveis ? formatarMoeda(b._custosTotais || 0) : '•••') + '</span></div>' +
                '<div class="item-linha"><span>Data Aquisição</span><span>' + formatarDataBR(b.dataAquisicao) + '</span></div>' +
                '<div class="item-acoes">' +
                    '<button onclick="abrirModalCusto(\'' + b.id + '\')">➕ Custo</button>' +
                    '<button onclick="abrirModalBem(\'' + b.id + '\')">✏️ Editar</button>' +
                    '<button onclick="excluirBem(\'' + b.id + '\')" class="btn-excluir">🗑️</button>' +
                '</div>' +
                '<div class="item-custos">' + renderizarMiniCustos(b._listaCustos || []) + '</div>' +
            '</div>';
        
        container.appendChild(item);
    });
}

function renderizarMiniCustos(custos) {
    if (!custos || custos.length === 0) {
        return '<span class="sem-custos">Nenhum custo registrado</span>';
    }
    
    let html = '<strong>Histórico de custos:</strong>';
    custos.slice(0, 3).forEach(function(c) {
        html += 
            '<div class="mini-custo">' +
                '<span>' + escaparHTML(c.descricao) + '</span>' +
                '<span>' + formatarMoeda(c.valor) + '</span>' +
            '</div>';
    });
    if (custos.length > 3) {
        html += '<span class="mais-custos">+' + (custos.length - 3) + ' custos...</span>';
    }
    return html;
}

function iconePorTipo(tipo) {
    const mapa = {
        'Imóvel': '🏠',
        'Veículo': '🚗',
        'Investimento': '📈',
        'Equipamento': '💻',
        'Joia': '💍',
        'Outro': '📦'
    };
    return mapa[tipo] || '📦';
}

// ---------- AÇÕES ----------

function toggleVisibilidade() {
    valoresVisiveis = !valoresVisiveis;
    const btn = document.getElementById('btnOlho');
    if (btn) btn.textContent = valoresVisiveis ? '👁️' : '🙈';
    carregarPatrimonio();
}

function toggleAccordion(header) {
    const conteudo = header.nextElementSibling;
    conteudo.classList.toggle('aberto');
}

// ---------- MODAL BEM ----------

function abrirModalBem(id) {
    const modal = document.getElementById('modalBem');
    const titulo = document.getElementById('modalBemTitulo');
    const form = document.getElementById('formBem');
    
    if (!modal || !titulo || !form) return;
    
    bemEditando = id || null;
    
    if (id) {
        const b = buscarPorId(TABELAS.BENS, id);
        if (!b) return;
        titulo.textContent = '✏️ Editar Bem';
        document.getElementById('campoBemNome').value = b.nome;
        document.getElementById('campoBemTipo').value = b.tipo;
        document.getElementById('campoBemAquisicao').value = b.valorAquisicao;
        document.getElementById('campoBemMercado').value = b.valorMercado || '';
        document.getElementById('campoBemData').value = b.dataAquisicao;
        document.getElementById('campoBemObs').value = b.observacao || '';
    } else {
        titulo.textContent = '➕ Novo Bem';
        form.reset();
        document.getElementById('campoBemData').value = new Date().toISOString().split('T')[0];
    }
    
    modal.classList.add('visivel');
}

function fecharModalBem() {
    const modal = document.getElementById('modalBem');
    if (modal) modal.classList.remove('visivel');
    bemEditando = null;
}

function salvarBem(evento) {
    evento.preventDefault();
    
    const dados = {
        nome: document.getElementById('campoBemNome').value.trim(),
        tipo: document.getElementById('campoBemTipo').value,
        valorAquisicao: parseFloat(document.getElementById('campoBemAquisicao').value),
        valorMercado: parseFloat(document.getElementById('campoBemMercado').value) || parseFloat(document.getElementById('campoBemAquisicao').value),
        dataAquisicao: document.getElementById('campoBemData').value,
        observacao: document.getElementById('campoBemObs').value.trim()
    };
    
    if (bemEditando) {
        atualizar(TABELAS.BENS, bemEditando, dados);
    } else {
        criar(TABELAS.BENS, dados);
    }
    
    fecharModalBem();
    carregarPatrimonio();
}

function excluirBem(id) {
    if (confirm('Tem certeza que deseja excluir este bem? Todos os custos associados também serão removidos.')) {
        // Remove custos associados
        const custos = buscarTodos(TABELA_CUSTOS);
        const custosFiltrados = custos.filter(function(c) { return c.bemId !== id; });
        salvarTodos(TABELA_CUSTOS, custosFiltrados);
        
        // Remove o bem
        remover(TABELAS.BENS, id);
        carregarPatrimonio();
    }
}

// ---------- MODAL CUSTO ----------

function abrirModalCusto(bemId) {
    const modal = document.getElementById('modalCusto');
    if (!modal) return;
    
    bemCustoAtual = bemId;
    const b = buscarPorId(TABELAS.BENS, bemId);
    document.getElementById('custoBemNome').textContent = b ? b.nome : '';
    
    document.getElementById('campoCustoDescricao').value = '';
    document.getElementById('campoCustoValor').value = '';
    document.getElementById('campoCustoData').value = new Date().toISOString().split('T')[0];
    document.getElementById('campoCustoObs').value = '';
    
    modal.classList.add('visivel');
}

function fecharModalCusto() {
    const modal = document.getElementById('modalCusto');
    if (modal) modal.classList.remove('visivel');
    bemCustoAtual = null;
}

function salvarCusto(evento) {
    evento.preventDefault();
    if (!bemCustoAtual) return;
    
    criar(TABELA_CUSTOS, {
        bemId: bemCustoAtual,
        descricao: document.getElementById('campoCustoDescricao').value.trim(),
        valor: parseFloat(document.getElementById('campoCustoValor').value),
        data: document.getElementById('campoCustoData').value,
        observacao: document.getElementById('campoCustoObs').value.trim()
    });
    
    fecharModalCusto();
    carregarPatrimonio();
}

// ---------- UTILITÁRIOS ----------

function formatarDataBR(dataISO) {
    if (!dataISO) return '-';
    const partes = dataISO.split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0];
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor || 0);
}

function escaparHTML(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}