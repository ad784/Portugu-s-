const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cacheDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'portugues-photo-test-'));
process.env.CORRECTION_CACHE_DIR = cacheDirectory;
test.after(() => fs.rmSync(cacheDirectory, { recursive: true, force: true }));
const { parsePhotoDataUrl, formatPhotoCorrection, analyzePhoto } = require("../backend/services/photo-correction");
const { createPhotoRouter } = require("../backend/routes/photo");

const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(128, 1), Buffer.from([0xff, 0xd9])]);
const image = `data:image/jpeg;base64,${jpeg.toString("base64")}`;
const modelText = [
  "Competências:",
  "C1: 200 – domínio da norma padrão.",
  "C2: 160 – repertório produtivo.",
  "C3: 120 – argumentos pouco desenvolvidos.",
  "C4: 160 – boa articulação.",
  "C5: 120 – proposta sem detalhamento suficiente.",
  "Erros:", "- Há desvios pontuais.",
  "Sugestões:", "- Explique melhor a proposta.",
  "Redação transcrita:",
  "A sociedade brasileira enfrenta desafios importantes. As políticas públicas precisam ampliar o acesso à educação e garantir oportunidades para toda a população.",
].join("\n");

test("accepts a supported image and rejects MIME spoofing", () => {
  assert.equal(parsePhotoDataUrl(image).mime, "image/jpeg");
  assert.throws(() => parsePhotoDataUrl(image.replace("image/jpeg", "image/png")), /nao corresponde/i);
});

test("reads accented headings and recalculates the total from five competencies", () => {
  const result = formatPhotoCorrection(modelText);
  assert.ok(result);
  assert.match(result, /^Nota: 760/m);
  assert.match(result, /Redacao:\nA sociedade brasileira/);
  assert.match(result, /5: 120 - proposta sem detalhamento suficiente/i);
});

test("removes consecutive repeated phrases from the photo transcript", () => {
  const loop = "priorizando o gasto público em cada setor, ".repeat(8);
  const response = modelText.replace(
    "A sociedade brasileira enfrenta desafios importantes.",
    `A sociedade brasileira enfrenta desafios importantes. ${loop}O texto continua aqui.`
  );
  const result = formatPhotoCorrection(response);
  const transcript = result.split(/\nRedacao:\n/i)[1];
  assert.equal((transcript.match(/priorizando o gasto público em cada setor/gi) || []).length, 1);
  assert.match(transcript, /O texto continua aqui\./);
});

test("sends the image to the configured vision model and returns its transcription", async () => {
  let request;
  const result = await analyzePhoto({
    image,
    apiKey: "test-key",
    fetchImpl: async (_url, options) => {
      request = JSON.parse(options.body);
      return { ok: true, json: async () => ({ choices: [{ message: { content: modelText } }] }) };
    },
  });
  assert.equal(request.model, "qwen/qwen3.8-27b");
  assert.equal(request.max_completion_tokens, 3000);
  assert.equal(request.messages.find(message => message.role === 'user').content[1].image_url.url, image);
  assert.match(result.result, /^Nota: 760/m);
});

test('photo rate limit exposes provider wait time and preserves readable Portuguese', async () => {
  let calls = 0;
  await assert.rejects(analyzePhoto({ image, apiKey: 'test-key', fetchImpl: async () => {
    calls++;
    return { ok: false, status: 429, headers: { get: () => '95' }, json: async () => ({ error: { message: 'Rate limit: tokens per day (TPD)' } }) };
  } }), error => {
    assert.equal(error.status, 429);
    assert.equal(error.retryAfterSeconds, 95);
    assert.match(error.message, /cota diária/);
    assert.match(error.message, /2 minutos/);
    assert.ok(!error.message.includes('?'));
    return true;
  });
  assert.equal(calls, 1);
});

test('photo retries strict schema failure once using JSON mode', async () => {
  const formats = [];
  const result = await analyzePhoto({ image, apiKey: 'test-key', fetchImpl: async (_url, options) => {
    formats.push(JSON.parse(options.body).response_format.type);
    if (formats.length === 1) return { ok: false, status: 400, json: async () => ({ error: { code: 'json_validate_failed' } }) };
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: modelText } }] }) };
  } });
  assert.deepEqual(formats, ['json_schema', 'json_object']);
  assert.match(result.result, /^Nota: 760/);
});

test('oversized photo request does not claim waiting one minute will fix it', async () => {
  let calls = 0;
  await assert.rejects(analyzePhoto({ image, apiKey: 'test-key', fetchImpl: async () => {
    calls++;
    return { ok: false, status: 429, json: async () => ({ error: {
      message: 'Request too large for model: tokens per minute (TPM): Limit 8000, Requested 9200. Please reduce your message size.'
    } }) };
  } }), error => error.status === 503 && !error.retryAfterSeconds && /Aguardar um minuto pode não resolver/.test(error.message));
  assert.equal(calls, 1);
});

test('new accounts see shared capacity warning and provider reset instead of guessed minute', async () => {
  await assert.rejects(analyzePhoto({ image, apiKey: 'test-key', fetchImpl: async () => ({
    ok: false, status: 429, headers: { get: name => name === 'x-ratelimit-reset-tokens' ? '12.5s' : null },
    json: async () => ({ error: { message: 'Rate limit reached: tokens per minute (TPM), Limit 8000, Used 5000, Requested 4000' } })
  }) }), error => error.status === 429 && error.retryAfterSeconds === 13 && /compartilhado/.test(error.message));
});

test('photo rejects provider image errors without retrying or claiming an outage', async () => {
  let calls = 0;
  await assert.rejects(analyzePhoto({ image, apiKey: 'test-key', fetchImpl: async () => {
    calls++;
    return { ok: false, status: 400, json: async () => ({ error: { message: 'invalid image data' } }) };
  } }), error => error.status === 400 && /outra foto/.test(error.message));
  assert.equal(calls, 1);
});

test("photo endpoint saves the image, transcript and correction before returning success", async (t) => {
  let savedRecord, uploaded = false;
  const app = express();
  app.use(express.json());
  app.use(createPhotoRouter({
    apiKey: "test-key",
    requireSupabaseUser: (req, _res, next) => {
      req.supabaseUser = { id: "student-1" };
      req.supabase = { storage: { from: () => ({ remove: async () => ({ error: null }) }) } };
      next();
    },
    analyze: async () => ({ result: formatPhotoCorrection(modelText) }),
    upload: async (userId) => { uploaded = userId === "student-1"; return "student-1/photo.jpg"; },
    saveCorrection: async (_req, record) => { savedRecord = record; return { ok: true, id: "essay-1" }; },
  }));
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/corrigir-foto`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imagem: image }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.salvo, true);
  assert.equal(uploaded, true);
  assert.equal(savedRecord.tipo, "foto");
  assert.equal(savedRecord.imagemPath, "student-1/photo.jpg");
  assert.match(savedRecord.conteudo, /^A sociedade brasileira/);
});

test("keeps the photo correction available when Storage policy is not installed yet", async (t) => {
  let savedRecord;
  const app = express();
  app.use(express.json());
  app.use(createPhotoRouter({
    apiKey: "test-key",
    requireSupabaseUser: (req, _res, next) => { req.supabaseUser = { id: "student-1" }; next(); },
    analyze: async () => ({ result: formatPhotoCorrection(modelText) }),
    upload: async () => { throw new Error("new row violates row-level security policy"); },
    saveCorrection: async (_req, record) => { savedRecord = record; return { ok: true, id: "essay-2" }; },
  }));
  const server = await new Promise((resolve) => { const listener = app.listen(0, () => resolve(listener)); });
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/corrigir-foto`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imagem: image }),
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.salvo, true);
  assert.match(body.aviso, /imagem n.o p.de ser armazenada/i);
  assert.equal(savedRecord.imagemPath, null);
  assert.match(savedRecord.conteudo, /^A sociedade brasileira/);
});
