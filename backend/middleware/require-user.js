const { createClient } = require("@supabase/supabase-js");

// jose is ESM; load it dynamically because this backend uses CommonJS.
let joseModule;
let supabaseJwks;
function getJose() {
  joseModule ||= import("jose");
  return joseModule;
}

function getSupabaseJwks(jose) {
  if (supabaseJwks) return supabaseJwks;
  const jwksUrl = process.env.SUPABASE_JWKS_URL
    || `${String(process.env.SUPABASE_URL || "").replace(/\/+$/, "")}/auth/v1/.well-known/jwks.json`;
  if (!jwksUrl.startsWith("https://")) return null;
  supabaseJwks = jose.createRemoteJWKSet(new URL(jwksUrl), {
    timeoutDuration: 3000,
    cooldownDuration: 30_000,
    cacheMaxAge: 10 * 60_000
  });
  return supabaseJwks;
}

function createServerClient(accessToken) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined
  });
}

async function getUserWithRetry(accessToken) {
  const client = createServerClient();
  let result;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      result = await client.auth.getUser(accessToken);
    } catch (error) {
      result = { data: { user: null }, error };
    }
    if (!result.error || [400, 401, 403].includes(Number(result.error.status))) return result;
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }
  return result;
}

const localDemoAuthEnabled = process.env.LOCAL_DEMO_AUTH === "true" && process.env.VERCEL !== "1";

function sendAuthFailure(req, res, next, status, message, options = {}) {
  if (status === 503 && options.continueOnAuthOutage) {
    req.authUnavailable = true;
    return next();
  }
  return res.status(status).json({ erro: message });
}

async function requireSupabaseUser(req, res, next, options = {}) {
  const host = req.hostname || "";
  if (localDemoAuthEnabled && ["localhost", "127.0.0.1", "::1"].includes(host)) {
    req.supabaseUser = { id: "local-demo-user", email: "local@localhost", app_metadata: { role: "admin" } };
    req.isAdmin = true;
    req.isLocalDemo = true;
    req.supabase = { from: () => ({ insert: async () => ({ data: null, error: null }) }) };
    return next();
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    return sendAuthFailure(req, res, next, 503, "Autenticacao Supabase nao configurada no servidor", options);
  }
  const token = (req.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return sendAuthFailure(req, res, next, 401, "Sessao invalida ou expirada", options);
  try {
    // Tokens com assinatura assimetrica podem ser validados localmente com o
    // JWKS do projeto. O jose mantem as chaves em cache, evitando que uma
    // indisponibilidade momentanea do endpoint Auth invalide sessoes ativas.
    // Tokens HS256 antigos continuam usando getUser como fallback.
    let alg;
    let jose;
    try {
      jose = await getJose();
      ({ alg } = jose.decodeProtectedHeader(token));
    } catch {
      return res.status(401).json({ erro: "Sessao invalida ou expirada" });
    }
    if (alg !== "HS256" && (process.env.SUPABASE_JWKS_URL || process.env.SUPABASE_URL)) {
      try {
        const issuer = `${String(process.env.SUPABASE_URL).replace(/\/+$/, "")}/auth/v1`;
        const { payload: claims } = await jose.jwtVerify(token, getSupabaseJwks(jose), {
          issuer,
          audience: "authenticated"
        });
        if (claims.sub) {
          req.supabaseUser = {
            id: claims.sub,
            email: claims.email,
            app_metadata: claims.app_metadata || {}
          };
          req.isAdmin = req.supabaseUser.app_metadata.role === "admin";
          req.supabase = createServerClient(token);
          return next();
        }
      } catch (verificationError) {
        console.warn("Validacao local do JWT falhou; usando Auth do Supabase:", verificationError.message);
      }
    }

    const { data, error } = await getUserWithRetry(token);
    if (error || !data.user) {
      const invalid = [400, 401, 403].includes(Number(error?.status));
      const status = invalid ? 401 : 503;
      const message = invalid ? "Sessao invalida ou expirada" : "Nao foi possivel validar sua sessao agora. Tente novamente em instantes.";
      return sendAuthFailure(req, res, next, status, message, options);
    }
    req.supabaseUser = data.user;
    req.isAdmin = data.user.app_metadata?.role === "admin";
    req.supabase = createServerClient(token);
    return next();
  } catch (error) {
    console.error("Falha ao validar a sessao no Supabase:", error.message, error.status || "sem status", error.code || "sem codigo");
    return sendAuthFailure(req, res, next, 503, "Nao foi possivel validar sua sessao agora. Tente novamente em instantes.", options);
  }
}

function requireAdmin(req, res, next) {
  if (!req.isAdmin) return res.status(403).json({ erro: "Acesso restrito ao administrador" });
  return next();
}

module.exports = { requireSupabaseUser, requireAdmin };
