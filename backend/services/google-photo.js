const { parsePhotoDataUrl } = require('./photo-correction');
const { recordEvent } = require('./groq-metrics');

function failure(message, status = 503, code = 'PHOTO_PROVIDER_AUTH', seconds) {
  const error = new Error(message);
  Object.assign(error, { status, code, retryAfterSeconds: seconds });
  return error;
}

async function readGooglePhoto({ image, googleApiKey, fetchImpl = fetch }) {
  const { buffer } = parsePhotoDataUrl(image);
  if (!googleApiKey) throw failure('A leitura pelo Google ainda precisa ser configurada pelo responsável do site.');
  let response, data;
  const started = Date.now();
  try {
    response = await fetchImpl('https://vision.googleapis.com/v1/images:annotate', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': googleApiKey },
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({ requests: [{ image: { content: buffer.toString('base64') },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }], imageContext: { languageHints: ['pt'] } }] })
    });
    try { data = await response.json(); } catch { data = null; }
  } catch {
    throw failure('Não foi possível conectar à leitura do Google. Sua foto foi mantida.', 503, 'PHOTO_PROVIDER_UNAVAILABLE', 15);
  }
  const detail = data?.error || data?.responses?.[0]?.error;
  recordEvent({ type: 'ocr', provider: 'google', status: response.status, failed: Boolean(detail), durationMs: Date.now() - started, images: 1 });
  if (!response.ok || detail || !data) {
    const status = detail?.status;
    if (response.status === 429 || detail?.code === 8 || status === 'RESOURCE_EXHAUSTED') {
      // Google may use RESOURCE_EXHAUSTED for daily, billing or minute quotas.
      // Without a precise retry hint, avoid repeated billable OCR requests.
      const retry = Number(response.headers?.get('retry-after'));
      if (Number.isFinite(retry) && retry > 0) throw failure('O Google pediu uma pausa na leitura. Sua foto foi mantida.', 429, 'PHOTO_PROVIDER_BUSY', Math.ceil(retry));
      throw failure('O limite de leitura do Google foi atingido. O responsável precisa conferir as cotas e o faturamento.', 503, 'PHOTO_PROVIDER_AUTH');
    }
    if (response.status >= 500 || [13, 14].includes(detail?.code)) throw failure('O Google está temporariamente indisponível para leitura.', 503, 'PHOTO_PROVIDER_UNAVAILABLE', 15);
    if ([401, 403].includes(response.status) || [7, 16].includes(detail?.code)) throw failure('A leitura do Google não foi autorizada. O responsável precisa conferir a chave, a API Cloud Vision e o faturamento.');
    if (!data) throw failure('A leitura do Google não retornou uma resposta válida.', 503, 'PHOTO_PROVIDER_UNAVAILABLE', 15);
    throw failure('Não foi possível ler esta imagem. Envie uma foto nítida da folha inteira.', 400, 'PHOTO_IMAGE_UNREADABLE');
  }
  const text = data.responses?.[0]?.fullTextAnnotation?.text;
  if (typeof text !== 'string' || text.trim().length < 30) throw failure('Não foi encontrada uma redação legível na foto. Fotografe somente a folha, com boa iluminação.', 400, 'PHOTO_IMAGE_UNREADABLE');
  return text.trim().replace(/\r\n?/g, '\n');
}

function analyzeGooglePhoto(options) {
  const { analyzeTranscribedPhoto } = require('./transcribed-photo');
  return analyzeTranscribedPhoto({ ...options, read: readGooglePhoto, provider: 'google',
    readerOptions: { googleApiKey: options.googleApiKey, fetchImpl: options.fetchImpl || fetch } });
}
module.exports = { readGooglePhoto, analyzeGooglePhoto };
