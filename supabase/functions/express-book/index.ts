/**
 * Express Booking (Supabase Edge Function) — PRD-020
 *
 * The login-free booking path. An anonymous visitor posts name, email, phone and
 * an occurrence; they get a confirmed booking (or a Stripe Checkout URL) without
 * creating a password or leaving the page.
 *
 * Why this is a function and not an anon-callable RPC: a guest needs a real
 * identity, because `bookings.profile_id` references `auth.users`. Creating an
 * auth user requires the service role, which must never reach the browser. The
 * service role is also why every decision here is deliberately conservative:
 * this endpoint is reachable by anyone on the internet and writes to a studio's
 * member list.
 *
 * Request (POST):
 *   {
 *     slug: string,              // studio slug, must be discoverable
 *     occurrenceId: string,
 *     firstName, lastName, email: string,
 *     phone?: string,
 *     marketingConsent?: boolean,
 *     waiverAccepted?: boolean,
 *     utm?: { source?, medium?, campaign? }
 *   }
 *
 * Response:
 *   { outcome: "booked" | "waitlisted", bookingId, waitlistPosition? }
 *   { outcome: "pending_payment", checkoutUrl }
 *   { outcome: "continue_link_sent" }        // email already had an account
 *   { outcome: "rejected", reason, message } // 409
 *   { outcome: "rate_limited", message }     // 429
 *   { error, fields? }                       // 400 for malformed input
 *
 * The decision rules live in `src/lib/booking/express.ts` and are imported here
 * rather than copied, so the branch that refuses to book into an existing
 * account cannot drift from the branch the tests cover. That import crosses out
 * of `supabase/functions/`, so verify `supabase functions deploy express-book`
 * bundles it before relying on this in production (PRD-020 lists this as a
 * launch gate).
 *
 * Deploy: supabase functions deploy express-book --no-verify-jwt
 *   --no-verify-jwt is REQUIRED: the caller is anonymous by design.
 *
 * Secrets:
 *   supabase secrets set STRIPE_SECRET_KEY=sk_...
 *   supabase secrets set APP_URL=https://yourstudio.com
 *   supabase secrets set EXPRESS_IP_SALT=<random>       # rate-limit hashing
 *   supabase secrets set PLATFORM_FEE_BPS=0             # optional
 *
 * NOTE: integration-test against a live project before production use.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

import {
  validateGuestInput,
  decideExpressBooking,
  rejectMessage,
  guestFieldMessage,
  type ExpressGuest,
  type ExpressOccurrence,
} from "../../../src/lib/booking/express.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:8080";
const ipSalt = Deno.env.get("EXPRESS_IP_SALT") ?? "";
const platformFeeBps = parseInt(Deno.env.get("PLATFORM_FEE_BPS") ?? "0", 10);

const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2024-06-20" }) : null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

/** Attempts allowed per email, and per source IP, within the window. */
const RATE_WINDOW_MINUTES = 60;
const MAX_PER_EMAIL = 6;
const MAX_PER_IP = 20;

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Salted hash of the client IP. We need "how many attempts from this source"
 * and nothing more, so the address itself is never stored. Without a configured
 * salt we skip IP limiting rather than store a trivially reversible hash of an
 * IPv4 address, and fall back to the per-email limit alone.
 */
async function hashIp(req: Request): Promise<string | null> {
  if (!ipSalt) return null;
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0].trim();
  if (!ip) return null;
  return await sha256Hex(`${ipSalt}:${ip}`);
}

// ---------------------------------------------------------------------------
// Guest identity
// ---------------------------------------------------------------------------

/**
 * Find the profile for an email, if any.
 *
 * Matching is on LOWER(email) to agree with `idx_profiles_email_lower`: a guest
 * who types `Ana@Example.com` on their second visit must resolve to the same
 * identity, not a second one.
 */
async function findProfileByEmail(
  db: SupabaseClient,
  email: string,
): Promise<{ id: string; is_guest: boolean } | null> {
  // Via the RPC rather than an `ilike` filter: PostgREST's ILIKE cannot use
  // idx_profiles_email_lower, so a filter here would full-scan profiles on every
  // booking attempt. The RPC's predicate matches the index expression.
  const { data, error } = await db.rpc("get_profile_identity_by_email", { p_email: email });
  if (error) {
    console.error("express-book: identity lookup failed", error);
    throw error;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { id: row.profile_id as string, is_guest: Boolean(row.is_guest) };
}

/**
 * Create a passwordless auth user plus its profile, and attach it to the studio
 * as a member. The guest can later claim the account by setting a password on
 * the same address.
 *
 * `email_confirm: false` is deliberate: the booking confirmation email is the
 * verification, and demanding a confirmation click before the booking exists
 * would reintroduce exactly the round-trip this feature removes. The account
 * holds nothing sensitive until it is claimed.
 */
async function createGuestIdentity(
  db: SupabaseClient,
  guest: ExpressGuest,
  studioId: string,
  waiverAccepted: boolean,
): Promise<{ profileId: string } | { error: string }> {
  const { data: created, error: authError } = await db.auth.admin.createUser({
    email: guest.email,
    email_confirm: false,
    user_metadata: {
      first_name: guest.firstName,
      last_name: guest.lastName,
      created_via: "express_booking",
    },
  });
  if (authError || !created?.user) {
    // A race with a concurrent claim on the same address lands here; resolve to
    // the identity that won rather than failing the booking.
    const existing = await findProfileByEmail(db, guest.email);
    if (existing) return { profileId: existing.id };
    return { error: authError?.message ?? "Could not create guest account" };
  }

  const profileId = created.user.id;

  // A handle_new_user trigger may already have inserted the profile row, so
  // upsert rather than insert and fill in what express booking knows.
  const { error: profileError } = await db.from("profiles").upsert(
    {
      id: profileId,
      first_name: guest.firstName,
      last_name: guest.lastName,
      display_name: guest.displayName,
      email: guest.email,
      phone: guest.phone,
      is_guest: true,
    },
    { onConflict: "id" },
  );
  if (profileError) return { error: profileError.message };

  const { error: memberError } = await db.from("studio_members").upsert(
    {
      studio_id: studioId,
      profile_id: profileId,
      tags: ["express-booking"],
      waiver_signed_at: waiverAccepted ? new Date().toISOString() : null,
    },
    { onConflict: "studio_id,profile_id" },
  );
  if (memberError) return { error: memberError.message };

  return { profileId };
}

// ---------------------------------------------------------------------------
// Continue link (the account-exists path)
// ---------------------------------------------------------------------------

/**
 * Email a signed link to an address that already has an account, instead of
 * booking. Anyone can type anyone's email into a public form, so the only safe
 * response is one that requires control of the mailbox.
 *
 * Only the token's hash is stored: a database read cannot be turned into
 * someone else's booking session.
 */
async function sendContinueLink(
  db: SupabaseClient,
  email: string,
  slug: string,
  occurrenceId: string,
): Promise<{ tokenHash: string; expiresAt: string }> {
  const raw = crypto.randomUUID() + crypto.randomUUID();
  const tokenHash = await sha256Hex(raw);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const url = `${appUrl}/s/${encodeURIComponent(slug)}/book/${encodeURIComponent(occurrenceId)}?continue=${raw}`;

  // Best effort: a mail provider outage must not strand the visitor with a
  // booking that silently did not happen. The response is the same either way,
  // and the claim row records the attempt.
  try {
    await db.functions.invoke("email", {
      body: {
        to: email,
        template: "express_continue",
        data: { url, expires_minutes: 30 },
      },
    });
  } catch (err) {
    console.error("express-book: continue link email failed", err);
  }

  return { tokenHash, expiresAt };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const payload = await req.json().catch(() => ({}));
    const slug = String(payload.slug ?? "").trim();
    const occurrenceId = String(payload.occurrenceId ?? "").trim();
    if (!slug || !occurrenceId) return json({ error: "Missing slug or occurrenceId" }, 400);

    // --- 1. Validate the guest's input -----------------------------------
    const validation = validateGuestInput(payload);
    if (validation.status === "invalid") {
      return json(
        {
          error: "Please check the highlighted fields.",
          fields: validation.errors.map((code) => ({ code, message: guestFieldMessage(code) })),
        },
        400,
      );
    }
    const guest = validation.guest;

    // --- 2. Load the occurrence ------------------------------------------
    // Via the same public function the page uses, so the function cannot act on
    // an occurrence the page could not legitimately have shown.
    const { data: rows, error: occError } = await db.rpc("get_public_occurrence", {
      p_slug: slug,
      p_occurrence_id: occurrenceId,
    });
    if (occError) {
      console.error("express-book: occurrence lookup failed", occError);
      return json({ error: "Could not load that class" }, 500);
    }
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row) return json({ error: "Class not found" }, 404);

    const occurrence: ExpressOccurrence = {
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
      waitlistEnabled: Boolean(row.express_waitlist_enabled),
    };

    const { data: studioRow } = await db.from("studios").select("id").eq("slug", slug).single();
    const studioId = studioRow?.id as string | undefined;
    if (!studioId) return json({ error: "Class not found" }, 404);

    const ipHash = await hashIp(req);
    const utm = (payload.utm ?? {}) as Record<string, string | undefined>;
    // First-party attribution (PRD-024). Both optional; both validated.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const visitorId = typeof payload.visitorId === "string" && UUID_RE.test(payload.visitorId) ? payload.visitorId : null;
    const sessionId = typeof payload.sessionId === "string" && UUID_RE.test(payload.sessionId) ? payload.sessionId : null;

    /** Attribution and consent are best effort: they must never fail a booking. */
    const recordAttribution = async (profileId: string, bookingId: string | null, valueCents: number) => {
      try {
        if (visitorId) await db.rpc("link_visitor", { p_profile_id: profileId, p_visitor_id: visitorId, p_via: "express_booking" });
        await db.rpc("record_consent", {
          p_studio_id: studioId, p_profile_id: profileId, p_visitor_id: visitorId,
          p_purpose: "email_marketing", p_granted: guest.marketingConsent, p_source: "express_booking_form",
          p_policy_version: "2026-10",
        });
        if (bookingId) {
          await db.rpc("record_conversion", {
            p_studio_id: studioId, p_profile_id: profileId, p_visitor_id: visitorId,
            p_conversion_type: "guest_booking", p_value_cents: valueCents, p_currency: row.studio_currency ?? "USD",
            p_entity_type: "booking", p_entity_id: bookingId, p_converting_session_id: sessionId,
            p_member_source: "express",
          });
        }
      } catch (err) {
        console.error("express-book: attribution failed", err);
      }
    };

    /** Record the attempt. Every exit path writes exactly one claim row. */
    const recordClaim = async (fields: Record<string, unknown>) => {
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
        waiver_accepted_at: guest.waiverAccepted ? new Date().toISOString() : null,
        ...fields,
      });
      // A failed audit write must not silently become a successful booking that
      // nobody can account for, so it is logged loudly.
      if (error) console.error("express-book: claim insert failed", error);
    };

    // --- 3. Throttle ------------------------------------------------------
    const { data: counts } = await db.rpc("count_recent_express_claims", {
      p_email: guest.email,
      p_ip_hash: ipHash,
      p_window_minutes: RATE_WINDOW_MINUTES,
    });
    const countRow = Array.isArray(counts) ? counts[0] : counts;
    const emailAttempts = countRow?.email_attempts ?? 0;
    const ipAttempts = countRow?.ip_attempts ?? 0;
    if (emailAttempts >= MAX_PER_EMAIL || (ipHash && ipAttempts >= MAX_PER_IP)) {
      await recordClaim({ outcome: "rate_limited" });
      return json(
        {
          outcome: "rate_limited",
          message: "Too many booking attempts. Wait a few minutes, or contact the studio directly.",
        },
        429,
      );
    }

    // --- 4. Establish the facts the decision needs ------------------------
    const existingProfile = await findProfileByEmail(db, guest.email);
    // A guest profile is NOT an "existing account": it has no password, so there
    // is nothing to protect and no sign-in the visitor could complete. Only a
    // claimed account diverts to the emailed link.
    const accountExists = Boolean(existingProfile && !existingProfile.is_guest);

    let alreadyClaimed = false;
    if (existingProfile) {
      const { data: live } = await db
        .from("bookings")
        .select("id")
        .eq("class_occurrence_id", occurrenceId)
        .eq("profile_id", existingProfile.id)
        .not("status", "in", "(cancelled,late_cancel)")
        .maybeSingle();
      alreadyClaimed = Boolean(live);
    }

    // --- 5. Decide --------------------------------------------------------
    const decision = decideExpressBooking({
      occurrence,
      guest,
      now: new Date(),
      accountExists,
      alreadyClaimed,
    });

    if (decision.action === "reject") {
      await recordClaim({
        outcome: "rejected",
        reject_reason: decision.reason,
        profile_id: existingProfile?.id ?? null,
      });
      return json(
        { outcome: "rejected", reason: decision.reason, message: rejectMessage(decision.reason) },
        409,
      );
    }

    if (decision.action === "email_continue_link") {
      const { tokenHash, expiresAt } = await sendContinueLink(db, guest.email, slug, occurrenceId);
      await recordClaim({
        outcome: "continue_link_sent",
        profile_id: existingProfile?.id ?? null,
        continue_token_hash: tokenHash,
        continue_token_expires_at: expiresAt,
      });
      return json({
        outcome: "continue_link_sent",
        message: "Check your email. We sent you a link to finish booking this class.",
      });
    }

    // --- 6. Act -----------------------------------------------------------
    let profileId = existingProfile?.id;
    if (!profileId) {
      const identity = await createGuestIdentity(db, guest, studioId, guest.waiverAccepted);
      if ("error" in identity) {
        console.error("express-book: identity creation failed", identity.error);
        return json({ error: "Could not complete your booking. Try again in a moment." }, 500);
      }
      profileId = identity.profileId;
    }

    // Paid drop-in: the booking is created by the existing stripe-webhook when
    // payment succeeds. The metadata shape is the drop_in contract that webhook
    // already understands, so no webhook change is needed to support guests.
    if (decision.requiresPayment) {
      if (!stripe) {
        console.error("express-book: STRIPE_SECRET_KEY not configured");
        return json({ error: "This studio cannot take card payments yet." }, 503);
      }

      const { data: studio } = await db
        .from("studios")
        .select("currency, stripe_account_id, stripe_onboarding_complete")
        .eq("id", studioId)
        .single();
      const connected =
        studio?.stripe_account_id && studio?.stripe_onboarding_complete
          ? (studio.stripe_account_id as string)
          : null;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: guest.email,
        line_items: [
          {
            price_data: {
              currency: (studio?.currency as string | undefined)?.toLowerCase() ?? "usd",
              unit_amount: decision.amountCents,
              product_data: { name: `Drop-in: ${row.offering_name ?? "Class"}` },
            },
            quantity: 1,
          },
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
          ...(visitorId ? { visitor_id: visitorId } : {}),
          ...(sessionId ? { session_id: sessionId } : {}),
        },
        ...(connected
          ? {
              payment_intent_data: {
                application_fee_amount: Math.round((decision.amountCents * platformFeeBps) / 10000),
                transfer_data: { destination: connected },
              },
            }
          : {}),
      });

      await recordAttribution(profileId, null, 0);
      await recordClaim({
        outcome: "pending_payment",
        profile_id: profileId,
        amount_cents: decision.amountCents,
        stripe_checkout_session_id: session.id,
      });

      return json({ outcome: "pending_payment", checkoutUrl: session.url });
    }

    // Free class or waitlist: book now. create_guest_booking re-checks capacity
    // under a row lock, so its placement overrides the decision's intent when
    // the last spot went to somebody else between page load and submit.
    const { data: booking, error: bookError } = await db.rpc("create_guest_booking", {
      p_occurrence_id: occurrenceId,
      p_profile_id: profileId,
      p_transaction_id: null,
    });
    if (bookError) {
      console.error("express-book: create_guest_booking failed", bookError);
      return json({ error: "Could not complete your booking. Try again in a moment." }, 500);
    }
    const created = Array.isArray(booking) ? booking[0] : booking;
    const outcome = created?.status === "waitlisted" ? "waitlisted" : "booked";

    await recordClaim({ outcome, profile_id: profileId, booking_id: created?.id ?? null });
    await recordAttribution(profileId, outcome === "booked" ? created?.id ?? null : null, 0);

    return json({
      outcome,
      bookingId: created?.id ?? null,
      waitlistPosition: created?.waitlist_position ?? null,
    });
  } catch (err) {
    console.error("express-book: unhandled error", err);
    return json({ error: "Could not complete your booking. Try again in a moment." }, 500);
  }
});
