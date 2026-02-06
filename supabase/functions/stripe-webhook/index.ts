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
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

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

  switch (metadata.type) {
    case "drop_in": {
      // Confirm the booking
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          payment_intent_id: session.payment_intent as string,
          amount_paid_cents: session.amount_total,
        })
        .eq("id", metadata.booking_id);

      if (error) console.error("Failed to confirm booking:", error);
      break;
    }

    case "membership": {
      // Create or update membership record
      const { error } = await supabase.from("memberships").upsert({
        user_id: metadata.user_id,
        studio_id: metadata.studio_id,
        plan_name: metadata.plan_name || "Membership",
        stripe_subscription_id: session.subscription as string,
        stripe_customer_id: session.customer as string,
        status: "active",
      });

      if (error) console.error("Failed to create membership:", error);
      break;
    }

    case "class_pack": {
      // Create membership with class count
      const { error } = await supabase.from("memberships").insert({
        user_id: metadata.user_id,
        studio_id: metadata.studio_id,
        plan_name: `${metadata.pack_size}-Class Pack`,
        stripe_customer_id: session.customer as string,
        status: "active",
        classes_remaining: parseInt(metadata.pack_size || "10"),
        is_unlimited: false,
      });

      if (error) console.error("Failed to create class pack:", error);
      break;
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const statusMap: Record<string, string> = {
    active: "active",
    past_due: "past_due",
    canceled: "cancelled",
    trialing: "trialing",
    paused: "paused",
  };

  const { error } = await supabase
    .from("memberships")
    .update({
      status: statusMap[subscription.status] || subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) console.error("Failed to update subscription:", error);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from("memberships")
    .update({ status: "cancelled" })
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
