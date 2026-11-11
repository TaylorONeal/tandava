// tandava main d8c1b43, bundled single file (dashboard deploy 2026-11-11)
// supabase/functions/stripe-connect/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";
var stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
var supabaseUrl = Deno.env.get("SUPABASE_URL");
var serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
var anonKey = Deno.env.get("SUPABASE_ANON_KEY");
var appUrl = Deno.env.get("APP_URL") ?? "http://localhost:8080";
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
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
    global: { headers: { Authorization: authHeader } }
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: "Not authenticated" }, 401);
  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const action = String(payload.action ?? "start");
  const db = createClient(supabaseUrl, serviceKey);
  const { data: ownerRow } = await db.from("studio_staff").select("studio_id").eq("profile_id", user.id).eq("role", "owner").eq("is_active", true).limit(1).maybeSingle();
  if (!ownerRow) return json({ error: "No studio found for this account" }, 403);
  const studioId = ownerRow.studio_id;
  const { data: studio, error: studioErr } = await db.from("studios").select("id, name, email, stripe_account_id, stripe_onboarding_complete").eq("id", studioId).single();
  if (studioErr || !studio) return json({ error: studioErr?.message ?? "Studio not found" }, 500);
  try {
    if (action === "start") {
      let accountId = studio.stripe_account_id;
      if (!accountId) {
        const account = await stripe.accounts.create({
          type: "standard",
          email: studio.email ?? user.email ?? void 0,
          business_profile: { name: studio.name },
          metadata: { studio_id: studioId }
        });
        accountId = account.id;
        await db.from("studios").update({ stripe_account_id: accountId }).eq("id", studioId);
      }
      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${appUrl}/manage/onboarding?stripe=refresh`,
        return_url: `${appUrl}/manage/onboarding?stripe=return`,
        type: "account_onboarding"
      });
      return json({ ok: true, url: link.url });
    }
    if (action === "status") {
      if (!studio.stripe_account_id) {
        return json({ ok: true, connected: false });
      }
      const account = await stripe.accounts.retrieve(studio.stripe_account_id);
      const connected = Boolean(account.details_submitted);
      await db.from("studios").update({ stripe_charges_enabled: Boolean(account.charges_enabled) }).eq("id", studioId);
      if (connected && !studio.stripe_onboarding_complete) {
        await db.from("studios").update({ stripe_onboarding_complete: true }).eq("id", studioId);
        const { data: onboarding } = await db.from("studio_onboarding").select("id, completed_steps").eq("studio_id", studioId).maybeSingle();
        if (onboarding) {
          const steps = new Set(onboarding.completed_steps ?? []);
          steps.add("stripe");
          await db.from("studio_onboarding").update({ completed_steps: [...steps], has_stripe: true }).eq("id", onboarding.id);
        }
      }
      return json({
        ok: true,
        connected,
        chargesEnabled: Boolean(account.charges_enabled),
        detailsSubmitted: Boolean(account.details_submitted)
      });
    }
    return json({ error: `Unknown action "${action}"` }, 400);
  } catch (err) {
    console.error("[stripe-connect] error:", err);
    return json({ error: err.message ?? "Stripe Connect request failed" }, 500);
  }
});
