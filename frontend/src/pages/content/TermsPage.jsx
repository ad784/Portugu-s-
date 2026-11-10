import PageFrame from "../PageFrame.jsx";

export default function TermsPage() {
  return (
    <PageFrame
      name="termos"
      title="Termos de uso | Português+"
      bodyClass="policy-page"
    >
      <header className="site-header">
        <a className="brand" href="/">
          Português+
        </a>
        <nav className="site-nav">
          <a href="/cadastro">Criar conta</a>
          <a href="/privacidade">Privacidade</a>
        </nav>
      </header>
      <main className="policy-main">
        <span className="eyebrow">CONDIÇÕES DE USO</span>
        <h1>Termos de uso</h1>
        <p className="policy-updated">Versão de 30 de outubro de 2026.</p>
        <section>
          <h2>Finalidade</h2>
          <p>
            O Português+ oferece prática de redação e feedback gerado por
            inteligência artificial. As notas são estimativas pedagógicas, podem
            conter erros e não substituem avaliações oficiais do ENEM ou a
            orientação de professores.
          </p>
        </section>
        <section>
          <h2>Sua conta</h2>
          <p>
            Forneça informações corretas, proteja sua senha e use apenas sua
            própria conta. Se você for menor de idade, utilize o serviço com a
            orientação de seu responsável.
          </p>
        </section>
        <section>
          <h2>Redações e fotos</h2>
          <p>
            Envie somente conteúdos que você tem autorização para utilizar.
            Evite nomes, documentos, rostos e outros dados pessoais nas redações
            e imagens. Você mantém os direitos sobre seus textos e autoriza seu
            processamento para correção e armazenamento no seu histórico,
            conforme a Política de privacidade.
          </p>
        </section>
        <section>
          <h2>Uso responsável e disponibilidade</h2>
          <p>
            Não tente acessar dados de outras pessoas, contornar limites ou
            automatizar envios abusivos. O serviço aplica limites de uso e pode
            ficar temporariamente indisponível. Confira a transcrição de fotos e
            revise o feedback antes de utilizá-lo. Guarde uma cópia de seus
            textos.
          </p>
        </section>
        <section>
          <h2>Aceite e contato</h2>
          <p>
            Ao criar sua conta, você aceita esta versão dos termos e confirma a
            leitura da Política de privacidade. A versão e a data do aceite são
            registradas. Dúvidas e solicitações sobre sua conta ou seus dados:{" "}
            <a href="mailto:portuguesmais02@gmail.com">
              portuguesmais02@gmail.com
            </a>
            .
          </p>
        </section>
        <p>
          <a href="/cadastro">Voltar ao cadastro</a> ·{" "}
          <a href="/privacidade">Política de privacidade</a>
        </p>
      </main>
      <footer className="site-footer">© 2026 Português+</footer>
    </PageFrame>
  );
}
