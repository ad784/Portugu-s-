const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup({ status = 503, error = 'Serviço temporariamente indisponível.', retry = null, sequence } = {}) {
  const fields = Object.fromEntries(['camera', 'snapshot', 'salvar-foto', 'foto-status', 'camera-status', 'reset-photo', 'take-photo', 'foto-arquivo', 'back-to-editor', 'cancel-photo-wait'].map(id => [id, { value: '', dataset: {}, style: {}, events: {}, click() { this.clicked = true; }, addEventListener(name, handler) { this.events[name] = handler; }, setAttribute(name, value) { this[name] = value; }, classList: { toggle() {} }, lastChild: {} }]));
  fields.snapshot.style.display = 'block';
  fields.snapshot.getContext = () => ({ setTransform() {}, clearRect() {}, drawImage() {} });
  fields.snapshot.toDataURL = () => 'data:image/jpeg;base64,test-photo';
  const storage = new Map(); let requests = 0;
  const listeners = {};
  const context = { document: { getElementById: id => fields[id] }, navigator: {}, console: { error() {}, warn() {} }, setTimeout: () => 1, clearTimeout() {},
    window: {
      location: {}, addEventListener(name, handler) { listeners[name] = handler; },
      userStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
      portuguesSession: { request: async () => {
        const entry = sequence ? sequence[Math.min(requests, sequence.length - 1)] : { status, erro: error, retryAfterSeconds: retry };
        requests++;
        return { status: entry.status, ok: entry.status === 200, text: async () => JSON.stringify(entry) };
      } }
    }
  };
  vm.runInNewContext(fs.readFileSync('frontend/scripts/foto.js', 'utf8'), context);
  return { context, fields, storage, listeners, requests: () => requests };
}

test('photo page initializes without a theme input or stale theme restoration', () => {
  const env = setup();
  env.storage.set('tema-foto', 'Tema antigo');
  assert.doesNotThrow(() => env.listeners.DOMContentLoaded());
  assert.match(env.fields['foto-status'].textContent, /câmera não está disponível/);
});

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

const busy = { status: 429, codigo: 'PHOTO_PROVIDER_BUSY', retryAfterSeconds: 12, erro: 'Capacidade ocupada.' };

test('temporary provider saturation waits and automatically completes the original photo', async () => {
  const env = setup({ sequence: [busy, { status: 200, resultado: 'Nota: 760\nRedacao:\nTexto original', salvo: true }] });
  const waits = [];
  env.context.waitForPhotoCapacity = async seconds => {
    waits.push(seconds);
    assert.equal(env.fields['salvar-foto'].disabled, true);
    assert.ok(env.storage.has('rascunho-foto-v1'));
  };
  await env.context.salvarFoto();
  assert.equal(env.requests(), 2);
  assert.equal(waits.length, 1);
  assert.ok(waits[0] >= 13 && waits[0] <= 16);
  assert.match(env.storage.get('resultado'), /Nota: 760/);
  assert.equal(env.context.window.location.href, '/resultado');
});

test('automatic waits are bounded and never retry daily or oversized requests', async () => {
  for (const response of [
    { status: 429, codigo: 'PHOTO_DAILY_LIMIT', retryAfterSeconds: 60 },
    { status: 503, codigo: 'PHOTO_REQUEST_TOO_LARGE' },
    { status: 429, codigo: 'PHOTO_PROVIDER_BUSY', retryAfterSeconds: 400 }
  ]) {
    const env = setup({ sequence: [response] });
    env.context.waitForPhotoCapacity = async () => assert.fail('must not wait');
    await env.context.requestPhotoWithWait({});
    assert.equal(env.requests(), 1);
  }
  const env = setup({ sequence: [busy] });
  env.context.waitForPhotoCapacity = async () => {};
  await env.context.requestPhotoWithWait({});
  assert.equal(env.requests(), 7, 'initial request plus at most six automatic retries');
});

test('changing account during automatic waiting prevents resending the photo', async () => {
  const env = setup({ sequence: [busy] });
  let owner = 'original';
  env.context.window.portuguesSession.userId = () => owner;
  env.context.waitForPhotoCapacity = async () => { owner = 'another'; };
  await env.context.salvarFoto();
  assert.equal(env.requests(), 1);
  assert.match(env.fields['foto-status'].textContent, /conta mudou/);
  assert.equal(env.storage.has('resultado'), false);
});

test('cancelling automatic waiting preserves photo and makes no further request', async () => {
  const env = setup({ sequence: [busy] });
  env.context.waitForPhotoCapacity = async () => env.fields['cancel-photo-wait'].events.click();
  await env.context.salvarFoto();
  assert.equal(env.requests(), 1);
  assert.ok(env.storage.has('rascunho-foto-v1'));
  assert.match(env.fields['foto-status'].textContent, /Espera cancelada/);
  assert.equal(env.fields['salvar-foto'].disabled, false);
});

test('three simultaneous evaluators recover from temporary capacity rejections', async () => {
  let active = false;
  let rejections = 0;
  const evaluators = Array.from({ length: 3 }, () => setup());
  for (const env of evaluators) {
    env.context.waitForPhotoCapacity = async () => new Promise(resolve => setImmediate(resolve));
    env.context.window.portuguesSession.request = async () => {
      if (active) {
        rejections++;
        return { status: 429, ok: false, text: async () => JSON.stringify(busy) };
      }
      active = true;
      await new Promise(resolve => setImmediate(resolve));
      active = false;
      return { status: 200, ok: true, text: async () => JSON.stringify({ resultado: 'Nota: 760', salvo: true }) };
    };
  }
  await Promise.all(evaluators.map(env => env.context.salvarFoto()));
  assert.ok(rejections >= 2);
  evaluators.forEach(env => {
    assert.equal(env.storage.get('resultado'), 'Nota: 760');
    assert.equal(env.context.window.location.href, '/resultado');
  });
});

test('provider 503 recovers automatically but configuration failures are never repeated', async () => {
  const env = setup({ sequence: [
    { status: 503, codigo: 'PHOTO_PROVIDER_UNAVAILABLE', retryAfterSeconds: 15 },
    { status: 200, resultado: 'Nota: 760', salvo: true }
  ] });
  env.context.waitForPhotoCapacity = async () => {};
  await env.context.salvarFoto();
  assert.equal(env.requests(), 2);
  assert.equal(env.storage.get('resultado'), 'Nota: 760');
  for (const codigo of ['PHOTO_PROVIDER_AUTH', 'PHOTO_PROVIDER_MODEL']) {
    const broken = setup({ sequence: [{ status: 503, codigo }] });
    broken.context.waitForPhotoCapacity = async () => assert.fail('configuration failure must not be retried');
    await broken.context.salvarFoto();
    assert.equal(broken.requests(), 1);
  }
});
