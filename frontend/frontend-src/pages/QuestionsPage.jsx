import { useEffect, useRef, useState } from "react";
import PageFrame from "../components/layout/PageFrame.jsx";
import {
  DRAFT_KEY,
  LEGACY_DRAFT_KEY,
  exerciseRequest,
  loadAttempts,
  newDraft,
  restoreDraft,
  levelProgress,
  draftBreakdown,
  percentage,
  wordCount,
} from "../services/exercises.mjs";
import "../assets/styles/questions.css";

const dateLabel = (value) =>
  new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
const letters = ["A", "B", "C"];

function LevelIcon({ rank }) {
  return (
    <svg viewBox="0 0 30 30" fill="none" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <rect
          key={index}
          x={4 + index * 8}
          y={19 - index * 6}
          width="5"
          height={7 + index * 6}
          rx="2"
          className={index < rank ? "is-filled" : ""}
        />
      ))}
    </svg>
  );
}
function CheckList({ items, values, onChange, label }) {
  return (
    <fieldset className="q-checks">
      <legend>{label}</legend>
      {items.map((item, index) => (
        <label key={item}>
          <input
            type="checkbox"
            checked={values[index]}
            onChange={() =>
              onChange(
                values.map((value, position) =>
                  position === index ? !value : value,
                ),
              )
            }
          />
          <span>{item}</span>
        </label>
      ))}
    </fieldset>
  );
}
function Versions({ original, revision }) {
  return (
    <div className={`q-versions ${revision ? "has-revision" : ""}`}>
      <div>
        <h4>Primeira versão</h4>
        <p>{original}</p>
      </div>
      {revision && (
        <div>
          <h4>Depois da revisão</h4>
          <p>{revision}</p>
        </div>
      )}
    </div>
  );
}
function Breakdown({ summaries, skills }) {
  return (
    <div className="q-breakdown">
      {summaries.map((item) => (
        <div key={item.skill_id}>
          <span>
            {skills.find((skill) => skill.id === item.skill_id)?.title}
          </span>
          <strong>
            {item.correct}
            <small>/{item.total}</small>
          </strong>
          <progress
            value={item.correct}
            max={item.total || 1}
            aria-label={`Acertos em ${skills.find((skill) => skill.id === item.skill_id)?.title}`}
          />
        </div>
      ))}
    </div>
  );
}
function PracticeChart({ records, title }) {
  const shown = records.slice(-10);
  const points = shown.map((item, index) => ({
    x: shown.length === 1 ? 300 : 48 + (index * 510) / (shown.length - 1),
    y: 153 - percentage(item) * 1.15,
    item,
  }));
  return (
    <figure className="q-chart">
      <svg
        viewBox="0 0 600 194"
        role="img"
        aria-labelledby="q-chart-title q-chart-desc"
      >
        <title id="q-chart-title">Evolução dos acertos no nível {title}</title>
        <desc id="q-chart-desc">
          {shown
            .map(
              (item) =>
                `${dateLabel(item.created_at)}: ${item.correct_count} de ${item.question_count} acertos`,
            )
            .join(". ")}
        </desc>
        {[0, 25, 50, 75, 100].map((value) => (
          <g key={value}>
            <line
              x1="48"
              x2="558"
              y1={153 - value * 1.15}
              y2={153 - value * 1.15}
            />
            <text x="5" y={157 - value * 1.15}>
              {value}%
            </text>
          </g>
        ))}
        {points.length > 1 && (
          <polyline points={points.map(({ x, y }) => `${x},${y}`).join(" ")} />
        )}
        {points.map(({ x, y, item }, index) => (
          <g key={item.id}>
            <circle cx={x} cy={y} r="5">
              <title>
                {dateLabel(item.created_at)}: {percentage(item)}% de acertos
              </title>
            </circle>
            <text x={x} y="183" textAnchor="middle">
              {records.length - shown.length + index + 1}
            </text>
          </g>
        ))}
      </svg>
      <figcaption>
        Últimas {shown.length} rodadas deste nível. O gráfico acompanha a
        compreensão das mesmas 20 questões; compare também seus textos.
      </figcaption>
    </figure>
  );
}
function HistoryRecord({ record, catalog }) {
  const skill = catalog.skills.find((item) => item.id === record.skill_id);
  return (
    <details className="q-history-record">
      <summary>
        <span className="q-history-date">
          <strong>
            {catalog.themes.find((item) => item.id === record.theme_id)
              ?.title || "Treino de escrita"}
          </strong>
          <time dateTime={record.created_at}>
            {dateLabel(record.created_at)}
          </time>
        </span>
        <span className="q-history-score">
          {record.correct_count}
          <small>/{record.question_count}</small>
          <span>acertos</span>
        </span>
        <span className="q-expand" aria-hidden="true">
          +
        </span>
      </summary>
      <p className="q-muted">
        Prática de {skill?.title.toLowerCase() || "escrita"} ·{" "}
        {record.revised_text ? "duas versões" : "uma versão"}
      </p>
      <Versions
        original={record.original_text}
        revision={record.revised_text}
      />
      <div className="q-review-summary">
        <strong>Sua autoavaliação</strong>
        {skill?.checks.map((check, index) => (
          <p key={check}>
            <span>
              {record.self_checks[index] ? "Identifiquei" : "A desenvolver"}
            </span>
            {check}
            {record.revised_text && (
              <small>
                Após reescrever:{" "}
                {record.revision_checks[index]
                  ? "identifiquei"
                  : "ainda a desenvolver"}
                .
              </small>
            )}
          </p>
        ))}
      </div>
    </details>
  );
}

export default function QuestionsPage() {
  const [catalog, setCatalog] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [levelId, setLevelId] = useState("facil");
  const [tab, setTab] = useState("practice");
  const [attempts, setAttempts] = useState([]);
  const [legacyDrafts, setLegacyDrafts] = useState([]);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState(null);
  const owner = useRef(null);
  const actionPending = useRef(false);
  const heading = useRef(null);
  const initCounter = useRef(0);
  const focusHeading = () => setTimeout(() => heading.current?.focus(), 0);

  async function initialize() {
    const run = ++initCounter.current;
    setLoading(true);
    setError("");
    try {
      const auth = await import("../services/auth.js");
      await auth.ready;
      const session = await window.portuguesSession.getSession();
      if (!session?.user) return;
      owner.current = session.user.id;
      const material = await exerciseRequest("", owner.current);
      if (run !== initCounter.current) return;
      let saved = {},
        previous = {};
      try {
        saved = JSON.parse(window.userStorage.getItem(DRAFT_KEY) || "{}");
      } catch {
        /* Invalid drafts do not block the page. */
      }
      try {
        previous = JSON.parse(
          window.userStorage.getItem(LEGACY_DRAFT_KEY) || "{}",
        );
      } catch {
        /* Older material is optional. */
      }
      const params = new URLSearchParams(window.location.search);
      const selected = params.get("nivel") || saved.levelId;
      setLevelId(
        material.levels.some((item) => item.id === selected)
          ? selected
          : "facil",
      );
      const restored = Object.fromEntries(
        material.levels.map((level) => [
          level.id,
          restoreDraft(saved.drafts?.[level.id], material, level),
        ]),
      );
      const selectedSkill = params.get("habilidade");
      if (material.skills.some((item) => item.id === selectedSkill))
        restored[
          material.levels.some((item) => item.id === selected)
            ? selected
            : "facil"
        ].skillId = selectedSkill;
      setDrafts(restored);
      setCatalog(material);
      setLegacyDrafts(
        Object.entries(previous.drafts || {})
          .filter(
            ([, value]) => typeof value?.text === "string" && value.text.trim(),
          )
          .map(([skillId, value]) => ({
            skillId,
            text: value.text,
            revision: typeof value.revision === "string" ? value.revision : "",
          })),
      );
      try {
        const records = await loadAttempts(owner.current);
        if (run === initCounter.current) {
          setAttempts(records);
          setHistoryError("");
        }
      } catch (failure) {
        if (run === initCounter.current) setHistoryError(failure.message);
      }
    } catch (failure) {
      if (run === initCounter.current) setError(failure.message);
    } finally {
      if (run === initCounter.current) setLoading(false);
    }
  }

  useEffect(() => {
    let active = true,
      unsubscribe;
    initialize();
    const expired = () => setLocked(true);
    window.addEventListener("portugues:session-expired", expired);
    import("../services/auth.js")
      .then(async ({ ready }) => {
        await ready;
        if (!active || !window.authClient) return;
        const result = window.authClient.auth.onAuthStateChange(
          (_event, session) => {
            if (owner.current) setLocked(session?.user?.id !== owner.current);
          },
        );
        unsubscribe = () => result.data.subscription.unsubscribe();
      })
      .catch(() => {});
    return () => {
      active = false;
      initCounter.current++;
      unsubscribe?.();
      window.removeEventListener("portugues:session-expired", expired);
    };
  }, []);
  useEffect(() => {
    if (
      catalog &&
      !loading &&
      !locked &&
      window.portuguesSession?.userId() === owner.current
    )
      window.userStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ levelId, drafts }),
      );
  }, [catalog, drafts, levelId, loading, locked]);

  const level = catalog?.levels.find((item) => item.id === levelId);
  const draft = drafts[levelId];
  const skill = catalog?.skills.find((item) => item.id === draft?.skillId);
  const question = level?.questions[draft?.questionIndex || 0];
  const questionSkill = catalog?.skills.find(
    (item) => item.id === question?.skillId,
  );
  const retrying = Boolean(draft?.retryIndices?.length && !draft.retryDone);
  const activeAnswers = retrying ? draft.retryAnswers : draft?.answers;
  const feedback = (retrying ? draft.retryFeedback : draft?.feedback)?.[
    draft?.questionIndex
  ];
  const answered = draft?.feedback.filter(Boolean).length || 0;
  const correct = draft?.feedback.filter((item) => item?.correct).length || 0;
  const progress = levelProgress(attempts, levelId);
  const legacyAttempts = attempts.filter((item) => item.material_version !== 2);
  const theme = catalog?.themes.find((item) => item.id === draft?.themeId);
  const patch = (values) =>
    setDrafts((current) => ({
      ...current,
      [levelId]: { ...current[levelId], ...values },
    }));
  function selectLevel(id) {
    if (actionPending.current) return;
    setLevelId(id);
    setFinished(null);
    setError("");
    focusHeading();
  }

  async function check() {
    if (
      actionPending.current ||
      locked ||
      feedback ||
      activeAnswers[draft.questionIndex] === null
    )
      return;
    actionPending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await exerciseRequest("/conferir", owner.current, {
        method: "POST",
        body: {
          levelId,
          questionId: question.id,
          answer: activeAnswers[draft.questionIndex],
        },
      });
      patch({
        [retrying ? "retryFeedback" : "feedback"]: (retrying
          ? draft.retryFeedback
          : draft.feedback
        ).map((value, index) =>
          index === draft.questionIndex ? result : value,
        ),
      });
    } catch (failure) {
      setError(failure.message);
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  }
  function advance() {
    if (retrying) {
      if (!feedback?.correct) {
        patch({
          retryAnswers: draft.retryAnswers.map((value, index) =>
            index === draft.questionIndex ? null : value,
          ),
          retryFeedback: draft.retryFeedback.map((value, index) =>
            index === draft.questionIndex ? null : value,
          ),
        });
        focusHeading();
        return;
      }
      if (draft.retryPosition + 1 < draft.retryIndices.length) {
        patch({
          retryPosition: draft.retryPosition + 1,
          questionIndex: draft.retryIndices[draft.retryPosition + 1],
        });
        focusHeading();
        return;
      }
    }
    if (answered === level.questions.length) {
      const wrong = draft.feedback.flatMap((item, index) =>
        item && !item.correct ? [index] : [],
      );
      if (!retrying && !draft.retryDone && wrong.length) {
        patch({
          retryIndices: wrong,
          retryPosition: 0,
          questionIndex: wrong[0],
        });
        focusHeading();
        return;
      }
      const summaries = draftBreakdown(level, draft, catalog.skills).sort(
        (a, b) => a.correct / a.total - b.correct / b.total,
      );
      patch({
        stage: "write",
        retryDone: true,
        ...(draft.writingStarted
          ? {}
          : { skillId: summaries[0].skill_id, writingStarted: true }),
      });
    } else {
      let next = draft.questionIndex + 1;
      if (next >= level.questions.length)
        next = draft.feedback.findIndex((item) => !item);
      patch({ questionIndex: next });
    }
    focusHeading();
  }
  async function save() {
    if (actionPending.current || locked) return;
    actionPending.current = true;
    setBusy(true);
    setError("");
    try {
      const { attempt } = await exerciseRequest("/tentativas", owner.current, {
        method: "POST",
        body: {
          id: draft.id,
          levelId,
          questionIds: draft.questionIds,
          skillId: draft.skillId,
          themeId: draft.themeId,
          answers: draft.answers,
          text: draft.text,
          checks: draft.checks,
          revision: draft.revisionEnabled ? draft.revision : "",
          revisionChecks: draft.revisionChecks,
        },
      });
      setAttempts((records) => [
        attempt,
        ...records.filter((item) => item.id !== attempt.id),
      ]);
      setFinished(attempt);
      setDrafts((current) => ({
        ...current,
        [levelId]: newDraft(level, draft.themeId),
      }));
      focusHeading();
    } catch (failure) {
      setError(failure.message);
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  }
  async function retryHistory() {
    if (actionPending.current || locked) return;
    actionPending.current = true;
    setBusy(true);
    try {
      setAttempts(await loadAttempts(owner.current));
      setHistoryError("");
    } catch (failure) {
      setHistoryError(failure.message);
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  }

  return (
    <PageFrame
      name="questoes"
      title="Questões por nível | Português+"
      bodyClass="questions-page"
    >
      <header className="site-header">
        <a
          className="brand"
          href="/nova"
          aria-label="Página inicial do Português+"
        >
          <img
            className="brand-icon"
            src="/images/logo-portugues-mais.png"
            alt=""
          />
          <span>
            Português<span>+</span>
          </span>
        </a>
        <nav className="site-nav" aria-label="Navegação principal">
          <a href="/nova">Nova redação</a>
          <a href="/questoes" aria-current="page">
            Questões
          </a>
          <a href="/historico">Minhas redações</a>
          <a href="/evolucao">Minha evolução</a>
          <a href="/" data-action="signout" className="nav-cta">
            Sair
          </a>
        </nav>
      </header>
      <main className="questions-main">
        <section className="q-hero">
          <div>
            <span className="q-eyebrow">
              <span className="q-spark" aria-hidden="true">
                ✦
              </span>{" "}
              SEU ESPAÇO DE PRÁTICA
            </span>
            <h1>
              Questões para
              <br />
              <span>escrever melhor.</span>
            </h1>
            <p>
              Fortaleça sua base, desafie suas ideias e acompanhe cada passo da
              sua escrita.
            </p>
            <div className="q-hero-tags">
              <span>60 questões comentadas</span>
              <span>6 habilidades de escrita</span>
            </div>
          </div>
          <div className="q-hero-art" aria-hidden="true">
            <div className="q-paper">
              <span className="q-paper-heading"></span>
              <span></span>
              <span></span>
              <span className="q-paper-highlight"></span>
              <span></span>
              <div className="q-paper-check">✓</div>
            </div>
            <span className="q-art-label">
              Um pouco melhor
              <br />
              <strong>a cada tentativa.</strong>
            </span>
          </div>
        </section>
        <div className="q-tabs" aria-label="Área de treino">
          <button
            type="button"
            data-q-tab="practice"
            aria-pressed={tab === "practice"}
            onClick={() => {
              setTab("practice");
              setError("");
            }}
          >
            Praticar
          </button>
          <button
            type="button"
            data-q-tab="progress"
            aria-pressed={tab === "progress"}
            onClick={() => {
              setTab("progress");
              setError("");
            }}
          >
            Meu progresso
          </button>
          <span>Um treino de cada vez, no seu ritmo.</span>
        </div>
        {locked && (
          <p className="q-message" role="alert">
            Sua sessão mudou. Entre novamente na conta original para retomar
            seus treinos.
          </p>
        )}
        {error && (
          <div className="q-message" role="alert">
            <p>{error}</p>
            {!catalog && (
              <button type="button" disabled={loading} onClick={initialize}>
                Tentar carregar novamente
              </button>
            )}
          </div>
        )}
        {loading && (
          <p className="q-loading" role="status">
            Preparando suas questões…
          </p>
        )}
        {catalog && draft && !locked && (
          <>
            <section
              className="q-level-section"
              aria-labelledby="q-level-title"
            >
              <div className="q-section-heading">
                <div>
                  <h2 id="q-level-title">Escolha seu próximo desafio</h2>
                  <p>20 questões por nível, da compreensão à análise.</p>
                </div>
                <span className="q-saved-count">
                  {historyError
                    ? "Histórico indisponível"
                    : `${attempts.length} ${attempts.length === 1 ? "treino salvo" : "treinos salvos"}`}
                </span>
              </div>
              <div className="q-level-grid">
                {catalog.levels.map((item, index) => {
                  const count =
                    drafts[item.id]?.feedback.filter(Boolean).length || 0;
                  const last = levelProgress(attempts, item.id).latest;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`q-level-card q-level-${item.id}`}
                      data-level={item.id}
                      aria-pressed={levelId === item.id}
                      disabled={busy}
                      onClick={() => selectLevel(item.id)}
                    >
                      <span className="q-level-top">
                        <span className="q-level-icon">
                          <LevelIcon rank={index + 1} />
                        </span>
                        <span className="q-level-tag">{item.tag}</span>
                        <span className="q-level-selected" aria-hidden="true">
                          {levelId === item.id ? "✓" : ""}
                        </span>
                      </span>
                      <span className="q-level-name">
                        <strong>{item.title}</strong>
                        <span>20 questões</span>
                      </span>
                      <span className="q-level-description">
                        {item.description}
                      </span>
                      <span className="q-level-bottom">
                        {count
                          ? `${count}/20 respondidas nesta rodada`
                          : historyError
                            ? "Histórico indisponível"
                            : last
                              ? `Último treino: ${last.correct_count}/20 acertos`
                              : "Pronto para começar"}
                      </span>
                      <progress
                        max={20}
                        value={
                          count || (!historyError && last?.correct_count) || 0
                        }
                        aria-label={
                          count
                            ? `Questões respondidas no nível ${item.title}`
                            : `Acertos no último treino do nível ${item.title}`
                        }
                      />
                    </button>
                  );
                })}
              </div>
            </section>
            <div className="q-layout">
              <div className="q-workspace" aria-busy={busy}>
                {tab === "practice" && (
                  <section className="q-card">
                    <div className="q-card-top">
                      <span className={`q-level-pill q-pill-${levelId}`}>
                        Nível {level.title}
                      </span>
                      <span className="q-small">
                        20 questões + prática de escrita
                      </span>
                    </div>
                    {!finished && (
                      <ol className="q-steps" aria-label="Etapas do treino">
                        {["Questões", "Seu texto", "Revisão"].map(
                          (label, index) => {
                            const current =
                              draft.stage === "quiz"
                                ? 0
                                : draft.stage === "write"
                                  ? 1
                                  : 2;
                            return (
                              <li
                                key={label}
                                className={current >= index ? "is-reached" : ""}
                                aria-current={
                                  current === index ? "step" : undefined
                                }
                              >
                                <span>{current > index ? "✓" : index + 1}</span>
                                {label}
                              </li>
                            );
                          },
                        )}
                      </ol>
                    )}
                    {finished ? (
                      <div className="questions-finished">
                        <span className="q-finish-icon" aria-hidden="true">
                          ✓
                        </span>
                        <h2 ref={heading} tabIndex={-1}>
                          Mais um passo na sua escrita.
                        </h2>
                        <p role="status" className="q-muted">
                          Seu treino do nível {level.title.toLowerCase()} foi
                          salvo na sua conta.
                        </p>
                        <div className="q-result">
                          <strong>
                            {finished.correct_count}
                            <small>/{finished.question_count}</small>
                          </strong>
                          <div>
                            <b>{percentage(finished)}% de acertos</b>
                            <span>nas questões desta rodada</span>
                          </div>
                        </div>
                        <Versions
                          original={finished.original_text}
                          revision={finished.revised_text}
                        />
                        <div className="q-actions">
                          <button
                            type="button"
                            className="primary-action"
                            onClick={() => {
                              setTab("progress");
                              setError("");
                            }}
                          >
                            Ver meu progresso
                          </button>
                          <button
                            type="button"
                            className="secondary-action"
                            onClick={() => {
                              setFinished(null);
                              focusHeading();
                            }}
                          >
                            Fazer outro treino
                          </button>
                        </div>
                      </div>
                    ) : (
                      <fieldset
                        className="q-editor-fieldset"
                        disabled={busy || locked}
                      >
                        {draft.stage === "quiz" && (
                          <div
                            className="q-quiz"
                            data-question-id={question.id}
                            data-error-review={retrying ? "true" : "false"}
                          >
                            {retrying && (
                              <div className="q-map-note" role="status">
                                <strong>
                                  Vamos revisar o que ficou para trás.
                                </strong>
                                <p>
                                  Questão {draft.retryPosition + 1} de{" "}
                                  {draft.retryIndices.length} da revisão. Tente
                                  outra vez; seus acertos da primeira rodada
                                  continuam registrados.
                                </p>
                              </div>
                            )}
                            <div className="q-question-meta">
                              <span className="q-skill-tag">
                                {questionSkill.title}
                              </span>
                              <span>
                                Questão{" "}
                                <strong>
                                  {String(draft.questionIndex + 1).padStart(
                                    2,
                                    "0",
                                  )}
                                </strong>{" "}
                                de 20
                              </span>
                            </div>
                            <div className="q-round-progress">
                              <progress
                                value={answered}
                                max={20}
                                aria-label="Questões respondidas nesta rodada"
                              />
                              <span>{answered}/20 respondidas</span>
                            </div>
                            {question.excerpt && (
                              <blockquote className="q-excerpt">
                                <span>LEIA O TRECHO</span>
                                <p>{question.excerpt}</p>
                              </blockquote>
                            )}
                            <h2
                              ref={heading}
                              tabIndex={-1}
                              className="q-question-title"
                            >
                              {question.prompt}
                            </h2>
                            <fieldset
                              disabled={Boolean(feedback)}
                              className="q-answer-fieldset"
                            >
                              <legend>Escolha uma alternativa</legend>
                              <div className="q-options">
                                {draft.optionOrders[draft.questionIndex].map(
                                  (optionIndex, displayIndex) => (
                                    <label
                                      key={optionIndex}
                                      className={`q-option ${activeAnswers[draft.questionIndex] === optionIndex ? "is-selected" : ""} ${feedback?.correctOption === optionIndex ? "is-correct" : ""} ${feedback && !feedback.correct && activeAnswers[draft.questionIndex] === optionIndex ? "is-incorrect" : ""}`}
                                    >
                                      <input
                                        type="radio"
                                        name={question.id}
                                        value={optionIndex}
                                        checked={
                                          activeAnswers[draft.questionIndex] ===
                                          optionIndex
                                        }
                                        onChange={() =>
                                          patch({
                                            [retrying
                                              ? "retryAnswers"
                                              : "answers"]: activeAnswers.map(
                                              (value, index) =>
                                                index === draft.questionIndex
                                                  ? optionIndex
                                                  : value,
                                            ),
                                          })
                                        }
                                      />
                                      <span
                                        className="q-option-letter"
                                        aria-hidden="true"
                                      >
                                        {letters[displayIndex]}
                                      </span>
                                      <span className="q-option-text">
                                        {question.options[optionIndex]}
                                        {feedback?.correctOption ===
                                          optionIndex && (
                                          <span className="q-sr-only">
                                            {" "}
                                            Resposta correta.
                                          </span>
                                        )}
                                      </span>
                                      <span
                                        className="q-option-mark"
                                        aria-hidden="true"
                                      >
                                        {feedback?.correctOption === optionIndex
                                          ? "✓"
                                          : feedback &&
                                              !feedback.correct &&
                                              activeAnswers[
                                                draft.questionIndex
                                              ] === optionIndex
                                            ? "×"
                                            : ""}
                                      </span>
                                    </label>
                                  ),
                                )}
                              </div>
                            </fieldset>
                            {feedback && (
                              <section
                                className={`q-feedback ${feedback.correct ? "is-correct" : ""}`}
                                role="status"
                              >
                                <strong>
                                  {feedback.correct
                                    ? "Boa leitura! Você identificou a ideia."
                                    : "Vamos entender essa escolha."}
                                </strong>
                                <p>{feedback.explanation}</p>
                              </section>
                            )}
                            <div className="q-actions q-quiz-actions">
                              <span className="q-action-hint">
                                {feedback
                                  ? "Entender o porquê faz parte do treino."
                                  : "Leia as três opções antes de escolher."}
                              </span>
                              {!feedback ? (
                                <button
                                  type="button"
                                  className="primary-action"
                                  disabled={
                                    activeAnswers[draft.questionIndex] === null
                                  }
                                  onClick={check}
                                >
                                  {busy ? "Conferindo…" : "Conferir resposta"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="primary-action"
                                  onClick={advance}
                                >
                                  {retrying
                                    ? !feedback.correct
                                      ? "Tentar novamente"
                                      : draft.retryPosition + 1 <
                                          draft.retryIndices.length
                                        ? "Próxima da revisão"
                                        : "Praticar a escrita"
                                    : answered === 20
                                      ? !draft.retryDone && correct < 20
                                        ? "Revisar questões erradas"
                                        : "Praticar a escrita"
                                      : "Próxima questão"}
                                </button>
                              )}
                            </div>
                            <p className="q-muted q-writing-guidance">
                              Depois de praticar algumas questões, tente
                              escrever um novo texto. Use o que aprendeu,
                              compare com a versão anterior e observe como suas
                              ideias e argumentos evoluíram. Ao terminar as 20
                              questões, vamos revisar automaticamente as que
                              você errou.
                            </p>
                          </div>
                        )}
                        {draft.stage === "write" && (
                          <div className="q-writing">
                            <div className="q-section-heading">
                              <div>
                                <span className="q-eyebrow">
                                  DO CONHECIMENTO PARA A PRÁTICA
                                </span>
                                <h2 ref={heading} tabIndex={-1}>
                                  Agora, dê forma à sua ideia.
                                </h2>
                                <p>
                                  Você respondeu às 20 questões. Escolha uma
                                  parte do texto para exercitar.
                                </p>
                              </div>
                            </div>
                            <label
                              className="q-field-label"
                              htmlFor="practice-skill"
                            >
                              O que você quer escrever?
                            </label>
                            <select
                              id="practice-skill"
                              value={draft.skillId}
                              onChange={(event) =>
                                patch({ skillId: event.target.value })
                              }
                            >
                              {catalog.skills.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.title}
                                </option>
                              ))}
                            </select>
                            <label
                              className="q-field-label"
                              htmlFor="practice-theme"
                            >
                              Tema do seu trecho
                            </label>
                            <select
                              id="practice-theme"
                              value={draft.themeId}
                              onChange={(event) =>
                                patch({ themeId: event.target.value })
                              }
                            >
                              {catalog.themes.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.title}
                                </option>
                              ))}
                            </select>
                            <div className="q-writing-prompt">
                              <strong>{theme.title}</strong>
                              <p>{theme.prompt}</p>
                            </div>
                            <p className="q-task">{skill.task}</p>
                            <label
                              className="q-field-label"
                              htmlFor="practice-original"
                            >
                              Sua primeira versão
                            </label>
                            <textarea
                              id="practice-original"
                              value={draft.text}
                              maxLength={4000}
                              rows={8}
                              placeholder="Desenvolva sua ideia com suas próprias palavras…"
                              onChange={(event) =>
                                patch({ text: event.target.value })
                              }
                              aria-describedby="practice-word-count"
                            />
                            <p
                              id="practice-word-count"
                              className="q-word-count"
                            >
                              {wordCount(draft.text)} palavras · mínimo de{" "}
                              {skill.minimumWords} · {draft.text.length}/4.000
                              caracteres
                            </p>
                            <details className="q-hint">
                              <summary>Uma dica para começar</summary>
                              <p>{skill.tip}</p>
                            </details>
                            <div className="q-actions">
                              <button
                                type="button"
                                className="secondary-action"
                                onClick={() => patch({ stage: "quiz" })}
                              >
                                Rever as questões
                              </button>
                              <button
                                type="button"
                                className="primary-action"
                                disabled={
                                  wordCount(draft.text) < skill.minimumWords
                                }
                                onClick={() => {
                                  patch({ stage: "review" });
                                  focusHeading();
                                }}
                              >
                                Revisar meu trecho
                              </button>
                            </div>
                          </div>
                        )}
                        {draft.stage === "review" && (
                          <div className="q-review">
                            <span className="q-eyebrow">
                              OLHE PARA O QUE VOCÊ CONSTRUIU
                            </span>
                            <h2 ref={heading} tabIndex={-1}>
                              Uma nova leitura pode mudar tudo.
                            </h2>
                            <p className="q-muted">
                              Marque o que seu trecho já faz. Deixe desmarcado o
                              que ainda precisa desenvolver.
                            </p>
                            <Versions original={draft.text} />
                            <CheckList
                              items={skill.checks}
                              values={draft.checks}
                              onChange={(checks) => patch({ checks })}
                              label="Na minha primeira versão…"
                            />
                            <details className="q-hint">
                              <summary>
                                Observar um exemplo de construção
                              </summary>
                              <p>{skill.example}</p>
                              <small>
                                O exemplo pode tratar de outro tema. Observe sua
                                estrutura para construir o seu próprio trecho.
                              </small>
                            </details>
                            {!draft.revisionEnabled ? (
                              <button
                                type="button"
                                className="secondary-action"
                                onClick={() =>
                                  patch({
                                    revisionEnabled: true,
                                    revision: draft.revision || draft.text,
                                  })
                                }
                              >
                                Quero reescrever e comparar
                              </button>
                            ) : (
                              <div className="q-rewrite">
                                <label
                                  className="q-field-label"
                                  htmlFor="practice-revision"
                                >
                                  Sua segunda versão
                                </label>
                                <textarea
                                  id="practice-revision"
                                  value={draft.revision}
                                  maxLength={4000}
                                  rows={8}
                                  onChange={(event) =>
                                    patch({ revision: event.target.value })
                                  }
                                  aria-describedby="revision-word-count"
                                />
                                <p
                                  id="revision-word-count"
                                  className="q-word-count"
                                >
                                  {wordCount(draft.revision)} palavras · mínimo
                                  de {skill.minimumWords}
                                </p>
                                <CheckList
                                  items={skill.checks}
                                  values={draft.revisionChecks}
                                  onChange={(revisionChecks) =>
                                    patch({ revisionChecks })
                                  }
                                  label="Depois de reescrever…"
                                />
                                <button
                                  type="button"
                                  className="q-text-button"
                                  onClick={() =>
                                    patch({ revisionEnabled: false })
                                  }
                                >
                                  Guardar apenas a primeira versão
                                </button>
                              </div>
                            )}
                            <div className="q-actions">
                              <button
                                type="button"
                                className="secondary-action"
                                onClick={() => patch({ stage: "write" })}
                              >
                                Voltar à escrita
                              </button>
                              <button
                                type="button"
                                className="primary-action"
                                onClick={save}
                                disabled={
                                  draft.revisionEnabled &&
                                  (wordCount(draft.revision) <
                                    skill.minimumWords ||
                                    draft.revision.trim() === draft.text.trim())
                                }
                              >
                                {busy
                                  ? "Guardando treino…"
                                  : "Concluir e guardar"}
                              </button>
                            </div>
                          </div>
                        )}
                      </fieldset>
                    )}
                  </section>
                )}
                {tab === "progress" && (
                  <section className="q-card q-progress-card">
                    <span className={`q-level-pill q-pill-${levelId}`}>
                      Nível {level.title}
                    </span>
                    <h2>Sua evolução, no mesmo nível.</h2>
                    <p className="q-muted">
                      Compare rodadas de dificuldade equivalente e volte aos
                      trechos que escreveu.
                    </p>
                    {historyError && (
                      <div className="q-message" role="alert">
                        <p>{historyError}</p>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={retryHistory}
                        >
                          Carregar histórico novamente
                        </button>
                      </div>
                    )}
                    {!historyError &&
                      (progress.records.length ? (
                        <>
                          <div className="q-progress-stats">
                            <div>
                              <span>Último resultado</span>
                              <strong>
                                {progress.latest.correct_count}
                                <small>/20</small>
                              </strong>
                            </div>
                            <div>
                              <span>Melhor resultado</span>
                              <strong>
                                {progress.best}
                                <small>%</small>
                              </strong>
                            </div>
                            <div>
                              <span>Rodadas concluídas</span>
                              <strong>{progress.records.length}</strong>
                            </div>
                          </div>
                          <PracticeChart
                            records={progress.records}
                            title={level.title}
                          />
                          <p className="q-comparison">
                            Primeiro treino:{" "}
                            <strong>{progress.first.correct_count}/20</strong>
                            <span>
                              Último treino:{" "}
                              <strong>
                                {progress.latest.correct_count}/20
                              </strong>
                            </span>
                          </p>
                          <div className="q-section-heading">
                            <h3>Seus textos e revisões</h3>
                            <span>
                              {level.title} · {progress.records.length}{" "}
                              {progress.records.length === 1
                                ? "registro"
                                : "registros"}
                            </span>
                          </div>
                          <div className="q-history">
                            {[...progress.records].reverse().map((record) => (
                              <HistoryRecord
                                key={record.id}
                                record={record}
                                catalog={catalog}
                              />
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="q-empty">
                          <span aria-hidden="true">✦</span>
                          <h3>Seu próximo passo vira história.</h3>
                          <p>
                            Conclua um treino do nível{" "}
                            {level.title.toLowerCase()} para acompanhar seus
                            acertos e comparar as versões da sua escrita.
                          </p>
                          <button
                            type="button"
                            className="primary-action"
                            onClick={() => setTab("practice")}
                          >
                            Começar este nível
                          </button>
                        </div>
                      ))}
                    {!historyError && legacyAttempts.length > 0 && (
                      <details className="q-legacy">
                        <summary>
                          Treinos da versão anterior ({legacyAttempts.length})
                        </summary>
                        <p className="q-muted">
                          Esses registros foram preservados e não entram na
                          comparação dos novos níveis.
                        </p>
                        {legacyAttempts.map((record) => (
                          <HistoryRecord
                            key={record.id}
                            record={record}
                            catalog={catalog}
                          />
                        ))}
                      </details>
                    )}
                    {legacyDrafts.length > 0 && (
                      <details className="q-legacy">
                        <summary>
                          Seus trechos em andamento da versão anterior (
                          {legacyDrafts.length})
                        </summary>
                        <p className="q-muted">
                          Você pode selecionar e copiar estes trechos para
                          continuar escrevendo.
                        </p>
                        {legacyDrafts.map((item) => (
                          <div key={item.skillId}>
                            <h3>
                              {catalog.skills.find(
                                (entry) => entry.id === item.skillId,
                              )?.title || "Rascunho"}
                            </h3>
                            <Versions
                              original={item.text}
                              revision={item.revision}
                            />
                          </div>
                        ))}
                      </details>
                    )}
                    <p className="q-footnote">
                      Os acertos medem compreensão das questões. A revisão da
                      escrita é uma autoavaliação e não corresponde a uma nota
                      ENEM.
                    </p>
                  </section>
                )}
              </div>
              <aside className="q-sidebar">
                {tab === "practice" && draft.stage === "quiz" && !finished ? (
                  <section className="q-map-card">
                    <div className="q-map-heading">
                      <div>
                        <span className="q-eyebrow">SEU PERCURSO</span>
                        <h3>Uma questão por vez.</h3>
                      </div>
                      <span className="q-map-count">
                        {answered}
                        <small>/20</small>
                      </span>
                    </div>
                    <div
                      className="q-question-map"
                      aria-label="Navegar pelas 20 questões"
                    >
                      {level.questions.map((item, index) => (
                        <button
                          type="button"
                          key={item.id}
                          data-question-index={index}
                          className={`${draft.feedback[index] ? (draft.feedback[index].correct ? "is-correct" : "is-reviewed") : ""} ${draft.questionIndex === index ? "is-current" : ""}`}
                          aria-current={
                            draft.questionIndex === index ? "step" : undefined
                          }
                          aria-label={`Questão ${index + 1}: ${draft.feedback[index] ? (draft.feedback[index].correct ? "acertou" : "revisada") : "a responder"}`}
                          disabled={busy || retrying}
                          onClick={() => {
                            patch({ questionIndex: index });
                            setError("");
                            focusHeading();
                          }}
                        >
                          {String(index + 1).padStart(2, "0")}
                          <small aria-hidden="true">
                            {draft.feedback[index]
                              ? draft.feedback[index].correct
                                ? "✓"
                                : "·"
                              : ""}
                          </small>
                        </button>
                      ))}
                    </div>
                    <div className="q-map-legend">
                      <span>
                        <i className="q-legend-correct"></i>Acertou
                      </span>
                      <span>
                        <i className="q-legend-reviewed"></i>Revisada
                      </span>
                      <span>
                        <i></i>A responder
                      </span>
                    </div>
                    <div className="q-map-note">
                      <strong>O progresso começa ao entender.</strong>
                      <p>
                        Errou uma questão? Leia o comentário e veja qual ideia
                        precisa de atenção.
                      </p>
                    </div>
                    <div className="q-map-footer">
                      <span>Acertos nesta rodada</span>
                      <strong>
                        {correct}
                        <small>/{answered || 0}</small>
                      </strong>
                    </div>
                  </section>
                ) : (
                  <section className="q-map-card">
                    <span className="q-eyebrow">ONDE CONCENTRAR A PRÁTICA</span>
                    <h3>Seu olhar por habilidade.</h3>
                    {tab === "practice" || progress.latest?.skills_summary ? (
                      <Breakdown
                        summaries={
                          finished?.skills_summary ||
                          (tab === "progress"
                            ? progress.latest?.skills_summary || []
                            : draftBreakdown(level, draft, catalog.skills))
                        }
                        skills={catalog.skills}
                      />
                    ) : (
                      <p className="q-muted">
                        Após concluir uma rodada, os acertos de cada habilidade
                        aparecem aqui.
                      </p>
                    )}
                    <p className="q-footnote">
                      Cada nível inclui introdução, tese, argumentação,
                      repertório, coesão e conclusão.
                    </p>
                  </section>
                )}
                <section className="q-tip-card">
                  <span className="q-tip-icon" aria-hidden="true">
                    ✧
                  </span>
                  <div>
                    <h3>Aprender é construir.</h3>
                    <p>
                      Depois das questões, coloque uma ideia em palavras e
                      compare sua primeira versão com a reescrita.
                    </p>
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </main>
      <footer className="site-footer">
        © 2026 Português+ · Sua prática, seu progresso.
      </footer>
    </PageFrame>
  );
}
