const express = require("express");
const {
  createTextCorrectionController,
} = require("../controllers/text-correction");
function createTextCorrectionRouter(options) {
  const router = express.Router();
  router.post(
    ["/api/corrigir", "/corrigir"],
    options.requireSupabaseUser,
    createTextCorrectionController(options),
  );
  return router;
}
module.exports = { createTextCorrectionRouter };
