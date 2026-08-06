/* ============================================
   STORAGE.JS - Banco de dados do navegador
   ============================================
   Todas as funções de Create, Read, Update e
   Delete (CRUD) ficam aqui. É como um arquivo
   que fala com o armário localStorage.
   ============================================ */

// ---------- NOMES DAS "TABELAS" ----------
const TABELAS = {
    LANCAMENTOS: 'lancamentos',
    CONTAS_RECORRENTES: 'contasRecorrentes',
    BENS: 'bens',
    CATEGORIAS: 'categorias',
    CONFIG: 'configuracoes'
};

// ---------- FUNÇÕES BASE (GENÉRICAS) ----------

/**
 * Gera um ID único baseado no horário atual.
 * Exemplo: "1722525600000-847"
 */
function gerarId() {
    return Date.now().toString() + '-' + Math.floor(Math.random() * 1000);
}

/**
 * Lê todos os registros de uma tabela.
 * Se a tabela não existir, retorna array vazio.
 */
function buscarTodos(tabela) {
    const dados = localStorage.getItem(tabela);
    return dados ? JSON.parse(dados) : [];
}

/**
 * Salva um array completo em uma tabela.
 */
function salvarTodos(tabela, registros) {
    localStorage.setItem(tabela, JSON.stringify(registros));
}

/**
 * Adiciona um novo registro a uma tabela.
 */
function criar(tabela, registro) {
    const registros = buscarTodos(tabela);
    registro.id = gerarId();          // Coloca um RG único no registro
    registro.criadoEm = new Date().toISOString(); // Marca quando foi criado
    registros.push(registro);
    salvarTodos(tabela, registros);
    return registro;
}

/**
 * Busca UM registro pelo ID.
 */
function buscarPorId(tabela, id) {
    const registros = buscarTodos(tabela);
    return registros.find(function(r) {
        return r.id === id;
    });
}

/**
 * Atualiza um registro existente pelo ID.
 */
function atualizar(tabela, id, novosDados) {
    const registros = buscarTodos(tabela);
    const indice = registros.findIndex(function(r) {
        return r.id === id;
    });
    
    if (indice !== -1) {
        registros[indice] = Object.assign({}, registros[indice], novosDados);
        registros[indice].atualizadoEm = new Date().toISOString();
        salvarTodos(tabela, registros);
        return registros[indice];
    }
    return null;
}

/**
 * Remove um registro pelo ID.
 */
function remover(tabela, id) {
    const registros = buscarTodos(tabela);
    const filtrados = registros.filter(function(r) {
        return r.id !== id;
    });
    salvarTodos(tabela, filtrados);
}

/**
 * Limpa completamente uma tabela (cuidado!).
 */
function limparTabela(tabela) {
    localStorage.removeItem(tabela);
}

// ---------- FUNÇÕES ESPECÍFICAS DO SISTEMA ----------

/**
 * Busca lançamentos de um mês/ano específico.
 * tipoFiltro pode ser: 'todos', 'receita', 'despesa'
 */
function buscarLancamentosPorMes(ano, mes, tipoFiltro) {
    const lancamentos = buscarTodos(TABELAS.LANCAMENTOS);
    const mesStr = mes.toString().padStart(2, '0'); // "7" vira "07"
    
    return lancamentos.filter(function(l) {
        const dataLanc = new Date(l.data);
        const anoLanc = dataLanc.getFullYear();
        const mesLanc = (dataLanc.getMonth() + 1).toString().padStart(2, '0');
        
        const mesmoMes = (anoLanc === ano && mesLanc === mesStr);
        const tipoOk = (tipoFiltro === 'todos') || (l.tipo === tipoFiltro);
        
        return mesmoMes && tipoOk;
    }).sort(function(a, b) {
        return new Date(a.data) - new Date(b.data); // Ordena por data
    });
}

/**
 * Calcula o saldo acumulado até uma data.
 */
function calcularSaldoAteData(dataLimite) {
    const lancamentos = buscarTodos(TABELAS.LANCAMENTOS);
    const limite = new Date(dataLimite);
    
    let saldo = 0;
    
    lancamentos.forEach(function(l) {
        if (new Date(l.data) <= limite) {
            if (l.tipo === 'receita') {
                saldo += parseFloat(l.valor);
            } else {
                saldo -= parseFloat(l.valor);
            }
        }
    });
    
    return saldo;
}

/**
 * Calcula totais do mês: receitas, despesas e saldo.
 */
function calcularTotaisDoMes(ano, mes) {
    const receitas = buscarLancamentosPorMes(ano, mes, 'receita');
    const despesas = buscarLancamentosPorMes(ano, mes, 'despesa');
    
    const totalReceitas = receitas.reduce(function(soma, r) {
        return soma + parseFloat(r.valor);
    }, 0);
    
    const totalDespesas = despesas.reduce(function(soma, d) {
        return soma + parseFloat(d.valor);
    }, 0);
    
    return {
        receitas: totalReceitas,
        despesas: totalDespesas,
        saldo: totalReceitas - totalDespesas,
        contasPendentes: despesas.filter(function(d) {
            return d.status === 'pendente';
        }).length
    };
}

/**
 * Busca contas recorrentes ativas.
 */
function buscarContasRecorrentesAtivas() {
    const contas = buscarTodos(TABELAS.CONTAS_RECORRENTES);
    return contas.filter(function(c) {
        return c.ativo === true;
    });
}

/**
 * Busca todos os bens para calcular patrimônio.
 */
function calcularPatrimonio() {
    const bens = buscarTodos(TABELAS.BENS);
    return bens.reduce(function(soma, b) {
        return soma + parseFloat(b.valorMercado || b.valorAquisicao);
    }, 0);
}

// ---------- CONFIGURAÇÕES DO SISTEMA ----------

function obterConfiguracao(chave, padrao) {
    const configs = buscarTodos(TABELAS.CONFIG);
    const config = configs.find(function(c) {
        return c.chave === chave;
    });
    return config ? config.valor : padrao;
}

function salvarConfiguracao(chave, valor) {
    const configs = buscarTodos(TABELAS.CONFIG);
    const indice = configs.findIndex(function(c) {
        return c.chave === chave;
    });
    
    if (indice !== -1) {
        configs[indice].valor = valor;
        configs[indice].atualizadoEm = new Date().toISOString();
    } else {
        configs.push({
            id: gerarId(),
            chave: chave,
            valor: valor,
            criadoEm: new Date().toISOString()
        });
    }
    
    salvarTodos(TABELAS.CONFIG, configs);
}

// ---------- DADOS DE EXEMPLO ----------

/**
 * Cria dados de exemplo se o banco estiver vazio.
 * Assim, na primeira vez que abrir, o dashboard já tem vida.
 */
function criarDadosExemplo() {
    const lancamentos = buscarTodos(TABELAS.LANCAMENTOS);
    
    // Só cria exemplos se não houver nada
    if (lancamentos.length === 0) {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = hoje.getMonth() + 1;
        
        // Formata data: "2026-07-05"
        function data(ano, mes, dia) {
            return ano + '-' + mes.toString().padStart(2, '0') + '-' + dia.toString().padStart(2, '0');
        }
        
        // 1. Salário (receita)
        criar(TABELAS.LANCAMENTOS, {
            descricao: 'Salário Mensal',
            tipo: 'receita',
            categoria: 'Salário',
            valor: 8500.00,
            data: data(ano, mes, 5),
            status: 'recebido',
            fornecedor: 'Empresa ABC Ltda',
            recorrente: true,
            observacao: 'Depósito em conta corrente'
        });
        
        // 2. Aluguel (despesa fixa)
        criar(TABELAS.LANCAMENTOS, {
            descricao: 'Aluguel Apartamento',
            tipo: 'despesa',
            categoria: 'Moradia',
            valor: 1800.00,
            data: data(ano, mes, 10),
            status: 'pago',
            fornecedor: 'Imobiliária Central',
            recorrente: true,
            observacao: 'Vencimento dia 10'
        });
        
        // 3. Internet (despesa)
        criar(TABELAS.LANCAMENTOS, {
            descricao: 'Internet Fibra 500MB',
            tipo: 'despesa',
            categoria: 'Serviços',
            valor: 129.90,
            data: data(ano, mes, 15),
            status: 'pendente',
            fornecedor: 'Provedor Net',
            recorrente: true,
            observacao: 'Fatura automática no cartão'
        });
        
        // 4. Supermercado (despesa)
        criar(TABELAS.LANCAMENTOS, {
            descricao: 'Compras do Mês - Supermercado',
            tipo: 'despesa',
            categoria: 'Alimentação',
            valor: 1450.00,
            data: data(ano, mes, 8),
            status: 'pago',
            fornecedor: 'Supermercado Bom Preço',
            recorrente: false,
            observacao: 'Compras da semana'
        });
        
        // 5. Freelance (receita extra)
        criar(TABELAS.LANCAMENTOS, {
            descricao: 'Projeto Freelance - Site',
            tipo: 'receita',
            categoria: 'Rendimentos',
            valor: 2500.00,
            data: data(ano, mes, 20),
            status: 'pendente',
            fornecedor: 'Cliente XYZ',
            recorrente: false,
            observacao: 'Pagamento previsto para dia 20'
        });
        
        // 6. IPVA do carro (despesa anual/sazonal)
        criar(TABELAS.LANCAMENTOS, {
            descricao: 'IPVA 2026 - Parcela 3/10',
            tipo: 'despesa',
            categoria: 'Veículo',
            valor: 320.50,
            data: data(ano, mes, 25),
            status: 'pendente',
            fornecedor: 'Detran',
            recorrente: false,
            observacao: 'Parcelamento em 10x'
        });
        
        console.log('✅ Dados de exemplo criados com sucesso!');
    }
    
    // Cria categorias padrão se não existirem
    const categorias = buscarTodos(TABELAS.CATEGORIAS);
    if (categorias.length === 0) {
        const categoriasPadrao = [
            { nome: 'Salário', tipo: 'receita', cor: '#38a169' },
            { nome: 'Rendimentos', tipo: 'receita', cor: '#48bb78' },
            { nome: 'Vendas', tipo: 'receita', cor: '#68d391' },
            { nome: 'Moradia', tipo: 'despesa', cor: '#e53e3e' },
            { nome: 'Alimentação', tipo: 'despesa', cor: '#fc8181' },
            { nome: 'Serviços', tipo: 'despesa', cor: '#f56565' },
            { nome: 'Veículo', tipo: 'despesa', cor: '#c53030' },
            { nome: 'Saúde', tipo: 'despesa', cor: '#9b2c2c' },
            { nome: 'Educação', tipo: 'despesa', cor: '#742a2a' },
            { nome: 'Lazer', tipo: 'despesa', cor: '#e53e3e' }
        ];
        
        categoriasPadrao.forEach(function(cat) {
            criar(TABELAS.CATEGORIAS, cat);
        });
    }
    
    // Cria uma conta recorrente de exemplo
    const recorrentes = buscarTodos(TABELAS.CONTAS_RECORRENTES);
    if (recorrentes.length === 0) {
        criar(TABELAS.CONTAS_RECORRENTES, {
            descricao: 'Aluguel Apartamento',
            tipo: 'despesa',
            categoria: 'Moradia',
            valor: 1800.00,
            diaVencimento: 10,
            frequencia: 'mensal', // mensal, anual, semanal
            ativo: true
        });
        
        criar(TABELAS.CONTAS_RECORRENTES, {
            descricao: 'Salário Mensal',
            tipo: 'receita',
            categoria: 'Salário',
            valor: 8500.00,
            diaVencimento: 5,
            frequencia: 'mensal',
            ativo: true
        });
    }
    
    // Cria um bem de exemplo
    const bens = buscarTodos(TABELAS.BENS);
    if (bens.length === 0) {
        criar(TABELAS.BENS, {
            nome: 'Apartamento Residencial',
            tipo: 'Imóvel',
            valorAquisicao: 350000.00,
            valorMercado: 420000.00,
            dataAquisicao: '2020-03-15',
            observacao: 'Apartamento de 2 quartos, bairro centro'
        });
        
        criar(TABELAS.BENS, {
            nome: 'Honda Civic 2022',
            tipo: 'Veículo',
            valorAquisicao: 95000.00,
            valorMercado: 78000.00,
            dataAquisicao: '2022-06-10',
            observacao: 'Carro particular, revisões em dia'
        });
    }
}

// ---------- INICIALIZAÇÃO ----------
// Cria os dados de exemplo quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    criarDadosExemplo();
});