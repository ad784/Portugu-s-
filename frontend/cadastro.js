// Função simples de cadastro (cliente) — redireciona para a página de login após validar campos
async function cadastrar() {
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();
  const consentimento = document.getElementById('consentimento').checked;

  if (!nome || !email || !senha) {
    alert('Preencha todos os campos');
    return;
  }

  if (!consentimento) {
    alert('Para continuar, confirme que concorda com o uso do texto e das fotos na correção por IA.');
    return;
  }

  // Aqui você poderia enviar os dados ao backend. Por enquanto, apenas redireciona para a página de login.
  if (!window.supabaseClient) {
    alert('O servico de autenticacao ainda esta carregando. Tente novamente.');
    return;
  }

  const { error } = await window.supabaseClient.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } }
  });
  if (error) {
    if (error.code === 'over_email_send_rate_limit') {
      alert('Limite de e-mails do Supabase atingido. Aguarde uma hora ou configure um SMTP proprio no painel do Supabase antes de tentar novamente.');
      return;
    }
    alert(error.message);
    return;
  }

  alert('Conta criada. Confirme seu e-mail antes de entrar, caso essa opcao esteja ativa no Supabase.');
  window.location.href = './index.html';
}
