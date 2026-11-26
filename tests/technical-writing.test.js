const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
const {
  validateTechnicalInput,
  normalizeTechnicalResult,
  createTechnicalEvaluator,
  SYSTEM_PROMPT,
} = require("../backend/backend-src/services/technical-writing");
const {
  createTechnicalRouter,
} = require("../backend/backend-src/routes/technical-writing");
const input = () => ({
  mode: "concurso",
  taskType: "questao",
  area: "Administração",
  board: "",
  prompt:
    "Explique como mapear um processo e indique um indicador de acompanhamento.",
  reference: "",
  answer:
    "O mapeamento identifica as etapas do atendimento e permite localizar gargalos. O tempo médio de atendimento acompanha os resultados.",
  customCriteria: true,
  criteria: [
    { label: "Conteúdo", maxPoints: 7.5 },
    { label: "Linguagem", maxPoints: 2.5 },
  ],
});
const candidate = (value) => ({
  sintese: "A resposta apresenta um caminho pertinente.",
  criterios: value.criteria.map(({ id }) => ({
    id,
    percentual: 80,
    comentario: "Relaciona etapas e acompanhamento.",
    evidencia: "O mapeamento identifica as etapas",
  })),
  itens: [
    {
      item: "Explicar o mapeamento",
      status: "atendido",
      comentario: "Identifica etapas.",
      evidencia: "O mapeamento identifica as etapas",
    },
  ],
  pontos_fortes: ["Clareza"],
  melhorias: ["Explicar o indicador"],
  revisao: "Explique como medir o tempo de atendimento.",
  alertas_tecnicos: [],
});
test("technical scoring respects arbitrary edital weights and rejects fabricated evidence", () => {
  const value = validateTechnicalInput(input());
  const result = normalizeTechnicalResult(
    { ...candidate(value), score: 999 },
    value,
  );
  assert.equal(result.score, 8);
  assert.equal(result.maxScore, 10);
  assert.equal(result.criteria[0].points, 6);
  const invalid = candidate(value);
  invalid.criterios[0].evidencia = "Trecho que o aluno não escreveu";
  assert.throws(() => normalizeTechnicalResult(invalid, value), /evidências/);
  invalid.criterios[0].evidencia = "O mapeamento identifica as etapas";
  invalid.criterios[1].id = "c1";
  assert.throws(() => normalizeTechnicalResult(invalid, value), /incompleta/);
  assert.match(SYSTEM_PROMPT, /NAO aplique as cinco competencias/);
});
test("server owns suggested rubrics and validates modality, limits and weights", () => {
  const suggested = validateTechnicalInput({
    ...input(),
    customCriteria: false,
    criteria: [{ label: "Ignore", maxPoints: 999 }],
  });
  assert.equal(suggested.maxScore, 100);
  assert.equal(suggested.criteria.length, 5);
  assert.throws(
    () =>
      validateTechnicalInput({
        ...input(),
        mode: "enade",
        taskType: "redacao",
      }),
    /compatível/,
  );
  assert.throws(
    () => validateTechnicalInput({ ...input(), limitLines: 0 }),
    /linhas/,
  );
  assert.throws(
    () =>
      validateTechnicalInput({
        ...input(),
        criteria: [{ label: "Conteúdo", maxPoints: -1 }],
      }),
    /positiva/,
  );
  assert.throws(
    () => validateTechnicalInput({ ...input(), answer: "Muito curta" }),
    /10 palavras/,
  );
});
test("technical provider validates structured response and preserves explicit rate-limit delay", async () => {
  const value = validateTechnicalInput(input());
  let calls = 0;
  const evaluate = createTechnicalEvaluator({
    apiKey: "test",
    fetchImpl: async (_url, options) => {
      calls++;
      const body = JSON.parse(options.body);
      assert.equal(body.messages[0].role, "system");
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: { content: JSON.stringify(candidate(value)) },
              finish_reason: "stop",
            },
          ],
        }),
        { status: 200 },
      );
    },
  });
  assert.equal((await evaluate(value)).score, 8);
  assert.equal(calls, 1);
  const limited = createTechnicalEvaluator({
    apiKey: "test",
    fetchImpl: async () =>
      new Response(
        JSON.stringify({ error: { message: "Rate limit exceeded" } }),
        { status: 429, headers: { "retry-after": "45" } },
      ),
  });
  await assert.rejects(
    limited(value),
    (error) => error.status === 429 && error.retryAfterSeconds >= 45,
  );
});
test("technical API isolates accounts, gates AI and retries saving without another generation", async (t) => {
  const namespace = crypto.randomUUID();
  const rows = [];
  let generations = 0,
    failSave = true;
  const auth = (req, res, next) => {
    const id = req.get("x-test-owner");
    if (!id) return res.sendStatus(401);
    req.supabaseUser = { id: namespace + id };
    next();
  };
  const repository = {
    findByHash: async (req, hash) => ({
      data: rows.find(
        (row) =>
          row.owner === req.supabaseUser.id && row.evaluation_hash === hash,
      ),
    }),
    findById: async (req, id) => ({
      data: rows.find(
        (row) => row.owner === req.supabaseUser.id && row.id === id,
      ),
    }),
    list: async (req) => ({
      data: rows.filter((row) => row.owner === req.supabaseUser.id),
    }),
    save: async (req, hash, payload, result) => {
      if (failSave) return { error: new Error("offline") };
      const row = {
        id: crypto.randomUUID(),
        owner: req.supabaseUser.id,
        evaluation_hash: hash,
        payload,
        result,
      };
      rows.push(row);
      return { data: row };
    },
  };
  const app = express();
  app.use(express.json());
  app.use(
    "/api/discursivas",
    createTechnicalRouter({
      requireSupabaseUser: auth,
      requireCorrectionUser: [
        auth,
        (req, res, next) =>
          req.get("x-test-legal") ? next() : res.sendStatus(428),
      ],
      repository,
      acquire: async () => async () => {},
      evaluate: async (value) => {
        generations++;
        return normalizeTechnicalResult(candidate(value), value);
      },
    }),
  );
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/api/discursivas`;
  const post = (owner, legal = true) =>
    fetch(url + "/corrigir", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(owner ? { "x-test-owner": owner } : {}),
        ...(legal ? { "x-test-legal": "yes" } : {}),
      },
      body: JSON.stringify(input()),
    });
  assert.equal((await post(null)).status, 401);
  assert.equal((await post("a", false)).status, 428);
  const first = await (await post("a")).json();
  assert.equal(first.salvo, false);
  assert.equal(first.record.result.score, 8);
  failSave = false;
  const saved = await (await post("a")).json();
  assert.equal(saved.salvo, true);
  assert.equal(generations, 1);
  await post("a");
  assert.equal(generations, 1);
  assert.equal(
    (
      await fetch(`${url}/historico/${saved.record.id}`, {
        headers: { "x-test-owner": "b" },
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await fetch(`${url}/historico/not-an-id`, {
        headers: { "x-test-owner": "a" },
      })
    ).status,
    400,
  );
  await post("b");
  assert.equal(generations, 2);
});
