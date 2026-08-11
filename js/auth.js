/* ============================================
   AUTH.JS - Sistema de Autenticação
   ============================================
   Controla: login, logout, sessão e timeout.
   ============================================ */

// ---------- CONFIGURAÇÕES ----------
const TEMPO_TIMEOUT = 15 * 60 * 1000; // 15 minutos em milissegundos
const USUARIO_PADRAO = {
    nome: 'Tulio',
    email: 'usuario@email.com',
    senha: '1234'                     // Senha fixa inicial (como na planilha)
};

// ---------- INICIALIZAÇÃO ----------
document.addEventListener('DOMContentLoaded', function() {
    criarUsuarioPadrao();
    configurarTimeout();
    
    // Se estiver na página de login, configura o formulário
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', fazerLogin);
    }
});

/**
 * Cria o usuário padrão no LocalStorage se ainda não existir.
 * Assim, na primeira vez que abrir o site, já tem um login válido.
 */
function criarUsuarioPadrao() {
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    
    // Verifica se o usuário padrão já existe
    const existe = usuarios.some(function(u) {
        return u.email === USUARIO_PADRAO.email;
    });
    
    if (!existe) {
        usuarios.push(USUARIO_PADRAO);
        localStorage.setItem('usuarios', JSON.stringify(usuarios));
        console.log('✅ Usuário padrão criado: usuario@email.com / 1015');
    }
}

/**
 * Executa quando o usuário clica em "Entrar"
 */
function fazerLogin(evento) {
    evento.preventDefault();          // Impede o formulário de recarregar a página
    
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const alerta = document.getElementById('alertaLogin');
    
    // Busca o usuário no "banco de dados" (LocalStorage)
    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    const usuario = usuarios.find(function(u) {
        return u.email === email && u.senha === senha;
    });
    
    if (usuario) {
        // Login bem-sucedido!
        const sessao = {
            nome: usuario.nome,
            email: usuario.email,
            horaLogin: new Date().getTime()  // Marca o horário em milissegundos
        };
        
        sessionStorage.setItem('sessao', JSON.stringify(sessao));
        
        // Redireciona para o dashboard
        window.location.href = 'dashboard.html';
    } else {
        // Login falhou
        mostrarAlerta(alerta, 'E-mail ou senha incorretos. Tente novamente.');
        document.getElementById('senha').value = ''; // Limpa a senha
        document.getElementById('senha').focus();
    }
}

/**
 * Mostra mensagem de erro na tela
 */
function mostrarAlerta(elemento, mensagem) {
    elemento.textContent = '⚠️ ' + mensagem;
    elemento.classList.add('visivel');
    
    // Esconde o alerta após 5 segundos
    setTimeout(function() {
        elemento.classList.remove('visivel');
    }, 5000);
}

/**
 * Verifica se o usuário está logado.
 * Usada nas páginas internas (dashboard, etc.)
 */
function verificarAutenticacao() {
    const sessaoJSON = sessionStorage.getItem('sessao');
    
    if (!sessaoJSON) {
        // Não está logado, manda para o login
        window.location.href = 'index.html';
        return null;
    }
    
    const sessao = JSON.parse(sessaoJSON);
    const agora = new Date().getTime();
    const tempoDecorrido = agora - sessao.horaLogin;
    
    // Verifica se passou mais de 15 minutos desde o login
    if (tempoDecorrido > TEMPO_TIMEOUT) {
        // Sessão expirada!
        sessionStorage.removeItem('sessao');
        alert('Sua sessão expirou por inatividade. Faça login novamente.');
        window.location.href = 'index.html';
        return null;
    }
    
    // Tudo certo! Atualiza o horário para renovar os 15 minutos
    sessao.horaLogin = agora;
    sessionStorage.setItem('sessao', JSON.stringify(sessao));
    
    return sessao;
}

/**
 * Configura o timeout de inatividade.
 * Se o usuário não mexer no mouse/teclado por 15 min, desloga.
 */
function configurarTimeout() {
    let temporizador;
    
    function resetarTimeout() {
        clearTimeout(temporizador);
        
        // Só configura o timeout se estiver logado
        const sessao = sessionStorage.getItem('sessao');
        if (sessao) {
            temporizador = setTimeout(function() {
                sessionStorage.removeItem('sessao');
                alert('Você foi desconectado por inatividade de 15 minutos.');
                window.location.href = 'index.html';
            }, TEMPO_TIMEOUT);
        }
    }
    
    // Detecta qualquer movimento do mouse, tecla ou toque
    window.addEventListener('mousemove', resetarTimeout);
    window.addEventListener('keydown', resetarTimeout);
    window.addEventListener('click', resetarTimeout);
    window.addEventListener('touchstart', resetarTimeout); // Para celular
    
    // Inicia o timeout se já estiver logado
    resetarTimeout();
}

/**
 * Função de sair (agora limpa a sessão de verdade)
 */
function sair() {
    sessionStorage.removeItem('sessao');
    window.location.href = 'index.html';
}

/**
 * Preenche o nome do usuário no cabeçalho das páginas internas
 */
function preencherUsuarioLogado() {
    const sessao = verificarAutenticacao();
    
    if (sessao) {
        const elementoNome = document.getElementById('nomeUsuario');
        if (elementoNome) {
            elementoNome.textContent = sessao.nome;
        }
        
        // Saudação dinâmica (Bom dia, Boa tarde, Boa noite)
        const elementoSaudacao = document.getElementById('saudacao');
        if (elementoSaudacao) {
            const hora = new Date().getHours();
            let textoSaudacao = 'Olá';
            
            if (hora >= 5 && hora < 12) {
                textoSaudacao = 'Bom dia';
            } else if (hora >= 12 && hora < 18) {
                textoSaudacao = 'Boa tarde';
            } else {
                textoSaudacao = 'Boa noite';
            }
            
            elementoSaudacao.textContent = textoSaudacao + ', ' + sessao.nome;
        }
    }
}
