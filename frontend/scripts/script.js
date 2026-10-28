// LOGIN
function showMessage(id, message, type = "error") {
  const element = document.getElementById(id);
  if (!element) return false;
  element.textContent = message;
  element.className = `form-message ${type}`;
  return true;
}

function extractScore(resultado) {
  const match = resultado?.match(/^\s*Nota\s*:\s*(\d+)/im);
  return match ? Number(match[1]) : null;
}

function saveLocalHistory({ resultado, tema = "", tipo = "texto" }) {
  const key = "historico-redacoes-local";
  let history = [];
  try { history = JSON.parse(localStorage.getItem(key) || "[]"); } catch { history = []; }
  history.unshift({ id: `local-${Date.now()}`, tipo, tema, nota: extractScore(resultado), resultado, created_at: new Date().toISOString(), local: true });
  localStorage.setItem(key, JSON.stringify(history.slice(0, 30)));
}

const DRAFT_KEY = "rascunho-redacao-v1";
let draftSaveTimer;

const textosDeApoio = {
  "2025": {
    titulo: "Envelhecimento e participação social",
    texto: "O Censo 2022 contou 32,1 milhões de pessoas com 60 anos ou mais no Brasil, 15,8% da população. O aumento da longevidade é uma conquista, mas também exige discutir como garantir autonomia e participação na vida coletiva. Acesso à saúde, mobilidade urbana, renda e redes de cuidado influenciam as condições de envelhecer com dignidade.",
    pergunta: "Como as cidades, os serviços públicos e as famílias podem favorecer a autonomia das pessoas idosas?",
    fonte: "IBGE — Censo 2022: população idosa",
    url: "https://www.ibge.gov.br/biblioteca/visualizacao/livros/liv102038.pdf"
  },
  "2024": {
    titulo: "Herança africana e reconhecimento cultural",
    texto: "A formação do Brasil recebeu contribuições africanas e afro-brasileiras na cultura, na política, na economia e na vida cotidiana. A Lei 10.639/2003 tornou obrigatório o ensino de história e cultura afro-brasileira nas escolas; a Lei 11.645/2008 também incluiu a história e a cultura indígena. A existência dessas normas evidencia o papel da educação no enfrentamento do apagamento histórico e do racismo.",
    pergunta: "Que ações de educação, memória e valorização cultural podem ampliar esse reconhecimento?",
    fonte: "Ministério da Educação — Relações étnico-raciais",
    url: "https://portal.mec.gov.br/secretaria-de-educacao-continuada-alfabetizacao-diversidade-e-inclusao/323-secretarias-112877938/orgaos-vinculados-82187207/12989-relacoes-etnico-raciais"
  },
  "2023": {
    titulo: "Cuidado, gênero e desigualdade",
    texto: "O trabalho de cuidado sustenta a vida diária, mas muitas tarefas domésticas e de assistência a familiares não são remuneradas nem divididas igualmente. Segundo o IBGE, em 2022 as mulheres dedicaram, em média, 21,3 horas por semana a afazeres domésticos e cuidados; os homens, 11,7 horas. Essa diferença pode limitar o tempo disponível para estudo, descanso e trabalho remunerado.",
    pergunta: "Como dividir as responsabilidades de cuidado e ampliar o apoio oferecido pelo poder público?",
    fonte: "IBGE — Mulheres na educação e no trabalho",
    url: "https://educa.ibge.gov.br/criancas/brasil/2868-atualidades/20459-mulheres-brasileiras-na-educacao-e-no-trabalho.html"
  },
  "2022": {
    titulo: "Território, identidade e comunidades tradicionais",
    texto: "Povos e comunidades tradicionais mantêm formas próprias de organização e relações com os territórios e os recursos naturais. Esses espaços podem ser essenciais à continuidade de práticas culturais, religiosas, sociais e econômicas transmitidas entre gerações. Políticas públicas que reconheçam seus direitos e conhecimentos ajudam a proteger modos de vida diversos e a ampliar sua participação nas decisões que os afetam.",
    pergunta: "Como conciliar a proteção dos territórios, os direitos dessas comunidades e as decisões sobre o uso dos recursos naturais?",
    fonte: "Ministério do Desenvolvimento Agrário — Povos e comunidades tradicionais",
    url: "https://www.gov.br/mda/pt-br/assuntos/povos-e-comunidades-tradicionais/politicas-publicas-para-povos-e-comunidades-tradicionais"
  },
  "2021": {
    titulo: "Registro civil e acesso à cidadania",
    texto: "O registro de nascimento formaliza a existência da pessoa perante o Estado e é um passo importante para obter outros documentos e acessar serviços e direitos. Quando alguém não consegue registrar seu nascimento, pode enfrentar obstáculos em etapas da vida que dependem de identificação civil. Por isso, a documentação básica também envolve informação, atendimento acessível e busca ativa de pessoas ainda não registradas.",
    pergunta: "Que barreiras dificultam o registro e como os serviços públicos podem alcançar quem ainda não tem documentação?",
    fonte: "IBGE — Informações sobre sub-registro de nascimentos",
    url: "https://www.ibge.gov.br/estatisticas/metodos-e-classificacoes/outros-documentos/21715-roteiro-para-acessar-as-informacoes-sobre"
  },
  "2020": {
    titulo: "Saúde mental, cuidado e estigma",
    texto: "A saúde mental não depende apenas de escolhas individuais: condições sociais, econômicas e culturais também afetam o bem-estar. No SUS, a Rede de Atenção Psicossocial reúne serviços de cuidado em diferentes níveis. O estigma e a discriminação podem afastar pessoas da busca por ajuda e dificultar sua inclusão; informação responsável e acolhimento são parte da resposta coletiva.",
    pergunta: "Como escolas, serviços de saúde e meios de comunicação podem reduzir o estigma e facilitar o acesso ao cuidado?",
    fonte: "Ministério da Saúde — SUS e saúde mental",
    url: "https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-mental/sus-e-a-saude-mental"
  },
  "2019": {
    titulo: "Cinema, cultura e acesso",
    texto: "O acesso ao cinema depende da existência de salas, da distância, do custo e da diversidade de filmes disponíveis. Em 2024, 40,7% da população brasileira vivia em municípios sem salas de cinema, segundo a ANCINE. O dado mostra que a oferta cultural é desigual no território e convida a pensar em políticas de circulação de obras, espaços culturais locais e acesso a diferentes públicos.",
    pergunta: "Como ampliar o acesso à produção audiovisual para quem vive longe dos grandes circuitos de cinema?",
    fonte: "ANCINE — Informe do mercado cinematográfico 2024",
    url: "https://www.gov.br/ancine/pt-br/oca/publicacoes/arquivos.pdf/informe-mercado-cinematografico-2024.pdf"
  },
  "2018": {
    titulo: "Dados pessoais e autonomia na internet",
    texto: "Serviços digitais coletam dados que podem ser usados para personalizar conteúdos e ofertas. A Lei Geral de Proteção de Dados estabelece regras para o tratamento de dados pessoais e prevê direitos para seus titulares. Compreender como as informações são coletadas e usadas ajuda a discutir transparência, privacidade e a capacidade das pessoas de fazer escolhas informadas no ambiente digital.",
    pergunta: "Que medidas podem tornar o uso de dados mais transparente e proteger a autonomia dos usuários?",
    fonte: "ANPD — Direitos dos titulares de dados",
    url: "https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares"
  },
  "2017": {
    titulo: "Educação de surdos e acessibilidade linguística",
    texto: "A Lei 14.191/2021 reconhece a educação bilíngue de surdos, com Libras como primeira língua e português escrito como segunda, e prevê materiais e profissionais com formação adequada. A garantia legal precisa se traduzir em condições concretas de aprendizagem, comunicação e participação. Acessibilidade linguística beneficia o percurso escolar e o exercício de outros direitos.",
    pergunta: "O que escolas e redes de ensino precisam oferecer para garantir aprendizagem e participação dos estudantes surdos?",
    fonte: "Inep — Educação bilíngue de surdos",
    url: "https://www.gov.br/inep/pt-br/acesso-a-informacao/perguntas-frequentes/censo-escolar/educacao-especial/o-que-e-educacao-bilingue"
  },
  "2016": {
    titulo: "Liberdade religiosa e convivência democrática",
    texto: "A Constituição Federal protege a liberdade de consciência e de crença e assegura o livre exercício dos cultos religiosos. A intolerância religiosa atinge esse direito e pode se manifestar em discriminação, ataques a pessoas ou desrespeito a espaços de culto. Promover conhecimento sobre diferentes tradições e garantir canais de denúncia são caminhos para fortalecer o respeito e a convivência democrática.",
    pergunta: "Como a educação e a proteção de direitos podem prevenir a discriminação por crença?",
    fonte: "Constituição Federal — artigo 5º, inciso VI",
    url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicaocompilado.htm"
  }
};

function atualizarTextoApoio(opcao) {
  const titulo = document.getElementById("theme-support-title");
  const texto = document.getElementById("theme-support-text");
  const pergunta = document.getElementById("theme-support-question");
  const fonte = document.getElementById("theme-support-source");
  if (!titulo || !texto || !pergunta || !fonte) return;

  const ano = opcao?.querySelector(".theme-year")?.textContent.trim();
  const apoio = textosDeApoio[ano];
  if (!apoio) {
    titulo.textContent = "Escreva sobre um tema de sua escolha";
    texto.textContent = "Pesquise em fontes confiáveis, confira a data e a autoria das informações e relacione os dados ao recorte da sua proposta.";
    pergunta.textContent = "Quem é afetado pelo tema, quais fatores o mantêm e que direitos estão envolvidos?";
    fonte.hidden = true;
    return;
  }

  titulo.textContent = `${apoio.titulo} · ENEM ${ano}`;
  texto.textContent = apoio.texto;
  pergunta.textContent = apoio.pergunta;
  fonte.href = apoio.url;
  fonte.textContent = `Fonte de referência: ${apoio.fonte} ↗`;
  fonte.hidden = false;
}

function salvarRascunho() {
  const redacao = document.getElementById("redacao");
  if (!redacao) return;
  const draft = { texto: redacao.value, tema: document.getElementById("tema-enem")?.value || "" };
  try {
    if (draft.texto || draft.tema) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else localStorage.removeItem(DRAFT_KEY);
  } catch (erro) { console.warn("Não foi possível salvar o rascunho neste navegador.", erro); }
}

function agendarSalvamentoRascunho() {
  clearTimeout(draftSaveTimer);
  draftSaveTimer = setTimeout(salvarRascunho, 150);
}

function restaurarRascunho() {
  const redacao = document.getElementById("redacao");
  if (!redacao) return;
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (!draft) return;
    redacao.value = typeof draft.texto === "string" ? draft.texto : "";
    const tema = document.getElementById("tema-enem");
    if (tema && typeof draft.tema === "string") {
      tema.value = draft.tema;
      const option = [...document.querySelectorAll(".theme-option")].find((item) => item.dataset.theme === draft.tema);
      if (option) {
        option.setAttribute("aria-pressed", "true");
        document.getElementById("tema-escolhido").textContent = option.classList.contains("theme-open")
          ? "Tema em aberto"
          : option.querySelector(".theme-name").textContent.trim();
      }
      atualizarTextoApoio(option);
    }
    atualizarContador();
  } catch (erro) { console.warn("Não foi possível recuperar o rascunho salvo.", erro); }
}

document.addEventListener("DOMContentLoaded", () => {
  restaurarRascunho();
  document.getElementById("redacao")?.addEventListener("input", () => {
    atualizarContador();
    agendarSalvamentoRascunho();
  });
  document.getElementById("login-button")?.addEventListener("click", login);
  document.getElementById("correct-essay")?.addEventListener("click", corrigir);
  document.getElementById("open-photo-editor")?.addEventListener("click", () => { window.location.href = "/foto.html"; });
  document.getElementById("write-new-essay")?.addEventListener("click", voltar);
  window.addEventListener("pagehide", salvarRascunho);
  window.addEventListener("resize", atualizarContador);
});
async function login() {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!email || !senha) {
    showMessage("login-message", "Preencha e-mail e senha para entrar.");
    return;
  }

  if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    showMessage("login-message", "Digite um e-mail válido.");
    return;
  }

  if (!window.supabaseClient) {
    showMessage("login-message", "O serviço de autenticação ainda está carregando. Tente novamente.");
    return;
  }

  const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password: senha });
  if (error) {
    showMessage("login-message", error.message);
    return;
  }

  showMessage("login-message", "Login realizado. Abrindo seu editor...", "success");
  window.location.href = "/nova.html";
}

async function sair(event) {
  event?.preventDefault();
  try {
    await window.supabaseClient?.auth.signOut({ scope: "local" });
  } finally {
    localStorage.removeItem("resultado");
    window.location.href = "/index.html";
  }
}

window.sair = sair;

// ENVIAR REDAÇÃO
async function requisicaoApi(url, options) {
  let ultimoErro;
  for (let tentativa = 0; tentativa < 2; tentativa += 1) {
    try {
      return await fetch(url, options);
    } catch (erro) {
      ultimoErro = erro;
      if (tentativa === 0) await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("Não foi possível conectar ao servidor local. Confirme que http://localhost:3000 está aberto e tente novamente.");
}

async function corrigir() {
  const texto = document.getElementById("redacao").value;
  const tema = document.getElementById("tema-enem")?.value || "";
  const linhasVisuais = contarLinhasVisuais();
  const button = document.querySelector(".correct-action");

  if (!texto) {
    showMessage("editor-message", "Digite sua redação antes de corrigir.");
    return;
  }

  if (linhasVisuais < 8) {
    showMessage("editor-message", "Sua redação precisa ter pelo menos 8 linhas para ser enviada à correção.");
    return;
  }

  try {
    const session = await getSession();
    if (!session) return;

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ texto, linhasVisuais, tema })
    };

    if (button) {
      button.disabled = true;
      button.dataset.label = button.innerHTML;
      button.textContent = "Corrigindo redação...";
    }

    let resposta = await requisicaoApi("/api/corrigir", options);

    // Um access token pode expirar entre a abertura da página e o clique no
    // botão. Atualizamos a sessão e repetimos uma única vez antes de pedir
    // que a pessoa entre novamente.
    if (resposta.status === 401) {
      const sessaoRenovada = await getSession(true);
      if (sessaoRenovada) {
        options.headers.Authorization = `Bearer ${sessaoRenovada.access_token}`;
        resposta = await requisicaoApi("/api/corrigir", options);
      }
    }

    const corpo = await resposta.text();
    let dados;
    try {
      dados = corpo ? JSON.parse(corpo) : {};
    } catch {
      throw new Error("O servidor esta indisponivel no momento. Tente novamente em instantes.");
    }

    if (resposta.status === 401) {
      await window.supabaseClient.auth.signOut();
      alert("Sua sessao expirou. Entre novamente para corrigir a redacao.");
      window.location.href = "/index.html";
      return;
    }

    if (!resposta.ok || !dados.resultado) throw new Error(dados.erro || "Nao foi possivel corrigir a redacao.");

    localStorage.setItem("resultado", dados.resultado);
    localStorage.removeItem(DRAFT_KEY);
    if (dados.aviso) {
      // A correção continua disponível para a pessoa mesmo se ocorrer uma
      // falha temporária de sincronização. O detalhe técnico fica no console,
      // sem exibir mensagens internas do Supabase na tela de resultado.
      console.warn("A redação não foi sincronizada com o histórico:", dados.aviso);
      saveLocalHistory({ resultado: dados.resultado, tema, tipo: "texto" });
    }
    localStorage.removeItem("resultado-aviso");
    window.location.href = "/resultado.html";

  } catch (erro) {
    showMessage("editor-message", erro.message || "Erro ao conectar com o servidor");
    console.error(erro);
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = button.dataset.label || "Corrigir minha redação <span>→</span>";
    }
  }
}

function configurarSeletorTema() {
  const value = document.getElementById("tema-enem");
  const picker = document.querySelector(".theme-picker");
  const selectedLabel = document.getElementById("tema-escolhido");
  if (!value || !picker || !selectedLabel) return;

  picker.querySelectorAll(".theme-option").forEach((option) => {
    option.setAttribute("aria-pressed", "false");
    option.addEventListener("click", () => {
      value.value = option.dataset.theme || "";
      agendarSalvamentoRascunho();
      selectedLabel.textContent = option.classList.contains("theme-open")
        ? "Tema em aberto"
        : option.querySelector(".theme-name").textContent.trim();
      atualizarTextoApoio(option);
      picker.querySelectorAll(".theme-option").forEach((item) =>
        item.setAttribute("aria-pressed", String(item === option))
      );
      picker.open = false;
    });
  });
  const selectedOption = [...picker.querySelectorAll(".theme-option")].find((option) => option.dataset.theme === value.value);
  selectedOption?.setAttribute("aria-pressed", "true");
  atualizarTextoApoio(selectedOption);
}

document.addEventListener("DOMContentLoaded", configurarSeletorTema);

// MOSTRAR RESULTADO
window.addEventListener("load", () => {
  const resultado = localStorage.getItem("resultado");
  const aviso = localStorage.getItem("resultado-aviso");
  const avisoElement = document.getElementById("resultado-aviso");
  if (aviso && avisoElement) {
    avisoElement.textContent = aviso;
    avisoElement.hidden = false;
  }

  const elResultado = document.getElementById("resultado");
  const elNota = document.getElementById("nota");

  if (resultado && elResultado) {
    elResultado.innerText = resultado;

    // Copia exatamente a nota exibida no início do relatório.
    // Procurar apenas números no texto inteiro podia selecionar uma competência
    // ou métrica e mostrar uma nota diferente.
    const match = resultado.match(/^\s*Nota\s*:\s*([^\r\n]+)/im);
    if (match && elNota) {
      elNota.innerText = match[1].trim();
    }
    const fold = (value) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    const reportLines = resultado.split(/\r?\n/);
    const competencyStart = reportLines.findIndex((line) => /^competencias\s*:$/.test(fold(line.trim())));
    const competencyEnd = reportLines.findIndex((line, index) => index > competencyStart && /^(erros|sugestoes|redacao)\s*:$/.test(fold(line.trim())));
    const competencySection = competencyStart < 0 ? "" : reportLines.slice(competencyStart + 1, competencyEnd < 0 ? undefined : competencyEnd).join("\n");
    const scores = Array(5).fill(null);
    const comments = Array(5).fill('');
    for (const line of competencySection.split(/\r?\n/)) {
      const item = line.match(/^\s*(?:C)?([1-5])\s*:\s*(\d{1,3})(?:\s*-\s*(.*))?\s*$/i);
      if (!item) continue;
      const index = Number(item[1]) - 1;
      scores[index] = Math.max(0, Math.min(200, Number(item[2])));
      comments[index] = item[3] || '';
    }
    if (scores.some(Number.isFinite)) {
      const names = ['Domínio da escrita formal', 'Compreensão do tema e repertório', 'Seleção e organização dos argumentos', 'Coesão e articulação das ideias', 'Proposta de intervenção'];
      const cards = document.getElementById('competency-cards');
      for (let index = 0; index < scores.length; index += 1) {
        if (!Number.isFinite(scores[index])) continue;
        const card = document.createElement('article');
        card.className = 'competency-card';
        const title = document.createElement('h3');
        title.textContent = `Competência ${index + 1}`;
        const name = document.createElement('p');
        name.className = 'competency-name';
        name.textContent = names[index];
        const score = document.createElement('strong');
        score.className = 'competency-score';
        score.textContent = `${scores[index]} / 200`;
        const track = document.createElement('div');
        track.className = 'competency-track';
        const fill = document.createElement('span');
        fill.style.width = `${scores[index] / 2}%`;
        track.append(fill);
        card.append(title, name, score, track);
        if (comments[index]) {
          const comment = document.createElement('p');
          comment.className = 'competency-comment';
          comment.textContent = comments[index];
          card.append(comment);
        }
        cards.append(card);
      }
      document.getElementById('competency-breakdown').hidden = false;
    }
  }
});

// VOLTAR
function voltar() {
  window.location.href = "/nova.html";
}

function atualizarContador() {
  const redacao = document.getElementById("redacao");
  const contador = document.getElementById("contador-palavras");
  const contadorLinhas = document.getElementById("contador-linhas");

  if (!redacao || !contador) return;

  const total = redacao.value.trim() ? redacao.value.trim().split(/\s+/).length : 0;
  const linhas = contarLinhasVisuais();
  contador.innerText = `${total} ${total === 1 ? "palavra" : "palavras"}`;

  if (contadorLinhas) {
    contadorLinhas.innerText = linhas < 8
      ? `${linhas}/8 linhas mínimas para correção`
      : `${linhas} linhas — mínimo atingido`;
    contadorLinhas.classList.toggle("line-target-ok", linhas >= 8);
  }
}

function contarLinhasVisuais() {
  const redacao = document.getElementById("redacao");
  if (!redacao || !redacao.value.trim()) return 0;

  const styles = window.getComputedStyle(redacao);
  const medidor = document.createElement("div");
  medidor.textContent = redacao.value;
  Object.assign(medidor.style, {
    position: "absolute",
    visibility: "hidden",
    pointerEvents: "none",
    boxSizing: "border-box",
    width: `${redacao.clientWidth}px`,
    padding: styles.padding,
    border: styles.border,
    font: styles.font,
    lineHeight: styles.lineHeight,
    letterSpacing: styles.letterSpacing,
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    wordBreak: "break-word"
  });
  document.body.appendChild(medidor);
  const lineHeight = Number.parseFloat(styles.lineHeight) || Number.parseFloat(styles.fontSize) * 1.75;
  const alturaConteudo = medidor.scrollHeight
    - Number.parseFloat(styles.paddingTop)
    - Number.parseFloat(styles.paddingBottom);
  // scrollHeight e arredondado para pixels inteiros; ceil transformava
  // uma unica linha com poucos decimos de pixel extras em duas.
  const linhas = Math.round(alturaConteudo / lineHeight);
  medidor.remove();
  return Math.max(1, linhas);
}

async function getSession(forceRefresh = false) {
  if (!window.supabaseClient) {
    showMessage("login-message", "O serviço de autenticação ainda está carregando. Tente novamente.");
    return null;
  }

  const { data, error } = await window.supabaseClient.auth.getSession();
  let session = data.session;

  // O cliente do Supabase renova a sessão automaticamente. Só forçamos uma
  // renovação quando o token já está próximo do vencimento ou após um 401.
  const expiraEmBreve = session?.expires_at && session.expires_at * 1000 < Date.now() + 60_000;
  if (forceRefresh || expiraEmBreve) {
    const renovacao = await window.supabaseClient.auth.refreshSession();
    session = renovacao.data.session;
    if (renovacao.error) console.warn("Não foi possível renovar a sessão:", renovacao.error.message);
  }

  if (!session || error) {
    if (forceRefresh) return null;
    await window.supabaseClient.auth.signOut();
    alert("Entre na sua conta para enviar uma redacao.");
    window.location.href = "/index.html";
    return null;
  }
  return session;
}
