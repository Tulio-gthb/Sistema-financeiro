/* ============================================
   CONFIGURACOES.JS - Painel de Configurações
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    carregarDadosUsuario();
    carregarContasRecorrentes();
});

// ---------- ABA: MEUS DADOS ----------

function carregarDadosUsuario() {
    const usuarios = buscarTodos('usuarios');
    const sessao = JSON.parse(sessionStorage.getItem('sessao') || '{}');
    
    // Encontra o usuário logado
    const usuario = usuarios.find(function(u) {
        return u.email === sessao.email;
    });
    
    if (usuario) {
        document.getElementById('configNome').value = usuario.nome || '';
        document.getElementById('configEmail').value = usuario.email || '';
    }
}

function salvarDadosUsuario(evento) {
    evento.preventDefault();
    
    const novoNome = document.getElementById('configNome').value.trim();
    const novoEmail = document.getElementById('configEmail').value.trim();
    const novaSenha = document.getElementById('configSenha').value;
    const confirmarSenha = document.getElementById('configConfirmarSenha').value;
    
    const alerta = document.getElementById('alertaDados');
    
    // Validações
    if (!novoNome || !novoEmail) {
        mostrarAlertaConfig(alerta, 'Preencha nome e e-mail.', 'erro');
        return;
    }
    
    if (novaSenha && novaSenha !== confirmarSenha) {
        mostrarAlertaConfig(alerta, 'As senhas não conferem.', 'erro');
        return;
    }
    
    // Busca e atualiza
    const usuarios = buscarTodos('usuarios');
    const sessao = JSON.parse(sessionStorage.getItem('sessao') || '{}');
    const indice = usuarios.findIndex(function(u) {
        return u.email === sessao.email;
    });
    
    if (indice !== -1) {
        usuarios[indice].nome = novoNome;
        usuarios[indice].email = novoEmail;
        
        if (novaSenha) {
            usuarios[indice].senha = novaSenha;
        }
        
        salvarTodos('usuarios', usuarios);
        
        // Atualiza sessão
        sessao.nome = novoNome;
        sessao.email = novoEmail;
        sessionStorage.setItem('sessao', JSON.stringify(sessao));
        
        // Atualiza cabeçalho
        preencherUsuarioLogado();
        
        mostrarAlertaConfig(alerta, '✅ Dados salvos com sucesso!', 'sucesso');
        
        // Limpa campos de senha
        document.getElementById('configSenha').value = '';
        document.getElementById('configConfirmarSenha').value = '';
    }
}

// ---------- ABA: CONTAS RECORRENTES ----------

function carregarContasRecorrentes() {
    const container = document.getElementById('listaRecorrentes');
    if (!container) return;
    
    const contas = buscarTodos(TABELAS.CONTAS_RECORRENTES);
    container.innerHTML = '';
    
    if (contas.length === 0) {
        container.innerHTML = '<p class="lista-vazia">Nenhuma conta recorrente cadastrada.</p>';
        return;
    }
    
    contas.forEach(function(c) {
        const item = document.createElement('div');
        item.className = 'item-recorrente' + (c.ativo ? '' : ' inativo');
        
        const tipoCor = c.tipo === 'receita' ? 'receita' : 'despesa';
        const statusTexto = c.ativo ? 'Ativo' : 'Pausado';
        const statusClasse = c.ativo ? 'ativo' : 'pausado';
        
        item.innerHTML = 
            '<div class="recorrente-info">' +
                '<strong>' + escaparHTMLConfig(c.descricao) + '</strong>' +
                '<span class="recorrente-tipo ' + tipoCor + '">' + (c.tipo === 'receita' ? '⬆ Entrada' : '⬇ Saída') + '</span>' +
                '<span class="recorrente-detalhes">' +
                    escaparHTMLConfig(c.categoria) + ' • Dia ' + c.diaVencimento + ' • ' + formatarMoedaConfig(c.valor) +
                '</span>' +
                '<span class="recorrente-status ' + statusClasse + '">' + statusTexto + '</span>' +
            '</div>' +
            '<div class="recorrente-acoes">' +
                '<button class="btn-toggle" onclick="toggleRecorrente(\'' + c.id + '\')" title="' + (c.ativo ? 'Pausar' : 'Ativar') + '">' + 
                    (c.ativo ? '⏸' : '▶') + 
                '</button>' +
                '<button class="btn-editar-rec" onclick="editarRecorrente(\'' + c.id + '\')" title="Editar">✏️</button>' +
                '<button class="btn-excluir-rec" onclick="excluirRecorrente(\'' + c.id + '\')" title="Excluir">🗑️</button>' +
            '</div>';
        
        container.appendChild(item);
    });
}

function abrirModalRecorrente() {
    document.getElementById('modalRecorrenteTitulo').textContent = '➕ Nova Conta Recorrente';
    document.getElementById('formRecorrente').reset();
    document.getElementById('recorrenteId').value = '';
    document.getElementById('campoRecAtivo').checked = true;
    document.getElementById('modalRecorrente').classList.add('visivel');
}

function editarRecorrente(id) {
    const c = buscarPorId(TABELAS.CONTAS_RECORRENTES, id);
    if (!c) return;
    
    document.getElementById('modalRecorrenteTitulo').textContent = '✏️ Editar Conta Recorrente';
    document.getElementById('recorrenteId').value = c.id;
    document.getElementById('campoRecDescricao').value = c.descricao;
    document.getElementById('campoRecTipo').value = c.tipo;
    document.getElementById('campoRecCategoria').value = c.categoria;
    document.getElementById('campoRecValor').value = c.valor;
    document.getElementById('campoRecDia').value = c.diaVencimento;
    document.getElementById('campoRecAtivo').checked = c.ativo;
    
    document.getElementById('modalRecorrente').classList.add('visivel');
}

function fecharModalRecorrente() {
    document.getElementById('modalRecorrente').classList.remove('visivel');
}

function salvarRecorrente(evento) {
    evento.preventDefault();
    
    const id = document.getElementById('recorrenteId').value;
    const dados = {
        descricao: document.getElementById('campoRecDescricao').value.trim(),
        tipo: document.getElementById('campoRecTipo').value,
        categoria: document.getElementById('campoRecCategoria').value.trim(),
        valor: parseFloat(document.getElementById('campoRecValor').value),
        diaVencimento: parseInt(document.getElementById('campoRecDia').value),
        frequencia: 'mensal',
        ativo: document.getElementById('campoRecAtivo').checked
    };
    
    if (id) {
        atualizar(TABELAS.CONTAS_RECORRENTES, id, dados);
    } else {
        criar(TABELAS.CONTAS_RECORRENTES, dados);
    }
    
    fecharModalRecorrente();
    carregarContasRecorrentes();
    
    const alerta = document.getElementById('alertaRecorrentes');
    mostrarAlertaConfig(alerta, '✅ Conta recorrente salva!', 'sucesso');
}

function toggleRecorrente(id) {
    const c = buscarPorId(TABELAS.CONTAS_RECORRENTES, id);
    if (!c) return;
    
    atualizar(TABELAS.CONTAS_RECORRENTES, id, { ativo: !c.ativo });
    carregarContasRecorrentes();
}

function excluirRecorrente(id) {
    if (confirm('Tem certeza? Esta conta não será mais gerada pelo "Gerar Mês".')) {
        remover(TABELAS.CONTAS_RECORRENTES, id);
        carregarContasRecorrentes();
    }
}

// ---------- UTILITÁRIOS ----------

function mostrarAlertaConfig(elemento, mensagem, tipo) {
    elemento.textContent = mensagem;
    elemento.className = 'alertas visivel alerta-' + tipo;
    setTimeout(function() {
        elemento.classList.remove('visivel');
    }, 4000);
}

function formatarMoedaConfig(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor || 0);
}

function escaparHTMLConfig(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// ---------- NAVEGAÇÃO ENTRE ABAS ----------

function mostrarAba(aba) {
    // Esconde todas
    document.querySelectorAll('.aba-conteudo').forEach(function(el) {
        el.classList.remove('ativa');
    });
    document.querySelectorAll('.aba-btn').forEach(function(el) {
        el.classList.remove('ativa');
    });
    
    // Mostra a selecionada
    document.getElementById('aba-' + aba).classList.add('ativa');
    event.target.classList.add('ativa');
}