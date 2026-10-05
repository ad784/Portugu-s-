function showRecoveryMessage(message, type = 'error') { const el = document.getElementById('recovery-message'); el.textContent = message; el.className = `form-message ${type}`; }
async function recuperarSenha() {
  const email = document.getElementById('email-recuperacao').value.trim();
  const button = document.getElementById('recovery-button');
  if (!email || !email.includes('@')) { showRecoveryMessage('Informe um e-mail válido.'); return; }
  if (!window.supabaseClient) { showRecoveryMessage('O serviço de autenticação ainda está carregando.'); return; }
  button.disabled = true; button.textContent = 'Enviando...';
  const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/index.html` });
  if (error) showRecoveryMessage(error.message); else showRecoveryMessage('Se o e-mail estiver cadastrado, você receberá o link de recuperação.', 'success');
  button.disabled = false; button.innerHTML = 'Enviar link de recuperação <span>→</span>';
}
