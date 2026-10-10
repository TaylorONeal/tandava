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
function fakeBackend({ dedupe = true, voidOnRefund = true, livemode = false, reapply = false, statusOnRefund = true, failRefundOnce = false, failAfterFulfil = false, reuseSession = false, packOwner = "u1", expiresDays = 90, catalogPrice = 8000, packType = "pack-type-1", packStudio = "s1", piOnPack = true, packTotal = 5, refundAmount = true } = {}) {
  let refundFailed = false;
  let reused = false;
  const events = new Set();
  const txns = [];
  const packs = [];
  const session = {
    id: "cs_test_abc123", object: "checkout.session", livemode, amount_total: 8000, currency: "usd",
    payment_status: "unpaid", status: "open",
    metadata: { type: "class_pack", class_pack_type_id: "pack-type-1", class_count: "5", validity_days: "90", profile_id: "u1", studio_id: "s1" },
  };
  const json = (status, body) => new Response(JSON.stringify(body), { status });
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url);
    const p = u.pathname;
    if (p === "/auth/v1/admin/users") return json(422, { msg: "already registered" });
    if (p === "/auth/v1/admin/generate_link") return json(200, { properties: { hashed_token: "h" } });
    if (p === "/auth/v1/verify") return json(200, { access_token: "jwt", user: { id: "u1" } });
    if (p === "/functions/v1/stripe-checkout") {
      if (reuseSession && !reused) {
        reused = true;
        txns.push({ id: "old", status: "refunded", class_pack_id: "old-pack", amount_cents: 8000, stripe_checkout_session_id: "cs_test_old" });
        return json(200, { url: "https://checkout.stripe.com/c/pay/cs_test_old#x" });
      }
      return json(200, { url: `https://checkout.stripe.com/c/pay/${session.id}#x` });
    }
    if (p === `/v1/checkout/sessions/${session.id}`) return json(200, session);
    if (p === "/functions/v1/stripe-webhook") {
      const sig = init.headers["Stripe-Signature"];
      const t = /t=(\d+)/.exec(sig)[1];
      const expected = createHmac("sha256", ENV.STRIPE_WEBHOOK_SECRET).update(`${t}.${init.body}`).digest("hex");
      if (!sig.includes(`v1=${expected}`)) return json(400, "Invalid signature");
      const ev = JSON.parse(init.body);
      if (dedupe && events.has(ev.id)) {
        if (reapply) packs.forEach((k) => { k.classes_remaining += 5; });
        return json(200, { received: true });
      }
      events.add(ev.id);
      const o = ev.data.object;
      if (ev.type === "checkout.session.completed") {
        const pack = { id: `pk${packs.length}`, status: "active", classes_remaining: 5, classes_total: packTotal, stripe_payment_intent_id: piOnPack ? o.payment_intent : null,
          studio_id: packStudio, profile_id: packOwner, class_pack_type_id: packType, expires_at: new Date(Date.now() + expiresDays * 86_400_000).toISOString() };
        packs.push(pack);
        txns.push({ id: `t${txns.length}`, status: "completed", class_pack_id: pack.id, amount_cents: o.amount_total, profile_id: packOwner, studio_id: "s1",
          stripe_checkout_session_id: o.id });
        if (failAfterFulfil) return json(500, "Handler error");
      } else if (ev.type === "charge.refunded") {
        if (failRefundOnce && !refundFailed) { refundFailed = true; return json(500, "Handler error"); }
        const pack = packs.find((k) => k.stripe_payment_intent_id === o.payment_intent);
        if (!pack) return json(500, "refund for unknown payment intent");
        const txn = txns.find((x) => x.class_pack_id === pack.id);
        txn.status = "refunded";
        if (refundAmount) txn.refunded_amount_cents = o.amount_refunded;
        if (voidOnRefund) pack.classes_remaining = 0;
        if (statusOnRefund) pack.status = "exhausted";
      }
      return json(200, { received: true });
    }
    if (p.startsWith("/rest/v1/") && init.method === "PATCH") {
      const body = JSON.parse(init.body);
      if (p.endsWith("/transactions")) {
        const sid = u.searchParams.get("stripe_checkout_session_id").replace(/^eq\./, "");
        const hit = txns.filter((x) => x.stripe_checkout_session_id === sid);
        hit.forEach((x) => Object.assign(x, body));
        return json(200, hit);
      }
      const ids = /^in\.\((.*)\)$/.exec(u.searchParams.get("id"))[1].split(",");
      const onlyWithCredits = u.searchParams.get("classes_remaining") === "gt.0";
      const hit = packs.filter((k) => ids.includes(k.id) && (!onlyWithCredits || k.classes_remaining > 0));
      hit.forEach((k) => Object.assign(k, body));
      return json(200, hit);
    }
    if (p.startsWith("/rest/v1/")) {
      const table = p.slice("/rest/v1/".length);
      if (table === "class_pack_types") return json(200, [{ price_cents: catalogPrice, class_count: 5, validity_days: 90, studio_id: "s1" }]);
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

test("fails when a redelivered event changes the existing pack", async () => {
  const b = fakeBackend({ reapply: true });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /Redelivery changed existing rows/);
});

test("fails when a refund leaves the credits usable", async () => {
  const b = fakeBackend({ voidOnRefund: false });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /Pack not voided/);
});

test("fails when a refund zeroes credits but leaves the pack active", async () => {
  const b = fakeBackend({ statusOnRefund: false });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /Pack not voided/);
});

test("still refunds the purchase when a check after fulfilment fails", async () => {
  const b = fakeBackend({ reapply: true });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /Redelivery changed/);
  assert.equal(b.txns[0].status, "refunded");
  assert.equal(b.packs[0].status, "exhausted");
});

test("retries the refund in cleanup when its first delivery fails", async () => {
  const b = fakeBackend({ failRefundOnce: true });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /charge.refunded: 500/);
  assert.equal(b.packs[0].status, "exhausted");
});

test("refunds even when the completion commits but answers 500", async () => {
  const b = fakeBackend({ failAfterFulfil: true });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /checkout.session.completed: 500/);
  assert.equal(b.packs[0].status, "exhausted");
});

test("waits for a fresh checkout when the reused session was already fulfilled", async () => {
  const b = fakeBackend({ reuseSession: true });
  const waits = [];
  await run(ENV, { ...quiet, fetchImpl: b.fetchImpl, sleep: async (ms) => { waits.push(ms); }, now: () => 30_000 });
  assert.deepEqual(waits, [32_000]);
  const fresh = b.txns.find((x) => x.stripe_checkout_session_id === "cs_test_abc123");
  assert.equal(fresh.status, "refunded");
});

test("fails when the purchase is credited to someone else", async () => {
  const b = fakeBackend({ packOwner: "someone-else" });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /belongs to someone-else/);
  assert.equal(b.packs[0].status, "exhausted");
});

test("fails when the pack is created already expired", async () => {
  const b = fakeBackend({ expiresDays: -1 });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /Pack expires in -1\.0 days, sold as 90/);
});

test("fails when the pack is credited to someone else", async () => {
  const b = fakeBackend();
  b.packs.push = function (k) { return Array.prototype.push.call(this, { ...k, profile_id: "other" }); };
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /Pack not credited to the member/);
});

test("fails when checkout charges a price other than the catalog's", async () => {
  const b = fakeBackend({ catalogPrice: 9000 });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /Checkout terms differ from the catalog/);
});

test("fails when the pack is of a different catalog type", async () => {
  const b = fakeBackend({ packType: "other-type" });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /Pack not credited to the member/);
});

test("voids the pack directly when the refund answers 200 but leaves credits", async () => {
  const b = fakeBackend({ voidOnRefund: false, statusOnRefund: false });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /Pack not voided/);
  assert.equal(b.packs[0].classes_remaining, 0);
  assert.equal(b.packs[0].status, "exhausted");
});

test("fails when the pack is filed under another studio", async () => {
  const b = fakeBackend({ packStudio: "s2" });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /Pack not credited to the member/);
  assert.equal(b.packs[0].classes_remaining, 0);
});

test("cleans up by pack id when the pack lost its payment intent", async () => {
  const b = fakeBackend({ piOnPack: false });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }));
  assert.equal(b.packs[0].classes_remaining, 0);
  assert.equal(b.packs[0].status, "exhausted");
});

test("fails when the pack records the wrong total", async () => {
  const b = fakeBackend({ packTotal: 4 });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /Pack not credited to the member/);
});

test("fails when a refund leaves refunded_amount_cents unset", async () => {
  const b = fakeBackend({ refundAmount: false });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /Refund not recorded/);
});

test("cleanup exhausts a zero-credit pack left active", async () => {
  const b = fakeBackend({ statusOnRefund: false });
  await assert.rejects(run(ENV, { ...quiet, fetchImpl: b.fetchImpl }), /Pack not voided/);
  assert.equal(b.packs[0].status, "exhausted");
});

test("cleanup marks the smoke transaction refunded when refunds keep failing", async () => {
  const b = fakeBackend({ failAfterFulfil: true });
  const realFetch = b.fetchImpl;
  const fetchImpl = async (url, init = {}) => {
    if (String(url).endsWith("/functions/v1/stripe-webhook") && init.body.includes("charge.refunded")) {
      return new Response("Handler error", { status: 500 });
    }
    return realFetch(url, init);
  };
  await assert.rejects(run(ENV, { ...quiet, fetchImpl }));
  assert.equal(b.txns[0].status, "refunded");
  assert.equal(b.txns[0].refunded_amount_cents, 8000);
  assert.equal(b.packs[0].status, "exhausted");
});

test("every request carries a timeout signal", async () => {
  const b = fakeBackend();
  const signals = [];
  await run(ENV, { ...quiet, fetchImpl: (url, init = {}) => { signals.push(init.signal); return b.fetchImpl(url, init); } });
  assert.ok(signals.length > 5);
  assert.ok(signals.every((sig) => sig instanceof AbortSignal));
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
