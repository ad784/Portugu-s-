// LOGIN
async function login() {
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
  const linhasVisuais = contarLinhasVisuais();

  if (!texto) {
    alert("Digite sua redação");
    return;
  }

  if (linhasVisuais < 10) {
    alert(`Sua redacao possui ${linhasVisuais} linhas visuais. Escreva pelo menos 10 linhas antes de corrigir.`);
    return;
  }

  try {
    const session = await getSession();
    if (!session) return;

    const resposta = await fetch("/api/corrigir", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ texto, linhasVisuais })
    });

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
    window.location.href = "resultado.html";

  } catch (erro) {
    alert(erro.message || "Erro ao conectar com o servidor");
    console.error(erro);
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

async function getSession() {
  if (!window.supabaseClient) {
    alert("O servico de autenticacao ainda esta carregando. Tente novamente.");
    return null;
  }

  // Renova o token antes da correcao. Isso evita que uma sessao ainda salva
  // no navegador envie ao backend um access token que ja expirou.
  const { data: { session }, error: refreshError } = await window.supabaseClient.auth.refreshSession();
  const { data: { user }, error } = await window.supabaseClient.auth.getUser();
  if (!session || refreshError || error || !user) {
    await window.supabaseClient.auth.signOut();
    alert("Entre na sua conta para enviar uma redacao.");
    window.location.href = "index.html";
    return null;
  }
  return session;
}
