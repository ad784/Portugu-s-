import PageFrame from "../PageFrame.jsx";

export default function VerifyEmailPage() {
  return (
    <PageFrame name="confirmar-email" title="Confirmar e-mail | Português+" bodyClass="verification-page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Página inicial do Português+">
          <img className="brand-icon" src="/assets/logo-portugues-mais.png" alt="" />
          <span>Português<span>+</span></span>
        </a>
        <a href="/">Voltar para entrar</a>
      </header>
      <main className="verification-main">
        <div className="verification-progress" aria-label="Etapa 2 de 2">
          <span>✓ Cadastro</span><span aria-hidden="true">—</span><strong>2. Confirmar e-mail</strong>
        </div>
        <form id="verification-form" className="auth-card verification-card" aria-labelledby="verification-title">
          <div className="verification-icon" aria-hidden="true">✉</div>
          <span className="eyebrow">FALTA SÓ UM PASSO</span>
          <h1 id="verification-title">Confirme seu e-mail</h1>
          <p className="verification-intro">Abra seu e-mail e digite o código de confirmação para começar.</p>
          <label htmlFor="verification-email">E-mail do cadastro</label>
          <input id="verification-email" type="email" autoComplete="email" required placeholder="voce@email.com" />
          <label htmlFor="verification-code">Código de confirmação</label>
          <input id="verification-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" minLength={6} maxLength={10} required placeholder="Digite seu código" aria-describedby="verification-help" />
          <p id="verification-help" className="verification-help">Use o código do e-mail mais recente. Confira também a pasta de spam.</p>
          <p id="verification-message" className="form-message" role="status" aria-live="polite"></p>
          <button id="verification-button" className="primary-action" type="submit">Confirmar e continuar <span aria-hidden="true">→</span></button>
          <div className="verification-resend-row"><span>Não recebeu?</span><button id="verification-resend" type="button">Reenviar código</button></div>
          <p className="form-footer"><a href="/cadastro">Corrigir os dados do cadastro</a></p>
        </form>
        <p className="verification-footer">Seu próximo passo na escrita começa aqui.</p>
      </main>
      <footer className="site-footer">© 2026 Português+ · Sua prática, seu progresso.</footer>
    </PageFrame>
  );
}
