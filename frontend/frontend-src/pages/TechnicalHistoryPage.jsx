import { useEffect, useState } from "react";
import PageFrame from "../components/layout/PageFrame.jsx";
import useTechnicalSession from "../hooks/useTechnicalSession.js";
import {
  technicalRequest,
  numberLabel,
  dateLabel,
  readTechnicalStorage,
  TECHNICAL_PENDING,
} from "../services/technical-writing.mjs";
import "../assets/styles/technical-writing.css";
export default function TechnicalHistoryPage() {
  return (
    <PageFrame
      name="historico-tecnico"
      title="Histórico técnico | Português+"
      bodyClass="technical-page"
    >
      <History />
    </PageFrame>
  );
}
function History() {
  const session = useTechnicalSession();
  const [mode, setMode] = useState(""),
    [page, setPage] = useState(0),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [pending, setPending] = useState([]),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!session.ready || session.locked) return;
    let active = true;
    setData(null);
    setError("");
    setPending(readTechnicalStorage(TECHNICAL_PENDING, []));
    technicalRequest(`/historico?page=${page}&mode=${mode}`, session.owner)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [session.ready, session.owner, session.locked, page, mode, retry]);
  return (
    <main className="technical-main">
      <header className="technical-heading">
        <div>
          <span className="eyebrow">SEU PERCURSO</span>
          <h1>Histórico técnico</h1>
          <p>
            Reabra suas respostas de ENADE e concursos e continue a revisão.
          </p>
        </div>
        <a href="/discursivas" className="primary-action">
          Nova resposta
        </a>
      </header>
      {(error || session.error || session.locked) && (
        <div role="alert" className="technical-message">
          {session.locked
            ? "Atualize a página para confirmar sua conta."
            : error || session.error}
          <button onClick={() => setRetry((value) => value + 1)}>
            Tentar novamente
          </button>
        </div>
      )}
      {pending.length > 0 && (
        <section className="technical-message">
          <h2>Avaliações aguardando salvamento</h2>
          {pending.map(({ record }) => (
            <p key={record.evaluation_hash}>
              <a href={`/discursivas?pendente=${record.evaluation_hash}`}>
                {record.area} · abrir e tentar salvar
              </a>
            </p>
          ))}
        </section>
      )}
      <label className="technical-filter">
        Modalidade
        <select
          value={mode}
          onChange={(e) => {
            setMode(e.target.value);
            setPage(0);
          }}
        >
          <option value="">Todas</option>
          <option value="concurso">Concursos públicos</option>
          <option value="enade">ENADE</option>
        </select>
      </label>
      {!data && !error && <p role="status">Carregando avaliações…</p>}
      {data && (
        <>
          <p>
            {data.records.length
              ? `Página ${page + 1} · ${data.records.length} avaliações`
              : "Nenhuma avaliação nesta seleção. Comece pela sua primeira resposta."}
          </p>
          <div className="technical-history-list">
            {data.records.map((record) => (
              <article key={record.id}>
                <div>
                  <span className="eyebrow">
                    {record.mode === "enade" ? "ENADE" : "CONCURSO PÚBLICO"}
                  </span>
                  <h2>{record.area}</h2>
                  <p>
                    {dateLabel(record.created_at)} ·{" "}
                    {record.task_type === "redacao"
                      ? "Redação"
                      : "Questão discursiva"}
                  </p>
                </div>
                <strong>
                  {numberLabel(record.score)} / {numberLabel(record.max_score)}
                </strong>
                <a
                  className="secondary-action"
                  href={`/discursivas?avaliacao=${record.id}`}
                >
                  Ver avaliação
                </a>
                <a href={`/discursivas?avaliacao=${record.id}&revisar=1`}>
                  Revisar resposta
                </a>
              </article>
            ))}
          </div>
          <nav
            className="technical-pagination"
            aria-label="Páginas do histórico"
          >
            <button
              disabled={page === 0}
              onClick={() => setPage((value) => value - 1)}
            >
              Anterior
            </button>
            <button
              disabled={!data.hasMore}
              onClick={() => setPage((value) => value + 1)}
            >
              Próxima
            </button>
          </nav>
        </>
      )}
    </main>
  );
}
