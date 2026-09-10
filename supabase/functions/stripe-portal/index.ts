/**
 * Stripe Customer Portal Launcher (Supabase Edge Function)
 *
 * Returns a Stripe Billing Portal URL so a member can manage their own
 * subscription (update card, cancel, view invoices). The caller is identified
 * by their Supabase JWT; we look up the Stripe customer id from their most
 * recent membership in the given studio.
 *
 * Deploy: supabase functions deploy stripe-portal
 * Secrets:
 *   supabase secrets set STRIPE_SECRET_KEY=sk_...
 *   supabase secrets set APP_URL=https://yourstudio.com
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "Not authenticated" }, 401);

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    // body is optional
  }
  const studioId = String(payload.studioId ?? "");
  const returnUrl = (payload.returnUrl as string) ?? `${appUrl}/account`;

  const db = createClient(supabaseUrl, serviceKey);

  try {
    // Find the member's Stripe customer via their subscription.
    let query = db
      .from("memberships")
      .select("stripe_subscription_id, studio_id")
      .eq("profile_id", user.id)
      .not("stripe_subscription_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);
    if (studioId) query = query.eq("studio_id", studioId);

    const { data: membership } = await query.maybeSingle();
    if (!membership?.stripe_subscription_id) {
      return json({ error: "No active subscription found" }, 404);
    }

    const subscription = await stripe.subscriptions.retrieve(
      membership.stripe_subscription_id as string,
    );
    const customerId = subscription.customer as string;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return json({ url: session.url });
  } catch (err) {
    console.error("[stripe-portal] error:", err);
    return json({ error: (err as Error).message ?? "Portal failed" }, 500);
  }
});
