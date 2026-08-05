// Função simples de cadastro (cliente) — redireciona para a página de login após validar campos
function cadastrar() {
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();

  if (!nome || !email || !senha) {
    alert('Preencha todos os campos');
    return;
  }

  // Aqui você poderia enviar os dados ao backend. Por enquanto, apenas redireciona para a página de login.
  window.location.href = './index.html';
}
