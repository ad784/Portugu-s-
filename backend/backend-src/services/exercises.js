const { skills, themes, levels } = require("../data/exercises");

function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function skillById(id) {
  return skills.find((skill) => skill.id === id);
}

function levelById(id) {
  return levels.find((level) => level.id === id);
}

function checkAnswer({ levelId, questionId, answer } = {}) {
  const question = levelById(levelId)?.questions.find(
    (item) => item.id === questionId,
  );
  if (
    !question ||
    !Number.isInteger(answer) ||
    answer < 0 ||
    answer >= question.options.length
  )
    invalid("Selecione uma alternativa válida para esta questão.");
  return {
    correct: answer === question.answer,
    correctOption: question.answer,
    explanation: question.explanation,
    example: skillById(question.skillId).example,
  };
}

function words(text) {
  return (text.trim().match(/\S+/gu) || []).length;
}

function validateAttempt(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    invalid("Os dados do treino são inválidos.");
  const skill = skillById(input.skillId);
  const level = levelById(input.levelId);
  if (!level)
    invalid("Escolha o nível Fácil, Médio ou Difícil para este treino.");
  if (!skill || !themes.some((theme) => theme.id === input.themeId))
    invalid("Escolha uma habilidade e um tema válidos.");
  if (
    typeof input.id !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
      input.id,
    )
  )
    invalid(
      "Esta tentativa não tem um identificador válido. Inicie um novo treino.",
    );
  if (
    !Array.isArray(input.answers) ||
    input.answers.length !== level.questions.length ||
    input.answers.some(
      (answer) => !Number.isInteger(answer) || answer < 0 || answer > 2,
    )
  )
    invalid("Responda às 20 questões do nível antes de concluir.");
  if (
    !Array.isArray(input.questionIds) ||
    input.questionIds.length !== level.questions.length ||
    input.questionIds.some((id, index) => id !== level.questions[index].id)
  )
    invalid(
      "As questões não correspondem ao nível selecionado. Retome a rodada correta.",
    );
  const text = input.text;
  if (
    typeof text !== "string" ||
    text.length > 4000 ||
    words(text) < skill.minimumWords
  )
    invalid(
      `Escreva pelo menos ${skill.minimumWords} palavras e no máximo 4.000 caracteres.`,
    );
  const revision = input.revision ?? "";
  if (
    typeof revision !== "string" ||
    revision.length > 4000 ||
    (revision && words(revision) < skill.minimumWords)
  )
    invalid("A reescrita precisa respeitar a extensão indicada no exercício.");
  if (revision && revision.trim() === text.trim())
    invalid("Faça uma mudança no trecho antes de registrar uma reescrita.");
  const validChecks = (checks) =>
    Array.isArray(checks) &&
    checks.length === skill.checks.length &&
    checks.every((check) => typeof check === "boolean");
  if (!validChecks(input.checks) || !validChecks(input.revisionChecks))
    invalid("Confira o roteiro de revisão antes de concluir.");
  return {
    id: input.id,
    skill_id: skill.id,
    level_id: level.id,
    question_ids: input.questionIds,
    theme_id: input.themeId,
    answers: input.answers,
    correct_count: input.answers.filter(
      (answer, index) => answer === level.questions[index].answer,
    ).length,
    question_count: level.questions.length,
    original_text: text.trim(),
    revised_text: revision.trim() || null,
    self_checks: input.checks,
    revision_checks: revision ? input.revisionChecks : [false, false, false],
    material_version: 2,
  };
}

function withBreakdown(record) {
  const level = levelById(record.level_id);
  if (!level || record.material_version !== 2) return record;
  const summaries = skills.map((skill) => ({
    skill_id: skill.id,
    correct: 0,
    total: 0,
  }));
  for (let index = 0; index < (record.question_ids || []).length; index++) {
    const question = level.questions.find(
      (item) => item.id === record.question_ids[index],
    );
    if (!question) continue;
    const group = summaries.find((item) => item.skill_id === question.skillId);
    group.total++;
    if (record.answers[index] === question.answer) group.correct++;
  }
  return { ...record, skills_summary: summaries };
}

module.exports = {
  checkAnswer,
  validateAttempt,
  skillById,
  levelById,
  withBreakdown,
};
