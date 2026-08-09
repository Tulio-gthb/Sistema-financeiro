/* ============================================
   STORAGE.JS - Versão robusta com diagnóstico
   ============================================ */

const TABELAS = {
    LANCAMENTOS: 'lancamentos',
    CONTAS_RECORRENTES: 'contasRecorrentes',
    BENS: 'bens',
    CATEGORIAS: 'categorias',
    CONFIG: 'configuracoes'
};

function gerarId() {
    return Date.now().toString() + '-' + Math.floor(Math.random() * 1000);
}

function buscarTodos(tabela) {
    try {
        const dados = localStorage.getItem(tabela);
        if (!dados) return [];
        const parsed = JSON.parse(dados);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Erro ao ler tabela ' + tabela + ':', e);
        return [];
    }
}

function salvarTodos(tabela, registros) {
    try {
        localStorage.setItem(tabela, JSON.stringify(registros));
    } catch (e) {
        console.error('Erro ao salvar tabela ' + tabela + ':', e);
    }
}

function criar(tabela, registro) {
    const registros = buscarTodos(tabela);
    registro.id = gerarId();
    registro.criadoEm = new Date().toISOString();
    registros.push(registro);
    salvarTodos(tabela, registros);
    return registro;
}

function buscarPorId(tabela, id) {
    const registros = buscarTodos(tabela);
    return registros.find(function(r) { return r.id === id; });
}

function atualizar(tabela, id, novosDados) {
    const registros = buscarTodos(tabela);
    const indice = registros.findIndex(function(r) { return r.id === id; });
    if (indice !== -1) {
        registros[indice] = Object.assign({}, registros[indice], novosDados);
        registros[indice].atualizadoEm = new Date().toISOString();
        salvarTodos(tabela, registros);
        return registros[indice];
    }
    return null;
}

function remover(tabela, id) {
    const registros = buscarTodos(tabela);
    const filtrados = registros.filter(function(r) { return r.id !== id; });
    salvarTodos(tabela, filtrados);
}

// ---------- FUNÇÕES ESPECÍFICAS ----------

function buscarLancamentosPorMes(ano, mes, tipoFiltro) {
    try {
        const lancamentos = buscarTodos(TABELAS.LANCAMENTOS);
        const mesStr = mes.toString().padStart(2, '0');
        
        return lancamentos.filter(function(l) {
            if (!l.data) return false;
            const dataLanc = new Date(l.data + 'T00:00:00');
            const anoLanc = dataLanc.getFullYear();
            const mesLanc = (dataLanc.getMonth() + 1).toString().padStart(2, '0');
            
            const mesmoMes = (anoLanc === ano && mesLanc === mesStr);
            const tipoOk = (tipoFiltro === 'todos') || (l.tipo === tipoFiltro);
            
            return mesmoMes && tipoOk;
        }).sort(function(a, b) {
            return new Date(a.data) - new Date(b.data);
        });
    } catch (e) {
        console.error('Erro em buscarLancamentosPorMes:', e);
        return [];
    }
}

function calcularSaldoAteData(dataLimite) {
    try {
        const lancamentos = buscarTodos(TABELAS.LANCAMENTOS);
        const limite = new Date(dataLimite + 'T00:00:00');
        let saldo = 0;
        
        lancamentos.forEach(function(l) {
            if (!l.data) return;
            if (new Date(l.data + 'T00:00:00') <= limite) {
                if (l.tipo === 'receita') saldo += parseFloat(l.valor || 0);
                else saldo -= parseFloat(l.valor || 0);
            }
        });
        return saldo;
    } catch (e) {
        console.error('Erro em calcularSaldoAteData:', e);
        return 0;
    }
}

function calcularTotaisDoMes(ano, mes) {
    try {
        const receitas = buscarLancamentosPorMes(ano, mes, 'receita');
        const despesas = buscarLancamentosPorMes(ano, mes, 'despesa');
        
        const totalReceitas = receitas.reduce(function(soma, r) { return soma + parseFloat(r.valor || 0); }, 0);
        const totalDespesas = despesas.reduce(function(soma, d) { return soma + parseFloat(d.valor || 0); }, 0);
        
        return {
            receitas: totalReceitas,
            despesas: totalDespesas,
            saldo: totalReceitas - totalDespesas,
            contasPendentes: despesas.filter(function(d) { return d.status === 'pendente'; }).length
        };
    } catch (e) {
        console.error('Erro em calcularTotaisDoMes:', e);
        return { receitas: 0, despesas: 0, saldo: 0, contasPendentes: 0 };
    }
}

function buscarContasRecorrentesAtivas() {
    try {
        const contas = buscarTodos(TABELAS.CONTAS_RECORRENTES);
        return contas.filter(function(c) { return c.ativo === true; });
    } catch (e) {
        return [];
    }
}

function calcularPatrimonio() {
    try {
        const bens = buscarTodos(TABELAS.BENS);
        return bens.reduce(function(soma, b) { return soma + parseFloat(b.valorMercado || b.valorAquisicao || 0); }, 0);
    } catch (e) {
        return 0;
    }
}

// ---------- MOTOR DE RECORRÊNCIA ----------

function gerarLancamentosDoMes(ano, mes) {
    try {
        const recorrentes = buscarContasRecorrentesAtivas();
        const mesStr = String(mes).padStart(2, '0');
        let criados = 0;
        
        recorrentes.forEach(function(conta) {
            const dia = String(conta.diaVencimento || 1).padStart(2, '0');
            const dataLancamento = ano + '-' + mesStr + '-' + dia;
            
            const lancamentosDoMes = buscarLancamentosPorMes(ano, mes, 'todos');
            const jaExiste = lancamentosDoMes.some(function(l) {
                return l.descricao === conta.descricao && l.recorrente === true;
            });
            
            if (!jaExiste) {
                criar(TABELAS.LANCAMENTOS, {
                    descricao: conta.descricao,
                    tipo: conta.tipo,
                    categoria: conta.categoria,
                    valor: parseFloat(conta.valor || 0),
                    data: dataLancamento,
                    status: 'pendente',
                    fornecedor: conta.fornecedor || '',
                    recorrente: true,
                    observacao: 'Gerado automaticamente'
                });
                criados++;
            }
        });
        
        return criados;
    } catch (e) {
        console.error('Erro em gerarLancamentosDoMes:', e);
        return 0;
    }
}

// ---------- DADOS DE EXEMPLO ----------

function criarDadosExemplo() {
    try {
        // Só cria se o banco estiver completamente vazio
        const lancamentos = buscarTodos(TABELAS.LANCAMENTOS);
        if (lancamentos.length > 0) {
            console.log('ℹ️ Dados já existem. Pulando exemplos.');
            return;
        }
        
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = hoje.getMonth() + 1;
        
        function data(a, m, d) {
            return a + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        }
        
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
        
        console.log('✅ Dados de exemplo criados!');
        
        // Categorias
        const categorias = buscarTodos(TABELAS.CATEGORIAS);
        if (categorias.length === 0) {
            const padrao = [
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
            padrao.forEach(function(c) { criar(TABELAS.CATEGORIAS, c); });
        }
        
        // Contas recorrentes
        const recorrentes = buscarTodos(TABELAS.CONTAS_RECORRENTES);
        if (recorrentes.length === 0) {
            criar(TABELAS.CONTAS_RECORRENTES, {
                descricao: 'Aluguel Apartamento',
                tipo: 'despesa',
                categoria: 'Moradia',
                valor: 1800.00,
                diaVencimento: 10,
                frequencia: 'mensal',
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
        
        // Bens
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
    } catch (e) {
        console.error('Erro ao criar dados de exemplo:', e);
    }
}

// ---------- INICIALIZAÇÃO ----------
document.addEventListener('DOMContentLoaded', function() {
    criarDadosExemplo();
});