const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const directory = fs.mkdtempSync(
  path.join(os.tmpdir(), "portugues-google-test-"),
);
process.env.CORRECTION_CACHE_DIR = path.join(directory, "cache");
process.env.GROQ_METRICS_DIR = path.join(directory, "metrics");
const {
  readGooglePhoto,
  analyzeGooglePhoto,
} = require("../backend/services/google-photo");
const {
  photoConfig,
  legalVersions,
} = require("../backend/services/photo-config");
const { isAccepted } = require("../backend/routes/legal");
const { PROMPT_CORRECAO_ENEM } = require("../backend/services/essay-storage");
const image =
  "data:image/jpeg;base64," +
  Buffer.from([255, 216, 1, 2, 255, 217]).toString("base64");
const text = Array(8)
  .fill(
    "A educação brasileira exige políticas públicas consistentes e formação adequada para ampliar o acesso de todos os cidadãos.",
  )
  .join("\n");
const correction = {
  nota_final: 800,
  justificativa_nota: "Avaliação dos critérios.",
  competencias: Array.from({ length: 5 }, (_, i) => ({
    competencia: i + 1,
    nota: 160,
    comentario: "Comentário da competência " + (i + 1),
    requisitos: [],
  })),
  erros: [],
  sugestoes: ["Desenvolva os argumentos."],
};
const ok = (data) => ({ status: 200, ok: true, json: async () => data });
test.after(() => fs.rmSync(directory, { recursive: true, force: true }));

test("Google OCR uses the document reader and a server-only key header", async () => {
  let request;
  const transcript = await readGooglePhoto({
    image,
    googleApiKey: "secret-google-test",
    fetchImpl: async (url, options) => {
      assert.equal(url, "https://vision.googleapis.com/v1/images:annotate");
      assert.equal(options.headers["X-Goog-Api-Key"], "secret-google-test");
      request = JSON.parse(options.body);
      return ok({ responses: [{ fullTextAnnotation: { text } }] });
    },
  });
  assert.equal(request.requests[0].features[0].type, "DOCUMENT_TEXT_DETECTION");
  assert.equal(request.requests[0].imageContext.languageHints[0], "pt");
  assert.equal(transcript, text);
});

test("OCR errors inside HTTP 200 and empty images never reach grading", async () => {
  for (const data of [
    { responses: [{ error: { code: 7, message: "private provider detail" } }] },
    { responses: [{}] },
  ]) {
    let graded = false;
    await assert.rejects(
      analyzeGooglePhoto({
        image,
        apiKey: "groq-test",
        googleApiKey: "google-test",
        fetchImpl: async () => ok(data),
        evaluate: async () => {
          graded = true;
        },
      }),
    );
    assert.equal(graded, false);
  }
});

test("missing Google key fails clearly without any network request", async () => {
  let calls = 0;
  await assert.rejects(
    readGooglePhoto({
      image,
      fetchImpl: async () => {
        calls++;
      },
    }),
    /precisa ser configurada/,
  );
  assert.equal(calls, 0);
});

test("grading retry reuses OCR for the same account without mixing other accounts", async () => {
  let reads = 0,
    grades = 0;
  const input = {
    image,
    apiKey: "groq-test",
    googleApiKey: "google-test",
    userId: "original",
    fetchImpl: async () => {
      reads++;
      return ok({ responses: [{ fullTextAnnotation: { text } }] });
    },
    evaluate: async () => {
      grades++;
      if (grades === 1) {
        const error = new Error("limite de uso");
        error.status = 429;
        error.retryAfterSeconds = 12;
        throw error;
      }
      return { notaFinal: 800, competencias: correction.competencias };
    },
  };
  await assert.rejects(
    analyzeGooglePhoto(input),
    (error) => error.code === "PHOTO_PROVIDER_BUSY",
  );
  const result = await analyzeGooglePhoto(input);
  assert.match(result.result, /^Nota: 800/);
  assert.ok(result.result.endsWith(text));
  assert.equal(reads, 1);
  await analyzeGooglePhoto({ ...input, userId: "another" });
  assert.equal(reads, 2);
});

test("full pipeline sends only extracted text to the existing Groq text evaluator", async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    calls.push({ url, body });
    if (url.startsWith("https://vision.googleapis.com/"))
      return ok({ responses: [{ fullTextAnnotation: { text } }] });
    return ok({
      choices: [
        {
          message: { content: JSON.stringify(correction) },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 100, total_tokens: 200 },
    });
  };
  try {
    const result = await analyzeGooglePhoto({
      image,
      apiKey: "groq-test",
      googleApiKey: "google-test",
      userId: "pipeline",
    });
    assert.equal(calls.length, 2);
    const payload = calls[1].body;
    assert.equal(payload.model, "openai/gpt-oss-120b");
    assert.equal(payload.messages[0].content, PROMPT_CORRECAO_ENEM);
    assert.ok(payload.messages[1].content.includes(text));
    assert.doesNotMatch(JSON.stringify(payload), /image_url|qwen|data:image/);
    assert.match(result.result, /^Nota: 800/);
    for (let i = 1; i <= 5; i++)
      assert.ok(
        result.result.includes(`${i}: 160 - Comentário da competência ${i}`),
      );
  } finally {
    global.fetch = originalFetch;
  }
});

test("Google activation requires updated privacy without changing existing Groq acceptance", () => {
  const previous = {
    reader: process.env.PHOTO_READER,
    key: process.env.GOOGLE_VISION_API_KEY,
  };
  const receipt = {
    terms_version: "2026-10-30",
    privacy_version: "2026-10-30",
    ai_consent: true,
  };
  try {
    delete process.env.PHOTO_READER;
    delete process.env.GOOGLE_VISION_API_KEY;
    assert.equal(photoConfig().provider, "groq");
    assert.equal(isAccepted(receipt), true);
    process.env.GOOGLE_VISION_API_KEY = "google-test";
    assert.equal(photoConfig().provider, "google");
    assert.equal(legalVersions().privacyVersion, "2026-11-08");
    assert.equal(isAccepted(receipt), false);
    assert.equal(
      isAccepted({ ...receipt, privacy_version: "2026-11-08" }),
      true,
    );
    process.env.PHOTO_READER = "groq";
    assert.equal(isAccepted(receipt), true);
  } finally {
    if (previous.reader === undefined) delete process.env.PHOTO_READER;
    else process.env.PHOTO_READER = previous.reader;
    if (previous.key === undefined) delete process.env.GOOGLE_VISION_API_KEY;
    else process.env.GOOGLE_VISION_API_KEY = previous.key;
  }
});

test("Google photo endpoint persists a photo correction with the extracted essay and same five comments", async (t) => {
  const express = require("express");
  const { createPhotoRouter } = require("../backend/routes/photo");
  const app = express();
  app.use(express.json());
  let saved;
  const calls = [];
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    if (String(url).startsWith("https://vision.googleapis.com/")) {
      calls.push("google");
      return ok({ responses: [{ fullTextAnnotation: { text } }] });
    }
    if (String(url).startsWith("https://api.groq.com/")) {
      calls.push(JSON.parse(options.body).model);
      return ok({
        choices: [
          {
            message: { content: JSON.stringify(correction) },
            finish_reason: "stop",
          },
        ],
      });
    }
    return originalFetch(url, options);
  };
  app.use(
    createPhotoRouter({
      provider: "google",
      googleApiKey: "google-test",
      apiKey: "groq-test",
      requireSupabaseUser: (req, _res, next) => {
        req.supabaseUser = { id: "route-google" };
        next();
      },
      upload: async () => "route-google/image.jpg",
      saveCorrection: async (_req, record) => {
        saved = record;
        return { ok: true, id: "saved-google" };
      },
    }),
  );
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  try {
    const response = await originalFetch(
      `http://127.0.0.1:${server.address().port}/api/corrigir-foto`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagem: image }),
      },
    );
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.salvo, true);
    assert.equal(saved.tipo, "foto");
    assert.equal(saved.conteudo, text);
    assert.equal(saved.imagemPath, "route-google/image.jpg");
    assert.deepEqual(calls, ["google", "openai/gpt-oss-120b"]);
    assert.match(data.resultado, /5: 160 - Comentário da competência 5/);
  } finally {
    global.fetch = originalFetch;
  }
});
