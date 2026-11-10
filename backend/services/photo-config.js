function photoConfig(env = process.env) {
  const googleApiKey = env.GOOGLE_VISION_API_KEY?.trim() || '';
  return { provider: env.PHOTO_READER?.trim() || (googleApiKey ? 'google' : 'groq'), googleApiKey,
    nvidiaApiKey: env.NVIDIA_API_KEY?.trim() || '',
    nvidiaModel: env.NVIDIA_VISION_MODEL?.trim() || 'nvidia/nemotron-3.5-super-vl-120b-a12b',
    textModel: env.GROQ_MODEL?.trim() || 'openai/gpt-oss-120b' };
}
function legalVersions() {
  const base = require('../../shared/legal.json');
  const provider = photoConfig().provider;
  return { ...base, privacyVersion: provider === 'nvidia' ? '2026-11-10' : provider === 'google' ? '2026-11-08' : base.privacyVersion };
}
module.exports = { photoConfig, legalVersions };
