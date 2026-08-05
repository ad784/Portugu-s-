// LOGIN
function login() {
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

  window.location.href = "nova.html";
}

// ENVIAR REDAÇÃO
async function corrigir() {
  const texto = document.getElementById("redacao").value;

  if (!texto) {
    alert("Digite sua redação");
    return;
  }

  try {
    const resposta = await fetch("http://localhost:3000/corrigir", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ texto })
    });

    const dados = await resposta.json();

    if (!dados.resultado) {
      alert("Erro ao corrigir");
      return;
    }

    localStorage.setItem("resultado", dados.resultado);
    window.location.href = "resultado.html";

  } catch (erro) {
    alert("Erro ao conectar com o servidor");
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
  const linhas = redacao.value.split(/\r?\n/).filter((linha) => linha.trim()).length;
  contador.innerText = `${total} ${total === 1 ? "palavra" : "palavras"}`;

  if (contadorLinhas) {
    contadorLinhas.innerText = `${linhas}/10 linhas para correção`;
    contadorLinhas.classList.toggle("line-target-ok", linhas >= 10);
  }
}
