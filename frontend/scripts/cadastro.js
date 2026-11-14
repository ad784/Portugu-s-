function signupMessage(message, type = "error") {
  const element = document.getElementById("signup-message");
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${type}`;
}

function showResendConfirmation(show = true) {
  const button = document.getElementById("signup-resend-confirmation");
  if (button) button.hidden = !show;
}

async function reenviarConfirmacao() {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const button = document.getElementById("signup-resend-confirmation");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    signupMessage("Informe o mesmo e-mail usado no cadastro.");
    return;
  }
  if (!window.supabaseClient || button?.disabled) return;

  if (button) {
    button.disabled = true;
    button.textContent = "Enviando...";
  }
  try {
    const { error } = await window.supabaseClient.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/nova.html`,
      },
    });
    if (error) throw error;
    signupMessage(
      "Solicitação enviada. Confira a caixa de entrada e o spam; o e-mail só chegará quando o SMTP do site estiver funcionando.",
      "success",
    );
  } catch (error) {
    signupMessage(
      window.authErrorMessage?.(error) ||
        "Não foi possível reenviar. O responsável pelo site precisa corrigir o SMTP no Supabase.",
    );
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Reenviar confirmação";
    }
  }
}

async function cadastrar(event) {
  event?.preventDefault();
  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const senha = document.getElementById("senha").value;
  const consentimento = document.getElementById("consentimento").checked;
  const termos = document.getElementById("termos")?.checked;
  const button = document.getElementById("signup-button");
  if (button.disabled) return;
  showResendConfirmation(false);

  if (!nome || !email || !senha) {
    signupMessage("Preencha todos os campos.");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    signupMessage("Informe um e-mail válido.");
    return;
  }
  if (senha.length < 8) {
    signupMessage("Use uma senha de pelo menos 8 caracteres.");
    return;
  }
  if (!termos) {
    signupMessage(
      "Leia e aceite os Termos de uso e a Política de privacidade para criar sua conta.",
    );
    return;
  }
  if (!consentimento) {
    signupMessage(
      "Confirme que concorda com o uso das redações e fotos para a correção por IA.",
    );
    return;
  }
  if (!window.supabaseClient) {
    signupMessage(
      "O serviço de autenticação ainda está carregando. Tente novamente.",
    );
    return;
  }

  button.disabled = true;
  button.textContent = "Criando conta...";
  try {
    await window.checkSignupConfiguration?.();
    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: `${window.location.origin}/nova.html`,
        data: {
          nome,
          terms_version: window.legalVersions?.termsVersion || "2026-10-30",
          privacy_version: window.legalVersions?.privacyVersion || "2026-10-30",
          ai_consent: true,
        },
      },
    });
    if (error) throw error;

    if (data?.session) {
      signupMessage("Conta criada. Abrindo a plataforma...", "success");
      window.location.href = "/nova.html";
      return;
    }

    if (data?.user?.identities?.length === 0) {
      showResendConfirmation();
      signupMessage(
        "Este e-mail já possui cadastro. Tente entrar; se a conta ainda não foi confirmada, reenvie a confirmação abaixo.",
      );
      return;
    }

    if (data?.user) {
      showResendConfirmation();
      signupMessage(
        "Conta criada. Confira seu e-mail e a pasta de spam para confirmar o cadastro.",
        "success",
      );
      return;
    }

    signupMessage("Nao foi possivel concluir o cadastro. Tente novamente.");
  } catch (error) {
    if (
      /smtp|535|badcredentials|confirmation email/i.test(error?.message || "")
    )
      showResendConfirmation();
    signupMessage(
      window.authErrorMessage
        ? window.authErrorMessage(error)
        : error.message && error.message !== "{}"
          ? error.message
          : "Não foi possível criar a conta. Tente novamente mais tarde.",
    );
  } finally {
    button.disabled = false;
    button.innerHTML = "Criar minha conta <span>→</span>";
  }
}

window.cadastrar = cadastrar;
window.reenviarConfirmacao = reenviarConfirmacao;
document.getElementById("signup-form")?.addEventListener?.("submit", cadastrar);
document
  .getElementById("signup-resend-confirmation")
  ?.addEventListener?.("click", reenviarConfirmacao);
