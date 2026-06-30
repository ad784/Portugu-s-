// LOGIN
function login() {
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

    // tenta pegar nota automaticamente
    const match = resultado.match(/\d{3,4}/);
    if (match && elNota) {
      elNota.innerText = match[0];
    }
  }
};

// VOLTAR
function voltar() {
  window.location.href = "nova.html";
}