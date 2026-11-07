function showRecoveryMessage(message, type = 'error') {
  const el = document.getElementById('recovery-message');
  el.textContent = message;
  el.className = `form-message ${type}`;
}
function resetMode() {
  return sessionStorage.getItem('portugues:recovery') === '1' && Boolean(window.portuguesSession?.userId());
}
let recoveryBusy = false;
let retryTimer;
const retryKey = 'portugues:recovery-retry-until';
function updateRecoveryButton() {
  const button = document.getElementById('recovery-button');
  const seconds = Math.max(0, Math.ceil((Number(sessionStorage.getItem(retryKey) || 0) - Date.now()) / 1000));
  button.disabled = recoveryBusy || seconds > 0;
  button.textContent = recoveryBusy ? 'Enviando...' : seconds > 0 ? `Aguarde ${seconds} s para reenviar` : 'Enviar link de recuperação';
  clearTimeout(retryTimer);
  if (seconds > 0) retryTimer = setTimeout(updateRecoveryButton, 1000);
}
function updateRecoveryForm() {
  const reset = resetMode();
  document.getElementById('recovery-request').hidden = reset;
  document.getElementById('recovery-reset').hidden = !reset;
  document.getElementById('email-recuperacao').disabled = reset;
  document.getElementById('nova-senha').disabled = !reset;
  document.getElementById('confirmar-senha').disabled = !reset;
  const available = window.emailRecoveryEnabled === true;
  document.getElementById('recovery-request').hidden = reset || !available;
  document.getElementById('recovery-support').hidden = reset || available;
  document.getElementById('email-recuperacao').disabled = reset || !available;
  document.getElementById('email-recuperacao').required = !reset && available;
  if (!reset) updateRecoveryButton();
  document.getElementById('recovery-title').textContent = reset ? 'Defina sua nova senha' : 'Recuperar senha';
  if (new URLSearchParams(location.hash.replace(/^#/, '')).get('error_description')) showRecoveryMessage('O link expirou ou não é válido. Solicite um novo link abaixo.');
}
async function recuperarSenha(event) {
  event?.preventDefault();
  if (recoveryBusy) return;
  const reset = resetMode();
  if (!reset && Number(sessionStorage.getItem(retryKey) || 0) > Date.now()) {
    showRecoveryMessage('Aguarde o prazo do botão antes de pedir outro link.'); return;
  }
  const button = document.getElementById(reset ? 'reset-password-button' : 'recovery-button');
  const label = button.textContent;
  recoveryBusy = true;
  button.disabled = true;
  button.textContent = reset ? 'Salvando...' : 'Enviando...';
  try {
    if (!window.supabaseClient) throw new Error('O serviço de autenticação não está disponível. Tente novamente.');
    if (reset) {
      const password = document.getElementById('nova-senha').value;
      if (password.length < 8) throw new Error('Use uma senha de pelo menos 8 caracteres.');
      if (password !== document.getElementById('confirmar-senha').value) throw new Error('As senhas não coincidem.');
      if (!await window.portuguesSession.getSession()) throw new Error('O link expirou. Solicite outro link de recuperação.');
      const { error } = await window.supabaseClient.auth.updateUser({ password });
      if (error) throw error;
      sessionStorage.removeItem('portugues:recovery');
      await window.portuguesSession.signOut('/?senha=alterada');
    } else {
      if (window.emailRecoveryEnabled !== true) throw new Error('A recuperação automática está temporariamente pausada. Utilize o contato de suporte apresentado nesta página.');
      const email = document.getElementById('email-recuperacao').value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe um e-mail válido.');
      const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/recuperar?reset=1` });
      if (error) throw error;
      sessionStorage.setItem(retryKey, String(Date.now() + 60_000));
      showRecoveryMessage('Se houver uma conta com esse e-mail, você receberá um link para criar outra senha. Confira também o spam e use o link mais recente.', 'success');
    }
  } catch (error) {
    if (error.status === 429 || /rate limit|too many requests/i.test(error.message || '')) {
      sessionStorage.setItem(retryKey, String(Date.now() + 60_000));
      showRecoveryMessage('O limite de solicitações foi atingido. Aguarde antes de tentar novamente.');
    } else if (/Error sending.*email|smtp/i.test(error.message || '')) {
      showRecoveryMessage('Não foi possível enviar o link agora. Tente novamente mais tarde ou fale com portuguesmais02@gmail.com.');
    } else if (error.code === 'same_password') {
      showRecoveryMessage('Escolha uma senha diferente da senha anterior.');
    } else {
      showRecoveryMessage(error.message && error.message !== '{}' ? error.message : 'Não foi possível concluir. Tente novamente ou entre em contato com o suporte.');
    }
  }
  finally { recoveryBusy = false; button.disabled = false; button.textContent = label; if (!reset) updateRecoveryButton(); }
}
document.getElementById('recovery-form')?.addEventListener('submit', recuperarSenha);
window.addEventListener('DOMContentLoaded', updateRecoveryForm);
window.addEventListener('pagehide', () => clearTimeout(retryTimer));
