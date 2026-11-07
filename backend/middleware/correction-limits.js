const users = new Map();
let active = 0;
const positive = (value, fallback) => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : fallback;

async function acquireCorrection(req) {
  const now = Date.now();
  const key = req.supabaseUser?.id || req.ip;
  const minuteLimit = positive(process.env.CORRECTIONS_PER_MINUTE, 4);
  const dayLimit = positive(process.env.CORRECTIONS_PER_DAY, 30);
  const concurrentLimit = positive(process.env.CORRECTIONS_CONCURRENT, 8);
  for (const [id, data] of users) if (now - data.dayStart > 86400000) users.delete(id);
  const data = users.get(key) || { dayStart: now, count: 0, attempts: [], active: 0 };
  data.attempts = data.attempts.filter(at => now - at < 60000);
  const reject = (message, seconds) => { const error = new Error(message); error.status = 429; error.retryAfterSeconds = seconds; throw error; };
  if (data.count >= dayLimit) reject('Você atingiu seu limite diário de correções. Tente novamente mais tarde.', Math.ceil((data.dayStart + 86400000 - now) / 1000));
  if (data.attempts.length >= minuteLimit) reject('Aguarde um pouco antes de enviar outra redação.', 60);
  if (data.active || active >= concurrentLimit) reject('Já há uma correção em andamento. Aguarde sua conclusão.', 15);
  data.attempts.push(now); data.count++; data.active++; active++;
  users.set(key, data);
  let released = false;
  const releaseLocal = () => { if (released) return; released = true; data.active--; active--; };
  const rollbackLocal = () => { releaseLocal(); data.count--; data.attempts.pop(); };
  if (!req.isLocalDemo && req.supabase?.rpc) {
    let reservation;
    try { reservation = await req.supabase.rpc('reserve_correction'); }
    catch { reservation = { error: true }; }
    if (reservation.error) {
      rollbackLocal();
      const error = new Error('Não foi possível confirmar o limite de correções. Tente novamente mais tarde.'); error.status = 503; throw error;
    }
    if (!reservation.data?.allowed) {
      rollbackLocal();
      reject('Seu limite de correções foi atingido ou já existe uma correção em andamento. Aguarde antes de tentar novamente.', reservation.data?.retry_after || 60);
    }
    return async () => {
      if (released) return;
      releaseLocal();
      try { await req.supabase.rpc('release_correction', { reservation: reservation.data.reservation }); }
      catch { /* The database lease expires even after a network failure. */ }
    };
  }
  return releaseLocal;
}
module.exports = { acquireCorrection };
