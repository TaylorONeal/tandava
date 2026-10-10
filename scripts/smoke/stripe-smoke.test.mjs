import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { assertTestKey, paidSession, run, sessionIdFromUrl, stripeSignature } from "./stripe-smoke.mjs";

const ENV = {
  SUPABASE_URL: "https://proj.supabase.co",
  SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "sb_secret_x",
  STRIPE_TEST_KEY: "rk_test_x",
  STRIPE_WEBHOOK_SECRET: "whsec_test",
  SMOKE_CLASS_PACK_TYPE_ID: "pack-type-1",
};

/** In-memory stand-in for Supabase + Stripe, mirroring fulfill_stripe_checkout / record_stripe_refund. */
function fakeBackend({ dedupe = true, voidOnRefund = true, livemode = false } = {}) {
  const events = new Set();
  const txns = [];
  const packs = [];
  const session = {
    id: "cs_test_abc123", object: "checkout.session", livemode, amount_total: 8000, currency: "usd",
    payment_status: "unpaid", status: "open",
    metadata: { type: "class_pack", class_pack_type_id: "pack-type-1", class_count: "5", profile_id: "u1", studio_id: "s1" },
  };
  const json = (status, body) => new Response(JSON.stringify(body), { status });
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url);
    const p = u.pathname;
    if (p === "/auth/v1/admin/users") return json(422, { msg: "already registered" });
    if (p === "/auth/v1/admin/generate_link") return json(200, { properties: { hashed_token: "h" } });
    if (p === "/auth/v1/verify") return json(200, { access_token: "jwt" });
    if (p === "/functions/v1/stripe-checkout") return json(200, { url: `https://checkout.stripe.com/c/pay/${session.id}#x` });
    if (p === `/v1/checkout/sessions/${session.id}`) return json(200, session);
    if (p === "/functions/v1/stripe-webhook") {
      const sig = init.headers["Stripe-Signature"];
      const t = /t=(\d+)/.exec(sig)[1];
      const expected = createHmac("sha256", ENV.STRIPE_WEBHOOK_SECRET).update(`${t}.${init.body}`).digest("hex");
      if (!sig.includes(`v1=${expected}`)) return json(400, "Invalid signature");
      const ev = JSON.parse(init.body);
      if (dedupe && events.has(ev.id)) return json(200, { received: true });
      events.add(ev.id);
      const o = ev.data.object;
      if (ev.type === "checkout.session.completed") {
        const pack = { id: `pk${packs.length}`, status: "active", classes_remaining: 5, stripe_payment_intent_id: o.payment_intent };
        packs.push(pack);
        txns.push({ id: `t${txns.length}`, status: "completed", class_pack_id: pack.id, amount_cents: o.amount_total,
          stripe_checkout_session_id: o.id });
      } else if (ev.type === "charge.refunded") {
        const pack = packs.find((k) => k.stripe_payment_intent_id === o.payment_intent);
        const txn = txns.find((x) => x.class_pack_id === pack.id);
        txn.status = "refunded";
        if (voidOnRefund) Object.assign(pack, { status: "exhausted", classes_remaining: 0 });
      }
      return json(200, { received: true });
    }
    if (p.startsWith("/rest/v1/")) {
      const table = p.slice("/rest/v1/".length);
      const rows = table === "transactions" ? txns : packs;
      const filters = [...u.searchParams].filter(([k]) => k !== "select");
      return json(200, rows.filter((r) => filters.every(([k, v]) => String(r[k]) === v.replace(/^eq\./, ""))));
    }
    return json(404, { path: p });
  };
  return { fetchImpl, txns, packs };
}

const quiet = { log: () => {} };

test("passes end to end against a correct backend and cleans up its pack", async () => {
  const b = fakeBackend();
  await run(ENV, { ...quiet, fetchImpl: b.fetchImpl });
  assert.equal(b.txns.length, 1);
  assert.equal(b.txns[0].status, "refunded");
  assert.equal(b.packs[0].classes_remaining, 0);
});

test("fails when a redelivered event credits a second pack", async () => {
  const b = fakeBackend({ dedupe: false });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /Expected 1 transaction|double-credited/);
});

test("fails when a refund leaves the credits usable", async () => {
  const b = fakeBackend({ voidOnRefund: false });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /Pack not voided/);
});

test("fails when the webhook rejects the signature", async () => {
  const b = fakeBackend();
  await assert.rejects(run({ ...ENV, STRIPE_WEBHOOK_SECRET: "whsec_other" }, { ...quiet, fetchImpl: b.fetchImpl }),
    /stripe-webhook checkout.session.completed: 400/);
});

test("refuses live keys and live sessions", async () => {
  assert.throws(() => assertTestKey("sk_live_x"), /test key/);
  assert.throws(() => assertTestKey("rk_live_x"), /test key/);
  assert.throws(() => paidSession({ id: "cs_live_1", livemode: true }, "pi"), /not test mode/);
  await assert.rejects(run({ ...ENV, STRIPE_TEST_KEY: "sk_live_x" }, quiet), /test key/);
  const b = fakeBackend({ livemode: true });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /not test mode|test session/);
});

test("only accepts a Stripe test session URL from checkout", () => {
  assert.equal(sessionIdFromUrl("https://checkout.stripe.com/c/pay/cs_test_a1B2#frag"), "cs_test_a1B2");
  assert.throws(() => sessionIdFromUrl("https://checkout.stripe.com/c/pay/cs_live_a1"), /test session/);
});

test("signature has Stripe's t=...,v1=... shape", () => {
  assert.match(stripeSignature("{}", "whsec_x", 1700000000), /^t=1700000000,v1=[0-9a-f]{64}$/);
});
