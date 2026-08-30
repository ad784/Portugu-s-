const test = require('node:test');
const assert = require('node:assert/strict');

process.env.LOCAL_DEMO_AUTH = 'true';
const app = require('../backend/server');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => { server = app.listen(0, () => { baseUrl = `http://127.0.0.1:${server.address().port}`; resolve(); }); });
});

test.after(async () => new Promise((resolve) => server.close(resolve)));

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
