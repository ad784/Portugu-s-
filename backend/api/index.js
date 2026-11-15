let app;

try {
  app = require("../backend-src/app");
} catch (error) {
  console.error("Falha ao iniciar a API:", error);
  app = (_req, res) => {
    res.status(500).json({
      erro: "A API não conseguiu iniciar. Consulte os logs da Vercel.",
    });
  };
}

module.exports = app;
