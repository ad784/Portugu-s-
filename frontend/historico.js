async function sair(event) {
  event?.preventDefault();
  try { await window.supabaseClient?.auth.signOut({ scope: 'local' }); }
  finally { window.location.href = 'index.html'; }
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function extractPreview(resultado) {
  const text = (resultado || '').replace(/^.*?Redacao:\s*/is, '').trim();
  return text.length > 180 ? `${text.slice(0, 180)}…` : text || 'Correção por foto';
}

function getLocalHistory() {
  try { return JSON.parse(localStorage.getItem('historico-redacoes-local') || '[]'); }
  catch { return []; }
}

function renderHistory(redacoes) {
  const list = document.getElementById('history-list');
  const summary = document.getElementById('history-summary');
  list.replaceChildren();
  summary.replaceChildren();
  if (!redacoes.length) {
    list.innerHTML = '<div class="history-empty"><h2>Você ainda não possui redações salvas.</h2><p>Quando uma redação for corrigida com sua conta, ela aparecerá aqui.</p><a href="nova.html" class="primary-action">Escrever minha primeira redação <span>→</span></a></div>';
    return;
  }
  const notas = redacoes.map(item => item.nota).filter(Number.isFinite);
  const average = notas.length ? Math.round(notas.reduce((sum, nota) => sum + nota, 0) / notas.length) : 0;
  summary.innerHTML = `<div><strong>${redacoes.length}</strong><span>redações corrigidas</span></div><div><strong>${average}</strong><span>média de pontos</span></div><div><strong>${notas.length ? Math.max(...notas) : '—'}</strong><span>melhor nota</span></div>`;
  redacoes.forEach(item => {
    const article = document.createElement('article');
    article.className = 'history-item';
    article.innerHTML = `<div class="history-score">${item.nota ?? '—'}<small>/1000</small></div><div class="history-content"><div class="history-meta"><span>${item.tipo === 'foto' ? 'Redação por foto' : 'Redação digitada'}</span><time>${formatDate(item.created_at)}</time></div><h2>${item.tema || 'Tema não informado'}</h2><p>${extractPreview(item.resultado)}</p></div><button type="button" class="history-view">Ver correção</button>`;
    article.querySelector('.history-view').addEventListener('click', () => { localStorage.setItem('resultado', item.resultado); window.location.href = 'resultado.html'; });
    list.append(article);
  });
}

async function loadHistory() {
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) { window.location.href = 'index.html'; return; }
    const response = await fetch('/api/redacoes', { headers: { Authorization: `Bearer ${session.access_token}` } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.erro || 'Não foi possível carregar o histórico.');
    const remoteHistory = data.redacoes || [];
    const localHistory = getLocalHistory();
    const ids = new Set(remoteHistory.map(item => item.id));
    renderHistory([...remoteHistory, ...localHistory.filter(item => !ids.has(item.id))]);
  } catch (error) {
    const localHistory = getLocalHistory();
    if (localHistory.length) renderHistory(localHistory);
    else document.getElementById('history-list').innerHTML = `<div class="history-empty"><h2>Não foi possível carregar seu histórico.</h2><p>${error.message}</p></div>`;
  }
}

window.sair = sair;
window.addEventListener('DOMContentLoaded', loadHistory);
