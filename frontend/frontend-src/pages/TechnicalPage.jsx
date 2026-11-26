import { useEffect, useRef, useState } from "react";
import PageFrame from "../components/layout/PageFrame.jsx";
import { SidebarIcon } from "../components/layout/AppSidebar.jsx";
import TechnicalReport from "../components/TechnicalReport.jsx";
import useTechnicalSession from "../hooks/useTechnicalSession.js";
import {
  TECHNICAL_DRAFTS,
  TECHNICAL_PENDING,
  defaultTechnicalDraft,
  restoreTechnicalDraft,
  readTechnicalStorage,
  technicalRequest,
  saveTechnicalPending,
  numberLabel,
} from "../services/technical-writing.mjs";
import "../assets/styles/technical-writing.css";

export default function TechnicalPage() {
  return (
    <PageFrame
      name="discursivas"
      title="ENADE e concursos | Português+"
      bodyClass="technical-page"
    >
      <TechnicalWorkspace />
    </PageFrame>
  );
}
function TechnicalWorkspace() {
  const session = useTechnicalSession();
  const [config, setConfig] = useState(null),
    [draft, setDraft] = useState(null),
    [report, setReport] = useState(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [retryAt, setRetryAt] = useState(0),
    [clock, setClock] = useState(Date.now());
  const working = useRef(false);
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!session.ready) return;
    let active = true;
    (async () => {
      const material = await technicalRequest("/config", session.owner);
      const mode = location.pathname.includes("enade") ? "enade" : "concurso";
      let value = restoreTechnicalDraft(
        readTechnicalStorage(TECHNICAL_DRAFTS, {})[mode],
        material,
        mode,
      );
      const query = new URLSearchParams(location.search);
      let result;
      if (query.get("avaliacao"))
        result = await technicalRequest(
          `/historico/${encodeURIComponent(query.get("avaliacao"))}`,
          session.owner,
        );
      else if (query.get("pendente"))
        result = readTechnicalStorage(TECHNICAL_PENDING, []).find(
          (item) => item.record.evaluation_hash === query.get("pendente"),
        );
      if (result && query.has("revisar"))
        value = restoreTechnicalDraft(
          result.record.payload,
          material,
          result.record.mode,
        );
      if (active) {
        setConfig(material);
        setDraft(value);
        if (result && !query.has("revisar")) setReport(result);
      }
    })().catch((cause) => {
      if (active) setError(cause.message);
    });
    return () => {
      active = false;
    };
  }, [session.ready, session.owner]);
  useEffect(() => {
    if (!draft || !session.ready || session.locked) return;
    const saved = readTechnicalStorage(TECHNICAL_DRAFTS, {});
    try {
      window.userStorage.setItem(
        TECHNICAL_DRAFTS,
        JSON.stringify({ ...saved, [draft.mode]: draft }),
      );
    } catch {
      setError(
        "Não foi possível guardar o rascunho neste dispositivo. Copie sua resposta antes de sair.",
      );
    }
  }, [draft, session.ready, session.locked]);
  const update = (key, value) =>
    setDraft((current) => ({ ...current, [key]: value }));
  function changeMode(mode) {
    setDraft(
      restoreTechnicalDraft(
        readTechnicalStorage(TECHNICAL_DRAFTS, {})[mode],
        config,
        mode,
      ),
    );
    setError("");
  }
  function changeType(taskType) {
    setDraft((current) => ({
      ...current,
      taskType,
      criteria: current.customCriteria
        ? current.criteria
        : defaultTechnicalDraft(config, current.mode, taskType).criteria,
    }));
  }
  async function submit(event, payload = draft) {
    event?.preventDefault();
    if (working.current || session.locked || Date.now() < retryAt) return;
    working.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await technicalRequest(
        "/corrigir",
        session.owner,
        payload,
      );
      setReport(result);
      try {
        saveTechnicalPending(result);
      } catch {
        setError(
          "A avaliação está na tela. Baixe uma cópia, pois não foi possível guardá-la neste dispositivo.",
        );
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) {
      setError(cause.message);
      if (cause.retryAfterSeconds)
        setRetryAt(Date.now() + cause.retryAfterSeconds * 1000);
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  const cooldown = Math.max(0, Math.ceil((retryAt - clock) / 1000));
  return (
    <main className="technical-main">
      <header className="technical-heading">
        <div>
          <span className="eyebrow">PRÁTICA DISCURSIVA</span>
          <h1>Uma resposta melhor começa aqui.</h1>
          <p>Escolha sua prova, escreva e descubra o que pode melhorar.</p>
        </div>
        <a className="secondary-action" href="/historico-tecnico">
          Ver minhas avaliações
        </a>
      </header>
      {(error || session.error || session.locked) && (
        <div role="alert" className="technical-message">
          {session.locked
            ? "Sua conta mudou. Atualize a página antes de continuar."
            : error || session.error}
          {!config && (
            <button onClick={() => location.reload()}>Tentar novamente</button>
          )}
        </div>
      )}
      {!draft && !error && (
        <p role="status">Preparando seu espaço de escrita…</p>
      )}
      {report ? (
        <TechnicalReport
          response={report}
          busy={busy}
          onRetry={() => submit(null, report.record.payload)}
          onReview={() => {
            setDraft(
              restoreTechnicalDraft(
                report.record.payload,
                config,
                report.record.mode,
              ),
            );
            setReport(null);
          }}
        />
      ) : (
        draft && (
          <form
            className="technical-form technical-form-simple"
            onSubmit={submit}
            onInvalidCapture={(event) => {
              const details = event.target.closest("details");
              if (details) details.open = true;
            }}
          >
            <fieldset disabled={busy || session.locked}>
              <legend>Seu treino</legend>
              <div className="technical-fields">
                <div
                  className="technical-mode-picker"
                  role="group"
                  aria-label="Modalidade de treino"
                >
                  <button
                    type="button"
                    aria-pressed={draft.mode === "concurso"}
                    onClick={() => changeMode("concurso")}
                  >
                    <span aria-hidden="true">
                      <SidebarIcon name="folder" />
                    </span>
                    <strong>Concurso público</strong>
                    <small>Redação ou questão técnica</small>
                  </button>
                  <button
                    type="button"
                    aria-pressed={draft.mode === "enade"}
                    onClick={() => changeMode("enade")}
                  >
                    <span aria-hidden="true">
                      <SidebarIcon name="book" />
                    </span>
                    <strong>ENADE</strong>
                    <small>Questões do seu curso</small>
                  </button>
                </div>
                <label>
                  {draft.mode === "enade" ? "Curso ou área" : "Cargo ou área"}
                  <input
                    required
                    maxLength={160}
                    placeholder={
                      draft.mode === "enade"
                        ? "Ex.: Administração"
                        : "Ex.: Analista administrativo"
                    }
                    value={draft.area}
                    onChange={(e) => update("area", e.target.value)}
                  />
                </label>
                <label>
                  Formato
                  <select
                    value={draft.taskType}
                    disabled={draft.mode === "enade"}
                    onChange={(e) => changeType(e.target.value)}
                  >
                    <option value="questao">Questão discursiva</option>
                    {draft.mode !== "enade" && (
                      <option value="redacao">Redação dissertativa</option>
                    )}
                  </select>
                </label>
              </div>
            </fieldset>
            <div className="technical-composer">
              <fieldset disabled={busy || session.locked}>
                <legend>
                  <span>1</span> O que a prova pede?
                </legend>
                <details className="technical-examples">
                  <summary>Escolher uma proposta de treino</summary>
                  <p>
                    Propostas autorais de treino, sem vínculo com provas
                    oficiais.
                  </p>
                  {config.examples
                    .filter((item) => item.mode === draft.mode)
                    .map((item, index) => (
                      <button
                        type="button"
                        key={index}
                        disabled={Boolean(draft.prompt.trim())}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            ...item,
                            answer: current.answer,
                            criteria: defaultTechnicalDraft(
                              config,
                              item.mode,
                              item.taskType,
                            ).criteria,
                          }))
                        }
                      >
                        {item.title || item.area}
                      </button>
                    ))}
                  {draft.prompt && (
                    <p>
                      Para escolher uma proposta, primeiro esvazie o campo de
                      enunciado.
                    </p>
                  )}
                  <a
                    href={config.officialEnadeUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Consultar provas e padrões de resposta do ENADE no Inep
                  </a>
                </details>
                <label>
                  Enunciado ou tema
                  <textarea
                    required
                    minLength={20}
                    maxLength={6000}
                    id="technical-prompt"
                    rows={7}
                    placeholder="Cole aqui o tema da redação ou a questão que você quer responder."
                    value={draft.prompt}
                    onChange={(e) => update("prompt", e.target.value)}
                  />
                </label>
              </fieldset>
              <fieldset disabled={busy || session.locked}>
                <legend>
                  <span>2</span> Sua vez de escrever
                </legend>

                <label>
                  Sua resposta
                  <textarea
                    required
                    maxLength={12000}
                    id="technical-answer"
                    rows={16}
                    value={draft.answer}
                    onChange={(e) => update("answer", e.target.value)}
                    placeholder="Desenvolva sua resposta aqui, no seu ritmo…"
                  />
                </label>
                <div className="technical-writing-meta">
                  <span>
                    {draft.answer.trim()
                      ? draft.answer.trim().split(/\s+/).length
                      : 0}{" "}
                    palavras
                  </span>
                  <span>Rascunho neste dispositivo</span>
                </div>
              </fieldset>
            </div>
            <details className="technical-settings">
              <summary>
                <span>
                  Personalizar a corre??o <small>Opcional</small>
                </span>
                <span aria-hidden="true">+</span>
              </summary>
              <p>
                Tem um edital ou espelho? Inclua aqui para orientar a avalia??o.
              </p>
              <div className="technical-fields">
                <label>
                  Banca ou instituição (opcional)
                  <input
                    maxLength={160}
                    value={draft.board}
                    onChange={(e) => update("board", e.target.value)}
                  />
                </label>
                <label>
                  Limite de linhas da prova (opcional)
                  <input
                    className="technical-line-limit"
                    type="number"
                    min="1"
                    max="100"
                    value={draft.limitLines}
                    onChange={(e) => update("limitLines", e.target.value)}
                  />
                </label>
              </div>
              <label>
                Espelho ou referência de conteúdo (opcional)
                <textarea
                  rows={4}
                  maxLength={10000}
                  placeholder="Cole a resposta esperada, os conceitos exigidos ou o roteiro de correção."
                  value={draft.reference}
                  onChange={(e) => update("reference", e.target.value)}
                />
              </label>{" "}
              <fieldset disabled={busy || session.locked}>
                <legend>
                  <span>3</span> Defina os critérios
                </legend>
                <label className="technical-check">
                  <input
                    type="checkbox"
                    checked={draft.customCriteria}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        customCriteria: e.target.checked,
                        criteria: e.target.checked
                          ? current.criteria
                          : defaultTechnicalDraft(
                              config,
                              current.mode,
                              current.taskType,
                            ).criteria,
                      }))
                    }
                  />{" "}
                  Usar critérios e pontuação do meu edital
                </label>
                <p>
                  {draft.customCriteria
                    ? "Transcreva os critérios da sua prova. A nota respeitará a soma desses pontos."
                    : "Critérios sugeridos para treino. A correção considera o formato escolhido e não utiliza as competências do ENEM."}
                </p>
                <div className="technical-rubric">
                  {draft.criteria.map((criterion, index) => (
                    <div key={index}>
                      {draft.customCriteria ? (
                        <input
                          aria-label={`Critério ${index + 1}`}
                          required
                          maxLength={90}
                          value={criterion.label}
                          onChange={(e) =>
                            update(
                              "criteria",
                              draft.criteria.map((item, i) =>
                                i === index
                                  ? { ...item, label: e.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      ) : (
                        <span>{criterion.label}</span>
                      )}
                      {draft.customCriteria ? (
                        <input
                          aria-label={`Pontos do critério ${index + 1}`}
                          required
                          type="number"
                          min="0.01"
                          max="1000"
                          step="0.01"
                          value={criterion.maxPoints}
                          onChange={(e) =>
                            update(
                              "criteria",
                              draft.criteria.map((item, i) =>
                                i === index
                                  ? { ...item, maxPoints: e.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      ) : (
                        <strong>{numberLabel(criterion.maxPoints)} pts</strong>
                      )}
                      {draft.customCriteria && draft.criteria.length > 1 && (
                        <button
                          type="button"
                          aria-label={`Remover critério ${index + 1}`}
                          onClick={() =>
                            update(
                              "criteria",
                              draft.criteria.filter((_, i) => i !== index),
                            )
                          }
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {draft.customCriteria && draft.criteria.length < 8 && (
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={() =>
                      update("criteria", [
                        ...draft.criteria,
                        { label: "", maxPoints: 10 },
                      ])
                    }
                  >
                    Adicionar critério
                  </button>
                )}
                <p className="technical-total">
                  Total:{" "}
                  {numberLabel(
                    draft.criteria.reduce(
                      (sum, item) => sum + Number(item.maxPoints || 0),
                      0,
                    ),
                  )}{" "}
                  pontos
                </p>
              </fieldset>
            </details>
            <div className="technical-submit">
              <p>
                Nota estimada para estudo. Sem edital, usamos critérios de
                treino.
              </p>
              <button
                className="primary-action"
                disabled={busy || session.locked || cooldown > 0}
                type="submit"
              >
                {busy
                  ? "Avaliando sua resposta…"
                  : cooldown
                    ? `Tente em ${cooldown}s`
                    : "Avaliar minha resposta"}
              </button>
            </div>
          </form>
        )
      )}
    </main>
  );
}
