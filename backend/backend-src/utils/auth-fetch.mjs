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
