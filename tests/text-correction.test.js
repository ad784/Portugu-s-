const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { createTextCorrectionRouter } = require("../backend/routes/text-correction");

const app = express();
app.use(express.json());

let groqCalls = 0;
let savedCorrections = 0;
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

app.use(createTextCorrectionRouter({
  requireSupabaseUser: (req, _res, next) => {
    req.supabaseUser = { id: "student-1" };
    next();
  },
  saveCorrection: async () => {
    savedCorrections += 1;
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
  const realFetch = global.fetch;
  groqCalls = 0;
  savedCorrections = 0;
  global.fetch = async (url, options) => {
    if (url !== "https://api.groq.com/openai/v1/chat/completions") return realFetch(url, options);
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
      body: JSON.stringify({ texto: "Texto de exemplo com oito linhas visuais para passar pela validação.", linhasVisuais: 8 })
    });
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.match(data.resultado, /^Nota: 600/m);
    assert.equal(groqCalls, 2);
    assert.equal(savedCorrections, 1);
  } finally {
    global.fetch = realFetch;
  }
});
