// Aceita o .env da raiz ou da pasta backend, sem depender da pasta de execução.
// Variáveis do processo têm prioridade; o .env da raiz prevalece sobre backend/.env.
const dotenv = require("dotenv");
const envPaths = [
  require("path").join(__dirname, "../.env"),
  require("path").join(__dirname, ".env")
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
process.env.SUPABASE_URL ||= "https://lzapufofepqbvqgzsqwg.supabase.co";
process.env.SUPABASE_PUBLISHABLE_KEY ||= "sb_publishable_8J5M7W0x_8tnS1grYmGmWA_VbQZ3XUY";
process.env.SUPABASE_JWKS_URL ||= "https://lzapufofepqbvqgzsqwg.supabase.co/auth/v1/.well-known/jwks.json";


function getGroqApiKey() { return process.env.GROQ_API_KEY?.trim() || ""; }
const groqApiKey = getGroqApiKey();
const { requireSupabaseUser, requireAdmin } = require("./middleware/require-user");
const { createPhotoRouter } = require("./routes/photo");

const app = express();

app.use(cors());
// A imagem capturada é enviada em base64 e precisa de um limite maior que o padrão.
app.use(express.json({ limit: "7mb" }));

const { saveCorrection } = require("./services/essay-storage");
const { createEssayRouter } = require("./routes/essays");
const { createProfileRouter } = require("./routes/profile");
const { createTextCorrectionRouter } = require("./routes/text-correction");

app.use("/api", createEssayRouter({ requireSupabaseUser, requireAdmin }));
app.use("/api/perfil", createProfileRouter({ requireSupabaseUser }));
app.use(createTextCorrectionRouter({
  requireSupabaseUser,
  saveCorrection,
  apiKey: groqApiKey,
  model: process.env.GROQ_MODEL
}));
app.use(createPhotoRouter({
  requireSupabaseUser,
  saveCorrection,
  apiKey: groqApiKey,
  model: process.env.GROQ_VISION_MODEL
}));

// O frontend React compilado é servido como arquivos estáticos.
const frontendBuild = path.join(__dirname, "../frontend/build/client");
const publicPages = [
  "/", "/index", "/index.html", "/cadastro", "/cadastro.html", "/nova", "/nova.html",
  "/resultado", "/resultado.html", "/foto", "/foto.html", "/exemplos", "/exemplos.html",
  "/historico", "/historico.html", "/evolucao", "/evolucao.html", "/perfil", "/perfil.html",
  "/recuperar", "/recuperar.html", "/privacidade", "/privacidade.html"
];
app.use(express.static(frontendBuild));
app.get(publicPages, (_req, res) => {
  res.sendFile(path.join(frontendBuild, "index.html"));
});

// 🚀 ROTA DE CORREÇÃO COM GROQ

app.use((error, _req, res, _next) => {
  console.error("Erro não tratado na API:", error);
  if (res.headersSent) return;
  if (error.type === "entity.too.large") return res.status(413).json({ erro: "A imagem excede o limite de envio. Reduza o tamanho e tente novamente." });
  res.status(500).json({ erro: "O servidor encontrou um erro. Tente novamente em instantes." });
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
