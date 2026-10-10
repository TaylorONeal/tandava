#!/usr/bin/env node
/**
 * Stripe payment smoke test (LP-1 automation). Runs against the live hosted
 * project while Stripe is in TEST mode. No browser and no card form: Stripe's
 * hosted Checkout page is the one piece it skips (Stripe tests that page itself).
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
 *   - once prod switches to live Stripe, the webhook will hold the live signing
 *     secret, so this job's test secret stops verifying and the run fails loudly
 *     instead of forging a payment. Point it at a staging project then.
 *
 * Env (all required unless noted):
 *   SUPABASE_URL, SUPABASE_ANON_KEY            public project URL and anon/publishable key
 *   SUPABASE_SERVICE_ROLE_KEY                  creates the smoke member, reads results
 *   STRIPE_TEST_KEY                            sk_test_ or rk_test_ (Checkout Sessions: read)
 *   STRIPE_WEBHOOK_SECRET                      whsec_ of the TEST webhook endpoint
 *   SMOKE_CLASS_PACK_TYPE_ID                   pack to buy at the test studio
 *   SMOKE_EMAIL (optional)                     smoke member, default below
 */
import { createHmac, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

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

async function call(fetchImpl, url, init, label) {
  const res = await fetchImpl(url, init);
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, body, label };
}

function expect(cond, message) {
  if (!cond) throw new Error(message);
}

export async function run(env = process.env, {
  fetchImpl = fetch, log = console.log, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), now = Date.now,
} = {}) {
  const supabaseUrl = need(env, "SUPABASE_URL").replace(/\/$/, "");
  const anonKey = need(env, "SUPABASE_ANON_KEY");
  const serviceKey = need(env, "SUPABASE_SERVICE_ROLE_KEY");
  const stripeKey = need(env, "STRIPE_TEST_KEY");
  const webhookSecret = need(env, "STRIPE_WEBHOOK_SECRET");
  const packTypeId = need(env, "SMOKE_CLASS_PACK_TYPE_ID");
  const email = env.SMOKE_EMAIL || DEFAULT_EMAIL;
  assertTestKey(stripeKey);

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
  expect([200, 201, 422].includes(created.status), `Create smoke member: ${created.status} ${JSON.stringify(created.body)}`);
  const link = await call(fetchImpl, `${supabaseUrl}/auth/v1/admin/generate_link`, {
    method: "POST", headers: admin, body: JSON.stringify({ type: "magiclink", email }),
  }, "generate link");
  const tokenHash = link.body?.hashed_token ?? link.body?.properties?.hashed_token;
  expect(link.status === 200 && tokenHash, `Generate sign-in link: ${link.status} ${JSON.stringify(link.body)}`);
  const verified = await call(fetchImpl, `${supabaseUrl}/auth/v1/verify`, {
    method: "POST", headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", token_hash: tokenHash }),
  }, "verify");
  const accessToken = verified.body?.access_token;
  expect(verified.status === 200 && accessToken, `Sign in smoke member: ${verified.status} ${JSON.stringify(verified.body)}`);
  log("1/4 signed in as the smoke member");

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
    ((await rest(`transactions?stripe_checkout_session_id=eq.${id}&select=id`)).body ?? []).length > 0;
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
  try {
    await deliver(completed);
    const txns = await rest(`transactions?stripe_checkout_session_id=eq.${sessionId}&select=id,status,class_pack_id,amount_cents,profile_id`);
    expect(txns.status === 200 && txns.body.length === 1, `Expected 1 transaction, got ${JSON.stringify(txns.body)}`);
    const txn = txns.body[0];
    expect(txn.status === "completed" && txn.class_pack_id, `Transaction not completed with a pack: ${JSON.stringify(txn)}`);
    expect(txn.amount_cents === session.amount_total, `Charged ${txn.amount_cents}, session says ${session.amount_total}`);
    const pack = await rest(`class_packs?id=eq.${txn.class_pack_id}&select=status,classes_remaining,classes_total`);
    expect(pack.body?.[0]?.status === "active" && pack.body[0].classes_remaining === Number(session.metadata.class_count),
      `Pack not credited: ${JSON.stringify(pack.body)}`);
    // Redelivery must change nothing: same rows, same values.
    const snapshot = async () => ({
      txns: (await rest(`transactions?stripe_checkout_session_id=eq.${sessionId}&select=*`)).body,
      packs: (await rest(`class_packs?stripe_payment_intent_id=eq.${pi}&select=*`)).body,
    });
    const before = await snapshot();
    await deliver(completed);
    const after = await snapshot();
    expect(after.txns?.length === 1 && after.packs?.length === 1,
      `Redelivery double-credited: ${after.txns?.length} transactions, ${after.packs?.length} packs`);
    expect(JSON.stringify(after) === JSON.stringify(before),
      `Redelivery changed existing rows: ${JSON.stringify({ before, after })}`);
    log(`3/4 webhook credited ${pack.body[0].classes_remaining} classes once (redelivery ignored)`);

    // 4. Full refund voids the pack (and cleans up this run).
    await deliver(refundEvent());
    refundSent = true; // only once delivered; otherwise the finally block retries
    const refunded = await rest(`transactions?id=eq.${txn.id}&select=status`);
    const voided = await rest(`class_packs?id=eq.${txn.class_pack_id}&select=status,classes_remaining`);
    expect(refunded.body?.[0]?.status === "refunded", `Refund not recorded: ${JSON.stringify(refunded.body)}`);
    expect(voided.body?.[0]?.status === "exhausted" && voided.body[0].classes_remaining === 0,
      `Pack not voided: ${JSON.stringify(voided.body)}`);
    log("4/4 refund recorded and pack voided");
    return { sessionId, transactionId: txn.id };
  } finally {
    if (!refundSent) {
      try { await deliver(refundEvent()); log("cleanup: refunded the smoke purchase after a failure"); }
      catch (err) { log(`cleanup refund failed, check ${sessionId} by hand: ${err.message}`); }
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  run().then(
    (r) => console.log(`PASS stripe smoke ${r.sessionId}`),
    (err) => { console.error(`FAIL stripe smoke: ${err.message}`); process.exit(1); },
  );
}
