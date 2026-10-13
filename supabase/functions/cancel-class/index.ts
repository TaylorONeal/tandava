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
 * (refunds are idempotent by request id, notices are claimed before sending).
 *
 * Request:  POST { occurrenceId, reason?, message? }   cancel, then follow up
 *           POST { occurrenceId, resume: true }       follow up an already-cancelled class
 * Response: { cancelled, followup, emailUnavailable }  followup = class_cancel_followup()
 *
 * verify_jwt: true. Secrets: STRIPE_SECRET_KEY, email provider (see ../email).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { emailProviderReady, sendEmail } from "../email/provider.ts";
import { classCancelledEmail, type CancelFollowup, type CancelPerson } from "../../../src/lib/classCancel.ts";

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
  transaction: { stripe_payment_intent_id: string | null } | null;
}

interface NoticeRow {
  id: string;
  booking_id: string;
  email: string | null;
  person: CancelPerson;
  message: string | null;
  attempts: number;
}

/** A claimed notice left "sending" this long (the function died mid-send) can be claimed again. */
const STALE_SENDING_MS = 5 * 60_000;

/**
 * Send every refund still owed for this class. A refund only counts once its
 * row says "sent": if Stripe accepted it but the write failed, the row stays
 * owed and the next resume gets the same refund back from Stripe (same
 * idempotency key) and records it.
 */
async function sendOutstandingRefunds(db: Db, occurrenceId: string): Promise<void> {
  const { data, error } = await db.from("refund_requests")
    .select("id, amount_cents, attempts, transaction:transactions(stripe_payment_intent_id)")
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
      const intent = await stripe.paymentIntents.retrieve(pi);
      const refund = await stripe.refunds.create({
        payment_intent: pi,
        amount: row.amount_cents,
        reason: "requested_by_customer",
        metadata: { refund_request_id: row.id, reason: "class_cancelled" },
        ...(intent.transfer_data?.destination ? { reverse_transfer: true } : {}),
        ...(intent.application_fee_amount ? { refund_application_fee: true } : {}),
      }, { idempotencyKey: `refund_request:${row.id}` });
      patch = { status: "sent", stripe_refund_id: refund.id, last_error: null };
    } catch (err) {
      patch = { status: "failed", last_error: (err as Error).message.slice(0, 500) };
    }
    const { error: writeError } = await db.from("refund_requests")
      .update({ ...patch, attempts: (row.attempts ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (writeError) console.error(`[cancel-class] refund ${row.id} outcome not recorded:`, writeError.message);
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

/**
 * Tell everyone not yet told. Rows are claimed (status "sending") with one
 * conditional update first, so two concurrent runs never email the same
 * person. Each email states the refund as it actually stands right now.
 */
async function sendOutstandingNotices(db: Db, occurrenceId: string): Promise<void> {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_SENDING_MS).toISOString();
  const { data: claimed, error } = await db.from("class_cancel_notices")
    .update({ status: "sending", updated_at: now.toISOString() })
    .eq("occurrence_id", occurrenceId)
    .or(`status.in.(pending,failed),and(status.eq.sending,updated_at.lt.${staleBefore})`)
    .select("id, booking_id, email, person, message, attempts");
  if (error) {
    console.error("[cancel-class] could not claim notices:", error.message);
    return;
  }
  const rows = (claimed ?? []) as NoticeRow[];
  if (!rows.length) return;

  const release = async (reason: string) => {
    await db.from("class_cancel_notices")
      .update({ status: "failed", last_error: reason, updated_at: new Date().toISOString() })
      .in("id", rows.map((r) => r.id));
  };

  const [{ data: occ, error: occError }, { data: refunds, error: refundError }] = await Promise.all([
    db.from("class_occurrences")
      .select("starts_at, offering:offerings(name), studio:studios(slug, timezone, name)")
      .eq("id", occurrenceId).single(),
    db.from("refund_requests").select("booking_id, status").eq("occurrence_id", occurrenceId),
  ]);
  if (occError || refundError || !occ) {
    await release("Could not load the class or its refunds");
    return;
  }
  const o = occ as unknown as { starts_at: string; offering: { name: string } | null; studio: { slug: string; timezone: string | null; name: string } | null };
  const refundSent = new Set(((refunds ?? []) as { booking_id: string | null; status: string }[])
    .filter((r) => r.status === "sent" && r.booking_id).map((r) => r.booking_id as string));
  const studioName = o.studio?.name ?? "Your studio";
  const when = formatWhen(o.starts_at, o.studio?.timezone ?? null);
  const scheduleUrl = o.studio?.slug ? `${appUrl}/s/${o.studio.slug}` : `${appUrl}/discover`;

  for (const row of rows) {
    const person: CancelPerson = row.person.source === "drop_in"
      ? { ...row.person, refund_status: refundSent.has(row.booking_id) ? "sent" : "failed" }
      : row.person;
    let result: { success: boolean; error?: string };
    if (!row.email) {
      result = { success: false, error: "No email on file" };
    } else {
      const msg = classCancelledEmail({
        person, className: o.offering?.name ?? "Your class", studioName, when,
        message: row.message, scheduleUrl,
      });
      result = await sendEmail({ to: row.email, ...msg, fromName: studioName, tags: { type: "class_cancelled" } })
        .catch((err: Error) => ({ success: false, error: err.message }));
    }
    const { error: writeError } = await db.from("class_cancel_notices").update({
      status: result.success ? "sent" : "failed",
      last_error: result.success ? null : String(result.error ?? "Email not accepted").slice(0, 500),
      attempts: (row.attempts ?? 0) + 1,
      updated_at: new Date().toISOString(),
    }).eq("id", row.id);
    if (writeError) console.error(`[cancel-class] notice ${row.id} outcome not recorded:`, writeError.message);
  }
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

  let body: { occurrenceId?: string; reason?: string; message?: string; resume?: boolean };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const occurrenceId = String(body.occurrenceId ?? "");
  if (!UUID.test(occurrenceId)) return json({ error: "Missing occurrenceId" }, 400);

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
