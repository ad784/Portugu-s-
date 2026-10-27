import PageFrame from "../PageFrame.jsx";

export default function RecoveryPage() {
  return (
    <PageFrame
      name="recuperar"
      title="Recuperar senha | Português+"
      lang="pt-BR"
      bodyClass="auth-page"
    >
      <header className="site-header">
        <a className="brand" href="/index.html">
          <img
            className="brand-icon"
            src="/assets/logo-portugues-mais.png"
            alt="Logo Português+"
          />
          <span>
            {"Português"}
            <span>{"+"}</span>
          </span>
        </a>
        <nav className="site-nav">
          <a href="/index.html">{"Entrar"}</a>
          <a href="/cadastro.html" className="nav-cta">
            {"Criar conta"}
          </a>
        </nav>
      </header>{" "}
      <main className="auth-main">
        <section className="auth-intro">
          <span className="eyebrow">{"RECUPERAÇÃO DE ACESSO"}</span>
          <h1>
            {"Vamos recuperar"}
            <br />
            <strong>{"sua senha."}</strong>
          </h1>
          <p>
            {
              "Informe o e-mail cadastrado. Você receberá um link seguro para criar uma nova senha."
            }
          </p>
        </section>
        <section className="auth-card" aria-labelledby="recovery-title">
          <div className="form-heading">
            <span className="form-icon">{"✉"}</span>
            <div>
              <h2 id="recovery-title">{"Recuperar senha"}</h2>
              <p>{"O link será enviado ao seu e-mail."}</p>
            </div>
          </div>
          <label htmlFor="email-recuperacao">{"E-mail"}</label>
          <input
            id="email-recuperacao"
            type="email"
            autoComplete="email"
            placeholder="voce@email.com"
          />
          <p id="recovery-message" className="form-message" role="status"></p>
          <button id="recovery-button" className="primary-action" type="button">
            {"Enviar link de recuperação "}
            <span>{"→"}</span>
          </button>
          <p className="form-footer">
            <a href="/index.html">{"Voltar para o login"}</a>
          </p>
        </section>
      </main>{" "}
      <footer className="site-footer">
        {"© 2026 Português+ · Sua prática, seu progresso."}
      </footer>{" "}
    </PageFrame>
  );
}
