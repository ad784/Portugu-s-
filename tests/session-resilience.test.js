const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function environment({ storageFails = false, unauthorized = false } = {}) {
  let current = {
    user: { id: "account-a" },
    access_token: "valid-test",
    expires_at: Date.now() / 1000 + 3600,
  };
  let authChanged;
  const values = new Map();
  const redirects = [];
  let warnings = 0;
  const context = {
    window: {
      location: {
        replace: (value) => redirects.push(value),
        assign: (value) => redirects.push(value),
      },
      dispatchEvent: () => warnings++,
    },
    location: { pathname: "/nova", replace() {} },
    localStorage: {
      getItem(key) {
        if (storageFails) throw Error("Storage blocked");
        return values.get(key) || null;
      },
      setItem(key, value) {
        if (storageFails) throw Error("Quota exceeded");
        values.set(key, value);
      },
      removeItem(key) {
        values.delete(key);
      },
    },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    navigator: { onLine: true },
    Event: class {},
    AbortSignal,
    Date,
    crypto: { randomUUID: () => "local-test-id" },
    fetch: async () => ({ status: unauthorized ? 401 : 200 }),
  };
  const client = {
    auth: {
      getSession: async () => ({ data: { session: current }, error: null }),
      refreshSession: async () => ({ data: { session: current }, error: null }),
      signOut: async () => {
        current = null;
      },
      onAuthStateChange: (callback) => {
        authChanged = callback;
      },
    },
  };
  const source = fs
    .readFileSync("frontend/scripts/session.js", "utf8")
    .replace(
      /^import writingRules.*$/m,
      "const writingRules = {charactersPerLine: 55};",
    )
    .replace(/export /g, "");
  vm.runInNewContext(source, context);
  return {
    context,
    client,
    values,
    redirects,
    warnings: () => warnings,
    switchUser: (id) => {
      current = { ...current, user: { id } };
      authChanged("SIGNED_IN", current);
    },
  };
}

test("storage failure preserves the completed result in memory and warns without mixing accounts", async () => {
  const env = environment({ storageFails: true });
  await env.context.initializeSession(env.client);
  const storage = env.context.window.userStorage;
  storage.setItem("resultado", "A completed correction");
  assert.equal(storage.getItem("resultado"), "A completed correction");
  assert.ok(env.warnings() > 0);
  env.switchUser("account-b");
  assert.equal(storage.getItem("resultado"), null);
  env.switchUser("account-a");
  assert.equal(storage.getItem("resultado"), "A completed correction");
});

test("expired session redirects to login while preserving drafts under the original account", async () => {
  const env = environment({ unauthorized: true });
  await env.context.initializeSession(env.client);
  env.context.window.userStorage.setItem(
    "rascunho-redacao-v1",
    "original essay",
  );
  env.context.window.userStorage.setItem("rascunho-foto-v1", "original photo");
  await assert.rejects(
    env.context.window.portuguesSession.request("/api/corrigir"),
    /expirou/,
  );
  assert.equal(
    env.values.get("portugues:account-a:rascunho-redacao-v1"),
    "original essay",
  );
  assert.equal(
    env.values.get("portugues:account-a:rascunho-foto-v1"),
    "original photo",
  );
  assert.equal(env.redirects.at(-1), "/?sessao=expirada");
});

test("offline requests do not call the server and preserve the draft", async () => {
  const env = environment();
  await env.context.initializeSession(env.client);
  env.context.window.userStorage.setItem("rascunho-redacao-v1", "my essay");
  env.context.navigator.onLine = false;
  let calls = 0;
  env.context.fetch = async () => {
    calls++;
  };
  await assert.rejects(
    env.context.window.portuguesSession.request("/api/corrigir"),
    /sem conexão/,
  );
  assert.equal(calls, 0);
  assert.equal(
    env.context.window.userStorage.getItem("rascunho-redacao-v1"),
    "my essay",
  );
});

test("storage-blocked expiration keeps the page open so in-memory work can be copied", async () => {
  const env = environment({ storageFails: true, unauthorized: true });
  await env.context.initializeSession(env.client);
  env.context.window.userStorage.setItem("rascunho-redacao-v1", "only copy");
  await assert.rejects(
    env.context.window.portuguesSession.request("/api/corrigir"),
    /expirou/,
  );
  assert.equal(env.redirects.length, 0);
  env.switchUser("account-a");
  assert.equal(
    env.context.window.userStorage.getItem("rascunho-redacao-v1"),
    "only copy",
  );
});

test("completed correction stays visible without page navigation when storage is blocked", async () => {
  const env = environment({ storageFails: true });
  await env.context.initializeSession(env.client);
  env.context.window.userStorage.setItem("resultado", "completed");
  const nodes = [];
  const main = { append: (node) => nodes.push(node) };
  env.context.document = {
    getElementById: () => null,
    querySelector: () => main,
    createElement: (tag) => ({
      tag,
      setAttribute() {},
      addEventListener() {},
      focus() {},
      scrollIntoView() {},
      replaceChildren(...children) {
        this.children = children;
      },
    }),
  };
  const result = "Nota: 600\nRedacao:\n<script>untrusted essay</script>";
  assert.equal(env.context.window.portuguesSession.presentResult(result), true);
  assert.equal(nodes[0].children[2].tag, "pre");
  assert.equal(nodes[0].children[2].textContent, result);
  assert.equal(env.redirects.length, 0);
});

test("401 renewal never resends the original operation using another account", async () => {
  const env = environment({ unauthorized: true });
  await env.context.initializeSession(env.client);
  let calls = 0;
  env.context.fetch = async () => {
    calls++;
    return { status: 401 };
  };
  env.client.auth.refreshSession = async () => {
    env.switchUser("account-b");
    return {
      data: { session: { user: { id: "account-b" }, access_token: "token-b" } },
      error: null,
    };
  };
  await assert.rejects(
    env.context.window.portuguesSession.request("/api/corrigir", {
      method: "POST",
    }),
    /conta mudou/,
  );
  assert.equal(calls, 1);
});

test("a delayed response body cannot be saved under a newly signed-in account", async () => {
  const env = environment();
  await env.context.initializeSession(env.client);
  let finish;
  env.context.fetch = async () => ({
    status: 200,
    json: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  const response =
    await env.context.window.portuguesSession.request("/api/redacoes");
  const reading = response.json();
  env.switchUser("account-b");
  finish({ privateResult: "account-a" });
  await assert.rejects(reading, /conta mudou/);
});

test("more than thirty unsynced evaluations are retained instead of silently discarded", async () => {
  const env = environment();
  await env.context.initializeSession(env.client);
  for (let index = 0; index < 35; index++)
    env.context.window.portuguesSession.savePending({
      id: String(index),
      hash: String(index),
      resultado: "result-" + index,
    });
  const pending = env.context.window.portuguesSession.pending();
  assert.equal(pending.length, 35);
  assert.equal(pending.at(-1).resultado, "result-0");
});
