const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup({ status = 503, error = 'Serviço temporariamente indisponível.', retry = null } = {}) {
  const fields = Object.fromEntries(['camera', 'snapshot', 'salvar-foto', 'foto-status', 'camera-status', 'reset-photo', 'take-photo', 'foto-arquivo', 'foto-tema', 'back-to-editor'].map(id => [id, { value: '', dataset: {}, style: {}, addEventListener() {}, setAttribute() {}, classList: { toggle() {} }, lastChild: {} }]));
  fields.snapshot.style.display = 'block';
  fields.snapshot.getContext = () => ({ setTransform() {}, clearRect() {}, drawImage() {} });
  fields.snapshot.toDataURL = () => 'data:image/jpeg;base64,test-photo';
  const storage = new Map(); let requests = 0;
  const context = { document: { getElementById: id => fields[id] }, navigator: {}, console: { error() {}, warn() {} }, setTimeout: () => 1, clearTimeout() {},
    window: {
      location: {}, addEventListener() {},
      userStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
      portuguesSession: { request: async () => { requests++; return { status, ok: false, text: async () => JSON.stringify({ erro: error, retryAfterSeconds: retry }) }; } }
    }
  };
  vm.runInNewContext(fs.readFileSync('frontend/scripts/foto.js', 'utf8'), context);
  return { context, fields, storage, requests: () => requests };
}

test('photo service failure preserves the photo and restores controls for another attempt', async () => {
  const env = setup();
  await env.context.salvarFoto();
  assert.equal(env.storage.get('rascunho-foto-v1'), 'data:image/jpeg;base64,test-photo');
  assert.equal(env.fields.snapshot.style.display, 'block');
  assert.match(env.fields['foto-status'].textContent, /foto foi mantida/);
  assert.equal(env.fields['salvar-foto'].disabled, false);
  assert.equal(env.fields['foto-arquivo'].disabled, false);
});

test('photo rate limit preserves the draft and blocks resend until the cooldown expires', async () => {
  const env = setup({ status: 429, retry: 120 });
  await env.context.salvarFoto();
  assert.equal(env.fields['salvar-foto'].disabled, true);
  assert.match(env.fields['salvar-foto'].textContent, /Aguarde/);
  await env.context.salvarFoto();
  assert.equal(env.requests(), 1);
  assert.ok(env.storage.has('rascunho-foto-v1'));
});
