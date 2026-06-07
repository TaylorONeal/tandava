/**
 * Stripe Checkout Session Creator (Supabase Edge Function)
 *
 * Creates Stripe Checkout sessions for the three purchase types the
 * frontend (src/lib/stripe.ts) can initiate:
 *   - drop_in     — single class, one-time payment
 *   - membership  — recurring subscription
 *   - class_pack  — bundle of classes, one-time payment
 *
 * The caller is identified by their Supabase JWT (sent automatically by
 * supabase-js `functions.invoke`). All prices are read server-side from the
 * database so the client can never set its own amount.
 *
 * Connect modes (auto-detected per studio):
 *   - Single studio self-host: the deploying studio's own Stripe key is the
 *     platform key, `studios.stripe_account_id` is null → charge directly.
 *   - Platform / multi-studio: `studios.stripe_account_id` is set → use
 *     destination charges (transfer_data) so funds land in the studio's
 *     connected account, with an optional platform fee (PLATFORM_FEE_BPS).
 *
 * Deploy: supabase functions deploy stripe-checkout
 * Secrets:
 *   supabase secrets set STRIPE_SECRET_KEY=sk_...
 *   supabase secrets set APP_URL=https://yourstudio.com   # for success/cancel
 *   supabase secrets set PLATFORM_FEE_BPS=0               # optional, platform mode
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:8080";
const platformFeeBps = parseInt(Deno.env.get("PLATFORM_FEE_BPS") ?? "0", 10);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Map the studio's billing cycle to a Stripe recurring interval.
function recurringFor(cycle: string): { interval: string; interval_count: number } {
  switch (cycle) {
    case "weekly":
      return { interval: "week", interval_count: 1 };
    case "quarterly":
      return { interval: "month", interval_count: 3 };
    case "annual":
      return { interval: "year", interval_count: 1 };
    case "monthly":
    default:
      return { interval: "month", interval_count: 1 };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // ---- Identify the caller from their JWT ----
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return json({ error: "Not authenticated" }, 401);
  }
  const profileId = user.id;

  // Service-role client for trusted price/account reads.
  const db = createClient(supabaseUrl, serviceKey);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const type = String(payload.type ?? "");
  const successUrl =
    (payload.successUrl as string) ?? `${appUrl}/account?checkout=success`;
  const cancelUrl =
    (payload.cancelUrl as string) ?? `${appUrl}/schedule?checkout=cancelled`;

  try {
    // Resolve studio + Stripe Connect routing once we know the studio id.
    const connectFor = async (studioId: string) => {
      const { data: studio } = await db
        .from("studios")
        .select("stripe_account_id, stripe_onboarding_complete, currency")
        .eq("id", studioId)
        .single();
      const currency = (studio?.currency ?? "USD").toLowerCase();
      const connected =
        studio?.stripe_account_id && studio?.stripe_onboarding_complete
          ? (studio.stripe_account_id as string)
          : null;
      return { currency, connected };
    };

    if (type === "drop_in") {
      const occurrenceId = String(payload.occurrenceId ?? payload.classId ?? "");
      if (!occurrenceId) return json({ error: "Missing occurrenceId" }, 400);

      const { data: occ } = await db
        .from("class_occurrences")
        .select("id, studio_id, offering_id, capacity, booked_count, is_cancelled")
        .eq("id", occurrenceId)
        .single();
      if (!occ) return json({ error: "Class not found" }, 404);
      if (occ.is_cancelled) return json({ error: "Class is cancelled" }, 409);
      if ((occ.booked_count ?? 0) >= (occ.capacity ?? 0)) {
        return json({ error: "Class is full" }, 409);
      }

      // Prevent a duplicate booking (mirrors the UNIQUE constraint).
      const { data: existing } = await db
        .from("bookings")
        .select("id, status")
        .eq("class_occurrence_id", occurrenceId)
        .eq("profile_id", profileId)
        .maybeSingle();
      if (existing && existing.status !== "cancelled" && existing.status !== "late_cancel") {
        return json({ error: "You are already booked for this class" }, 409);
      }

      const { data: offering } = await db
        .from("offerings")
        .select("name, drop_in_price_cents")
        .eq("id", occ.offering_id)
        .single();
      const amount = offering?.drop_in_price_cents ?? 0;
      if (!amount) return json({ error: "Drop-in price not configured" }, 422);

      const { currency, connected } = await connectFor(occ.studio_id as string);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: amount,
              product_data: { name: `Drop-in: ${offering?.name ?? "Class"}` },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: profileId,
        metadata: {
          type: "drop_in",
          occurrence_id: occurrenceId,
          profile_id: profileId,
          studio_id: occ.studio_id as string,
          amount_cents: String(amount),
        },
        ...(connected
          ? {
              payment_intent_data: {
                application_fee_amount: Math.round((amount * platformFeeBps) / 10000),
                transfer_data: { destination: connected },
              },
            }
          : {}),
      });

      return json({ url: session.url });
    }

    if (type === "membership") {
      const membershipTypeId = String(payload.membershipTypeId ?? payload.planId ?? "");
      if (!membershipTypeId) return json({ error: "Missing membershipTypeId" }, 400);

      const { data: mt } = await db
        .from("membership_types")
        .select("name, price_cents, billing_cycle, trial_days, studio_id")
        .eq("id", membershipTypeId)
        .single();
      if (!mt) return json({ error: "Membership plan not found" }, 404);

      const { currency, connected } = await connectFor(mt.studio_id as string);
      const recurring = recurringFor(mt.billing_cycle as string);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: mt.price_cents as number,
              recurring,
              product_data: { name: mt.name as string },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: profileId,
        subscription_data: {
          ...(mt.trial_days && (mt.trial_days as number) > 0
            ? { trial_period_days: mt.trial_days as number }
            : {}),
          metadata: {
            type: "membership",
            membership_type_id: membershipTypeId,
            profile_id: profileId,
            studio_id: mt.studio_id as string,
          },
          ...(connected
            ? {
                application_fee_percent: platformFeeBps / 100,
                transfer_data: { destination: connected },
              }
            : {}),
        },
        metadata: {
          type: "membership",
          membership_type_id: membershipTypeId,
          profile_id: profileId,
          studio_id: mt.studio_id as string,
        },
      });

      return json({ url: session.url });
    }

    if (type === "class_pack") {
      const classPackTypeId = String(
        payload.classPackTypeId ?? payload.planId ?? "",
      );
      if (!classPackTypeId) return json({ error: "Missing classPackTypeId" }, 400);

      const { data: pt } = await db
        .from("class_pack_types")
        .select("name, price_cents, class_count, studio_id")
        .eq("id", classPackTypeId)
        .single();
      if (!pt) return json({ error: "Class pack not found" }, 404);

      const { currency, connected } = await connectFor(pt.studio_id as string);
      const amount = pt.price_cents as number;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: amount,
              product_data: {
                name: `${pt.name} (${pt.class_count} classes)`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: profileId,
        metadata: {
          type: "class_pack",
          class_pack_type_id: classPackTypeId,
          profile_id: profileId,
          studio_id: pt.studio_id as string,
        },
        ...(connected
          ? {
              payment_intent_data: {
                application_fee_amount: Math.round((amount * platformFeeBps) / 10000),
                transfer_data: { destination: connected },
              },
            }
          : {}),
      });

      return json({ url: session.url });
    }

    return json({ error: `Unknown checkout type: ${type}` }, 400);
  } catch (err) {
    console.error("[stripe-checkout] error:", err);
    return json({ error: (err as Error).message ?? "Checkout failed" }, 500);
  }
});
