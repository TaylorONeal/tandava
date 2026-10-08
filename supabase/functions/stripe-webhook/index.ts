/**
 * Stripe Webhook Handler (Supabase Edge Function)
 *
 * Handles Stripe events for:
 *   - checkout.session.completed  — finalize bookings and memberships
 *   - customer.subscription.*     — sync subscription status
 *   - invoice.payment_failed      — mark membership as past_due
 *
 * Deploy: supabase functions deploy stripe-webhook
 * Set secrets:
 *   supabase secrets set STRIPE_SECRET_KEY=sk_...
 *   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
 *
 * Configure webhook endpoint in Stripe Dashboard:
 *   URL: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
 *   Events: checkout.session.completed, customer.subscription.updated,
 *           customer.subscription.deleted, invoice.payment_failed
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Service role client bypasses RLS for webhook-driven writes
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  console.log(`[stripe-webhook] Received: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // Stripe redelivers events. Fulfil each checkout once: claim the event
        // (processing), fulfil, then mark completed. If only the attribution
        // writes failed, the row is "fulfilled" with those writes saved, and
        // the 500 makes Stripe redeliver; the redelivery replays just them
        // (idempotent per entity), never the fulfilment. See migration 00025.
        const claim = await claimEvent(event);
        if (claim === "done") {
          console.log(`[stripe-webhook] ${event.id} already fulfilled; skipping`);
          break;
        }
        if (claim === "busy") {
          // Another delivery is fulfilling it right now; let Stripe retry later.
          return new Response("Event in progress", { status: 503 });
        }
        if (typeof claim === "object") {
          const still: Record<string, unknown>[] = [];
          for (const args of claim.pending) if (!(await callRecordConversion(args))) still.push(args);
          // Replaying a fulfilled event never re-runs fulfilment, so asking
          // for another retry is always safe here.
          await finishEvent(event.id, still);
          if (still.length) return new Response("Retry attribution", { status: 500 });
          break;
        }
        const failedConversions: Record<string, unknown>[] = [];
        const fulfilled = await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, failedConversions);
        if (!fulfilled) {
          // A required write failed. With the ledger, the claim stays
          // "processing" and the retry takes it over after 10 minutes;
          // without it (untracked) the retry simply runs again. Either way
          // a paid checkout must not be acknowledged unfulfilled.
          return new Response("Fulfilment failed", { status: 500 });
        }
        if (claim === "claimed") {
          const saved = await finishEvent(event.id, failedConversions);
          // Ask for a retry only if the ledger knows to replay just the
          // attribution writes; if the ledger update itself failed, a retry
          // would re-run the fulfilment, which is worse than a lost conversion.
          if (failedConversions.length && saved) return new Response("Retry attribution", { status: 500 });
          if (!saved) console.error("[stripe-webhook] LEDGER NOT UPDATED for", event.id, "pending conversions:", failedConversions.length);
        } else if (failedConversions.length) {
          console.error("[stripe-webhook] ledger unavailable; conversions not recorded for", event.id);
        }
        break;
      }

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_succeeded":
        if (!(await handlePaymentSucceeded(event.data.object as Stripe.Invoice))) {
          // Safe to retry: the conversion is keyed by the invoice id.
          return new Response("Retry later", { status: 500 });
        }
        break;

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[stripe-webhook] Error handling ${event.type}:`, err);
    // Return 200 to acknowledge receipt — Stripe will retry on 5xx
    // Log the error for investigation but don't block
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

const STALE_CLAIM_MS = 10 * 60 * 1000;

/**
 * Completed when nothing is left; otherwise fulfilled with the attribution
 * writes still to do. Returns false if the ledger couldn't be updated.
 */
async function finishEvent(eventId: string, pending: Record<string, unknown>[]): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase
      .from("stripe_webhook_events")
      .update(
        pending.length
          ? { status: "fulfilled", pending_conversions: pending }
          : { status: "completed", completed_at: new Date().toISOString(), pending_conversions: null },
      )
      .eq("event_id", eventId);
    if (!error) return true;
    console.error("[stripe-webhook] ledger update failed:", error.message);
  }
  return false;
}

/**
 * claimed: this delivery owns the event. done: already fulfilled.
 * busy: another delivery claimed it under 10 minutes ago.
 * untracked: the ledger is unavailable; fulfil anyway rather than drop a payment.
 * A claim older than 10 minutes that never completed (the function was killed
 * mid-fulfilment) is taken over, so a paid checkout is never stranded.
 */
async function claimEvent(
  event: Stripe.Event,
): Promise<"claimed" | "done" | "busy" | "untracked" | { pending: Record<string, unknown>[] }> {
  const { error } = await supabase
    .from("stripe_webhook_events")
    .insert({ event_id: event.id, event_type: event.type, status: "processing" });
  if (!error) return "claimed";
  if (error.code !== "23505") {
    console.error("[stripe-webhook] could not claim event:", error.message);
    return "untracked";
  }
  const { data: row } = await supabase
    .from("stripe_webhook_events")
    .select("status, received_at, pending_conversions")
    .eq("event_id", event.id)
    .maybeSingle();
  if (row?.status === "completed") return "done";
  if (row?.status === "fulfilled") return { pending: (row.pending_conversions as Record<string, unknown>[]) ?? [] };
  const age = row?.received_at ? Date.now() - new Date(row.received_at).getTime() : Infinity;
  if (age < STALE_CLAIM_MS) return "busy";
  // Take over a stale claim, guarded on the old timestamp so only one retry wins.
  const { data: taken } = await supabase
    .from("stripe_webhook_events")
    .update({ received_at: new Date().toISOString() })
    .eq("event_id", event.id)
    .eq("status", "processing")
    .eq("received_at", row?.received_at ?? "")
    .select("event_id");
  return taken?.length ? "claimed" : "busy";
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

/**
 * Fulfil a completed checkout. Returns false when a required write failed, so
 * the event stays "processing" in the ledger and a manual resend from the
 * Stripe dashboard (after 10 minutes) can fulfil it again.
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  failedConversions: Record<string, unknown>[],
): Promise<boolean> {
  const metadata = session.metadata || {};
  const paymentIntentId = (session.payment_intent as string) || null;

  switch (metadata.type) {
    case "drop_in": {
      // Record the financial settlement, then the operational booking.
      const { data: txn, error: txnError } = await supabase
        .from("transactions")
        .insert({
          studio_id: metadata.studio_id,
          profile_id: metadata.profile_id,
          type: "drop_in",
          status: "completed",
          amount_cents: session.amount_total,
          stripe_payment_intent_id: paymentIntentId,
        })
        .select("id")
        .single();
      if (txnError) {
        console.error("Failed to record drop-in transaction:", txnError);
        return false;
      }

      // create_guest_booking() re-checks capacity under a row lock and is
      // idempotent per (occurrence, profile), so a replayed webhook does not
      // double-book and a class that filled while the payer was in Checkout
      // lands them on the waitlist instead of overselling the room. A raw
      // insert here could do neither. It consumes no entitlement, which is
      // correct for a drop-in: the payment IS the entitlement.
      const { data: bookingRow, error: bookingError } = await supabase.rpc("create_guest_booking", {
        p_occurrence_id: metadata.occurrence_id,
        p_profile_id: metadata.profile_id,
        p_transaction_id: txn.id,
      });
      if (bookingError) console.error("Failed to create booking:", bookingError);
      const booking = Array.isArray(bookingRow) ? bookingRow[0] : bookingRow;
      // Only a confirmed seat is a booking. A payment that ended on the
      // waitlist (the class filled during Checkout) or failed to book still
      // counts as money in, under its own type, so booking rates stay honest.
      const confirmed = !bookingError && booking && booking.status === "confirmed";
      await recordPurchaseConversion(failedConversions, metadata,
        confirmed ? (metadata.express === "1" ? "guest_booking" : "member_booking") : "drop_in_payment",
        "transaction",
        txn.id,
        session.amount_total,
        session.currency,
        metadata.express === "1" ? "express" : "signup",
      );
      if (!booking) console.warn("[stripe-webhook] drop-in booking row not returned");
      if (bookingError) return false;
      break;
    }

    case "membership": {
      // Resolve the plan to compute the initial billing period.
      const { data: mt } = await supabase
        .from("membership_types")
        .select("billing_cycle, price_cents")
        .eq("id", metadata.membership_type_id)
        .single();

      const now = new Date();
      const end = new Date(now);
      switch (mt?.billing_cycle) {
        case "weekly": end.setDate(end.getDate() + 7); break;
        case "quarterly": end.setMonth(end.getMonth() + 3); break;
        case "annual": end.setFullYear(end.getFullYear() + 1); break;
        default: end.setMonth(end.getMonth() + 1);
      }

      const { data: membership, error: memErr } = await supabase
        .from("memberships")
        .insert({
          studio_id: metadata.studio_id,
          profile_id: metadata.profile_id,
          membership_type_id: metadata.membership_type_id,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: end.toISOString(),
          stripe_subscription_id: session.subscription as string,
        })
        .select("id")
        .single();
      if (memErr) {
        console.error("Failed to create membership:", memErr);
        return false;
      }

      const { error: txnError } = await supabase.from("transactions").insert({
        studio_id: metadata.studio_id,
        profile_id: metadata.profile_id,
        type: "membership_purchase",
        status: "completed",
        amount_cents: session.amount_total ?? mt?.price_cents ?? 0,
        stripe_payment_intent_id: paymentIntentId,
        membership_id: membership.id,
      });
      if (txnError) {
        console.error("Failed to record membership transaction:", txnError);
        return false;
      }
      await recordPurchaseConversion(failedConversions, metadata, "membership_start", "membership", membership.id, session.amount_total, session.currency, "signup");
      break;
    }

    case "workshop": {
      const balanceDue = parseInt(metadata.balance_due_cents || "0", 10);
      const paid = session.amount_total ?? 0;

      const { data: txn, error: wsTxnError } = await supabase
        .from("transactions")
        .insert({
          studio_id: metadata.studio_id,
          profile_id: metadata.profile_id,
          type: "workshop",
          status: "completed",
          amount_cents: paid,
          stripe_payment_intent_id: paymentIntentId,
        })
        .select("id")
        .single();

      if (wsTxnError || !txn) {
        console.error("Failed to record workshop transaction:", wsTxnError);
        return false;
      }

      const { error: regErr } = await supabase.from("event_registrations").insert({
        event_id: metadata.event_id,
        studio_id: metadata.studio_id,
        profile_id: metadata.profile_id,
        pricing_tier_id: metadata.tier_id || null,
        status: "registered",
        amount_paid_cents: paid,
        deposit_paid_cents: balanceDue > 0 ? paid : 0,
        balance_due_cents: balanceDue,
        transaction_id: txn?.id ?? null,
      });
      if (regErr) {
        console.error("Failed to create event registration:", regErr);
        return false;
      }

      if (txn?.id) {
        await recordPurchaseConversion(failedConversions, metadata, "event_registration", "transaction", txn.id, paid, session.currency, "signup");
      }

      // Bump denormalized registration counts (no trigger for events).
      await supabase.rpc("increment_event_registered", { p_event_id: metadata.event_id });
      if (metadata.tier_id) {
        await supabase.rpc("increment_tier_registered", { p_tier_id: metadata.tier_id });
      }
      break;
    }

    case "class_pack": {
      const { data: pt } = await supabase
        .from("class_pack_types")
        .select("class_count, validity_days, price_cents")
        .eq("id", metadata.class_pack_type_id)
        .single();
      if (!pt) {
        console.error("Class pack type not found:", metadata.class_pack_type_id);
        return false;
      }

      const expires = new Date();
      expires.setDate(expires.getDate() + (pt.validity_days ?? 90));

      const { data: pack, error: packErr } = await supabase
        .from("class_packs")
        .insert({
          studio_id: metadata.studio_id,
          profile_id: metadata.profile_id,
          class_pack_type_id: metadata.class_pack_type_id,
          status: "active",
          classes_remaining: pt.class_count,
          classes_total: pt.class_count,
          expires_at: expires.toISOString(),
          stripe_payment_intent_id: paymentIntentId,
        })
        .select("id")
        .single();
      if (packErr) {
        console.error("Failed to create class pack:", packErr);
        return false;
      }

      const { error: txnError } = await supabase.from("transactions").insert({
        studio_id: metadata.studio_id,
        profile_id: metadata.profile_id,
        type: "class_pack_purchase",
        status: "completed",
        amount_cents: session.amount_total ?? pt.price_cents ?? 0,
        stripe_payment_intent_id: paymentIntentId,
        class_pack_id: pack.id,
      });
      if (txnError) {
        console.error("Failed to record class pack transaction:", txnError);
        return false;
      }
      await recordPurchaseConversion(failedConversions, metadata, "pack_purchase", "class_pack", pack.id, session.amount_total, session.currency, "signup");
      break;
    }
  }
  return true;
}

/**
 * Attribution for a completed purchase (PRD-024): writes conversion_events with
 * frozen first/converting touches via record_conversion(). Idempotent per
 * (type, entity), so a replayed webhook records nothing new. Best effort: a
 * failure is logged and never affects the purchase itself.
 */
async function recordPurchaseConversion(
  /** Collects this request's failed writes, saved on the ledger row for retry. */
  failed: Record<string, unknown>[],
  metadata: Record<string, string>,
  conversionType: string,
  entityType: string,
  entityId: string | null,
  amountCents: number | null,
  currency: string | null,
  memberSource: string,
) {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const visitorId = metadata.visitor_id && UUID_RE.test(metadata.visitor_id) ? metadata.visitor_id : null;
  const sessionId = metadata.session_id && UUID_RE.test(metadata.session_id) ? metadata.session_id : null;
  const args = {
    p_studio_id: metadata.studio_id,
    p_profile_id: metadata.profile_id,
    p_visitor_id: visitorId,
    p_conversion_type: conversionType,
    p_value_cents: amountCents ?? 0,
    p_currency: (currency ?? "usd").toUpperCase(),
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_converting_session_id: sessionId,
    p_member_source: memberSource,
    // Stamped now and saved with the args, so a replay keeps the purchase's
    // own time (journey cutoff and reporting period).
    p_occurred_at: new Date().toISOString(),
  };
  if (!(await callRecordConversion(args))) failed.push(args);
}

async function callRecordConversion(args: Record<string, unknown>): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("record_conversion", args);
    if (error) {
      console.error("[stripe-webhook] record_conversion failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[stripe-webhook] record_conversion threw:", err);
    return false;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Map Stripe subscription status → membership_status enum
  // (active, paused, cancelled, expired, past_due).
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "active",
    past_due: "past_due",
    unpaid: "past_due",
    incomplete: "past_due",
    incomplete_expired: "expired",
    canceled: "cancelled",
    paused: "paused",
  };

  const { error } = await supabase
    .from("memberships")
    .update({
      status: statusMap[subscription.status] || "active",
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) console.error("Failed to update subscription:", error);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from("memberships")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id);

  if (error) console.error("Failed to cancel subscription:", error);
}

/** A stable UUID for a Stripe id (SHA-256, version/variant bits set), so replays dedupe. */
async function uuidFromStripeId(id: string): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`stripe:${id}`))).slice(0, 16);
  h[6] = (h[6] & 0x0f) | 0x80; // version 8 (custom)
  h[8] = (h[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = [...h].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * A successful subscription renewal (PRD-024): money in, credited to the
 * journey that brought the member. The first invoice is the checkout
 * (subscription_create) and is already recorded as membership_start.
 * Attribution only; renewal transactions in the ledger are tracked in #73.
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<boolean> {
  if (!invoice.subscription || invoice.billing_reason !== "subscription_cycle") return true;
  if (!invoice.amount_paid) return true;
  const { data: membership, error: lookupError } = await supabase
    .from("memberships")
    .select("id, studio_id, profile_id")
    .eq("stripe_subscription_id", invoice.subscription as string)
    .maybeSingle();
  if (lookupError) {
    console.error("[stripe-webhook] renewal membership lookup failed:", lookupError.message);
    return false; // retry
  }
  if (!membership) return true; // not ours
  const { error } = await supabase.rpc("record_conversion", {
    p_studio_id: membership.studio_id,
    p_profile_id: membership.profile_id,
    p_visitor_id: null,
    p_conversion_type: "membership_renewal",
    p_value_cents: invoice.amount_paid,
    p_currency: (invoice.currency ?? "usd").toUpperCase(),
    p_entity_type: "stripe_invoice",
    p_entity_id: await uuidFromStripeId(invoice.id),
    p_converting_session_id: null,
    p_member_source: null,
    // The charge's own time, not the (possibly much later) redelivery's.
    p_occurred_at: invoice.status_transitions?.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
      : new Date().toISOString(),
  });
  if (error) {
    console.error("[stripe-webhook] renewal conversion failed:", error.message);
    return false;
  }
  return true;
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const { error } = await supabase
    .from("memberships")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", invoice.subscription as string);

  if (error) console.error("Failed to mark membership as past_due:", error);
}
