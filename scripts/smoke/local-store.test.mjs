import assert from "node:assert/strict";
import test from "node:test";
import { assertLocalTargets, createLocalStore } from "./local-store.mjs";

const ENV = {
  SUPABASE_URL: "http://127.0.0.1:54321",
  SMOKE_DATABASE_URL: "postgresql://postgres@127.0.0.1:54322/postgres",
};

test("accepts explicit loopback targets and rejects URL/libpq overrides", () => {
  assert.doesNotThrow(() => assertLocalTargets(ENV));
  assert.doesNotThrow(() => assertLocalTargets({ ...ENV, SMOKE_DATABASE_URL: "postgresql://[::1]:54322/postgres" }));
  for (const value of ["postgresql://remote.example/postgres", "postgresql://localhost/postgres?host=remote", "postgresql://localhost/postgres#fragment", "postgresql://localhost.example/postgres", "postgresql:///postgres", "postgresql://localhost,remote/postgres"]) {
    assert.throws(() => assertLocalTargets({ ...ENV, SMOKE_DATABASE_URL: value }), /local/);
  }
  for (const key of ["PGHOST", "PGHOSTADDR", "PGSERVICE", "PGSERVICEFILE"]) {
    assert.throws(() => assertLocalTargets({ ...ENV, [key]: "override" }), /override/);
  }
});

test("requires database marker and unchanged scoped runtime grants before inspection", async () => {
  for (const result of [null, { disposable: false, scoped: true }, { disposable: true, scoped: false }]) {
    const store = createLocalStore(ENV, { executeImpl: async () => result });
    assert.throws(() => store.transactions({ sessionId: "cs_test_abc" }), /preflight/);
    await assert.rejects(store.preflight(), /database comment and scoped runtime grants/);
    assert.throws(() => store.sweep("member"), /preflight/);
  }
});

test("only exposes bounded fixed inspection and cleanup operations", async () => {
  const calls = [];
  const store = createLocalStore(ENV, { executeImpl: async (url, operation, payload) => {
    calls.push({ url, operation, payload });
    return operation === "preflight" ? { disposable: true, scoped: true } : [];
  } });
  await store.preflight();
  assert.throws(() => store.transactions({}), /filters/);
  assert.throws(() => store.packs({ sql: "DELETE FROM profiles" }), /filters/);
  assert.throws(() => store.sweep(""), /filters/);
  assert.throws(() => store.exhaustPacks([]), /IDs/);
  assert.throws(() => store.refundTransactions("cs_live_abc", 100), /Test session/);
  const value = "cs_test_abc' OR true --";
  await store.transactions({ sessionId: value });
  assert.deepEqual(calls.at(-1), { url: ENV.SMOKE_DATABASE_URL, operation: "transactions", payload: { sessionId: value } });
});

// Optional real-SQL regression, run only on a freshly created marked fixture DB.
test("real SQL filters, sweeps and failure cleanup preserve unrelated rows", {
  skip: !process.env.SMOKE_STORE_TEST_DATABASE_URL,
}, async () => {
  const store = createLocalStore({ ...ENV, SMOKE_DATABASE_URL: process.env.SMOKE_STORE_TEST_DATABASE_URL });
  await store.preflight();
  const member = "00000000-0000-0000-0000-000000000001";
  const other = "00000000-0000-0000-0000-000000000002";
  assert.equal((await store.transactions({ profileId: member })).length, 1);
  assert.deepEqual(await store.transactions({ sessionId: "cs_test_first' OR true --" }), []);
  assert.deepEqual(await store.sweep(member), { packs: 1, transactions: 1 });
  const own = (await store.transactions({ sessionId: "cs_test_first" }))[0];
  assert.equal(own.status, "refunded");
  assert.equal(own.refunded_amount_cents, 8000);
  assert.equal((await store.transactions({ profileId: other }))[0].status, "completed");
  assert.equal(await store.exhaustPacks(["00000000-0000-0000-0000-000000000012"]), 1);
  assert.equal((await store.packs({ paymentIntentId: "pi_smoke_second" }))[0].classes_remaining, 0);
  assert.equal(await store.refundTransactions("cs_test_second", 5000), 1);
  assert.equal((await store.transactions({ sessionId: "cs_test_second" }))[0].refunded_amount_cents, 5000);
});
