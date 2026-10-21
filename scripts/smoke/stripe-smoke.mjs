#!/usr/bin/env node
/**
 * Stripe payment smoke test (LP-1 automation). Runs against a disposable local
 * Supabase project while Stripe is in TEST mode. Synthetic signed events verify
 * application fulfillment, not card acceptance, provider delivery or Checkout UI.
 *
 * What it proves, in order:
 *   1. A signed-in member can start Checkout for a class pack (stripe-checkout
 *      edge function returns a Stripe test-mode session).
 *   2. Our webhook fulfils that exact session: a signed checkout.session.completed
 *      event (the session Stripe created, marked paid) credits one active pack
 *      and one completed transaction.
 *   3. Redelivery is idempotent: the same event again changes nothing.
 *   4. A full refund (charge.refunded) marks the transaction refunded and voids
 *      the pack. This is also the cleanup, so runs do not leave usable credits.
 *
 * Safety rails (it refuses to run otherwise):
 *   - the Stripe key must be a test key (sk_test_ / rk_test_);
 *   - the session Stripe returns must be livemode=false;
 *   - both Supabase and the inspection database must use loopback targets;
 *   - the database must carry the explicit disposable marker and scoped grants.
 *     No runtime table permissions are widened for this test.
 *
 * Env (all required unless noted):
 *   SUPABASE_URL, SUPABASE_ANON_KEY            local project URL and anon/publishable key
 *   SUPABASE_SERVICE_ROLE_KEY                  creates the local smoke member only
 *   SMOKE_DATABASE_URL                       local database owner connection (psql)
 *   STRIPE_TEST_KEY                            sk_test_ or rk_test_ (Checkout Sessions: read)
 *   STRIPE_WEBHOOK_SECRET                      whsec_ of the TEST webhook endpoint
 *   SMOKE_CLASS_PACK_TYPE_ID                   pack to buy at the test studio
 *   SMOKE_EMAIL (optional)                     smoke member, default below
 */
import { createHmac, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { assertLocalTargets, createLocalStore } from "./local-store.mjs";

export const DEFAULT_EMAIL = "stripe-smoke@purafieldstudio.com";

/** Stripe-Signature header for a payload, exactly as Stripe computes it. */
export function stripeSignature(payload, secret, timestamp = Math.floor(Date.now() / 1000)) {
  const v1 = createHmac("sha256", secret).update(`${timestamp}.${payload}`, "utf8").digest("hex");
  return `t=${timestamp},v1=${v1}`;
}

export function assertTestKey(key) {
  if (!/^(sk|rk)_test_/.test(key ?? "")) {
    throw new Error("STRIPE_TEST_KEY must be a Stripe test key (sk_test_ or rk_test_); refusing to run.");
  }
}

/** The completed-and-paid version of the session Stripe created. */
export function paidSession(session, paymentIntentId) {
  if (session.livemode !== false) throw new Error(`Session ${session.id} is not test mode; refusing to run.`);
  return { ...session, status: "complete", payment_status: "paid", payment_intent: paymentIntentId };
}

export function stripeEvent(type, object, id = `evt_smoke_${randomUUID().replace(/-/g, "")}`) {
  return {
    id,
    object: "event",
    api_version: "2024-06-20",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    type,
    data: { object },
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
  };
}

export function sessionIdFromUrl(url) {
  const m = /\/(cs_test_[A-Za-z0-9]+)/.exec(url ?? "");
  if (!m) throw new Error(`Checkout did not return a Stripe test session URL: ${url}`);
  return m[1];
}

function need(env, name) {
  const v = env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

/** Each request gives up after this long, so cleanup always has time to run before the job limit. */
export const REQUEST_TIMEOUT_MS = 20_000;

async function call(fetchImpl, url, init, label) {
  const res = await fetchImpl(url, { ...init, redirect: "error", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, body, label };
}

function expect(cond, message) {
  if (!cond) throw new Error(message);
}

export async function run(env = process.env, {
  fetchImpl = fetch, log = console.log, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), now = Date.now, store,
} = {}) {
  assertLocalTargets(env); // Must precede auth, Stripe and database access.
  const supabaseUrl = need(env, "SUPABASE_URL").replace(/\/$/, "");
  const anonKey = need(env, "SUPABASE_ANON_KEY");
  const serviceKey = need(env, "SUPABASE_SERVICE_ROLE_KEY");
  const stripeKey = need(env, "STRIPE_TEST_KEY");
  const webhookSecret = need(env, "STRIPE_WEBHOOK_SECRET");
  const packTypeId = need(env, "SMOKE_CLASS_PACK_TYPE_ID");
  const email = env.SMOKE_EMAIL || DEFAULT_EMAIL;
  assertTestKey(stripeKey);
  store ??= createLocalStore(env);
  await store.preflight();

  // New-style secret keys go in apikey only; legacy JWT keys also as Bearer.
  const admin = {
    apikey: serviceKey,
    ...(serviceKey.startsWith("eyJ") ? { Authorization: `Bearer ${serviceKey}` } : {}),
    "Content-Type": "application/json",
  };
  const rest = (path) => call(fetchImpl, `${supabaseUrl}/rest/v1/${path}`, { headers: admin }, path);

  // 1. Smoke member exists (422 = already there), then a session without a password or captcha.
  const created = await call(fetchImpl, `${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST", headers: admin, body: JSON.stringify({ email, email_confirm: true }),
  }, "create user");
  expect([200, 201, 422].includes(created.status), `Create smoke member: ${created.status}`);
  const link = await call(fetchImpl, `${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: "POST", headers: admin, body: JSON.stringify({ type: "magiclink", email }),
  }, "generate link");
  const tokenHash = link.body?.hashed_token ?? link.body?.properties?.hashed_token;
  expect(link.status === 200 && tokenHash, `Generate sign-in link: ${link.status}`);
  const verified = await call(fetchImpl, `${supabaseUrl}/auth/v1/verify`, {
    method: "POST", headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", token_hash: tokenHash }),
  }, "verify");
  const accessToken = verified.body?.access_token;
  const userId = verified.body?.user?.id;
  expect(verified.status === 200 && accessToken && userId, `Sign in smoke member: ${verified.status}`);
  log("1/4 signed in as the smoke member");

  // The smoke member is dedicated to this job, so anything it still holds is
  // left over from an earlier run (for example a webhook that committed after
  // that run's cleanup gave up). Neutralise it before and after every run.
  const sweep = async (when) => {
    const result = await store.sweep(userId);
    if (result.packs || result.transactions) log(`sweep (${when}): neutralised ${result.packs} pack(s), ${result.transactions} transaction(s)`);
  };
  await sweep("start");

  // 2. Start Checkout exactly as the storefront does. stripe-checkout reuses a
  // session for the same buyer and item within a minute, so if this one was
  // already fulfilled by an earlier run, wait for the next minute and ask again.
  const startCheckout = async () => {
    const res = await call(fetchImpl, `${supabaseUrl}/functions/v1/stripe-checkout`, {
      method: "POST",
      headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "class_pack", classPackTypeId: packTypeId }),
    }, "checkout");
    expect(res.status === 200, `stripe-checkout: ${res.status} ${JSON.stringify(res.body)}`);
    return sessionIdFromUrl(res.body?.url);
  };
  const alreadyUsed = async (id) =>
    (await store.transactions({ sessionId: id })).length > 0;
  let sessionId = await startCheckout();
  if (await alreadyUsed(sessionId)) {
    await sleep(60_000 - (now() % 60_000) + 2_000);
    sessionId = await startCheckout();
    expect(!(await alreadyUsed(sessionId)), `Checkout keeps returning used session ${sessionId}`);
  }
  const stripeRes = await call(fetchImpl, `https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  }, "retrieve session");
  expect(stripeRes.status === 200, `Retrieve ${sessionId}: ${stripeRes.status} ${JSON.stringify(stripeRes.body)}`);
  const session = stripeRes.body;
  expect(session.metadata?.type === "class_pack" && session.metadata?.class_pack_type_id === packTypeId,
    `Session metadata is not this pack: ${JSON.stringify(session.metadata)}`);
  // The terms Checkout sold must be the catalog's, not just self-consistent.
  const catalog = (await rest(`class_pack_types?id=eq.${packTypeId}&select=price_cents,class_count,validity_days,studio_id`)).body?.[0];
  expect(catalog, `Pack type ${packTypeId} not found`);
  expect(session.amount_total === catalog.price_cents
      && Number(session.metadata?.class_count) === catalog.class_count
      && Number(session.metadata?.validity_days) === (catalog.validity_days ?? 90),
    `Checkout terms differ from the catalog: ${JSON.stringify({ amount: session.amount_total, meta: session.metadata, catalog })}`);
  expect(session.metadata?.studio_id === catalog.studio_id,
    `Session is for studio ${session.metadata?.studio_id}, pack belongs to ${catalog.studio_id}`);
  expect(session.metadata?.profile_id === userId,
    `Session is for ${session.metadata?.profile_id}, not the signed-in member ${userId}`);
  log(`2/4 checkout created ${sessionId} (${session.amount_total} ${session.currency})`);

  // 3. Deliver the signed completion, twice.
  const pi = `pi_smoke_${randomUUID().replace(/-/g, "")}`;
  const deliver = async (event) => {
    const payload = JSON.stringify(event);
    const res = await call(fetchImpl, `${supabaseUrl}/functions/v1/stripe-webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Stripe-Signature": stripeSignature(payload, webhookSecret) },
      body: payload,
    }, event.type);
    expect(res.status === 200, `stripe-webhook ${event.type}: ${res.status} ${JSON.stringify(res.body)}`);
  };
  const completed = stripeEvent("checkout.session.completed", paidSession(session, pi));
  const refundEvent = () => stripeEvent("charge.refunded", {
    id: `ch_smoke_${randomUUID().replace(/-/g, "")}`, object: "charge", livemode: false,
    payment_intent: pi, amount: session.amount_total, amount_refunded: session.amount_total,
  });
  // From the first delivery on, a failure must not leave a usable pack behind:
  // even a non-200 completion may have committed, so always try the refund.
  let refundSent = false;
  let voidedVerified = false;
  try {
    await deliver(completed);
    const txns = await store.transactions({ sessionId });
    expect(txns.length === 1, `Expected 1 transaction, got ${JSON.stringify(txns)}`);
    const txn = txns[0];
    expect(txn.status === "completed" && txn.class_pack_id, `Transaction not completed with a pack: ${JSON.stringify(txn)}`);
    expect(String(txn.currency).toLowerCase() === String(session.currency).toLowerCase(),
      `Transaction currency ${txn.currency}, session ${session.currency}`);
    expect(txn.amount_cents === session.amount_total, `Charged ${txn.amount_cents}, session says ${session.amount_total}`);
    expect(txn.profile_id === userId, `Transaction belongs to ${txn.profile_id}, not ${userId}`);
    expect(txn.studio_id === catalog.studio_id, `Transaction is at studio ${txn.studio_id}, not ${catalog.studio_id}`);
    const pack = await store.packs({ id: txn.class_pack_id });
    const p = pack[0];
    expect(p?.status === "active" && p.classes_remaining === catalog.class_count && p.classes_total === catalog.class_count
        && p.profile_id === userId
        && p.class_pack_type_id === packTypeId && p.studio_id === catalog.studio_id,
      `Pack not credited to the member: ${JSON.stringify(pack)}`);
    // Usable: expires validity_days from now (allow a day either side).
    const days = (Date.parse(p.expires_at) - Date.now()) / 86_400_000;
    expect(Math.abs(days - Number(session.metadata.validity_days)) <= 1,
      `Pack expires in ${days.toFixed(1)} days, sold as ${session.metadata.validity_days}`);
    // Redelivery must change nothing: same rows, same values.
    const snapshot = async () => ({
      txns: await store.transactions({ sessionId }),
      packs: await store.packs({ paymentIntentId: pi }),
    });
    const before = await snapshot();
    await deliver(completed);
    const after = await snapshot();
    expect(after.txns?.length === 1 && after.packs?.length === 1,
      `Redelivery double-credited: ${after.txns?.length} transactions, ${after.packs?.length} packs`);
    expect(JSON.stringify(after) === JSON.stringify(before),
      `Redelivery changed existing rows: ${JSON.stringify({ before, after })}`);
    log(`3/4 webhook credited ${pack[0].classes_remaining} classes once (redelivery ignored)`);

    // 4. Full refund voids the pack (and cleans up this run).
    await deliver(refundEvent());
    refundSent = true; // only once delivered; otherwise the finally block retries
    const refunded = await store.transactions({ id: txn.id });
    const voided = await store.packs({ id: txn.class_pack_id });
    expect(refunded[0]?.status === "refunded" && refunded[0].refunded_amount_cents === session.amount_total, `Refund not recorded: ${JSON.stringify(refunded)}`);
    expect(voided[0]?.status === "exhausted" && voided[0].classes_remaining === 0,
      `Pack not voided: ${JSON.stringify(voided)}`);
    voidedVerified = true;
    log("4/4 refund recorded and pack voided");
    return { sessionId, transactionId: txn.id };
  } finally {
    if (!voidedVerified) {
      if (!refundSent) {
        try { await deliver(refundEvent()); log("cleanup: refunded the smoke purchase after a failure"); }
        catch (err) { log(`cleanup refund failed: ${err.message}`); }
      }
      // Whatever the webhook did, no usable smoke pack may survive the run. Find
      // packs by the transaction's class_pack_id and by payment intent, so a
      // regression in either field cannot hide one.
      try {
        // A timed-out completion may still be committing server-side: give it
        // up to a minute to land so cleanup does not run before it.
        let viaTxn = [];
        for (let i = 0; i < 7; i++) {
          viaTxn = await store.transactions({ sessionId });
          if (viaTxn.length || refundSent) break;
          if (i < 6) await sleep(10_000);
        }
        const viaPi = await store.packs({ paymentIntentId: pi });
        const ids = [...new Set([...viaTxn.map((r) => r.class_pack_id), ...viaPi.map((r) => r.id)].filter(Boolean))];
        if (ids.length) {
          // Every smoke pack ends exhausted with no credits, whatever state it was left in.
          const packsFixed = await store.exhaustPacks(ids);
          log(`cleanup: set ${packsFixed} smoke pack(s) to exhausted`);
        }
        // No money moved, so the synthetic purchase must not count as revenue either.
        const txnsFixed = await store.refundTransactions(sessionId, session.amount_total);
        if (txnsFixed) log(`cleanup: marked ${txnsFixed} smoke transaction(s) fully refunded`);
      } catch (err) { log(`cleanup failed, void the packs for session ${sessionId} by hand: ${err.message}`); }
    }
    // After every run, pass or fail: catches anything an earlier run's late webhook created meanwhile.
    await sweep("end"); // Cleanup failure must not produce a passing smoke result.
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  run().then(
    (r) => console.log(`PASS stripe smoke ${r.sessionId}`),
    (err) => { console.error(`FAIL stripe smoke: ${err.message}`); process.exit(1); },
  );
}
