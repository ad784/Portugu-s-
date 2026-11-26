import { useState } from "react";
import {
  numberLabel,
  technicalReportText,
} from "../services/technical-writing.mjs";

export default function TechnicalReport({ response, onReview, onRetry, busy }) {
  const [activity, setActivity] = useState(false);
  const { record, salvo, aviso } = response;
  const result = record.result;
  function download() {
    const url = URL.createObjectURL(
      new Blob([technicalReportText(record)], {
        type: "text/plain;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `portugues-mais-${record.mode}-avaliacao.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section
      className="technical-report"
      aria-label="Avaliação da resposta discursiva"
    >
      <div className="technical-report-heading">
        <div>
          <span className="eyebrow">DEVOLUTIVA POR CRITÉRIO</span>
          <h2>Sua avaliação está pronta.</h2>
          <p>
            {record.mode === "enade" ? "ENADE" : "Concurso público"} ·{" "}
            {record.area}
          </p>
        </div>
        <div className="technical-score">
          <span>Nota estimada</span>
          <strong>
            {numberLabel(result.score)}
            <small> / {numberLabel(result.maxScore)}</small>
          </strong>
        </div>
      </div>
      {!salvo && (
        <div className="technical-message" role="status">
          <p>{aviso || "Esta avaliação ainda não foi salva na conta."}</p>
          {onRetry && (
            <button type="button" disabled={busy} onClick={onRetry}>
              {busy ? "Salvando…" : "Tentar salvar novamente"}
            </button>
          )}
        </div>
      )}
      <p className="technical-basis">
        {result.referenceBased
          ? "Comparação com o espelho ou referência que você informou. Esse material não foi autenticado pela plataforma."
          : "Sem espelho fornecido: avaliação de estudo com os critérios selecionados. Confira o conteúdo técnico e as regras da prova nas fontes da sua área."}
      </p>
      <p className="technical-summary">{result.summary}</p>
      <div className="technical-criteria-results">
        {result.criteria.map((criterion) => (
          <article key={criterion.id}>
            <div>
              <h3>{criterion.label}</h3>
              <strong>
                {numberLabel(criterion.points)}
                <small> / {numberLabel(criterion.maxPoints)}</small>
              </strong>
            </div>
            <progress
              value={criterion.percentage}
              max={100}
              aria-label={`Atendimento estimado em ${criterion.label}`}
            />
            <p>{criterion.comment}</p>
            {criterion.evidence && (
              <details>
                <summary>Ver trecho da sua resposta</summary>
                <blockquote>{criterion.evidence}</blockquote>
              </details>
            )}
          </article>
        ))}
      </div>
      <section className="technical-items">
        <h3>O que o enunciado pediu</h3>
        {result.items.map((item, index) => (
          <details key={index}>
            <summary>
              <span className={`technical-status status-${item.status}`}>
                {
                  {
                    atendido: "Atendido",
                    parcial: "Parcial",
                    ausente: "A desenvolver",
                  }[item.status]
                }
              </span>
              <span>{item.item}</span>
            </summary>
            <p>{item.comment}</p>
            {item.evidence && <blockquote>{item.evidence}</blockquote>}
          </details>
        ))}
      </section>
      <div className="technical-feedback-grid">
        <section>
          <h3>Pontos fortes</h3>
          <ul>
            {result.strengths.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Próximos passos</h3>
          <ul>
            {result.improvements.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
      <section className="technical-revision-task">
        <span className="eyebrow">COLOQUE A DEVOLUTIVA EM PRÁTICA</span>
        <h3>Uma revisão, uma nova tentativa.</h3>
        <p>{result.revision}</p>
        <label>
          <input
            type="checkbox"
            checked={activity}
            onChange={(event) => setActivity(event.target.checked)}
          />{" "}
          Já identifiquei o que quero mudar na minha resposta.
        </label>
        {onReview && (
          <button type="button" className="primary-action" onClick={onReview}>
            Revisar minha resposta
          </button>
        )}
      </section>
      {result.technicalAlerts.length > 0 && (
        <details className="technical-reference-alert">
          <summary>Conteúdos e referências a conferir</summary>
          <ul>
            {result.technicalAlerts.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </details>
      )}
      <details className="technical-original">
        <summary>Rever enunciado, critérios e resposta enviada</summary>
        <h3>Enunciado</h3>
        <p>{record.payload.prompt}</p>
        {record.payload.reference && (
          <>
            <h3>Referência informada</h3>
            <p>{record.payload.reference}</p>
          </>
        )}
        <h3>Sua resposta</h3>
        <p>{record.payload.answer}</p>
      </details>
      <div className="technical-result-actions">
        <button type="button" className="secondary-action" onClick={download}>
          Baixar avaliação
        </button>
        <a href="/historico-tecnico" className="secondary-action">
          Histórico técnico
        </a>
        <a href="/discursivas" className="primary-action">
          Nova resposta
        </a>
      </div>
      <p className="technical-footnote">
        Estimativa pedagógica gerada por IA. Não substitui o espelho, os
        critérios do edital, a correção da banca ou a orientação de um
        professor.
      </p>
    </section>
  );
}
