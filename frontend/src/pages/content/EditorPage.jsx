import PageFrame from "../PageFrame.jsx";

export default function EditorPage() {
  return (
    <PageFrame
      name="nova"
      title="Nova redação | Português+"
      lang="pt-br"
      bodyClass="editor-page"
    >
      {" "}
      <header className="site-header">
        {" "}
        <a
          className="brand"
          href="/nova.html"
          aria-label="Página inicial do Português+"
        >
          {" "}
          <img
            className="brand-icon"
            src="/assets/logo-portugues-mais.png"
            alt="Logo Português+"
          />{" "}
          <span>
            {"Português"}
            <span>{"+"}</span>
          </span>{" "}
        </a>{" "}
        <nav className="site-nav" aria-label="Navegação principal">
          {" "}
          <a href="/perfil.html">{"Meu perfil"}</a>{" "}
          <a href="/historico.html">{"Minhas redações"}</a>{" "}
          <a href="/evolucao.html">{"Minha evolução"}</a>{" "}
          <a href="/exemplos.html">{"Exemplos de notas"}</a>{" "}
          <a href="#dicas">{"Textos de apoio"}</a>{" "}
          <a href="/index.html" className="nav-cta">
            {"Sair"}
          </a>{" "}
        </nav>{" "}
      </header>{" "}
      <main className="editor-main">
        {" "}
        <section className="editor-heading">
          {" "}
          <div>
            {" "}
            <span className="eyebrow">{"NOVA REDAÇÃO"}</span>{" "}
            <h1>{"Vamos transformar suas ideias em texto?"}</h1>{" "}
            <p>
              {
                "Escreva com calma. Ao finalizar, receba uma correção detalhada no modelo ENEM."
              }
            </p>{" "}
          </div>{" "}
          <span className="editor-badge">{"✦ Espaço de prática"}</span>{" "}
        </section>{" "}
        <div className="editor-layout">
          {" "}
          <section className="writing-card" aria-labelledby="writing-title">
            {" "}
            <div className="writing-card-top">
              {" "}
              <div>
                {" "}
                <h2 id="writing-title">{"Sua redação"}</h2>{" "}
                <p>
                  {"Organize sua introdução, desenvolvimento e conclusão."}
                </p>{" "}
              </div>{" "}
              <span className="autosave-label">
                <i></i>
                {" Rascunho ativo"}
              </span>{" "}
            </div>{" "}
            <div className="theme-field">
              {" "}
              <label id="tema-label">
                {"Tema da proposta "}
                <span>{"(opcional)"}</span>
              </label>{" "}
              <input id="tema-enem" type="hidden" defaultValue="" />{" "}
              <details className="theme-picker">
                {" "}
                <summary aria-labelledby="tema-label">
                  {" "}
                  <span className="theme-summary-icon" aria-hidden="true">
                    {"✍️"}
                  </span>{" "}
                  <span className="theme-summary-copy">
                    <strong id="tema-escolhido">
                      {"Escolha um tema para praticar"}
                    </strong>
                    <small>
                      {"Temas oficiais do ENEM ou uma proposta em aberto"}
                    </small>
                  </span>{" "}
                  <span className="theme-summary-arrow" aria-hidden="true">
                    {"⌄"}
                  </span>{" "}
                </summary>{" "}
                <div className="theme-options" aria-label="Temas de redação">
                  {" "}
                  <button
                    type="button"
                    className="theme-option"
                    data-theme={
                      "Perspectivas acerca do envelhecimento na sociedade brasileira"
                    }
                  >
                    <span className="theme-year">{"2025"}</span>
                    <span className="theme-name">
                      {
                        "Perspectivas acerca do envelhecimento na sociedade brasileira"
                      }
                    </span>
                    <span className="theme-check" aria-hidden="true">
                      {"✓"}
                    </span>
                  </button>{" "}
                  <button
                    type="button"
                    className="theme-option"
                    data-theme={
                      "Desafios para a valorização da herança africana no Brasil"
                    }
                  >
                    <span className="theme-year">{"2024"}</span>
                    <span className="theme-name">
                      {
                        "Desafios para a valorização da herança africana no Brasil"
                      }
                    </span>
                    <span className="theme-check" aria-hidden="true">
                      {"✓"}
                    </span>
                  </button>{" "}
                  <button
                    type="button"
                    className="theme-option"
                    data-theme={
                      "Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil"
                    }
                  >
                    <span className="theme-year">{"2023"}</span>
                    <span className="theme-name">
                      {
                        "Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil"
                      }
                    </span>
                    <span className="theme-check" aria-hidden="true">
                      {"✓"}
                    </span>
                  </button>{" "}
                  <button
                    type="button"
                    className="theme-option"
                    data-theme={
                      "Desafios para a valorização de comunidades e povos tradicionais no Brasil"
                    }
                  >
                    <span className="theme-year">{"2022"}</span>
                    <span className="theme-name">
                      {
                        "Desafios para a valorização de comunidades e povos tradicionais no Brasil"
                      }
                    </span>
                    <span className="theme-check" aria-hidden="true">
                      {"✓"}
                    </span>
                  </button>{" "}
                  <button
                    type="button"
                    className="theme-option"
                    data-theme={
                      "Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil"
                    }
                  >
                    <span className="theme-year">{"2021"}</span>
                    <span className="theme-name">
                      {
                        "Invisibilidade e registro civil: garantia de acesso à cidadania no Brasil"
                      }
                    </span>
                    <span className="theme-check" aria-hidden="true">
                      {"✓"}
                    </span>
                  </button>{" "}
                  <button
                    type="button"
                    className="theme-option"
                    data-theme={
                      "O estigma associado às doenças mentais na sociedade brasileira"
                    }
                  >
                    <span className="theme-year">{"2020"}</span>
                    <span className="theme-name">
                      {
                        "O estigma associado às doenças mentais na sociedade brasileira"
                      }
                    </span>
                    <span className="theme-check" aria-hidden="true">
                      {"✓"}
                    </span>
                  </button>{" "}
                  <button
                    type="button"
                    className="theme-option"
                    data-theme="Democratização do acesso ao cinema no Brasil"
                  >
                    <span className="theme-year">{"2019"}</span>
                    <span className="theme-name">
                      {"Democratização do acesso ao cinema no Brasil"}
                    </span>
                    <span className="theme-check" aria-hidden="true">
                      {"✓"}
                    </span>
                  </button>{" "}
                  <button
                    type="button"
                    className="theme-option"
                    data-theme={
                      "Manipulação do comportamento do usuário pelo controle de dados na internet"
                    }
                  >
                    <span className="theme-year">{"2018"}</span>
                    <span className="theme-name">
                      {
                        "Manipulação do comportamento do usuário pelo controle de dados na internet"
                      }
                    </span>
                    <span className="theme-check" aria-hidden="true">
                      {"✓"}
                    </span>
                  </button>{" "}
                  <button
                    type="button"
                    className="theme-option"
                    data-theme={
                      "Desafios para a formação educacional de surdos no Brasil"
                    }
                  >
                    <span className="theme-year">{"2017"}</span>
                    <span className="theme-name">
                      {
                        "Desafios para a formação educacional de surdos no Brasil"
                      }
                    </span>
                    <span className="theme-check" aria-hidden="true">
                      {"✓"}
                    </span>
                  </button>{" "}
                  <button
                    type="button"
                    className="theme-option"
                    data-theme={
                      "Caminhos para combater a intolerância religiosa no Brasil"
                    }
                  >
                    <span className="theme-year">{"2016"}</span>
                    <span className="theme-name">
                      {
                        "Caminhos para combater a intolerância religiosa no Brasil"
                      }
                    </span>
                    <span className="theme-check" aria-hidden="true">
                      {"✓"}
                    </span>
                  </button>{" "}
                  <button
                    type="button"
                    className="theme-option theme-open"
                    data-theme=""
                  >
                    <span className="theme-open-icon" aria-hidden="true">
                      {"✦"}
                    </span>
                    <span className="theme-name">
                      <strong>{"Tema em aberto"}</strong>
                      <small>
                        {"Escreva sem escolher uma proposta específica"}
                      </small>
                    </span>
                    <span className="theme-check" aria-hidden="true">
                      {"✓"}
                    </span>
                  </button>{" "}
                </div>{" "}
              </details>{" "}
            </div>{" "}
            <label className="sr-only" htmlFor="redacao">
              {"Texto da redação"}
            </label>{" "}
            <textarea
              id="redacao"
              lang="pt-BR"
              spellCheck="true"
              placeholder="Comece a escrever sua redação aqui..."
            ></textarea>{" "}
            <div className="writing-card-bottom">
              {" "}
              <span id="contador-palavras">{"0 palavras"}</span>{" "}
              <span id="contador-linhas" className="line-target">
                {"0/8 linhas mínimas para correção"}
              </span>{" "}
            </div>{" "}
            <div className="editor-actions">
              {" "}
              <button
                id="open-photo-editor"
                className="photo-action"
                type="button"
              >
                {"📷 Enviar foto da redação"}
              </button>{" "}
              <button
                id="correct-essay"
                className="primary-action correct-action"
                type="button"
              >
                {"Corrigir minha redação "}
                <span>{"→"}</span>
              </button>{" "}
            </div>{" "}
          </section>{" "}
          <aside className="tips-panel" id="dicas" aria-live="polite">
            {" "}
            <div className="tips-title">
              <span aria-hidden="true">{"📚"}</span>
              <div>
                <h2>{"Textos de apoio"}</h2>
                <p>{"Contexto e fonte para aprofundar o tema."}</p>
              </div>
            </div>{" "}
            <div id="theme-support-content" className="theme-support-content">
              {" "}
              <span className="support-eyebrow">
                {"CONTEXTO PARA COMEÇAR"}
              </span>{" "}
              <h3 id="theme-support-title">
                {"Escolha um tema para ver o texto de apoio"}
              </h3>{" "}
              <p id="theme-support-text">
                {
                  "Selecione uma proposta no campo acima. Você verá informações iniciais e uma fonte confiável para continuar sua pesquisa."
                }
              </p>{" "}
              <div className="support-question">
                <strong>{"Para desenvolver"}</strong>
                <p id="theme-support-question">
                  {
                    "Que fatores ajudam a explicar o problema e quem é mais afetado por ele?"
                  }
                </p>
              </div>{" "}
              <a
                id="theme-support-source"
                className="support-source"
                href="https://www.gov.br/"
                target="_blank"
                rel="noopener noreferrer"
                hidden
              >
                {"Consultar fonte de referência ↗"}
              </a>{" "}
            </div>{" "}
            <p
              id="editor-message"
              className="form-message"
              role="status"
            ></p>{" "}
          </aside>{" "}
        </div>{" "}
      </main>{" "}
      <footer className="site-footer">
        {"© 2026 Português+ · Sua prática, seu progresso."}
      </footer>{" "}
    </PageFrame>
  );
}
