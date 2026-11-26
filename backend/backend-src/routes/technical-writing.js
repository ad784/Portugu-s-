const express = require("express");
const {
  createTechnicalController,
} = require("../controllers/technical-writing");
function createTechnicalRouter({
  requireSupabaseUser,
  requireCorrectionUser = requireSupabaseUser,
  ...options
}) {
  const router = express.Router(),
    controller = createTechnicalController(options);
  router.get("/config", requireSupabaseUser, controller.config);
  router.get("/historico", requireSupabaseUser, controller.list);
  router.get("/historico/:id", requireSupabaseUser, controller.detail);
  router.post("/corrigir", requireCorrectionUser, controller.correct);
  return router;
}
module.exports = { createTechnicalRouter };
