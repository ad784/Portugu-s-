const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizarCorrecao,
} = require("../backend/backend-src/controllers/text-correction");
const {
  consistentScore,
} = require("../backend/backend-src/services/score-consistency");
const essay =
  "A prefeitura deve ampliar equipes por meio de concursos para reduzir as filas, priorizando os bairros distantes.";
const item = (criterio, atendido, evidencia = "") => ({
  criterio,
  atendido,
  evidencia,
  analise: `Análise de ${criterio}.`,
});
const intervention = [
  item("agente", true, "A prefeitura"),
  item("acao", true, "ampliar equipes"),
  item("meio_modo", false),
  item("finalidade", false),
  item("detalhamento", false),
];

test("explicit missing intervention elements constrain the score and update the total and explanation", () => {
  const raw = {
    competencias: [1, 2, 3, 4, 5].map((competencia) => ({
      competencia,
      nota: 160,
      comentario: "Comentário original.",
      requisitos: competencia === 5 ? intervention : [],
    })),
  };
  const result = normalizarCorrecao(raw, essay);
  assert.equal(result.competencias[4].nota, 80);
  assert.equal(result.notaFinal, 720);
  assert.match(result.competencias[4].comentario, /2 elemento/);
  assert.equal(result.competencias[0].nota, 160);
});
test("argumentation cannot exceed the level its assessment demonstrates", () => {
  const absent = [
    item("sustentacao_argumentativa", false),
    item("eixos_centrais_desenvolvidos", false),
  ];
  assert.equal(consistentScore(3, 160, absent, essay).score, 80);
  assert.equal(consistentScore(3, 40, absent, essay).score, 40);
  absent[0] = item("sustentacao_argumentativa", true, "reduzir as filas");
  assert.equal(consistentScore(3, 160, absent, essay).score, 120);
});
test("the score cannot contradict a weakness stated in its own comment", () => {
  const syntax = Object.assign([], {
    comment: "A sintaxe permanece simples e pouco elaborada.",
  });
  const generic = Object.assign([], {
    comment: "O desenvolvimento superficial não explica os mecanismos.",
  });
  assert.equal(consistentScore(1, 160, syntax, essay).score, 120);
  assert.equal(consistentScore(3, 120, generic, essay).score, 80);
  assert.equal(consistentScore(1, 160, [], essay).score, 160);
});
test("generic essays without concrete support do not receive high bands for development or intervention", () => {
  const generic = `Atualmente, muitas pessoas enfrentam um problema na sociedade. Por isso, é importante discutir essa situação.
Primeiramente, outro problema é a falta de atenção. Isso faz com que algumas pessoas sejam prejudicadas.
Além disso, muitas pessoas não têm mais respeito. Portanto, o governo deve melhorar os serviços e criar projetos para um país melhor.`;
  assert.equal(consistentScore(3, 120, [], generic).score, 80);
  assert.equal(consistentScore(5, 120, [], generic).score, 80);
  assert.equal(consistentScore(1, 160, [], generic).score, 160);
  assert.equal(consistentScore(4, 160, [], generic).score, 160);
});
test("concrete support prevents the generic-text cap", () => {
  const developed =
    "Segundo o Censo do IBGE de 2022, 15% da população é idosa. A prefeitura deve ampliar equipes por meio de concursos para reduzir as filas, priorizando os bairros distantes.";
  assert.equal(consistentScore(3, 160, [], developed).score, 160);
  assert.equal(consistentScore(5, 160, [], developed).score, 160);
});
test("complete intervention retains 200 and no rule increases a lower score", () => {
  const complete = [
    "agente",
    "acao",
    "meio_modo",
    "finalidade",
    "detalhamento",
  ].map((key, i) =>
    item(
      key,
      true,
      [
        "A prefeitura",
        "ampliar equipes",
        "por meio de concursos",
        "reduzir as filas",
        "priorizando os bairros distantes",
      ][i],
    ),
  );
  assert.equal(consistentScore(5, 200, complete, essay).score, 200);
  assert.equal(consistentScore(5, 0, complete, essay).score, 0);
});
test("missing, duplicated, malformed or invented evidence cannot be used to impose a cap", () => {
  for (const invalid of [
    undefined,
    [],
    intervention.slice(1),
    [...intervention, intervention[0]],
    intervention.map((r, i) =>
      i === 0 ? { ...r, evidencia: "Trecho que não existe" } : r,
    ),
    intervention.map((r, i) => (i === 0 ? { ...r, analise: 123 } : r)),
  ]) {
    assert.equal(consistentScore(5, 160, invalid, essay).score, 160);
  }
});
