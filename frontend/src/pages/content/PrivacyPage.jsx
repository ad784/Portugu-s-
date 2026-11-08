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
      <main className="policy-main">
        <span className="eyebrow">{"PRIVACIDADE E USO DE DADOS"}</span>
        <h1>{"Política de privacidade"}</h1>
        <p className="policy-updated">
          {"Última atualização: 8 de novembro de 2026."}
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
              "Você pode acessar e exportar seus dados pelo perfil, corrigir seu nome e revogar a autorização de IA. Solicitações de exclusão, informações sobre compartilhamento, oposição e revisão do feedback podem ser encaminhadas a portuguesmais02@gmail.com. Envie a solicitação pelo e-mail da sua conta e não compartilhe sua senha. Também é possível exercer seus direitos perante a ANPD."
            }
          </p>
        </section>
        <section><h2>Finalidades e autorização</h2><p>Nome e e-mail são usados para fornecer sua conta e atender suas solicitações. A correção depende da sua autorização para enviar textos à Groq e fotos ao serviço de leitura configurado. Quando o Google Cloud Vision estiver ativado, ele recebe a foto para extrair a escrita, e o texto lido segue para a Groq. Caso contrário, a Groq também realiza a leitura da imagem. Você pode revogar essa autorização no perfil, mantendo acesso ao histórico e aos seus dados. Sem autorização, novas correções ficam bloqueadas. A revogação não desfaz processamentos já concluídos; uma correção já enviada pode terminar.</p></section>
        <section><h2>Provedores e dados no dispositivo</h2><p>Usamos Supabase para autenticação e armazenamento, Groq para gerar o feedback e, quando configurado, Google Cloud Vision para ler a escrita das fotos. Não trocamos automaticamente de leitor após uma falha. O processamento pode envolver infraestrutura fora do Brasil. A hospedagem recebe os dados necessários para atender às requisições. O navegador guarda a sessão, rascunhos e resultados da conta. Não usamos cookies de publicidade. Evite inserir dados sensíveis ou informações de terceiros nas redações e fotos.</p></section>
        <section><h2>Retenção e registro do aceite</h2><p>O histórico é mantido enquanto a conta estiver ativa, até uma solicitação de exclusão. O servidor usa cache temporário das avaliações por até 24 horas de reutilização; arquivos expirados são removidos nas próximas operações de cache. Os ciclos de retenção de cópias de segurança e registros operacionais dependem dos provedores. Registramos a versão dos termos e da política, a autorização para processamento por IA, revogações e suas datas no servidor.</p></section>
        <p><a href="mailto:portuguesmais02@gmail.com">Contato: portuguesmais02@gmail.com</a> · <a href="/termos">Termos de uso</a></p>
        <section aria-labelledby="students-privacy"><h2 id="students-privacy">Orientações para estudantes e responsáveis</h2><p>Antes de enviar, retire da foto nomes completos, documentos, rostos e informações de outras pessoas. A IA pode errar: confira a leitura da foto e converse com um professor sobre o feedback. Se estiver usando computador compartilhado, guarde uma cópia do seu trabalho e saia da conta ao terminar.</p><p>Estudantes menores de idade e seus responsáveis podem usar o contato acima para esclarecer o uso dos dados, pedir acesso ou solicitar exclusão. Não envie senhas ou documentos pessoais por iniciativa própria. O responsável pelo site informará como verificar a solicitação com segurança.</p></section>
      </main>
      <footer className="site-footer">
        {"© 2026 Português+ · Sua prática, seu progresso."}
      </footer>{" "}
    </PageFrame>
  );
}
