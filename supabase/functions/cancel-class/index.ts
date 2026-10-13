/**
 * Cancel Class (Supabase Edge Function), LP-1d.
 *
 * The owner (or admin / front desk) cancels one class. In order:
 *   1. cancel_class() runs AS THE CALLER (their JWT), so the database checks
 *      they are staff of that studio and does everything else in one
 *      transaction: class cancelled, waitlist cleared, bookings cancelled,
 *      pack and membership classes returned by the ledger, drop-in refunds
 *      queued in refund_requests (migration 00043).
 *   2. Each queued refund is sent to Stripe, idempotent by the request id, so
 *      a retry never refunds twice. Destination charges reverse the transfer
 *      and the platform fee with it. The charge.refunded webhook then records
 *      the refund on the transaction like any other.
 *   3. Everyone affected with an email on file is told, with what happens to
 *      their payment and the studio's note.
 *
 * Every step is durable and resumable: cancel_class queues the refunds and
 * the notices in the same transaction as the cancel, and this function only
 * works through what is still owed. If the response is lost or the function
 * dies halfway, { resume: true } finishes the job; nothing is sent twice
 * (refunds are idempotent by request id, notices are claimed before sending
 * and an interrupted send is left for the owner rather than resent).
 *
 * Request:  POST { occurrenceId, reason?, message? }   cancel, then follow up
 *           POST { occurrenceId, resume: true }       follow up an already-cancelled class
 *           POST { occurrenceId, statusOnly: true }   read the follow-up state and email readiness
 * Response: { cancelled, followup, emailUnavailable }  followup = class_cancel_followup()
 *
 * verify_jwt: true. Secrets: STRIPE_SECRET_KEY, email provider (see ../email).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { emailProviderReady, sendEmail } from "../email/provider.ts";
import { classCancelledEmail, refundSentEmail, type CancelFollowup, type CancelPerson } from "../../../src/lib/classCancel.ts";

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2024-06-20" }) : null;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const appUrl = (Deno.env.get("APP_URL") ?? "http://localhost:8080").replace(/\/$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped client in edge functions
type Db = ReturnType<typeof createClient<any>>;

interface RefundRow {
  id: string;
  amount_cents: number;
  attempts: number;
  refund_attempt: number;
  transaction: { stripe_payment_intent_id: string | null } | null;
}

interface NoticeRow {
  id: string;
  /** The status when read; the claim requires it unchanged, and a refused refund update restores it. */
  status: string;
  transaction_id: string | null;
  email: string | null;
  person: CancelPerson;
  message: string | null;
  attempts: number;
  refund_told: "sent" | "failed" | null;
}

/** Stripe said no (as opposed to the request not arriving): the next try needs a new idempotency key. */
function stripeRefused(err: unknown): boolean {
  const type = (err as { type?: string })?.type ?? "";
  // Not definite: the request may not have run (connection, API error), or
  // another request with the same key is still running (idempotency conflict,
  // which Stripe says to retry with the same key).
  return type.startsWith("Stripe")
    && !["StripeConnectionError", "StripeAPIError", "StripeIdempotencyError", "StripeRateLimitError"].includes(type);
}

/**
 * Send every refund still owed for this class. A refund counts as sent only
 * when Stripe reports it succeeded or pending AND its row says so; a refund
 * that fails later is reopened by the webhook (charge.refund.updated). The
 * idempotency key changes only after a definite failure, so a retry after a
 * lost response or a failed write gets the same refund back, never a second.
 */
async function sendOutstandingRefunds(db: Db, occurrenceId: string): Promise<void> {
  const { data, error } = await db.from("refund_requests")
    .select("id, amount_cents, attempts, refund_attempt, transaction:transactions(stripe_payment_intent_id)")
    .eq("occurrence_id", occurrenceId).in("status", ["pending", "failed"]);
  if (error) {
    console.error("[cancel-class] could not read refund requests:", error.message);
    return;
  }
  for (const row of (data ?? []) as unknown as RefundRow[]) {
    const pi = row.transaction?.stripe_payment_intent_id;
    let patch: Record<string, unknown>;
    try {
      if (!stripe) throw new Error("Payments are not configured");
      if (!pi) throw new Error("No card payment to refund");
      const intent = await stripe.paymentIntents.retrieve(pi, { expand: ["latest_charge"] });
      // Never more than the charge still holds: a partial refund made by hand
      // in Stripe since this was queued shrinks what is owed.
      const charge = intent.latest_charge && typeof intent.latest_charge !== "string" ? intent.latest_charge : null;
      const left = charge ? Math.max(0, charge.amount - charge.amount_refunded) : row.amount_cents;
      const amount = Math.min(row.amount_cents, left);
      if (amount <= 0) {
        await db.from("refund_requests")
          .update({ status: "sent", last_error: "Already refunded in Stripe", attempts: (row.attempts ?? 0) + 1, updated_at: new Date().toISOString() })
          .eq("id", row.id).eq("refund_attempt", row.refund_attempt ?? 0).in("status", ["pending", "failed"]);
        continue;
      }
      const refund = await stripe.refunds.create({
        payment_intent: pi,
        amount,
        reason: "requested_by_customer",
        metadata: { refund_request_id: row.id, refund_attempt: String(row.refund_attempt ?? 0), reason: "class_cancelled" },
        ...(intent.transfer_data?.destination ? { reverse_transfer: true } : {}),
        ...(intent.application_fee_amount ? { refund_application_fee: true } : {}),
        // The amount is part of the key: a resized refund is a new request to Stripe.
      }, { idempotencyKey: `refund_request:${row.id}:${row.refund_attempt ?? 0}${amount === row.amount_cents ? "" : `:${amount}`}` });
      patch = refund.status === "succeeded" || refund.status === "pending"
        ? { status: "sent", stripe_refund_id: refund.id, last_error: null, amount_cents: amount }
        : {
          status: "failed", stripe_refund_id: refund.id, refund_attempt: (row.refund_attempt ?? 0) + 1,
          last_error: `Refund ${refund.status}${refund.failure_reason ? `: ${refund.failure_reason}` : ""}`,
        };
    } catch (err) {
      patch = {
        status: "failed",
        last_error: (err as Error).message.slice(0, 500),
        ...(stripeRefused(err) ? { refund_attempt: (row.refund_attempt ?? 0) + 1 } : {}),
      };
    }
    // Only if nothing moved the request on meanwhile: the webhook may already
    // have reopened this attempt's refund as failed (charge.refund.updated).
    const { data: written, error: writeError } = await db.from("refund_requests")
      .update({ ...patch, attempts: (row.attempts ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", row.id).eq("refund_attempt", row.refund_attempt ?? 0).in("status", ["pending", "failed"])
      .select("id");
    if (writeError) console.error(`[cancel-class] refund ${row.id} outcome not recorded:`, writeError.message);
    else if (!written?.length) console.warn(`[cancel-class] refund ${row.id} changed meanwhile; outcome not written`);
  }
}

function formatWhen(iso: string, timeZone: string | null): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      timeZone: timeZone || "UTC",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toUTCString();
  }
}

const NOTICE_COLUMNS = "id, status, transaction_id, email, person, message, attempts, refund_told";

/**
 * Tell everyone not yet told, and tell anyone who heard "the studio is
 * arranging your refund" once it has gone through. Rows are claimed (status
 * "sending") with a conditional update first, so two runs never email the
 * same person. Each email states the refund as it stands right now.
 */
async function sendOutstandingNotices(db: Db, occurrenceId: string): Promise<void> {
  const [{ data: occ, error: occError }, { data: refunds, error: refundError }] = await Promise.all([
    db.from("class_occurrences")
      .select("starts_at, offering:offerings(name), studio:studios(slug, timezone, name)")
      .eq("id", occurrenceId).single(),
    db.from("refund_requests").select("transaction_id, status").eq("occurrence_id", occurrenceId),
  ]);
  if (occError || refundError || !occ) {
    console.error("[cancel-class] could not load the class or its refunds; notices left queued");
    return;
  }
  const refundSent = new Set(((refunds ?? []) as { transaction_id: string; status: string }[])
    .filter((r) => r.status === "sent").map((r) => r.transaction_id));

  // Candidates are read first and each one is claimed (status "sending") just
  // before its own send, so a run that dies partway leaves the untouched rows
  // pending for "Try again". A row left "sending" died mid-send and may already
  // have been delivered, so it is never reclaimed: the owner sees it as
  // uncertain and marks it handled after checking (class_cancel_mark_handled).
  const [{ data: firsts, error: e1 }, { data: updates, error: e2 }] = await Promise.all([
    db.from("class_cancel_notices").select(NOTICE_COLUMNS)
      .eq("occurrence_id", occurrenceId).in("status", ["pending", "failed"]),
    refundSent.size
      ? db.from("class_cancel_notices").select(NOTICE_COLUMNS)
        .eq("occurrence_id", occurrenceId).in("status", ["sent", "handled"]).eq("refund_told", "failed")
        .not("email", "is", null).in("transaction_id", [...refundSent])
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (e1) console.error("[cancel-class] could not read notices:", e1.message);
  if (e2) console.error("[cancel-class] could not read refund updates:", e2.message);

  /** Claim one row if it is still in the state we read; false if another run took it. */
  const claimRow = async (row: NoticeRow, isUpdate: boolean): Promise<boolean> => {
    let q = db.from("class_cancel_notices")
      .update({ status: "sending", updated_at: new Date().toISOString() })
      .eq("id", row.id).eq("status", row.status);
    if (isUpdate) q = q.eq("refund_told", "failed");
    const { data, error } = await q.select("id");
    if (error) console.error(`[cancel-class] could not claim notice ${row.id}:`, error.message);
    return Boolean(data?.length);
  };

  const o = occ as unknown as { starts_at: string; offering: { name: string } | null; studio: { slug: string; timezone: string | null; name: string } | null };
  const studioName = o.studio?.name ?? "Your studio";
  const className = o.offering?.name ?? "Your class";
  const when = formatWhen(o.starts_at, o.studio?.timezone ?? null);
  const scheduleUrl = o.studio?.slug ? `${appUrl}/s/${o.studio.slug}` : `${appUrl}/discover`;

  const send = async (row: NoticeRow, isUpdate: boolean) => {
    const dropIn = row.person.source === "drop_in";
    const refundNow = dropIn ? (row.transaction_id && refundSent.has(row.transaction_id) ? "sent" : "failed") : null;
    const person: CancelPerson = dropIn ? { ...row.person, refund_status: refundNow } : row.person;
    const msg = isUpdate
      ? refundSentEmail({ person, className, studioName, when, scheduleUrl })
      : classCancelledEmail({ person, className, studioName, when, message: row.message, scheduleUrl });
    // Sent, refused (safe to retry), or unknown: the request failed in
    // transit, so it may have been delivered. Unknown is shown as such and is
    // never resent automatically; the owner checks and marks it handled.
    let outcome: "sent" | "failed" | "unknown";
    let detail: string | null = null;
    if (!row.email) {
      outcome = "failed";
      detail = "No email on file";
    } else {
      const r = await sendEmail({ to: row.email, ...msg, fromName: studioName, tags: { type: isUpdate ? "class_cancelled_refund" : "class_cancelled" } })
        .catch((err: Error) => ({ success: false, error: err.message, uncertain: true }));
      outcome = r.success ? "sent" : r.uncertain ? "unknown" : "failed";
      detail = r.success ? null : `${r.uncertain ? "Delivery not confirmed: " : ""}${r.error ?? "Email not accepted"}`;
    }
    const patch = outcome === "sent"
      ? { status: "sent", last_error: null, refund_told: isUpdate ? "sent" : refundNow }
      : outcome === "unknown"
        ? { status: "unknown", last_error: detail?.slice(0, 500) }
        // Refused: a first email is retried; a refund update keeps its old status and stays owed.
        : { status: isUpdate ? row.status : "failed", last_error: detail?.slice(0, 500) };
    // Only while still ours: an owner who marked it handled meanwhile wins.
    const { error: writeError } = await db.from("class_cancel_notices")
      .update({ ...patch, attempts: (row.attempts ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", row.id).eq("status", "sending");
    if (writeError) console.error(`[cancel-class] notice ${row.id} outcome not recorded:`, writeError.message);
  };

  for (const row of (firsts ?? []) as NoticeRow[]) if (await claimRow(row, false)) await send(row, false);
  for (const row of (updates ?? []) as NoticeRow[]) if (await claimRow(row, true)) await send(row, true);
  // A refund that failed while its email was in flight must not stay announced as sent.
  const { error: reconcileError } = await db.rpc("class_cancel_reconcile_notices", { p_occurrence_id: occurrenceId });
  if (reconcileError) console.error("[cancel-class] could not reconcile notices:", reconcileError.message);
}

function errorStatus(code: string | undefined): number {
  return code === "42501" ? 403 : code === "P0002" ? 404 : code === "55000" ? 409 : 400;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const asCaller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await asCaller.auth.getUser();
  if (!user) return json({ error: "Not authenticated" }, 401);

  let body: { occurrenceId?: string; reason?: string; message?: string; resume?: boolean; statusOnly?: boolean };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const occurrenceId = String(body.occurrenceId ?? "");
  if (!UUID.test(occurrenceId)) return json({ error: "Missing occurrenceId" }, 400);

  // Read-only: the follow-up state plus whether email can go out, so the
  // owner's screen gives the right guidance before anyone presses a button.
  if (body.statusOnly) {
    const { data, error } = await asCaller.rpc("class_cancel_followup", { p_occurrence_id: occurrenceId });
    if (error) return json({ error: error.message }, errorStatus(error.code));
    return json({ cancelled: false, followup: data, emailUnavailable: !emailProviderReady().ready });
  }

  let cancelled = false;
  if (body.resume) {
    // The follow-up state checks the caller is staff of the class's studio.
    const { data, error } = await asCaller.rpc("class_cancel_followup", { p_occurrence_id: occurrenceId });
    if (error) return json({ error: error.message }, errorStatus(error.code));
    if (!(data as CancelFollowup | null)?.cancelled) return json({ error: "This class is not cancelled" }, 409);
  } else {
    // Cancel, as the caller. Refunds and notices are queued in the same transaction.
    const { error } = await asCaller.rpc("cancel_class", {
      p_occurrence_id: occurrenceId,
      p_reason: body.reason ? String(body.reason).slice(0, 500) : null,
      p_message: body.message ? String(body.message).slice(0, 1000) : null,
    });
    if (error) return json({ error: error.message }, errorStatus(error.code));
    cancelled = true;
  }

  const db = createClient(supabaseUrl, serviceKey);
  // Refunds first, so each email states the refund as it actually went.
  await sendOutstandingRefunds(db, occurrenceId);
  // The console adapter "succeeds" without delivering: leave notices queued instead.
  const emailUnavailable = !emailProviderReady().ready;
  if (!emailUnavailable) await sendOutstandingNotices(db, occurrenceId);

  const { data: followup, error } = await asCaller.rpc("class_cancel_followup", { p_occurrence_id: occurrenceId });
  if (error || !followup) {
    return json({ cancelled, error: "The class is cancelled, but the refunds and emails could not be checked. Open it again to finish." }, 500);
  }
  return json({ cancelled, followup, emailUnavailable });
});
