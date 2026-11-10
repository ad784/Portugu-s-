import PageFrame from "../PageFrame.jsx";
import legal from "../../../../shared/legal.json";

export default function ContactPage() {
  return (
    <PageFrame name="contato" title="Contato | Português+" bodyClass="contact-page">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Página inicial do Português+">
          <img className="brand-icon" src="/assets/logo-portugues-mais.png" alt="Logo Português+" />
          <span>Português<span>+</span></span>
        </a>
        <nav className="site-nav" aria-label="Navegação principal">
          <a href="/">Início</a>
          <a href="/exemplos">Exemplos</a>
          <a href="/contato" aria-current="page">Contato</a>
        </nav>
      </header>
      <main className="contact-main">
        <span className="eyebrow">FALE COM A GENTE</span>
        <h1>Como podemos ajudar?</h1>
        <p className="contact-intro">Tem alguma dúvida, sugestão ou dificuldade ao usar o Português+? Entre em contato pelo WhatsApp.</p>
        <section className="contact-card" aria-labelledby="contact-whatsapp-title">
          <div className="contact-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
              <path d="M8.5 7.5c.5 4 2 5.5 6 6l1-1.5 2 1-.5 2c-5 1-9-3-8-8l2-.5 1 2-1.5 1" />
            </svg>
          </div>
          <h2 id="contact-whatsapp-title">Atendimento pelo WhatsApp</h2>
          <p>Converse diretamente com a equipe do Português+.</p>
          <p className="contact-number">+55 (51) 99741-0999</p>
          <a className="primary-action contact-whatsapp-action" href="https://wa.me/5551997410999" target="_blank" rel="noopener noreferrer">
            Conversar no WhatsApp <span aria-hidden="true">↗</span>
          </a>
          <p className="contact-email">Prefere e-mail? <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a></p>
        </section>
      </main>
      <footer className="site-footer">© 2026 Português+ · Sua prática, seu progresso.</footer>
    </PageFrame>
  );
}
