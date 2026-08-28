// Função simples de cadastro (cliente) — redireciona para a página de login após validar campos
async function cadastrar(event) {
  event?.preventDefault();
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();

  if (!nome || !email || !senha) {
    alert('Preencha todos os campos');
    return;
  }

  if (senha.length < 6) {
    alert('A senha deve ter pelo menos 6 caracteres.');
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
