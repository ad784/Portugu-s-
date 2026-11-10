const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const {readNvidiaPhoto,analyzeNvidiaPhoto,DEFAULT_MODEL}=require('../backend/services/nvidia-photo');

async function main() {
  const key=process.env.NVIDIA_API_KEY?.trim();
  if(!key) throw new Error('NVIDIA_API_KEY não configurada. Entre em build.nvidia.com e configure a chave no .env. Nenhuma chamada foi realizada.');
  const fileArg=process.argv.slice(2).find(arg=>arg!=='--avaliar');
  if(!fileArg) throw new Error('Uso: node scripts/check-nvidia-photo.cjs "foto.jpg" [--avaliar]. A foto será enviada à NVIDIA; --avaliar também chama a Groq. Não salva no histórico.');
  const file=path.resolve(fileArg);
  if(fs.statSync(file).size>3*1024*1024)throw new Error('Use uma foto de até 3 MB.');
  const mime={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp'}[path.extname(file).toLowerCase()];
  if(!mime)throw new Error('Use JPG, PNG ou WEBP.');
  const options={image:`data:${mime};base64,${fs.readFileSync(file).toString('base64')}`,nvidiaApiKey:key,
    nvidiaModel:process.env.NVIDIA_VISION_MODEL?.trim()||DEFAULT_MODEL,userId:'local-nvidia-diagnostic'};
  if(process.argv.includes('--avaliar')) {
    const result=await analyzeNvidiaPhoto({...options,apiKey:process.env.GROQ_API_KEY,model:process.env.GROQ_MODEL||'openai/gpt-oss-120b'});
    console.log(JSON.stringify({leitura:'OK',avaliacao:'OK',cincoCompetencias:result.result.includes('5: '),observacao:'Confira a transcrição e a qualidade das notas no site. Este teste não salvou no histórico.'},null,2));
  } else {
    const text=await readNvidiaPhoto(options);
    console.log(JSON.stringify({leitura:'OK',caracteres:text.length,observacao:'Teste de leitura concluído. Não chama a Groq nem salva na conta.'},null,2));
  }
}
main().catch(error=>{console.error(error.message);if(error.retryAfterSeconds)console.error('Aguarde '+error.retryAfterSeconds+' segundos antes de repetir o mesmo comando.');process.exitCode=1;});
