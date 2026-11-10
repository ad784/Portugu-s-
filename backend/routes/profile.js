const express = require("express");

function createProfileRouter({ requireSupabaseUser }) {
  const router = express.Router();
  router.get("/exportar", requireSupabaseUser, async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (req.isLocalDemo)
      return res.json({
        perfil: { email: req.supabaseUser.email },
        redacoes: [],
      });
    try {
      const profile = await req.supabase
        .from("profiles")
        .select("nome, created_at")
        .eq("id", req.supabaseUser.id)
        .maybeSingle();
      const receipt = await req.supabase
        .from("legal_acceptances")
        .select(
          "terms_version, privacy_version, ai_consent, accepted_at, revoked_at",
        )
        .eq("user_id", req.supabaseUser.id)
        .maybeSingle();
      if (profile.error || receipt.error)
        throw new Error("Consulta indisponível");
      const events = [];
      for (let offset = 0; ; offset += 200) {
        const page = await req.supabase
          .from("legal_events")
          .select("event, terms_version, privacy_version, created_at")
          .eq("user_id", req.supabaseUser.id)
          .order("created_at")
          .order("id")
          .range(offset, offset + 199);
        if (page.error) throw page.error;
        events.push(...page.data);
        if (page.data.length < 200) break;
      }
      const redacoes = [];
      for (let offset = 0; ; offset += 200) {
        const page = await req.supabase
          .from("redacoes")
          .select(
            "id, tipo, conteudo, resultado, nota, linhas, tema, imagem_path, created_at",
          )
          .eq("user_id", req.supabaseUser.id)
          .order("created_at")
          .order("id")
          .range(offset, offset + 199);
        if (page.error) throw page.error;
        redacoes.push(...page.data);
        if (page.data.length < 200) break;
      }
      res.json({
        exportadoEm: new Date().toISOString(),
        perfil: { ...profile.data, email: req.supabaseUser.email },
        aceite: receipt.data,
        eventosDePrivacidade: events,
        redacoes,
        fotos:
          "As referências de arquivos são privadas. Solicite uma cópia das imagens ao contato do site.",
      });
    } catch {
      res.status(503).json({
        erro: "Não foi possível exportar seus dados. Tente novamente ou solicite uma cópia pelo contato do site.",
      });
    }
  });

  router.get("/", requireSupabaseUser, async (req, res) => {
    if (req.isLocalDemo) {
      return res.json({
        perfil: { nome: "Estudante local", email: req.supabaseUser.email },
      });
    }

    const { data, error } = await req.supabase
      .from("profiles")
      .select("nome")
      .eq("id", req.supabaseUser.id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar perfil:", error.message);
      return res
        .status(500)
        .json({ erro: "Não foi possível carregar seu perfil." });
    }

    res.json({
      perfil: { nome: data?.nome || "", email: req.supabaseUser.email },
    });
  });

  router.put("/", requireSupabaseUser, async (req, res) => {
    const nome =
      typeof req.body?.nome === "string"
        ? req.body.nome.trim().slice(0, 120)
        : "";
    if (!nome)
      return res
        .status(400)
        .json({ erro: "Informe seu nome para salvar o perfil." });
    if (req.isLocalDemo)
      return res.json({ perfil: { nome, email: req.supabaseUser.email } });

    const { error } = await req.supabase
      .from("profiles")
      .upsert({ id: req.supabaseUser.id, nome });
    if (error) {
      console.error("Erro ao atualizar perfil:", error.message);
      return res
        .status(500)
        .json({ erro: "Não foi possível atualizar seu perfil." });
    }

    res.json({ perfil: { nome, email: req.supabaseUser.email } });
  });

  return router;
}

module.exports = { createProfileRouter };
