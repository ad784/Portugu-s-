process.env.CORRECTIONS_PER_MINUTE = '100';
process.env.CORRECTIONS_PER_DAY = '1000';
const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { createTextCorrectionRouter, normalizarCorrecao, correctionResponseFormat } = require("../backend/routes/text-correction");

const { REQUIREMENTS, enforceEvidence } = require("../backend/services/strict-rubric");
const evidence = Array(8).fill("Texto de evidencia para os testes da rubrica.").join("\n");
const proofs = number => [...REQUIREMENTS[number].base, ...REQUIREMENTS[number].top].map(criterio => ({
  criterio, atendido: true, evidencia: evidence,
  analise: "Analise especifica da evidencia relacionada ao requisito da competencia."
}));
const app = express();
app.use(express.json());

let groqCalls = 0;
let savedCorrections = 0;
const savedRecords = new Map();
const correction = {
  nota_final: 600,
  justificativa_nota: "A redação apresenta tese clara e estrutura organizada, mas limita o desenvolvimento dos argumentos e precisa detalhar a proposta.",
  competencias: [
    { competencia: 1, nota: 160, comentario: "Na introdução, a construção das frases mantém o registro formal, embora a avaliação deva observar desvios recorrentes no texto." },
    { competencia: 2, nota: 120, comentario: "O texto aborda o tema, mas apresenta argumentos genéricos sem aprofundar as causas ou consequências." },
    { competencia: 3, nota: 120, comentario: "O segundo argumento repete a ideia inicial e não explica como ela sustenta a tese." },
    { competencia: 4, nota: 120, comentario: "Os parágrafos estão ligados, mas os conectivos se repetem e pouco marcam a progressão das ideias." },
    { competencia: 5, nota: 120, comentario: "A conclusão propõe uma ação pertinente, mas não esclarece o meio de execução nem detalha o efeito esperado." }
  ],
  erros: [],
  sugestoes: ["Explique como cada argumento sustenta sua tese e detalhe a execução da proposta."]
};

correction.competencias.forEach(item => { item.requisitos = proofs(item.competencia); });

app.use(createTextCorrectionRouter({
  requireSupabaseUser: (req, _res, next) => {
    req.supabaseUser = { id: "student-1" };
    req.supabase = { from: () => ({ select: () => ({ eq: () => ({ eq: (_field, hash) => ({ maybeSingle: async () => ({ data: savedRecords.get(hash) || null, error: null }) }) }) }) }) };
    next();
  },
  saveCorrection: async (_req, record) => {
    savedCorrections += 1;
    savedRecords.set(record.avaliacaoHash, { id: record.avaliacaoHash, resultado: record.resultado });
    return { ok: true };
  },
  apiKey: "test-key",
  model: "test-model"
}));

let server;
let baseUrl;
test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => new Promise((resolve) => server.close(resolve)));

test("refaz a chamada quando a Groq devolve JSON incompleto e salva uma vez", async () => {
  const texto = evidence + " " + require("node:crypto").randomUUID();
  const realFetch = global.fetch;
  groqCalls = 0;
  savedCorrections = 0;
  global.fetch = async (url, options) => {
    if (url !== "https://api.groq.com/openai/v1/chat/completions") return realFetch(url, options);
    const payload = JSON.parse(options.body);
    assert.equal(payload.max_tokens, 4000);
    assert.equal(payload.response_format.type, "json_object");
    groqCalls += 1;
    const content = groqCalls === 1 ? '{"nota_final":' : JSON.stringify(correction);
    return {
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ choices: [{ message: { content } }] })
    };
  };

  try {
    const response = await realFetch(`${baseUrl}/api/corrigir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto, linhasVisuais: 8 })
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.match(data.resultado, /^Nota: 640/m);
    assert.equal(groqCalls, 2);
    assert.equal(savedCorrections, 1);
    for (let i = 0; i < 2; i += 1) {
      const repeated = await realFetch(baseUrl + "/api/corrigir", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, linhasVisuais: 8 })
      });
      assert.equal((await repeated.json()).resultado, data.resultado);
    }
    assert.equal(groqCalls, 2, "envios identicos nao chamam o modelo novamente");
    assert.equal(savedCorrections, 1, "envios repetidos nao duplicam o historico");
  } finally {
    global.fetch = realFetch;
  }
});

for (const score of [0, 40, 80, 120, 160, 200]) {
  test("soma competencias sem inflar a faixa " + score, () => {
    const result = normalizarCorrecao({
      nota_final: 1000,
      competencias: Array.from({length: 5}, (_, i) => ({
        competencia: i + 1, nota: score, requisitos: proofs(i + 1), comentario: "Evidencia concreta do criterio observado no texto apresentado."
      }))
    }, evidence);
    assert.equal(result.notaFinal, score * 5);
    assert.deepEqual(result.competencias.map(c => c.nota), Array(5).fill(score));
  });
}

for (let n = 1; n <= 5; n++) {
  test("C" + n + " bloqueia faixa alta sem prova e sem inflar notas baixas", () => {
    assert.equal(enforceEvidence(n, 200, undefined, evidence), 120);
    assert.equal(enforceEvidence(n, 200, proofs(n).filter(p => REQUIREMENTS[n].base.includes(p.criterio)), evidence), 160);
    assert.equal(enforceEvidence(n, 200, proofs(n), evidence), 200);
    assert.equal(enforceEvidence(n, 200, proofs(n), "Outra redacao sem o trecho citado."), 120);
    assert.equal(enforceEvidence(n, 0, proofs(n), evidence), 0);
    assert.equal(enforceEvidence(n, 80, proofs(n), evidence), 80);
    const missing = proofs(n).map(p => ({...p, atendido: false}));
    assert.equal(enforceEvidence(n, 200, missing, evidence), 120);
  });
}

test("nao transforma falta de metadados ou palavras do comentario em nota 600", () => {
  const result = normalizarCorrecao({
    competencias: [200, 160, 200, 160, 200].map((nota, i) => ({
      competencia: i + 1, nota,
      comentario: "O texto nao apresenta repeticao de conectivos nem falta detalhamento da proposta; nao ha argumentos genericos."
    }))
  }, evidence);
  assert.equal(result.notaFinal, 920);
  assert.deepEqual(result.competencias.map(c => c.nota), [200, 160, 200, 160, 200]);
});

test("repete avaliacao sem comentario em vez de salvar notas rebaixadas", async () => {
  const realFetch = global.fetch;
  let calls = 0;
  global.fetch = async (url, options) => {
    if (url !== "https://api.groq.com/openai/v1/chat/completions") return realFetch(url, options);
    calls += 1;
    const candidate = structuredClone(correction);
    candidate.competencias.forEach(item => { item.nota = 200; });
    if (calls === 1) candidate.competencias[0].comentario = "";
    else {
      if (calls === 2) assert.match(JSON.parse(options.body).messages.at(-1).content, /incompleta/);
      candidate.competencias.forEach(item => {
        item.requisitos = [{ criterio: "avaliacao", evidencia: evidence, analise: "Trecho pertinente.", atendido: true }];
      });
    }
    return { ok: true, status: 200, json: async () => ({
      choices: [{ message: { content: JSON.stringify(candidate) } }]
    }) };
  };
  try {
    const response = await realFetch(baseUrl + "/api/corrigir", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: evidence + require("node:crypto").randomUUID(), linhasVisuais: 12 })
    });
    assert.equal(response.status, 200);
    assert.match((await response.json()).resultado, /^Nota: 1000/m);
    assert.equal(calls, 2);
  } finally { global.fetch = realFetch; }
});

test("avaliacao completa faz uma unica chamada e reutiliza o resultado identico", async () => {
  const realFetch = global.fetch;
  let calls = 0;
  const texto = evidence + require("node:crypto").randomUUID();
  global.fetch = async (url, options) => {
    if (url !== "https://api.groq.com/openai/v1/chat/completions") return realFetch(url, options);
    calls += 1;
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: JSON.stringify(correction) } }] }) };
  };
  try {
    let first;
    for (let i = 0; i < 2; i++) {
      const response = await realFetch(baseUrl + "/api/corrigir", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, linhasVisuais: 15 })
      });
      assert.equal(response.status, 200);
      const data = await response.json();
      if (i === 0) first = data.resultado;
      else assert.equal(data.resultado, first);
    }
    assert.equal(calls, 1, "nao deve existir segunda leitura obrigatoria");
  } finally { global.fetch = realFetch; }
});

test("aceita comentarios concisos e metadados ausentes sem nova chamada ou mudanca da nota", async () => {
  const realFetch = global.fetch;
  let calls = 0;
  const candidate = structuredClone(correction);
  candidate.justificativa_nota = "Soma das cinco competencias.";
  candidate.competencias.forEach(item => {
    item.comentario = "Registro formal claro.";
    delete item.requisitos;
  });
  global.fetch = async (url, options) => {
    if (url !== "https://api.groq.com/openai/v1/chat/completions") return realFetch(url, options);
    calls++;
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: JSON.stringify(candidate) }, finish_reason: "stop" }] }) };
  };
  try {
    const response = await realFetch(baseUrl + "/api/corrigir", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: evidence + require("node:crypto").randomUUID(), linhasVisuais: 15 })
    });
    assert.equal(response.status, 200);
    assert.match((await response.json()).resultado, /^Nota: 640/m);
    assert.equal(calls, 1);
  } finally { global.fetch = realFetch; }
});

test("nao aceita avaliacao sem uma das cinco competencias", async () => {
  const realFetch = global.fetch;
  const candidate = structuredClone(correction);
  candidate.competencias.pop();
  let calls = 0;
  const before = savedCorrections;
  global.fetch = async (url, options) => {
    if (url !== "https://api.groq.com/openai/v1/chat/completions") return realFetch(url, options);
    calls++;
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: JSON.stringify(candidate) }, finish_reason: "stop" }] }) };
  };
  try {
    const response = await realFetch(baseUrl + "/api/corrigir", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: evidence + require("node:crypto").randomUUID(), linhasVisuais: 15 })
    });
    assert.equal(response.status, 502);
    assert.equal(calls, 2);
    assert.equal(savedCorrections, before);
  } finally { global.fetch = realFetch; }
});

test("recupera erro de geracao de JSON sem adicionar revisao obrigatoria", async () => {
  const realFetch = global.fetch;
  let calls = 0;
  global.fetch = async (url, options) => {
    if (url !== "https://api.groq.com/openai/v1/chat/completions") return realFetch(url, options);
    calls++;
    if (calls === 1) return { ok: false, status: 400, json: async () => ({ error: { code: "json_validate_failed" } }) };
    return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: JSON.stringify(correction) } }] }) };
  };
  try {
    const response = await realFetch(baseUrl + "/api/corrigir", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: evidence + require("node:crypto").randomUUID(), linhasVisuais: 15 })
    });
    assert.equal(response.status, 200);
    assert.equal(calls, 2);
  } finally { global.fetch = realFetch; }
});

test("usa JSON schema estrito em modelos compativeis e preserva fallback", () => {
  const format = correctionResponseFormat("openai/gpt-oss-120b");
  assert.equal(format.type, "json_schema");
  assert.equal(format.json_schema.strict, true);
  assert.equal(format.json_schema.schema.additionalProperties, false);
  assert.deepEqual(format.json_schema.schema.required.sort(), Object.keys(format.json_schema.schema.properties).sort());
  assert.deepEqual(correctionResponseFormat("test-model"), { type: "json_object" });
});

test("cota diaria informa o tempo real sem repeticoes demoradas", async () => {
  const realFetch = global.fetch;
  let calls = 0;
  global.fetch = async (url, options) => {
    if (url !== "https://api.groq.com/openai/v1/chat/completions") return realFetch(url, options);
    calls++;
    return { ok: false, status: 429, headers: { get: () => null }, json: async () => ({ error: {
      code: "rate_limit_exceeded", message: "Rate limit reached on tokens per day (TPD). Please try again in 20m15.648s."
    } }) };
  };
  try {
    const response = await realFetch(baseUrl + "/api/corrigir", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: evidence + require("node:crypto").randomUUID(), linhasVisuais: 15 })
    });
    const data = await response.json();
    assert.equal(response.status, 429);
    assert.equal(calls, 1);
    assert.equal(response.headers.get("retry-after"), "1216");
    assert.equal(data.retryAfterSeconds, 1216);
    assert.match(data.erro, /cota diaria/);
    assert.match(data.erro, /21 minuto/);
  } finally { global.fetch = realFetch; }
});

test("pedido grande demais informa capacidade insuficiente sem prometer retorno em um minuto", async () => {
  const realFetch = global.fetch;
  let calls = 0;
  global.fetch = async (url, options) => {
    if (url !== "https://api.groq.com/openai/v1/chat/completions") return realFetch(url, options);
    calls++;
    return { ok: false, status: 429, json: async () => ({error: {
      code: "rate_limit_exceeded", message: "Request too large for model on tokens per minute"
    }}) };
  };
  try {
    const response = await realFetch(baseUrl + "/api/corrigir", {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({texto: evidence + require("node:crypto").randomUUID(), linhasVisuais: 8})
    });
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.match(body.erro, /Aguardar um minuto pode não resolver/);
    assert.equal(body.retryAfterSeconds, null);
    assert.equal(calls, 1);
  } finally { global.fetch = realFetch; }
});
