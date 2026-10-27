const express = require("express");
const { formatarCorrecaoEnem, PROMPT_CORRECAO_ENEM } = require("../services/essay-storage");

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

    if (linhasPreenchidas < 10) {
      const resultado = [
        "Nota: 0",
        "",
        "Erros:",
        `- A redação possui apenas ${linhasPreenchidas} linha(s) preenchida(s). O mínimo para correção é de 10 linhas.`,
        "",
        "Sugestões:",
        "- Desenvolva melhor o texto e envie novamente quando alcançar pelo menos 10 linhas.",
        "",
        "Redação:",
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
            { role: "system", content: PROMPT_CORRECAO_ENEM },
            {
              role: "user",
              content: `Tema da proposta: ${tema?.trim() || "Não informado. Avalie a competência 2 apenas pelo que puder ser confirmado no texto."}\n\nRedação para avaliar:\n---\n${texto}\n---`
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
      if (!correcao || typeof correcao !== "object" || Array.isArray(correcao)) {
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
    } catch (error) {
      console.error("Erro ao corrigir redação:", error);
      res.status(500).json({ erro: "Não foi possível corrigir a redação. Tente novamente." });
    }
  });

  return router;
}

module.exports = { createTextCorrectionRouter };
