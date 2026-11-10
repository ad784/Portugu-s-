// Preserve provider messages on 5xx responses: auth-js otherwise serializes
// the Response object itself, producing "{}" instead of its JSON body.
export function createAuthFetch(fetchImpl = fetch) {
  return async (input, options) => {
    const response = await fetchImpl(input, options);
    const url = typeof input === "string" ? input : input?.url || String(input);
    if (response.status >= 500 && url.includes("/auth/v1/")) {
      let body;
      try {
        body = await response.clone().json();
      } catch {
        /* Non-JSON gateway error. */
      }
      const message = [
        body?.message,
        body?.msg,
        body?.error_description,
        body?.error,
      ].find((value) => typeof value === "string" && value.trim());
      Object.defineProperty(response, "message", {
        value:
          message ||
          "O serviço de autenticação está indisponível. Tente novamente mais tarde.",
      });
    }
    return response;
  };
}

export function authErrorMessage(error) {
  const message =
    typeof error?.message === "string" ? error.message.trim() : "";
  const code = error?.code || "";
  if (code === "email_not_confirmed" || /email not confirmed/i.test(message))
    return "Esta conta antiga ainda está pendente de ativação. Entre em contato com o suporte para regularizar seu acesso.";
  if (
    code === "invalid_credentials" ||
    /invalid login credentials/i.test(message)
  )
    return "E-mail ou senha incorretos. Confira os dados e tente novamente.";
  if (
    /Error sending (confirmation|recovery|magic link) email|smtp/i.test(message)
  )
    return "Não foi possível enviar o e-mail de confirmação. O responsável pelo site precisa conferir as configurações SMTP e os logs de autenticação no Supabase.";
  if (/Database error (saving|creating) new user/i.test(message))
    return "O banco de dados recusou a criação da conta. O responsável pelo site precisa conferir os logs e as funções de cadastro no Supabase.";
  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    error?.status === 429 ||
    /rate limit|too many requests/i.test(message)
  )
    return "O limite de tentativas ou de envio de e-mails foi atingido. Aguarde alguns minutos antes de tentar novamente.";
  if (
    code === "user_already_exists" ||
    /already registered|already exists/i.test(message)
  )
    return "Este e-mail já possui uma conta. Tente entrar ou recuperar sua senha.";
  if (
    code === "weak_password" ||
    /weak password|password should/i.test(message)
  )
    return "Escolha uma senha mais forte, com pelo menos 8 caracteres.";
  if (
    /failed to fetch|network|load failed/i.test(message) ||
    error?.name === "TimeoutError"
  )
    return "Não foi possível conectar ao serviço de cadastro. Verifique sua conexão e tente novamente.";
  if (
    !message ||
    ["{}", "[]", "[object Object]"].includes(message) ||
    error?.status >= 500
  )
    return "O serviço de cadastro não conseguiu concluir a solicitação. Tente novamente mais tarde; se persistir, o responsável precisa conferir os logs de autenticação no Supabase.";
  return message;
}
