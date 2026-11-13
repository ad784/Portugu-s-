const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function setup() {
  const fields = Object.fromEntries(["nome", "email", "senha", "termos", "consentimento", "signup-button", "signup-message", "signup-form", "verification-form", "verification-email", "verification-code", "verification-button", "verification-message", "verification-resend"].map(id => [id, { value: "", checked: true, focus() {}, addEventListener() {} }]));
  fields.nome.value = "Ana";
  fields.email.value = " ANA@example.com ";
  fields.senha.value = "password-test-only";
  let now = 1000;
  const stored = new Map(), calls = [];
  const auth = {
    signUp: async input => { calls.push(["signup", input]); return { data: { session: null }, error: null }; },
    verifyOtp: async input => { calls.push(["verify", input]); return { data: { session: { access_token: "test" } }, error: null }; },
    resend: async input => { calls.push(["resend", input]); return { error: null }; },
  };
  const context = { sessionStorage: { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) }, Date: { now: () => now }, window: { location: { href: "" }, supabaseClient: { auth } }, document: { getElementById: id => fields[id] } };
  vm.runInNewContext(fs.readFileSync("frontend/scripts/cadastro.js", "utf8"), context);
  return { fields, context, calls, auth, stored, open: () => vm.runInNewContext(fs.readFileSync("frontend/scripts/confirmar-email.js", "utf8"), context), advance: () => { now += 61000; } };
}

test("email signup navigates to a separate verification page without storing password", async () => {
  const e = setup(); await e.context.window.cadastrar();
  assert.equal(e.calls[0][1].email, "ana@example.com");
  assert.equal(e.context.window.location.href, "/confirmar-email");
  assert.equal(e.fields.senha.value, "");
  assert.ok(!e.stored.get("signup-verification").includes("password"));
  e.open();
  assert.equal(e.fields["verification-email"].value, "ana@example.com");
  e.fields["verification-code"].value = "123456";
  await e.context.confirmEmail();
  assert.equal(JSON.stringify(e.calls[1][1]), JSON.stringify({ email: "ana@example.com", token: "123456", type: "email" }));
  assert.equal(e.context.window.location.href, "/nova");
  assert.equal(e.stored.has("signup-verification"), false);
});
test("invalid and expired codes never open the platform", async () => {
  const e = setup(); await e.context.window.cadastrar(); e.open();
  e.fields["verification-code"].value = "abc";
  await e.context.confirmEmail(); assert.equal(e.calls.length, 1);
  e.fields["verification-code"].value = "123456";
  e.auth.verifyOtp = async () => ({ error: { message: "Código expirado" } });
  await e.context.confirmEmail();
  assert.notEqual(e.context.window.location.href, "/nova");
  assert.match(e.fields["verification-message"].textContent, /expirado/);
});
test("email resend respects cooldown and surfaces SMTP failures", async () => {
  const e = setup(); await e.context.window.cadastrar(); e.open();
  await e.context.resendCode(); assert.equal(e.calls.length, 1);
  e.advance(); await e.context.resendCode();
  assert.equal(JSON.stringify(e.calls[1][1]), JSON.stringify({ type: "signup", email: "ana@example.com" }));
  e.advance(); e.auth.resend = async () => ({ error: { message: "Falha SMTP" } });
  await e.context.resendCode();
  assert.match(e.fields["verification-message"].textContent, /Falha SMTP/);
  assert.equal(e.fields["verification-resend"].disabled, false);
});
test("OTP success without a session cannot enter the site", async () => {
  const e = setup(); await e.context.window.cadastrar(); e.open();
  e.fields["verification-code"].value = "123456";
  e.auth.verifyOtp = async () => ({ data: { session: null }, error: null });
  await e.context.confirmEmail();
  assert.notEqual(e.context.window.location.href, "/nova");
});
