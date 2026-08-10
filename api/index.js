let app;

try {
  app = require("../backend/server");
} catch (error) {
  // Evita que uma falha de inicializacao vire a pagina generica 500 da Vercel.
  // O erro completo permanece nos logs da Function para investigacao.
  console.error("Falha ao iniciar a API:", error);
  app = (_req, res) => {
    res.status(500).json({ erro: "A API nao conseguiu iniciar. Consulte os logs da Vercel." });
  };
}

module.exports = app;
