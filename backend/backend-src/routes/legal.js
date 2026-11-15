const express = require("express");
const { createLegalController } = require("../controllers/legal");
function createLegalRouter(options) {
  const { requireSupabaseUser, requireAdmin } = options;
  const controller = createLegalController(options);
  const router = express.Router();
  router.use(requireSupabaseUser);
  router.get("/", controller.getAcceptance);
  router.post("/", controller.acceptTerms);
  router.delete("/", controller.revokeConsent);
  return router;
}
module.exports = { createLegalRouter };
