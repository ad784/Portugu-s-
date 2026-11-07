const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup({ status = 503, error = 'Serviço temporariamente indisponível.', retry = null } = {}) {
  const fields = Object.fromEntries(['camera', 'snapshot', 'salvar-foto', 'foto-status', 'camera-status', 'reset-photo', 'take-photo', 'toggle-flash', 'flash-status', 'foto-arquivo', 'foto-tema', 'back-to-editor'].map(id => [id, { value: '', dataset: {}, style: {}, addEventListener() {}, setAttribute(name, value) { this[name] = value; }, classList: { toggle() {} }, lastChild: {} }]));
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

async function cameraSetup({ supported = true, fail = false, deferred = false } = {}) {
  const env = setup();
  let torch = false, stopped = false, finish;
  const calls = [];
  const track = {
    getCapabilities: () => ({ torch: supported }),
    getSettings: () => ({ torch }),
    getConstraints: () => ({ width: { ideal: 1080 } }),
    applyConstraints: async constraints => {
      calls.push(constraints);
      if (fail) throw new Error('device refused');
      if (deferred) await new Promise(resolve => { finish = resolve; });
      if (!stopped) torch = constraints.advanced[0].torch;
    },
    stop: () => { stopped = true; torch = false; }
  };
  env.context.navigator.mediaDevices = { getUserMedia: async () => ({ getVideoTracks: () => [track], getTracks: () => [track] }) };
  env.fields.camera.play = async () => {};
  env.fields.camera.videoWidth = 1080;
  env.fields.camera.videoHeight = 1440;
  await env.context.initCamera();
  return { ...env, calls, torch: () => torch, stopped: () => stopped, finish: () => finish() };
}

test('flash toggles on/off without changing framing and shuts down after capture', async () => {
  const env = await cameraSetup();
  assert.equal(env.fields['toggle-flash'].disabled, false);
  await env.context.toggleFlash();
  assert.equal(env.torch(), true);
  assert.equal(env.fields['toggle-flash']['aria-pressed'], 'true');
  assert.equal(env.calls[0].width.ideal, 1080);
  await env.context.toggleFlash();
  assert.equal(env.torch(), false);
  await env.context.toggleFlash();
  env.context.takePhoto();
  assert.equal(env.stopped(), true);
  assert.equal(env.torch(), false);
  assert.equal(env.fields['toggle-flash'].disabled, true);
  assert.equal(env.fields['toggle-flash']['aria-pressed'], 'false');
  assert.ok(env.storage.has('rascunho-foto-v1'));
});

test('unsupported flash remains disabled while camera still captures', async () => {
  const env = await cameraSetup({ supported: false });
  assert.equal(env.fields['toggle-flash'].disabled, true);
  assert.match(env.fields['flash-status'].textContent, /não permite/);
  await env.context.toggleFlash();
  assert.equal(env.calls.length, 0);
  env.context.takePhoto();
  assert.equal(env.fields.snapshot.style.display, 'block');
});

test('failed flash change restores controls without claiming the light is on', async () => {
  const env = await cameraSetup({ fail: true });
  await env.context.toggleFlash();
  assert.equal(env.fields['toggle-flash'].disabled, false);
  assert.equal(env.fields['toggle-flash']['aria-pressed'], 'false');
  assert.match(env.fields['flash-status'].textContent, /Não foi possível/);
});

test('late flash response cannot turn captured-photo controls back on', async () => {
  const env = await cameraSetup({ deferred: true });
  const toggle = env.context.toggleFlash();
  await env.context.toggleFlash();
  assert.equal(env.calls.length, 1, 'rapid clicks do not duplicate hardware requests');
  env.context.takePhoto();
  env.finish();
  await toggle;
  assert.equal(env.torch(), false);
  assert.equal(env.fields['toggle-flash'].disabled, true);
  assert.equal(env.fields['toggle-flash']['aria-pressed'], 'false');
});
