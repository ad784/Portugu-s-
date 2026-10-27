import PageFrame from "../PageFrame.jsx";

export default function ProfilePage() {
  return (
    <PageFrame
      name="perfil"
      title="Meu perfil | Português+"
      lang="pt-BR"
      bodyClass="profile-page"
    >
      <header className="site-header">
        <a className="brand" href="/nova.html">
          <img
            className="brand-icon"
            src="/assets/logo-portugues-mais.png"
            alt=""
          />
          <span>
            {"Português"}
            <span>{"+"}</span>
          </span>
        </a>
        <nav className="site-nav" aria-label="Navegação principal">
          <a href="/nova.html">{"Nova redação"}</a>
          <a href="/historico.html">{"Minhas redações"}</a>
          <a href="/evolucao.html">{"Minha evolução"}</a>
          <a href="/index.html" className="nav-cta">
            {"Sair"}
          </a>
        </nav>
      </header>{" "}
      <main className="profile-main">
        <section className="profile-card">
          <span className="eyebrow">{"CONTA DO ESTUDANTE"}</span>
          <h1>{"Meu perfil"}</h1>
          <p>{"Atualize como deseja ser identificado na plataforma."}</p>
          <label htmlFor="perfil-nome">{"Nome"}</label>
          <input id="perfil-nome" maxLength="120" autoComplete="name" />
          <label htmlFor="perfil-email">{"E-mail"}</label>
          <input id="perfil-email" disabled />
          <p id="profile-message" className="form-message" role="status"></p>
          <button id="profile-save" className="primary-action" type="button">
            {"Salvar alterações "}
            <span>{"→"}</span>
          </button>
          <section
            className="profile-password"
            aria-labelledby="password-heading"
          >
            <div className="profile-password-heading">
              <h2 id="password-heading">{"Alterar senha"}</h2>
              <p>
                {
                  "Crie uma nova senha para sua conta. Use pelo menos 8 caracteres."
                }
              </p>
            </div>
            <label htmlFor="perfil-senha">{"Nova senha"}</label>
            <input
              id="perfil-senha"
              type="password"
              minLength="8"
              autoComplete="new-password"
              placeholder="Digite a nova senha"
            />
            <label htmlFor="perfil-senha-confirmacao">
              {"Confirmar nova senha"}
            </label>
            <input
              id="perfil-senha-confirmacao"
              type="password"
              minLength="8"
              autoComplete="new-password"
              placeholder="Digite a nova senha novamente"
            />
            <p id="password-message" className="form-message" role="status"></p>
            <button id="password-save" className="primary-action" type="button">
              {"Atualizar senha "}
              <span>{"→"}</span>
            </button>
          </section>
        </section>
      </main>{" "}
      <footer className="site-footer">
        {"© 2026 Português+ · Sua prática, seu progresso."}
      </footer>{" "}
    </PageFrame>
  );
}
