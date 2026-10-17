// A chave fica junto do backend, independentemente da pasta em que o Node for iniciado.
// `override` evita que uma variável vazia do sistema esconda a chave do arquivo.
const dotenv = require("dotenv");
const envPath = require("path").join(__dirname, "../.env");
const envFile = dotenv.config({ path: envPath, quiet: true });
for (const [key, value] of Object.entries(envFile.parsed || {})) {
  if (!process.env[key]?.trim()) process.env[key] = value;
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

app.use(createEssayRouter({ requireSupabaseUser, requireAdmin }));
app.use(createProfileRouter({ requireSupabaseUser }));
app.use(createTextCorrectionRouter({ requireSupabaseUser, saveCorrection, apiKey: groqApiKey, model: process.env.GROQ_MODEL }));
app.use(createPhotoRouter({ requireSupabaseUser, saveCorrection, apiKey: groqApiKey, model: process.env.GROQ_VISION_MODEL }));

// Servir arquivos estaticos e resolver as paginas organizadas por pastas.
const frontendRoot = path.join(__dirname, "../frontend");
const frontendPages = path.join(frontendRoot, "pages");
const publicPages = new Set([
  "index", "cadastro", "nova", "resultado", "foto", "exemplos",
  "historico", "evolucao", "perfil", "recuperar", "privacidade"
]);
app.use(express.static(frontendRoot));
app.get("/:page", (req, res, next) => {
  const page = req.params.page.replace(/\.html$/, "");
  if (!publicPages.has(page)) return next();
  res.sendFile(path.join(frontendPages, `${page}.html`));
});

// Rota principal
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPages, "index.html"));
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
