const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

test("leaving a completed essay does not recreate its draft, while later edits are retained", () => {
  const stored = new Map();
  const fields = {
    redacao: { value: "completed essay" },
    "tema-enem": { value: "selected theme" },
  };
  const context = {
    document: {
      getElementById: (id) => fields[id] || null,
      addEventListener() {},
    },
    window: {
      addEventListener() {},
      userStorage: {
        setItem: (key, value) => stored.set(key, value),
        removeItem: (key) => stored.delete(key),
      },
    },
    console,
    clearTimeout,
    setTimeout,
  };
  vm.runInNewContext(
    fs.readFileSync("frontend/scripts/script.js", "utf8"),
    context,
  );
  vm.runInNewContext(
    "completedDraft = {texto: 'completed essay', tema: 'selected theme'}; salvarRascunho();",
    context,
  );
  assert.equal(stored.has("rascunho-redacao-v1"), false);
  fields.redacao.value = "new version written during correction";
  context.salvarRascunho();
  assert.equal(
    JSON.parse(stored.get("rascunho-redacao-v1")).texto,
    fields.redacao.value,
  );
  fields.redacao.value = "completed essay";
  fields["tema-enem"].value = "new theme";
  context.salvarRascunho();
  assert.equal(JSON.parse(stored.get("rascunho-redacao-v1")).tema, "new theme");
});

test("history merges records by the correction hash and tolerates invalid dates", () => {
  const context = { window: { addEventListener() {} } };
  vm.runInNewContext(
    fs
      .readFileSync("frontend/scripts/session.js", "utf8")
      .replace(/^import writingRules.*$/m, "const writingRules = {};")
      .replace(/export /g, ""),
    context,
  );
  vm.runInNewContext(
    fs.readFileSync("frontend/scripts/historico.js", "utf8"),
    context,
  );
  const result = context.mergeCorrections(
    [{ id: "db-1", avaliacao_hash: "same" }],
    [
      { id: "local-1", hash: "same" },
      { id: "local-2", hash: "new" },
    ],
  );
  assert.equal(result.length, 2);
  assert.equal(result[1].id, "local-2");
  assert.equal(context.formatDate(undefined), "Data indisponível");
});
