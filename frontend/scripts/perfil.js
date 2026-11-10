function profileMessage(message, type = "error") {
  const element = document.getElementById("profile-message");
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${type}`;
}

async function profileRequest(method = "GET", body = null) {
  if (!window.supabaseClient)
    throw new Error(
      "O serviço de autenticação ainda está carregando. Tente novamente.",
    );

  const response = await window.portuguesSession.request("/api/perfil", {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(
      "O servidor respondeu de forma inesperada. Tente novamente.",
    );
  }

  if (response.status === 401) {
    await window.supabaseClient.auth.signOut();
    window.location.href = "/";
    return null;
  }
  if (!response.ok)
    throw new Error(data.erro || "Não foi possível concluir a operação.");
  return data;
}

async function loadProfile() {
  try {
    const data = await profileRequest();
    if (!data) return;
    document.getElementById("perfil-nome").value = data.perfil.nome;
    document.getElementById("perfil-email").value = data.perfil.email;
  } catch (error) {
    profileMessage(error.message || "Não foi possível carregar o perfil.");
  }
}

async function salvarPerfil() {
  const button = document.getElementById("profile-save");
  const originalLabel = button.innerHTML;
  button.disabled = true;
  button.textContent = "Salvando...";
  try {
    const data = await profileRequest("PUT", {
      nome: document.getElementById("perfil-nome").value,
    });
    if (data) {
      document.getElementById("perfil-nome").value = data.perfil.nome;
      profileMessage("Perfil atualizado com sucesso.", "success");
    }
  } catch (error) {
    profileMessage(error.message || "Não foi possível atualizar o perfil.");
  } finally {
    button.disabled = false;
    button.innerHTML = originalLabel;
  }
}

async function alterarSenha() {
  const password = document.getElementById("perfil-senha").value;
  const confirmation = document.getElementById(
    "perfil-senha-confirmacao",
  ).value;
  const message = document.getElementById("password-message");
  const button = document.getElementById("password-save");
  const originalLabel = button.innerHTML;

  const showPasswordMessage = (text, type = "error") => {
    message.textContent = text;
    message.className = `form-message ${type}`;
  };

  if (password.length < 8) {
    showPasswordMessage("A nova senha precisa ter pelo menos 8 caracteres.");
    return;
  }
  if (password !== confirmation) {
    showPasswordMessage("As senhas não coincidem. Confira os dois campos.");
    return;
  }
  if (!window.supabaseClient) {
    showPasswordMessage(
      "O serviço de autenticação ainda está carregando. Tente novamente.",
    );
    return;
  }

  button.disabled = true;
  button.textContent = "Atualizando...";
  try {
    const {
      data: { session },
    } = await window.supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = "/";
      return;
    }
    const { error } = await window.supabaseClient.auth.updateUser({ password });
    if (error) throw error;
    document.getElementById("perfil-senha").value = "";
    document.getElementById("perfil-senha-confirmacao").value = "";
    showPasswordMessage("Senha atualizada com sucesso.", "success");
  } catch (error) {
    showPasswordMessage(
      error.message || "Não foi possível atualizar a senha. Tente novamente.",
    );
  } finally {
    button.disabled = false;
    button.innerHTML = originalLabel;
  }
}

async function sair(event) {
  event?.preventDefault();
  return window.portuguesSession.signOut();
}

window.sair = sair;
document
  .getElementById("profile-save")
  ?.addEventListener("click", salvarPerfil);
document
  .getElementById("password-save")
  ?.addEventListener("click", alterarSenha);
window.addEventListener("DOMContentLoaded", loadProfile);

async function loadConsent() {
  try {
    const response = await window.portuguesSession.request("/api/termos");
    const data = await response.json();
    if (!response.ok) throw new Error(data.erro);
    document.getElementById("consent-summary").textContent = data.accepted
      ? `Autorização de IA ativa. Aceite registrado em ${new Date(data.receipt.accepted_at).toLocaleString("pt-BR")}.`
      : "Autorização de IA inativa. Revise seu aceite para iniciar novas correções.";
    document.getElementById("revoke-consent").disabled = !data.accepted;
    document.getElementById("consent-review").hidden = data.accepted;
  } catch (error) {
    document.getElementById("consent-summary").textContent = error.message;
  }
}
document
  .getElementById("revoke-consent")
  ?.addEventListener("click", async () => {
    const button = document.getElementById("revoke-consent");
    button.disabled = true;
    button.textContent = "Revogando autorização...";
    button.setAttribute("aria-busy", "true");
    try {
      const response = await window.portuguesSession.request("/api/termos", {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro);
      document.getElementById("privacy-message").textContent =
        "Autorização revogada. Nenhuma nova correção será iniciada sem um novo aceite. Uma correção já enviada ao provedor pode terminar.";
      await loadConsent();
    } catch (error) {
      document.getElementById("privacy-message").textContent = error.message;
      button.disabled = false;
    } finally {
      button.textContent = "Revogar autorização de IA";
      button.setAttribute("aria-busy", "false");
    }
  });
document.getElementById("export-data")?.addEventListener("click", async () => {
  const button = document.getElementById("export-data");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.textContent = "Preparando seus dados...";
  try {
    const response = await window.portuguesSession.request(
      "/api/perfil/exportar",
    );
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.erro);
    }
    const data = await response.json();
    data.dadosNesteDispositivo = {
      rascunho: window.userStorage.getItem("rascunho-redacao-v1"),
      fotoPendente: window.userStorage.getItem("rascunho-foto-v1"),
      resultado: window.userStorage.getItem("resultado"),
      pendentes: window.portuguesSession.pending(),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "portugues-mais-meus-dados.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    document.getElementById("privacy-message").textContent =
      "Download preparado. O arquivo contém seus dados pessoais; guarde-o em local seguro.";
  } catch (error) {
    document.getElementById("privacy-message").textContent = error.message;
  } finally {
    button.disabled = false;
    button.setAttribute("aria-busy", "false");
    button.textContent = "Baixar meus dados";
  }
});
window.addEventListener("DOMContentLoaded", loadConsent);
