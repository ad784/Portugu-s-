import PageFrame from "../PageFrame.jsx";

export default function PrivacyPage() {
  return (
    <PageFrame
      name="privacidade"
      title="Privacidade | Português+"
      lang="pt-BR"
      bodyClass="policy-page"
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
      <main className="policy-main">
        <span className="eyebrow">{"PRIVACIDADE E USO DE DADOS"}</span>
        <h1>{"Política de privacidade"}</h1>
        <p className="policy-updated">
          {"Última atualização: agosto de 2026."}
        </p>
        <section>
          <h2>{"Dados tratados"}</h2>
          <p>
            {
              "O Português+ trata nome, e-mail, textos das redações, notas estimadas e, quando enviada, a imagem da redação. Esses dados são usados para autenticação, correção pedagógica e histórico do estudante."
            }
          </p>
        </section>
        <section>
          <h2>{"Uso de inteligência artificial"}</h2>
          <p>
            {
              "O texto ou a foto enviados para correção são encaminhados ao serviço de IA configurado no projeto, exclusivamente para gerar feedback pedagógico. A nota exibida é uma estimativa e não substitui a correção oficial do ENEM."
            }
          </p>
        </section>
        <section>
          <h2>{"Armazenamento e acesso"}</h2>
          <p>
            {
              "As redações e seus resultados ficam armazenados no Supabase. O histórico é restrito ao usuário autenticado; fotos usam bucket privado e não são públicas."
            }
          </p>
        </section>
        <section>
          <h2>{"Seus direitos"}</h2>
          <p>
            {
              "Você pode solicitar acesso, correção ou exclusão dos seus dados ao responsável pelo projeto. Para isso, utilize o canal de contato apresentado na entrega do TCC."
            }
          </p>
        </section>
      </main>
      <footer className="site-footer">
        {"© 2026 Português+ · Sua prática, seu progresso."}
      </footer>{" "}
    </PageFrame>
  );
}
