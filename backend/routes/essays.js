const express = require("express");
const { saveCorrection, getScore } = require('../services/essay-storage');
const { fingerprint } = require('../services/evaluation-cache');

function createEssayRouter({ requireSupabaseUser, requireAdmin }) {
  const router = express.Router();

  router.get("/me", requireSupabaseUser, (req, res) => {
    res.json({
      email: req.supabaseUser?.email || null,
      role: req.isAdmin ? "admin" : "user"
    });
  });

  router.get('/evolucao', requireSupabaseUser, async (req, res) => {
    if (req.isLocalDemo) return res.json({ redacoes: [] });
    const records = [];
    for (let offset = 0; ; offset += 200) {
      const { data, error } = await req.supabase.from('redacoes').select('id, avaliacao_hash, nota, created_at, resultado')
        .eq('user_id', req.supabaseUser.id)
        .order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 199);
      if (error) return res.status(503).json({ erro: 'Não foi possível carregar sua evolução. Tente novamente.' });
      for (const record of data) {
        const competencias = Array(5).fill(null);
        for (const item of record.resultado.matchAll(/^\s*([1-5])\s*:\s*(\d{1,3})\s*(?:-|$)/gm)) competencias[Number(item[1]) - 1] = Number(item[2]);
        records.push({ id: record.id, hash: record.avaliacao_hash, nota: record.nota, created_at: record.created_at, competencias });
      }
      if (data.length < 200) break;
    }
    res.json({ redacoes: records });
  });

  router.post('/redacoes/sincronizar', requireSupabaseUser, async (req, res) => {
    const { resultado, tipo, tema = '', conteudo = null, hash, created_at } = req.body || {};
    if (typeof resultado !== 'string' || resultado.length > 40000 || !['texto', 'foto'].includes(tipo) || typeof tema !== 'string' || tema.length > 500 || (conteudo !== null && (typeof conteudo !== 'string' || conteudo.length > 12000))) {
      return res.status(400).json({ erro: 'Os dados da avaliação não são válidos.' });
    }
    const scores = [...resultado.matchAll(/^\s*([1-5])\s*:\s*(\d{1,3})\s*(?:-|$)/gm)];
    if (scores.length !== 5 || new Set(scores.map(item => item[1])).size !== 5 || scores.some(item => ![0,40,80,120,160,200].includes(Number(item[2]))) || scores.reduce((sum, item) => sum + Number(item[2]), 0) !== getScore(resultado)) {
      return res.status(400).json({ erro: 'O relatório de avaliação está incompleto.' });
    }
    const avaliacaoHash = typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash) ? hash : fingerprint([req.supabaseUser.id, tipo, resultado, tema]);
    const createdAt = typeof created_at === 'string' && Number.isFinite(Date.parse(created_at)) && Date.parse(created_at) <= Date.now() ? new Date(created_at).toISOString() : null;
    const saved = await saveCorrection(req, { resultado, tipo, tema, conteudo, avaliacaoHash, createdAt });
    return res.status(saved.ok ? 200 : 503).json(saved.ok ? { salvo: true, id: saved.id, hash: avaliacaoHash } : { erro: saved.erro });
  });

  router.get("/redacoes", requireSupabaseUser, async (req, res) => {
    if (req.isLocalDemo) return res.json({ redacoes: [] });

    const page = Math.max(0, Math.min(10000, Number.parseInt(req.query.page, 10) || 0));
    const pageSize = 50;
    let { data, error } = await req.supabase
      .from("redacoes")
      .select("id, tipo, nota, linhas, tema, avaliacao_hash, created_at, resultado")
      .eq('user_id', req.supabaseUser.id)
      .order("created_at", { ascending: false }).order('id', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);

    if (error && (error.code === "PGRST204" || /tema/i.test(error.message))) {
      ({ data, error } = await req.supabase
        .from("redacoes")
        .select("id, tipo, nota, linhas, created_at, resultado")
        .eq('user_id', req.supabaseUser.id)
        .order("created_at", { ascending: false }).order('id', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1));
    }

    if (error) {
      console.error("Erro ao consultar redações:", error.message);
      return res.status(503).json({ erro: 'Não foi possível carregar o histórico da conta. Tente novamente em instantes.' });
    }

    res.json({ redacoes: data, page, hasMore: data.length === pageSize });
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
