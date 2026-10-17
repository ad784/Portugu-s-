function signupMessage(message, type = 'error') {
  const element = document.getElementById('signup-message');
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${type}`;
}

async function cadastrar() {
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
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
  if (!window.supabaseClient || !window.supabaseAuthSettingsUrl || !window.supabasePublishableKey) {
    signupMessage('O serviço de autenticação ainda está carregando. Tente novamente.');
    return;
  }

  button.disabled = true;
  button.textContent = 'Verificando configuração...';
  try {
    const settingsResponse = await fetch(window.supabaseAuthSettingsUrl, {
      headers: { apikey: window.supabasePublishableKey }
    });
    if (!settingsResponse.ok) throw new Error('Não foi possível conferir a configuração de confirmação do e-mail. Tente novamente.');
    const settings = await settingsResponse.json();

    // Fail closed: não criar contas enquanto o Supabase estiver confirmando
    // automaticamente endereços que ainda não foram verificados.
    if (settings.mailer_autoconfirm !== false) {
      signupMessage('Cadastro pausado: a confirmação de e-mail está desativada no Supabase. Ative “Confirm Email” para validar o endereço antes do primeiro acesso.');
      return;
    }

    button.textContent = 'Criando conta...';
    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } }
    });
    if (error) {
      if (error.code === 'over_email_send_rate_limit') {
        throw new Error('Limite de e-mails do Supabase atingido. Aguarde antes de tentar novamente ou configure um SMTP próprio.');
      }
      throw new Error(error.message);
    }
    if (data.session) {
      await window.supabaseClient.auth.signOut({ scope: 'local' });
      throw new Error('O Supabase não exigiu a confirmação do e-mail. O cadastro foi interrompido; confira a configuração do projeto.');
    }

    signupMessage('Conta criada. Abra o link enviado ao seu e-mail para confirmar o endereço antes de entrar.', 'success');
  } catch (error) {
    signupMessage(error.message || 'Não foi possível criar a conta. Tente novamente.');
  } finally {
    button.disabled = false;
    button.innerHTML = 'Criar minha conta <span>→</span>';
  }
}

window.cadastrar = cadastrar;
