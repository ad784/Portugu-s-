// Isolated Chrome profile, synthetic accounts and mocked services. No real
// Supabase writes, email requests or AI calls are allowed during this check.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const reportDir = path.resolve('.qa');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'portugues-browser-'));
const user = { id: '11111111-1111-4111-8111-111111111111', email: 'estudante@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: { nome: 'Estudante de teste' } };
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.test`;
const session = { access_token: token, refresh_token: 'qa-refresh', token_type: 'bearer', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, user };

async function main() {
  if (!fs.existsSync(chrome)) throw new Error('Chrome não encontrado. Ajuste o caminho do navegador neste script.');
  fs.mkdirSync(reportDir, { recursive: true });
  const processChrome = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore', windowsHide: true });
  let ws;
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await delay(100);
    if (!fs.existsSync(portFile)) throw new Error('O navegador não abriu a porta de diagnóstico.');
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' }).then(r => r.json());
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
    let sequence = 0, currentRoute = '/', exceptions = [];
    const waiting = new Map();
    const call = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(() => { waiting.delete(id); reject(new Error(`Timeout: ${method}`)); }, 20000);
      waiting.set(id, { resolve: value => { clearTimeout(timeout); resolve(value); }, reject: error => { clearTimeout(timeout); reject(error); } });
      ws.send(JSON.stringify({ id, method, params }));
    });
    ws.onmessage = event => {
      const data = JSON.parse(event.data);
      if (data.id) { const pending = waiting.get(data.id); if (pending) { waiting.delete(data.id); data.error ? pending.reject(new Error(data.error.message)) : pending.resolve(data.result); } return; }
      if (data.method === 'Runtime.exceptionThrown') exceptions.push(data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text);
      if (data.method === 'Fetch.requestPaused') {
        const { requestId, request } = data.params;
        const url = new URL(request.url);
        let body;
        if (url.pathname === '/api/config') body = { supabaseUrl: 'https://qa.supabase.co', supabasePublishableKey: 'sb_publishable_qa', emailRecoveryEnabled: true };
        else if (url.pathname === '/api/termos') body = { accepted: currentRoute !== '/aceite', receipt: { accepted_at: new Date().toISOString() } };
        else if (url.pathname === '/api/perfil') body = { perfil: { nome: 'Estudante de teste', email: user.email } };
        else if (['/api/redacoes', '/api/evolucao'].includes(url.pathname)) body = { redacoes: [], hasMore: false };
        else if (url.pathname === '/auth/v1/user') body = user;
        else if (url.pathname === '/auth/v1/settings') body = { mailer_autoconfirm: true, external: { email: true }, disable_signup: false };
        else body = { erro: 'Serviço externo bloqueado no teste de navegador.' };
        call('Fetch.fulfillRequest', { requestId, responseCode: body.erro ? 503 : 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: Buffer.from(JSON.stringify(body)).toString('base64') }).catch(error => exceptions.push(error.message));
      }
    };
    await call('Page.enable'); await call('Runtime.enable');
    await call('Fetch.enable', { patterns: [{ urlPattern: 'http://localhost:3000/api/*' }, { urlPattern: 'https://*.supabase.co/*' }] });
    await call('Page.addScriptToEvaluateOnNewDocument', { source: `if(location.hostname==='localhost'){const key='sb-qa-auth-token';if(['/nova','/foto','/resultado','/historico','/evolucao','/perfil','/aceite'].includes(location.pathname))localStorage.setItem(key,${JSON.stringify(JSON.stringify(session))});else localStorage.removeItem(key);}` });
    const reports = [];
    for (const width of [1366, 390]) {
      await call('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
      for (const route of ['/', '/cadastro', '/recuperar', '/nova', '/foto', '/resultado', '/historico', '/evolucao', '/perfil', '/aceite', '/termos', '/privacidade']) {
        currentRoute = route; exceptions = [];
        await call('Page.navigate', { url: 'http://localhost:3000' + route });
        let state;
        for (let attempt = 0; attempt < 60; attempt++) {
          await delay(100);
          const response = await call('Runtime.evaluate', { expression: `JSON.stringify({path:location.pathname,ready:document.readyState,heading:document.querySelector('h1,h2')?.textContent,session:!!window.portuguesSession,overflow:document.documentElement.scrollWidth>innerWidth+2,resourceError:!!document.querySelector('.resource-error'),menus:document.querySelectorAll('.nav-menu-toggle').length})`, returnByValue: true });
          if (!response.result.value) continue;
          state = JSON.parse(response.result.value);
          if (state.ready === 'complete' && state.heading && (['/termos','/privacidade'].includes(route) || state.session)) break;
        }
        await delay(250);
        const result = await call('Runtime.evaluate', { expression: `JSON.stringify({path:location.pathname,heading:document.querySelector('h1,h2')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth+2,resourceError:!!document.querySelector('.resource-error'),menus:document.querySelectorAll('.nav-menu-toggle').length})`, returnByValue: true });
        state = JSON.parse(result.result.value);
        const report = { route, width, ...state, exceptions: [...exceptions] }; reports.push(report);
        console.log(JSON.stringify(report));
        if (['/cadastro', '/nova', '/aceite'].includes(route)) {
          const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
          fs.writeFileSync(path.join(reportDir, `${route.slice(1)}-${width}.png`), Buffer.from(shot.data, 'base64'));
        }
      }
    }
    // Exercise actual DOM handlers and persistence, not only rendered pages.
    const evaluate = async expression => {
      const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result.value;
    };
    const waitFor = async expression => {
      for (let attempt = 0; attempt < 60; attempt++) { if (await evaluate(expression)) return; await delay(100); }
      throw new Error('Condição não atingida no navegador: ' + expression);
    };
    currentRoute = '/nova';
    await call('Page.navigate', { url: 'http://localhost:3000/nova' });
    await waitFor("!!document.querySelector('.nav-menu-toggle') && !!window.portuguesSession?.userId()");
    const draft = Array(8).fill('Esta redação fictícia verifica a preservação do texto quando o serviço falha.').join('\n');
    await evaluate(`document.getElementById('redacao').value=${JSON.stringify(draft)};document.getElementById('redacao').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('.theme-option[data-theme]')?.click();`);
    await delay(300);
    const theme = await evaluate("document.getElementById('tema-enem').value");
    await call('Page.reload');
    await waitFor(`document.getElementById('redacao')?.value===${JSON.stringify(draft)}`);
    if (await evaluate("document.getElementById('tema-enem').value") !== theme) throw new Error('Tema não recuperado junto com o rascunho.');
    if (await evaluate("!!document.getElementById('tema-livre')")) throw new Error('Campo extra de tema reapareceu.');
    await evaluate("document.querySelector('.correct-action').click()");
    await waitFor("document.getElementById('editor-message')?.textContent.includes('Seu texto permanece')");
    if (await evaluate("document.getElementById('redacao').value") !== draft) throw new Error('Falha de correção apagou o texto.');
    if (await evaluate("document.querySelector('.correct-action').disabled")) throw new Error('Botão ficou preso após falha do serviço.');
    // Simulate an account with an existing receipt opening /aceite directly.
    currentRoute = '/nova';
    await call('Page.navigate', { url: 'http://localhost:3000/aceite' });
    await waitFor("location.pathname==='/nova' && !!document.querySelector('.nav-menu-toggle')");
    console.log('INTERAÇÕES OK: rascunho e tema recuperados; falha de IA preserva texto; botão liberado; aceite existente não é repetido.');
    fs.writeFileSync(path.join(reportDir, 'browser-report.json'), JSON.stringify({ pages: reports, interactions: ['draft-and-theme-restored', 'correction-failure-retains-essay', 'retry-button-restored', 'no-duplicate-acceptance'] }, null, 2));
    if (reports.some(item => item.path !== item.route || item.overflow || item.resourceError || item.exceptions.length || !item.heading)) process.exitCode = 1;
  } finally { if (ws) ws.close(); processChrome.kill(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
