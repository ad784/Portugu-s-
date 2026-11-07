const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createLegalRouter, requireLegalAcceptance } = require('../backend/routes/legal');
const legal = require('../shared/legal.json');
const { acquireCorrection } = require('../backend/middleware/correction-limits');
test('private Supabase keys never qualify for browser configuration', () => {
  const { isPublicSupabaseKey } = require('../backend/services/public-config');
  assert.equal(isPublicSupabaseKey('sb_secret_private'), false);
  const jwt = role => `header.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;
  assert.equal(isPublicSupabaseKey(jwt('service_role')), false);
  assert.equal(isPublicSupabaseKey(jwt('anon')), true);
  assert.equal(isPublicSupabaseKey('sb_publishable_public'), true);
});

test('server blocks corrections without current consent, supports withdrawal and preserves server receipt', async t => {
  let receipt = null;
  let unavailable = false;
  const serverTime = '2026-10-30T12:00:00.000Z';
  const auth = (req, res, next) => {
    if (!req.get('authorization')) return res.sendStatus(401);
    req.supabaseUser = { id: 'owner' };
    req.supabase = {
      from: () => ({ select: () => ({ eq: (column, value) => {
        assert.equal(column, 'user_id'); assert.equal(value, 'owner');
        return { maybeSingle: async () => ({ data: receipt, error: unavailable ? { code: 'MISSING_MIGRATION' } : null }) };
      } }) }),
      rpc: async (name, input) => {
        if (name === 'revoke_ai_consent') receipt.revoked_at = serverTime;
        else receipt = { terms_version: input.terms, privacy_version: input.privacy, ai_consent: true, accepted_at: serverTime, revoked_at: null };
        return { error: null };
      }
    };
    next();
  };
  const app = express(); app.use(express.json());
  app.use('/api/termos', createLegalRouter({ requireSupabaseUser: auth }));
  app.post('/correction', auth, requireLegalAcceptance, (_req, res) => res.json({ authorized: true }));
  const server = app.listen(0); t.after(() => new Promise(resolve => server.close(resolve)));
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const headers = { Authorization: 'Bearer test', 'Content-Type': 'application/json' };
  assert.equal((await fetch(base + '/api/termos')).status, 401);
  assert.equal((await fetch(base + '/correction', { method: 'POST', headers })).status, 428);
  const accepted = { termsVersion: legal.termsVersion, privacyVersion: legal.privacyVersion, acceptTerms: true, aiConsent: true, accepted_at: '1900-01-01' };
  for (const body of [{ ...accepted, aiConsent: false }, { ...accepted, termsVersion: 'old' }, { ...accepted, acceptTerms: false }]) {
    assert.equal((await fetch(base + '/api/termos', { method: 'POST', headers, body: JSON.stringify(body) })).status, 400);
  }
  const response = await fetch(base + '/api/termos', { method: 'POST', headers, body: JSON.stringify(accepted) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).receipt.accepted_at, serverTime);
  assert.equal((await fetch(base + '/correction', { method: 'POST', headers })).status, 200);
  assert.equal((await fetch(base + '/api/termos', { method: 'DELETE', headers })).status, 200);
  assert.equal((await fetch(base + '/correction', { method: 'POST', headers })).status, 428);
  const renewed = await fetch(base + '/api/termos', { method: 'POST', headers, body: JSON.stringify(accepted) });
  assert.equal(renewed.status, 200);
  assert.equal((await fetch(base + '/correction', { method: 'POST', headers })).status, 200);
  unavailable = true;
  assert.equal((await fetch(base + '/correction', { method: 'POST', headers })).status, 503);
});

test('distributed quota releases its lease and refuses an unavailable counter', async () => {
  const calls = [];
  const req = { supabaseUser: { id: 'quota-owner' }, supabase: { rpc: async (name, args) => {
    calls.push({ name, args });
    return { data: { allowed: true, reservation: 'ticket' }, error: null };
  } } };
  const release = await acquireCorrection(req);
  await assert.rejects(acquireCorrection(req), error => error.status === 429);
  await release();
  assert.equal(calls[0].name, 'reserve_correction');
  assert.deepEqual(calls[1], { name: 'release_correction', args: { reservation: 'ticket' } });
  req.supabase.rpc = async () => ({ error: true });
  await assert.rejects(acquireCorrection(req), error => error.status === 503);
});

test('distributed quota honors rejection and provider wait duration', async () => {
  const req = { supabaseUser: { id: 'quota-rejected' }, supabase: { rpc: async () => ({ data: { allowed: false, retry_after: 123 }, error: null }) } };
  await assert.rejects(acquireCorrection(req), error => error.status === 429 && error.retryAfterSeconds === 123);
});

test('failed quota checks do not exhaust the local minute limit and release is idempotent', async () => {
  let fail = true, releases = 0;
  const req = { supabaseUser: { id: 'quota-retry-after-outage' }, supabase: { rpc: async name => {
    if (name === 'release_correction') { releases++; return { error: null }; }
    return fail ? { error: true } : { data: { allowed: true, reservation: 'reserved' }, error: null };
  } } };
  for (let index = 0; index < 6; index++) await assert.rejects(acquireCorrection(req), error => error.status === 503);
  fail = false;
  const release = await acquireCorrection(req); await release(); await release();
  assert.equal(releases, 1);
});
