function photoConfig(env = process.env) {
  const googleApiKey = env.GOOGLE_VISION_API_KEY?.trim() || "";
  return {
    provider: env.PHOTO_READER?.trim() || (googleApiKey ? "google" : "groq"),
    googleApiKey,
    textModel: env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b",
  };
}
function legalVersions() {
  const base = require("../../shared/legal.json");
  return {
    ...base,
    privacyVersion:
      photoConfig().provider === "google" ? "2026-11-08" : base.privacyVersion,
  };
}
module.exports = { photoConfig, legalVersions };
