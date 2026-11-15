module.exports = (error, _req, res, _next) => {
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
};
