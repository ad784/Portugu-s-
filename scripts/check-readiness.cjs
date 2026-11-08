const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
let failed = false;
function check(label, valid, hint) {
  console.log(`${valid ? 'OK' : 'PENDENTE'}: ${label}${!valid ? ' — ' + hint : ''}`);
  if (!valid) failed = true;
}
const env = process.env;
check('Node 22.22 ou superior', Number(process.versions.node.split('.')[0]) > 22 || (Number(process.versions.node.split('.')[0]) === 22 && Number(process.versions.node.split('.')[1]) >= 22), 'Atualize o Node.js.');
check('Chave de IA', !!env.GROQ_API_KEY && !/your-|example/i.test(env.GROQ_API_KEY), 'Configure GROQ_API_KEY somente no servidor.');
const { photoConfig } = require('../backend/services/photo-config');
const photo = photoConfig(env);
check('Leitor de fotos válido', ['groq', 'google'].includes(photo.provider), 'Use PHOTO_READER=groq ou google.');
if (photo.provider === 'google') check('Chave Google Vision', Boolean(photo.googleApiKey), 'Configure GOOGLE_VISION_API_KEY somente no servidor e aplique a migration de privacidade de 08/11.');
check('URL do Supabase', /^https:\/\/[^/]+\/?$/.test(env.SUPABASE_URL || ''), 'Configure SUPABASE_URL.');
let publicKey = /^sb_publishable_/.test(env.SUPABASE_PUBLISHABLE_KEY || '');
try { publicKey ||= JSON.parse(Buffer.from(env.SUPABASE_PUBLISHABLE_KEY.split('.')[1], 'base64url')).role === 'anon'; } catch {}
check('Chave Supabase pública', publicKey, 'Use publishable/anon, nunca service_role ou secret.');
check('Modo demo desativado', env.LOCAL_DEMO_AUTH !== 'true', 'Defina LOCAL_DEMO_AUTH=false.');
check('Origem de produção', /^https:\/\/[^/]+$/.test(env.APP_ORIGIN || ''), 'Defina APP_ORIGIN com o domínio HTTPS final, sem barra final.');
check('Build disponível', fs.existsSync(path.join(__dirname, '../frontend/build/client/index.html')), 'Execute npm.cmd run build.');
console.log('As verificações acima são locais; não certificam migrations, SMTP, domínio ou quota da IA.');
console.log('Execute as migrations pendentes em backend/supabase/migrations e siga docs/PUBLICACAO.md.');
process.exitCode = failed ? 1 : 0;
