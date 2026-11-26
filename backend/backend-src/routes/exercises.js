const express = require("express");
const { createExerciseController } = require("../controllers/exercises");

function createExerciseRouter({ requireSupabaseUser, model }) {
  const router = express.Router();
  const controller = createExerciseController({ model });
  router.use(requireSupabaseUser);
  router.get("/", controller.catalog);
  router.post("/conferir", controller.check);
  router.get("/tentativas", controller.list);
  router.post("/tentativas", controller.save);
  return router;
}

module.exports = { createExerciseRouter };
