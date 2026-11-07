const { PROMPT_CORRECAO_ENEM, formatarCorrecaoEnem } = require('./essay-storage');
const { fingerprint, readCache, writeCache, findSavedCorrection, singleFlight } = require('./evaluation-cache');
const { acquireCorrection } = require('../middleware/correction-limits');
const rules = require('./writing-rules');
const { recordUsage, recordEvent } = require('./groq-metrics');
const { providerLimit } = require('./provider-limits');

function serviceError(message, status = 502, seconds) {
  const error = new Error(message);
  error.status = status;
  error.retryAfterSeconds = seconds;
  return error;
}

function retrySeconds(response, data) {
  const duration = data.error?.message?.match(/try again in\s+(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?/i);
  const fromMessage = duration ? Number(duration[1] || 0) * 3600 + Number(duration[2] || 0) * 60 + Number(duration[3] || 0) : 0;
  const reset = response.headers?.get('x-ratelimit-reset-tokens') || '';
  const resetDuration = String(reset).match(/^(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?$/i);
  const fromReset = resetDuration ? Number(resetDuration[1] || 0) * 3600 + Number(resetDuration[2] || 0) * 60 + Number(resetDuration[3] || 0) : 0;
  // A token reset cannot describe a daily request/token quota.
  const daily = /tokens per day|requests per day|\bTPD\b|\bRPD\b/i.test(data.error?.message || '');
  return Math.max(1, Math.ceil(Number(response.headers?.get('retry-after')) || fromMessage || (!daily && fromReset) || 60));
}

function createTextHandler({ saveCorrection, apiKey, model = 'openai/gpt-oss-120b', parseJsonObject, isCompleteCorrection, normalizarCorrecao, correctionResponseFormat }) {
  async function generate(texto, tema, linhas) {
    const payload = {
      model, ...(model.includes('gpt-oss') ? { reasoning_effort: 'low' } : {}),
      temperature: 0, seed: 42, max_tokens: 4000,
      response_format: correctionResponseFormat(model),
      messages: [
        { role: 'system', content: PROMPT_CORRECAO_ENEM },
        { role: 'user', content: `Tema da proposta: ${tema || 'Não informado. Não invente fuga ao tema.'}\nExtensão estimada em linhas de referência: ${linhas}.\n\nRedação para avaliar:\n---\n${texto}\n---` }
      ]
    };
    const deadline = Date.now() + 50000;
    for (let attempt = 0; attempt < 2; attempt++) {
      const started = Date.now();
      let response;
      try {
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(payload), signal: AbortSignal.timeout(Math.max(1, Math.min(25000, deadline - Date.now())))
        });
      } catch (error) {
        throw serviceError(error.name === 'TimeoutError' || error.name === 'AbortError'
          ? 'O serviço de correção demorou além do esperado. Seu rascunho foi mantido; tente novamente.'
          : 'Não foi possível conectar ao serviço de correção. Tente novamente.');
      }
      let data;
      try { data = await response.json(); } catch { data = {}; }
      recordUsage('texto', model, attempt + 1, response, data, started);
      if (response.status === 429) {
        if (providerLimit(response, data).category === 'request_too_large') {
          throw serviceError('O pedido excede a capacidade por minuto disponível no serviço de IA do site. Aguardar um minuto pode não resolver; o responsável precisa revisar a capacidade contratada. Seu rascunho foi mantido.', 503);
        }
        const seconds = retrySeconds(response, data);
        const daily = /tokens per day|requests per day|\bTPD\b|\bRPD\b/i.test(data.error?.message || '');
        throw serviceError((daily ? 'A cota diaria do servico de correcao foi atingida.' : 'O limite de uso da IA foi atingido.')
          + ` Tente novamente em cerca de ${Math.ceil(seconds / 60)} minuto(s).`, 429, seconds);
      }
      const candidate = parseJsonObject(data.choices?.[0]?.message?.content);
      if (response.ok && isCompleteCorrection(candidate, texto)) return normalizarCorrecao(candidate, texto);
      const recoverable = response.ok || response.status >= 500 || response.status === 408 || data.error?.code === 'json_validate_failed';
      if (!recoverable) throw serviceError('O serviço de correção está indisponível. Tente novamente em instantes.');
      console.warn('Resposta de correção incompleta:', response.status, data.choices?.[0]?.finish_reason || data.error?.code || 'sem formato');
      if (data.choices?.[0]?.finish_reason === 'length') payload.max_tokens = 6000;
      payload.seed = 43;
      payload.messages.push({ role: 'user', content: 'A resposta anterior veio incompleta. Retorne somente o JSON completo com cinco competencias, notas e comentarios. Seja conciso e conclua o objeto, mantendo os mesmos criterios.' });
    }
    throw serviceError('A resposta da correção veio incompleta. Seu rascunho foi mantido; tente novamente.');
  }

  return async (req, res) => {
    const { texto, tema = '' } = req.body || {};
    if (typeof texto !== 'string' || !texto.trim()) return res.status(400).json({ erro: 'Texto não enviado.' });
    if (texto.length > rules.maximumCharacters) return res.status(400).json({ erro: `A redação deve ter no máximo ${rules.maximumCharacters} caracteres.` });
    if (typeof tema !== 'string' || tema.length > rules.maximumThemeCharacters) return res.status(400).json({ erro: 'Informe um tema válido de até 500 caracteres.' });
    const normalizedText = texto.trim().replace(/\r\n?/g, '\n');
    const linhas = rules.estimateLines(normalizedText);
    if (linhas < rules.minimumLines) return res.status(400).json({ erro: 'Sua redação precisa ter pelo menos 8 linhas de referência para ser enviada à correção.' });
    const hash = fingerprint(['avaliacao-unica-v5', req.supabaseUser.id, model, PROMPT_CORRECAO_ENEM, normalizedText, tema.trim()]);
    try {
      const body = await singleFlight(hash, async () => {
        const saved = await findSavedCorrection(req, hash);
        if (saved) {
          recordEvent({ type: 'reuse', kind: 'texto', source: 'database' });
          return { resultado: saved.resultado, id: saved.id, hash, salvo: true, aviso: null };
        }
        const cached = readCache(hash);
        let resultado = cached?.resultado;
        if (resultado) recordEvent({ type: 'reuse', kind: 'texto', source: 'cache' });
        if (!resultado) {
          if (!apiKey) throw serviceError('A correção por IA ainda não está disponível. Tente novamente mais tarde.', 503);
          const release = await acquireCorrection(req);
          try { resultado = formatarCorrecaoEnem(await generate(normalizedText, tema.trim(), linhas), normalizedText); }
          finally { await release(); }
          // Preserva a avaliação mesmo se a gravação remota falhar ou a conexão for interrompida.
          writeCache(hash, { resultado, hash, salvo: false });
        }
        let persistence;
        try { persistence = await saveCorrection(req, { conteudo: normalizedText, resultado, tipo: 'texto', linhas, tema: tema.trim(), avaliacaoHash: hash }); }
        catch { persistence = { ok: false }; }
        const response = { resultado, id: persistence.id || null, hash, salvo: Boolean(persistence.ok),
          aviso: persistence.ok ? null : 'A avaliação foi concluída, mas ainda não foi salva na conta. Ela pode ser sincronizada sem repetir a correção.' };
        writeCache(hash, response);
        return response;
      });
      res.json(body);
    } catch (error) {
      if (error.retryAfterSeconds) res.set('Retry-After', String(error.retryAfterSeconds));
      res.status(error.status || 500).json({ erro: error.status ? error.message : 'Não foi possível concluir a correção. Tente novamente.', retryAfterSeconds: error.retryAfterSeconds || null });
    }
  };
}
module.exports = { createTextHandler, retrySeconds };
