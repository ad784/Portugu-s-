// Only a complete, explicit assessment can constrain a score. Missing
// metadata must never be interpreted as a weakness in the student's essay.
const normalize = (value) =>
  String(value || "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
function assessment(requirements, keys, essay) {
  if (!Array.isArray(requirements)) return null;
  const result = [];
  for (const key of keys) {
    const matches = requirements.filter((item) => item?.criterio === key);
    if (matches.length !== 1) return null;
    const item = matches[0];
    if (
      typeof item.atendido !== "boolean" ||
      typeof item.analise !== "string" ||
      !item.analise.trim()
    )
      return null;
    if (
      item.atendido &&
      (!normalize(item.evidencia) ||
        !normalize(essay).includes(normalize(item.evidencia)))
    )
      return null;
    result.push(item);
  }
  return result;
}

function consistentScore(number, score, requirements, essay) {
  const selfReportedCap = scoreCapFromComment(number, score, requirements);
  const genericTextCap = genericTextScoreCap(number, score, essay);
  score = Math.min(score, selfReportedCap, genericTextCap);
  if (number === 3) {
    const items = assessment(
      requirements,
      ["sustentacao_argumentativa", "eixos_centrais_desenvolvidos"],
      essay,
    );
    if (!items) return { score };
    const cap = !items[0].atendido ? 80 : !items[1].atendido ? 120 : 200;
    if (score > cap)
      return {
        score: cap,
        comment: items
          .filter((item) => !item.atendido)
          .map((item) => item.analise.trim())
          .join(" "),
      };
  }
  if (number === 5) {
    const keys = ["agente", "acao", "meio_modo", "finalidade", "detalhamento"];
    const items = assessment(requirements, keys, essay);
    if (!items) return { score };
    const count = items.filter((item) => item.atendido).length;
    const cap = count * 40;
    if (score > cap)
      return {
        score: cap,
        comment:
          `A proposta apresenta ${count} elemento(s) efetivamente desenvolvido(s). ` +
          items
            .filter((item) => !item.atendido)
            .map((item) => item.analise.trim())
            .join(" "),
      };
  }
  return { score };
}

function genericTextScoreCap(number, score, essay) {
  const text = normalize(essay);
  const genericPhrases = [
    "muitas pessoas",
    "algumas pessoas",
    "mais atencao",
    "mais respeito",
    "melhorar a situacao",
    "melhorar os",
    "oferecer mais",
    "criar projetos",
    "pais melhor",
    "isso acaba sendo prejudicial",
    "isso faz com que",
  ];
  const genericCount = genericPhrases.filter((phrase) =>
    text.includes(phrase),
  ).length;
  const concreteSupport =
    /\b\d{1,4}(?:[,.]\d+)?\s*(?:%|mil(?:hao|hoes)|anos?)\b|\b(?:lei|constituicao|estatuto|censo|ibge|ipea|oms|unesco)\b|\bsegundo\s+[a-z]/.test(
      text,
    );
  if (genericCount < 3 || concreteSupport) return score;

  if (number === 3 && score > 80) return 80;
  if (number === 5 && score > 80) return 80;
  return score;
}

function scoreCapFromComment(number, score, requirements) {
  const comment = normalize(
    Array.isArray(requirements) ? requirements.comment : "",
  );
  // The caller attaches the model comment only for this check. A cap is used
  // when that comment itself admits a weakness incompatible with the score.
  if (
    number === 1 &&
    score > 120 &&
    /sintaxe (?:permanece |predominantemente )?(?:simples|pouco elaborada)|pouca variedade (?:sintatica|de estruturas)/.test(
      comment,
    )
  )
    return 120;
  if (
    number === 3 &&
    score > 80 &&
    /argumenta(?:cao|ção) superficial|desenvolvimento superficial|sem explicar (?:os )?(?:mecanismos|como|por que)|nao explica (?:os )?(?:mecanismos|como|por que)/.test(
      comment,
    )
  )
    return 80;
  return score;
}
module.exports = { consistentScore };
