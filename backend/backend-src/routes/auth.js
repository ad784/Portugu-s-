const express = require("express");
const { createAuthController } = require("../controllers/auth");
function createAuthRouter(options = {}) {
  const router = express.Router();
  const controller = createAuthController(options);
  router.use(controller.rateLimit);
  router.get("/session", controller.getSession);
  router.get("/settings", controller.settings);
  for (const path of [
    "login",
    "signup",
    "refresh",
    "logout",
    "recovery",
    "callback",
    "password",
  ])
    router.post("/" + path, controller[path]);
  return router;
}
module.exports = { createAuthRouter };
