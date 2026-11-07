const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const directory = process.env.GROQ_METRICS_DIR || (process.env.VERCEL === '1'
  ? path.join(os.tmpdir(), 'portugues-groq-usage') : path.join(__dirname, '../../.groq-usage'));
const target = path.join(directory, 'events.jsonl');

// Only operational counters: never record essays, images, credentials or user IDs.
function recordEvent(event) {
  const entry = { timestamp: new Date().toISOString(), ...event };
  try {
    fs.mkdirSync(directory, { recursive: true });
    if (fs.existsSync(target) && fs.statSync(target).size >= 5 * 1024 * 1024) {
      fs.renameSync(target, target + '.previous');
    }
    fs.appendFileSync(target, JSON.stringify(entry) + '\n');
  } catch { /* Metrics must never interrupt a correction. */ }
  if (process.env.VERCEL === '1') console.info(JSON.stringify({ event: 'groq_metrics', ...entry }));
}

function count(value) { return Number.isSafeInteger(value) && value >= 0 ? value : null; }
function recordUsage(kind, model, attempt, response, data, started) {
  const usage = data?.usage;
  recordEvent({ type: 'provider', kind, model, attempt, status: response.status,
    durationMs: Date.now() - started,
    promptTokens: count(usage?.prompt_tokens), completionTokens: count(usage?.completion_tokens),
    totalTokens: count(usage?.total_tokens),
    cachedTokens: count(usage?.prompt_tokens_details?.cached_tokens),
    reasoningTokens: count(usage?.completion_tokens_details?.reasoning_tokens),
    finishReason: ['stop', 'length', 'content_filter', 'tool_calls'].includes(data?.choices?.[0]?.finish_reason)
      ? data.choices[0].finish_reason : null });
}

module.exports = { recordEvent, recordUsage };
