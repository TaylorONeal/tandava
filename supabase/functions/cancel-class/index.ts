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
 * Request:  POST { occurrenceId, reason?, message? }
 *           POST { occurrenceId, retryRefunds: true }   (re-send pending or failed refunds)
 * Response: { cancelled, people, refunds: { sent, failed, pendingIds }, emailed }
 *
 * verify_jwt: true. Secrets: STRIPE_SECRET_KEY, email provider (see ../email).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";
import { sendEmail } from "../email/provider.ts";
import { classCancelledEmail, type CancelPerson } from "../../../src/lib/classCancel.ts";

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
  status: string;
  attempts: number;
  transaction: { stripe_payment_intent_id: string | null } | null;
}

/** Send each refund to Stripe once; record the outcome on the request row. */
async function sendRefunds(db: Db, rows: RefundRow[]) {
  let sent = 0;
  let failed = 0;
  for (const row of rows) {
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
      sent += 1;
    } catch (err) {
      patch = { status: "failed", last_error: (err as Error).message.slice(0, 500) };
      failed += 1;
    }
    await db.from("refund_requests")
      .update({ ...patch, attempts: (row.attempts ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", row.id);
  }
  return { sent, failed };
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const asCaller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await asCaller.auth.getUser();
  if (!user) return json({ error: "Not authenticated" }, 401);

  let body: { occurrenceId?: string; reason?: string; message?: string; retryRefunds?: boolean };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const occurrenceId = String(body.occurrenceId ?? "");
  if (!UUID.test(occurrenceId)) return json({ error: "Missing occurrenceId" }, 400);

  const db = createClient(supabaseUrl, serviceKey);
  const refundSelect = "id, amount_cents, status, attempts, transaction:transactions(stripe_payment_intent_id)";

  // Retry: the caller must still be staff of the class's studio (the preview checks that).
  if (body.retryRefunds) {
    const { error: authError } = await asCaller.rpc("preview_class_cancellation", { p_occurrence_id: occurrenceId });
    if (authError) return json({ error: authError.message }, authError.code === "42501" ? 403 : 400);
    const { data: rows } = await db.from("refund_requests").select(refundSelect)
      .eq("occurrence_id", occurrenceId).in("status", ["pending", "failed"]);
    const refunds = await sendRefunds(db, (rows ?? []) as unknown as RefundRow[]);
    return json({ cancelled: false, refunds });
  }

  // 1. Cancel, as the caller.
  const { data: result, error } = await asCaller.rpc("cancel_class", {
    p_occurrence_id: occurrenceId,
    p_reason: body.reason ? String(body.reason).slice(0, 500) : null,
  });
  if (error) {
    const status = error.code === "42501" ? 403 : error.code === "P0002" ? 404 : error.code === "55000" ? 409 : 400;
    return json({ error: error.message }, status);
  }
  const res = result as {
    starts_at: string; class_name: string; studio_name: string;
    people: CancelPerson[]; refund_request_ids: string[];
  };

  // 2. Refunds.
  let refunds = { sent: 0, failed: 0 };
  if (res.refund_request_ids?.length) {
    const { data: rows } = await db.from("refund_requests").select(refundSelect).in("id", res.refund_request_ids);
    refunds = await sendRefunds(db, (rows ?? []) as unknown as RefundRow[]);
  }

  // 3. Tell people.
  const { data: occ } = await db.from("class_occurrences")
    .select("studio:studios(slug, timezone, name)").eq("id", occurrenceId).single();
  const studio = (occ as { studio?: { slug: string; timezone: string | null; name: string } } | null)?.studio;
  const when = formatWhen(res.starts_at, studio?.timezone ?? null);
  const scheduleUrl = studio?.slug ? `${appUrl}/s/${studio.slug}` : `${appUrl}/discover`;
  let emailed = 0;
  for (const person of res.people ?? []) {
    if (!person.email) continue;
    const msg = classCancelledEmail({
      person, className: res.class_name, studioName: res.studio_name, when,
      message: body.message ?? null, scheduleUrl,
    });
    const sent = await sendEmail({
      to: person.email, ...msg, fromName: res.studio_name,
      tags: { type: "class_cancelled" },
    }).catch(() => ({ success: false }));
    if (sent.success) emailed += 1;
  }

  return json({
    cancelled: true,
    people: res.people ?? [],
    refunds: { ...refunds, pendingIds: res.refund_request_ids ?? [] },
    emailed,
  });
});
