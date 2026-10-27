import PageFrame from "../PageFrame.jsx";

export default function HistoryPage() {
  return (
    <PageFrame
      name="historico"
      title="Minhas redações | Português+"
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
            alt="Logo Português+"
          />
          <span>
            {"Português"}
            <span>{"+"}</span>
          </span>
        </a>{" "}
        <nav className="site-nav" aria-label="Navegação principal">
          <a href="/nova.html">{"Nova redação"}</a>
          <a href="/evolucao.html" aria-current="page">
            {"Minha evolução"}
          </a>
          <a href="/perfil.html">{"Meu perfil"}</a>
          <a href="/exemplos.html">{"Exemplos"}</a>
          <a href="/index.html" className="nav-cta">
            {"Sair"}
          </a>
        </nav>{" "}
      </header>{" "}
      <main className="history-main">
        {" "}
        <section className="history-heading">
          <span className="eyebrow">{"ACOMPANHE SUA EVOLUÇÃO"}</span>
          <h1>{"Minhas redações"}</h1>
          <p>
            {
              "Veja suas correções anteriores e acompanhe suas notas ao longo do tempo."
            }
          </p>
        </section>{" "}
        <p className="history-progress-link">
          <a href="/evolucao.html">
            {"Ver gráfico da minha evolução "}
            <span aria-hidden="true">{"→"}</span>
          </a>
        </p>{" "}
        <section
          id="history-summary"
          className="history-summary"
          aria-live="polite"
        ></section>{" "}
        <section id="history-list" className="history-list" aria-live="polite">
          <p className="history-loading">{"Carregando seu histórico..."}</p>
        </section>{" "}
      </main>{" "}
      <footer className="site-footer">
        {"© 2026 Português+ · Sua prática, seu progresso."}
      </footer>{" "}
    </PageFrame>
  );
}
