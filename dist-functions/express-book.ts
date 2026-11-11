// tandava main d8c1b43, bundled single file (dashboard deploy 2026-11-11)
// supabase/functions/express-book/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// supabase/functions/email/provider.ts
function displayName(name) {
  return name.replace(/["<>\r\n]/g, "").slice(0, 80);
}
function createResendProvider() {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") || "noreply@tandava.yoga";
  const fromName = Deno.env.get("EMAIL_FROM_NAME") || "Tandava";
  return {
    name: "resend",
    async send(message) {
      if (!apiKey) return { success: false, error: "RESEND_API_KEY not set", provider: "resend" };
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `${displayName(message.fromName ?? fromName)} <${from}>`,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          reply_to: message.replyTo,
          headers: message.headers,
          tags: message.tags ? Object.entries(message.tags).map(([name, value]) => ({ name, value })) : void 0
        })
      });
      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err, provider: "resend" };
      }
      const data = await response.json();
      return { success: true, messageId: data.id, provider: "resend" };
    }
  };
}
function createSendGridProvider() {
  const apiKey = Deno.env.get("SENDGRID_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") || "noreply@tandava.yoga";
  const fromName = Deno.env.get("EMAIL_FROM_NAME") || "Tandava";
  return {
    name: "sendgrid",
    async send(message) {
      if (!apiKey) return { success: false, error: "SENDGRID_API_KEY not set", provider: "sendgrid" };
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: message.to }] }],
          from: { email: from, name: displayName(message.fromName ?? fromName) },
          headers: message.headers,
          reply_to: message.replyTo ? { email: message.replyTo } : void 0,
          subject: message.subject,
          content: [
            ...message.text ? [{ type: "text/plain", value: message.text }] : [],
            { type: "text/html", value: message.html }
          ]
        })
      });
      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err, provider: "sendgrid" };
      }
      const messageId = response.headers.get("x-message-id") || void 0;
      return { success: true, messageId, provider: "sendgrid" };
    }
  };
}
function createSMTPProvider() {
  return {
    name: "smtp",
    async send(message) {
      const relayUrl = Deno.env.get("SMTP_RELAY_URL");
      const from = Deno.env.get("EMAIL_FROM") || "noreply@tandava.yoga";
      if (!relayUrl) {
        return { success: false, error: "SMTP_RELAY_URL not configured", provider: "smtp" };
      }
      const response = await fetch(relayUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: message.fromName ? `${displayName(message.fromName)} <${from}>` : from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          replyTo: message.replyTo,
          headers: message.headers
        })
      });
      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err, provider: "smtp" };
      }
      return { success: true, provider: "smtp" };
    }
  };
}
function createConsoleProvider() {
  return {
    name: "console",
    async send(message) {
      console.log("=== EMAIL (console provider) ===");
      console.log(`To: ${message.to}`);
      console.log(`Subject: ${message.subject}`);
      console.log(`Body: ${message.text || message.html.substring(0, 200)}...`);
      console.log("================================");
      return { success: true, messageId: `console-${Date.now()}`, provider: "console" };
    }
  };
}
function getProvider() {
  const provider = (Deno.env.get("EMAIL_PROVIDER") || "console").toLowerCase();
  switch (provider) {
    case "resend":
      return createResendProvider();
    case "sendgrid":
      return createSendGridProvider();
    case "smtp":
      return createSMTPProvider();
    case "console":
    default:
      return createConsoleProvider();
  }
}
function emailProviderName() {
  return getProvider().name;
}
function emailProviderReady() {
  const name = emailProviderName();
  const required = { resend: "RESEND_API_KEY", sendgrid: "SENDGRID_API_KEY", smtp: "SMTP_RELAY_URL" };
  const key2 = required[name];
  if (!key2) return { ready: false, reason: "email_provider_not_configured" };
  if (!Deno.env.get(key2)) return { ready: false, reason: `${key2.toLowerCase()}_missing` };
  return { ready: true };
}
async function sendEmail(message) {
  const provider = getProvider();
  try {
    return await provider.send(message);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[email] ${provider.name} failed:`, errorMsg);
    return { success: false, error: errorMsg, provider: provider.name, uncertain: true };
  }
}

// src/lib/marketing/unsubscribeToken.ts
var enc = new TextEncoder();
function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function key(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
var OPT_IN_LINK_TTL_MS = 14 * 24 * 60 * 60 * 1e3;
async function signOptInConfirm(studioId, profileId, secret, now = Date.now()) {
  if (!secret) throw new Error("unsubscribe secret missing");
  const payload = enc.encode(`optin:${studioId}:${profileId}:${now}`);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await key(secret), payload));
  return `${b64url(payload)}.${b64url(sig)}`;
}

// src/lib/marketing/optInEmail.ts
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function renderOptInConfirmEmail(i) {
  const studio = escapeHtml(i.studioName);
  const url = escapeHtml(i.confirmUrl);
  const subject = `Confirm email updates from ${i.studioName}`;
  const text = [
    `You asked ${i.studioName} to send you occasional emails about classes and offers.`,
    `Confirm here (the link works for 14 days): ${i.confirmUrl}`,
    `Didn't ask for this? Ignore this email and you won't get any.`
  ].join("\n\n");
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:24px;background:#f6f5f2;font-family:Helvetica,Arial,sans-serif;color:#1d1d1f;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:28px;">
<tr><td style="font-size:16px;line-height:1.6;">
<p style="margin:0 0 14px;">You asked ${studio} to send you occasional emails about classes and offers.</p>
<p style="margin:0 0 20px;">Tap below to confirm. The link works for 14 days.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#1d1d1f;border-radius:8px;padding:12px 24px;">
<a href="${url}" style="color:#ffffff;text-decoration:none;font-weight:600;">Yes, send me updates</a></td></tr></table>
<p style="margin:20px 0 0;font-size:13px;color:#6e6e73;">Didn't ask for this? Ignore this email and you won't get any.</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, html, text };
}

// supabase/functions/express-book/index.ts
import Stripe from "https://esm.sh/stripe@14?target=deno";

// src/lib/booking/express.ts
var EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
var PHONE_DIGITS_RE = /^\+?\d{7,15}$/;
var trim = (v) => typeof v === "string" ? v.trim() : "";
function normalizePhone(raw) {
  const s = trim(raw);
  if (!s) return null;
  const plus = s.startsWith("+");
  const digits = s.replace(/\D/g, "");
  if (!digits) return null;
  return (plus ? "+" : "") + digits;
}
function normalizeEmail(raw) {
  return trim(raw).toLowerCase();
}
function validateGuestInput(input) {
  const errors = [];
  const firstName = trim(input.firstName);
  const lastName = trim(input.lastName);
  const email = normalizeEmail(input.email);
  const rawPhone = trim(input.phone);
  const phone = normalizePhone(rawPhone);
  if (!firstName) errors.push("first_name_required");
  if (!lastName) errors.push("last_name_required");
  if (!email) {
    errors.push("email_required");
  } else if (!EMAIL_RE.test(email)) {
    errors.push("email_invalid");
  }
  if (rawPhone && (!phone || !PHONE_DIGITS_RE.test(phone))) {
    errors.push("phone_invalid");
  }
  if (errors.length > 0) return { status: "invalid", errors };
  return {
    status: "valid",
    guest: {
      firstName,
      lastName,
      email,
      phone,
      displayName: `${firstName} ${lastName}`.trim(),
      marketingConsent: input.marketingConsent === true,
      waiverAccepted: input.waiverAccepted === true
    }
  };
}
function minutesUntilStart(startsAt, now) {
  const start = new Date(startsAt).getTime();
  if (!Number.isFinite(start)) return Number.NaN;
  return (start - now.getTime()) / 6e4;
}
function checkOccurrenceEligibility(occurrence, now) {
  const spotsLeft = Math.max(0, (occurrence.capacity ?? 0) - (occurrence.bookedCount ?? 0));
  if (!occurrence.expressBookingEnabled) {
    return { eligible: false, reason: "express_disabled", spotsLeft };
  }
  if (occurrence.isCancelled) {
    return { eligible: false, reason: "cancelled", spotsLeft };
  }
  const mins = minutesUntilStart(occurrence.startsAt, now);
  if (!Number.isFinite(mins) || mins <= 0) {
    return { eligible: false, reason: "already_started", spotsLeft };
  }
  const cutoff = Math.max(0, occurrence.bookingCutoffMinutes ?? 0);
  if (mins < cutoff) {
    return { eligible: false, reason: "cutoff_passed", spotsLeft };
  }
  if (spotsLeft <= 0) {
    if (!occurrence.waitlistEnabled) {
      return { eligible: false, reason: "full", spotsLeft };
    }
    return { eligible: true, placement: "waitlisted", spotsLeft };
  }
  return { eligible: true, placement: "confirmed", spotsLeft };
}
function decideExpressBooking(ctx) {
  const { occurrence, guest, now, accountExists, alreadyClaimed } = ctx;
  const eligibility = checkOccurrenceEligibility(occurrence, now);
  if (!eligibility.eligible) {
    return { action: "reject", reason: eligibility.reason };
  }
  const placement = eligibility.placement;
  if (accountExists) {
    return { action: "email_continue_link", reason: "account_exists" };
  }
  if (alreadyClaimed) {
    return { action: "reject", reason: "duplicate_claim" };
  }
  if (occurrence.waiverRequired && !guest.waiverAccepted) {
    return { action: "reject", reason: "waiver_not_accepted" };
  }
  if (placement === "waitlisted") {
    return { action: "book", placement, requiresPayment: false, amountCents: 0 };
  }
  const price = occurrence.dropInPriceCents;
  if (price === null || price === void 0) {
    return { action: "reject", reason: "not_priced" };
  }
  if (price <= 0) {
    return { action: "book", placement, requiresPayment: false, amountCents: 0 };
  }
  return { action: "book", placement, requiresPayment: true, amountCents: price };
}
function rejectMessage(reason) {
  switch (reason) {
    case "express_disabled":
      return "This studio asks you to sign in before booking. Create an account or sign in to continue.";
    case "cancelled":
      return "This class was cancelled. Pick another time on the schedule.";
    case "already_started":
      return "This class has already started. Pick another time on the schedule.";
    case "cutoff_passed":
      return "Online booking for this class has closed. Contact the studio to be added at the door.";
    case "full":
      return "This class is full and the waitlist is closed. Pick another time on the schedule.";
    case "not_priced":
      return "This class is not available for drop-in booking. Sign in with a membership or class pack to book it.";
    case "duplicate_claim":
      return "You are already booked for this class. Check your email for the confirmation.";
    case "waiver_not_accepted":
      return "This studio requires you to accept the waiver before your first class.";
  }
}
function guestFieldMessage(error) {
  switch (error) {
    case "first_name_required":
      return "Enter your first name.";
    case "last_name_required":
      return "Enter your last name.";
    case "email_required":
      return "Enter your email so we can send your confirmation.";
    case "email_invalid":
      return "That email does not look right. Check it and try again.";
    case "phone_invalid":
      return "That phone number does not look right, or leave it blank.";
  }
}

// supabase/functions/express-book/index.ts
var supabaseUrl = Deno.env.get("SUPABASE_URL");
var serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
var appUrl = Deno.env.get("APP_URL") ?? "http://localhost:8080";
var ipSalt = Deno.env.get("EXPRESS_IP_SALT") ?? "";
var optInSecret = Deno.env.get("AUTOMATIONS_UNSUBSCRIBE_SECRET") ?? "";
var platformFeeBps = parseInt(Deno.env.get("PLATFORM_FEE_BPS") ?? "0", 10);
var stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
var stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2024-06-20" }) : null;
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
var RATE_WINDOW_MINUTES = 60;
var MAX_PER_EMAIL = 6;
var MAX_PER_IP = 20;
var OPT_IN_EMAIL_TIMEOUT_MS = 3e3;
async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function hashIp(req) {
  if (!ipSalt) return null;
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0].trim();
  if (!ip) return null;
  return await sha256Hex(`${ipSalt}:${ip}`);
}
async function findProfileByEmail(db, email) {
  const { data, error } = await db.rpc("get_profile_identity_by_email", { p_email: email });
  if (error) {
    console.error("express-book: identity lookup failed", error);
    throw error;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { id: row.profile_id, is_guest: Boolean(row.is_guest) };
}
async function createGuestIdentity(db, guest, studioId, waiverAccepted) {
  const { data: created, error: authError } = await db.auth.admin.createUser({
    email: guest.email,
    email_confirm: false,
    user_metadata: {
      first_name: guest.firstName,
      last_name: guest.lastName,
      created_via: "express_booking"
    }
  });
  if (authError || !created?.user) {
    const existing = await findProfileByEmail(db, guest.email);
    if (existing) return { profileId: existing.id };
    return { error: authError?.message ?? "Could not create guest account" };
  }
  const profileId = created.user.id;
  const { error: profileError } = await db.from("profiles").upsert(
    {
      id: profileId,
      first_name: guest.firstName,
      last_name: guest.lastName,
      display_name: guest.displayName,
      email: guest.email,
      phone: guest.phone,
      is_guest: true
    },
    { onConflict: "id" }
  );
  if (profileError) return { error: profileError.message };
  const { error: memberError } = await db.from("studio_members").upsert(
    {
      studio_id: studioId,
      profile_id: profileId,
      tags: ["express-booking"],
      waiver_signed_at: waiverAccepted ? (/* @__PURE__ */ new Date()).toISOString() : null
    },
    { onConflict: "studio_id,profile_id" }
  );
  if (memberError) return { error: memberError.message };
  return { profileId };
}
async function sendContinueLink(db, email, slug, occurrenceId) {
  const next = `/s/${encodeURIComponent(slug)}/book/${encodeURIComponent(occurrenceId)}`;
  const url = `${appUrl}/auth/login?next=${encodeURIComponent(next)}`;
  try {
    const { error } = await db.functions.invoke("email", {
      body: {
        to: email,
        template: "express_continue",
        data: { url }
      }
    });
    if (error) console.error("express-book: continue link email failed");
  } catch {
    console.error("express-book: continue link email failed");
  }
}
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const db = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  try {
    const payload = await req.json().catch(() => ({}));
    const slug = String(payload.slug ?? "").trim();
    const occurrenceId = String(payload.occurrenceId ?? "").trim();
    if (!slug || !occurrenceId) return json({ error: "Missing slug or occurrenceId" }, 400);
    const validation = validateGuestInput(payload);
    if (validation.status === "invalid") {
      return json(
        {
          error: "Please check the highlighted fields.",
          fields: validation.errors.map((code) => ({ code, message: guestFieldMessage(code) }))
        },
        400
      );
    }
    const guest = validation.guest;
    const { data: rows, error: occError } = await db.rpc("get_public_occurrence", {
      p_slug: slug,
      p_occurrence_id: occurrenceId
    });
    if (occError) {
      console.error("express-book: occurrence lookup failed", occError);
      return json({ error: "Could not load that class" }, 500);
    }
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return json({ error: "Class not found" }, 404);
    const occurrence = {
      occurrenceId: row.occurrence_id,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      isCancelled: Boolean(row.is_cancelled),
      capacity: row.capacity ?? 0,
      bookedCount: row.booked_count ?? 0,
      dropInPriceCents: row.drop_in_price_cents ?? null,
      expressBookingEnabled: Boolean(row.express_booking_enabled),
      waiverRequired: Boolean(row.express_waiver_required),
      bookingCutoffMinutes: row.express_booking_cutoff_minutes ?? 0,
      waitlistEnabled: Boolean(row.express_waitlist_enabled)
    };
    const { data: studioRow } = await db.from("studios").select("id, name").eq("slug", slug).single();
    const studioId = studioRow?.id;
    const studioName = studioRow?.name ?? "the studio";
    if (!studioId) return json({ error: "Class not found" }, 404);
    const ipHash = await hashIp(req);
    const utm = payload.utm ?? {};
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let visitorId = typeof payload.visitorId === "string" && UUID_RE.test(payload.visitorId) ? payload.visitorId : null;
    const claimedSessionId = typeof payload.sessionId === "string" && UUID_RE.test(payload.sessionId) ? payload.sessionId : null;
    let sessionId = null;
    if (claimedSessionId && visitorId && studioId) {
      const { data: ownSession } = await db.from("analytics_sessions").select("id").eq("id", claimedSessionId).eq("studio_id", studioId).eq("visitor_id", visitorId).maybeSingle();
      sessionId = ownSession?.id ?? null;
    }
    const rpcChecked = async (fn, args) => {
      for (let attempt = 0; attempt < 3; attempt++) {
        const { error } = await db.rpc(fn, args);
        if (!error) return true;
        console.error(`express-book: ${fn} failed (attempt ${attempt + 1})`, error.message);
        await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
      }
      return false;
    };
    const requestOptInConfirmation = async (profileId2) => {
      if (!optInSecret) {
        console.error("express-book: AUTOMATIONS_UNSUBSCRIBE_SECRET not set; opt-in confirmation not sent");
        return;
      }
      const provider = emailProviderReady();
      if (!provider.ready) {
        console.error(`express-book: email provider can't deliver (${provider.reason}); opt-in confirmation not sent`);
        return;
      }
      try {
        const token = await signOptInConfirm(studioId, profileId2, optInSecret);
        const email = renderOptInConfirmEmail({
          studioName,
          confirmUrl: `${appUrl.replace(/\/+$/, "")}/email-updates?c=${encodeURIComponent(token)}`
        });
        const timedOut = /* @__PURE__ */ Symbol("timeout");
        const sent = await Promise.race([
          sendEmail({ to: guest.email, subject: email.subject, html: email.html, text: email.text, fromName: studioName }),
          new Promise((r) => setTimeout(() => r(timedOut), OPT_IN_EMAIL_TIMEOUT_MS))
        ]);
        if (sent === timedOut) console.error("express-book: opt-in confirmation email timed out");
        else if (!sent.success) console.error("express-book: opt-in confirmation email failed", sent.error);
      } catch (err) {
        console.error("express-book: opt-in confirmation failed", err);
      }
    };
    const recordAttribution = async (profileId2, bookingId, valueCents, bookedAt) => {
      try {
        if (guest.marketingConsent) {
          await requestOptInConfirmation(profileId2);
        } else {
          const consentSaved = await rpcChecked("record_consent", {
            p_studio_id: studioId,
            p_profile_id: profileId2,
            p_visitor_id: visitorId,
            p_purpose: "email_marketing",
            p_granted: false,
            p_source: "express_booking_form",
            p_policy_version: "2026-10"
          });
          if (!consentSaved) {
            console.error("express-book: CONSENT NOT SAVED", { studioId, profileId: profileId2, granted: false });
          }
        }
        if (visitorId) {
          await rpcChecked("link_visitor", { p_profile_id: profileId2, p_visitor_id: visitorId, p_via: "express_booking" });
        }
        if (bookingId) {
          const queued = await rpcChecked("record_conversion_or_queue", {
            p_args: {
              p_studio_id: studioId,
              p_profile_id: profileId2,
              p_visitor_id: visitorId,
              p_conversion_type: "guest_booking",
              p_value_cents: valueCents,
              p_currency: row.studio_currency ?? "USD",
              p_entity_type: "booking",
              p_entity_id: bookingId,
              p_converting_session_id: sessionId,
              // The booking's own commit time, not when this code got here.
              p_member_source: "express",
              p_occurred_at: bookedAt ?? (/* @__PURE__ */ new Date()).toISOString()
            }
          });
          if (!queued) console.error("express-book: CONVERSION NOT SAVED", { studioId, bookingId });
        }
      } catch (err) {
        console.error("express-book: attribution failed", err);
      }
    };
    const recordClaim = async (fields) => {
      const { error } = await db.from("express_booking_claims").insert({
        studio_id: studioId,
        class_occurrence_id: occurrenceId,
        email: guest.email,
        ip_hash: ipHash,
        user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
        utm_source: utm.source ?? null,
        utm_medium: utm.medium ?? null,
        utm_campaign: utm.campaign ?? null,
        marketing_consent: guest.marketingConsent,
        waiver_accepted_at: guest.waiverAccepted ? (/* @__PURE__ */ new Date()).toISOString() : null,
        ...fields
      });
      if (error) console.error("express-book: claim insert failed", error);
    };
    const { data: counts } = await db.rpc("count_recent_express_claims", {
      p_email: guest.email,
      p_ip_hash: ipHash,
      p_window_minutes: RATE_WINDOW_MINUTES
    });
    const countRow = Array.isArray(counts) ? counts[0] : counts;
    const emailAttempts = countRow?.email_attempts ?? 0;
    const ipAttempts = countRow?.ip_attempts ?? 0;
    if (emailAttempts >= MAX_PER_EMAIL || ipHash && ipAttempts >= MAX_PER_IP) {
      await recordClaim({ outcome: "rate_limited" });
      return json(
        {
          outcome: "rate_limited",
          message: "Too many booking attempts. Wait a few minutes, or contact the studio directly."
        },
        429
      );
    }
    const existingProfile = await findProfileByEmail(db, guest.email);
    const accountExists = Boolean(existingProfile && !existingProfile.is_guest);
    let alreadyClaimed = false;
    if (existingProfile) {
      const { data: live } = await db.from("bookings").select("id").eq("class_occurrence_id", occurrenceId).eq("profile_id", existingProfile.id).not("status", "in", "(cancelled,late_cancel)").maybeSingle();
      alreadyClaimed = Boolean(live);
    }
    const decision = decideExpressBooking({
      occurrence,
      guest,
      now: /* @__PURE__ */ new Date(),
      accountExists,
      alreadyClaimed
    });
    if (decision.action === "reject") {
      await recordClaim({
        outcome: "rejected",
        reject_reason: decision.reason,
        profile_id: existingProfile?.id ?? null
      });
      return json(
        { outcome: "rejected", reason: decision.reason, message: rejectMessage(decision.reason) },
        409
      );
    }
    if (decision.action === "email_continue_link") {
      await sendContinueLink(db, guest.email, slug, occurrenceId);
      await recordClaim({
        outcome: "continue_link_sent",
        profile_id: existingProfile?.id ?? null
      });
      return json({
        outcome: "continue_link_sent",
        message: "Check your email for a sign-in link, or sign in directly to finish booking."
      });
    }
    let profileId = existingProfile?.id;
    if (!profileId) {
      const identity = await createGuestIdentity(db, guest, studioId, guest.waiverAccepted);
      if ("error" in identity) {
        console.error("express-book: identity creation failed", identity.error);
        return json({ error: "Could not complete your booking. Try again in a moment." }, 500);
      }
      profileId = identity.profileId;
    }
    if (visitorId) {
      const { data: owner, error: ownerError } = await db.from("profile_visitors").select("profile_id").eq("visitor_id", visitorId).maybeSingle();
      if (ownerError || owner && owner.profile_id !== profileId) {
        visitorId = null;
        sessionId = null;
      }
    }
    if (decision.requiresPayment) {
      if (!stripe) {
        console.error("express-book: STRIPE_SECRET_KEY not configured");
        return json({ error: "This studio cannot take card payments yet." }, 503);
      }
      const { data: studio } = await db.from("studios").select("currency, stripe_account_id, stripe_onboarding_complete").eq("id", studioId).single();
      const connected = studio?.stripe_account_id && studio?.stripe_onboarding_complete ? studio.stripe_account_id : null;
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: guest.email,
        line_items: [
          {
            price_data: {
              currency: studio?.currency?.toLowerCase() ?? "usd",
              unit_amount: decision.amountCents,
              product_data: { name: `Drop-in: ${row.offering_name ?? "Class"}` }
            },
            quantity: 1
          }
        ],
        success_url: `${appUrl}/s/${encodeURIComponent(slug)}/book/${encodeURIComponent(occurrenceId)}?booked=1`,
        cancel_url: `${appUrl}/s/${encodeURIComponent(slug)}/book/${encodeURIComponent(occurrenceId)}?cancelled=1`,
        client_reference_id: profileId,
        metadata: {
          type: "drop_in",
          occurrence_id: occurrenceId,
          profile_id: profileId,
          studio_id: studioId,
          amount_cents: String(decision.amountCents),
          express: "1",
          // Carried to stripe-webhook, which records the paid conversion.
          ...visitorId ? { visitor_id: visitorId } : {},
          ...sessionId ? { session_id: sessionId } : {}
        },
        ...connected ? {
          payment_intent_data: {
            application_fee_amount: Math.round(decision.amountCents * platformFeeBps / 1e4),
            transfer_data: { destination: connected }
          }
        } : {}
      });
      await recordAttribution(profileId, null, 0);
      await recordClaim({
        outcome: "pending_payment",
        profile_id: profileId,
        amount_cents: decision.amountCents,
        stripe_checkout_session_id: session.id
      });
      return json({ outcome: "pending_payment", checkoutUrl: session.url });
    }
    const { data: booking, error: bookError } = await db.rpc("create_guest_booking", {
      p_occurrence_id: occurrenceId,
      p_profile_id: profileId,
      p_transaction_id: null
    });
    if (bookError) {
      console.error("express-book: create_guest_booking failed", bookError);
      return json({ error: "Could not complete your booking. Try again in a moment." }, 500);
    }
    const created = Array.isArray(booking) ? booking[0] : booking;
    const outcome = created?.status === "waitlisted" ? "waitlisted" : "booked";
    await recordClaim({ outcome, profile_id: profileId, booking_id: created?.id ?? null });
    if (outcome === "waitlisted" && created?.id) {
      if (sessionId || visitorId) {
        const ctx = {};
        if (sessionId) ctx.session_id = sessionId;
        if (visitorId) ctx.visitor_id = visitorId;
        let saved = false;
        for (let attempt = 0; attempt < 3 && !saved; attempt++) {
          const { error: ctxError } = await db.from("booking_attribution_context").update(ctx).eq("booking_id", created.id);
          saved = !ctxError;
          if (ctxError) await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
        }
        if (!saved) console.error("express-book: waitlist visit not saved; promotion will use the latest visit before it", created.id);
      }
    }
    await recordAttribution(profileId, outcome === "booked" ? created?.id ?? null : null, 0, created?.booked_at ?? created?.created_at ?? null);
    return json({
      outcome,
      bookingId: created?.id ?? null,
      waitlistPosition: created?.waitlist_position ?? null
    });
  } catch (err) {
    console.error("express-book: unhandled error", err);
    return json({ error: "Could not complete your booking. Try again in a moment." }, 500);
  }
});
export {
  sendContinueLink
};
