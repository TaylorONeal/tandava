/**
 * Stripe Webhook Handler (Supabase Edge Function)
 *
 * This function is intentionally thin. It verifies the signature and hands each
 * event to a SECURITY DEFINER SQL function (migration 00025) that does all the
 * writes in ONE database transaction and records the Stripe event id first:
 *
 *   checkout.session.completed / async_payment_succeeded -> fulfill_stripe_checkout
 *   charge.refunded                                      -> record_stripe_refund
 *   invoice.paid (cycle renewals)                        -> renew_membership_cycle
 *   account.updated (Connect)                            -> set_studio_charges_enabled
 *   customer.subscription.updated / .deleted, invoice.payment_failed
 *                                                        -> membership status sync
 *
 * Contract with Stripe:
 *   - bad signature            -> 400 (Stripe will not retry a forged call)
 *   - handler error            -> 500 (Stripe retries with backoff for up to 3 days)
 *   - success or duplicate     -> 200
 * A paid customer therefore never ends up with "paid but nothing delivered":
 * either the whole fulfilment commits, or Stripe tries again.
 *
 * Attribution (PRD-024, migration 00035): after fulfilment commits, the
 * conversion is recorded from what fulfilment wrote (record_checkout_conversion,
 * record_renewal_conversion), with Stripe's event time. Those calls are
 * idempotent per entity and queue their own failures for retry, so they never
 * affect the payment; a duplicate delivery simply re-checks them.
 *
 * The behaviour of the SQL functions is covered by supabase/tests/060_payments.test.sql.
 *
 * Deploy: supabase functions deploy stripe-webhook
 * Secrets:
 *   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 *   STRIPE_CONNECT_WEBHOOK_SECRET   (optional: separate endpoint for Connect events)
 *
 * Stripe Dashboard -> Webhooks -> endpoint:
 *   URL: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
 *   Events: checkout.session.completed, checkout.session.async_payment_succeeded,
 *           charge.refunded, invoice.paid, invoice.payment_failed,
 *           customer.subscription.updated, customer.subscription.deleted,
 *           account.updated (Connect endpoint)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

// Deno has no synchronous WebCrypto, so verification must use the async variant.
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const webhookSecrets = [
  Deno.env.get("STRIPE_WEBHOOK_SECRET"),
  Deno.env.get("STRIPE_CONNECT_WEBHOOK_SECRET"),
].filter((v): v is string => Boolean(v));

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function verify(body: string, signature: string): Promise<Stripe.Event> {
  let lastError: unknown;
  for (const secret of webhookSecrets) {
    try {
      return await stripe.webhooks.constructEventAsync(body, signature, secret, undefined, cryptoProvider);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error("No webhook secret configured");
}

/** Throw on any database error so the caller answers 5xx and Stripe retries. */
async function rpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data as { status?: string; note?: string } | number | null;
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing stripe-signature header", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await verify(await req.text(), signature);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed:", (err as Error).message);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const result = await handle(event);
    console.log(`[stripe-webhook] ${event.id} ${event.type}:`, JSON.stringify(result ?? "ok"));
    const note = result && typeof result === "object" && "note" in result ? result.note : undefined;
    if (note) {
      // e.g. "class full: refund needed" - surfaces in the function logs for the studio to act on.
      console.warn(`[stripe-webhook] ${event.id} needs attention: ${note}`);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`[stripe-webhook] ${event.id} ${event.type} failed, Stripe will retry:`, err);
    return new Response("Handler error", { status: 500 });
  }
});

async function handle(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      // Unpaid sessions (async methods still pending) are fulfilled by async_payment_succeeded.
      if (session.payment_status === "unpaid") return { status: "waiting for payment" };
      const result = await rpc("fulfill_stripe_checkout", {
        p_event_id: event.id,
        p_event_type: event.type,
        p_session: session,
      });
      // Runs on duplicates too (a no-op once recorded). The signed event time is
      // when the checkout completed; a late delivery must not move the conversion.
      await rpc("record_checkout_conversion", {
        p_session: session,
        p_occurred_at: new Date(event.created * 1000).toISOString(),
      });
      return result;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      if (!charge.payment_intent) return { status: "no payment intent" };
      return rpc("record_stripe_refund", {
        p_event_id: event.id,
        p_payment_intent: charge.payment_intent as string,
        p_charge_id: charge.id,
        p_amount: charge.amount,
        p_amount_refunded: charge.amount_refunded,
      });
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      // The first invoice is recorded by the checkout fulfilment; only renewals reset the cycle.
      if (invoice.billing_reason !== "subscription_cycle" || !invoice.subscription) {
        return { status: "not a renewal" };
      }
      const line = invoice.lines.data[0];
      const renewed = await rpc("renew_membership_cycle", {
        p_event_id: event.id,
        p_subscription_id: invoice.subscription as string,
        p_period_start: new Date((line?.period?.start ?? invoice.period_start) * 1000).toISOString(),
        p_period_end: new Date((line?.period?.end ?? invoice.period_end) * 1000).toISOString(),
        p_amount_cents: invoice.amount_paid,
        p_currency: invoice.currency,
        p_payment_intent: (invoice.payment_intent as string) ?? null,
      });
      // Money in from a renewal, credited to the member's own journey (no visit).
      await rpc("record_renewal_conversion", {
        p_subscription_id: invoice.subscription as string,
        p_invoice_id: invoice.id,
        p_amount_cents: invoice.amount_paid,
        p_currency: invoice.currency,
        p_paid_at: new Date((invoice.status_transitions?.paid_at ?? event.created) * 1000).toISOString(),
        // Keys the conversion to the renewal's transaction so refunds net out.
        p_payment_intent: (invoice.payment_intent as string) ?? null,
      });
      return renewed;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      return rpc("set_studio_charges_enabled", {
        p_account_id: account.id,
        p_charges_enabled: account.charges_enabled,
        p_details_submitted: account.details_submitted,
      });
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      // Stripe subscription status -> membership_status enum.
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
          status: statusMap[sub.status] || "active",
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq("stripe_subscription_id", sub.id);
      if (error) throw new Error(`subscription.updated: ${error.message}`);
      return { status: "synced" };
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const { error } = await supabase
        .from("memberships")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("stripe_subscription_id", sub.id);
      if (error) throw new Error(`subscription.deleted: ${error.message}`);
      return { status: "cancelled" };
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      if (!invoice.subscription) return { status: "no subscription" };
      const { error } = await supabase
        .from("memberships")
        .update({ status: "past_due" })
        .eq("stripe_subscription_id", invoice.subscription as string);
      if (error) throw new Error(`payment_failed: ${error.message}`);
      return { status: "past_due" };
    }

    default:
      return { status: "ignored", type: event.type };
  }
}
