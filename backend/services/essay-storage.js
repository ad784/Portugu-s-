function getScore(resultado) {
  const score = resultado.match(/^\s*Nota\s*:\s*(\d+)/im);
  return score ? Number(score[1]) : null;
}

function normalizarCompetencia(valor) {
  const nota = Number(valor);
  if (!Number.isFinite(nota)) return 0;
  // A matriz usa faixas de 40 pontos. Se o modelo retornar um valor intermediario,
  // mantemos a faixa inferior para nao inflar a nota durante a normalizacao.
  return Math.max(0, Math.min(200, Math.floor(nota / 40) * 40));
}

function formatarCorrecaoEnem(correcao, texto) {
  const competenciasRecebidas = Array.isArray(correcao.competencias)
    ? correcao.competencias
    : [];
  const competencias = Array.from({ length: 5 }, (_, indice) => {
    const item = competenciasRecebidas[indice];
    return normalizarCompetencia(typeof item === "object" ? item.nota : item);
  });
  const nota = competencias.reduce((total, valor) => total + valor, 0);
  const lista = (valor, padrao) => {
    if (!Array.isArray(valor) || valor.length === 0) return [padrao];
    return valor
      .filter((item) => typeof item === "string" && item.trim())
      .slice(0, 6);
  };

  const linhas = [
    `Nota: ${nota}`,
    "",
    "Justificativa da nota:",
    String(
      correcao.justificativaNota ||
        "A nota considera a qualidade global e as evidências observadas no texto.",
    ).trim(),
    "",
    "Competencias:",
    ...competencias.map((notaCompetencia, indice) => {
      const detalhe = competenciasRecebidas[indice]?.comentario;
      return `${indice + 1}: ${notaCompetencia}${typeof detalhe === "string" && detalhe.trim() ? ` - ${detalhe.trim()}` : ""}`;
    }),
    "",
    "Erros:",
    ...lista(correcao.erros, "Nenhum erro especifico foi identificado.").map(
      (item) => `- ${item}`,
    ),
    "",
    "Sugestoes:",
    ...lista(correcao.sugestoes, "Revise o texto e continue praticando.").map(
      (item) => `- ${item}`,
    ),
    "",
    "Redacao:",
    texto,
  ];
  return linhas.join("\n");
}

const PROMPT_CORRECAO_ENEM = require("./text-rubric");

const ENEM_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "correcao_redacao_enem",
    strict: true,
    schema: {
      type: "object",
      properties: {
        nota_final: { type: "integer", minimum: 0, maximum: 1000 },
        justificativa_nota: { type: "string" },
        competencias: {
          type: "array",
          items: {
            type: "object",
            properties: {
              competencia: { type: "integer", enum: [1, 2, 3, 4, 5] },
              nota: { type: "integer", enum: [0, 40, 80, 120, 160, 200] },
              comentario: { type: "string" },
              requisitos: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    criterio: { type: "string" },
                    atendido: { type: "boolean" },
                    evidencia: { type: "string" },
                    analise: { type: "string" },
                  },
                  required: ["criterio", "atendido", "evidencia", "analise"],
                  additionalProperties: false,
                },
              },
            },
            required: ["competencia", "nota", "comentario", "requisitos"],
            additionalProperties: false,
          },
        },
        erros: { type: "array", items: { type: "string" } },
        sugestoes: { type: "array", items: { type: "string" } },
      },
      required: [
        "nota_final",
        "justificativa_nota",
        "competencias",
        "erros",
        "sugestoes",
      ],
      additionalProperties: false,
    },
  },
};

async function saveCorrection(
  req,
  {
    conteudo = null,
    resultado,
    tipo,
    linhas = null,
    tema = null,
    imagemPath = null,
    avaliacaoHash = null,
    createdAt = null,
  },
) {
  if (req.isLocalDemo) return { ok: true };
  const registro = {
    user_id: req.supabaseUser.id,
    conteudo,
    resultado,
    tipo,
    linhas,
    tema,
    imagem_path: imagemPath,
    nota: getScore(resultado),
    ...(avaliacaoHash ? { avaliacao_hash: avaliacaoHash } : {}),
    ...(createdAt ? { created_at: createdAt } : {}),
  };
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await req.supabase
      .from("redacoes")
      .insert(registro)
      .select("id, created_at")
      .single();
    if (!error)
      return data?.id
        ? { ok: true, id: data.id, createdAt: data.created_at }
        : {
            ok: false,
            erro: "Não foi possível confirmar o salvamento na conta.",
          };
    if (error.code === "23505" && avaliacaoHash) {
      const existing = await require("./evaluation-cache").findSavedCorrection(
        req,
        avaliacaoHash,
      );
      if (existing)
        return { ok: true, id: existing.id, createdAt: existing.created_at };
    }
    const missingColumn = /PGRST204|42703/.test(error.code || "");
    const field = ["avaliacao_hash", "tema", "imagem_path"].find(
      (key) => key in registro && String(error.message || "").includes(key),
    );
    if (missingColumn && field) {
      delete registro[field];
      console.warn("Migração pendente no banco:", field);
      continue;
    }
    console.warn("Falha ao salvar avaliação:", error.code || "sem código");
    return {
      ok: false,
      erro: "Sua avaliação ainda não foi salva na conta. Vamos tentar sincronizar sem repetir a correção.",
    };
  }
  return { ok: false, erro: "Não foi possível salvar sua avaliação na conta." };
}

module.exports = {
  getScore,
  normalizarCompetencia,
  formatarCorrecaoEnem,
  PROMPT_CORRECAO_ENEM,
  ENEM_RESPONSE_FORMAT,
  saveCorrection,
};
