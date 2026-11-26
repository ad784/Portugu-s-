const { createServerClient } = require("../config/db");
const { legalVersions } = require("../config/photo-config");
const {
  accessToken,
  readCookies,
  REFRESH_COOKIE,
  writeSession,
  clearSession,
} = require("../middleware/auth-cookies");

function publicUser(user) {
  return user ? { id: user.id, email: user.email } : null;
}

function publicSession(session) {
  return session
    ? { user: publicUser(session.user), expires_at: session.expires_at }
    : null;
}

function createAuthController({
  createClient = createServerClient,
  fetchImpl = (...args) => fetch(...args),
} = {}) {
  const refreshing = new Map();
  const attempts = new Map();
  const rateLimit = (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (req.method === "GET") return next();
    const now = Date.now();
    for (const [key, entry] of attempts)
      if (entry.until <= now) attempts.delete(key);
    const ip =
      process.env.VERCEL === "1"
        ? req.get("x-forwarded-for")?.split(",")[0]?.trim() || req.ip
        : req.ip;
    const key = `${ip}:${req.path}`;
    const entry = attempts.get(key) || { count: 0, until: now + 15 * 60_000 };
    entry.count++;
    attempts.set(key, entry);
    if (entry.count > 60)
      return res.status(429).json({
        erro: "Aguarde antes de tentar novamente.",
        code: "over_request_rate_limit",
      });
    next();
  };
  const route = (handler) => async (req, res, next) => {
    try {
      await handler(req, res);
    } catch {
      res.status(503).json({
        erro: "Não foi possível conectar ao serviço de autenticação. Tente novamente.",
      });
    }
  };
  function fail(res, error) {
    const status = Number(error?.status);
    const safeStatus = status >= 400 && status < 500 ? status : 503;
    const messages = {
      invalid_credentials: "E-mail ou senha incorretos.",
      email_not_confirmed: "Email not confirmed",
      same_password: "Escolha uma senha diferente da senha anterior.",
      weak_password: "Use uma senha de pelo menos 8 caracteres.",
      user_already_exists: "Este e-mail já possui uma conta.",
      otp_expired: "O link é inválido ou expirou. Solicite outro.",
    };
    return res.status(safeStatus).json({
      erro:
        messages[error?.code] ||
        (safeStatus === 429
          ? "Aguarde antes de tentar novamente."
          : "Não foi possível concluir a autenticação. Tente novamente."),
      code: error?.code,
    });
  }
  const emailValid = (value) =>
    typeof value === "string" &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const passwordValid = (value) =>
    typeof value === "string" && value.length >= 8 && value.length <= 1024;
  function redirect(req, path) {
    // Redirect destinations are server-defined, never taken from a supplied URL.
    const origin =
      process.env.APP_ORIGIN ||
      `${process.env.VERCEL === "1" ? "https" : req.protocol}://${req.get("host")}`;
    return new URL(path, origin).href;
  }
  async function authenticated(req, res) {
    const token = accessToken(req);
    if (!token) {
      res.status(401).json({ erro: "Entre na sua conta para continuar." });
      return null;
    }
    const client = createClient();
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) {
      if (!error || [400, 401, 403, 404].includes(Number(error.status)))
        res.status(401).json({ erro: "Sua sessão expirou. Entre novamente." });
      else fail(res, error);
      return null;
    }
    if (
      req.path === "/password" &&
      req.get("X-Portugues-User") &&
      req.get("X-Portugues-User") !== data.user.id
    ) {
      res
        .status(409)
        .json({ erro: "A conta mudou. Entre novamente na conta original." });
      return null;
    }
    return { client, user: data.user, token };
  }
  async function refresh(req, res) {
    const token = readCookies(req)[REFRESH_COOKIE];
    if (!token) {
      clearSession(req, res);
      res.status(401).json({ erro: "Sua sessão expirou. Entre novamente." });
      return;
    }
    let pending = refreshing.get(token);
    if (!pending) {
      pending = createClient().auth.refreshSession({ refresh_token: token });
      refreshing.set(token, pending);
      pending
        .finally(() => {
          if (refreshing.get(token) === pending) refreshing.delete(token);
        })
        .catch(() => {});
    }
    const { data, error } = await pending;
    if (error || !data?.session) {
      if ([400, 401, 403].includes(Number(error?.status))) {
        clearSession(req, res);
        return res
          .status(401)
          .json({ erro: "Sua sessão expirou. Entre novamente." });
      }
      return fail(res, error);
    }
    writeSession(req, res, data.session);
    res.json({ data: { session: publicSession(data.session) } });
  }
  const getSession = route(async (req, res) => {
    if (!accessToken(req)) return res.json({ data: { session: null } });
    const auth = await authenticated(req, res);
    if (auth) res.json({ data: { session: { user: publicUser(auth.user) } } });
  });

  const login = route(async (req, res) => {
    const { email, password } = req.body || {};
    if (
      !emailValid(email) ||
      typeof password !== "string" ||
      !password ||
      password.length > 1024
    )
      return res.status(400).json({ erro: "Informe e-mail e senha válidos." });
    const { data, error } = await createClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error || !data?.session) return fail(res, error);
    writeSession(req, res, data.session);
    res.json({ data: { session: publicSession(data.session) } });
  });
  const signup = route(async (req, res) => {
    const { email, password, nome, termsAccepted, aiConsent } = req.body || {};
    if (
      !emailValid(email) ||
      !passwordValid(password) ||
      typeof nome !== "string" ||
      !nome.trim() ||
      nome.length > 120 ||
      termsAccepted !== true ||
      aiConsent !== true
    )
      return res.status(400).json({
        erro: "Preencha os dados e aceite os termos e o uso da correção por IA.",
      });
    const versions = legalVersions();
    const { data, error } = await createClient().auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: redirect(req, "/nova"),
        data: {
          nome: nome.trim(),
          terms_version: versions.termsVersion,
          privacy_version: versions.privacyVersion,
          ai_consent: true,
        },
      },
    });
    if (error) return fail(res, error);
    if (data.session) writeSession(req, res, data.session);
    res.json({
      data: {
        session: publicSession(data.session),
        user: data.user
          ? {
              ...publicUser(data.user),
              identities: data.user.identities?.length === 0 ? [] : undefined,
            }
          : null,
      },
    });
  });
  const settings = route(async (_req, res) => {
    const response = await fetchImpl(
      `${process.env.SUPABASE_URL}/auth/v1/settings`,
      {
        headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok)
      return res
        .status(503)
        .json({ erro: "Não foi possível verificar o cadastro agora." });
    const settings = await response.json();
    res.json({
      signupEnabled:
        !settings.disable_signup && settings.external?.email !== false,
    });
  });
  const recovery = route(async (req, res) => {
    if (process.env.EMAIL_RECOVERY_ENABLED !== "true")
      return res.status(503).json({
        erro: "A recuperação automática está temporariamente pausada.",
      });
    if (!emailValid(req.body?.email))
      return res.status(400).json({ erro: "Informe um e-mail válido." });
    const { error } = await createClient().auth.resetPasswordForEmail(
      req.body.email,
      { redirectTo: redirect(req, "/recuperar?reset=1") },
    );
    if (error) return fail(res, error);
    res.json({ data: {} });
  });
  const callback = route(async (req, res) => {
    const { access_token, refresh_token } = req.body || {};
    if (
      typeof access_token !== "string" ||
      typeof refresh_token !== "string" ||
      access_token.length > 16000 ||
      refresh_token.length > 4096
    )
      return res.status(400).json({ erro: "Link inválido." });
    const { data, error } = await createClient().auth.setSession({
      access_token,
      refresh_token,
    });
    if (error || !data?.session) return fail(res, error);
    // setSession can return the user decoded from a JWT: verify it with Auth before accepting it.
    const verified = await createClient().auth.getUser(
      data.session.access_token,
    );
    if (verified.error || !verified.data?.user)
      return fail(res, verified.error || { status: 401 });
    writeSession(req, res, data.session);
    res.json({
      data: {
        session: {
          ...publicSession(data.session),
          user: publicUser(verified.data.user),
        },
      },
    });
  });
  const password = route(async (req, res) => {
    if (!passwordValid(req.body?.password))
      return res
        .status(400)
        .json({ erro: "Use uma senha de pelo menos 8 caracteres." });
    const auth = await authenticated(req, res);
    if (!auth) return;
    // updateUser requires the full verified session on this per-request client.
    const refreshToken = readCookies(req)[REFRESH_COOKIE];
    if (!refreshToken)
      return res
        .status(401)
        .json({ erro: "Sua sessão expirou. Entre novamente." });
    const established = await auth.client.auth.setSession({
      access_token: auth.token,
      refresh_token: refreshToken,
    });
    if (established.error) return fail(res, established.error);
    const { data, error } = await auth.client.auth.updateUser({
      password: req.body.password,
    });
    if (error) return fail(res, error);
    if (established.data?.session)
      writeSession(req, res, established.data.session);
    res.json({ data: { user: publicUser(data.user) } });
  });
  const logout = route(async (req, res) => {
    let token = accessToken(req);
    const refreshToken = readCookies(req)[REFRESH_COOKIE];
    if (token && refreshToken) {
      // Refresh an expired access token so logout also revokes the provider's refresh session.
      const established = await createClient().auth.setSession({
        access_token: token,
        refresh_token: refreshToken,
      });
      if (established.error) {
        if (![400, 401, 403, 404].includes(Number(established.error.status)))
          return fail(res, established.error);
        token = null;
      } else token = established.data?.session?.access_token || token;
    }
    if (token) {
      const { error } = await createClient().auth.admin.signOut(token, "local");
      if (error && ![401, 403, 404].includes(Number(error.status)))
        return fail(res, error);
    }
    clearSession(req, res);
    res.json({ data: {} });
  });
  return {
    rateLimit,
    getSession,
    refresh: route(refresh),
    login,
    signup,
    settings,
    recovery,
    callback,
    password,
    logout,
  };
}

module.exports = { createAuthController };
