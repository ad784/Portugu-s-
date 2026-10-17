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

      let imagePath = null;
      let photoWarning = null;
      try {
        imagePath = await upload(req.supabaseUser.id, image, () => req.supabase);
      } catch (error) {
        console.error("Nao foi possivel armazenar a foto:", error.message);
        photoWarning = "A correção foi salva, mas a imagem não ficou no histórico. O administrador precisa aplicar a migration de políticas de fotos no Supabase.";
      }
      const transcribedText = result.split(/\nRedacao:\n/i)[1]?.trim() || null;
      const persistence = await saveCorrection(req, { conteudo: transcribedText, resultado: result, tipo: "foto", imagemPath: imagePath });
      return res.json({ resultado: result, salvo: persistence.ok, aviso: photoWarning || (persistence.ok ? null : persistence.erro) });
    } catch (error) {
      console.error("Falha na correcao por foto:", error.message);
      return res.status(error.status || 502).json({ erro: error.message || "Nao foi possivel corrigir a foto. Tente uma imagem mais nitida." });
    }
  });
  return router;
}

module.exports = { createPhotoRouter };
