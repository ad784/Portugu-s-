import PageFrame from "../PageFrame.jsx";

export default function ProgressPage() {
  return (
    <PageFrame
      name="evolucao"
      title="Minha evolução | Português+"
      lang="pt-BR"
      bodyClass="history-page"
    >
      {" "}
      <header className="site-header">
        {" "}
        <a
          className="brand"
          href="/nova.html"
          aria-label="Página inicial do Português+"
        >
          <img
            className="brand-icon"
            src="/assets/logo-portugues-mais.png"
            alt=""
          />
          <span>
            {"Português"}
            <span>{"+"}</span>
          </span>
        </a>{" "}
        <nav className="site-nav" aria-label="Navegação principal">
          {" "}
          <a href="/nova.html">{"Nova redação"}</a>
          <a href="/historico.html">{"Minhas redações"}</a>
          <a href="/perfil.html">{"Meu perfil"}</a>
          <a href="/index.html" className="nav-cta">
            {"Sair"}
          </a>{" "}
        </nav>{" "}
      </header>{" "}
      <main className="progress-main">
        {" "}
        <section className="history-heading">
          <span className="eyebrow">{"SEU CAMINHO NA REDAÇÃO"}</span>
          <h1>{"Minha evolução"}</h1>
          <p>
            {
              "Acompanhe suas notas desde a primeira redação salva e veja quais competências estão avançando."
            }
          </p>
        </section>{" "}
        <section
          id="progress-summary"
          className="history-summary"
          aria-label="Resumo da evolução"
          aria-live="polite"
        ></section>{" "}
        <section className="progress-card" aria-labelledby="score-chart-title">
          {" "}
          <div className="progress-card-heading">
            <div>
              <h2 id="score-chart-title">{"Nota por redação"}</h2>
              <p>
                {
                  "Cada ponto representa uma redação corrigida, da mais antiga à mais recente."
                }
              </p>
            </div>
            <span className="chart-legend">
              <i></i>
              {" Nota ENEM"}
            </span>
          </div>{" "}
          <div id="score-chart" className="chart-wrap" aria-live="polite"></div>{" "}
          <p
            id="score-chart-description"
            className="chart-description"
          ></p>{" "}
        </section>{" "}
        <section className="progress-card" aria-labelledby="competency-title">
          {" "}
          <div className="progress-card-heading">
            <div>
              <h2 id="competency-title">{"Evolução por competência"}</h2>
              <p>
                {"Médias por competência nas primeiras e nas últimas redações."}
              </p>
            </div>
          </div>{" "}
          <div id="competency-progress" className="competency-progress"></div>{" "}
          <p className="chart-note">
            {
              "As competências aparecem quando a correção salva notas individuais no relatório."
            }
          </p>{" "}
        </section>{" "}
        <section className="progress-actions">
          <a className="secondary-action" href="/historico.html">
            {"Ver todas as redações"}
          </a>
          <a className="primary-action" href="/nova.html">
            {"Escrever nova redação "}
            <span aria-hidden="true">{"→"}</span>
          </a>
        </section>{" "}
      </main>{" "}
      <footer className="site-footer">
        {"© 2026 Português+ · Sua prática, seu progresso."}
      </footer>{" "}
    </PageFrame>
  );
}
