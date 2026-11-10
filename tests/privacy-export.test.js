const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { createProfileRouter } = require("../backend/routes/profile");

test("privacy export scopes every table to the account and exports multiple pages of legal events", async (t) => {
  const queries = [];
  const app = express();
  app.use(
    "/api/perfil",
    createProfileRouter({
      requireSupabaseUser: (req, res, next) => {
        if (!req.get("authorization")) return res.sendStatus(401);
        req.supabaseUser = { id: "owner-a", email: "a@example.com" };
        req.supabase = {
          from: (table) => {
            const query = { table };
            queries.push(query);
            const chain = {
              select: () => chain,
              eq: (key, value) => {
                assert.equal(key, table === "profiles" ? "id" : "user_id");
                assert.equal(value, "owner-a");
                query.scoped = true;
                return chain;
              },
              order: () => chain,
              maybeSingle: async () => ({
                data:
                  table === "profiles"
                    ? { nome: "Owner A" }
                    : { terms_version: "2026-10-30" },
                error: null,
              }),
              range: async (start, end) => {
                query.start = start;
                assert.equal(end - start, 199);
                const count =
                  table === "legal_events" ? (start === 0 ? 200 : 1) : 1;
                return {
                  data: Array.from({ length: count }, (_, index) => ({
                    id: `${table}-${start + index}`,
                    owner: "owner-a",
                  })),
                  error: null,
                };
              },
            };
            return chain;
          },
        };
        next();
      },
    }),
  );
  const server = app.listen(0);
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once("listening", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/perfil/exportar`;
  assert.equal((await fetch(url)).status, 401);
  const response = await fetch(url, {
    headers: { Authorization: "Bearer test" },
  });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(body.eventosDePrivacidade.length, 201);
  assert.equal(body.redacoes.length, 1);
  assert.ok(queries.every((query) => query.scoped));
  assert.equal(body.perfil.email, "a@example.com");
});
