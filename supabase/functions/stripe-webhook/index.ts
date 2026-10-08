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
        // Stripe redelivers events. Claim the event id first; a replay finds
        // it and stops, so transactions, memberships, packs and conversions
        // are written once. (Handler errors are already swallowed below, so
        // claiming before handling loses no retry that would have happened.)
        const { error: claimError } = await supabase
          .from("stripe_webhook_events")
          .insert({ event_id: event.id, event_type: event.type });
        if (claimError) {
          if (claimError.code === "23505") {
            console.log(`[stripe-webhook] ${event.id} already processed; skipping`);
            break;
          }
          // Table missing or another failure: process anyway rather than drop a payment.
          console.error("[stripe-webhook] could not claim event:", claimError.message);
        }
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
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
// Event handlers
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
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
        return;
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
      await recordPurchaseConversion(
        metadata,
        metadata.express === "1" ? "guest_booking" : "member_booking",
        "transaction",
        txn.id,
        session.amount_total,
        session.currency,
        metadata.express === "1" ? "express" : "signup",
      );
      if (!booking) console.warn("[stripe-webhook] drop-in booking row not returned");
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
        return;
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
      if (txnError) console.error("Failed to record membership transaction:", txnError);
      await recordPurchaseConversion(metadata, "membership_start", "membership", membership.id, session.amount_total, session.currency, "signup");
      break;
    }

    case "workshop": {
      const balanceDue = parseInt(metadata.balance_due_cents || "0", 10);
      const paid = session.amount_total ?? 0;

      const { data: txn } = await supabase
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
        break;
      }

      if (txn?.id) {
        await recordPurchaseConversion(metadata, "event_registration", "transaction", txn.id, paid, session.currency, "signup");
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
        return;
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
        return;
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
      if (txnError) console.error("Failed to record class pack transaction:", txnError);
      await recordPurchaseConversion(metadata, "pack_purchase", "class_pack", pack.id, session.amount_total, session.currency, "signup");
      break;
    }
  }
}

/**
 * Attribution for a completed purchase (PRD-024): writes conversion_events with
 * frozen first/converting touches via record_conversion(). Idempotent per
 * (type, entity), so a replayed webhook records nothing new. Best effort: a
 * failure is logged and never affects the purchase itself.
 */
async function recordPurchaseConversion(
  metadata: Record<string, string>,
  conversionType: string,
  entityType: string,
  entityId: string | null,
  amountCents: number | null,
  currency: string | null,
  memberSource: string,
) {
  try {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const visitorId = metadata.visitor_id && UUID_RE.test(metadata.visitor_id) ? metadata.visitor_id : null;
    const sessionId = metadata.session_id && UUID_RE.test(metadata.session_id) ? metadata.session_id : null;
    const { error } = await supabase.rpc("record_conversion", {
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
    });
    if (error) console.error("[stripe-webhook] record_conversion failed:", error.message);
  } catch (err) {
    console.error("[stripe-webhook] record_conversion threw:", err);
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

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const { error } = await supabase
    .from("memberships")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", invoice.subscription as string);

  if (error) console.error("Failed to mark membership as past_due:", error);
}
