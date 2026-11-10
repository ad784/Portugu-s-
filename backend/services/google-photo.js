const { parsePhotoDataUrl } = require("./photo-correction");
const { fingerprint, readCache, writeCache } = require("./evaluation-cache");
const { createTextEvaluator } = require("./text-evaluation");
const { formatarCorrecaoEnem } = require("./essay-storage");
const rules = require("./writing-rules");
const { recordEvent } = require("./groq-metrics");

function failure(message, status = 503, code = "PHOTO_PROVIDER_AUTH", seconds) {
  const error = new Error(message);
  Object.assign(error, { status, code, retryAfterSeconds: seconds });
  return error;
}

async function readGooglePhoto({ image, googleApiKey, fetchImpl = fetch }) {
  const { buffer } = parsePhotoDataUrl(image);
  if (!googleApiKey)
    throw failure(
      "A leitura pelo Google ainda precisa ser configurada pelo responsável do site.",
    );
  let response, data;
  const started = Date.now();
  try {
    response = await fetchImpl(
      "https://vision.googleapis.com/v1/images:annotate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": googleApiKey,
        },
        signal: AbortSignal.timeout(12000),
        body: JSON.stringify({
          requests: [
            {
              image: { content: buffer.toString("base64") },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
              imageContext: { languageHints: ["pt"] },
            },
          ],
        }),
      },
    );
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } catch {
    throw failure(
      "Não foi possível conectar à leitura do Google. Sua foto foi mantida.",
      503,
      "PHOTO_PROVIDER_UNAVAILABLE",
      15,
    );
  }
  const detail = data?.error || data?.responses?.[0]?.error;
  recordEvent({
    type: "ocr",
    provider: "google",
    status: response.status,
    failed: Boolean(detail),
    durationMs: Date.now() - started,
    images: 1,
  });
  if (!response.ok || detail || !data) {
    const status = detail?.status;
    if (
      response.status === 429 ||
      detail?.code === 8 ||
      status === "RESOURCE_EXHAUSTED"
    ) {
      // Google may use RESOURCE_EXHAUSTED for daily, billing or minute quotas.
      // Without a precise retry hint, avoid repeated billable OCR requests.
      const retry = Number(response.headers?.get("retry-after"));
      if (Number.isFinite(retry) && retry > 0)
        throw failure(
          "O Google pediu uma pausa na leitura. Sua foto foi mantida.",
          429,
          "PHOTO_PROVIDER_BUSY",
          Math.ceil(retry),
        );
      throw failure(
        "O limite de leitura do Google foi atingido. O responsável precisa conferir as cotas e o faturamento.",
        503,
        "PHOTO_PROVIDER_AUTH",
      );
    }
    if (response.status >= 500 || [13, 14].includes(detail?.code))
      throw failure(
        "O Google está temporariamente indisponível para leitura.",
        503,
        "PHOTO_PROVIDER_UNAVAILABLE",
        15,
      );
    if ([401, 403].includes(response.status) || [7, 16].includes(detail?.code))
      throw failure(
        "A leitura do Google não foi autorizada. O responsável precisa conferir a chave, a API Cloud Vision e o faturamento.",
      );
    if (!data)
      throw failure(
        "A leitura do Google não retornou uma resposta válida.",
        503,
        "PHOTO_PROVIDER_UNAVAILABLE",
        15,
      );
    throw failure(
      "Não foi possível ler esta imagem. Envie uma foto nítida da folha inteira.",
      400,
      "PHOTO_IMAGE_UNREADABLE",
    );
  }
  const text = data.responses?.[0]?.fullTextAnnotation?.text;
  if (typeof text !== "string" || text.trim().length < 30)
    throw failure(
      "Não foi encontrada uma redação legível na foto. Fotografe somente a folha, com boa iluminação.",
      400,
      "PHOTO_IMAGE_UNREADABLE",
    );
  return text.trim().replace(/\r\n?/g, "\n");
}

async function analyzeGooglePhoto({
  image,
  apiKey,
  googleApiKey,
  model = "openai/gpt-oss-120b",
  tema = "",
  userId,
  fetchImpl = fetch,
  evaluate,
}) {
  const { mime } = parsePhotoDataUrl(image);
  if (!apiKey)
    throw failure(
      "A correção por IA ainda precisa ser configurada pelo responsável.",
    );
  const key = userId ? fingerprint(["google-ocr-v1", userId, image]) : null;
  let transcript = key ? readCache(key)?.transcript : null;
  if (!transcript) {
    transcript = await readGooglePhoto({ image, googleApiKey, fetchImpl });
    if (key) writeCache(key, { transcript });
  } else
    recordEvent({ type: "reuse", kind: "foto", source: "google-ocr-cache" });
  if (transcript.length > rules.maximumCharacters)
    throw failure(
      "A leitura encontrou texto demais. Fotografe apenas uma redação por vez.",
      400,
      "PHOTO_IMAGE_UNREADABLE",
    );
  const lines = rules.estimateLines(transcript);
  if (lines < rules.minimumLines)
    throw failure(
      "A leitura encontrou menos de 8 linhas de referência. Confira se a folha inteira está nítida.",
      400,
      "PHOTO_IMAGE_UNREADABLE",
    );
  const {
    parseJsonObject,
    isCompleteCorrection,
    normalizarCorrecao,
    correctionResponseFormat,
  } = require("../routes/text-correction");
  const evaluator =
    evaluate ||
    createTextEvaluator({
      apiKey,
      model,
      parseJsonObject,
      isCompleteCorrection,
      normalizarCorrecao,
      correctionResponseFormat,
      budgetMs: 40000,
    });
  try {
    const correction = await evaluator(transcript, tema, lines);
    return { result: formatarCorrecaoEnem(correction, transcript), mime };
  } catch (error) {
    if (error.status === 429) {
      error.code = /cota diaria/i.test(error.message)
        ? "PHOTO_DAILY_LIMIT"
        : "PHOTO_PROVIDER_BUSY";
    }
    throw error;
  }
}
module.exports = { readGooglePhoto, analyzeGooglePhoto };
