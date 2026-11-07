const fs = require('node:fs');
const path = require('node:path');
const directory = process.env.GROQ_METRICS_DIR || path.join(__dirname, '../.groq-usage');
const totals = { chamadas: 0, tentativasExtras: 0, falhasHTTP: 0, chamadasSemConsumoInformado: 0,
  tokensEntrada: 0, tokensSaida: 0, tokensTotais: 0, tokensEntradaEmCache: 0,
  chamadasSemCacheInformado: 0, reaproveitamentos: {} };
for (const file of ['events.jsonl.previous', 'events.jsonl']) {
  const target = path.join(directory, file);
  if (!fs.existsSync(target)) continue;
  for (const line of fs.readFileSync(target, 'utf8').split('\n')) {
    let event;
    try { event = JSON.parse(line); } catch { continue; }
    if (event.type === 'reuse') {
      const source = event.source;
      totals.reaproveitamentos[source] = (totals.reaproveitamentos[source] || 0) + 1;
    }
    if (event.type !== 'provider') continue;
    totals.chamadas++;
    if (event.attempt > 1) totals.tentativasExtras++;
    if (event.status >= 400) totals.falhasHTTP++;
    if (event.totalTokens == null) totals.chamadasSemConsumoInformado++;
    if (event.cachedTokens == null) totals.chamadasSemCacheInformado++;
    totals.tokensEntrada += event.promptTokens || 0;
    totals.tokensSaida += event.completionTokens || 0;
    totals.tokensTotais += event.totalTokens || 0;
    totals.tokensEntradaEmCache += event.cachedTokens || 0;
  }
}
console.log(JSON.stringify(totals, null, 2));
