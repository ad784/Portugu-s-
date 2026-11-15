const app = require("./app");
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const server = app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log(
      `Chave Groq: ${process.env.GROQ_API_KEY?.trim() ? "carregada" : "ausente"}`,
    );
  });

  server.on("close", () => console.log("Servidor encerrado."));
  process.on("SIGINT", () => server.close(() => process.exit(0)));
  process.on("SIGTERM", () => server.close(() => process.exit(0)));
}

module.exports = app;
