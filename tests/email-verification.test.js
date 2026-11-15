const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

test("signup opens the email instructions page and preserves email delivery options", async () => {
  const fields = Object.fromEntries(
    [
      "nome",
      "email",
      "senha",
      "termos",
      "consentimento",
      "signup-button",
      "signup-message",
    ].map((id) => [id, {}]),
  );
  Object.assign(fields.nome, { value: "Ana" });
  fields.email.value = "ana@example.com";
  fields.senha.value = "test-password";
  fields.termos.checked = fields.consentimento.checked = true;
  let request;
  const context = {
    document: { getElementById: (id) => fields[id] },
    window: {
      location: { origin: "http://localhost:3000" },
      supabaseClient: {
        auth: {
          signUp: async (input) => {
            request = input;
            return { data: { user: { identities: [{}] } } };
          },
        },
      },
    },
  };
  vm.runInNewContext(
    fs.readFileSync("frontend/frontend-src/scripts/cadastro.js", "utf8"),
    context,
  );
  await context.window.cadastrar();
  assert.equal(context.window.location.href, "/confirmar-email");
  assert.equal(
    request.options.emailRedirectTo,
    "http://localhost:3000/nova.html",
  );
  assert.equal(request.password, "test-password");
  assert.equal(fields.senha.value, "");
});
