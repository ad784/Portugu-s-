import PageFrame from "../PageFrame.jsx";

export default function ResultPage() {
  return (
    <PageFrame
      name="resultado"
      title="Resultado da redação | Português+"
      lang="pt-br"
      bodyClass="result-page"
    >
      {" "}
      <header className="site-header">
        {" "}
        <a
          className="brand"
          href="/nova.html"
          aria-label="Página inicial do Português+"
        >
          {" "}
          <img
            className="brand-icon"
            src="/assets/logo-portugues-mais.png"
            alt="Logo Português+"
          />{" "}
          <span>
            {"Português"}
            <span>{"+"}</span>
          </span>{" "}
        </a>{" "}
        <nav className="site-nav" aria-label="Navegação principal">
          {" "}
          <a href="/nova.html">{"Nova redação"}</a>{" "}
          <a href="/historico.html">{"Minhas redações"}</a>{" "}
          <a href="/index.html" className="nav-cta">
            {"Sair"}
          </a>{" "}
        </nav>{" "}
      </header>{" "}
      <main className="result-main">
        {" "}
        <div className="result-title">
          {" "}
          <span className="eyebrow">{"CORREÇÃO CONCLUÍDA"}</span>{" "}
          <h1>{"Seu resultado chegou!"}</h1>{" "}
          <p>
            {
              "Veja sua nota e use os comentários para deixar a próxima redação ainda melhor."
            }
          </p>{" "}
          <p className="ai-notice">
            {
              "Estimativa pedagógica baseada na matriz ENEM; não substitui a correção oficial."
            }
          </p>{" "}
          <p
            id="resultado-aviso"
            className="ai-notice"
            role="status"
            hidden
          ></p>{" "}
        </div>{" "}
        <section className="score-card" aria-labelledby="score-heading">
          {" "}
          <div className="score-icon">{"🏆"}</div>{" "}
          <div>
            {" "}
            <p id="score-heading">{"Sua nota"}</p>{" "}
            <div className="nota" id="nota">
              {"---"}
            </div>{" "}
            <span className="score-scale">{"de 1000 pontos"}</span>{" "}
          </div>{" "}
          <div className="score-message">
            {"Continue praticando."}
            <br />
            <strong>{"Cada texto conta."}</strong>
          </div>{" "}
        </section>{" "}
        <section
          id="competency-breakdown"
          className="competency-breakdown"
          aria-labelledby="competency-breakdown-title"
          hidden
        >
          {" "}
          <div className="report-heading">
            <div>
              <h2 id="competency-breakdown-title">
                {"Sua nota em cada competência"}
              </h2>
              <p>
                {
                  "Veja os pontos fortes e o que pode desenvolver em cada parte da matriz ENEM."
                }
              </p>
            </div>
          </div>{" "}
          <div id="competency-cards" className="competency-cards"></div>{" "}
        </section>{" "}
        <section className="report-card" aria-labelledby="report-heading">
          {" "}
          <div className="report-heading">
            {" "}
            <div>
              {" "}
              <h2 id="report-heading">{"Análise da sua redação"}</h2>{" "}
              <p>
                {
                  "Leia a devolutiva completa e use as sugestões para revisar sua próxima versão."
                }
              </p>{" "}
            </div>{" "}
            <span>{"✦ Feedback personalizado"}</span>{" "}
          </div>{" "}
          <pre id="resultado"></pre>{" "}
        </section>{" "}
        <div className="result-actions">
          {" "}
          <button id="write-new-essay" className="primary-action" type="button">
            {"Escrever nova redação "}
            <span>{"→"}</span>
          </button>{" "}
        </div>{" "}
      </main>{" "}
      <footer className="site-footer">
        {"© 2026 Português+ · Sua prática, seu progresso."}
      </footer>{" "}
    </PageFrame>
  );
}
