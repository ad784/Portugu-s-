const test = require("node:test");
const assert = require("node:assert/strict");
const { createClient } = require("@supabase/supabase-js");

test("real Supabase SDK preserves SMTP and database errors instead of displaying empty braces", async () => {
  const { createAuthFetch, authErrorMessage } =
    await import("../frontend/scripts/auth-errors.mjs");
  for (const message of [
    "Error sending confirmation email",
    "Database error saving new user",
  ]) {
    let calls = 0;
    const client = createClient("https://test.supabase.co", "public-test-key", {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: createAuthFetch(async () => {
          calls++;
          return new Response(
            JSON.stringify({ code: "unexpected_failure", message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }),
      },
    });
    const { error } = await client.auth.signUp({
      email: "test@example.com",
      password: "test-password-only",
    });
    assert.equal(error.message, message);
    assert.equal(calls, 1);
    assert.match(
      authErrorMessage(error),
      message.includes("email") ? /SMTP/ : /banco de dados/,
    );
  }
});

test("auth errors handle gateways, empty messages and rate limits without exposing raw errors", async () => {
  const { createAuthFetch, authErrorMessage } =
    await import("../frontend/scripts/auth-errors.mjs");
  const response = await createAuthFetch(
    async () => new Response("<html>Bad Gateway</html>", { status: 502 }),
  )("https://test.supabase.co/auth/v1/signup");
  assert.equal(response.status, 502);
  assert.match(response.message, /indisponível/);
  assert.match(authErrorMessage({ message: "{}" }), /não conseguiu/);
  assert.match(authErrorMessage({ status: 429 }), /limite/);
  assert.match(
    authErrorMessage({ status: 500, message: "private SQL detail" }),
    /logs/,
  );
  assert.match(authErrorMessage({ code: "user_already_exists" }), /já possui/);
  assert.match(authErrorMessage({ code: "invalid_credentials" }), /incorretos/);
  assert.match(
    authErrorMessage({ code: "email_not_confirmed" }),
    /pendente de ativação/,
  );
});
