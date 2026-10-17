const { createClient } = require("@supabase/supabase-js");

// `@supabase/server/core` and `jose` are ESM packages. Keep their loading
// dynamic so Vercel's CommonJS function bundle does not turn them into
// `require()` calls (which fail with ERR_REQUIRE_ESM at cold start).
let jwtModules;
function getJwtModules() {
  jwtModules ||= Promise.all([import("@supabase/server/core"), import("jose")]);
  return jwtModules;
}

function createServerClient(accessToken) {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined
  });
}

const localDemoAuthEnabled = process.env.LOCAL_DEMO_AUTH === "true" && process.env.VERCEL !== "1";

async function requireSupabaseUser(req, res, next) {
  const host = req.hostname || "";
  if (localDemoAuthEnabled && ["localhost", "127.0.0.1", "::1"].includes(host)) {
    req.supabaseUser = { id: "local-demo-user", email: "local@localhost", app_metadata: { role: "admin" } };
    req.isAdmin = true;
    req.isLocalDemo = true;
    req.supabase = { from: () => ({ insert: async () => ({ data: null, error: null }) }) };
    return next();
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    return res.status(503).json({ erro: "Autenticacao Supabase nao configurada no servidor" });
  }
  const token = (req.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ erro: "Sessao invalida ou expirada" });
  try {
    // Tokens assinados com as chaves assimetricas do Supabase podem ser
    // verificados localmente. Isso evita uma chamada ao Auth para cada foto.
    // Tokens HS256 antigos continuam usando getUser como fallback.
    let alg;
    try {
      const [, jose] = await getJwtModules();
      ({ alg } = jose.decodeProtectedHeader(token));
    } catch {
      return res.status(401).json({ erro: "Sessao invalida ou expirada" });
    }
    if (alg !== "HS256" && process.env.SUPABASE_JWKS_URL) {
      const [supabaseServer] = await getJwtModules();
      const { data: verified, error: verificationError } = await supabaseServer.verifyCredentials(
        { token, apikey: null },
        { auth: "user" }
      );
      if (!verificationError && verified?.userClaims) {
        const claims = verified.userClaims;
        req.supabaseUser = {
          id: claims.id,
          email: claims.email,
          app_metadata: claims.appMetadata || {}
        };
        req.isAdmin = req.supabaseUser.app_metadata.role === "admin";
        req.supabase = supabaseServer.createContextClient({ auth: { token } });
        return next();
      }
    }

    const { data, error } = await createServerClient().auth.getUser(token);
    if (error || !data.user) {
      const invalid = [400, 401, 403].includes(Number(error?.status));
      return res.status(invalid ? 401 : 503).json({ erro: invalid ? "Sessao invalida ou expirada" : "Nao foi possivel validar sua sessao agora. Tente novamente em instantes." });
    }
    req.supabaseUser = data.user;
    req.isAdmin = data.user.app_metadata?.role === "admin";
    req.supabase = createServerClient(token);
    return next();
  } catch (error) {
    console.error("Falha ao validar a sessao no Supabase:", error.message);
    return res.status(503).json({ erro: "Nao foi possivel validar sua sessao agora. Tente novamente em instantes." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.isAdmin) return res.status(403).json({ erro: "Acesso restrito ao administrador" });
  return next();
}

module.exports = { requireSupabaseUser, requireAdmin };
