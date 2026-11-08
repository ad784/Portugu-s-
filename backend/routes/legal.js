const express = require('express');
const { legalVersions } = require('../services/photo-config');
async function readAcceptance(req) {
  const { data, error } = await req.supabase.from('legal_acceptances').select('terms_version, privacy_version, ai_consent, accepted_at, revoked_at').eq('user_id', req.supabaseUser.id).maybeSingle();
  if (error) throw new Error('Não foi possível consultar seu aceite. Tente novamente mais tarde.');
  return data;
}
function isAccepted(receipt) {
  const current = legalVersions();
  return receipt?.terms_version === current.termsVersion && receipt?.privacy_version === current.privacyVersion && receipt?.ai_consent === true && !receipt.revoked_at;
}
async function requireLegalAcceptance(req, res, next) {
  if (req.isLocalDemo) return next();
  try {
    if (!isAccepted(await readAcceptance(req))) return res.status(428).json({ erro: 'Confirme os termos e a autorização de IA antes de enviar uma redação.', code: 'LEGAL_ACCEPTANCE_REQUIRED' });
    next();
  } catch (error) { res.status(503).json({ erro: error.message }); }
}
function createLegalRouter({ requireSupabaseUser }) {
  const router = express.Router();
  router.use(requireSupabaseUser);
  router.get('/', async (req, res) => {
    try {
      const receipt = req.isLocalDemo ? null : await readAcceptance(req);
      res.json({ accepted: isAccepted(receipt), receipt, ...legalVersions() });
    } catch (error) { res.status(503).json({ erro: error.message }); }
  });
  router.post('/', async (req, res) => {
    const body = req.body || {};
    const current = legalVersions();
    if (body.termsVersion !== current.termsVersion || body.privacyVersion !== current.privacyVersion || body.aiConsent !== true || body.acceptTerms !== true) return res.status(400).json({ erro: 'Leia os documentos atuais e marque os dois campos de aceite.' });
    if (req.isLocalDemo) return res.json({ accepted: true });
    try {
      const { error } = await req.supabase.rpc('accept_current_terms', { terms: body.termsVersion, privacy: body.privacyVersion });
      if (error) throw error;
      res.json({ accepted: true, receipt: await readAcceptance(req) });
    } catch { res.status(503).json({ erro: 'Não foi possível registrar o aceite. Tente novamente mais tarde.' }); }
  });
  router.delete('/', async (req, res) => {
    if (!req.isLocalDemo) {
      const { error } = await req.supabase.rpc('revoke_ai_consent');
      if (error) return res.status(503).json({ erro: 'Não foi possível revogar a autorização. Tente novamente.' });
    }
    res.json({ revoked: true });
  });
  return router;
}
module.exports = { createLegalRouter, requireLegalAcceptance, isAccepted };
