const express = require("express");

function createEssayRouter({ requireSupabaseUser, requireAdmin }) {
  const router = express.Router();

  router.get("/me", requireSupabaseUser, (req, res) => {
    res.json({
      email: req.supabaseUser?.email || null,
      role: req.isAdmin ? "admin" : "user"
    });
  });

  router.get("/redacoes", requireSupabaseUser, async (req, res) => {
    if (req.isLocalDemo) return res.json({ redacoes: [] });

    let { data, error } = await req.supabase
      .from("redacoes")
      .select("id, tipo, nota, linhas, tema, created_at, resultado")
      .order("created_at", { ascending: false });

    if (error && (error.code === "PGRST204" || /tema/i.test(error.message))) {
      ({ data, error } = await req.supabase
        .from("redacoes")
        .select("id, tipo, nota, linhas, created_at, resultado")
        .order("created_at", { ascending: false }));
    }

    if (error) {
      console.error("Erro ao consultar redações:", error.message);
      const permissionError = error.code === "42501" || /row-level security|permission denied/i.test(error.message);
      const message = permissionError
        ? "O Supabase recusou a leitura por permissão. Execute novamente a migration de políticas do Supabase."
        : "Não foi possível consultar as redações.";
      return res.status(500).json({ erro: message });
    }

    res.json({ redacoes: data });
  });

  router.get("/admin/redacoes", requireSupabaseUser, requireAdmin, async (req, res) => {
    if (req.isLocalDemo) return res.json({ redacoes: [] });

    const { data, error } = await req.supabase
      .from("redacoes")
      .select("id, user_id, tipo, nota, linhas, tema, created_at, resultado")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao consultar redações administrativas:", error.message);
      return res.status(500).json({ erro: "Não foi possível consultar as redações." });
    }

    res.json({ redacoes: data });
  });

  return router;
}

module.exports = { createEssayRouter };
