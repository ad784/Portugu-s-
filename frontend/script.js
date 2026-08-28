// LOGIN
async function login(event) {
  event?.preventDefault();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!email || !senha) {
    alert("Preencha e-mail e senha para entrar.");
    return;
  }

  if (!email.includes("@") || email.startsWith("@") || email.endsWith("@")) {
    alert("Digite um e-mail válido com @");
    return;
  }

  if (!window.supabaseClient) {
    alert("O servico de autenticacao ainda esta carregando. Tente novamente.");
    return;
  }

  const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password: senha });
  if (error) {
    alert(error.message);
    return;
  }

  window.location.href = "nova.html";
}

// ENVIAR REDAÇÃO
async function corrigir() {
  const texto = document.getElementById("redacao").value;
  const tema = document.getElementById("tema-redacao")?.value.trim() || "";
  const linhasVisuais = contarLinhasVisuais();
  const button = document.querySelector(".correct-action");

  if (!texto) {
    alert("Digite sua redação");
    return;
  }

  if (linhasVisuais < 8) {
    alert(`Sua redação possui ${linhasVisuais} linhas visuais. Escreva pelo menos 8 linhas antes de corrigir.`);
    return;
  }

  try {
    const session = await getSession();
    if (!session) return;

    if (button) {
      button.disabled = true;
      button.dataset.label = button.innerHTML;
      button.textContent = "Corrigindo redação...";
    }

    const resposta = await fetch("/api/corrigir", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ texto, linhasVisuais, tema })
    });

    const corpo = await resposta.text();
    let dados;
    try {
      dados = corpo ? JSON.parse(corpo) : {};
    } catch {
      throw new Error("O servidor retornou uma resposta inválida. Tente novamente em instantes.");
    }

    if (resposta.status === 401) {
      await window.supabaseClient.auth.signOut();
      alert("Sua sessao expirou. Entre novamente para corrigir a redacao.");
      window.location.href = "index.html";
      return;
    }

    if (!resposta.ok || !dados.resultado) throw new Error(dados.erro || "Nao foi possivel corrigir a redacao.");

    localStorage.setItem("resultado", dados.resultado);
    localStorage.removeItem("rascunho-redacao");
    localStorage.removeItem("rascunho-tema");
    window.location.href = "resultado.html";

  } catch (erro) {
    alert(erro.message || "Erro ao conectar com o servidor");
    console.error(erro);
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = button.dataset.label || "Corrigir minha redação <span>→</span>";
    }
  }
}

// MOSTRAR RESULTADO
function renderResultado(resultado, container) {
  const sections = resultado.split(/\n\s*\n/).map((section) => section.trim()).filter(Boolean);
  container.replaceChildren();

  sections.forEach((section) => {
    const lines = section.split("\n");
    const title = lines[0].replace(/:$/, "").trim();
    const content = lines.slice(1);
    const card = document.createElement("section");
    card.className = "feedback-section";

    if (content.length) {
      const heading = document.createElement("h3");
      heading.textContent = title;
      card.append(heading);
      const body = document.createElement("div");
      body.className = "feedback-content";
      content.forEach((line) => {
        const item = document.createElement(line.trim().startsWith("-") ? "p" : "div");
        item.textContent = line.replace(/^\s*-\s*/, "").trim();
        if (line.trim().startsWith("-")) item.className = "feedback-item";
        body.append(item);
      });
      card.append(body);
    } else {
      const paragraph = document.createElement("p");
      paragraph.textContent = section;
      card.append(paragraph);
    }
    container.append(card);
  });
}

window.addEventListener("load", () => {
  const resultado = localStorage.getItem("resultado");

  const elResultado = document.getElementById("resultado");
  const elNota = document.getElementById("nota");

  if (resultado && elResultado) {
    renderResultado(resultado, elResultado);

    // Copia exatamente a nota exibida no início do relatório.
    // Procurar apenas números no texto inteiro podia selecionar uma competência
    // ou métrica e mostrar uma nota diferente.
    const match = resultado.match(/^\s*Nota\s*:\s*([^\r\n]+)/im);
    if (match && elNota) {
      elNota.innerText = match[1].trim();
    }
  }
});

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
    contadorLinhas.innerText = `${linhas}/8 linhas para correção`;
    contadorLinhas.classList.toggle("line-target-ok", linhas >= 8);
  }

  localStorage.setItem("rascunho-redacao", redacao.value);
  const tema = document.getElementById("tema-redacao");
  if (tema) localStorage.setItem("rascunho-tema", tema.value);
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

async function getSession() {
  if (!window.supabaseClient) {
    alert("O servico de autenticacao ainda esta carregando. Tente novamente.");
    return null;
  }

  const { data: { session } } = await window.supabaseClient.auth.getSession();
  const { data: { user }, error } = await window.supabaseClient.auth.getUser();
  if (!session || error || !user) {
    await window.supabaseClient.auth.signOut();
    alert("Entre na sua conta para enviar uma redacao.");
    window.location.href = "index.html";
    return null;
  }
  return session;
}

async function sair(event) {
  event?.preventDefault();
  try {
    await window.supabaseClient?.auth.signOut();
  } finally {
    window.location.href = "index.html";
  }
}

window.sair = sair;

window.addEventListener("DOMContentLoaded", () => {
  const redacao = document.getElementById("redacao");
  const tema = document.getElementById("tema-redacao");
  if (!redacao) return;

  redacao.value = localStorage.getItem("rascunho-redacao") || "";
  if (tema) {
    tema.value = localStorage.getItem("rascunho-tema") || "";
    tema.addEventListener("input", atualizarContador);
  }
  atualizarContador();
});
