import PageFrame from "../PageFrame.jsx";

export default function SignupPage() {
  return (
    <PageFrame
      name="cadastro"
      title="Criar conta | Português+"
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
          <a href="/index.html">{"Entrar"}</a>{" "}
          <a href="#cadastro" className="nav-cta">
            {"Criar conta"}
          </a>{" "}
        </nav>{" "}
      </header>{" "}
      <main className="auth-main">
        {" "}
        <section className="auth-intro">
          {" "}
          <span className="eyebrow">{"COMECE HOJE"}</span>{" "}
          <h1>
            {"Sua próxima"}
            <br />
            <strong>{"boa redação"}</strong>
            {" começa aqui."}
          </h1>{" "}
          <p>
            {
              "Crie sua conta gratuitamente e conte com uma ferramenta feita para apoiar sua evolução na escrita."
            }
          </p>{" "}
          <div className="feature-list">
            {" "}
            <div>
              <span>{"✓"}</span>
              {" Ambiente simples e focado"}
            </div>{" "}
            <div>
              <span>{"✓"}</span>
              {" Correções detalhadas"}
            </div>{" "}
            <div>
              <span>{"✓"}</span>
              {" Prática no seu ritmo"}
            </div>{" "}
          </div>{" "}
        </section>{" "}
        <section
          className="auth-card"
          id="cadastro"
          aria-labelledby="cadastro-title"
        >
          {" "}
          <div className="form-heading">
            {" "}
            <span className="form-icon">{"✨"}</span>{" "}
            <div>
              {" "}
              <h2 id="cadastro-title">{"Crie sua conta"}</h2>{" "}
              <p>{"É rápido, gratuito e leva poucos segundos."}</p>{" "}
            </div>{" "}
          </div>{" "}
          <label htmlFor="nome">{"Nome"}</label>{" "}
          <input
            type="text"
            id="nome"
            placeholder="Como podemos te chamar?"
            autoComplete="name"
          />{" "}
          <label htmlFor="email">{"E-mail"}</label>{" "}
          <input
            type="email"
            id="email"
            placeholder="voce@email.com"
            autoComplete="email"
          />{" "}
          <label htmlFor="senha">{"Senha"}</label>{" "}
          <input
            type="password"
            id="senha"
            placeholder="Crie uma senha segura"
            autoComplete="new-password"
          />{" "}
          <label className="consent-field">
            <input type="checkbox" id="consentimento" />
            <span>
              {
                "Concordo com o uso das redações e fotos para gerar a correção por IA."
              }
            </span>
          </label>{" "}
          <p
            id="signup-message"
            className="form-message"
            role="status"
            aria-live="polite"
          ></p>{" "}
          <button id="signup-button" className="primary-action" type="button">
            {"Criar minha conta "}
            <span>{"→"}</span>
          </button>{" "}
          <p className="form-footer">
            {"Ao criar a conta, você confirma a leitura da "}
            <a href="/privacidade.html">{"política de privacidade"}</a>
            {"."}
            <br />
            {"Já possui uma conta? "}
            <a href="/index.html">{"Fazer login"}</a>
          </p>{" "}
        </section>{" "}
      </main>{" "}
      <footer className="site-footer">
        {"© 2026 Português+ · Sua prática, seu progresso."}
      </footer>{" "}
    </PageFrame>
  );
}
