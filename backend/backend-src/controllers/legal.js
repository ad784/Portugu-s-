const model = require("../models/legal");
const { legalVersions } = require("../config/photo-config");
const { readAcceptance } = require("../models/legal");
const { isAccepted } = require("../services/legal-acceptance");
function createLegalController({ requireSupabaseUser }) {
  const getAcceptance = async (req, res) => {
    try {
      const receipt = req.isLocalDemo ? null : await readAcceptance(req);
      res.json({ accepted: isAccepted(receipt), receipt, ...legalVersions() });
    } catch (error) {
      res.status(503).json({ erro: error.message });
    }
  };
  const acceptTerms = async (req, res) => {
    const body = req.body || {};
    const current = legalVersions();
    if (
      body.termsVersion !== current.termsVersion ||
      body.privacyVersion !== current.privacyVersion ||
      body.aiConsent !== true ||
      body.acceptTerms !== true
    )
      return res.status(400).json({
        erro: "Leia os documentos atuais e marque os dois campos de aceite.",
      });
    if (req.isLocalDemo) return res.json({ accepted: true });
    try {
      const { error } = await model.acceptTerms(req, body);
      if (error) throw error;
      res.json({ accepted: true, receipt: await readAcceptance(req) });
    } catch {
      res.status(503).json({
        erro: "Não foi possível registrar o aceite. Tente novamente mais tarde.",
      });
    }
  };
  const revokeConsent = async (req, res) => {
    if (!req.isLocalDemo) {
      const { error } = await model.revokeConsent(req);
      if (error)
        return res.status(503).json({
          erro: "Não foi possível revogar a autorização. Tente novamente.",
        });
    }
    res.json({ revoked: true });
  };
  return { getAcceptance, acceptTerms, revokeConsent };
}

module.exports = { createLegalController };
