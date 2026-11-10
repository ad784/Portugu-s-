const express = require('express');
const { analyzePhoto, uploadPhoto, parsePhotoDataUrl } = require('../services/photo-correction');
const { PROMPT_CORRECAO_ENEM } = require('../services/essay-storage');
const { fingerprint, readCache, writeCache, findSavedCorrection, singleFlight } = require('../services/evaluation-cache');
const { acquireCorrection } = require('../middleware/correction-limits');
const { recordEvent } = require('../services/groq-metrics');

function createPhotoRouter({ requireSupabaseUser, saveCorrection, apiKey, model = 'qwen/qwen3.8-27b', provider = 'groq', googleApiKey, nvidiaApiKey, nvidiaModel, textModel = 'openai/gpt-oss-120b', analyze, upload = uploadPhoto }) {
  const evaluatePhoto = analyze || (provider === 'nvidia' ? require('../services/nvidia-photo').analyzeNvidiaPhoto : provider === 'google' ? require('../services/google-photo').analyzeGooglePhoto : analyzePhoto);
  const effectiveModel = ['google', 'nvidia'].includes(provider) ? textModel : model;
  const router = express.Router();
  router.post(['/api/corrigir-foto', '/corrigir-foto'], requireSupabaseUser, async (req, res) => {
    if (req.authUnavailable || !req.supabaseUser) return res.status(503).json({ erro: 'Não foi possível validar sua sessão. Tente novamente.' });
    const image = req.body?.imagem;
    const tema = req.body?.tema || '';
    if (typeof tema !== 'string' || tema.length > 500) return res.status(400).json({ erro: 'Informe um tema válido de até 500 caracteres.' });
    try { parsePhotoDataUrl(image); } catch (error) { return res.status(400).json({ erro: error.message }); }
    const parts = [provider === 'nvidia' ? 'foto-nvidia-v1' : provider === 'google' ? 'foto-google-v1' : 'foto-v2', req.supabaseUser.id, effectiveModel, PROMPT_CORRECAO_ENEM, image, tema.trim()];
    if (provider === 'nvidia') parts.push(nvidiaModel || require('../services/nvidia-photo').DEFAULT_MODEL);
    const hash = fingerprint(parts);
    try {
      const body = await singleFlight(hash, async () => {
        const saved = await findSavedCorrection(req, hash);
        if (saved) {
          recordEvent({ type: 'reuse', kind: 'foto', source: 'database' });
          return { resultado: saved.resultado, salvo: true, hash, id: saved.id, aviso: null };
        }
        const cached = readCache(hash);
        let result = cached?.resultado;
        if (result) recordEvent({ type: 'reuse', kind: 'foto', source: 'cache' });
        if (!result) {
          if (!['groq', 'google', 'nvidia'].includes(provider) || (provider === 'google' && !googleApiKey) || (provider === 'nvidia' && !nvidiaApiKey)) {
            const error = new Error('O serviço de leitura de fotos precisa ser configurado pelo responsável do site.'); error.status = 503; error.code = 'PHOTO_PROVIDER_AUTH'; throw error;
          }
          if (!apiKey) { const error = new Error('A correção por foto ainda está indisponível. Tente novamente mais tarde.'); error.status = 503; throw error; }
          const release = await acquireCorrection(req);
          try { ({ result } = await evaluatePhoto({ image, apiKey, model: effectiveModel, tema: tema.trim(), googleApiKey, nvidiaApiKey, nvidiaModel, userId: req.supabaseUser.id })); }
          finally { await release(); }
          writeCache(hash, { resultado: result, hash, salvo: false });
        }
        if (req.isLocalDemo) return { resultado: result, salvo: true, hash, aviso: null };
        let imagePath = null;
        let photoWarning = null;
        try { imagePath = await upload(req.supabaseUser.id, image, () => req.supabase); }
        catch { photoWarning = 'Sua avaliação está disponível, mas a imagem não pôde ser armazenada na conta.'; }
        let persistence;
        try {
          persistence = await saveCorrection(req, {
            conteudo: result.split(/\nRedacao:\n/i)[1]?.trim() || null,
            resultado: result, tipo: 'foto', imagemPath: imagePath, tema: tema.trim(), avaliacaoHash: hash
          });
        } catch { persistence = { ok: false }; }
        if (!persistence.ok && imagePath) {
          try { await req.supabase.storage.from('redacoes').remove([imagePath]); } catch { /* A retenção do Storage também deve ser monitorada. */ }
        }
        const response = { resultado: result, hash, id: persistence.id || null, salvo: Boolean(persistence.ok),
          aviso: !persistence.ok ? 'Sua avaliação ainda não foi salva na conta. Mantenha este dispositivo conectado para sincronizar antes de sair.' : photoWarning };
        writeCache(hash, response);
        return response;
      });
      res.json(body);
    } catch (error) {
      if (error.retryAfterSeconds) res.set('Retry-After', String(error.retryAfterSeconds));
      const codigo = ['PHOTO_REQUEST_TOO_LARGE', 'PHOTO_DAILY_LIMIT', 'PHOTO_PROVIDER_BUSY', 'CORRECTION_BUSY', 'PHOTO_PROVIDER_UNAVAILABLE', 'PHOTO_PROVIDER_AUTH', 'PHOTO_PROVIDER_MODEL'].includes(error.code) ? error.code : null;
      res.status(error.status || 502).json({ erro: error.message || 'Não foi possível corrigir a foto. Tente novamente.', codigo, retryAfterSeconds: error.retryAfterSeconds || null });
    }
  });
  return router;
}
module.exports = { createPhotoRouter };
