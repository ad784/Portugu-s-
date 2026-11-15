function listProgress(req, offset) {
  return req.supabase
    .from("redacoes")
    .select("id, avaliacao_hash, nota, created_at, resultado")
    .eq("user_id", req.supabaseUser.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + 199);
}
function listHistory(req, page, pageSize) {
  return req.supabase
    .from("redacoes")
    .select(
      "id, tipo, nota, linhas, tema, avaliacao_hash, created_at, resultado",
    )
    .eq("user_id", req.supabaseUser.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
}
function listLegacyHistory(req, page, pageSize) {
  return req.supabase
    .from("redacoes")
    .select("id, tipo, nota, linhas, created_at, resultado")
    .eq("user_id", req.supabaseUser.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
}
function listAdminEssays(req) {
  return req.supabase
    .from("redacoes")
    .select("id, user_id, tipo, nota, linhas, tema, created_at, resultado")
    .order("created_at", { ascending: false });
}
module.exports = {
  listProgress,
  listHistory,
  listLegacyHistory,
  listAdminEssays,
};
