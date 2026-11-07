function isPublicSupabaseKey(key) {
  if (typeof key !== 'string') return false;
  if (key.startsWith('sb_publishable_')) return true;
  try { return JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role === 'anon'; }
  catch { return false; }
}
module.exports = { isPublicSupabaseKey };
