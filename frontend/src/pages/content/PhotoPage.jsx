import PageFrame from "../PageFrame.jsx";

export default function PhotoPage() {
  return (
    <PageFrame
      name="foto"
      title="Enviar foto | Português+"
      lang="pt-br"
      bodyClass="photo-page"
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
          />
          <span>
            {"Português"}
            <span>{"+"}</span>
          </span>{" "}
        </a>{" "}
        <nav className="site-nav" aria-label="Navegação principal">
          {" "}
          <a href="/nova.html">{"Escrever redação"}</a>
          <a href="/index.html" className="nav-cta">
            {"Sair"}
          </a>{" "}
        </nav>{" "}
      </header>{" "}
      <main className="photo-main">
        {" "}
        <section className="editor-heading">
          {" "}
          <div>
            <span className="eyebrow">{"CORREÇÃO POR FOTO"}</span>
            <h1>{"Fotografe sua redação"}</h1>
            <p>
              {
                "Centralize o texto, mantenha uma boa iluminação e deixe a escrita visível."
              }
            </p>
          </div>{" "}
          <span className="editor-badge">{"📷 Leitura automática"}</span>{" "}
        </section>{" "}
        <div className="photo-layout">
          {" "}
          <section className="camera-card" aria-labelledby="camera-title">
            {" "}
            <div className="camera-card-top">
              <div>
                <h2 id="camera-title">{"Posicione sua redação"}</h2>
                <p>
                  {
                    "A câmera abrirá automaticamente para você capturar o texto."
                  }
                </p>
              </div>
              <span id="camera-status" className="camera-status">
                <i></i>
                {"Preparando câmera"}
              </span>
            </div>{" "}
            <div className="camera-viewfinder">
              <video id="camera" autoPlay muted playsInline></video>
              <canvas id="snapshot" style={{ display: "none" }}></canvas>
              <div className="viewfinder-guide" aria-hidden="true"></div>
            </div>{" "}
            <div className="camera-actions">
              <button id="reset-photo" className="photo-action" type="button">
                {"↻ Refazer foto"}
              </button>
              <button
                id="take-photo"
                className="primary-action capture-action"
                type="button"
              >
                {"📷 Tirar foto"}
              </button>
            </div>{" "}
            <label className="file-photo-action" htmlFor="foto-arquivo">
              {"ou selecione uma foto do dispositivo"}
            </label>{" "}
            <input
              id="foto-arquivo"
              className="file-photo-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              capture="environment"
            />{" "}
            <div className="send-photo-row">
              <div>
                <strong>{"Foto pronta?"}</strong>
                <p id="foto-status">
                  {"Depois de tirar a foto, envie para receber a correção."}
                </p>
              </div>
              <button
                id="salvar-foto"
                className="primary-action send-photo-action"
                type="button"
              >
                {"Enviar e corrigir "}
                <span>{"→"}</span>
              </button>
            </div>{" "}
          </section>{" "}
          <aside className="tips-panel photo-tips">
            {" "}
            <div className="tips-title">
              <span>{"✨"}</span>
              <h2>{"Para uma boa foto"}</h2>
            </div>{" "}
            <div className="tip-item">
              <b>{"1"}</b>
              <div>
                <h3>{"Use boa luz"}</h3>
                <p>{"Evite sombras sobre o papel e ambientes escuros."}</p>
              </div>
            </div>{" "}
            <div className="tip-item">
              <b>{"2"}</b>
              <div>
                <h3>{"Deixe tudo visível"}</h3>
                <p>{"Inclua toda a redação no enquadramento."}</p>
              </div>
            </div>{" "}
            <div className="tip-item">
              <b>{"3"}</b>
              <div>
                <h3>{"Foque na escrita"}</h3>
                <p>{"Confira se as palavras estão nítidas antes de enviar."}</p>
              </div>
            </div>{" "}
            <button id="back-to-editor" className="back-editor" type="button">
              {"← Voltar para o editor"}
            </button>{" "}
          </aside>{" "}
        </div>{" "}
      </main>{" "}
      <footer className="site-footer">
        {"© 2026 Português+ · Sua prática, seu progresso."}
      </footer>{" "}
    </PageFrame>
  );
}
