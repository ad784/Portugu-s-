const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

process.env.LOCAL_DEMO_AUTH = 'true';
const app = require('../backend/server');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => { server = app.listen(0, () => { baseUrl = `http://127.0.0.1:${server.address().port}`; resolve(); }); });
});

test.after(async () => new Promise((resolve) => server.close(resolve)));

test('identifies the local session and loads the profile', async () => {
  const [meResponse, profileResponse] = await Promise.all([
    fetch(`${baseUrl}/api/me`),
    fetch(`${baseUrl}/api/perfil`)
  ]);
  assert.equal(meResponse.status, 200);
  assert.deepEqual(await meResponse.json(), { email: 'local@localhost', role: 'admin' });
  assert.equal(profileResponse.status, 200);
  assert.deepEqual(await profileResponse.json(), {
    perfil: { nome: 'Estudante local', email: 'local@localhost' }
  });
});

test('API uses private caching, JSON errors and safe invalid-body responses', async () => {
  const response = await fetch(baseUrl + '/api/unknown');
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.ok((await response.json()).erro);
  const invalid = await fetch(baseUrl + '/api/perfil', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{"sensitive":"do not log"' });
  assert.equal(invalid.status, 400);
  assert.ok(!(await invalid.text()).includes('sensitive'));
});

test('validates and updates the profile in local mode', async () => {
  const invalid = await fetch(`${baseUrl}/api/perfil`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: '   ' })
  });
  assert.equal(invalid.status, 400);

  const response = await fetch(`${baseUrl}/api/perfil`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: '  Ana Souza  ' })
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    perfil: { nome: 'Ana Souza', email: 'local@localhost' }
  });
});

test('admin essays route responds in local mode', async () => {
  const response = await fetch(`${baseUrl}/api/admin/redacoes`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { redacoes: [] });
});

test('creates and opens an account directly when Supabase auto-confirms it', async () => {
  const message = { textContent: '', className: '' };
  const button = { disabled: false, textContent: '', innerHTML: 'Criar conta' };
  const fields = {
    nome: { value: 'Ana' },
    email: { value: 'ana@example.com' },
    senha: { value: 'a-long-test-password' },
    consentimento: { checked: true },
    termos: { checked: true },
    'signup-button': button,
    'signup-message': message
  };
  let signupCalls = 0;
  const location = { href: '' };
  const context = {
    window: {
      location,
      supabaseClient: { auth: { signUp: async () => { signupCalls += 1; return { data: { session: {} }, error: null }; } } }
    },
    document: { getElementById: (id) => fields[id] }
  };
  vm.runInNewContext(fs.readFileSync('frontend/scripts/cadastro.js', 'utf8'), context);
  await context.window.cadastrar();

  assert.equal(signupCalls, 1);
  assert.equal(location.href, '/nova.html');
  assert.match(message.textContent, /Conta criada/);
  assert.equal(button.disabled, false);
});

test('recusa redação com menos de 8 linhas', async () => {
  const response = await fetch(`${baseUrl}/api/corrigir`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto: 'Texto curto.', linhasVisuais: 1 }) });
  const data = await response.json();
  assert.equal(response.status, 400);
  assert.match(data.erro, /pelo menos 8 linhas/);
  assert.equal(data.resultado, undefined);
});

test('signup refuses missing terms or AI consent and sends document versions', async () => {
  let received;
  const fields = { nome: { value: 'Ana' }, email: { value: 'ana@example.com' }, senha: { value: 'long-password' }, termos: { checked: false }, consentimento: { checked: true }, 'signup-button': {}, 'signup-message': {} };
  const context = { window: { location: { origin: 'https://example.com' }, supabaseClient: { auth: { signUp: async input => { received = input; return { data: {}, error: null }; } } } }, document: { getElementById: id => fields[id] } };
  vm.runInNewContext(fs.readFileSync('frontend/scripts/cadastro.js', 'utf8'), context);
  await context.window.cadastrar();
  assert.equal(received, undefined);
  assert.match(fields['signup-message'].textContent, /Termos/);
  fields.termos.checked = true;
  fields.consentimento.checked = false;
  await context.window.cadastrar();
  assert.equal(received, undefined);
  fields.consentimento.checked = true;
  await context.window.cadastrar();
  assert.equal(received.options.data.terms_version, '2026-10-30');
  assert.equal(received.options.data.privacy_version, '2026-10-30');
  assert.equal(received.options.data.ai_consent, true);
  assert.equal(received.options.emailRedirectTo, undefined);
});

test('histórico local responde sem erro', async () => {
  const response = await fetch(`${baseUrl}/api/redacoes`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { redacoes: [] });
});

test('rejeita imagem inválida', async () => {
  const response = await fetch(`${baseUrl}/api/corrigir-foto`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imagem: 'invalida' }) });
  assert.equal(response.status, 400);
});

test('signup does not send confirmation email while remote confirmation is still enabled', async () => {
  let calls = 0;
  const fields = { nome: { value: 'Ana' }, email: { value: 'ana@example.com' }, senha: { value: 'long-password' }, termos: { checked: true }, consentimento: { checked: true }, 'signup-button': {}, 'signup-message': {} };
  const context = { window: { checkSignupConfiguration: async () => { throw new Error('Confirmação ainda habilitada no provedor.'); }, supabaseClient: { auth: { signUp: async () => { calls++; } } } }, document: { getElementById: id => fields[id] } };
  vm.runInNewContext(fs.readFileSync('frontend/scripts/cadastro.js', 'utf8'), context);
  await context.window.cadastrar();
  assert.equal(calls, 0);
  assert.match(fields['signup-message'].textContent, /Confirmação ainda habilitada/);
  assert.equal(fields['signup-button'].disabled, false);
});

test('paused password recovery shows support and never requests an email', async () => {
  let calls = 0;
  const fields = Object.fromEntries(['recovery-message', 'recovery-request', 'recovery-reset', 'recovery-support', 'email-recuperacao', 'nova-senha', 'confirmar-senha', 'recovery-title', 'recovery-button'].map(id => [id, {}]));
  const context = {
    window: { emailRecoveryEnabled: false, addEventListener() {}, supabaseClient: { auth: { resetPasswordForEmail: async () => { calls++; } } } },
    document: { getElementById: id => fields[id] },
    sessionStorage: { getItem: () => null }, URLSearchParams, location: { hash: '' }
    ,setTimeout, clearTimeout
  };
  vm.runInNewContext(fs.readFileSync('frontend/scripts/recuperar.js', 'utf8'), context);
  context.updateRecoveryForm();
  assert.equal(fields['recovery-request'].hidden, true);
  assert.equal(fields['recovery-support'].hidden, false);
  assert.equal(fields['email-recuperacao'].required, false);
  await context.recuperarSenha();
  assert.equal(calls, 0);
  assert.match(fields['recovery-message'].textContent, /pausada/);
});
