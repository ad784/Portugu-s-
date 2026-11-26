import { createAuthApi } from "./auth-api.js";
import { initializeSession } from "./session.js";
import { authErrorMessage } from "../utils/auth-errors.mjs";

export const ready = (async () => {
  // Remove credentials saved by the previous browser-side authentication implementation.
  try {
    for (const key of Object.keys(localStorage))
      if (/^sb-.*-auth-token(?:-code-verifier)?$/.test(key))
        localStorage.removeItem(key);
  } catch {
    /* Account drafts use their own storage warning and remain untouched. */
  }
  const response = await fetch("/api/config", {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error("Não foi possível carregar a configuração da aplicação.");
  const config = await response.json();
  window.authErrorMessage = authErrorMessage;
  window.legalVersions = config.legal;
  window.emailRecoveryEnabled = config.emailRecoveryEnabled === true;
  window.authClient = createAuthApi();
  window.checkSignupConfiguration = async () => {
    const { data, error } = await window.authClient.settings();
    if (error) throw Object.assign(new Error(error.message), error);
    if (!data.signupEnabled)
      throw new Error("Novos cadastros estão temporariamente indisponíveis.");
  };
  const params = new URLSearchParams(window.location.hash.slice(1));
  const recovering = params.get("type") === "recovery";
  if (params.has("access_token") && params.has("refresh_token")) {
    const tokens = {
      access_token: params.get("access_token"),
      refresh_token: params.get("refresh_token"),
    };
    // Remove credentials from browser history before sending them to the API.
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    const { error } = await window.authClient.auth.acceptCallback(tokens);
    if (error) throw Object.assign(new Error(error.message), error);
  }
  await initializeSession(window.authClient, recovering);
  if (recovering && !/^\/recuperar\b/.test(window.location.pathname))
    window.location.replace("/recuperar?reset=1");
})();
