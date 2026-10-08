/**
 * run-automations (Supabase Edge Function): PRD-027 phase 1
 *
 * Sends the three phase-1 lifecycle emails (guest to member, first-visit
 * welcome, lapsed check-in). Called by pg_cron every hour; every decision is
 * made by src/lib/marketing/runner.ts + automations.ts (tested), this file only
 * loads facts, sends and records.
 *
 * Safety:
 *   - Caller must send the shared secret in `x-cron-secret`
 *     (AUTOMATIONS_CRON_SECRET). Deploy with --no-verify-jwt; the secret is
 *     the gate.
 *   - Nothing is sent unless AUTOMATIONS_ENABLED=true. Otherwise every call is
 *     a dry run that returns the plan.
 *   - A send is claimed in automation_sends BEFORE the email goes out (unique
 *     per person/automation/step/episode), so two overlapping runs can't
 *     double-send. A failed send is recorded as failed and not retried: a
 *     missed marketing email beats a duplicate one.
 *
 * Body (optional): { "studioId": "<uuid>", "dryRun": true }
 *
 * Deploy: supabase functions deploy run-automations --no-verify-jwt
 * Secrets: AUTOMATIONS_CRON_SECRET, AUTOMATIONS_UNSUBSCRIBE_SECRET,
 *          AUTOMATIONS_ENABLED=true (when ready), APP_URL, EMAIL_* (see email/)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { emailProviderReady, sendEmail } from "../email/provider.ts";
import { planStudio, formatAddress, type CandidateRow } from "../../../src/lib/marketing/runner.ts";
import { isValidTimeZone } from "../../../src/lib/marketing/automations.ts";
import { isAutomationTemplate, renderAutomationEmail, withCampaignTags } from "../../../src/lib/marketing/automationEmails.ts";
import { signUnsubscribe } from "../../../src/lib/marketing/unsubscribeToken.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cronSecret = Deno.env.get("AUTOMATIONS_CRON_SECRET") ?? "";
const unsubscribeSecret = Deno.env.get("AUTOMATIONS_UNSUBSCRIBE_SECRET") ?? "";
const enabled = Deno.env.get("AUTOMATIONS_ENABLED") === "true";
/** Longest one automation email may take before the run moves on. */
const SEND_TIMEOUT_MS = 15_000;
/** Delays before each attempt to record a delivered send. */
const MARK_RETRY_MS = [0, 500, 2000];
/** Stop claiming sends well inside the Edge Function wall-clock limit (400s on hosted Supabase). */
const RUN_BUDGET_MS = 300_000;
const appUrl = (Deno.env.get("APP_URL") ?? "").replace(/\/+$/, "");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function sameSecret(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

interface StudioRow {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  email: string | null;
  brand_primary_color: string | null;
}

/** PostgREST caps a response (1,000 rows on hosted Supabase): read every page, in a stable order. */
const CANDIDATE_PAGE = 1000;
async function allCandidates(studioId: string): Promise<{ data: unknown[] | null; error: { message: string } | null }> {
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const rows: unknown[] = [];
  for (let from = 0; ; from += CANDIDATE_PAGE) {
    const { data, error } = await db
      .rpc("get_automation_candidates", { p_studio_id: studioId })
      .order("profile_id")
      .range(from, from + CANDIDATE_PAGE - 1);
    if (error) return { data: null, error };
    rows.push(...((data as unknown[] | null) ?? []));
    if (!data || (data as unknown[]).length < CANDIDATE_PAGE) return { data: rows, error: null };
  }
}

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!sameSecret(req.headers.get("x-cron-secret") ?? "", cronSecret)) return json({ error: "Forbidden" }, 403);
  if (!appUrl || !unsubscribeSecret) return json({ error: "APP_URL and AUTOMATIONS_UNSUBSCRIBE_SECRET must be set" }, 500);

  const startedAt = Date.now();
  const body = (await req.json().catch(() => ({}))) as { studioId?: string; dryRun?: boolean };
  // A claimed send can't be retried (its episode key is unique), so check the
  // provider can deliver before claiming anything. The console provider
  // "succeeds" without delivering, and a real one without its secret fails
  // every send: either way a live run plans only and says why.
  const provider = emailProviderReady();
  const blocked = enabled && !provider.ready ? provider.reason : undefined;
  if (blocked) console.error(`run-automations: AUTOMATIONS_ENABLED=true but the email provider can't deliver (${blocked}); nothing sent`);
  const dryRun = !enabled || body.dryRun === true || Boolean(blocked);
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Booking conversions a trigger couldn't write (transient errors) are
  // retried here first; record_conversion is idempotent per entity.
  const { data: retried, error: retryError } = await db.rpc("retry_queued_conversions", { p_limit: 500 });
  if (retryError) console.error("run-automations: conversion retry failed", retryError.message);

  if (body.studioId && !UUID.test(body.studioId)) return json({ error: "Bad studioId" }, 400);
  // Every studio, in pages (a select is capped at 1,000 rows), in a stable order.
  const studios: StudioRow[] = [];
  for (let from = 0; ; from += 1000) {
    let q = db.from("studios").select("id, name, slug, timezone, email, brand_primary_color").order("id").range(from, from + 999);
    if (body.studioId) q = q.eq("id", body.studioId);
    const { data, error: studiosError } = await q;
    if (studiosError) return json({ error: studiosError.message }, 500);
    studios.push(...((data ?? []) as StudioRow[]));
    if (!data || data.length < 1000) break;
  }
  // A run that runs out of time stops early; start each hour at a different
  // studio so the same ones aren't always the ones left for next time.
  const rotate = studios.length ? Math.floor(Date.now() / 3_600_000) % studios.length : 0;
  const ordered = [...studios.slice(rotate), ...studios.slice(0, rotate)];
  let outOfTime = false;

  const now = new Date();
  const report: Record<string, unknown>[] = [];

  for (const studio of ordered) {
    if (Date.now() - startedAt > RUN_BUDGET_MS - SEND_TIMEOUT_MS) { outOfTime = true; break; }
    const [{ data: settings, error: settingsError }, { data: candidates, error: candError }, { data: loc }] = await Promise.all([
      db.from("automation_settings").select("*").eq("studio_id", studio.id).maybeSingle(),
      allCandidates(studio.id),
      db
        .from("locations")
        .select("address_line1, address_line2, city, state, zip")
        .eq("studio_id", studio.id)
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    // A failed settings read is not "no settings": defaults would switch on
    // automations the studio turned off. Skip the studio this run.
    if (settingsError || candError) {
      report.push({ studio: studio.slug, error: (settingsError ?? candError)!.message });
      continue;
    }

    // One studio's bad time zone (onboarding stores what it is sent) must not
    // stop the run for every studio after it, and without a valid zone quiet
    // hours can't be honored: skip it and say why.
    const timeZone = studio.timezone || "UTC";
    if (!isValidTimeZone(timeZone)) {
      report.push({ studio: studio.slug, error: `invalid time zone: ${String(timeZone).slice(0, 64)}` });
      continue;
    }
    let plan: ReturnType<typeof planStudio>;
    try {
      plan = planStudio((candidates ?? []) as CandidateRow[], settings, now, timeZone);
    } catch (e) {
      report.push({ studio: studio.slug, error: `planning failed: ${(e as Error).message}` });
      continue;
    }
    const result = { studio: studio.slug, planned: plan.sends.length, skipped: plan.skipped, sent: 0, failed: 0, dryRun };
    report.push(result);
    const scheduleUrl = `${appUrl}/s/${encodeURIComponent(studio.slug)}`;
    const address = formatAddress(loc);
    // CAN-SPAM: commercial email must carry a valid postal address. No
    // address on an active location, no automation email.
    if (!address) {
      (result as Record<string, unknown>).blocked = "no_postal_address";
      continue;
    }
    if (dryRun || plan.sends.length === 0) continue;


    for (const s of plan.sends) {
      // Never claim a send the invocation might not live to finish: a claim
      // killed mid-send stays 'sending' and its episode can't be retried.
      if (Date.now() - startedAt > RUN_BUDGET_MS - SEND_TIMEOUT_MS) { outOfTime = true; break; }
      if (!isAutomationTemplate(s.decision.template)) continue;

      // Claim first. The database enforces one automation email per person
      // per day across studios and runs; NULL means capped or already claimed.
      const { data: claimedId, error: claimError } = await db.rpc("claim_automation_send", {
        p_studio_id: studio.id,
        p_profile_id: s.profileId,
        p_key: s.decision.key,
        p_step: s.decision.step,
        p_episode: s.decision.episode,
      });
      const claimed = typeof claimedId === "string" ? [{ id: claimedId }] : null;
      if (claimError || !claimed?.length) continue;

      // The candidate list can be minutes old by now; an unsubscribe that
      // landed in between must win. Release the claim and skip.
      const { data: stillConsents } = await db.rpc("has_consent", {
        p_studio_id: studio.id,
        p_profile_id: s.profileId,
        p_purpose: "email_marketing",
      });
      if (stillConsents !== true) {
        await db.from("automation_sends").delete().eq("id", claimed[0].id);
        continue;
      }

      const token = await signUnsubscribe(studio.id, s.profileId, unsubscribeSecret);
      // Footer link opens the app's confirm page; the header is the one-click POST endpoint.
      const unsubscribeUrl = `${appUrl}/unsubscribe?t=${encodeURIComponent(token)}`;
      const oneClickUrl = `${supabaseUrl}/functions/v1/unsubscribe?t=${encodeURIComponent(token)}`;
      const email = renderAutomationEmail(s.decision.template, {
        studioName: studio.name,
        firstName: s.firstName,
        scheduleUrl: `${scheduleUrl}?utm_source=tandava&utm_medium=email&utm_campaign=${s.decision.key}`,
        saveDetailsUrl: `${scheduleUrl}/save-details?utm_source=tandava&utm_medium=email&utm_campaign=${s.decision.key}`,
        introOfferUrl: withCampaignTags(settings?.intro_offer_url, s.decision.key),
        unsubscribeUrl,
        studioAddress: address,
        brandColor: studio.brand_primary_color,
      });

      // Bounded: one stalled provider request must not hold up every later
      // recipient and studio. A timed-out send may still have gone out, so
      // its claim stays 'sending' (never resent, counts toward the daily cap).
      const timedOut = Symbol("timeout");
      const sendOrTimeout = await Promise.race([sendEmail({
        to: s.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        fromName: studio.name,
        replyTo: studio.email ?? undefined,
        headers: {
          "List-Unsubscribe": `<${oneClickUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        tags: { automation: s.decision.key, step: String(s.decision.step) },
      }), new Promise<typeof timedOut>((r) => setTimeout(() => r(timedOut), SEND_TIMEOUT_MS))]);
      if (sendOrTimeout === timedOut) {
        result.failed++;
        console.error("run-automations: send timed out; claim left as sending", claimed[0].id);
        continue;
      }
      const sent = sendOrTimeout;

      if (sent.success) {
        result.sent++;
        // The email went out: recording that is safe to repeat, so retry a
        // transient failure. A claim left 'sending' never advances its
        // sequence (step 0 would block the intro offer for good).
        const sentAt = new Date().toISOString();
        let markError: { message: string } | null = null;
        for (const wait of MARK_RETRY_MS) {
          if (wait) await new Promise((r) => setTimeout(r, wait));
          ({ error: markError } = await db
            .from("automation_sends")
            .update({ status: "sent", sent_at: sentAt })
            .eq("id", claimed[0].id));
          if (!markError) break;
        }
        if (markError) console.error("run-automations: could not mark sent; claim left as sending", claimed[0].id, markError.message);
      } else {
        result.failed++;
        await db
          .from("automation_sends")
          .update({ status: "failed", error: (sent.error ?? "send failed").slice(0, 500) })
          .eq("id", claimed[0].id);
      }
    }
    if (outOfTime) break;
  }

  return json({
    ok: true, enabled, conversionsRetried: retried ?? 0, report,
    ...(blocked ? { blocked } : {}),
    // The rest is picked up by the next hourly run.
    ...(outOfTime ? { stoppedEarly: true } : {}),
  });
});
