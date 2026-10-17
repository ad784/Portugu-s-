const express = require("express");
const { formatarCorrecaoEnem, PROMPT_CORRECAO_ENEM } = require("../services/essay-storage");

function createTextCorrectionRouter({ requireSupabaseUser, saveCorrection, apiKey, model }) {
  const router = express.Router();
router.post(["/corrigir", "/api/corrigir"], requireSupabaseUser, async (req, res) => {
  const { texto, linhasVisuais, tema } = req.body;

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

    const persistencia = await saveCorrection(req, {
      conteudo: texto,
      resultado,
      tipo: "texto",
      linhas: linhasPreenchidas,
      tema
    });
    return res.json({ resultado, salvo: persistencia.ok, aviso: persistencia.ok ? null : persistencia.erro });
  }

  if (!apiKey) {
    // Sem uma chave, não execute o avaliador local: ele aplicava limites
    // artificiais (inclusive 520 pontos) e mascarava a configuração ausente.
    return res.status(503).json({
      erro: "A correção por IA ainda não está configurada. Defina GROQ_API_KEY no servidor e tente novamente."
    });
  }

  try {
    const resposta = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || "openai/gpt-oss-120b",
        temperature: 0.2,
        max_tokens: 1800,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: PROMPT_CORRECAO_ENEM
          },
          {
            role: "user",
            content: `Tema da proposta: ${tema?.trim() || "Nao informado. Avalie a competencia 2 apenas pelo que puder ser confirmado no texto."}\n\nRedação para avaliar:\n---\n${texto}\n---`
          }
        ]
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok || !dados.choices?.[0]?.message?.content) {
      console.error("Erro Groq:", dados);
      return res.status(502).json({ erro: "A API de correção não conseguiu avaliar a redação. Tente novamente." });
    }

    let correcao;
    try {
      correcao = JSON.parse(dados.choices[0].message.content);
    } catch {
      console.error("Resposta inválida da Groq:", dados.choices[0].message.content);
      return res.status(502).json({ erro: "A API retornou uma correção em formato inválido. Tente novamente." });
    }
    if (!correcao || typeof correcao !== "object") {
      return res.status(502).json({ erro: "A API retornou uma correção incompleta. Tente novamente." });
    }
    const resultado = formatarCorrecaoEnem(correcao, texto);
    const persistencia = await saveCorrection(req, {
      conteudo: texto,
      resultado,
      tipo: "texto",
      linhas: linhasPreenchidas,
      tema
    });
    res.json({ resultado, salvo: persistencia.ok, aviso: persistencia.ok ? null : persistencia.erro });

  } catch (erro) {
    console.error("Erro servidor:", erro);
    res.status(500).json({ erro: "Erro ao corrigir" });
  }
});

// 🚀 INICIAR SERVIDOR
// Analisa a redação diretamente da foto e devolve o mesmo relatório da correção digitada.
  return router;
}

module.exports = { createTextCorrectionRouter };
