// A chave fica junto do backend, independentemente da pasta em que o Node for iniciado.
// `override` evita que uma variável vazia do sistema esconda a chave do arquivo.
require("dotenv").config({
  path: require("path").join(__dirname, "../.env"),
  // Garante que os valores do arquivo local prevaleçam sobre variáveis vazias
  // herdadas do terminal ou do sistema operacional.
  override: true,
  quiet: true
});

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { verifyAuth, createContextClient, createAdminClient } = require("@supabase/server/core");

function getGroqApiKey() {
  const keyFromEnvironment = process.env.GROQ_API_KEY?.trim();
  if (keyFromEnvironment) return keyFromEnvironment;

  try {
    const envFile = fs.readFileSync(path.join(__dirname, ".env"));
    return require("dotenv").parse(envFile).GROQ_API_KEY?.trim() || "";
  } catch {
    return "";
  }
}

const groqApiKey = getGroqApiKey();

const app = express();

app.use(cors());
// A imagem capturada é enviada em base64 e precisa de um limite maior que o padrão.
app.use(express.json({ limit: "5mb" }));

function toWebRequest(req) {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers.host || "localhost";
  return new Request(`${protocol}://${host}${req.originalUrl}`, {
    method: req.method,
    headers: { authorization: req.get("authorization") || "" }
  });
}

async function requireSupabaseUser(req, res, next) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    return res.status(503).json({ erro: "Autenticacao Supabase nao configurada no servidor" });
  }

  const { data, error } = await verifyAuth(toWebRequest(req), { auth: "user" });
  if (error) {
    return res.status(error.status || 401).json({ erro: "Sessao invalida ou expirada" });
  }

  req.supabaseUser = data.userClaims;
  req.isAdmin = data.userClaims?.appMetadata?.role === "admin";
  req.supabase = createContextClient({ auth: { token: data.token } });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.isAdmin) return res.status(403).json({ erro: "Acesso restrito ao administrador" });
  next();
}

function getScore(resultado) {
  const score = resultado.match(/^\s*Nota\s*:\s*(\d+)/im);
  return score ? Number(score[1]) : null;
}

async function saveCorrection(req, { conteudo = null, resultado, tipo, linhas = null, imagemPath = null }) {
  const { error } = await req.supabase.from("redacoes").insert({
    user_id: req.supabaseUser.id,
    conteudo,
    resultado,
    tipo,
    linhas,
    imagem_path: imagemPath,
    nota: getScore(resultado)
  });

  if (error) {
    console.error("Erro ao salvar redacao:", error.message);
    return false;
  }
  return true;
}

async function uploadPhoto(userId, imageDataUrl) {
  const match = imageDataUrl.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/i);
  if (!match) throw new Error("Imagem invalida");

  const extension = match[1].toLowerCase() === "jpeg" ? "jpg" : match[1].toLowerCase();
  const imagePath = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await createAdminClient()
    .storage
    .from("redacoes")
    .upload(imagePath, Buffer.from(match[2], "base64"), {
      contentType: `image/${match[1].toLowerCase()}`,
      upsert: false
    });

  if (error) throw new Error(`Nao foi possivel salvar a foto: ${error.message}`);
  return imagePath;
}

app.get("/api/me", requireSupabaseUser, (req, res) => {
  res.json({
    email: req.supabaseUser?.email || null,
    role: req.isAdmin ? "admin" : "user"
  });
});

app.get("/api/redacoes", requireSupabaseUser, async (req, res) => {
  const { data, error } = await req.supabase
    .from("redacoes")
    .select("id, tipo, nota, linhas, created_at, resultado")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ erro: "Nao foi possivel consultar as redacoes" });
  res.json({ redacoes: data });
});

app.get("/api/admin/redacoes", requireSupabaseUser, requireAdmin, async (req, res) => {
  const { data, error } = await req.supabase
    .from("redacoes")
    .select("id, user_id, tipo, nota, linhas, created_at, resultado")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ erro: "Nao foi possivel consultar as redacoes" });
  res.json({ redacoes: data });
});

// Avaliador local simples para desenvolvimento (retorna nota 0-1000 e relatório)
function gradeText(text) {
  const clean = (s) => s.replace(/[^\p{L}\p{N}\s'-]/gu, '');
  const words = clean(text).trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = text.split(/[\.\!\?]+/).filter(s => s.trim().length > 0).length || 1;
  const normalizedWords = words.map(w => w.toLowerCase().replace(/[^\p{L}]/gu, ''));
  const uniqueWords = new Set(normalizedWords.filter(Boolean)).size;
  const avgWordLen = wordCount ? words.reduce((a,b)=>a+b.length,0)/wordCount : 0;
  const punctuationCount = (text.match(/[.,;:()\-!?]/g) || []).length;
  const connectors = (text.match(/\b(porque|pois|portanto|entretanto|porém|contudo|além|além disso|todavia|logo|assim|portanto|por isso)\b/gi) || []).length;

  // Rigor reforçado: requisitos elevados e penalidades mais severas
  const desiredMinWords = 350;
  const lengthScore = Math.min(1, wordCount / desiredMinWords);
  const sentenceScore = Math.min(1, sentences / 12); // exige mais sentenças
  const vocabDenom = Math.max(10, Math.floor(wordCount * 0.75));
  const vocabScore = Math.min(1, uniqueWords / vocabDenom);
  const punctScore = Math.min(1, punctuationCount / 22); // requer mais pontuação
  const connectorScore = Math.min(1, connectors / 7); // mais conectivos

  const weighted = (lengthScore * 0.30) + (vocabScore * 0.30) + (sentenceScore * 0.18) + (punctScore * 0.14) + (connectorScore * 0.08);

  let baseScore = Math.round(weighted * 1000);

  // Aplicar caps e penalidades para textos curtos, repetitivos ou sem estrutura
  let score = baseScore;
  if (wordCount < 220) {
    const cap = 200 + Math.round((wordCount / 220) * 240); // 200..440
    score = Math.min(score, cap);
  } else if (wordCount < 300) {
    const cap = 360 + Math.round((wordCount / 300) * 280); // 360..640
    score = Math.min(score, cap);
  }
  if (connectors < 4) score = Math.min(score, 520);
  if (punctuationCount < 6) score = Math.min(score, 560);
  if (avgWordLen < 4.2) score = Math.min(score, 580);

  const repetitionRatio = wordCount ? (uniqueWords / wordCount) : 0;
  if (repetitionRatio < 0.52) score = Math.round(score * 0.72);

  if (vocabScore < 0.28) score = Math.round(score * 0.78);
  if (sentenceScore < 0.45) score = Math.round(score * 0.78);
  if (punctScore < 0.22) score = Math.round(score * 0.82);

  score = Math.max(0, Math.min(1000, score));

  // Competências aproximadas (simples distribuição baseada em métricas)
  const comp1 = Math.round(score * (0.5 * sentenceScore + 0.5 * lengthScore));
  const comp2 = Math.round(score * (0.5 * connectorScore + 0.5 * sentenceScore));
  const comp3 = Math.round(score * (0.6 * sentenceScore + 0.4 * lengthScore));
  const comp4 = Math.round(score * (0.6 * vocabScore + 0.4 * punctScore));
  const comp5 = Math.round(score * (0.6 * punctScore + 0.4 * vocabScore));

  const errors = [];
  const suggestions = [];

  if (wordCount < 220) {
    errors.push('Redação curta demais: procure escrever pelo menos 220 palavras');
  }
  if (wordCount < 120) {
    errors.push('Texto muito insuficiente para um desenvolvimento adequado');
  }
  if (sentenceScore < 0.5) {
    errors.push('Estrutura fraca: faltam sentenças completas e parágrafos claros');
  }
  if (connectorScore < 0.35) {
    errors.push('Coesão baixa: use mais conectivos e ligação entre ideias');
  }
  if (punctuationCount < 5) {
    errors.push('Pontuação insuficiente: revise vírgulas, pontos e parênteses');
  }
  if (repetitionRatio < 0.52) {
    suggestions.push('Evite repetir as mesmas palavras; use sinônimos e termos variados');
  }
  if (vocabScore < 0.30) {
    suggestions.push('Amplie o vocabulário com termos mais precisos e específicos');
  }
  if (avgWordLen < 4.5) {
    suggestions.push('Use palavras um pouco mais elaboradas para enriquecer o texto');
  }
  if (connectorScore < 0.35) {
    suggestions.push('Inclua conectivos como contudo, portanto, entretanto e assim');
  }
  if (punctScore < 0.25) {
    suggestions.push('Melhore a coesão e a fluidez com pontuação correta');
  }
  if (errors.length === 0) errors.push('A redação está bem estruturada, continue mantendo a organização.');
  if (suggestions.length === 0) suggestions.push('Texto consistente; revise apenas a clareza e a pontuação.');

  const report = {
    score,
    wordCount,
    sentences,
    uniqueWords,
    avgWordLen: Math.round(avgWordLen * 10) / 10,
    punctuationCount,
    connectors,
    competences: [comp1, comp2, comp3, comp4, comp5],
    errors,
    suggestions
  };

  return report;
}

// 🔥 SERVIR FRONTEND
app.use(express.static(path.join(__dirname, "../frontend")));

// 🔥 ROTA PRINCIPAL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// 🚀 ROTA DE CORREÇÃO COM GROQ
app.post(["/corrigir", "/api/corrigir"], requireSupabaseUser, async (req, res) => {
  const { texto, linhasVisuais } = req.body;

  if (!texto) {
    return res.status(400).json({ erro: "Texto não enviado" });
  }
  // Se a chave da API não estiver configurada, usar avaliador local
  const linhasPreenchidas = Number.isInteger(linhasVisuais) && linhasVisuais >= 0
    ? linhasVisuais
    : texto.split(/\r?\n/).filter((linha) => linha.trim()).length;
  if (linhasPreenchidas < 10) {
    const resultado = [
      "Nota: 0",
      "",
      "Erros:",
      `- A redacao possui apenas ${linhasPreenchidas} linha(s) preenchida(s). O minimo para correcao e de 10 linhas.`,
      "",
      "Sugestoes:",
      "- Desenvolva melhor o texto e envie novamente quando alcancar pelo menos 10 linhas.",
      "",
      "Redacao:",
      texto
    ].join("\n");

    const salvo = await saveCorrection(req, {
      conteudo: texto,
      resultado,
      tipo: "texto",
      linhas: linhasPreenchidas
    });
    return res.json({ resultado, salvo });
  }

  if (!groqApiKey) {
    console.warn('GROQ_API_KEY não configurada — usando avaliador local de desenvolvimento');
    const r = gradeText(texto);
    const resultado = [];
    resultado.push(`Nota: ${r.score}`);
    resultado.push('');
    resultado.push('Competências:');
    r.competences.forEach((c, i) => resultado.push(`${i+1}: ${c}`));
    resultado.push('');
    resultado.push('Erros:');
    r.errors.forEach(e => resultado.push(`- ${e}`));
    resultado.push('');
    resultado.push('Sugestões:');
    r.suggestions.forEach(s => resultado.push(`- ${s}`));
    resultado.push('');
    resultado.push('Métricas:');
    resultado.push(`- Palavras: ${r.wordCount}`);
    resultado.push(`- Sentenças: ${r.sentences}`);
    resultado.push(`- Palavras únicas: ${r.uniqueWords}`);
    resultado.push(`- Tamanho médio de palavra: ${r.avgWordLen}`);
    resultado.push('');
    resultado.push('Redação:');
    resultado.push(texto);

    const resultadoFinal = resultado.join('\n');
    const salvo = await saveCorrection(req, {
      conteudo: texto,
      resultado: resultadoFinal,
      tipo: "texto",
      linhas: linhasPreenchidas
    });
    return res.json({ resultado: resultadoFinal, salvo });
  }

  try {
    const resposta = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `Corrija a redação no modelo ENEM.\n\nResponda assim:\n\nNota: 0 a 1000\n\nCompetências:\n1: ...\n2: ...\n3: ...\n4: ...\n5: ...\n\nErros:\n- ...\n\nSugestões:\n- ...\n\nRedação:\n${texto}`
          }
        ]
      })
    });

    const dados = await resposta.json();

    if (!dados.choices) {
      console.error("Erro Groq:", dados);
      return res.status(500).json({ erro: "Erro na API Groq" });
    }

    const resultado = dados.choices[0].message.content;
    const salvo = await saveCorrection(req, {
      conteudo: texto,
      resultado,
      tipo: "texto",
      linhas: linhasPreenchidas
    });
    res.json({ resultado, salvo });

  } catch (erro) {
    console.error("Erro servidor:", erro);
    res.status(500).json({ erro: "Erro ao corrigir" });
  }
});

// 🚀 INICIAR SERVIDOR
// Analisa a redação diretamente da foto e devolve o mesmo relatório da correção digitada.
app.post(["/corrigir-foto", "/api/corrigir-foto"], requireSupabaseUser, async (req, res) => {
  const { imagem } = req.body;
  console.log(`Pedido de correcao por foto recebido. Chave Groq: ${groqApiKey ? "carregada" : "ausente"}`);

  if (!imagem || !/^data:image\/(png|jpe?g|webp);base64,/i.test(imagem)) {
    return res.status(400).json({ erro: "Imagem invalida ou nao enviada" });
  }

  if (!groqApiKey) {
    return res.status(503).json({ erro: "Configure GROQ_API_KEY para corrigir fotos" });
  }

  try {
    const resposta = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: "Leia a redacao manuscrita desta imagem e corrija-a no modelo ENEM. Ignore qualquer conteudo que nao seja a redacao. Responda neste formato: Nota: 0 a 1000, Competencias (1 a 5), Erros, Sugestoes e Redacao transcrita."
            },
            {
              type: "image_url",
              image_url: { url: imagem }
            }
          ]
        }]
      })
    });

    const dados = await resposta.json();
    if (!resposta.ok || !dados.choices?.[0]?.message?.content) {
      console.error("Erro Groq (foto):", dados);
      return res.status(502).json({ erro: "Nao foi possivel analisar a foto" });
    }

    const resultado = dados.choices[0].message.content;
    let imagemPath = null;
    try {
      imagemPath = await uploadPhoto(req.supabaseUser.id, imagem);
    } catch (erroUpload) {
      console.error(erroUpload.message);
    }
    const salvo = await saveCorrection(req, { resultado, tipo: "foto", imagemPath });
    res.json({ resultado, salvo });
  } catch (erro) {
    console.error("Erro servidor (foto):", erro);
    res.status(500).json({ erro: "Erro ao enviar a foto para correcao" });
  }
});

if (require.main === module) {
const server = app.listen(Number(process.env.PORT) || 3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
  console.log(`Chave Groq: ${groqApiKey ? "carregada" : "ausente"}`);
});

server.on("close", () => {
  console.log("Servidor encerrado.");
});

// Mantém a referência do servidor durante toda a execução do processo.
const keepAlive = setInterval(() => {}, 60_000);
process.on("SIGINT", () => server.close(() => {
  clearInterval(keepAlive);
  process.exit(0);
}));
process.on("SIGTERM", () => server.close(() => {
  clearInterval(keepAlive);
  process.exit(0);
}));
}

module.exports = app;
