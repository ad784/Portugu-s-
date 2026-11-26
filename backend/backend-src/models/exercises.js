const fields =
  "id,skill_id,level_id,question_ids,theme_id,answers,correct_count,question_count,original_text,revised_text,self_checks,revision_checks,material_version,created_at";

function listAttempts(req, page, size = 50) {
  return req.supabase
    .from("exercise_attempts")
    .select(fields)
    .eq("user_id", req.supabaseUser.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(page * size, (page + 1) * size - 1);
}

async function saveAttempt(req, record) {
  const { error } = await req.supabase
    .from("exercise_attempts")
    .upsert(
      { ...record, user_id: req.supabaseUser.id },
      { onConflict: "user_id,id", ignoreDuplicates: true },
    );
  if (error) return { error };
  // Retrying a completed request returns its original attempt instead of creating another one.
  return req.supabase
    .from("exercise_attempts")
    .select(fields)
    .eq("user_id", req.supabaseUser.id)
    .eq("id", record.id)
    .single();
}

module.exports = { listAttempts, saveAttempt };
