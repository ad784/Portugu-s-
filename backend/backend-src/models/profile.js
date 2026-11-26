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
function listExportTechnical(req, offset) {
  return req.supabase
    .from("technical_evaluations")
    .select(
      "id,mode,task_type,area,board,score,max_score,reference_based,payload,result,created_at",
    )
    .eq("user_id", req.supabaseUser.id)
    .order("created_at")
    .order("id")
    .range(offset, offset + 199);
}
function listExportExercises(req, offset) {
  return req.supabase
    .from("exercise_attempts")
    .select(
      "id,skill_id,level_id,question_ids,theme_id,answers,correct_count,question_count,original_text,revised_text,self_checks,revision_checks,material_version,created_at",
    )
    .eq("user_id", req.supabaseUser.id)
    .order("created_at")
    .order("id")
    .range(offset, offset + 199);
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
  listExportExercises,
  listExportTechnical,
  readName,
  saveName,
};
