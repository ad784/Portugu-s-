// The browser talks only to the application API. Provider credentials stay on the server.
export function createAuthApi(fetchImpl = (...args) => fetch(...args)) {
  const listeners = new Set();
  let current = null;
  let renewal;
  const channel =
    typeof window !== "undefined" && typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel("portugues-session")
      : null;
  function changed(event, session, broadcast = false) {
    current = session;
    for (const listener of listeners) listener(event, session);
    if (broadcast) channel?.postMessage(event);
  }
  async function call(path, body, method = "POST") {
    const response = await fetchImpl(`/api/auth/${path}`, {
      method,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-Portugues-Request": "1",
        ...(current?.user?.id ? { "X-Portugues-User": current.user.id } : {}),
      },
      ...(method !== "GET" ? { body: JSON.stringify(body || {}) } : {}),
      signal: AbortSignal.timeout(20000),
    });
    const payload = await response.json();
    if (!response.ok)
      return {
        data: { session: null },
        error: {
          message: payload.erro || "Não foi possível concluir a solicitação.",
          code: payload.code,
          status: response.status,
        },
      };
    return { data: payload.data || payload, error: null };
  }
  async function refreshSession() {
    renewal ||= call("refresh")
      .then((result) => {
        if (!result.error) changed("TOKEN_REFRESHED", result.data.session);
        else if (result.error.status === 401) changed("SIGNED_OUT", null);
        return result;
      })
      .finally(() => {
        renewal = null;
      });
    return renewal;
  }
  async function getSession() {
    let result = await call("session", null, "GET");
    if (result.error?.status === 401) result = await refreshSession();
    if (result.error?.status === 401)
      return { data: { session: null }, error: null };
    if (!result.error) {
      const session = result.data.session;
      if (session?.user?.id !== current?.user?.id)
        changed(session ? "SIGNED_IN" : "SIGNED_OUT", session);
      current = session;
    }
    return result;
  }
  const auth = {
    getSession,
    refreshSession,
    onAuthStateChange(listener) {
      listeners.add(listener);
      return {
        data: {
          subscription: { unsubscribe: () => listeners.delete(listener) },
        },
      };
    },
    async signInWithPassword(credentials) {
      const result = await call("login", credentials);
      if (!result.error) changed("SIGNED_IN", result.data.session, true);
      return result;
    },
    async signUp({ email, password, options }) {
      const result = await call("signup", {
        email,
        password,
        nome: options?.data?.nome,
        termsAccepted: true,
        aiConsent: options?.data?.ai_consent === true,
      });
      if (!result.error && result.data.session)
        changed("SIGNED_IN", result.data.session, true);
      return result;
    },
    async signOut() {
      const result = await call("logout");
      if (result.error)
        throw Object.assign(new Error(result.error.message), result.error);
      changed("SIGNED_OUT", null, true);
      return result;
    },
    updateUser({ password }) {
      return call("password", { password });
    },
    resetPasswordForEmail(email) {
      return call("recovery", { email });
    },
    async acceptCallback(tokens) {
      const result = await call("callback", tokens);
      if (!result.error) changed("SIGNED_IN", result.data.session, true);
      return result;
    },
  };
  if (channel)
    channel.onmessage = () => {
      getSession().catch(() => {});
    };
  return { auth, settings: () => call("settings", null, "GET") };
}
