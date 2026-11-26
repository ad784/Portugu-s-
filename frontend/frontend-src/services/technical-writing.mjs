export const TECHNICAL_DRAFTS = "discursivas-rascunhos-v1";
export const TECHNICAL_PENDING = "discursivas-pendentes-v1";
export const numberLabel = (value) =>
  Number.isFinite(Number(value))
    ? new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(
        Number(value),
      )
    : "—";
export const dateLabel = (value) =>
  new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
export function defaultTechnicalDraft(
  config,
  mode = "concurso",
  taskType = mode === "enade" ? "questao" : "redacao",
) {
  const profile = config.profiles.find(
    (item) => item.mode === mode && item.taskType === taskType,
  );
  return {
    mode,
    taskType,
    area: "",
    board: "",
    prompt: "",
    reference: "",
    answer: "",
    limitLines: "",
    customCriteria: false,
    criteria: profile.criteria.map(({ id, label, maxPoints }) => ({
      id,
      label,
      maxPoints,
    })),
  };
}
export function restoreTechnicalDraft(value, config, mode) {
  const draft = defaultTechnicalDraft(config, mode);
  if (
    !value ||
    value.mode !== mode ||
    !["questao", "redacao"].includes(value.taskType) ||
    (mode === "enade" && value.taskType !== "questao")
  )
    return draft;
  for (const [key, limit] of Object.entries({
    area: 160,
    board: 160,
    prompt: 6000,
    reference: 10000,
    answer: 12000,
  })) {
    if (typeof value[key] !== "string" || value[key].length > limit)
      return draft;
  }
  if (
    !Array.isArray(value.criteria) ||
    !value.criteria.length ||
    value.criteria.length > 8 ||
    value.criteria.some(
      (item) => typeof item?.label !== "string" || item.label.length > 90,
    )
  )
    return draft;
  return { ...draft, ...value, mode };
}
export function readTechnicalStorage(key, fallback) {
  try {
    return JSON.parse(
      window.userStorage.getItem(key) || JSON.stringify(fallback),
    );
  } catch {
    return fallback;
  }
}
export function saveTechnicalPending(response) {
  const pending = readTechnicalStorage(TECHNICAL_PENDING, []);
  const records = Array.isArray(pending)
    ? pending.filter(
        (item) =>
          item.record.evaluation_hash !== response.record.evaluation_hash,
      )
    : [];
  if (!response.salvo) records.unshift(response);
  window.userStorage.setItem(TECHNICAL_PENDING, JSON.stringify(records));
}
export async function technicalRequest(path, owner, body) {
  const response = await window.portuguesSession.request(
    `/api/discursivas${path}`,
    {
      expectedUserId: owner,
      ...(body
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
    },
  );
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(
      data.erro || "Não foi possível concluir a operação.",
    );
    error.status = response.status;
    error.retryAfterSeconds = data.retryAfterSeconds;
    throw error;
  }
  return data;
}
export function technicalReportText(record) {
  const result = record.result;
  return [
    record.mode === "enade"
      ? "ENADE — avaliação de estudo"
      : "Concurso público — avaliação de estudo",
    `Área: ${record.area}`,
    `Nota estimada: ${numberLabel(result.score)} / ${numberLabel(result.maxScore)}`,
    result.referenceBased
      ? "Referência fornecida pelo estudante; não autenticada."
      : "Sem espelho de correção: estimativa por critérios de treino.",
    "",
    "Síntese:",
    result.summary,
    "",
    "Critérios:",
    ...result.criteria.flatMap((item) => [
      `${item.label}: ${numberLabel(item.points)} / ${numberLabel(item.maxPoints)}`,
      item.comment,
      item.evidence ? `Trecho: ${item.evidence}` : "",
    ]),
    "",
    "Itens do comando:",
    ...result.items.map(
      (item) => `${item.item}: ${item.status} — ${item.comment}`,
    ),
    "",
    "Próximos passos:",
    ...result.improvements,
    result.revision,
    "",
    "Pontos a conferir:",
    ...result.technicalAlerts,
    "",
    "Enunciado:",
    record.payload.prompt,
    "",
    "Sua resposta:",
    record.payload.answer,
  ].join("\n");
}
