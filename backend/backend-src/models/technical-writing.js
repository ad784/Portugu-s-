const summaryFields =
  "id,mode,task_type,area,board,score,max_score,reference_based,created_at";
const detailFields = summaryFields + ",payload,result,evaluation_hash";
function findByHash(req, hash) {
  return req.supabase
    .from("technical_evaluations")
    .select(detailFields)
    .eq("user_id", req.supabaseUser.id)
    .eq("evaluation_hash", hash)
    .maybeSingle();
}
function findById(req, id) {
  return req.supabase
    .from("technical_evaluations")
    .select(detailFields)
    .eq("user_id", req.supabaseUser.id)
    .eq("id", id)
    .maybeSingle();
}
function list(req, page, mode) {
  let query = req.supabase
    .from("technical_evaluations")
    .select(summaryFields)
    .eq("user_id", req.supabaseUser.id);
  if (mode) query = query.eq("mode", mode);
  return query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(page * 30, page * 30 + 29);
}
async function save(req, hash, payload, result) {
  const { error } = await req.supabase
    .from("technical_evaluations")
    .upsert(
      {
        user_id: req.supabaseUser.id,
        evaluation_hash: hash,
        mode: payload.mode,
        task_type: payload.taskType,
        area: payload.area,
        board: payload.board,
        score: result.score,
        max_score: result.maxScore,
        reference_based: result.referenceBased,
        payload,
        result,
      },
      { onConflict: "user_id,evaluation_hash", ignoreDuplicates: true },
    );
  if (error) return { error };
  return findByHash(req, hash);
}
module.exports = { findByHash, findById, list, save };
