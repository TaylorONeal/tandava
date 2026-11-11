// tandava main d8c1b43, bundled single file (dashboard deploy 2026-11-11)
// supabase/functions/stripe-portal/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// supabase/functions/stripe-portal/handler.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

// supabase/functions/_shared/urls.ts
function safeReturnUrl(candidate, fallback, appUrl2) {
  if (typeof candidate !== "string" || candidate.length === 0 || candidate.length > 2048) return fallback;
  let app;
  try {
    app = new URL(appUrl2);
  } catch {
    return fallback;
  }
  if (candidate.startsWith("/") && !candidate.startsWith("//") && !candidate.includes("\\")) {
    try {
      const url2 = new URL(candidate, app);
      return url2.origin === app.origin && !url2.username && !url2.password ? url2.href : fallback;
    } catch {
      return fallback;
    }
  }
  let url;
  try {
    url = new URL(candidate);
  } catch {
    return fallback;
  }
  if (url.username || url.password) return fallback;
  const isLocal = app.hostname === "localhost" || app.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) return fallback;
  const sameHost = url.hostname === app.hostname && url.port === app.port;
  const subdomain = !isLocal && url.hostname.endsWith("." + app.hostname) && url.port === app.port;
  return sameHost || subdomain ? url.href : fallback;
}

// supabase/functions/stripe-portal/handler.ts
var stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: "2024-06-20"
});
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
async function handlePortal(req, nativePortal = false) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const {
    data: { user },
    error: userError
  } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "Not authenticated" }, 401);
  let payload = {};
  try {
    payload = await req.json();
  } catch {
  }
  const studioId = String(payload.studioId ?? "");
  const membershipId = typeof payload.membershipId === "string" ? payload.membershipId : "";
  if (nativePortal && !membershipId) return json({ error: "Choose the membership to manage" }, 400);
  const returnUrl = nativePortal ? `${appUrl}/checkout/return?app=${payload.nativeApp === "studio" ? "studio" : "member"}&billing=1` : safeReturnUrl(payload.returnUrl, `${appUrl}/account`, appUrl);
  const db = createClient(supabaseUrl, serviceKey);
  try {
    let query = db.from("memberships").select("stripe_subscription_id, studio_id, purchase_scope").eq("profile_id", user.id).not("stripe_subscription_id", "is", null).order("created_at", { ascending: false }).limit(1);
    if (studioId) query = query.eq("studio_id", studioId);
    if (membershipId) query = query.eq("id", membershipId);
    const { data: membership } = await query.maybeSingle();
    if (!membership?.stripe_subscription_id) {
      return json({ error: "No active subscription found" }, 404);
    }
    let configurationId;
    if (nativePortal) {
      if (membership.purchase_scope !== "in_person") return json({ error: "Only in-person memberships can be managed here" }, 409);
      configurationId = Deno.env.get("NATIVE_BILLING_PORTAL_CONFIGURATION");
      if (!configurationId) return json({ error: "In-app billing management is not available yet" }, 503);
      const configuration = await stripe.billingPortal.configurations.retrieve(configurationId);
      if (!configuration.active || configuration.features.subscription_update?.enabled !== false || configuration.features.subscription_cancel?.enabled !== true) {
        return json({ error: "In-app billing management is not available yet" }, 503);
      }
    }
    const subscription = await stripe.subscriptions.retrieve(
      membership.stripe_subscription_id
    );
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      ...configurationId ? { configuration: configurationId } : {},
      return_url: returnUrl
    });
    return json({ url: session.url });
  } catch (err) {
    console.error("[stripe-portal] error:", err);
    return json({ error: err.message ?? "Portal failed" }, 500);
  }
}

// supabase/functions/stripe-portal/index.ts
serve((request) => handlePortal(request));
