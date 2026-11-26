const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const crypto = require("node:crypto");
const {
  skills,
  levels,
  publicCatalog,
} = require("../backend/backend-src/data/exercises");
const {
  validateAttempt,
  checkAnswer,
  withBreakdown,
} = require("../backend/backend-src/services/exercises");
const {
  createExerciseRouter,
} = require("../backend/backend-src/routes/exercises");

function input(level = levels[0]) {
  return {
    id: crypto.randomUUID(),
    levelId: level.id,
    skillId: "introducao",
    themeId: "cultura",
    questionIds: level.questions.map((question) => question.id),
    answers: level.questions.map((question) => question.answer),
    text: "A oferta de atividades culturais deve considerar as condições de acesso. ".repeat(
      6,
    ),
    revision: "",
    checks: [true, false, true],
    revisionChecks: [false, false, false],
  };
}

test("three difficulty levels contain exactly twenty distinct questions, cover all skills and keep answer keys private", () => {
  const catalog = publicCatalog();
  assert.equal(catalog.version, 2);
  assert.equal(catalog.levels.length, 3);
  const ids = new Set();
  const prompts = new Set();
  for (const level of catalog.levels) {
    assert.equal(level.questions.length, 20);
    assert.equal(
      new Set(level.questions.map((question) => question.skillId)).size,
      6,
    );
    for (const question of level.questions) {
      ids.add(question.id);
      prompts.add(question.prompt);
      assert.equal(question.options.length, 3);
      assert.equal(question.answer, undefined);
      assert.equal(question.explanation, undefined);
    }
  }
  assert.equal(ids.size, 60);
  assert.equal(prompts.size, 60);
  assert.equal(skills.length, 6);
});

test("alternatives are balanced in length and neither longest nor shortest reveals the answer", () => {
  for (const level of levels) {
    let longestCorrect = 0,
      shortestCorrect = 0;
    for (const question of level.questions) {
      const words = question.options.map((value) => value.split(/\s+/u).length);
      const chars = question.options.map((value) => value.length);
      assert.ok(
        Math.max(...words) - Math.min(...words) <= 3,
        question.id + ": uneven word counts",
      );
      assert.ok(
        Math.max(...chars) / Math.min(...chars) <= 1.2,
        question.id + ": uneven character counts",
      );
      for (const option of question.options) {
        assert.equal(option, option.trim());
        assert.doesNotMatch(option, /[\u200b\u200c\u200d]/u);
      }
      if (chars[question.answer] === Math.max(...chars)) longestCorrect++;
      if (chars[question.answer] === Math.min(...chars)) shortestCorrect++;
    }
    assert.ok(
      longestCorrect >= 5 && longestCorrect <= 9,
      level.id + ": longest-answer bias",
    );
    assert.ok(
      shortestCorrect >= 5 && shortestCorrect <= 9,
      level.id + ": shortest-answer bias",
    );
  }
});

for (const level of levels)
  test(`${level.id}: every answer has feedback, final results use twenty questions and scores are computed on the API`, () => {
    for (const question of level.questions) {
      assert.equal(
        checkAnswer({
          levelId: level.id,
          questionId: question.id,
          answer: question.answer,
        }).correct,
        true,
      );
      const wrong = checkAnswer({
        levelId: level.id,
        questionId: question.id,
        answer: (question.answer + 1) % 3,
      });
      assert.equal(wrong.correct, false);
      assert.equal(wrong.correctOption, question.answer);
      assert.ok(wrong.explanation.length > 80);
      assert.doesNotMatch(
        wrong.explanation,
        /\b(?:primeira|segunda|terceira)\s+(?:alternativa|proposta|relação|passagem|tese|reescrita|interpretação|resposta|formulação)\b/iu,
        question.id + ": positional feedback breaks shuffled alternatives",
      );
    }
    const data = input(level);
    data.answers[0] = (data.answers[0] + 1) % 3;
    const record = validateAttempt({
      ...data,
      user_id: "forged-owner",
      correct_count: 999,
      created_at: "invented",
    });
    assert.equal(record.correct_count, 19);
    assert.equal(record.question_count, 20);
    assert.equal(record.material_version, 2);
    assert.equal(record.level_id, level.id);
    assert.equal(record.user_id, undefined);
    assert.equal(record.created_at, undefined);
    const summary = withBreakdown(record).skills_summary;
    assert.equal(
      summary.reduce((sum, item) => sum + item.total, 0),
      20,
    );
    assert.equal(
      summary.reduce((sum, item) => sum + item.correct, 0),
      19,
    );
  });

test("cross-level answers, duplicate question ids, incomplete rounds and fake rewrites are rejected", () => {
  const data = input();
  for (const changed of [
    null,
    {},
    { ...data, levelId: "unknown" },
    { ...data, answers: data.answers.slice(1) },
    { ...data, questionIds: Array(20).fill("f01") },
    { ...data, levelId: "medio" },
    { ...data, answers: Array(20).fill(null) },
    { ...data, answers: Array(20).fill(3) },
    { ...data, checks: [1, 1, 1] },
    { ...data, text: "curto" },
    { ...data, revision: data.text },
    { ...data, revision: false },
    { ...data, text: "a".repeat(4001) },
    { ...data, id: "bad-id" },
  ])
    assert.throws(() => validateAttempt(changed));
  assert.throws(() =>
    checkAnswer({ levelId: "medio", questionId: "f01", answer: 0 }),
  );
});

test("exercise API requires a session, scopes storage and retries a round without duplicating it", async (t) => {
  const records = new Map();
  let unavailable = false;
  const model = {
    async listAttempts(req) {
      return {
        data: [...records.values()].filter(
          (record) => record.owner === req.supabaseUser.id,
        ),
      };
    },
    async saveAttempt(req, record) {
      if (unavailable) return { error: new Error("offline") };
      const key = req.supabaseUser.id + ":" + record.id;
      if (!records.has(key))
        records.set(key, {
          ...record,
          owner: req.supabaseUser.id,
          created_at: new Date().toISOString(),
        });
      return { data: records.get(key) };
    },
  };
  const app = express();
  app.use(express.json());
  app.use(
    "/api/questoes",
    createExerciseRouter({
      model,
      requireSupabaseUser(req, res, next) {
        const id = req.get("X-Test-User");
        if (!id) return res.sendStatus(401);
        req.supabaseUser = { id };
        next();
      },
    }),
  );
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}/api/questoes`;
  assert.equal((await fetch(base)).status, 401);
  const send = (body) =>
    fetch(base + "/tentativas", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Test-User": "owner-a" },
      body: JSON.stringify(body),
    });
  const data = input();
  const first = await send(data);
  assert.equal(first.status, 200);
  assert.equal((await first.json()).attempt.skills_summary.length, 6);
  assert.equal((await send(data)).status, 200);
  assert.equal(records.size, 1);
  const own = await fetch(base + "/tentativas", {
    headers: { "X-Test-User": "owner-a" },
  });
  assert.equal((await own.json()).attempts.length, 1);
  const other = await fetch(base + "/tentativas", {
    headers: { "X-Test-User": "owner-b" },
  });
  assert.deepEqual((await other.json()).attempts, []);
  unavailable = true;
  const failed = await send({ ...data, id: crypto.randomUUID() });
  assert.equal(failed.status, 503);
  assert.match((await failed.json()).erro, /texto continua aqui/);
  assert.equal(records.size, 1);
});

test("progress compares the same difficulty and never reclassifies legacy attempts", async () => {
  const { levelProgress, wordCount } =
    await import("../frontend/frontend-src/services/exercises.mjs");
  const records = [
    {
      id: "b",
      level_id: "facil",
      material_version: 2,
      correct_count: 18,
      question_count: 20,
      created_at: "2026-11-25T12:00:00Z",
    },
    {
      id: "a",
      level_id: "facil",
      material_version: 2,
      correct_count: 10,
      question_count: 20,
      created_at: "2026-11-24T12:00:00Z",
    },
    {
      id: "c",
      level_id: "medio",
      material_version: 2,
      correct_count: 2,
      question_count: 20,
      created_at: "2026-11-26T12:00:00Z",
    },
    {
      id: "legacy",
      material_version: 1,
      skill_id: "tese",
      correct_count: 3,
      question_count: 3,
      created_at: "2026-11-23T12:00:00Z",
    },
  ];
  const result = levelProgress(records, "facil");
  assert.equal(result.first.correct_count, 10);
  assert.equal(result.latest.correct_count, 18);
  assert.equal(result.records.length, 2);
  assert.equal(result.best, 90);
  assert.deepEqual(withBreakdown(records[3]), records[3]);
  assert.equal(wordCount("  Minha primeira\nversão. "), 3);
});

test("all history pages load and an incomplete response is never presented as zero progress", async (t) => {
  const previous = global.window;
  t.after(() => {
    if (previous === undefined) delete global.window;
    else global.window = previous;
  });
  const { loadAttempts } =
    await import("../frontend/frontend-src/services/exercises.mjs");
  const pages = [];
  global.window = {
    portuguesSession: {
      request: async (url, options) => {
        assert.equal(options.expectedUserId, "owner-a");
        pages.push(url);
        const last = url.endsWith("page=1");
        return {
          ok: true,
          json: async () => ({
            attempts: last
              ? [{ id: "last" }]
              : Array.from({ length: 50 }, (_, index) => ({
                  id: String(index),
                })),
            hasMore: !last,
          }),
        };
      },
    },
  };
  assert.equal((await loadAttempts("owner-a")).length, 51);
  assert.equal(pages.length, 2);
  global.window.portuguesSession.request = async () => ({
    ok: true,
    json: async () => ({ attempts: [], hasMore: true }),
  });
  await assert.rejects(loadAttempts("owner-a"), /incompleto/);
});

test("drafts keep twenty answers, their shuffled alternatives and a stable id across reloads", async () => {
  const { newDraft, restoreDraft } =
    await import("../frontend/frontend-src/services/exercises.mjs");
  const catalog = publicCatalog();
  for (const level of catalog.levels) {
    const saved = {
      ...newDraft(level),
      stage: "write",
      answers: Array(20).fill(0),
      feedback: Array.from({ length: 20 }, () => ({
        correct: true,
        correctOption: 0,
        explanation: "Comentário do exercício.",
      })),
      text: "Minha primeira versão ainda em andamento.",
    };
    assert.equal(saved.answers.length, 20);
    assert.equal(saved.optionOrders.length, 20);
    for (const order of saved.optionOrders)
      assert.deepEqual([...order].sort(), [0, 1, 2]);
    const restored = restoreDraft(saved, catalog, level);
    assert.equal(restored.id, saved.id);
    assert.equal(restored.stage, "write");
    assert.equal(restored.text, saved.text);
    assert.deepEqual(restored.optionOrders, saved.optionOrders);
    assert.notEqual(
      restoreDraft(
        saved,
        catalog,
        catalog.levels.find((item) => item.id !== level.id),
      ).id,
      saved.id,
    );
  }
});
