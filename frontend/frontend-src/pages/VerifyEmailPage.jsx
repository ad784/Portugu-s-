import PageFrame from "../components/layout/PageFrame.jsx";

export default function VerifyEmailPage() {
  return (
    <PageFrame
      name="confirmar-email"
      title="Confirmar e-mail | Português+"
      bodyClass="verification-page"
    >
      <header className="site-header">
        <a className="brand" href="/" aria-label="Página inicial do Português+">
          <img
            className="brand-icon"
            src="/images/logo-portugues-mais.png"
            alt=""
          />
          <span>
            Português<span>+</span>
          </span>
        </a>
        <a className="verification-back" href="/cadastro">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m12 5-7 7 7 7M5 12h14" />
          </svg>
          <span>Voltar ao cadastro</span>
        </a>
      </header>
      <main className="verification-main">
        <div className="verification-progress" aria-label="Etapa 2 de 2">
          <span>✓ Cadastro</span>
          <span aria-hidden="true">—</span>
          <strong>2. Confirmar e-mail</strong>
        </div>
        <section
          className="auth-card verification-card"
          aria-labelledby="verification-title"
        >
          <div className="verification-icon" aria-hidden="true">
            ✉
          </div>
          <span className="eyebrow">FALTA SÓ UM PASSO</span>
          <h1 id="verification-title">Verifique seu e-mail</h1>
          <p className="verification-intro">
            Clique no link que enviamos para o seu e-mail para confirmar sua
            conta e entrar na nossa plataforma. Você será levado direto à página
            de escrever sua redação.
          </p>
          <p className="verification-help">
            Não encontrou o e-mail? Confira também a pasta de spam ou lixo
            eletrônico.
          </p>
          <p className="form-footer">
            <a href="/cadastro">Corrigir os dados do cadastro</a>
          </p>
        </section>
        <p className="verification-footer">
          Seu próximo passo na escrita começa aqui.
        </p>
      </main>
      <footer className="site-footer">
        © 2026 Português+ · Sua prática, seu progresso.
      </footer>
    </PageFrame>
  );
}
