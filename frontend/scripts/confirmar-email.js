let verificationEmail = "";
let resendAfter = 0;
let verifying = false;
let resending = false;

function readVerificationEmail() {
  const email = document.getElementById("verification-email").value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    verificationMessage("Informe o e-mail usado no cadastro.");
    return false;
  }
  verificationEmail = email;
  return true;
}

function savePendingVerification() {
  try { sessionStorage.setItem("signup-verification", JSON.stringify({ email: verificationEmail, resendAfter })); } catch {}
}

try {
  const pending = JSON.parse(sessionStorage.getItem("signup-verification") || "null");
  if (pending && typeof pending.email === "string") {
    verificationEmail = pending.email;
    resendAfter = Number(pending.resendAfter) || 0;
    document.getElementById("verification-email").value = verificationEmail;
    document.getElementById("verification-code").focus();
  }
} catch { /* O e-mail pode ser informado manualmente se o armazenamento estiver indisponível. */ }

function verificationMessage(message, type = "error") {
  const element = document.getElementById("verification-message");
  if (!element) return;
  element.textContent = message;
  element.className = `form-message ${type}`;
}

async function confirmEmail(event) {
  event?.preventDefault();
  if (verifying || resending || !readVerificationEmail()) return;
  const token = document.getElementById("verification-code").value.trim();
  if (!/^[0-9]{6,10}$/.test(token)) {
    verificationMessage("Digite o código numérico recebido por e-mail.");
    return;
  }
  verifying = true;
  const button = document.getElementById("verification-button");
  button.disabled = true;
  button.textContent = "Confirmando...";
  try {
    const { data, error } = await window.supabaseClient.auth.verifyOtp({ email: verificationEmail, token, type: "email" });
    if (error) throw error;
    if (!data?.session) throw new Error("Não foi possível confirmar sua sessão. Tente novamente.");
    document.getElementById("verification-code").value = "";
    try { sessionStorage.removeItem("signup-verification"); } catch {}
    verificationMessage("E-mail confirmado. Abrindo a plataforma...", "success");
    window.location.href = "/nova";
  } catch (error) {
    verificationMessage(window.authErrorMessage?.(error) || error.message || "Não foi possível confirmar o código.");
  } finally {
    verifying = false;
    button.disabled = false;
    button.textContent = "Confirmar e continuar →";
  }
}

async function resendCode() {
  if (resending || verifying || !readVerificationEmail()) return;
  const remaining = Math.ceil((resendAfter - Date.now()) / 1000);
  if (remaining > 0) {
    verificationMessage(`Aguarde ${remaining} segundos para reenviar o código.`);
    return;
  }
  resending = true;
  resendAfter = Date.now() + 60_000;
  savePendingVerification();
  const button = document.getElementById("verification-resend");
  button.disabled = true;
  try {
    const { error } = await window.supabaseClient.auth.resend({ type: "signup", email: verificationEmail });
    if (error) throw error;
    verificationMessage("Reenvio solicitado. Confira sua caixa de entrada e use o código mais recente.", "success");
  } catch (error) {
    verificationMessage(window.authErrorMessage?.(error) || error.message || "Não foi possível reenviar o código.");
  } finally {
    resending = false;
    button.disabled = false;
  }
}

document.getElementById("verification-form")?.addEventListener?.("submit", confirmEmail);
document.getElementById("verification-resend")?.addEventListener?.("click", resendCode);
