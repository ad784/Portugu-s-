const express = require("express");
const { createPhotoController } = require("../controllers/photo");
function createPhotoRouter(options) {
  const { requireSupabaseUser, requireAdmin } = options;
  const controller = createPhotoController(options);
  const router = express.Router();
  router.post(
    ["/api/corrigir-foto", "/corrigir-foto"],
    requireSupabaseUser,
    controller.correctPhoto,
  );
  return router;
}
module.exports = { createPhotoRouter };
