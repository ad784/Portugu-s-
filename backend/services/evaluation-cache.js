const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const inflight = new Map();
const memory = new Map();
const { recordEvent } = require("./groq-metrics");
const cacheLifetime = 24 * 60 * 60 * 1000;
const cacheDir =
  process.env.CORRECTION_CACHE_DIR ||
  (process.env.VERCEL === "1"
    ? path.join(os.tmpdir(), "portugues-corrections")
    : path.join(__dirname, "../../.correction-cache"));

function fingerprint(parts) {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}
function readCache(key) {
  const existing = memory.get(key);
  if (existing && Date.now() - existing.created < cacheLifetime)
    return structuredClone(existing.data);
  memory.delete(key);
  try {
    const target = path.join(cacheDir, key + ".json");
    if (Date.now() - fs.statSync(target).mtimeMs > cacheLifetime) {
      fs.unlinkSync(target);
      return null;
    }
    return JSON.parse(fs.readFileSync(target, "utf8"));
  } catch {
    return null;
  }
}
function writeCache(key, data) {
  memory.delete(key);
  memory.set(key, { created: Date.now(), data: structuredClone(data) });
  while (memory.size > 500) memory.delete(memory.keys().next().value);
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    const files = fs
      .readdirSync(cacheDir)
      .filter((file) => /^[a-f0-9]{64}\.json$/.test(file))
      .map((file) => ({
        file,
        modified: fs.statSync(path.join(cacheDir, file)).mtimeMs,
      }))
      .sort((a, b) => b.modified - a.modified);
    for (const [index, item] of files.entries())
      if (index >= 499 || Date.now() - item.modified > cacheLifetime)
        fs.unlinkSync(path.join(cacheDir, item.file));
    const target = path.join(cacheDir, key + ".json");
    const temporary =
      target + "." + require("node:crypto").randomUUID() + ".tmp";
    fs.writeFileSync(temporary, JSON.stringify(data));
    fs.renameSync(temporary, target);
  } catch (error) {
    console.warn("Cache temporário indisponível:", error.code || error.name);
  }
}
async function findSavedCorrection(req, hash) {
  if (req.isLocalDemo || !req.supabase?.from) return null;
  try {
    const { data, error } = await req.supabase
      .from("redacoes")
      .select("id, resultado, created_at")
      .eq("user_id", req.supabaseUser.id)
      .eq("avaliacao_hash", hash)
      .maybeSingle();
    return error ? null : data;
  } catch {
    return null;
  }
}
function singleFlight(key, operation) {
  if (inflight.has(key)) {
    recordEvent({ type: "reuse", source: "inflight" });
    return inflight.get(key);
  }
  const work = Promise.resolve()
    .then(operation)
    .finally(() => inflight.delete(key));
  inflight.set(key, work);
  return work;
}
module.exports = {
  fingerprint,
  readCache,
  writeCache,
  findSavedCorrection,
  singleFlight,
};
