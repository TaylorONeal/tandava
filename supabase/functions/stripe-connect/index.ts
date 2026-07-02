/**
 * Stripe Connect Onboarding (Supabase Edge Function)
 *
 * Links a studio to its own Stripe account (Connect Standard) so it can
 * accept payments. Two actions:
 *
 *   { action: "start" }  — create (or reuse) the studio's Stripe account and
 *                          return an Account Link URL to Stripe's hosted
 *                          onboarding. The browser redirects there and Stripe
 *                          sends the owner back to /manage/onboarding.
 *   { action: "status" } — re-check the account with Stripe and persist
 *                          stripe_onboarding_complete + wizard progress.
 *                          Called when the owner returns from Stripe.
 *
 * Auth: the caller's JWT must belong to the studio's owner.
 *
 * Deploy: supabase functions deploy stripe-connect
 * Secrets:
 *   supabase secrets set STRIPE_SECRET_KEY=sk_...
 *   supabase secrets set APP_URL=https://yourstudio.com   # for return links
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!stripeKey) {
    return json({ error: "Stripe is not configured on this deployment (set STRIPE_SECRET_KEY)" }, 501);
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: "Not authenticated" }, 401);

  let payload: { action?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const action = String(payload.action ?? "start");

  const db = createClient(supabaseUrl, serviceKey);

  // Only the studio's owner can manage its Stripe connection.
  const { data: ownerRow } = await db
    .from("studio_staff")
    .select("studio_id")
    .eq("profile_id", user.id)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  if (!ownerRow) return json({ error: "No studio found for this account" }, 403);
  const studioId = ownerRow.studio_id as string;

  const { data: studio, error: studioErr } = await db
    .from("studios")
    .select("id, name, email, stripe_account_id, stripe_onboarding_complete")
    .eq("id", studioId)
    .single();
  if (studioErr || !studio) return json({ error: studioErr?.message ?? "Studio not found" }, 500);

  try {
    if (action === "start") {
      let accountId = studio.stripe_account_id as string | null;
      if (!accountId) {
        const account = await stripe.accounts.create({
          type: "standard",
          email: studio.email ?? user.email ?? undefined,
          business_profile: { name: studio.name },
          metadata: { studio_id: studioId },
        });
        accountId = account.id;
        await db.from("studios").update({ stripe_account_id: accountId }).eq("id", studioId);
      }

      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${appUrl}/manage/onboarding?stripe=refresh`,
        return_url: `${appUrl}/manage/onboarding?stripe=return`,
        type: "account_onboarding",
      });
      return json({ ok: true, url: link.url });
    }

    if (action === "status") {
      if (!studio.stripe_account_id) {
        return json({ ok: true, connected: false });
      }
      const account = await stripe.accounts.retrieve(studio.stripe_account_id);
      const connected = Boolean(account.details_submitted);

      if (connected && !studio.stripe_onboarding_complete) {
        await db.from("studios")
          .update({ stripe_onboarding_complete: true })
          .eq("id", studioId);

        const { data: onboarding } = await db
          .from("studio_onboarding")
          .select("id, completed_steps")
          .eq("studio_id", studioId)
          .maybeSingle();
        if (onboarding) {
          const steps = new Set<string>(onboarding.completed_steps ?? []);
          steps.add("stripe");
          await db.from("studio_onboarding")
            .update({ completed_steps: [...steps], has_stripe: true })
            .eq("id", onboarding.id);
        }
      }

      return json({
        ok: true,
        connected,
        chargesEnabled: Boolean(account.charges_enabled),
        detailsSubmitted: Boolean(account.details_submitted),
      });
    }

    return json({ error: `Unknown action "${action}"` }, 400);
  } catch (err) {
    console.error("[stripe-connect] error:", err);
    return json({ error: (err as Error).message ?? "Stripe Connect request failed" }, 500);
  }
});
