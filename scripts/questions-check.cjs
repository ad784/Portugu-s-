// Browser interaction checks use the real bank and grading logic with synthetic persistence.
const fs = require("node:fs");
const path = require("node:path");
const { levels } = require("../backend/backend-src/data/exercises");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = async function questionsCheck({
  call,
  records,
  providerRequests,
  exceptions,
  setRoute,
  setGuest,
  failHistory,
  reportDir,
  userId,
}) {
  const evaluate = async (expression) => {
    const result = await call("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails)
      throw new Error(
        result.exceptionDetails.exception?.description ||
          result.exceptionDetails.text,
      );
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let attempt = 0; attempt < 120; attempt++) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    throw new Error("Condição não atingida: " + expression);
  };
  const clickText = (text) =>
    evaluate(
      `[...document.querySelectorAll('button')].find(button => button.textContent.trim() === ${JSON.stringify(text)})?.click()`,
    );
  const write = (selector, text) =>
    evaluate(
      `(() => { const field = document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(field,${JSON.stringify(text)});field.dispatchEvent(new Event('input',{bubbles:true})); })()`,
    );
  const screenshot = async (name) => {
    const result = await call("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    fs.writeFileSync(
      path.join(reportDir, name),
      Buffer.from(result.data, "base64"),
    );
  };
  const heights = [];
  async function assertEqualOptions(label) {
    const sizes = await evaluate(
      "[...document.querySelectorAll('.q-option')].map(node => node.getBoundingClientRect().height)",
    );
    if (sizes.length !== 3 || Math.max(...sizes) - Math.min(...sizes) > 1)
      throw new Error(
        `Alternativas com alturas diferentes (${label}): ${sizes}`,
      );
    heights.push({ label, sizes });
  }
  const oldText =
    "Meu trecho em andamento da versão anterior continua disponível para consulta.";
  await call("Page.addScriptToEvaluateOnNewDocument", {
    source: `if(location.hostname==='localhost'){const key=${JSON.stringify(`portugues:${userId}:questoes-rascunhos-v1`)};if(!localStorage.getItem(key))localStorage.setItem(key,${JSON.stringify(JSON.stringify({ drafts: { tese: { text: oldText, revision: "" } } }))});}`,
  });
  setRoute("/questoes");
  await call("Emulation.setDeviceMetricsOverride", {
    width: 1366,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await call("Page.navigate", { url: "http://localhost:3000/questoes" });
  await waitFor(
    "document.querySelectorAll('.q-level-card').length === 3 && document.querySelectorAll('.q-question-map button').length === 20 && !!document.querySelector('.nav-menu-toggle')",
  );
  await screenshot("questions-levels-desktop.png");
  const results = [];
  for (const [levelIndex, level] of levels.entries()) {
    await evaluate(
      `document.querySelector('[data-q-tab="practice"]').click();document.querySelector('[data-level="${level.id}"]').click()`,
    );
    const wrongEvery = [7, 4, 3][levelIndex];
    let expected = 0;
    for (const [index, question] of level.questions.entries()) {
      await waitFor(
        `document.querySelector('.q-quiz')?.dataset.questionId === '${question.id}' && !document.querySelector('.q-feedback')`,
      );
      await assertEqualOptions(question.id + "-desktop");
      const answer =
        index % wrongEvery === 0 ? (question.answer + 1) % 3 : question.answer;
      if (answer === question.answer) expected++;
      await evaluate(
        `document.querySelector('.q-options input[value="${answer}"]').click()`,
      );
      await clickText("Conferir resposta");
      await waitFor("!!document.querySelector('.q-feedback')");
      await assertEqualOptions(question.id + "-reviewed");
      if (index === 0 && levelIndex === 1) {
        const order = await evaluate(
          "[...document.querySelectorAll('.q-options input')].map(input=>input.value).join(',')",
        );
        await call("Page.reload");
        await waitFor(
          "document.querySelector('[data-level=medio]')?.getAttribute('aria-pressed') === 'true' && !!document.querySelector('.q-feedback')",
        );
        if (
          order !==
          (await evaluate(
            "[...document.querySelectorAll('.q-options input')].map(input=>input.value).join(',')",
          ))
        )
          throw new Error(
            "A ordem das alternativas mudou ao retomar o rascunho.",
          );
      }
      await clickText(
        index === 19 ? "Revisar questões erradas" : "Próxima questão",
      );
    }
    const wrongQuestions = level.questions.filter(
      (_, index) => index % wrongEvery === 0,
    );
    for (const [index, question] of wrongQuestions.entries()) {
      await waitFor(
        `document.querySelector('.q-quiz')?.dataset.errorReview === 'true' && document.querySelector('.q-quiz')?.dataset.questionId === '${question.id}' && !document.querySelector('.q-feedback')`,
      );
      if (index === 0) {
        await evaluate(
          `document.querySelector('.q-options input[value="${(question.answer + 1) % 3}"]').click()`,
        );
        await clickText("Conferir resposta");
        await waitFor("!!document.querySelector('.q-feedback')");
        await clickText("Tentar novamente");
        await waitFor("!document.querySelector('.q-feedback')");
        await call("Page.reload");
        await waitFor(
          `document.querySelector('.q-quiz')?.dataset.errorReview === 'true' && document.querySelector('.q-quiz')?.dataset.questionId === '${question.id}'`,
        );
      }
      await evaluate(
        `document.querySelector('.q-options input[value="${question.answer}"]').click()`,
      );
      await clickText("Conferir resposta");
      await waitFor("!!document.querySelector('.q-feedback')");
      await clickText(
        index === wrongQuestions.length - 1
          ? "Praticar a escrita"
          : "Próxima da revisão",
      );
    }
    await waitFor("!!document.getElementById('practice-original')");
    await evaluate(
      "(() => { const skill=document.getElementById('practice-skill');skill.value='introducao';skill.dispatchEvent(new Event('change',{bubbles:true}));const theme=document.getElementById('practice-theme');theme.value='cultura';theme.dispatchEvent(new Event('change',{bubbles:true})); })()",
    );
    const original =
      "A participação em atividades culturais depende das condições de acesso. Quando os eventos ficam concentrados em regiões centrais, moradores de bairros afastados podem enfrentar longos deslocamentos. Nesse cenário, a distância e o custo do transporte precisam ser considerados para ampliar as oportunidades de participação da população.";
    const revised =
      original +
      " Por isso, a distribuição de atividades pelos bairros também deve integrar as políticas culturais.";
    await write("#practice-original", original);
    await clickText("Revisar meu trecho");
    await waitFor("!!document.querySelector('.q-checks')");
    await evaluate(
      "document.querySelectorAll('.q-checks input')[0].click();document.querySelectorAll('.q-checks input')[1].click()",
    );
    await clickText("Quero reescrever e comparar");
    await waitFor("!!document.getElementById('practice-revision')");
    await write("#practice-revision", revised);
    await evaluate(
      "document.querySelectorAll('.q-rewrite input').forEach(input=>input.click())",
    );
    await clickText("Concluir e guardar");
    if (levelIndex === 0) {
      await waitFor(
        "document.querySelector('.q-message')?.textContent.includes('texto continua aqui')",
      );
      if (
        (await evaluate(
          "document.getElementById('practice-revision').value",
        )) !== revised
      )
        throw new Error("A falha apagou a reescrita.");
      await call("Page.reload");
      await waitFor("!!document.getElementById('practice-revision')");
      if (
        (await evaluate(
          "document.getElementById('practice-revision').value",
        )) !== revised
      )
        throw new Error("A retomada apagou a reescrita.");
      await clickText("Concluir e guardar");
    }
    await waitFor("!!document.querySelector('.questions-finished')");
    const record = records.find((item) => item.level_id === level.id);
    if (
      !record ||
      record.correct_count !== expected ||
      record.question_count !== 20
    )
      throw new Error("Pontuação incorreta em " + level.id);
    if (records.filter((item) => item.level_id === level.id).length !== 1)
      throw new Error("Rodada duplicada em " + level.id);
    await clickText("Ver meu progresso");
    await waitFor(
      "document.querySelectorAll('.q-history > .q-history-record').length === 1",
    );
    const stats = await evaluate(
      "[...document.querySelectorAll('.q-progress-stats strong')].map(node=>node.textContent.replace(/\\s/g,''))",
    );
    if (
      stats[0] !== `${expected}/20` ||
      stats[1] !== `${Math.round((expected / 20) * 100)}%` ||
      stats[2] !== "1"
    )
      throw new Error(
        "Os níveis foram misturados no progresso: " + JSON.stringify(stats),
      );
    await evaluate("document.querySelector('.q-history summary').click()");
    const versions = await evaluate(
      "[...document.querySelectorAll('.q-history .q-versions p')].map(node=>node.textContent)",
    );
    if (versions[0] !== original || versions[1] !== revised)
      throw new Error("A comparação não preservou os textos.");
    if ((await evaluate("document.querySelectorAll('.q-legacy').length")) !== 2)
      throw new Error(
        "O histórico ou os rascunhos antigos não foram preservados.",
      );
    results.push({ level: level.id, score: expected, total: 20 });
  }
  await evaluate("window.scrollTo(0,0)");
  await screenshot("questions-levels-progress.png");
  await call("Page.reload");
  await waitFor("document.querySelectorAll('.q-level-card').length === 3");
  await evaluate("document.querySelector('[data-q-tab=progress]').click()");
  await waitFor(
    "document.querySelectorAll('.q-history > .q-history-record').length === 1",
  );
  for (const level of levels) {
    await call("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await call("Page.navigate", {
      url: "http://localhost:3000/questoes?nivel=" + level.id,
    });
    await waitFor(
      `document.querySelector('[data-level=${level.id}]')?.getAttribute('aria-pressed') === 'true' && !!document.querySelector('.q-options')`,
    );
    if (await evaluate("document.documentElement.scrollWidth > innerWidth + 2"))
      throw new Error("Largura ultrapassou o celular em " + level.id);
    await assertEqualOptions(level.id + "-mobile");
    if (level.id === "facil") {
      await evaluate("window.scrollTo(0,0)");
      await screenshot("questions-levels-mobile.png");
    }
    await evaluate(
      "document.querySelector('.q-card').scrollIntoView({block:'start'})",
    );
    await screenshot(`questions-${level.id}-options-mobile.png`);
  }
  failHistory();
  await call("Page.reload");
  await waitFor(
    "document.querySelector('.q-saved-count')?.textContent.includes('indisponível')",
  );
  await evaluate("document.querySelector('[data-q-tab=progress]').click()");
  if (
    await evaluate(
      "!!document.querySelector('.q-empty') || !!document.querySelector('.q-chart')",
    )
  )
    throw new Error("Falha de conexão virou um progresso vazio.");
  await clickText("Carregar histórico novamente");
  await waitFor(
    "document.querySelectorAll('.q-history > .q-history-record').length === 1",
  );
  if (providerRequests.length || exceptions().length)
    throw new Error(
      JSON.stringify({ providerRequests, exceptions: exceptions() }),
    );
  setGuest(true);
  await call("Page.navigate", { url: "http://localhost:3000/questoes" });
  await waitFor(
    "location.pathname === '/' && !!document.getElementById('login-form')",
  );
  fs.writeFileSync(
    path.join(reportDir, "questions-levels-report.json"),
    JSON.stringify(
      {
        status: "passed",
        results,
        legacyAttempts: records.filter(
          (record) => record.material_version === 1,
        ).length,
        checkedHeights: heights,
        providerRequests,
        checks: [
          "60-questions",
          "three-separate-difficulties",
          "equal-option-heights",
          "stable-shuffled-options",
          "draft-resume",
          "save-failure-retains-writing",
          "no-duplicate-attempt",
          "version-comparison",
          "level-progress-after-reload",
          "legacy-data-preserved",
          "mobile-layout",
          "history-outage-recovery",
          "guest-blocked",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    "NÍVEIS OK: 60 questões, alternativas de alturas iguais, progresso separado, textos preservados, retomada, celular e bloqueio de visitantes.",
  );
};
