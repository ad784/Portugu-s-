import PageFrame from "../PageFrame.jsx";

export default function HomePage() {
  return (
    <PageFrame
      name="index"
      title="Entrar | Português+"
      lang="pt-br"
      bodyClass="auth-page"
    >
      {" "}
      <header className="site-header">
        {" "}
        <a
          className="brand"
          href="/index.html"
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
          <a href="/exemplos.html">{"Exemplos"}</a>{" "}
          <a href="#como-funciona">{"Como funciona"}</a>{" "}
          <a href="/cadastro.html" className="nav-cta">
            {"Criar conta"}
          </a>{" "}
        </nav>{" "}
      </header>{" "}
      <main className="auth-main">
        {" "}
        <section className="auth-intro">
          {" "}
          <span className="eyebrow">{"ESTUDE COM PROPÓSITO"}</span>{" "}
          <h1>
            {"Escreva melhor."}
            <br />
            <strong>{"Alcance mais."}</strong>
          </h1>{" "}
          <p>
            {
              "Tenha correções claras, sugestões práticas e acompanhe a evolução das suas redações em um só lugar."
            }
          </p>{" "}
          <div className="feature-list">
            {" "}
            <div>
              <span>{"✓"}</span>
              {" Correção no modelo ENEM"}
            </div>{" "}
            <div>
              <span>{"✓"}</span>
              {" Feedback para melhorar"}
            </div>{" "}
            <div>
              <span>{"✓"}</span>
              {" Envie texto ou foto"}
            </div>{" "}
          </div>{" "}
        </section>{" "}
        <section className="auth-card" aria-labelledby="login-title">
          {" "}
          <div className="form-heading">
            {" "}
            <span className="form-icon">{"👋"}</span>{" "}
            <div>
              {" "}
              <h2 id="login-title">{"Que bom te ver!"}</h2>{" "}
              <p>{"Entre para continuar seus estudos."}</p>{" "}
            </div>{" "}
          </div>{" "}
          <label htmlFor="email">{"E-mail"}</label>{" "}
          <input
            id="email"
            type="email"
            placeholder="voce@email.com"
            autoComplete="email"
          />{" "}
          <label htmlFor="senha">{"Senha"}</label>{" "}
          <input
            id="senha"
            type="password"
            placeholder="Digite sua senha"
            autoComplete="current-password"
          />{" "}
          <p id="login-message" className="form-message" role="status"></p>{" "}
          <button id="login-button" className="primary-action" type="button">
            {"Entrar na plataforma "}
            <span>{"→"}</span>
          </button>{" "}
          <p className="form-footer">
            <a href="/recuperar.html">{"Esqueci minha senha"}</a>
            <br />
            {"Ainda não possui conta? "}
            <a href="/cadastro.html">{"Criar minha conta"}</a>
          </p>{" "}
        </section>{" "}
      </main>{" "}
      <section
        className="how-it-works"
        id="como-funciona"
        aria-labelledby="how-title"
      >
        {" "}
        <div className="how-heading">
          {" "}
          <span className="eyebrow">{"SIMPLES PARA COMEÇAR"}</span>{" "}
          <h2 id="how-title">{"Como funciona na prática"}</h2>{" "}
          <p>
            {
              "Use o Português+ como um ciclo curto de escrita, correção e evolução."
            }
          </p>{" "}
        </div>{" "}
        <div className="how-steps">
          {" "}
          <article className="how-step">
            <span>{"01"}</span>
            <div>
              <h3>{"Escreva ou envie uma foto"}</h3>
              <p>
                {
                  "Produza sua redação no editor ou fotografe uma versão já escrita."
                }
              </p>
            </div>
          </article>{" "}
          <article className="how-step">
            <span>{"02"}</span>
            <div>
              <h3>{"Receba a análise ENEM"}</h3>
              <p>{"Veja a nota e os comentários das cinco competências."}</p>
            </div>
          </article>{" "}
          <article className="how-step">
            <span>{"03"}</span>
            <div>
              <h3>{"Reescreva com intenção"}</h3>
              <p>
                {
                  "Transforme as sugestões em ajustes para a sua próxima versão."
                }
              </p>
            </div>
          </article>{" "}
        </div>{" "}
      </section>{" "}
      <footer className="site-footer">
        {"© 2026 Português+ · "}
        <a href="/privacidade.html">{"Privacidade"}</a>
        {" · Sua prática, seu progresso."}
      </footer>{" "}
    </PageFrame>
  );
}
