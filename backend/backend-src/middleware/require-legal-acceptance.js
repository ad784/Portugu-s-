const { readAcceptance } = require("../models/legal");
const { isAccepted } = require("../services/legal-acceptance");
async function requireLegalAcceptance(req, res, next) {
  if (req.isLocalDemo) return next();
  try {
    if (!isAccepted(await readAcceptance(req)))
      return res.status(428).json({
        erro: "Confirme os termos e a autorização de IA antes de enviar uma redação.",
        code: "LEGAL_ACCEPTANCE_REQUIRED",
      });
    next();
  } catch (error) {
    res.status(503).json({ erro: error.message });
  }
}

module.exports = { requireLegalAcceptance };
