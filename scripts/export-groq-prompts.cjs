// Snapshot actual request builders with fictitious input. No network calls,
// database writes, real API keys or user essays are used.
const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config({ quiet: true });
const { createTextHandler } = require("../backend/services/text-evaluation");
const {
  normalizarCorrecao,
  correctionResponseFormat,
} = require("../backend/routes/text-correction");
const { analyzePhoto } = require("../backend/services/photo-correction");
const calibration = require("../backend/services/calibration-examples.json");

async function main() {
  const captures = {};
  const capture = (kind) => async (_url, options) => {
    captures[kind] = JSON.parse(options.body);
    throw new Error("Snapshot captured; network intentionally disabled.");
  };
  const originalFetch = global.fetch;
  global.fetch = capture("texto");
  try {
    const handler = createTextHandler({
      saveCorrection: async () => {
        throw new Error("Unexpected persistence in snapshot.");
      },
      apiKey: "snapshot-not-a-real-key",
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      parseJsonObject: () => null,
      isCompleteCorrection: () => false,
      normalizarCorrecao,
      correctionResponseFormat,
    });
    const req = {
      isLocalDemo: true,
      supabaseUser: { id: `snapshot-${require("node:crypto").randomUUID()}` },
      body: {
        texto: Array(8).fill("<TRECHO DA REDAÇÃO DE EXEMPLO>").join("\n"),
        tema: "<TEMA SELECIONADO>",
      },
    };
    const res = {
      status() {
        return this;
      },
      json() {},
      set() {},
    };
    await handler(req, res);
    const image =
      "data:image/jpeg;base64," +
      Buffer.from([0xff, 0xd8, 1, 2, 3, 0xff, 0xd9]).toString("base64");
    await analyzePhoto({
      image,
      apiKey: "snapshot-not-a-real-key",
      model: process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b",
      tema: "<TEMA SELECIONADO>",
      fetchImpl: capture("foto"),
    }).catch((error) => {
      if (!captures.foto) throw error;
    });
  } finally {
    global.fetch = originalFetch;
  }
  if (!captures.texto || !captures.foto)
    throw new Error("Não foi possível capturar as duas requisições.");
  for (const message of captures.foto.messages)
    if (Array.isArray(message.content)) {
      for (const item of message.content)
        if (item.type === "image_url")
          item.image_url.url = "<FOTO_EM_BASE64: data:image/jpeg;base64,...>";
    }
  const folder = path.join(__dirname, "../docs");
  for (const kind of ["texto", "foto"]) {
    fs.writeFileSync(
      path.join(folder, `GROQ-PROMPT-${kind.toUpperCase()}.txt`),
      captures[kind].messages.find((message) => message.role === "system")
        .content,
    );
    fs.writeFileSync(
      path.join(folder, `GROQ-REQUISICAO-${kind.toUpperCase()}.json`),
      JSON.stringify(captures[kind], null, 2) + "\n",
    );
  }
  const prompt = captures.texto.messages[0].content;
  const stats = {
    dataDaCopia: new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Sao_Paulo",
    }),
    modeloTexto: captures.texto.model,
    modeloFoto: captures.foto.model,
    caracteresPromptTexto: prompt.length,
    caracteresPromptFoto: captures.foto.messages[0].content.length,
    caracteresExemplosCalibracao: prompt.includes(
      JSON.stringify(calibration.exemplos),
    )
      ? JSON.stringify(calibration.exemplos).length
      : 0,
    quantidadeExemplos: prompt.includes(JSON.stringify(calibration.exemplos))
      ? calibration.exemplos.length
      : 0,
    caracteresSchemaTexto: JSON.stringify(captures.texto.response_format)
      .length,
    limiteSaidaTexto: captures.texto.max_tokens,
    limiteSaidaFoto: captures.foto.max_completion_tokens,
  };
  fs.writeFileSync(
    path.join(folder, "GROQ-CONSUMO-ATUAL.json"),
    JSON.stringify(stats, null, 2) + "\n",
  );
  console.log(JSON.stringify(stats, null, 2));
  console.log(
    "Cópias geradas em docs/. Nenhum token foi consumido e o prompt ativo não foi alterado.",
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
