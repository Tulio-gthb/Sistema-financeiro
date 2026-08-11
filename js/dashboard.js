/* ============================================
   DASHBOARD.JS - Com proteções para gráficos
   ============================================ */

let graficoBarras = null;
let graficoLinha = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ dashboard.js carregado');
    
    // Verifica se Chart.js carregou
    if (typeof Chart === 'undefined') {
        console.error('❌ Chart.js NÃO carregou! Verifique a internet ou o <script> no HTML.');
    } else {
        console.log('✅ Chart.js disponível');
    }
    
    carregarDashboard();
});

function carregarDashboard() {
    try {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = hoje.getMonth() + 1;

        console.log('📊 Carregando dashboard para:', mes + '/' + ano);

        const totais = calcularTotaisDoMes(ano, mes);
        const saldoAtual = calcularSaldoAteData(hoje.toISOString().split('T')[0]);

        console.log('💰 Totais:', totais);
        console.log('💳 Saldo atual:', saldoAtual);

        // Atualiza cartões
        atualizarCartao('cartaoSaldo', saldoAtual);
        atualizarCartao('cartaoReceitas', totais.receitas, 'receita');
        atualizarCartao('cartaoDespesas', totais.despesas, 'despesa');

        const elementoPendentes = document.getElementById('contasPendentes');
        if (elementoPendentes) {
            elementoPendentes.textContent = totais.contasPendentes + ' conta' + (totais.contasPendentes !== 1 ? 's' : '') + ' pendente' + (totais.contasPendentes !== 1 ? 's' : '');
        }

        // Assistente
        if (typeof renderizarAssistente === 'function') {
            renderizarAssistente();
        }

        // Gráficos (com proteção)
        if (typeof Chart !== 'undefined') {
            renderizarGraficoBarras(totais);
            renderizarGraficoLinha(ano, mes);
        } else {
            console.warn('⚠️ Chart.js não disponível, gráficos ignorados.');
            mostrarPlaceholderGrafico();
        }

    } catch (erro) {
        console.error('❌ Erro ao carregar dashboard:', erro);
    }
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
    }).format(valor || 0);

    elemento.textContent = formatado;
    elemento.classList.remove('receita', 'despesa');
    if (tipo === 'receita') elemento.classList.add('receita');
    if (tipo === 'despesa') elemento.classList.add('despesa');
}

// ---------- GRÁFICO DE BARRAS ----------

function renderizarGraficoBarras(totais) {
    try {
        const ctx = document.getElementById('graficoBarras');
        if (!ctx) {
            console.error('❌ Canvas #graficoBarras não encontrado no HTML!');
            return;
        }

        if (graficoBarras) {
            graficoBarras.destroy();
        }

        graficoBarras = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Receitas', 'Despesas', 'Saldo'],
                datasets: [{
                    label: 'Valor (R$)',
                    data: [
                        totais.receitas || 0,
                        totais.despesas || 0,
                        totais.saldo || 0
                    ],
                    backgroundColor: [
                        '#38a169',
                        '#e53e3e',
                        (totais.saldo || 0) >= 0 ? '#3182ce' : '#dd6b20'
                    ],
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return new Intl.NumberFormat('pt-BR', {
                                    style: 'currency', currency: 'BRL'
                                }).format(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + (value / 1000).toFixed(0) + 'k';
                            }
                        }
                    }
                }
            }
        });
        
        console.log('✅ Gráfico de barras renderizado');
        
    } catch (erro) {
        console.error('❌ Erro no gráfico de barras:', erro);
    }
}

// ---------- GRÁFICO DE LINHA ----------

function renderizarGraficoLinha(ano, mes) {
    try {
        const ctx = document.getElementById('graficoLinha');
        if (!ctx) {
            console.error('❌ Canvas #graficoLinha não encontrado no HTML!');
            return;
        }

        if (graficoLinha) {
            graficoLinha.destroy();
        }

        const diasNoMes = new Date(ano, mes, 0).getDate();
        const labels = [];
        const dados = [];
        
        for (let dia = 1; dia <= diasNoMes; dia += 2) {
            const dataStr = ano + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
            const saldo = calcularSaldoAteData(dataStr);
            labels.push(dia + '/' + String(mes).padStart(2, '0'));
            dados.push(saldo);
        }

        graficoLinha = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Saldo Projetado',
                    data: dados,
                    borderColor: '#1a365d',
                    backgroundColor: 'rgba(26, 54, 93, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#1a365d'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Saldo: ' + new Intl.NumberFormat('pt-BR', {
                                    style: 'currency', currency: 'BRL'
                                }).format(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + (value / 1000).toFixed(0) + 'k';
                            }
                        }
                    }
                }
            }
        });
        
        console.log('✅ Gráfico de linha renderizado');
        
    } catch (erro) {
        console.error('❌ Erro no gráfico de linha:', erro);
    }
}

// ---------- PLACEHOLDER SE CHART.JS FALHAR ----------

function mostrarPlaceholderGrafico() {
    const container1 = document.getElementById('graficoBarras');
    const container2 = document.getElementById('graficoLinha');
    
    if (container1 && container1.parentNode) {
        container1.parentNode.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--cor-texto-claro);">📊 Gráfico indisponível (sem conexão com Chart.js)</div>';
    }
    if (container2 && container2.parentNode) {
        container2.parentNode.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--cor-texto-claro);">📈 Gráfico indisponível (sem conexão com Chart.js)</div>';
    }
}