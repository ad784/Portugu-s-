const express = require("express");
const { analyzePhoto, uploadPhoto, parsePhotoDataUrl } = require("../services/photo-correction");

function createPhotoRouter({ requireSupabaseUser, saveCorrection, apiKey, model, analyze = analyzePhoto, upload = uploadPhoto }) {
  const router = express.Router();
  router.post(["/corrigir-foto", "/api/corrigir-foto"], requireSupabaseUser, async (req, res) => {
    const image = req.body?.imagem;
    try {
      parsePhotoDataUrl(image);
    } catch (error) {
      return res.status(400).json({ erro: error.message });
    }
    if (!apiKey) return res.status(503).json({ erro: "A correcao por foto esta indisponivel. Configure GROQ_API_KEY no servidor." });
    try {
      const { result } = await analyze({ image, apiKey, model });
      if (req.isLocalDemo) return res.json({ resultado: result, salvo: true, aviso: null });

      const imagePath = await upload(req.supabaseUser.id, image, () => req.supabase);
      const transcribedText = result.split(/\nRedacao:\n/i)[1]?.trim() || null;
      const persistence = await saveCorrection(req, { conteudo: transcribedText, resultado: result, tipo: "foto", imagemPath: imagePath });
      if (!persistence.ok) {
        await req.supabase.storage.from("redacoes").remove([imagePath]);
        return res.status(503).json({ erro: persistence.erro });
      }
      return res.json({ resultado: result, salvo: true, aviso: null });
    } catch (error) {
      console.error("Falha na correcao por foto:", error.message);
      const status = error.status || (error.message.includes("Storage") || error.message.includes("bucket") ? 503 : 502);
      const storageError = /storage|bucket|row-level security|permission denied/i.test(error.message);
      return res.status(status).json({ erro: storageError
        ? "Nao foi possivel salvar a imagem. Aplique a migration de politicas do Storage no Supabase e tente novamente."
        : error.message || "Nao foi possivel corrigir a foto. Tente uma imagem mais nitida." });
    }
  });
  return router;
}

module.exports = { createPhotoRouter };
