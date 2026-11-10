// Aceita o .env da raiz ou da pasta backend, sem depender da pasta de execução.
// Variáveis do processo têm prioridade; o .env da raiz prevalece sobre backend/.env.
const dotenv = require("dotenv");
const envPaths = [
  require("path").join(__dirname, "../.env"),
  require("path").join(__dirname, ".env"),
];
for (const envPath of envPaths) {
  const envFile = dotenv.config({ path: envPath, quiet: true });
  for (const [key, value] of Object.entries(envFile.parsed || {})) {
    if (!process.env[key]?.trim()) process.env[key] = value;
  }
}

const express = require("express");
const cors = require("cors");
const path = require("path");

// O frontend ja utiliza estas credenciais publicas. Usamos os mesmos valores
// como padrao no servidor para que a autenticacao funcione tanto localmente
// quanto na Vercel, mesmo se essas variaveis publicas nao forem cadastradas.
// Valores definidos no ambiente sempre tem prioridade.
process.env.CONTACT_EMAIL ||= "portuguesmais02@gmail.com";
process.env.SUPABASE_URL ||= "https://lzapufofepqbvqgzsqwg.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY ||=
  "sb_publishable_8J5M7W0x_8tnS1grYmGmWA_VbQZ3XUY";
process.env.SUPABASE_JWKS_URL ||= `${process.env.SUPABASE_URL.replace(/\/+$/, "")}/auth/v1/.well-known/jwks.json`;

function getGroqApiKey() {
  return process.env.GROQ_API_KEY?.trim() || "";
}
const groqApiKey = getGroqApiKey();
const { photoConfig, legalVersions } = require("./services/photo-config");
const {
  requireSupabaseUser,
  requireAdmin,
} = require("./middleware/require-user");
const { createLegalRouter, requireLegalAcceptance } = require("./routes/legal");
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
    !require("./services/public-config").isPublicSupabaseKey(
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
const frontendBuild = path.join(__dirname, "../frontend/build/client");
const publicPages = [
  "/contato",
  "/contato.html",
  "/",
  "/index",
  "/index.html",
  "/cadastro",
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

app.use((error, _req, res, _next) => {
  console.error(
    "Erro não tratado na API:",
    error.name,
    error.code || error.type || "sem código",
  );
  if (res.headersSent) return;
  if (error.type === "entity.too.large")
    return res.status(413).json({
      erro: "A imagem excede o limite de envio. Reduza o tamanho e tente novamente.",
    });
  if (error.type === "entity.parse.failed")
    return res.status(400).json({ erro: "Os dados enviados não são válidos." });
  res.status(500).json({
    erro: "O servidor encontrou um erro. Tente novamente em instantes.",
  });
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const server = app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log(`Chave Groq: ${groqApiKey ? "carregada" : "ausente"}`);
  });

  server.on("close", () => console.log("Servidor encerrado."));
  process.on("SIGINT", () => server.close(() => process.exit(0)));
  process.on("SIGTERM", () => server.close(() => process.exit(0)));
}

module.exports = app;
