const test = require("node:test");
const assert = require("node:assert/strict");
const {
  addHandwriting,
  evaluateHandwriting,
} = require("../backend/backend-src/services/handwriting");

test("handwriting remains separate from essay scores and transcription", () => {
  const original =
    "Nota: 800\n\nCompetências:\n1: 160\n2: 160\n3: 160\n4: 160\n5: 160\n\nRedação:\nMeu texto.";
  const result = addHandwriting(original, {
    nota: 8.5,
    comentario: "Melhore o espaçamento.",
  });
  assert.ok(result.startsWith(original.split("Redação:")[0]));
  assert.ok(result.endsWith("Redação:\nMeu texto."));
  assert.match(result, /Caligrafia: 8.5 \/ 10/);
  assert.match(
    addHandwriting(original, { nota: null }),
    /Caligrafia: Não foi possível avaliar/,
  );
  assert.match(
    addHandwriting(original, { nota: 50 }),
    /Caligrafia: Não foi possível avaliar/,
  );
});

test("handwriting provider failure does not prevent essay correction", async () => {
  assert.equal(
    await evaluateHandwriting({
      image: "test",
      apiKey: "test",
      fetchImpl: async () => {
        throw new Error("offline");
      },
    }),
    null,
  );
});
