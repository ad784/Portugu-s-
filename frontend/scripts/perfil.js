function profileMessage(message, type = 'error') {
  const element = document.getElementById('profile-message');
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${type}`;
}

async function profileRequest(method = 'GET', body = null) {
  if (!window.supabaseClient) throw new Error('O serviço de autenticação ainda está carregando. Tente novamente.');

  const makeRequest = (token) => fetch('/api/perfil', {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });

  let { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = '/index.html';
    return null;
  }

  let response = await makeRequest(session.access_token);
  if (response.status === 401) {
    const renewal = await window.supabaseClient.auth.refreshSession();
    session = renewal.data.session;
    if (session) response = await makeRequest(session.access_token);
  }

  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : {}; }
  catch { throw new Error('O servidor respondeu de forma inesperada. Tente novamente.'); }

  if (response.status === 401) {
    await window.supabaseClient.auth.signOut();
    window.location.href = '/index.html';
    return null;
  }
  if (!response.ok) throw new Error(data.erro || 'Não foi possível concluir a operação.');
  return data;
}

async function loadProfile() {
  try {
    const data = await profileRequest();
    if (!data) return;
    document.getElementById('perfil-nome').value = data.perfil.nome;
    document.getElementById('perfil-email').value = data.perfil.email;
  } catch (error) {
    profileMessage(error.message || 'Não foi possível carregar o perfil.');
  }
}

async function salvarPerfil() {
  const button = document.getElementById('profile-save');
  const originalLabel = button.innerHTML;
  button.disabled = true;
  button.textContent = 'Salvando...';
  try {
    const data = await profileRequest('PUT', { nome: document.getElementById('perfil-nome').value });
    if (data) {
      document.getElementById('perfil-nome').value = data.perfil.nome;
      profileMessage('Perfil atualizado com sucesso.', 'success');
    }
  } catch (error) {
    profileMessage(error.message || 'Não foi possível atualizar o perfil.');
  } finally {
    button.disabled = false;
    button.innerHTML = originalLabel;
  }
}

async function sair(event) {
  event?.preventDefault();
  try { await window.supabaseClient?.auth.signOut({ scope: 'local' }); }
  finally { window.location.href = '/index.html'; }
}

window.sair = sair;
window.salvarPerfil = salvarPerfil;
window.addEventListener('DOMContentLoaded', loadProfile);
