const { parsePhotoDataUrl } = require('./photo-correction');
const { fingerprint, readCache, writeCache } = require('./evaluation-cache');
const { createTextEvaluator } = require('./text-evaluation');
const { formatarCorrecaoEnem } = require('./essay-storage');
const rules = require('./writing-rules');
const { recordEvent } = require('./groq-metrics');

function photoError(message, status = 503, code = 'PHOTO_PROVIDER_AUTH', seconds) {
  return Object.assign(new Error(message), { status, code, retryAfterSeconds: seconds });
}

async function analyzeTranscribedPhoto({ image, apiKey, model = 'openai/gpt-oss-120b', tema = '', userId, evaluate,
  read, provider, readerModel = '', readerOptions = {}, budgetMs = 40000 }) {
  const { mime } = parsePhotoDataUrl(image);
  if (!apiKey) throw photoError('A correção por IA ainda precisa ser configurada pelo responsável.');
  const parts = [provider + '-ocr-v1', userId, image];
  if (readerModel) parts.push(readerModel);
  const key = userId ? fingerprint(parts) : null;
  let transcript = key ? readCache(key)?.transcript : null;
  if (!transcript) {
    transcript = await read({ image, userId, ...readerOptions });
    if (typeof transcript !== 'string' || transcript.trim().length < 30) throw photoError('Não foi encontrada uma redação legível na foto.', 400, 'PHOTO_IMAGE_UNREADABLE');
    if (key) writeCache(key, { transcript });
  } else recordEvent({ type: 'reuse', kind: 'foto', source: provider + '-ocr-cache' });
  if (transcript.length > rules.maximumCharacters) throw photoError('A leitura encontrou texto demais. Fotografe apenas uma redação por vez.', 400, 'PHOTO_IMAGE_UNREADABLE');
  const lines = rules.estimateLines(transcript);
  if (lines < rules.minimumLines) throw photoError('A leitura encontrou menos de 8 linhas de referência. Confira se a folha inteira está nítida.', 400, 'PHOTO_IMAGE_UNREADABLE');
  const { parseJsonObject, isCompleteCorrection, normalizarCorrecao, correctionResponseFormat } = require('../routes/text-correction');
  const evaluator = evaluate || createTextEvaluator({ apiKey, model, parseJsonObject, isCompleteCorrection, normalizarCorrecao, correctionResponseFormat, budgetMs });
  try {
    return { result: formatarCorrecaoEnem(await evaluator(transcript, tema, lines), transcript), mime };
  } catch (error) {
    if (error.status === 429) error.code = /cota diaria/i.test(error.message) ? 'PHOTO_DAILY_LIMIT' : 'PHOTO_PROVIDER_BUSY';
    throw error;
  }
}
module.exports = { analyzeTranscribedPhoto, photoError };
