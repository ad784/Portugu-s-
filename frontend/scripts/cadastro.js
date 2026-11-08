function signupMessage(message, type = 'error') {
  const element = document.getElementById('signup-message');
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${type}`;
}

async function cadastrar(event) {
  event?.preventDefault();
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const senha = document.getElementById('senha').value;
  const consentimento = document.getElementById('consentimento').checked;
  const termos = document.getElementById('termos')?.checked;
  const button = document.getElementById('signup-button');
  if (button.disabled) return;

  if (!nome || !email || !senha) {
    signupMessage('Preencha todos os campos.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { signupMessage('Informe um e-mail válido.'); return; }
  if (senha.length < 8) { signupMessage('Use uma senha de pelo menos 8 caracteres.'); return; }
  if (!termos) {
    signupMessage('Leia e aceite os Termos de uso e a Política de privacidade para criar sua conta.');
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
    await window.checkSignupConfiguration?.();
    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password: senha,
      options: { data: { nome, terms_version: window.legalVersions?.termsVersion || '2026-10-30', privacy_version: window.legalVersions?.privacyVersion || '2026-10-30', ai_consent: true } }
    });
    if (error) throw error;

    if (data?.session) {
      signupMessage('Conta criada. Abrindo a plataforma...', 'success');
      window.location.href = '/nova.html';
      return;
    }

    signupMessage('Não foi possível abrir a conta automaticamente. Tente entrar com seu e-mail e senha; se não conseguir, entre em contato com o suporte.');
  } catch (error) {
    signupMessage(window.authErrorMessage ? window.authErrorMessage(error) : (error.message && error.message !== '{}' ? error.message : 'Não foi possível criar a conta. Tente novamente mais tarde.'));
  } finally {
    button.disabled = false;
    button.innerHTML = 'Criar minha conta <span>→</span>';
  }
}

window.cadastrar = cadastrar;
document.getElementById('signup-form')?.addEventListener?.('submit', cadastrar);
