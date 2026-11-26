export const DRAFT_KEY = "questoes-rascunhos-v2";
export const LEGACY_DRAFT_KEY = "questoes-rascunhos-v1";

function shuffleOptions() {
  const order = [0, 1, 2];
  for (let index = 2; index > 0; index--) {
    const value = crypto.getRandomValues(new Uint32Array(1))[0] % (index + 1);
    [order[index], order[value]] = [order[value], order[index]];
  }
  return order;
}

export function newDraft(level, themeId = "inclusao-digital") {
  return {
    id: crypto.randomUUID(),
    materialVersion: 2,
    levelId: level.id,
    questionIds: level.questions.map((question) => question.id),
    optionOrders: level.questions.map(() => shuffleOptions()),
    themeId,
    skillId: "introducao",
    writingStarted: false,
    answers: level.questions.map(() => null),
    feedback: level.questions.map(() => null),
    questionIndex: 0,
    retryIndices: [],
    retryPosition: 0,
    retryAnswers: level.questions.map(() => null),
    retryFeedback: level.questions.map(() => null),
    retryDone: false,
    stage: "quiz",
    text: "",
    checks: [false, false, false],
    revisionEnabled: false,
    revision: "",
    revisionChecks: [false, false, false],
  };
}

export function wordCount(text = "") {
  return (text.trim().match(/\S+/gu) || []).length;
}
export function percentage(record) {
  return Math.round((record.correct_count / record.question_count) * 100);
}

export function restoreDraft(value, catalog, level) {
  const fresh = () => newDraft(level);
  const length = level.questions.length;
  const checksValid = (items) =>
    Array.isArray(items) &&
    items.length === 3 &&
    items.every((item) => typeof item === "boolean");
  if (
    !value ||
    value.materialVersion !== 2 ||
    value.levelId !== level.id ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
      value.id || "",
    ) ||
    !catalog.themes.some((theme) => theme.id === value.themeId) ||
    !catalog.skills.some((skill) => skill.id === value.skillId) ||
    !Array.isArray(value.questionIds) ||
    value.questionIds.length !== length ||
    value.questionIds.some((id, index) => id !== level.questions[index].id) ||
    !Array.isArray(value.answers) ||
    value.answers.length !== length ||
    value.answers.some(
      (item) =>
        item !== null && (!Number.isInteger(item) || item < 0 || item > 2),
    ) ||
    !Array.isArray(value.optionOrders) ||
    value.optionOrders.length !== length ||
    value.optionOrders.some(
      (order) =>
        !Array.isArray(order) || [...order].sort().join(",") !== "0,1,2",
    ) ||
    !Array.isArray(value.feedback) ||
    value.feedback.length !== length ||
    value.feedback.some(
      (item) =>
        item !== null &&
        (typeof item.correct !== "boolean" ||
          typeof item.explanation !== "string" ||
          !Number.isInteger(item.correctOption) ||
          item.correctOption < 0 ||
          item.correctOption > 2),
    ) ||
    !checksValid(value.checks) ||
    !checksValid(value.revisionChecks) ||
    typeof value.text !== "string" ||
    value.text.length > 4000 ||
    typeof value.revision !== "string" ||
    value.revision.length > 4000
  )
    return fresh();
  return {
    ...value,
    retryIndices:
      Array.isArray(value.retryIndices) &&
      value.retryIndices.every(
        (index) =>
          Number.isInteger(index) &&
          index >= 0 &&
          index < length &&
          value.feedback[index]?.correct === false,
      )
        ? value.retryIndices
        : [],
    retryPosition:
      Number.isInteger(value.retryPosition) &&
      value.retryPosition >= 0 &&
      value.retryPosition < (value.retryIndices?.length || 0)
        ? value.retryPosition
        : 0,
    retryAnswers:
      Array.isArray(value.retryAnswers) &&
      value.retryAnswers.length === length &&
      value.retryAnswers.every(
        (item) =>
          item === null || (Number.isInteger(item) && item >= 0 && item <= 2),
      )
        ? value.retryAnswers
        : level.questions.map(() => null),
    retryFeedback:
      Array.isArray(value.retryFeedback) &&
      value.retryFeedback.length === length &&
      value.retryFeedback.every(
        (item) =>
          item === null ||
          (typeof item?.correct === "boolean" &&
            typeof item.explanation === "string" &&
            Number.isInteger(item.correctOption) &&
            item.correctOption >= 0 &&
            item.correctOption <= 2),
      )
        ? value.retryFeedback
        : level.questions.map(() => null),
    retryDone: value.retryDone === true,
    questionIndex: Math.max(
      0,
      Math.min(length - 1, Number(value.questionIndex) || 0),
    ),
    stage:
      value.feedback.every(Boolean) && ["write", "review"].includes(value.stage)
        ? value.stage
        : "quiz",
  };
}

export function levelProgress(attempts, levelId) {
  const records = attempts
    .filter((item) => item.material_version === 2 && item.level_id === levelId)
    .sort(
      (a, b) =>
        a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
    );
  return {
    records,
    first: records[0] || null,
    latest: records.at(-1) || null,
    best: records.length ? Math.max(...records.map(percentage)) : null,
  };
}

export function draftBreakdown(level, draft, skills) {
  return skills.map((skill) => {
    const indices = level.questions.flatMap((question, index) =>
      question.skillId === skill.id ? [index] : [],
    );
    return {
      skill_id: skill.id,
      total: indices.length,
      correct: indices.filter((index) => draft.feedback[index]?.correct).length,
    };
  });
}

export async function exerciseRequest(path, owner, options = {}) {
  const response = await window.portuguesSession.request(
    `/api/questoes${path}`,
    {
      ...options,
      expectedUserId: owner,
      ...(options.body
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(options.body),
          }
        : {}),
    },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.erro || "Não foi possível concluir o treino.");
  return data;
}

export async function loadAttempts(owner) {
  const records = new Map();
  for (let page = 0; page <= 10000; page++) {
    const data = await exerciseRequest(`/tentativas?page=${page}`, owner);
    if (
      !Array.isArray(data.attempts) ||
      (data.hasMore && !data.attempts.length)
    )
      throw new Error("O histórico de treinos retornou incompleto.");
    for (const record of data.attempts) records.set(record.id, record);
    if (!data.hasMore) return [...records.values()];
  }
  throw new Error("Não foi possível concluir a leitura do histórico.");
}
