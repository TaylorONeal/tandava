// tandava main d8c1b43, bundled single file (dashboard deploy 2026-11-11)
// supabase/functions/stripe-checkout/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// supabase/functions/stripe-checkout/handler.ts
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

// supabase/functions/stripe-checkout/handler.ts
var stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: "2024-06-20"
});
var supabaseUrl = Deno.env.get("SUPABASE_URL");
var serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
var anonKey = Deno.env.get("SUPABASE_ANON_KEY");
var appUrl = Deno.env.get("APP_URL") ?? "http://localhost:8080";
var platformFeeBps = parseInt(Deno.env.get("PLATFORM_FEE_BPS") ?? "0", 10);
var connectMode = (Deno.env.get("STRIPE_CONNECT_MODE") ?? "platform").toLowerCase();
var PaymentsUnavailable = class extends Error {
};
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
function recurringFor(cycle) {
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
async function handleCheckout(req, nativePurchase = false) {
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
  if (userError || !user) {
    return json({ error: "Not authenticated" }, 401);
  }
  const profileId = user.id;
  const db = createClient(supabaseUrl, serviceKey);
  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const type = String(payload.type ?? "");
  if (nativePurchase && !["drop_in", "class_pack", "membership"].includes(type)) {
    return json({ error: "This purchase is not available in the app" }, 400);
  }
  const purchaseChannel = nativePurchase ? "native" : "web";
  const scopeUnavailable = () => json({ error: "Only confirmed in-person services can be purchased in the app" }, 409);
  const nativeReturn = `${appUrl}/checkout/return?app=${payload.nativeApp === "studio" ? "studio" : "member"}`;
  const successUrl = nativePurchase ? nativeReturn : safeReturnUrl(
    payload.successUrl,
    `${appUrl}/account?checkout=success`,
    appUrl
  );
  const cancelUrl = nativePurchase ? `${nativeReturn}&cancelled=1` : safeReturnUrl(
    payload.cancelUrl,
    `${appUrl}/schedule?checkout=cancelled`,
    appUrl
  );
  const idem = (target) => ({
    idempotencyKey: `${nativePurchase ? `native:${payload.nativeApp === "studio" ? "studio" : "member"}:` : ""}${profileId}:${type}:${target}:${Math.floor(Date.now() / 6e4)}`
  });
  try {
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const claimedVisitor = typeof payload.visitorId === "string" && UUID_RE.test(payload.visitorId) ? payload.visitorId : null;
    const claimedSession = typeof payload.sessionId === "string" && UUID_RE.test(payload.sessionId) ? payload.sessionId : null;
    const attributionFor = async (studioId) => {
      const out = {};
      if (claimedVisitor) {
        const { data: owner, error: ownerError } = await db.from("profile_visitors").select("profile_id").eq("visitor_id", claimedVisitor).maybeSingle();
        if (!ownerError && (!owner || owner.profile_id === profileId)) out.visitor_id = claimedVisitor;
      }
      if (claimedSession) {
        const { data: sess } = await db.from("analytics_sessions").select("id, visitor_id, profile_id").eq("id", claimedSession).eq("studio_id", studioId).maybeSingle();
        if (sess) {
          let mine = sess.profile_id === profileId || out.visitor_id && sess.visitor_id === out.visitor_id;
          if (!mine) {
            const { data: link } = await db.from("profile_visitors").select("visitor_id").eq("profile_id", profileId).eq("visitor_id", sess.visitor_id).maybeSingle();
            mine = Boolean(link);
          }
          if (mine) out.session_id = sess.id;
        }
      }
      return out;
    };
    const connectFor = async (studioId) => {
      const { data: studio } = await db.from("studios").select("stripe_account_id, stripe_charges_enabled, currency").eq("id", studioId).single();
      const currency = (studio?.currency ?? "USD").toLowerCase();
      if (connectMode === "direct") return { currency, connected: null };
      if (!studio?.stripe_account_id || !studio?.stripe_charges_enabled) {
        throw new PaymentsUnavailable("This studio cannot accept online payments yet.");
      }
      return { currency, connected: studio.stripe_account_id };
    };
    if (type === "drop_in") {
      const occurrenceId = String(payload.occurrenceId ?? payload.classId ?? "");
      if (!occurrenceId) return json({ error: "Missing occurrenceId" }, 400);
      const { data: occ } = await db.from("class_occurrences").select("id, studio_id, offering_id, is_cancelled").eq("id", occurrenceId).single();
      if (!occ) return json({ error: "Class not found" }, 404);
      if (occ.is_cancelled) return json({ error: "Class is cancelled" }, 409);
      const { data: existing } = await db.from("bookings").select("id").eq("class_occurrence_id", occurrenceId).eq("profile_id", profileId).not("status", "in", "(cancelled,late_cancel)").limit(1);
      if (existing && existing.length > 0) {
        return json({ error: "You are already booked for this class" }, 409);
      }
      const { data: offering } = await db.from("offerings").select("name, drop_in_price_cents, purchase_scope, is_active").eq("id", occ.offering_id).single();
      if (nativePurchase && (offering?.purchase_scope !== "in_person" || offering?.is_active === false)) return scopeUnavailable();
      const amount = offering?.drop_in_price_cents ?? 0;
      if (!amount) return json({ error: "Drop-in price not configured" }, 422);
      const { currency, connected } = await connectFor(occ.studio_id);
      const { error: holdError } = await userClient.rpc("hold_spot", { p_occurrence_id: occurrenceId });
      if (holdError) {
        const full = /full/i.test(holdError.message);
        const status = full || /already|too many|started|cancelled/i.test(holdError.message) ? 409 : 500;
        return json({ error: holdError.message }, status);
      }
      const session = await stripe.checkout.sessions.create({
        // Stripe requires >= 30 minutes; the 35 minute hold outlives the session by design.
        expires_at: Math.floor(Date.now() / 1e3) + 31 * 60,
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: amount,
              product_data: { name: `Drop-in: ${offering?.name ?? "Class"}` }
            },
            quantity: 1
          }
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: profileId,
        metadata: {
          type: "drop_in",
          purchase_scope: offering?.purchase_scope ?? "unknown",
          purchase_channel: purchaseChannel,
          occurrence_id: occurrenceId,
          profile_id: profileId,
          studio_id: occ.studio_id,
          ...await attributionFor(occ.studio_id),
          amount_cents: String(amount),
          platform_fee_cents: String(Math.round(amount * platformFeeBps / 1e4))
        },
        ...connected ? {
          payment_intent_data: {
            application_fee_amount: Math.round(amount * platformFeeBps / 1e4),
            transfer_data: { destination: connected }
          }
        } : {}
      }, idem(occurrenceId));
      return json({ url: session.url });
    }
    if (type === "membership") {
      const membershipTypeId = String(payload.membershipTypeId ?? payload.planId ?? "");
      if (!membershipTypeId) return json({ error: "Missing membershipTypeId" }, 400);
      const { data: mt } = await db.from("membership_types").select("name, price_cents, billing_cycle, trial_days, studio_id, is_active, purchase_scope").eq("id", membershipTypeId).single();
      if (!mt) return json({ error: "Membership plan not found" }, 404);
      if (nativePurchase && mt.purchase_scope !== "in_person") return scopeUnavailable();
      if (mt.is_active === false) return json({ error: "This membership is no longer on sale" }, 409);
      const { currency, connected } = await connectFor(mt.studio_id);
      const recurring = recurringFor(mt.billing_cycle);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: mt.price_cents,
              recurring,
              product_data: { name: mt.name, ...mt.purchase_scope === "in_person" ? { description: "In-person classes only. Online classes and recordings are not included." } : {} }
            },
            quantity: 1
          }
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: profileId,
        subscription_data: {
          ...mt.trial_days && mt.trial_days > 0 ? { trial_period_days: mt.trial_days } : {},
          metadata: {
            type: "membership",
            purchase_scope: mt.purchase_scope ?? "unknown",
            purchase_channel: purchaseChannel,
            membership_type_id: membershipTypeId,
            billing_cycle: mt.billing_cycle,
            profile_id: profileId,
            studio_id: mt.studio_id,
            ...await attributionFor(mt.studio_id)
          },
          ...connected ? {
            application_fee_percent: platformFeeBps / 100,
            transfer_data: { destination: connected }
          } : {}
        },
        metadata: {
          type: "membership",
          purchase_scope: mt.purchase_scope ?? "unknown",
          purchase_channel: purchaseChannel,
          membership_type_id: membershipTypeId,
          billing_cycle: mt.billing_cycle,
          profile_id: profileId,
          studio_id: mt.studio_id,
          ...await attributionFor(mt.studio_id)
        }
      }, idem(membershipTypeId));
      return json({ url: session.url });
    }
    if (type === "class_pack") {
      const classPackTypeId = String(
        payload.classPackTypeId ?? payload.planId ?? ""
      );
      if (!classPackTypeId) return json({ error: "Missing classPackTypeId" }, 400);
      const { data: pt } = await db.from("class_pack_types").select("name, price_cents, class_count, validity_days, studio_id, is_active, purchase_scope").eq("id", classPackTypeId).single();
      if (!pt) return json({ error: "Class pack not found" }, 404);
      if (nativePurchase && pt.purchase_scope !== "in_person") return scopeUnavailable();
      if (pt.is_active === false) return json({ error: "This class pack is no longer on sale" }, 409);
      const { currency, connected } = await connectFor(pt.studio_id);
      const amount = pt.price_cents;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: amount,
              product_data: {
                name: `${pt.name} (${pt.class_count} classes)`,
                ...pt.purchase_scope === "in_person" ? { description: "In-person classes only. Online classes and recordings are not included." } : {}
              }
            },
            quantity: 1
          }
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: profileId,
        metadata: {
          type: "class_pack",
          purchase_scope: pt.purchase_scope ?? "unknown",
          purchase_channel: purchaseChannel,
          class_pack_type_id: classPackTypeId,
          // Terms shown at checkout; fulfillment uses these, not the row as edited later (00042).
          class_count: String(pt.class_count),
          validity_days: String(pt.validity_days ?? 90),
          profile_id: profileId,
          studio_id: pt.studio_id,
          ...await attributionFor(pt.studio_id),
          platform_fee_cents: String(Math.round(amount * platformFeeBps / 1e4))
        },
        ...connected ? {
          payment_intent_data: {
            application_fee_amount: Math.round(amount * platformFeeBps / 1e4),
            transfer_data: { destination: connected }
          }
        } : {}
      }, idem(classPackTypeId));
      return json({ url: session.url });
    }
    if (type === "workshop") {
      const eventId = String(payload.eventId ?? "");
      if (!eventId) return json({ error: "Missing eventId" }, 400);
      const tierId = payload.tierId ? String(payload.tierId) : null;
      const paymentOption = String(payload.paymentOption ?? "full");
      const sessionNumbers = Array.isArray(payload.sessionNumbers) ? payload.sessionNumbers : [];
      const { data: ev } = await db.from("events").select(
        "id, studio_id, title, price_cents, member_price_cents, early_bird_price_cents, early_bird_ends_at, deposit_cents, capacity, registered_count, status, registration_opens_at, registration_closes_at"
      ).eq("id", eventId).single();
      if (!ev) return json({ error: "Event not found" }, 404);
      const nowMs = Date.now();
      if (["draft", "cancelled", "completed"].includes(ev.status)) {
        return json({ error: "Registration is closed" }, 409);
      }
      if (ev.registration_opens_at && nowMs < new Date(ev.registration_opens_at).getTime()) {
        return json({ error: "Registration is not open yet" }, 409);
      }
      if (ev.registration_closes_at && nowMs > new Date(ev.registration_closes_at).getTime()) {
        return json({ error: "Registration has closed" }, 409);
      }
      if ((ev.registered_count ?? 0) >= (ev.capacity ?? 0)) {
        return json({ error: "This event is full" }, 409);
      }
      const { data: existingReg } = await db.from("event_registrations").select("id, status").eq("event_id", eventId).eq("profile_id", profileId).maybeSingle();
      if (existingReg && existingReg.status !== "cancelled") {
        return json({ error: "You are already registered for this event" }, 409);
      }
      let tier = null;
      if (tierId) {
        const { data: t } = await db.from("event_pricing_tiers").select("price_cents, member_price_cents").eq("id", tierId).eq("event_id", eventId).single();
        if (!t) return json({ error: "Pricing tier not found" }, 404);
        tier = t;
      }
      const { data: activeMem } = await db.from("memberships").select("id").eq("profile_id", profileId).eq("studio_id", ev.studio_id).eq("status", "active").limit(1);
      const isMember = Boolean(activeMem && activeMem.length > 0);
      const regular = tier ? tier.price_cents : ev.price_cents;
      const memberPrice = tier ? tier.member_price_cents : ev.member_price_cents;
      const earlyBirdActive = !tier && ev.early_bird_price_cents != null && (!ev.early_bird_ends_at || nowMs <= new Date(ev.early_bird_ends_at).getTime());
      let applied = regular;
      if (earlyBirdActive) applied = Math.min(applied, ev.early_bird_price_cents);
      if (isMember && memberPrice != null) applied = Math.min(applied, memberPrice);
      const deposit = ev.deposit_cents;
      const useDeposit = paymentOption === "deposit" && deposit != null && deposit > 0 && deposit < applied;
      const dueNow = useDeposit ? deposit : applied;
      const balanceDue = useDeposit ? applied - deposit : 0;
      const { currency, connected } = await connectFor(ev.studio_id);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency,
              unit_amount: dueNow,
              product_data: {
                name: useDeposit ? `Deposit: ${ev.title}` : ev.title
              }
            },
            quantity: 1
          }
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: profileId,
        metadata: {
          type: "workshop",
          event_id: eventId,
          studio_id: ev.studio_id,
          ...await attributionFor(ev.studio_id),
          profile_id: profileId,
          tier_id: tierId ?? "",
          amount_cents: String(dueNow),
          balance_due_cents: String(balanceDue),
          session_numbers: sessionNumbers.join(",")
        },
        ...connected ? {
          payment_intent_data: {
            application_fee_amount: Math.round(dueNow * platformFeeBps / 1e4),
            transfer_data: { destination: connected }
          }
        } : {}
      }, idem(`${eventId}:${tierId ?? ""}:${paymentOption}`));
      return json({ url: session.url });
    }
    return json({ error: `Unknown checkout type: ${type}` }, 400);
  } catch (err) {
    if (err instanceof PaymentsUnavailable) return json({ error: err.message }, 409);
    console.error("[stripe-checkout] error:", err);
    return json({ error: err.message ?? "Checkout failed" }, 500);
  }
}

// supabase/functions/stripe-checkout/index.ts
serve((request) => handleCheckout(request));
