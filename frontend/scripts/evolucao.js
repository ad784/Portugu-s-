const HISTORY_KEY = "historico-redacoes-local";
const COMPETENCY_NAMES = [
  "C1 · Norma-padrão",
  "C2 · Tema e repertório",
  "C3 · Argumentação",
  "C4 · Coesão",
  "C5 · Intervenção",
];

async function sair(event) {
  event?.preventDefault();
  return window.portuguesSession.signOut();
}

function localHistory() {
  try {
    return JSON.parse(window.userStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function competencyScores(result = "") {
  const section =
    result.match(
      /Compet[eê]ncias\s*:\s*([\s\S]*?)(?:\n\s*(?:Erros|Sugest[oõ]es|Reda[cç][aã]o)\s*:|$)/i,
    )?.[1] || "";
  const scores = Array(5).fill(null);
  for (const match of section.matchAll(
    /^\s*(?:C)?([1-5])\s*[:–-]\s*(\d{1,3})/gim,
  )) {
    scores[Number(match[1]) - 1] = Math.max(0, Math.min(200, Number(match[2])));
  }
  return scores;
}

function dateLabel(value, options = { day: "2-digit", month: "2-digit" }) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Data indisponível"
    : new Intl.DateTimeFormat("pt-BR", options).format(date);
}

function formatScores(records) {
  return records
    .map((item) => {
      const storedScore = item.nota;
      const parsedScore = item.resultado?.match(/^\s*Nota\s*:\s*(\d+)/im)?.[1];
      return {
        ...item,
        score:
          storedScore !== null &&
          storedScore !== undefined &&
          storedScore !== "" &&
          Number.isFinite(Number(storedScore))
            ? Number(storedScore)
            : Number(parsedScore),
        competencies: item.competencias || competencyScores(item.resultado),
      };
    })
    .filter(
      (item) =>
        Number.isFinite(item.score) && item.score >= 0 && item.score <= 1000,
    )
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

function renderSummary(records) {
  const target = document.getElementById("progress-summary");
  target.replaceChildren();
  const scores = records.map((item) => item.score);
  const first = scores[0];
  const last = scores.at(-1);
  const delta = scores.length > 1 ? last - first : null;
  const data = [
    [String(records.length), "redações corrigidas"],
    [
      scores.length
        ? String(
            Math.round(
              scores.reduce((sum, score) => sum + score, 0) / scores.length,
            ),
          )
        : "—",
      "média de pontos",
    ],
    [
      delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta}`,
      "pontos desde a primeira",
    ],
  ];
  for (const [value, label] of data) {
    const card = document.createElement("div");
    const strong = document.createElement("strong");
    const span = document.createElement("span");
    strong.textContent = value;
    span.textContent = label;
    card.append(strong, span);
    target.append(card);
  }
}

function renderScoreChart(records) {
  const target = document.getElementById("score-chart");
  const description = document.getElementById("score-chart-description");
  if (!records.length) {
    target.innerHTML =
      '<div class="chart-empty"><h3>Ainda não há notas para mostrar</h3><p>Depois de corrigir e salvar sua primeira redação, seu gráfico aparecerá aqui.</p><a class="primary-action" href="/nova">Escrever primeira redação <span aria-hidden="true">→</span></a></div>';
    description.textContent = "";
    return;
  }

  const width = 760,
    height = 300,
    left = 54,
    right = 18,
    top = 20,
    bottom = 48;
  const plotWidth = width - left - right,
    plotHeight = height - top - bottom;
  const x = (index) =>
    records.length === 1
      ? left + plotWidth / 2
      : left + (index * plotWidth) / (records.length - 1);
  const y = (score) => top + ((1000 - score) * plotHeight) / 1000;
  const points = records
    .map((item, index) => `${x(index)},${y(item.score)}`)
    .join(" ");
  const horizontal = [0, 250, 500, 750, 1000]
    .map(
      (value) =>
        `<g class="chart-grid"><line x1="${left}" y1="${y(value)}" x2="${width - right}" y2="${y(value)}"></line><text x="${left - 10}" y="${y(value) + 4}" text-anchor="end">${value}</text></g>`,
    )
    .join("");
  const dots = records
    .map(
      (item, index) =>
        `<circle class="chart-point" cx="${x(index)}" cy="${y(item.score)}" r="5"><title>Redação ${index + 1}, ${dateLabel(item.created_at, { dateStyle: "medium" })}: ${item.score} pontos</title></circle>`,
    )
    .join("");
  const ticks = [
    ...new Set([0, Math.floor((records.length - 1) / 2), records.length - 1]),
  ]
    .map(
      (index) =>
        `<text class="chart-date" x="${x(index)}" y="${height - 15}" text-anchor="middle">${dateLabel(records[index].created_at)}</text>`,
    )
    .join("");
  target.innerHTML = `<svg class="score-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="svg-chart-title svg-chart-desc" preserveAspectRatio="xMidYMid meet"><title id="svg-chart-title">Notas das redações ao longo do tempo</title><desc id="svg-chart-desc">${records.length} redações, da mais antiga à mais recente. Primeira nota: ${records[0].score}; última nota: ${records.at(-1).score}.</desc>${horizontal}<polyline class="chart-line" points="${points}"></polyline>${dots}${ticks}</svg>`;
  const change =
    records.length > 1 ? records.at(-1).score - records[0].score : null;
  description.textContent =
    records.length === 1
      ? `Sua primeira redação registrada teve ${records[0].score} pontos, em ${dateLabel(records[0].created_at, { dateStyle: "long" })}. Continue praticando para acompanhar sua evolução.`
      : `Da primeira redação (${records[0].score}) à mais recente (${records.at(-1).score}), sua variação foi de ${change > 0 ? "+" : ""}${change} pontos.`;
}

function renderCompetencies(records) {
  const target = document.getElementById("competency-progress");
  const withCompetencies = records.filter((item) =>
    item.competencies.some(Number.isFinite),
  );
  if (!withCompetencies.length) {
    target.innerHTML =
      '<p class="chart-empty-inline">Ainda não há notas individuais das competências nos relatórios salvos.</p>';
    return;
  }
  const firstGroup = withCompetencies.slice(
    0,
    Math.min(3, withCompetencies.length),
  );
  const latestGroup = withCompetencies.slice(
    -Math.min(3, withCompetencies.length),
  );
  target.innerHTML = COMPETENCY_NAMES.map((name, index) => {
    const avg = (group) => {
      const values = group
        .map((item) => item.competencies[index])
        .filter(Number.isFinite);
      return values.length
        ? Math.round(
            values.reduce((sum, value) => sum + value, 0) / values.length,
          )
        : null;
    };
    const early = avg(firstGroup),
      recent = avg(latestGroup);
    if (early === null && recent === null) return "";
    const value = recent ?? early;
    return `<div class="competency-row"><div class="competency-row-label"><strong>${name}</strong><span>${early === null ? "—" : early} → ${recent === null ? "—" : recent} / 200</span></div><div class="competency-track" role="img" aria-label="${name}: ${value} de 200 pontos na média recente"><span style="width:${value / 2}%"></span></div></div>`;
  }).join("");
}

async function loadProgress() {
  try {
    if (!window.supabaseClient) throw new Error("Autenticação indisponível");
    await window.portuguesSession.syncPending();
    const response = await window.portuguesSession.request("/api/evolucao");
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.erro || "Não foi possível carregar suas redações.");
    const remote = data.redacoes || [];
    const local = localHistory();
    const ids = new Set(remote.map((item) => item.id));
    const hashes = new Set(remote.map((item) => item.hash).filter(Boolean));
    renderProgress([
      ...remote,
      ...local.filter(
        (item) => !ids.has(item.id) && (!item.hash || !hashes.has(item.hash)),
      ),
    ]);
  } catch (error) {
    const local = localHistory();
    if (local.length) {
      renderProgress(local);
      const notice = document.createElement("p");
      notice.className = "form-message error";
      notice.setAttribute("role", "status");
      notice.textContent =
        "Não foi possível atualizar a conta. Estes dados incluem somente avaliações pendentes neste dispositivo.";
      document.getElementById("score-chart").prepend(notice);
    } else {
      const message = document.createElement("p");
      message.textContent =
        error.message || "Não foi possível carregar seu histórico.";
      document.getElementById("score-chart").replaceChildren(message);
      document.getElementById("competency-progress").replaceChildren();
    }
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "secondary-action";
    retry.textContent = "Tentar carregar novamente";
    retry.addEventListener("click", async () => {
      retry.disabled = true;
      retry.textContent = "Carregando...";
      await loadProgress();
    });
    document.getElementById("score-chart").append(retry);
  }
}

function renderProgress(items) {
  const records = formatScores(items);
  renderSummary(records);
  renderScoreChart(records);
  renderCompetencies(records);
}

window.sair = sair;
window.addEventListener("DOMContentLoaded", loadProgress);
