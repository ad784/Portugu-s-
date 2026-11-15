function readProfile(req) {
  return req.supabase
    .from("profiles")
    .select("nome, created_at")
    .eq("id", req.supabaseUser.id)
    .maybeSingle();
}
function readReceipt(req) {
  return req.supabase
    .from("legal_acceptances")
    .select(
      "terms_version, privacy_version, ai_consent, accepted_at, revoked_at",
    )
    .eq("user_id", req.supabaseUser.id)
    .maybeSingle();
}
function listLegalEvents(req, offset) {
  return req.supabase
    .from("legal_events")
    .select("event, terms_version, privacy_version, created_at")
    .eq("user_id", req.supabaseUser.id)
    .order("created_at")
    .order("id")
    .range(offset, offset + 199);
}
function listExportEssays(req, offset) {
  return req.supabase
    .from("redacoes")
    .select(
      "id, tipo, conteudo, resultado, nota, linhas, tema, imagem_path, created_at",
    )
    .eq("user_id", req.supabaseUser.id)
    .order("created_at")
    .order("id")
    .range(offset, offset + 199);
}
function readName(req) {
  return req.supabase
    .from("profiles")
    .select("nome")
    .eq("id", req.supabaseUser.id)
    .maybeSingle();
}
function saveName(req, nome) {
  return req.supabase
    .from("profiles")
    .upsert({ id: req.supabaseUser.id, nome });
}
module.exports = {
  readProfile,
  readReceipt,
  listLegalEvents,
  listExportEssays,
  readName,
  saveName,
};
