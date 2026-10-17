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

test('blocks signup while Supabase auto-confirms unverified email addresses', async () => {
  const message = { textContent: '', className: '' };
  const button = { disabled: false, textContent: '', innerHTML: 'Criar conta' };
  const fields = {
    nome: { value: 'Ana' },
    email: { value: 'ana@example.com' },
    senha: { value: 'a-long-test-password' },
    consentimento: { checked: true },
    'signup-button': button,
    'signup-message': message
  };
  let signupCalls = 0;
  const context = {
    window: {
      supabaseAuthSettingsUrl: 'https://supabase.test/auth/v1/settings',
      supabasePublishableKey: 'public-test-key',
      supabaseClient: { auth: { signUp: async () => { signupCalls += 1; return { data: {}, error: null }; } } }
    },
    document: { getElementById: (id) => fields[id] },
    fetch: async () => ({ ok: true, json: async () => ({ mailer_autoconfirm: true }) })
  };
  vm.runInNewContext(fs.readFileSync('frontend/scripts/cadastro.js', 'utf8'), context);
  await context.window.cadastrar();

  assert.equal(signupCalls, 0);
  assert.match(message.textContent, /Cadastro pausado/);
  assert.equal(button.disabled, false);
});

test('recusa redação com menos de 10 linhas', async () => {
  const response = await fetch(`${baseUrl}/api/corrigir`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto: 'Texto curto.', linhasVisuais: 1 }) });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.match(data.resultado, /^Nota: 0/m);
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
