const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { readGooglePhoto } = require('../backend/services/google-photo');
const rules = require('../backend/services/writing-rules');

async function main() {
  const key = process.env.GOOGLE_VISION_API_KEY?.trim();
  if (!key) throw new Error('GOOGLE_VISION_API_KEY não configurada. Ative a Cloud Vision API e configure a chave no .env. Nenhuma chamada foi realizada.');
  if (!process.argv[2]) throw new Error('Uso: node scripts/check-google-vision.cjs "caminho-da-foto.jpg". O teste envia somente essa foto ao Google, sem corrigir nem salvar na conta.');
  const file = path.resolve(process.argv[2]);
  if (fs.statSync(file).size > 3 * 1024 * 1024) throw new Error('Use uma foto de até 3 MB.');
  const extension = path.extname(file).toLowerCase();
  const mime = {'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'}[extension];
  if (!mime) throw new Error('Use JPG, PNG ou WEBP.');
  const text = await readGooglePhoto({image:`data:${mime};base64,${fs.readFileSync(file).toString('base64')}`,googleApiKey:key});
  console.log(JSON.stringify({leitura:'OK',caracteres:text.length,linhasReferencia:rules.estimateLines(text),observacao:'A leitura real funcionou. Confira a transcrição e a avaliação completa pelo site; este teste não chamou a Groq.'},null,2));
}
main().catch(error=>{console.error(error.status ? error.message : error.code && !/ENOENT|EACCES/.test(error.code) ? 'Falha no teste de leitura.' : error.message);process.exitCode=1;});
