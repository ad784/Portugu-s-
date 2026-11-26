const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
module.exports = async ({ call, setRoute, exceptions, reportDir }) => {
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
  const wait = async (expression) => {
    for (let i = 0; i < 100; i++) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    throw new Error("Timeout: " + expression);
  };
  const screenshot = async (name) => {
    const shot = await call("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    fs.writeFileSync(
      path.join(reportDir, name),
      Buffer.from(shot.data, "base64"),
    );
  };
  const navigate = async (route) => {
    setRoute(route);
    await call("Page.navigate", { url: "http://localhost:3000" + route });
  };
  const type = (selector, value, prototype = "HTMLInputElement") =>
    evaluate(
      `(() => { const node = document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(${prototype}.prototype,'value').set.call(node,${JSON.stringify(value)});node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true})); })()`,
    );
  await call("Emulation.setDeviceMetricsOverride", {
    width: 1366,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await navigate("/discursivas");
  await wait(
    "document.querySelectorAll('.technical-form fieldset').length===4",
  );
  await screenshot("technical-desktop.png");
  await type(".technical-fields input", "Administração");
  await type(
    "#technical-prompt",
    "Explique como o mapeamento de processos auxilia o atendimento e indique um indicador.",
    "HTMLTextAreaElement",
  );
  await type(
    "#technical-answer",
    "O mapeamento identifica as etapas do atendimento e localiza gargalos. O tempo médio de atendimento permite comparar os resultados antes e depois de uma melhoria.",
    "HTMLTextAreaElement",
  );
  await evaluate(
    "document.querySelector('.technical-settings').open=true;document.querySelector('.technical-check input').click()",
  );
  await type(".technical-rubric input[type=number]", "10");
  await call("Page.reload");
  await wait(
    "document.querySelector('#technical-prompt')?.value.includes('mapeamento')",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('.technical-rubric input[type=number]').value",
    ),
    "10",
  );
  await evaluate("document.querySelector('.technical-form').requestSubmit()");
  await wait("!!document.querySelector('.technical-report')");
  assert.equal(
    await evaluate(
      "document.querySelectorAll('.technical-criteria-results article').length",
    ),
    5,
  );
  await screenshot("technical-report-desktop.png");
  await evaluate(
    "document.querySelector('.technical-revision-task button').click()",
  );
  await wait("!!document.querySelector('.technical-form')");
  assert.ok(
    await evaluate(
      "document.querySelector('#technical-answer').value.includes('gargalos')",
    ),
  );
  await evaluate("document.querySelector('.app-sidebar-toggle').click()");
  await wait("!!document.querySelector('.app-shell-collapsed')");
  await call("Page.reload");
  await wait("!!document.querySelector('.app-shell-collapsed')");
  await evaluate("document.querySelector('.app-sidebar-toggle').click()");
  await evaluate(
    "document.querySelectorAll('.technical-mode-picker button')[1].click()",
  );
  await wait(
    "document.querySelector('.technical-fields select').value==='questao'",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('.technical-fields select').disabled",
    ),
    true,
  );
  await call("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await delay(350);
  await screenshot("technical-mobile.png");
  assert.equal(
    await evaluate("document.documentElement.scrollWidth > innerWidth+2"),
    false,
  );
  await evaluate("document.querySelector('.app-mobile-toggle').click()");
  await wait("!!document.querySelector('.is-mobile-open')");
  await delay(350);
  await screenshot("sidebar-mobile.png");
  await call("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
  });
  await wait("!document.querySelector('.is-mobile-open')");
  await navigate("/questoes");
  await wait("document.querySelectorAll('.q-question-map button').length===20");
  async function geometry(label) {
    const result = await evaluate(
      `(() => { const map=document.querySelector('.q-question-map').getBoundingClientRect();const nodes=[...document.querySelectorAll('.q-question-map button')].map(n=>n.getBoundingClientRect());return {inside:nodes.every(n=>n.left>=map.left-1&&n.right<=map.right+1),overlap:nodes.some((a,i)=>nodes.some((b,j)=>i!==j&&a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1)),width:map.width}; })()`,
    );
    assert.ok(result.inside, label + ": outside grid");
    assert.equal(result.overlap, false, label + ": overlapping buttons");
  }
  await geometry("mobile");
  await screenshot("question-map-mobile.png");
  await call("Emulation.setDeviceMetricsOverride", {
    width: 1366,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await delay(300);
  await geometry("desktop");
  await screenshot("question-map-desktop.png");
  assert.equal(
    await evaluate("document.documentElement.scrollWidth > innerWidth+2"),
    false,
  );
  await evaluate("document.querySelector('.app-sidebar-toggle').click()");
  await delay(300);
  await geometry("collapsed");
  await navigate("/historico-tecnico");
  await wait(
    "document.body.innerText.includes('Nenhuma avaliação nesta seleção')",
  );
  assert.deepEqual(exceptions(), []);
  console.log(
    JSON.stringify({
      ok: true,
      checks: [
        "custom rubric",
        "draft restore",
        "report",
        "review",
        "ENADE format",
        "sidebar persistence",
        "mobile menu",
        "question map geometry at three sizes",
        "technical history",
      ],
    }),
  );
};
