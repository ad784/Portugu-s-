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
        <a className="brand" href="/">
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
          <a href="/">{"Entrar"}</a>
          <a href="/cadastro" className="nav-cta">
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
              "Informe o e-mail da sua conta para receber um link seguro e definir uma nova senha. Se você ainda está conectado, também pode alterá-la pelo perfil."
            }
          </p>
        </section>
        <form
          id="recovery-form"
          className="auth-card"
          aria-labelledby="recovery-title"
        >
          <div className="form-heading">
            <span className="form-icon">{"✉"}</span>
            <div>
              <h2 id="recovery-title">{"Recuperar senha"}</h2>
              <p>{"Recupere o acesso com segurança."}</p>
            </div>
          </div>
          <div id="recovery-request" hidden>
            <label htmlFor="email-recuperacao">{"E-mail"}</label>
            <input
              id="email-recuperacao"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              required
            />
            <button
              id="recovery-button"
              className="primary-action"
              type="submit"
            >
              {"Enviar link de recuperação "}
              <span>{"→"}</span>
            </button>
          </div>
          <div id="recovery-support">
            <p>
              A recuperação automática por e-mail está temporariamente pausada.
              Para solicitar ajuda com seu acesso, entre em contato. Não envie
              sua senha.
            </p>
            <p>
              <a href="mailto:portuguesmais02@gmail.com?subject=Ajuda%20com%20acesso%20ao%20Portugu%C3%AAs%2B">
                Falar com o suporte: portuguesmais02@gmail.com
              </a>
            </p>
            <p>
              <a href="/perfil">
                Já estou conectado e quero alterar minha senha
              </a>
            </p>
          </div>
          <div id="recovery-reset" hidden>
            <label htmlFor="nova-senha">Nova senha</label>
            <input
              id="nova-senha"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled
            />
            <label htmlFor="confirmar-senha">Confirme a nova senha</label>
            <input
              id="confirmar-senha"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled
            />
            <button
              id="reset-password-button"
              className="primary-action"
              type="submit"
            >
              Salvar nova senha
            </button>
          </div>
          <p
            id="recovery-message"
            className="form-message"
            role="status"
            aria-live="polite"
          ></p>
          <p className="form-footer">
            <a href="/">{"Voltar para o login"}</a>
          </p>
        </form>
      </main>{" "}
      <footer className="site-footer">
        {"© 2026 Português+ · Sua prática, seu progresso."}
      </footer>{" "}
    </PageFrame>
  );
}
