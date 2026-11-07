async function sair(event) {
  event?.preventDefault();
  return window.portuguesSession.signOut();
}

function formatDate(value) {
  if (!Number.isFinite(Date.parse(value))) return 'Data indisponível';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}
function mergeHistory(remote, local) {
  const ids = new Set(remote.map(item => item.id));
  const hashes = new Set(remote.map(item => item.avaliacao_hash || item.hash).filter(Boolean));
  return [...remote, ...local.filter(item => !ids.has(item.id) && (!item.hash || !hashes.has(item.hash)))];
}

function extractPreview(resultado) {
  const text = (resultado || '').replace(/^.*?Redacao:\s*/is, '').trim();
  return text.length > 180 ? `${text.slice(0, 180)}…` : text || 'Correção por foto';
}

function getLocalHistory() {
  try { return JSON.parse(window.userStorage.getItem('historico-redacoes-local') || '[]'); }
  catch { return []; }
}

function renderHistory(redacoes) {
  const list = document.getElementById('history-list');
  const summary = document.getElementById('history-summary');
  list.replaceChildren();
  summary.replaceChildren();
  if (!redacoes.length) {
    list.innerHTML = '<div class="history-empty"><h2>Você ainda não possui redações salvas.</h2><p>Quando uma redação for corrigida com sua conta, ela aparecerá aqui.</p><a href="/nova" class="primary-action">Escrever minha primeira redação <span>→</span></a></div>';
    return;
  }
  const notas = redacoes.map(item => item.nota).filter(Number.isFinite);
  const average = notas.length ? Math.round(notas.reduce((sum, nota) => sum + nota, 0) / notas.length) : 0;
  summary.innerHTML = `<div><strong>${redacoes.length}</strong><span>redações corrigidas</span></div><div><strong>${average}</strong><span>média de pontos</span></div><div><strong>${notas.length ? Math.max(...notas) : '—'}</strong><span>melhor nota</span></div>`;
  redacoes.forEach(item => {
    const article = document.createElement('article');
    article.className = 'history-item';
    const score = document.createElement('div');
    score.className = 'history-score';
    score.append(document.createTextNode(String(item.nota ?? '—')));
    const scale = document.createElement('small');
    scale.textContent = '/1000';
    score.append(scale);
    const content = document.createElement('div');
    content.className = 'history-content';
    const meta = document.createElement('div');
    meta.className = 'history-meta';
    const type = document.createElement('span');
    type.textContent = item.tipo === 'foto' ? 'Redação por foto' : 'Redação digitada';
    const time = document.createElement('time');
    time.dateTime = item.created_at || '';
    time.textContent = formatDate(item.created_at);
    meta.append(type, time);
    const theme = document.createElement('h2');
    theme.textContent = item.tema || 'Tema não informado';
    const preview = document.createElement('p');
    preview.textContent = extractPreview(item.resultado);
    content.append(meta, theme, preview);
    const view = document.createElement('button');
    view.type = 'button';
    view.className = 'history-view';
    view.textContent = 'Ver correção';
    article.append(score, content, view);
    view.addEventListener('click', () => { window.userStorage.setItem('resultado', item.resultado); window.userStorage.removeItem('resultado-aviso'); if (!window.portuguesSession.presentResult?.(item.resultado)) window.location.href = "/resultado"; });
    list.append(article);
  });
}

async function loadHistory() {
  try {
    await window.portuguesSession.syncPending();
    const response = await window.portuguesSession.request('/api/redacoes');
    const data = await response.json();
    if (!response.ok) throw new Error(data.erro || 'Não foi possível carregar o histórico.');
    const remoteHistory = data.redacoes || [];
    const localHistory = getLocalHistory();
    renderHistory(mergeHistory(remoteHistory, localHistory));
    if (data.hasMore) {
      let page = 0; const records = [...remoteHistory];
      const more = document.createElement('button'); more.className = 'primary-action'; more.textContent = 'Carregar mais redações';
      more.addEventListener('click', async () => {
        more.disabled = true;
        try {
          const response = await window.portuguesSession.request('/api/redacoes?page=' + (page + 1));
          const next = await response.json(); if (!response.ok) throw Error(next.erro);
          records.push(...next.redacoes); page++;
          renderHistory(mergeHistory(records, getLocalHistory())); if (next.hasMore) document.getElementById('history-list').append(more);
        } catch { more.textContent = 'Não foi possível carregar. Tentar novamente'; }
        finally { more.disabled = false; }
      });
      document.getElementById('history-list').append(more);
    }
  } catch (error) {
    const localHistory = getLocalHistory();
    if (localHistory.length) {
      renderHistory(localHistory);
      const notice = document.createElement('p'); notice.className = 'form-message error'; notice.setAttribute('role', 'status');
      notice.textContent = 'Não foi possível atualizar a conta. Mostrando somente as avaliações pendentes deste dispositivo.';
      document.getElementById('history-list').prepend(notice);
    }
    else {
      const empty = document.createElement('div');
      empty.className = 'history-empty';
      const title = document.createElement('h2');
      title.textContent = 'Não foi possível carregar seu histórico.';
      const message = document.createElement('p');
      message.textContent = error.message;
      empty.append(title, message);
      document.getElementById('history-list').replaceChildren(empty);
    }
    const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'secondary-action'; retry.textContent = 'Tentar carregar novamente';
    retry.addEventListener('click', async () => { retry.disabled = true; retry.textContent = 'Carregando...'; await loadHistory(); });
    document.getElementById('history-list').append(retry);
  }
}

window.sair = sair;
window.addEventListener('DOMContentLoaded', loadHistory);
