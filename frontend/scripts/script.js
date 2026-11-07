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
  window.portuguesSession.savePending({ tipo, tema, nota: extractScore(resultado), resultado });
}

const DRAFT_KEY = "rascunho-redacao-v1";
let draftSaveTimer;
let completedDraft = null;

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
    if (completedDraft?.texto === draft.texto && completedDraft?.tema === draft.tema) window.userStorage.removeItem(DRAFT_KEY);
    else if (draft.texto || draft.tema) window.userStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else window.userStorage.removeItem(DRAFT_KEY);
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
    const draft = JSON.parse(window.userStorage.getItem(DRAFT_KEY) || "null");
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
  if (new URLSearchParams(location.search).get('senha') === 'alterada') showMessage('login-message', 'Senha atualizada. Entre com sua nova senha.', 'success');
  if (new URLSearchParams(location.search).get('sessao') === 'expirada') showMessage('login-message', 'Sua sessão expirou. Entre na mesma conta para recuperar o rascunho salvo neste dispositivo.');
  document.getElementById("redacao")?.addEventListener("input", () => {
    atualizarContador();
    agendarSalvamentoRascunho();
  });
  document.getElementById("login-form")?.addEventListener("submit", login);
  document.getElementById("correct-essay")?.addEventListener("click", corrigir);
  document.getElementById("open-photo-editor")?.addEventListener("click", () => { window.location.href = "/foto"; });
  document.getElementById("write-new-essay")?.addEventListener("click", voltar);
  window.addEventListener("pagehide", salvarRascunho);
  window.addEventListener("resize", atualizarContador);
});
async function login(event) {
  event?.preventDefault();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;

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

  const button = document.getElementById('login-button');
  button.disabled = true;
  try {
    const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password: senha });
    if (error) throw error;
    window.location.href = "/nova";
  } catch (error) {
    showMessage('login-message', window.authErrorMessage ? window.authErrorMessage(error) : error.message || 'Não foi possível entrar. Tente novamente.');
  } finally { button.disabled = false; }
}

async function sair(event) {
  event?.preventDefault();
  return window.portuguesSession.signOut();
}

window.sair = sair;

// ENVIAR REDAÇÃO
let enviandoCorrecao = false;
let correctionRetryTimer;
function updateCorrectionButton() {
  const button = document.querySelector('.correct-action'); if (!button) return;
  const seconds = Math.max(0, Math.ceil((Number(button.dataset.retryUntil || 0) - Date.now()) / 1000));
  button.disabled = enviandoCorrecao || seconds > 0;
  button.setAttribute('aria-busy', String(enviandoCorrecao));
  if (enviandoCorrecao) button.textContent = 'Corrigindo redação...';
  else if (seconds > 0) button.textContent = `Aguarde ${seconds >= 60 ? `${Math.ceil(seconds / 60)} min` : `${seconds} s`}`;
  else button.innerHTML = button.dataset.label || 'Corrigir minha redação <span>→</span>';
  clearTimeout(correctionRetryTimer);
  if (seconds > 0) correctionRetryTimer = setTimeout(updateCorrectionButton, 1000);
}
window.addEventListener('pagehide', () => clearTimeout(correctionRetryTimer));

async function requisicaoApi(url, options) {
  try { return await window.portuguesSession.request(url, options); }
  catch (error) { throw new Error(error.name === 'TimeoutError' ? 'A correção demorou além do esperado. Seu rascunho foi mantido; tente novamente.' : error.message || 'Não foi possível conectar ao serviço. Tente novamente.'); }
}

async function corrigir() {
  const texto = document.getElementById("redacao").value;
  const tema = document.getElementById("tema-enem")?.value || "";
  const linhasVisuais = contarLinhasVisuais();
  const button = document.querySelector(".correct-action");

  if (Number(button?.dataset.retryUntil || 0) > Date.now()) {
    showMessage('editor-message', 'Aguarde o prazo informado antes de tentar novamente. Seu texto permanece no editor.'); return;
  }
  if (!texto) {
    showMessage("editor-message", "Digite sua redação antes de corrigir.");
    return;
  }

  if (linhasVisuais < 8) {
    showMessage("editor-message", "Sua redação precisa ter pelo menos 8 linhas para ser enviada à correção.");
    return;
  }

  if (enviandoCorrecao) return;
  salvarRascunho();
  enviandoCorrecao = true;
  if (button) {
    button.disabled = true;
    button.dataset.label = button.innerHTML;
    updateCorrectionButton();
    showMessage('editor-message', 'Analisando sua redação. Isso pode levar até um minuto. Seu texto permanece no editor.', 'info');
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

    let resposta = await requisicaoApi("/api/corrigir", options);

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
      window.location.href = "/";
      return;
    }

    if (resposta.status === 429 && dados.retryAfterSeconds) {
      button.dataset.retryUntil = String(Date.now() + dados.retryAfterSeconds * 1000);
    }
    if (!resposta.ok || !dados.resultado) throw new Error(dados.erro || "Nao foi possivel corrigir a redacao.");

    window.userStorage.setItem("resultado", dados.resultado);
    completedDraft = { texto, tema };
    salvarRascunho();
    if (dados.aviso) {
      // A correção continua disponível para a pessoa mesmo se ocorrer uma
      // falha temporária de sincronização. O detalhe técnico fica no console,
      // sem exibir mensagens internas do Supabase na tela de resultado.
      console.warn("A redação não foi sincronizada com o histórico:", dados.aviso);
      window.portuguesSession.savePending({ resultado: dados.resultado, tema, tipo: 'texto', hash: dados.hash, conteudo: texto, nota: extractScore(dados.resultado) });
    }
    if (dados.aviso) window.userStorage.setItem('resultado-aviso', 'Sua avaliação está disponível, mas ainda não foi salva na conta. Mantenha este dispositivo conectado para sincronizar antes de sair.');
    else window.userStorage.removeItem('resultado-aviso');
    if (window.portuguesSession.presentResult?.(dados.resultado, dados.aviso || '')) return;
    window.location.href = "/resultado";

  } catch (erro) {
    salvarRascunho();
    showMessage("editor-message", (erro.name === 'TypeError' ? 'Não foi possível conectar ao serviço. Verifique a internet e tente novamente.' : erro.message || 'Não foi possível concluir a correção.') + ' Seu texto permanece no editor.');
    console.error(erro);
  } finally {
    enviandoCorrecao = false;
    if (button) {
      updateCorrectionButton();
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
  const resultado = window.userStorage.getItem("resultado");
  const aviso = window.userStorage.getItem("resultado-aviso");
  const avisoElement = document.getElementById("resultado-aviso");
  if (aviso && avisoElement) {
    avisoElement.textContent = aviso;
    avisoElement.hidden = false;
  }

  const elResultado = document.getElementById("resultado");
  const elNota = document.getElementById("nota");

  if (!resultado && elResultado) {
    document.querySelector('.result-title h1').textContent = 'Você ainda não abriu uma avaliação';
    document.querySelector('.result-title > p').textContent = 'Envie uma redação ou abra uma correção pelo seu histórico.';
  }
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
  window.location.href = "/nova";
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
  return window.portuguesSession?.estimateLines(document.getElementById("redacao")?.value || "") || 0;
}

async function getSession(forceRefresh = false) {
  try {
    const session = await window.portuguesSession.getSession(forceRefresh);
    if (!session) {
      window.dispatchEvent(new Event('portugues:session-expired'));
      if (!window.portuguesStorageUnavailable) window.location.replace('/?sessao=expirada');
    }
    return session;
  } catch (error) {
    showMessage('editor-message', error.message);
    return null;
  }
}
