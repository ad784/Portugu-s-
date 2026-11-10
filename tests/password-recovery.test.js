const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function setup({ recovering = false, session = true, sendError = null } = {}) {
  const fields = Object.fromEntries(
    [
      "recovery-message",
      "recovery-request",
      "recovery-reset",
      "recovery-support",
      "email-recuperacao",
      "nova-senha",
      "confirmar-senha",
      "recovery-title",
      "recovery-button",
      "reset-password-button",
    ].map((id) => [id, { textContent: "", value: "" }]),
  );
  fields["email-recuperacao"].value = "  ANA@example.com ";
  fields["nova-senha"].value = "a-new-password";
  fields["confirmar-senha"].value = "a-new-password";
  const storage = new Map(recovering ? [["portugues:recovery", "1"]] : []);
  const calls = { emails: [], passwords: [], redirects: [] };
  const context = {
    window: {
      emailRecoveryEnabled: true,
      location: { origin: "https://portugues.example" },
      addEventListener() {},
      portuguesSession: {
        userId: () => (session ? "user-a" : null),
        getSession: async () => (session ? {} : null),
        signOut: async (redirect) => calls.redirects.push(redirect),
      },
      supabaseClient: {
        auth: {
          resetPasswordForEmail: async (...args) => {
            calls.emails.push(args);
            return { error: sendError };
          },
          updateUser: async (input) => {
            calls.passwords.push(input);
            return { error: null };
          },
        },
      },
    },
    document: { getElementById: (id) => fields[id] },
    sessionStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    URLSearchParams,
    location: { hash: "" },
    setTimeout: () => 1,
    clearTimeout() {},
  };
  vm.runInNewContext(
    fs.readFileSync("frontend/scripts/recuperar.js", "utf8"),
    context,
  );
  return { context, calls, fields, storage };
}

test("recovery sends a normalized email with an explicit return URL and prevents immediate resend", async () => {
  const { context, calls, fields } = setup();
  context.updateRecoveryForm();
  assert.equal(fields["recovery-request"].hidden, false);
  await context.recuperarSenha();
  assert.equal(calls.emails[0][0], "ana@example.com");
  assert.equal(
    calls.emails[0][1].redirectTo,
    "https://portugues.example/recuperar?reset=1",
  );
  assert.match(fields["recovery-message"].textContent, /Se houver uma conta/);
  assert.equal(fields["recovery-button"].disabled, true);
  await context.recuperarSenha();
  assert.equal(calls.emails.length, 1);
});

test("recovery replaces the password only with a session and matching confirmation, then returns to login", async () => {
  const { context, calls, fields, storage } = setup({ recovering: true });
  context.updateRecoveryForm();
  assert.equal(fields["recovery-reset"].hidden, false);
  assert.equal(fields["email-recuperacao"].disabled, true);
  fields["confirmar-senha"].value = "mismatched-password";
  await context.recuperarSenha();
  assert.equal(calls.passwords.length, 0);
  fields["confirmar-senha"].value = fields["nova-senha"].value;
  await context.recuperarSenha();
  assert.equal(calls.passwords[0].password, "a-new-password");
  assert.deepEqual(calls.redirects, ["/?senha=alterada"]);
  assert.equal(storage.has("portugues:recovery"), false);
});

test("visiting recovery without a valid recovery session does not offer password replacement", () => {
  const { context, fields } = setup({ recovering: true, session: false });
  context.updateRecoveryForm();
  assert.equal(fields["recovery-reset"].hidden, true);
  assert.equal(fields["nova-senha"].disabled, true);
});

test("SMTP failure produces a recovery message without claiming a link was sent", async () => {
  const { context, calls, fields } = setup({
    sendError: { status: 500, message: "Error sending recovery email" },
  });
  await context.recuperarSenha();
  assert.equal(calls.emails.length, 1);
  assert.match(
    fields["recovery-message"].textContent,
    /Não foi possível enviar o link/,
  );
  assert.equal(fields["recovery-message"].className, "form-message error");
  assert.equal(fields["recovery-button"].disabled, false);
});

test("provider rate limit blocks rapid recovery requests", async () => {
  const { context, calls, fields } = setup({
    sendError: { status: 429, message: "rate limit exceeded" },
  });
  await context.recuperarSenha();
  assert.match(fields["recovery-message"].textContent, /limite/);
  assert.equal(fields["recovery-button"].disabled, true);
  await context.recuperarSenha();
  assert.equal(calls.emails.length, 1);
});
