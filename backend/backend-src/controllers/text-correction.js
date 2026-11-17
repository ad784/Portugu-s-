const {
  formatarCorrecaoEnem,
  PROMPT_CORRECAO_ENEM,
  ENEM_RESPONSE_FORMAT,
} = require("../services/essay-storage");

const NOTAS_ENEM = new Set([0, 40, 80, 120, 160, 200]);
const { consistentScore } = require("../services/score-consistency");
const { REQUIREMENTS, enforceEvidence } = require("../services/strict-rubric");
function correctionResponseFormat(model) {
  return [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
    "meta-models/muse-spark-open",
  ].includes(model)
    ? ENEM_RESPONSE_FORMAT
    : { type: "json_object" };
}
function parseJsonObject(content) {
  const raw = String(content || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(raw);
  } catch {}
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function isCompleteCorrection(
  correcao,
  texto,
  requireStructuredChecks = false,
) {
  if (!correcao || typeof correcao !== "object" || Array.isArray(correcao))
    return false;
  const nota = Number(correcao.nota_final ?? correcao.notaFinal);
  const justificativa = String(
    correcao.justificativa_nota ?? correcao.justificativaNota ?? "",
  ).trim();
  if (!Number.isInteger(nota) || nota < 0 || nota > 1000 || !justificativa)
    return false;
  if (
    !Array.isArray(correcao.competencias) ||
    correcao.competencias.length !== 5
  )
    return false;

  const numeros = new Set();
  for (const [index, item] of correcao.competencias.entries()) {
    const competencia = numeroDaCompetencia(item, index);
    const notaCompetencia = Number(item?.nota ?? item?.score);
    const comentario = String(
      item?.comentario ?? item?.feedback ?? item?.justificativa ?? "",
    ).trim();
    if (competencia < 1 || competencia > 5 || numeros.has(competencia))
      return false;
    // Completude depende dos dados exibidos. Metadados auxiliares de evidencia
    // ou tamanho do comentario nao devem descartar uma avaliacao completa.
    if (!NOTAS_ENEM.has(notaCompetencia) || !comentario) return false;
    if (requireStructuredChecks && !hasStructuredChecks(competencia, item))
      return false;
    numeros.add(competencia);
  }
  return numeros.size === 5;
}

function hasStructuredChecks(competencia, item) {
  if ([1, 2, 4].includes(competencia))
    return hasExactlyTheseCriteria(
      item.requisitos,
      REQUIREMENTS[competencia].base,
    );
  if (competencia === 3)
    return hasExactlyTheseCriteria(item.requisitos, [
      "sustentacao_argumentativa",
      "eixos_centrais_desenvolvidos",
    ]);
  if (competencia === 5)
    return hasExactlyTheseCriteria(item.requisitos, [
      "agente",
      "acao",
      "meio_modo",
      "finalidade",
      "detalhamento",
    ]);
  return true;
}

function hasExactlyTheseCriteria(requirements, criteria) {
  if (!Array.isArray(requirements) || requirements.length !== criteria.length)
    return false;
  return criteria.every(
    (criterio) =>
      requirements.filter(
        (item) =>
          item?.criterio === criterio &&
          typeof item.atendido === "boolean" &&
          typeof item.analise === "string" &&
          item.analise.trim(),
      ).length === 1,
  );
}

function numeroDaCompetencia(item, index) {
  const value = Number(item?.competencia);
  if (Number.isInteger(value) && value >= 1 && value <= 5) return value;
  const label = String(item?.competencia || "").match(/[1-5]/)?.[0];
  return label ? Number(label) : index + 1;
}

function normalizarCorrecao(correcao, texto, { strictHighEvidence = false } = {}) {
  const recebidas = Array.isArray(correcao.competencias)
    ? correcao.competencias
    : [];
  const competencias = Array.from({ length: 5 }, (_, index) => {
    const numero = index + 1;
    const item =
      recebidas.find(
        (candidate, position) =>
          numeroDaCompetencia(candidate, position) === numero,
      ) ||
      recebidas[index] ||
      {};
    const notaInformada = Number(
      String(item.nota ?? item.score ?? "").match(/\d+/)?.[0],
    );
    const notaBase = Number.isFinite(notaInformada)
      ? Math.max(0, Math.min(200, Math.floor(notaInformada / 40) * 40))
      : 0;
    const comentario = item.comentario ?? item.feedback ?? item.justificativa;
    const textoComentario =
      typeof comentario === "string" && comentario.trim()
        ? comentario.trim()
        : "A resposta da IA não trouxe justificativa para este critério; a nota foi mantida em 0.";
    const requirements = Array.isArray(item.requisitos)
      ? Object.assign([...item.requisitos], { comment: textoComentario })
      : item.requisitos;
    const evidenceScore = strictHighEvidence && [1, 2, 4].includes(numero)
      ? enforceEvidence(numero, notaBase, item.requisitos, texto)
      : notaBase;
    const checked = consistentScore(numero, evidenceScore, requirements, texto);
    return {
      competencia: numero,
      nota: checked.score,
      comentario: checked.comment || textoComentario,
    };
  });

  const notaFinal = competencias.reduce((total, item) => total + item.nota, 0);
  const justificativaNota =
    "Nota global calculada pela soma das cinco competencias: " +
    competencias
      .map((item) => "C" + item.competencia + " = " + item.nota)
      .join(" + ") +
    " = " +
    notaFinal +
    ". Os comentarios abaixo explicam os requisitos atendidos e ausentes.";
  return {
    notaFinal,
    justificativaNota,
    competencias,
    erros: Array.isArray(correcao.erros)
      ? correcao.erros.filter((item) => typeof item === "string")
      : [],
    sugestoes: Array.isArray(correcao.sugestoes)
      ? correcao.sugestoes.filter((item) => typeof item === "string")
      : [],
  };
}
function createTextCorrectionController({
  requireSupabaseUser,
  saveCorrection,
  apiKey,
  model,
}) {
  const { createTextHandler } = require("../services/text-evaluation");
  return createTextHandler({
    saveCorrection,
    apiKey,
    model,
    parseJsonObject,
    isCompleteCorrection: (correcao, texto) =>
      isCompleteCorrection(correcao, texto, true),
    normalizarCorrecao: (correcao, texto) =>
      normalizarCorrecao(correcao, texto, { strictHighEvidence: true }),
    correctionResponseFormat,
  });
}

module.exports = {
  createTextCorrectionController,
  normalizarCorrecao,
  correctionResponseFormat,
  parseJsonObject,
  isCompleteCorrection,
};
