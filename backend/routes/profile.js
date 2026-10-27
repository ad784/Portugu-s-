const express = require("express");

function createProfileRouter({ requireSupabaseUser }) {
  const router = express.Router();

  router.get("/", requireSupabaseUser, async (req, res) => {
    if (req.isLocalDemo) {
      return res.json({ perfil: { nome: "Estudante local", email: req.supabaseUser.email } });
    }

    const { data, error } = await req.supabase
      .from("profiles")
      .select("nome")
      .eq("id", req.supabaseUser.id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar perfil:", error.message);
      return res.status(500).json({ erro: "Não foi possível carregar seu perfil." });
    }

    res.json({ perfil: { nome: data?.nome || "", email: req.supabaseUser.email } });
  });

  router.put("/", requireSupabaseUser, async (req, res) => {
    const nome = typeof req.body?.nome === "string" ? req.body.nome.trim().slice(0, 120) : "";
    if (!nome) return res.status(400).json({ erro: "Informe seu nome para salvar o perfil." });
    if (req.isLocalDemo) return res.json({ perfil: { nome, email: req.supabaseUser.email } });

    const { error } = await req.supabase.from("profiles").upsert({ id: req.supabaseUser.id, nome });
    if (error) {
      console.error("Erro ao atualizar perfil:", error.message);
      return res.status(500).json({ erro: "Não foi possível atualizar seu perfil." });
    }

    res.json({ perfil: { nome, email: req.supabaseUser.email } });
  });

  return router;
}

module.exports = { createProfileRouter };
