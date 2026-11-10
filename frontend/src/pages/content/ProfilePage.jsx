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
        <a className="brand" href="/nova">
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
          <a href="/nova">{"Nova redação"}</a>
          <a href="/historico">{"Minhas redações"}</a>
          <a href="/evolucao">{"Minha evolução"}</a>
          <a href="/" data-action="signout" className="nav-cta">
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
          <section
            className="profile-password"
            aria-labelledby="privacy-heading"
          >
            <h2 id="privacy-heading">Privacidade e meus dados</h2>
            <p id="consent-summary" role="status">
              Consultando autorização de IA...
            </p>
            <p>
              <a href="/termos">Termos de uso</a> ·{" "}
              <a href="/privacidade">Política de privacidade</a>
            </p>
            <p id="consent-review" hidden>
              <a href="/aceite">Confirmar meu aceite e autorizar correções</a>
            </p>
            <button id="export-data" className="primary-action" type="button">
              Baixar meus dados
            </button>
            <p>
              O arquivo JSON inclui seu perfil, redações, registros de
              autorização e rascunhos disponíveis neste dispositivo. Para obter
              cópias das fotos já enviadas, utilize o contato abaixo.
            </p>
            <p>
              Ao revogar a autorização, novas correções ficam bloqueadas. Seu
              histórico e seu perfil continuam acessíveis.
            </p>
            <button
              id="revoke-consent"
              className="secondary-action"
              type="button"
            >
              Revogar autorização de IA
            </button>
            <p>
              Para solicitar exclusão da conta, correção de dados ou esclarecer
              dúvidas,{" "}
              <a href="mailto:portuguesmais02@gmail.com?subject=Solicita%C3%A7%C3%A3o%20sobre%20meus%20dados">
                escreva para portuguesmais02@gmail.com
              </a>{" "}
              usando o e-mail da sua conta. Não envie sua senha.
            </p>
            <p>
              <a
                className="secondary-action"
                href="mailto:portuguesmais02@gmail.com?subject=Solicita%C3%A7%C3%A3o%20de%20exclus%C3%A3o%20da%20conta&body=Ol%C3%A1%2C%20quero%20solicitar%20a%20exclus%C3%A3o%20da%20minha%20conta%20e%20dos%20dados%20associados.%20Por%20favor%2C%20informem%20como%20verificar%20minha%20titularidade%20com%20seguran%C3%A7a."
              >
                Solicitar exclusão da conta
              </a>
            </p>
            <p>
              A exclusão é atendida pela pessoa responsável pelo Português+,
              após verificar a titularidade. O link abre seu aplicativo de
              e-mail; a mensagem só é enviada quando você confirmar o envio
              nele.
            </p>
            <p
              id="privacy-message"
              className="form-message"
              role="status"
              aria-live="polite"
            ></p>
          </section>
        </section>
      </main>{" "}
      <footer className="site-footer">
        {"© 2026 Português+ · Sua prática, seu progresso."}
      </footer>{" "}
    </PageFrame>
  );
}
