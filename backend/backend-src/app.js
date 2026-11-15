require("./config/env");
const express = require("express");
const cors = require("cors");
const path = require("path");

function getGroqApiKey() {
  return process.env.GROQ_API_KEY?.trim() || "";
}
const groqApiKey = getGroqApiKey();
const { photoConfig, legalVersions } = require("./config/photo-config");
const {
  requireSupabaseUser,
  requireAdmin,
} = require("./middleware/require-user");
const { createLegalRouter } = require("./routes/legal");
const {
  requireLegalAcceptance,
} = require("./middleware/require-legal-acceptance");
const requireCorrectionUser = (req, res, next) =>
  requireSupabaseUser(req, res, () => requireLegalAcceptance(req, res, next));
const { createPhotoRouter } = require("./routes/photo");

const app = express();
app.disable("x-powered-by");
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use(cors({ origin: process.env.APP_ORIGIN || false }));
app.use((_req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy":
      "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  });
  next();
});
// A imagem capturada é enviada em base64 e precisa de um limite maior que o padrão.
app.use(express.json({ limit: "4300kb" }));
app.get("/api/config", (_req, res) => {
  if (
    !require("./config/public-config").isPublicSupabaseKey(
      process.env.SUPABASE_PUBLISHABLE_KEY,
    )
  )
    return res
      .status(503)
      .json({ erro: "Configuração pública de autenticação indisponível." });
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
    emailRecoveryEnabled: process.env.EMAIL_RECOVERY_ENABLED === "true",
    legal: legalVersions(),
    privacyContact: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      process.env.CONTACT_EMAIL || "",
    )
      ? process.env.CONTACT_EMAIL
      : null,
  });
});

const { saveCorrection } = require("./services/essay-storage");
const { createEssayRouter } = require("./routes/essays");
const { createProfileRouter } = require("./routes/profile");
const { createTextCorrectionRouter } = require("./routes/text-correction");

app.use("/api/termos", createLegalRouter({ requireSupabaseUser }));
app.use("/api", createEssayRouter({ requireSupabaseUser, requireAdmin }));
app.use("/api/perfil", createProfileRouter({ requireSupabaseUser }));
app.use(
  createTextCorrectionRouter({
    requireSupabaseUser: requireCorrectionUser,
    saveCorrection,
    apiKey: groqApiKey,
    model: process.env.GROQ_MODEL,
  }),
);
app.use(
  createPhotoRouter({
    ...photoConfig(),
    requireSupabaseUser: requireCorrectionUser,
    saveCorrection,
    apiKey: groqApiKey,
    model: process.env.GROQ_VISION_MODEL,
  }),
);
app.use("/api", (_req, res) =>
  res.status(404).json({ erro: "Recurso não encontrado." }),
);

// O frontend React compilado é servido como arquivos estáticos.
const frontendBuild = path.join(__dirname, "../../frontend/build/client");
const publicPages = [
  "/contato",
  "/contato.html",
  "/",
  "/index",
  "/index.html",
  "/cadastro",
  "/confirmar-email",
  "/confirmar-email.html",
  "/cadastro.html",
  "/nova",
  "/nova.html",
  "/resultado",
  "/resultado.html",
  "/foto",
  "/foto.html",
  "/exemplos",
  "/exemplos.html",
  "/historico",
  "/historico.html",
  "/evolucao",
  "/evolucao.html",
  "/perfil",
  "/perfil.html",
  "/recuperar",
  "/recuperar.html",
  "/privacidade",
  "/privacidade.html",
  "/termos",
  "/termos.html",
  "/aceite",
  "/aceite.html",
];
app.use(express.static(frontendBuild));
app.get(publicPages, (_req, res) => {
  res.sendFile(path.join(frontendBuild, "index.html"));
});

// 🚀 ROTA DE CORREÇÃO COM GROQ

app.use(require("./middleware/error-handler"));

module.exports = app;
