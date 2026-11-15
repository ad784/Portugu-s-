async function readAcceptance(req) {
  const { data, error } = await req.supabase
    .from("legal_acceptances")
    .select(
      "terms_version, privacy_version, ai_consent, accepted_at, revoked_at",
    )
    .eq("user_id", req.supabaseUser.id)
    .maybeSingle();
  if (error)
    throw new Error(
      "Não foi possível consultar seu aceite. Tente novamente mais tarde.",
    );
  return data;
}

function acceptTerms(req, body) {
  return req.supabase.rpc("accept_current_terms", {
    terms: body.termsVersion,
    privacy: body.privacyVersion,
  });
}
function revokeConsent(req) {
  return req.supabase.rpc("revoke_ai_consent");
}
module.exports = { readAcceptance, acceptTerms, revokeConsent };
