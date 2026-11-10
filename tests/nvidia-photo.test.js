const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'portugues-nvidia-'));
process.env.CORRECTION_CACHE_DIR = path.join(directory, 'cache');
process.env.GROQ_METRICS_DIR = path.join(directory, 'metrics');
const { readNvidiaPhoto, analyzeNvidiaPhoto, DEFAULT_MODEL } = require('../backend/services/nvidia-photo');
const { photoConfig, legalVersions } = require('../backend/services/photo-config');
const { isAccepted } = require('../backend/routes/legal');
const { PROMPT_CORRECAO_ENEM } = require('../backend/services/essay-storage');
const image = 'data:image/jpeg;base64,' + Buffer.from([255,216,1,2,255,217]).toString('base64');
const text = Array(8).fill('A educação brasileira exige políticas públicas consistentes e formação adequada para ampliar o acesso de todos os cidadãos.').join('\n');
const correction = { nota_final:800, justificativa_nota:'Avaliação dos critérios.', competencias:Array.from({length:5},(_,i)=>({competencia:i+1,nota:160,comentario:'Comentário da competência '+(i+1),requisitos:[]})),erros:[],sugestoes:[] };
const response = (status, data, headers = {}) => ({ status, ok:status>=200&&status<300, json:async()=>data, headers:{get:name=>headers[name]||null} });
const complete = () => response(200,{choices:[{finish_reason:'stop',message:{content:JSON.stringify({transcricao:text})}}],usage:{prompt_tokens:100,completion_tokens:200}});
test.after(()=>fs.rmSync(directory,{recursive:true,force:true}));

test('NVIDIA reader sends only a transcription request to the fixed hosted endpoint',async()=>{
  let payload;
  const actual=await readNvidiaPhoto({image,nvidiaApiKey:'private-test-key',fetchImpl:async(url,options)=>{
    assert.equal(url,'https://integrate.api.nvidia.com/v1/chat/completions');
    assert.equal(options.headers.Authorization,'Bearer private-test-key');
    payload=JSON.parse(options.body); return complete();
  }});
  assert.equal(actual,text);
  assert.equal(payload.model,DEFAULT_MODEL);
  assert.equal(payload.stream,false);
  assert.equal(payload.reasoning_effort,'none');
  assert.equal(payload.messages[1].content[1].image_url.url,image);
  assert.equal(payload.response_format.json_schema.schema.required[0],'transcricao');
  assert.doesNotMatch(payload.messages[0].content,/C1|competencias/);
});

test('missing NVIDIA key never makes a network request',async()=>{
  let calls=0;
  await assert.rejects(readNvidiaPhoto({image,fetchImpl:async()=>{calls++;}}),/chave de API/);
  assert.equal(calls,0);
});

test('truncated and malformed transcripts never reach grading',async()=>{
  for(const data of [
    {choices:[{finish_reason:'length',message:{content:JSON.stringify({transcricao:text})}}]},
    {choices:[{finish_reason:'stop',message:{content:'no valid JSON'}}]},
    {choices:[{finish_reason:'stop',message:{content:JSON.stringify({transcricao:''})}}]}
  ]){
    let graded=false;
    await assert.rejects(analyzeNvidiaPhoto({image,nvidiaApiKey:'test',apiKey:'groq-test',fetchImpl:async()=>response(200,data),evaluate:async()=>{graded=true;}}));
    assert.equal(graded,false);
  }
});

test('202 jobs resume with GET after temporary failures instead of duplicate POSTs',async()=>{
  const id='11111111-1111-4111-8111-111111111111';
  const calls=[];
  const replies=[response(202,{}, {'nvcf-reqid':id}),response(503,{error:{message:'Unavailable'}}),complete()];
  const input={image,nvidiaApiKey:'test',userId:'job-owner',fetchImpl:async(url,options)=>{calls.push({url,method:options.method});return replies.shift();}};
  await assert.rejects(readNvidiaPhoto(input),error=>error.code==='PHOTO_PROVIDER_BUSY');
  await assert.rejects(readNvidiaPhoto(input),error=>error.code==='PHOTO_PROVIDER_UNAVAILABLE');
  assert.equal(await readNvidiaPhoto(input),text);
  assert.deepEqual(calls.map(call=>call.method),['POST','GET','GET']);
  assert.equal(calls[1].url,'https://integrate.api.nvidia.com/v1/status/'+id);
});

test('pending identifiers are validated and cannot redirect the API key elsewhere',async()=>{
  await assert.rejects(readNvidiaPhoto({image,nvidiaApiKey:'test',userId:'bad-job',fetchImpl:async()=>response(202,{}, {'nvcf-reqid':'https://another.example/steal'})}),error=>error.code==='PHOTO_PROVIDER_PENDING'&&!error.retryAfterSeconds);
});

test('NVIDIA quotas and authorization failures remain distinct',async()=>{
  await assert.rejects(readNvidiaPhoto({image,nvidiaApiKey:'test',fetchImpl:async()=>response(429,{error:{message:'Rate limit'}},{'retry-after':'22'})}),error=>error.code==='PHOTO_PROVIDER_BUSY'&&error.retryAfterSeconds===22);
  await assert.rejects(readNvidiaPhoto({image,nvidiaApiKey:'test',fetchImpl:async()=>response(429,{error:{message:'Requests per day'}})}),error=>error.code==='PHOTO_DAILY_LIMIT');
  await assert.rejects(readNvidiaPhoto({image,nvidiaApiKey:'test',fetchImpl:async()=>response(401,{})}),error=>error.code==='PHOTO_PROVIDER_AUTH');
  await assert.rejects(readNvidiaPhoto({image,nvidiaApiKey:'test',fetchImpl:async()=>response(429,{error:{message:'Request too large: Limit 1000, Requested 2000'}})}),error=>error.code==='PHOTO_REQUEST_TOO_LARGE'&&!error.retryAfterSeconds);
});

test('full NVIDIA pipeline retains the existing text rubric and reuses completed OCR',async()=>{
  const original=global.fetch;
  const calls=[];
  let gradeAttempts=0;
  global.fetch=async(url,options)=>{
    const payload=JSON.parse(options.body); calls.push({url,payload});
    if(String(url).startsWith('https://integrate.api.nvidia.com/'))return complete();
    gradeAttempts++;
    if(gradeAttempts===1)return response(429,{error:{message:'tokens per minute: try again in 12s'}},{'retry-after':'12'});
    return response(200,{choices:[{message:{content:JSON.stringify(correction)}}]});
  };
  const input={image,nvidiaApiKey:'test',apiKey:'groq-test',userId:'pipeline'};
  try{
    await assert.rejects(analyzeNvidiaPhoto(input),error=>error.code==='PHOTO_PROVIDER_BUSY');
    const result=await analyzeNvidiaPhoto(input);
    assert.equal(calls.filter(call=>call.url.includes('nvidia')).length,1);
    const grade=calls[2].payload;
    assert.equal(grade.model,'openai/gpt-oss-120b');
    assert.equal(grade.messages[0].content,PROMPT_CORRECAO_ENEM);
    assert.ok(grade.messages[1].content.includes(text));
    assert.doesNotMatch(JSON.stringify(grade),/image_url|qwen|data:image/);
    assert.match(result.result,/^Nota: 800/);
    assert.ok(result.result.endsWith(text));
    const logs=fs.readFileSync(path.join(directory,'metrics/events.jsonl'),'utf8');
    assert.ok(!logs.includes(text));
    assert.doesNotMatch(logs,/private-test-key|Bearer/);
  }finally{global.fetch=original;}
});

test('NVIDIA is explicit opt-in and requires its own privacy receipt',()=>{
  assert.equal(photoConfig({NVIDIA_API_KEY:'test'}).provider,'groq');
  const before=process.env.PHOTO_READER;
  try{
    process.env.PHOTO_READER='nvidia';
    assert.equal(legalVersions().privacyVersion,'2026-11-10');
    const receipt={terms_version:'2026-10-30',privacy_version:'2026-11-08',ai_consent:true};
    assert.equal(isAccepted(receipt),false);
    assert.equal(isAccepted({...receipt,privacy_version:'2026-11-10'}),true);
  }finally{if(before===undefined)delete process.env.PHOTO_READER;else process.env.PHOTO_READER=before;}
});

test('photo endpoint selects NVIDIA reader and saves all five text-graded competencies',async t=>{
  const express=require('express');
  const {createPhotoRouter}=require('../backend/routes/photo');
  const app=express();app.use(express.json());
  const original=global.fetch;
  const called=[];
  let saved;
  global.fetch=async(url,options)=>{
    if(String(url).startsWith('https://integrate.api.nvidia.com/')){called.push('nvidia');return complete();}
    if(String(url).startsWith('https://api.groq.com/')){called.push(JSON.parse(options.body).model);return response(200,{choices:[{message:{content:JSON.stringify(correction)}}]});}
    return original(url,options);
  };
  app.use(createPhotoRouter({provider:'nvidia',nvidiaApiKey:'nvidia-test',apiKey:'groq-test',
    requireSupabaseUser:(req,_res,next)=>{req.supabaseUser={id:'nvidia-endpoint'};next();},
    upload:async()=> 'nvidia-endpoint/image.jpg',
    saveCorrection:async(_req,record)=>{saved=record;return {ok:true,id:'nvidia-result'};}
  }));
  const server=await new Promise(resolve=>{const listener=app.listen(0,()=>resolve(listener));});
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  try{
    const result=await original(`http://127.0.0.1:${server.address().port}/api/corrigir-foto`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({imagem:image})});
    const body=await result.json();
    assert.equal(result.status,200);
    assert.deepEqual(called,['nvidia','openai/gpt-oss-120b']);
    assert.equal(saved.tipo,'foto');
    assert.equal(saved.conteudo,text);
    assert.equal(body.salvo,true);
    for(let i=1;i<=5;i++)assert.ok(body.resultado.includes(`${i}: 160 - Comentário da competência ${i}`));
  }finally{global.fetch=original;}
});
