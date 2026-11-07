// Parse only numeric quota information; never retain the raw provider message,
// which may contain organization identifiers.
function providerLimit(response, data) {
  const message = data?.error?.message || '';
  const value = name => {
    const match = message.match(new RegExp('\\b' + name + '\\s*:?\\s*([\\d,]+(?:\\.\\d+)?)', 'i'));
    return match ? Number(match[1].replace(/,/g, '')) : null;
  };
  const header = name => {
    const raw = response.headers?.get(name);
    const number = raw == null || raw === '' ? NaN : Number(raw);
    return Number.isFinite(number) && number >= 0 ? number : null;
  };
  const limit = value('Limit');
  const requested = value('Requested');
  const tooLarge = /request too large|reduce (?:your )?(?:message|input|requested)|exceeds.*(?:token|limit)/i.test(message)
    || (requested !== null && limit !== null && requested > limit);
  return {
    category: tooLarge ? 'request_too_large' : /tokens per day|requests per day|\bTPD\b|\bRPD\b/i.test(message) ? 'daily' : 'temporary',
    limit, requested, used: value('Used'),
    tokensPerMinute: header('x-ratelimit-limit-tokens'),
    remainingTokens: header('x-ratelimit-remaining-tokens'),
    remainingRequests: header('x-ratelimit-remaining-requests')
  };
}
module.exports = { providerLimit };
