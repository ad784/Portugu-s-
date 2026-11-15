const express = require("express");
const { createProfileController } = require("../controllers/profile");
function createProfileRouter(options) {
  const { requireSupabaseUser, requireAdmin } = options;
  const controller = createProfileController(options);
  const router = express.Router();
  router.get("/exportar", requireSupabaseUser, controller.exportProfile);
  router.get("/", requireSupabaseUser, controller.getProfile);
  router.put("/", requireSupabaseUser, controller.updateProfile);
  return router;
}
module.exports = { createProfileRouter };
