const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const { createAuthRouter } = require("../backend/backend-src/routes/auth");
const {
  protectCookieRequests,
} = require("../backend/backend-src/middleware/auth-cookies");
const { legalVersions } = require("../backend/backend-src/config/photo-config");

const user = {
  id: "account-a",
  email: "ana@example.com",
  app_metadata: { private: "server-only" },
};
const session = {
  user,
  access_token: "private-access",
  refresh_token: "private-refresh",
  expires_at: Math.floor(Date.now() / 1000) + 3600,
};
const ok = (data) => ({ data, error: null });
const invalid = {
  data: { user: null },
  error: { status: 401, code: "invalid_credentials" },
};

async function setup(t, overrides = {}) {
  const calls = [];
  const auth = {
    signInWithPassword: async (input) => {
      calls.push(["login", input]);
      return ok({ session });
    },
    signUp: async (input) => {
      calls.push(["signup", input]);
      return ok({ user, session: null });
    },
    getUser: async (token) => {
      calls.push(["user", token]);
      return token === session.access_token ? ok({ user }) : invalid;
    },
    refreshSession: async (input) => {
      calls.push(["refresh", input]);
      return ok({ session: { ...session, access_token: "renewed-access" } });
    },
    setSession: async (input) => {
      calls.push(["setSession", input]);
      return ok({ session: { ...session, ...input } });
    },
    updateUser: async (input) => {
      calls.push(["password", input]);
      return ok({ user });
    },
    resetPasswordForEmail: async (...input) => {
      calls.push(["recovery", ...input]);
      return ok({});
    },
    admin: {
      signOut: async (...input) => {
        calls.push(["logout", ...input]);
        return ok({});
      },
    },
    ...overrides,
  };
  const app = express();
  app.use(express.json());
  app.use("/api", protectCookieRequests);
  app.use(
    "/api/auth",
    createAuthRouter({
      createClient: () => ({ auth }),
      fetchImpl: async () =>
        new Response(JSON.stringify({ external: { email: true } })),
    }),
  );
  const server = await new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const cookies =
    "portugues_access=private-access; portugues_refresh=private-refresh";
  const post = (route, body = {}, headers = {}) =>
    fetch(base + "/api/auth/" + route, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Portugues-Request": "1",
        Origin: base,
        ...headers,
      },
      body: JSON.stringify(body),
    });
  return { base, post, calls, cookies };
}

test("API login stores HttpOnly cookies and never returns provider tokens or private user metadata", async (t) => {
  const env = await setup(t);
  const response = await env.post("login", {
    email: "ana@example.com",
    password: "test-password",
  });
  assert.equal(response.status, 200);
  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  for (const cookie of cookies) {
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.match(cookie, /Path=\/api/);
  }
  const body = await response.text();
  assert.doesNotMatch(
    body,
    /private-access|private-refresh|server-only|app_metadata/,
  );
  assert.equal(JSON.parse(body).data.session.user.id, user.id);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const authenticated = await fetch(env.base + "/api/auth/session", {
    headers: { Cookie: env.cookies },
  });
  assert.equal((await authenticated.json()).data.session.user.id, user.id);
});

test("authentication rejects cross-site mutations and cookie submissions without the CSRF header", async (t) => {
  const env = await setup(t);
  assert.equal(
    (await env.post("login", {}, { Origin: "https://untrusted.example" }))
      .status,
    403,
  );
  assert.equal(
    (
      await env.post(
        "refresh",
        {},
        { Cookie: env.cookies, "X-Portugues-Request": "" },
      )
    ).status,
    403,
  );
  assert.equal(env.calls.length, 0);
});

test("registration validates consent on the API and uses server legal versions and redirect", async (t) => {
  const env = await setup(t);
  const input = {
    nome: "Ana",
    email: "ana@example.com",
    password: "test-password",
    termsAccepted: true,
    aiConsent: true,
    redirectTo: "https://untrusted.example",
    terms_version: "invented",
  };
  assert.equal(
    (await env.post("signup", { ...input, termsAccepted: false })).status,
    400,
  );
  assert.equal((await env.post("signup", input)).status, 200);
  const providerInput = env.calls.find(([kind]) => kind === "signup")[1];
  assert.equal(
    providerInput.options.data.terms_version,
    legalVersions().termsVersion,
  );
  assert.equal(
    providerInput.options.data.privacy_version,
    legalVersions().privacyVersion,
  );
  assert.equal(
    new URL(providerInput.options.emailRedirectTo).pathname,
    "/nova",
  );
  assert.doesNotMatch(providerInput.options.emailRedirectTo, /untrusted/);
});

test("API renewal rotates cookies and unavailable auth preserves the session", async (t) => {
  const env = await setup(t);
  const response = await env.post("refresh", {}, { Cookie: env.cookies });
  assert.equal(response.status, 200);
  assert.match(response.headers.getSetCookie()[0], /renewed-access/);
  assert.doesNotMatch(await response.text(), /renewed-access|private-refresh/);
  const outage = await setup(t, {
    refreshSession: async () => ({ data: {}, error: { status: 503 } }),
  });
  const failure = await outage.post("refresh", {}, { Cookie: outage.cookies });
  assert.equal(failure.status, 503);
  assert.equal(failure.headers.getSetCookie().length, 0);
});

test("expired renewal clears cookies and invalid callback tokens never establish a session", async (t) => {
  const env = await setup(t, { refreshSession: async () => invalid });
  const expired = await env.post("refresh", {}, { Cookie: env.cookies });
  assert.equal(expired.status, 401);
  assert.equal(expired.headers.getSetCookie().length, 2);
  const callback = await env.post("callback", {
    access_token: "forged-access",
    refresh_token: "forged-refresh",
  });
  assert.equal(callback.status, 401);
  assert.equal(callback.headers.getSetCookie().length, 0);
});

test("a verified email callback becomes a cookie session without returning tokens", async (t) => {
  const env = await setup(t);
  const response = await env.post("callback", {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.getSetCookie().length, 2);
  assert.doesNotMatch(await response.text(), /private-access|private-refresh/);
  assert.ok(env.calls.some(([kind]) => kind === "user"));
});

test("recovery requests are sent only by the API with its own return URL", async (t) => {
  const previous = process.env.EMAIL_RECOVERY_ENABLED;
  process.env.EMAIL_RECOVERY_ENABLED = "true";
  t.after(() => {
    if (previous === undefined) delete process.env.EMAIL_RECOVERY_ENABLED;
    else process.env.EMAIL_RECOVERY_ENABLED = previous;
  });
  const env = await setup(t);
  const response = await env.post("recovery", {
    email: user.email,
    redirectTo: "https://untrusted.example",
  });
  assert.equal(response.status, 200);
  const sent = env.calls.find(([kind]) => kind === "recovery");
  assert.equal(sent[1], user.email);
  assert.equal(new URL(sent[2].redirectTo).pathname, "/recuperar");
  assert.doesNotMatch(sent[2].redirectTo, /untrusted/);
});

test("password changes verify the cookie owner and reject a different account", async (t) => {
  const env = await setup(t);
  assert.equal(
    (
      await env.post(
        "password",
        { password: "new-password" },
        { Cookie: env.cookies, "X-Portugues-User": "account-b" },
      )
    ).status,
    409,
  );
  assert.ok(!env.calls.some(([kind]) => kind === "password"));
  assert.equal(
    (
      await env.post(
        "password",
        { password: "new-password" },
        { Cookie: env.cookies, "X-Portugues-User": user.id },
      )
    ).status,
    200,
  );
  assert.ok(env.calls.some(([kind]) => kind === "password"));
});

test("logout revokes the provider session before clearing cookies", async (t) => {
  const env = await setup(t);
  const response = await env.post("logout", {}, { Cookie: env.cookies });
  assert.equal(response.status, 200);
  assert.deepEqual(
    env.calls.find(([kind]) => kind === "logout"),
    ["logout", session.access_token, "local"],
  );
  assert.equal(response.headers.getSetCookie().length, 2);
  const outage = await setup(t, {
    admin: { signOut: async () => ({ error: { status: 503 } }) },
  });
  const failed = await outage.post("logout", {}, { Cookie: outage.cookies });
  assert.equal(failed.status, 503);
  assert.equal(failed.headers.getSetCookie().length, 0);
});

test("expired provider JWT errors are normalized to 401 so the browser can renew", async (t) => {
  const env = await setup(t, {
    getUser: async () => ({
      data: {},
      error: { status: 403, code: "jwt_expired" },
    }),
  });
  const response = await fetch(env.base + "/api/auth/session", {
    headers: { Cookie: env.cookies },
  });
  assert.equal(response.status, 401);
});

test("logout refreshes an expired access token before revoking its session", async (t) => {
  const env = await setup(t, {
    setSession: async () =>
      ok({ session: { ...session, access_token: "renewed-for-logout" } }),
  });
  assert.equal(
    (await env.post("logout", {}, { Cookie: env.cookies })).status,
    200,
  );
  assert.deepEqual(
    env.calls.find(([kind]) => kind === "logout"),
    ["logout", "renewed-for-logout", "local"],
  );
});

test("frontend has no Supabase SDK, provider URL, publishable key or bearer credentials", () => {
  function inspect(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) inspect(target);
      else if (/\.(jsx?|mjs)$/.test(entry.name))
        assert.doesNotMatch(
          fs.readFileSync(target, "utf8"),
          /@supabase\/|https:\/\/[^\s"']*\.supabase\.co|sb_publishable_|Bearer \$\{/,
          target,
        );
    }
  }
  inspect("frontend/frontend-src");
});

test("browser auth client talks only to API routes, uses cookies and renews an expired session", async () => {
  const source = fs.readFileSync(
    "frontend/frontend-src/services/auth-api.js",
    "utf8",
  );
  const { createAuthApi } = await import(
    "data:text/javascript;base64," + Buffer.from(source).toString("base64")
  );
  const calls = [];
  let expired = false;
  const api = createAuthApi(async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith("/session") && expired)
      return new Response(JSON.stringify({ erro: "expired" }), { status: 401 });
    return new Response(
      JSON.stringify({ data: { session: { user: { id: user.id } } } }),
    );
  });
  await api.auth.signInWithPassword({
    email: user.email,
    password: "test-password",
  });
  expired = true;
  const result = await api.auth.getSession();
  assert.equal(result.data.session.user.id, user.id);
  assert.ok(calls.some(({ url }) => url.endsWith("/refresh")));
  for (const { url, options } of calls) {
    assert.ok(url.startsWith("/api/auth/"));
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.headers.Authorization, undefined);
  }
});
