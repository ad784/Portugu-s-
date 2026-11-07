import writingRules from '../../shared/writing-rules.json';
let client;
let currentUser = null;
let refreshing;
const prefix = () => currentUser?.id ? `portugues:${currentUser.id}:` : null;
const legacyKeys = ['resultado', 'resultado-aviso', 'rascunho-redacao-v1', 'historico-redacoes-local'];
const volatileStorage = new Map();
function storageWarning() {
  window.portuguesStorageUnavailable = true;
  window.dispatchEvent(new Event('portugues:storage-unavailable'));
}

export const userStorage = {
  getItem(key) {
    const base = prefix(); if (!base) return null;
    if (volatileStorage.has(base + key)) return volatileStorage.get(base + key);
    try { return localStorage.getItem(base + key); } catch { storageWarning(); return null; }
  },
  setItem(key, value) {
    const base = prefix();
    if (!base) throw new Error('Entre na sua conta para salvar seus dados.');
    volatileStorage.set(base + key, value);
    try { localStorage.setItem(base + key, value); } catch { storageWarning(); }
  },
  removeItem(key) {
    const base = prefix(); if (!base) return;
    volatileStorage.delete(base + key);
    try { localStorage.removeItem(base + key); } catch { storageWarning(); }
  }
};

async function expiredSession() {
  // Expiration preserves drafts under their original account. Explicit logout
  // still clears that account's local data on shared devices.
  try { await client.auth.signOut({ scope: 'local' }); }
  finally {
    currentUser = null;
    window.dispatchEvent(new Event('portugues:session-expired'));
    if (!window.portuguesStorageUnavailable) window.location.replace('/?sessao=expirada');
  }
}

function presentResult(result, warning = '') {
  if (!window.portuguesStorageUnavailable) return false;
  let section = document.getElementById('inline-correction-result');
  if (!section) { section = document.createElement('section'); section.id = 'inline-correction-result'; section.className = 'report-card'; document.querySelector('main').append(section); }
  const title = document.createElement('h2'); title.textContent = 'Sua correção está pronta';
  const notice = document.createElement('p'); notice.textContent = 'O navegador não conseguiu guardar o resultado para abrir outra página. Leia e baixe a correção aqui antes de sair.' + (warning ? ' ' + warning : '');
  const report = document.createElement('pre'); report.textContent = result;
  const download = document.createElement('button'); download.type = 'button'; download.className = 'primary-action'; download.textContent = 'Baixar minha correção';
  download.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([result], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'portugues-mais-correcao.txt'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  section.replaceChildren(title, notice, report, download);
  section.setAttribute('tabindex', '-1'); section.focus(); section.scrollIntoView({ block: 'start' });
  return true;
}

async function getSession(forceRefresh = false) {
  let { data, error } = await client.auth.getSession();
  if (error) throw new Error('Não foi possível confirmar sua sessão. Tente novamente.');
  let session = data?.session;
  if (session && (forceRefresh || session.expires_at * 1000 < Date.now() + 60_000)) {
    refreshing ||= client.auth.refreshSession().finally(() => { refreshing = null; });
    const renewal = await refreshing;
    if (renewal.error && session.expires_at * 1000 <= Date.now()) throw new Error('Sua sessão expirou. Entre novamente.');
    session = renewal.data?.session || session;
  }
  currentUser = session?.user || null;
  return session || null;
}

async function request(url, options = {}) {
  const expectedOwner = options.expectedUserId || currentUser?.id;
  const { expectedUserId: _expectedUserId, ...fetchOptions } = options;
  let session = await getSession();
  if (!session) {
    window.dispatchEvent(new Event('portugues:session-expired'));
    if (!window.portuguesStorageUnavailable) window.location.replace('/?sessao=expirada');
    throw new Error('Entre na sua conta para continuar.');
  }
  const owner = session.user?.id;
  if (expectedOwner && owner !== expectedOwner) throw new Error('A conta mudou durante a operação. Entre novamente na conta original para continuar.');
  const perform = async token => {
    try {
      return await fetch(url, {
        ...fetchOptions, signal: fetchOptions.signal || AbortSignal.timeout(65_000),
        headers: { ...fetchOptions.headers, Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      throw new Error(error.name === 'TimeoutError' || error.name === 'AbortError'
        ? 'O serviço demorou além do esperado. Seu conteúdo permanece nesta página; tente novamente.'
        : 'Não foi possível conectar ao serviço. Verifique a internet e tente novamente.');
    }
  };
  if (navigator.onLine === false) throw new Error('Você está sem conexão. Seu conteúdo permanece nesta página. Reconecte-se e tente novamente.');
  let response = await perform(session.access_token);
  if (response.status === 401) {
    session = await getSession(true);
    if (session && session.user?.id !== owner) throw new Error('A conta mudou durante a operação. Entre novamente na conta original para continuar.');
    if (session) response = await perform(session.access_token);
    if (response.status === 401) {
      await expiredSession();
      throw new Error('Sua sessão expirou. Entre novamente.');
    }
  }
  if (owner && currentUser?.id !== owner) throw new Error('A conta mudou durante a operação. Entre novamente na conta original para continuar.');
  if (response.status === 428) {
    window.location.assign('/aceite');
    throw new Error('Confirme os termos para continuar.');
  }
  for (const method of ['json', 'text']) {
    if (typeof response[method] !== 'function') continue;
    const read = response[method].bind(response);
    response[method] = async (...args) => {
      const body = await read(...args);
      if (owner && currentUser?.id !== owner) throw new Error('A conta mudou durante a operação. Entre novamente na conta original para continuar.');
      return body;
    };
  }
  return response;
}

async function signOut(redirect = '/') {
  const base = prefix();
  // Remove somente o estado da conta que está saindo, sem tocar em outras contas.
  if (base) for (const key of volatileStorage.keys()) if (key.startsWith(base)) volatileStorage.delete(key);
  try {
    if (base) for (const key of Object.keys(localStorage)) if (key.startsWith(base)) localStorage.removeItem(key);
    for (const key of legacyKeys) localStorage.removeItem(key);
  } catch { storageWarning(); }
  sessionStorage.removeItem('portugues:recovery');
  try { await client.auth.signOut({ scope: 'local' }); }
  finally { currentUser = null; window.location.replace(redirect); }
}

function pending() {
  try { const items = JSON.parse(userStorage.getItem('historico-redacoes-local') || '[]'); return Array.isArray(items) ? items : []; }
  catch { return []; }
}

function savePending(record) {
  const items = pending().filter(item => item.hash !== record.hash || !record.hash);
  items.unshift({ ...record, id: record.id || `local-${crypto.randomUUID()}`, local: true, created_at: record.created_at || new Date().toISOString() });
  userStorage.setItem('historico-redacoes-local', JSON.stringify(items));
}

let syncing;
async function syncPending() {
  if (syncing) return syncing;
  syncing = (async () => {
    const owner = currentUser?.id;
    for (const record of pending()) {
      if (!owner || currentUser?.id !== owner) break;
      try {
        const response = await request('/api/redacoes/sincronizar', {
          expectedUserId: owner, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record)
        });
        if (!response.ok) break;
        if (currentUser?.id !== owner) break;
        userStorage.setItem('historico-redacoes-local', JSON.stringify(pending().filter(item => item.id !== record.id)));
      } catch { break; }
    }
  })().finally(() => { syncing = null; });
  return syncing;
}

export async function initializeSession(supabaseClient, recovering = false) {
  client = supabaseClient;
  window.userStorage = userStorage;
  const estimateLines = text => String(text || '').replace(/\r\n?/g, '\n').split('\n')
    .reduce((total, line) => total + (line.trim() ? Math.ceil([...line.trim()].length / writingRules.charactersPerLine) : 0), 0);
  window.portuguesSession = { userId: () => currentUser?.id || null, getSession, request, signOut, pending, savePending, syncPending, estimateLines, presentResult };
  client.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    if (event === 'PASSWORD_RECOVERY') {
      sessionStorage.setItem('portugues:recovery', '1');
      if (!/\/recuperar(?:\.html)?\/?$/.test(location.pathname)) location.replace('/recuperar?reset=1');
    }
  });
  const session = await getSession();
  if (recovering && session) sessionStorage.setItem('portugues:recovery', '1');
}
