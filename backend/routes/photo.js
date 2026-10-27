const express = require("express");
const { analyzePhoto, uploadPhoto, parsePhotoDataUrl } = require("../services/photo-correction");

function createPhotoRouter({ requireSupabaseUser, saveCorrection, apiKey, model, analyze = analyzePhoto, upload = uploadPhoto }) {
  const router = express.Router();
  const allowPhotoDuringAuthOutage = (req, res, next) =>
    requireSupabaseUser(req, res, next, { continueOnAuthOutage: true });

  router.post(["/api/corrigir-foto", "/corrigir-foto"], allowPhotoDuringAuthOutage, async (req, res) => {
    const image = req.body?.imagem;
    try {
      parsePhotoDataUrl(image);
    } catch (error) {
      return res.status(400).json({ erro: error.message });
    }

    if (!apiKey) {
      return res.status(503).json({ erro: "A correção por foto está indisponível. Configure GROQ_API_KEY no servidor." });
    }

    try {
      const { result } = await analyze({ image, apiKey, model });
      if (req.isLocalDemo) return res.json({ resultado: result, salvo: true, aviso: null });
      if (req.authUnavailable) {
        return res.json({
          resultado: result,
          salvo: false,
          aviso: "A correção foi concluída, mas o Supabase está temporariamente indisponível. O resultado ficou salvo apenas neste dispositivo; o histórico da conta não foi atualizado."
        });
      }

      let imagePath = null;
      let photoWarning = null;
      try {
        imagePath = await upload(req.supabaseUser.id, image, () => req.supabase);
      } catch (error) {
        console.error("Não foi possível armazenar a foto:", error.message);
        photoWarning = "A correção foi salva no histórico, mas a imagem não foi armazenada. O administrador precisa aplicar as migrações de Storage do Supabase para criar o bucket redacoes e liberar o upload.";
      }

      const transcribedText = result.split(/\nRedacao:\n/i)[1]?.trim() || null;
      const persistence = await saveCorrection(req, {
        conteudo: transcribedText,
        resultado: result,
        tipo: "foto",
        imagemPath: imagePath
      });

      res.json({
        resultado: result,
        salvo: persistence.ok,
        aviso: photoWarning || (persistence.ok ? null : persistence.erro)
      });
    } catch (error) {
      console.error("Falha na correção por foto:", error.message);
      res.status(error.status || 502).json({
        erro: error.message || "Não foi possível corrigir a foto. Tente uma imagem mais nítida."
      });
    }
  });

  return router;
}

module.exports = { createPhotoRouter };
