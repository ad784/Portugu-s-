function signupMessage(message, type = 'error') {
  const element = document.getElementById('signup-message');
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${type}`;
}

async function cadastrar() {
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const senha = document.getElementById('senha').value;
  const consentimento = document.getElementById('consentimento').checked;
  const button = document.getElementById('signup-button');

  if (!nome || !email || !senha) {
    signupMessage('Preencha todos os campos.');
    return;
  }
  if (!consentimento) {
    signupMessage('Confirme que concorda com o uso das redações e fotos para a correção por IA.');
    return;
  }
  if (!window.supabaseClient) {
    signupMessage('O serviço de autenticação ainda está carregando. Tente novamente.');
    return;
  }

  button.disabled = true;
  button.textContent = 'Criando conta...';
  try {
    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } }
    });
    if (error) throw error;

    if (data.session) {
      signupMessage('Conta criada. Abrindo a plataforma...', 'success');
      window.location.href = '/nova.html';
      return;
    }

    signupMessage('Conta criada. Agora você pode entrar com seu e-mail e senha.', 'success');
  } catch (error) {
    signupMessage(error.message || 'Não foi possível criar a conta. Tente novamente.');
  } finally {
    button.disabled = false;
    button.innerHTML = 'Criar minha conta <span>→</span>';
  }
}

window.cadastrar = cadastrar;
