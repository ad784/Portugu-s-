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
  window.location.href = "nova.html";
}

async function sair(event) {
  event?.preventDefault();
  try {
    await window.supabaseClient?.auth.signOut({ scope: "local" });
  } finally {
    localStorage.removeItem("resultado");
    window.location.href = "index.html";
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
  const tema = document.getElementById("tema-redacao")?.value.trim() || "";
  const linhasVisuais = contarLinhasVisuais();
  const button = document.querySelector(".correct-action");

  if (!texto) {
    showMessage("editor-message", "Digite sua redação antes de corrigir.");
    return;
  }

  if (linhasVisuais < 10) {
    showMessage("editor-message", `Sua redação possui ${linhasVisuais} linhas visuais. Escreva pelo menos 10 linhas antes de corrigir.`);
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
      window.location.href = "index.html";
      return;
    }

    if (!resposta.ok || !dados.resultado) throw new Error(dados.erro || "Nao foi possivel corrigir a redacao.");

    localStorage.setItem("resultado", dados.resultado);
    if (dados.aviso) {
      // A correção continua disponível para a pessoa mesmo se ocorrer uma
      // falha temporária de sincronização. O detalhe técnico fica no console,
      // sem exibir mensagens internas do Supabase na tela de resultado.
      console.warn("A redação não foi sincronizada com o histórico:", dados.aviso);
      saveLocalHistory({ resultado: dados.resultado, tema, tipo: "texto" });
    }
    localStorage.removeItem("resultado-aviso");
    window.location.href = "resultado.html";

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

// MOSTRAR RESULTADO
window.onload = () => {
  const resultado = localStorage.getItem("resultado");

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
  }
};

// VOLTAR
function voltar() {
  window.location.href = "nova.html";
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
    contadorLinhas.innerText = `${linhas}/10 linhas para correção`;
    contadorLinhas.classList.toggle("line-target-ok", linhas >= 10);
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
  const linhas = Math.ceil((medidor.scrollHeight - Number.parseFloat(styles.paddingTop) - Number.parseFloat(styles.paddingBottom)) / lineHeight);
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
    window.location.href = "index.html";
    return null;
  }
  return session;
}
