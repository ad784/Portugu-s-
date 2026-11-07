const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'groq-metrics-test-'));
process.env.GROQ_METRICS_DIR = path.join(root, 'metrics');
// Deliberately unavailable disk cache: it is a file, not a directory.
process.env.CORRECTION_CACHE_DIR = path.join(root, 'blocked');
fs.writeFileSync(process.env.CORRECTION_CACHE_DIR, 'blocked');
const { recordUsage } = require('../backend/services/groq-metrics');
const { singleFlight, readCache, writeCache, fingerprint } = require('../backend/services/evaluation-cache');
test.after(() => fs.rmSync(root, { recursive: true, force: true }));

test('counts provider usage and retry separately without recording private content', () => {
  const data = { usage: { prompt_tokens: 100, completion_tokens: 40, total_tokens: 140,
    prompt_tokens_details: { cached_tokens: 80 }, completion_tokens_details: { reasoning_tokens: 10 } },
    choices: [{ finish_reason: 'stop', message: { content: 'PRIVATE ESSAY' } }], secret: 'PRIVATE KEY' };
  recordUsage('texto', 'model', 1, { status: 200 }, data, Date.now());
  recordUsage('texto', 'model', 2, { status: 500 }, {}, Date.now());
  const raw = fs.readFileSync(path.join(process.env.GROQ_METRICS_DIR, 'events.jsonl'), 'utf8');
  const [first, second] = raw.trim().split('\n').map(JSON.parse);
  assert.equal(first.totalTokens, 140);
  assert.equal(first.cachedTokens, 80);
  assert.equal(first.reasoningTokens, 10);
  assert.equal(second.attempt, 2);
  assert.equal(second.totalTokens, null, 'unknown usage is not reported as zero');
  assert.doesNotMatch(raw, /PRIVATE/);
});

test('parallel requests share one call and retain identical score when disk is unavailable', async () => {
  const key = fingerprint(['student', 'same essay', 'same model and rubric']);
  const result = { resultado: 'Nota: 840\n1: 160\n2: 160\n3: 160\n4: 160\n5: 200', salvo: false };
  let calls = 0;
  const operation = async () => {
    const cached = readCache(key);
    if (cached) return cached;
    calls++;
    await new Promise(resolve => setImmediate(resolve));
    writeCache(key, result);
    return result;
  };
  const responses = await Promise.all(Array.from({ length: 8 }, () => singleFlight(key, operation)));
  responses.forEach(response => assert.deepEqual(response, result));
  assert.deepEqual(await singleFlight(key, operation), result);
  assert.equal(calls, 1);
  const detached = readCache(key);
  detached.resultado = 'changed';
  assert.deepEqual(readCache(key), result, 'cache does not change if a caller mutates its copy');
  assert.equal(readCache(fingerprint(['another student', 'same essay'])), null);
});

test('failed work releases duplicate lock for a later retry', async () => {
  await assert.rejects(singleFlight('failed', async () => { throw new Error('offline'); }), /offline/);
  assert.equal(await singleFlight('failed', async () => 'recovered'), 'recovered');
});
