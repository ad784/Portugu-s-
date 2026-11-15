const express = require("express");
const { createEssayController } = require("../controllers/essays");
function createEssayRouter(options) {
  const { requireSupabaseUser, requireAdmin } = options;
  const controller = createEssayController(options);
  const router = express.Router();
  router.get("/me", requireSupabaseUser, controller.getSession);
  router.get("/evolucao", requireSupabaseUser, controller.getProgress);
  router.post(
    "/redacoes/sincronizar",
    requireSupabaseUser,
    controller.syncEssay,
  );
  router.get("/redacoes", requireSupabaseUser, controller.listEssays);
  router.get(
    "/admin/redacoes",
    requireSupabaseUser,
    requireAdmin,
    controller.listAdminEssays,
  );
  return router;
}
module.exports = { createEssayRouter };
