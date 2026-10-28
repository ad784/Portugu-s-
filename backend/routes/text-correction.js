const express = require("express");
const {
  formatarCorrecaoEnem,
  PROMPT_CORRECAO_ENEM
} = require("../services/essay-storage");

const NOTAS_ENEM = new Set([0, 40, 80, 120, 160, 200]);

function limitarNotaPorEvidencia(competencia, nota, comentario) {
  const texto = String(comentario || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (competencia === 1 && /sem erros|sem desvios|nao ha erros|nao apresenta erros|sem erros ortograficos/.test(texto)
    && !/exemplo concreto|concordancia|regencia|pontuacao adequada|construcao sintatica/.test(texto)) {
    return Math.min(nota, 160);
  }
  const repertorioInsuficiente = /repertorio.{0,35}limitad|sem repertorio|falta repertorio|nao apresenta.{0,25}repertorio/.test(texto);
  const argumentacaoGenerica = /superficial|pouco aprofund|argumentos genericos|argumentos simples|argumentos basicos|argumentacao.{0,30}gener|generica|previsiv|sem desenvolvimento/.test(texto);
  if (competencia === 2 && repertorioInsuficiente && argumentacaoGenerica) return Math.min(nota, 120);
  if (competencia === 2 && (repertorioInsuficiente || argumentacaoGenerica)) return Math.min(nota, 160);
  if (competencia === 3 && /gener|basico|simples|listagem|superficial|limitad|falta.{0,40}aprofund|falta.{0,40}justific/.test(texto)
    && /sem aprofund|falta.{0,40}aprofund|sem justific|falta.{0,40}justific|sem dado|sem exemplo|pouco aprofund|sem desenvolv|nao.{0,20}desenvolv|pouco desenvolv|superficial|sem sustent|falta de evid|nao explica|sem explic|pouca explic/.test(texto)) {
    return Math.min(nota, 120);
  }
  const coesaoLimitada = /conectivos.{0,30}limitad|repertorio.{0,30}(conectivos|coesivos).{0,30}(limitad|pouco diversificad)|pouca variedade|pouco diversificado/.test(texto);
  const coesaoRepetitiva = /repeti|mecanicamente|conectivos basicos/.test(texto);
  if (competencia === 4 && (coesaoLimitada || coesaoRepetitiva)) return Math.min(nota, 120);
  if (competencia === 5 && /falta detalh|sem detalh|pouco detalh|proposta vaga/.test(texto)) {
    return Math.min(nota, /campanh|conscientiz/.test(texto) ? 80 : 120);
  }
  return nota;
}

function parseJsonObject(content) {
  const raw = String(content || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(raw); } catch {}
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(raw.slice(start, end + 1)); } catch { return null; }
}

function numeroDaCompetencia(item, index) {
  const value = Number(item?.competencia);
  if (Number.isInteger(value) && value >= 1 && value <= 5) return value;
  const label = String(item?.competencia || "").match(/[1-5]/)?.[0];
  return label ? Number(label) : index + 1;
}

function normalizarCorrecao(correcao, texto) {
  const recebidas = Array.isArray(correcao.competencias) ? correcao.competencias : [];
  const competencias = Array.from({ length: 5 }, (_, index) => {
    const numero = index + 1;
    const item = recebidas.find((candidate, position) => numeroDaCompetencia(candidate, position) === numero)
      || recebidas[index]
      || {};
    const notaInformada = Number(String(item.nota ?? item.score ?? "").match(/\d+/)?.[0]);
    const notaBase = Number.isFinite(notaInformada)
      ? Math.max(0, Math.min(200, Math.floor(notaInformada / 40) * 40))
      : 0;
    const comentario = item.comentario ?? item.feedback ?? item.justificativa;
    const textoComentario = typeof comentario === "string" && comentario.trim()
      ? comentario.trim()
      : "A resposta da IA nao trouxe justificativa para este criterio; a nota foi mantida em 0.";
    return {
      competencia: numero,
      nota: limitarNotaPorEvidencia(numero, notaBase, textoComentario),
      comentario: textoComentario
    };
  });

  // A nota global vem do avaliador e de sua justificativa; heuristicas simples
  // de palavras nao devem impor tetos arbitrarios ao resultado.
  const notaInformada = Number(String(correcao.nota_final ?? correcao.notaFinal ?? "").match(/\d+/)?.[0]);
  let notaFinal = Number.isFinite(notaInformada)
    ? Math.max(0, Math.min(1000, Math.floor(notaInformada / 20) * 20))
    : 0;
  let justificativaNota = String(correcao.justificativa_nota ?? correcao.justificativaNota ?? "").trim();
  if (!justificativaNota) {
    const pontos = competencias
      .filter((item) => item.comentario && !item.comentario.startsWith("A resposta da IA"))
      .map((item) => `C${item.competencia}: ${item.comentario}`);
    justificativaNota = Number.isFinite(notaInformada) && notaInformada >= 0 && notaInformada <= 1000
      ? `A nota global considera o desenvolvimento da tese, a relação com o tema e a concretude da intervenção. ${pontos.slice(0, 2).join(" ")}`.trim()
      : "A resposta da avaliação não trouxe uma nota global válida; a redação precisa ser reavaliada.";
  }

  const limiteCompetencia = notaFinal === 0 ? 0
    : notaFinal < 200 ? 80
      : notaFinal < 400 ? 120
        : notaFinal < 600 ? 160 : 200;
  for (const item of competencias) {
    if (item.nota <= limiteCompetencia) continue;
    item.nota = limiteCompetencia;
    item.comentario += " Nota ajustada para ficar coerente com a avaliação global.";
  }

  return {
    notaFinal,
    justificativaNota,
    competencias,
    erros: Array.isArray(correcao.erros) ? correcao.erros.filter((item) => typeof item === "string") : [],
    sugestoes: Array.isArray(correcao.sugestoes) ? correcao.sugestoes.filter((item) => typeof item === "string") : []
  };
}async function requestGroq(apiKey, payload) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response;
    try {
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      continue;
    }
    let data;
    try { data = await response.json(); } catch { data = {}; }
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 2) return { response, data };

    const fromMessage = Number(data.error?.message?.match(/try again in ([\d.]+)s/i)?.[1]);
    const fromHeader = Number(response.headers.get("retry-after"));
    const seconds = Number.isFinite(fromHeader) && fromHeader > 0
      ? fromHeader
      : Number.isFinite(fromMessage) && fromMessage > 0 ? fromMessage : 5;
    await new Promise((resolve) => setTimeout(resolve, Math.min(30_000, Math.ceil(seconds * 1000) + 250)));
  }
}

async function respondWithResult(req, res, saveCorrection, { texto, resultado, linhas, tema }) {
  const persistencia = await saveCorrection(req, {
    conteudo: texto,
    resultado,
    tipo: "texto",
    linhas,
    tema
  });
  return res.json({ resultado, salvo: persistencia.ok, aviso: persistencia.ok ? null : persistencia.erro });
}

function createTextCorrectionRouter({ requireSupabaseUser, saveCorrection, apiKey, model }) {
  const router = express.Router();

  router.post(["/api/corrigir", "/corrigir"], requireSupabaseUser, async (req, res) => {
    const { texto, linhasVisuais, tema } = req.body || {};
    if (typeof texto !== "string" || !texto.trim()) {
      return res.status(400).json({ erro: "Texto não enviado." });
    }

    const linhasPreenchidas = Number.isInteger(linhasVisuais) && linhasVisuais >= 0
      ? linhasVisuais
      : texto.split(/\r?\n/).filter((linha) => linha.trim()).length;

    if (linhasPreenchidas < 8) {
      return res.status(400).json({
        erro: "Sua redação precisa ter pelo menos 8 linhas para ser enviada à correção."
      });
    }

    if (!apiKey) {
      return res.status(503).json({
        erro: "A correção por IA ainda não está configurada. Defina GROQ_API_KEY no servidor e tente novamente."
      });
    }

    try {
      const { response: resposta, data: dados } = await requestGroq(apiKey, {
          model: model || "openai/gpt-oss-120b",
          temperature: 0,
          seed: 42,
          max_tokens: 2200,
          messages: [
            {
              role: "system",
              content: `${PROMPT_CORRECAO_ENEM}\n\nResponda com um unico objeto JSON valido, sem markdown. Inclua nota_final de 0 a 1000 como avaliacao global independente; NAO some nem tire a media das competencias. Justifique a nota global com evidencias concretas do texto. Avalie cada competencia separadamente para o diagnostico, sem deixar que um defeito isolado imponha um teto artificial. Seja criterioso e nao invente falhas.`
            },
            {
              role: "user",
              content: `Tema da proposta: ${tema?.trim() || "Não informado. Avalie a competência 2 apenas pelo que puder ser confirmado no texto."}\nLinhas visuais informadas pelo editor: ${linhasPreenchidas}.\n\nRedacao para avaliar:\n---\n${texto}\n---`
            }
          ]
      });
      if (!resposta.ok || !dados.choices?.[0]?.message?.content) {
        console.error("Erro na chamada unica da Groq:", dados.error?.code || resposta.status, dados.error?.message || "sem detalhes");
        return res.status(502).json({ erro: "A API de correção não conseguiu avaliar a redação. Tente novamente." });
      }

      const correcao = parseJsonObject(dados.choices[0].message.content);
      if (!correcao) {
        console.error("Resposta da Groq não contém JSON válido.");
        return res.status(502).json({ erro: "A API retornou uma correção em formato inválido. Tente novamente." });
      }
      const correcaoFinal = normalizarCorrecao(
        correcao && typeof correcao === "object" && !Array.isArray(correcao) ? correcao : {},
        texto
      );
      const resultado = formatarCorrecaoEnem(correcaoFinal, texto);
      return respondWithResult(req, res, saveCorrection, {
        texto,
        resultado,
        linhas: linhasPreenchidas,
        tema
      });
    } catch (error) {
      console.error("Erro ao corrigir redação:", error);
      res.status(500).json({ erro: "Não foi possível corrigir a redação. Tente novamente." });
    }
  });

  return router;
}

module.exports = { createTextCorrectionRouter };
