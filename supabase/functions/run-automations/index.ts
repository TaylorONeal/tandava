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
import { sendEmail } from "../email/provider.ts";
import { planStudio, formatAddress, type CandidateRow } from "../../../src/lib/marketing/runner.ts";
import { isAutomationTemplate, renderAutomationEmail, withCampaignTags } from "../../../src/lib/marketing/automationEmails.ts";
import { signUnsubscribe } from "../../../src/lib/marketing/unsubscribeToken.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cronSecret = Deno.env.get("AUTOMATIONS_CRON_SECRET") ?? "";
const unsubscribeSecret = Deno.env.get("AUTOMATIONS_UNSUBSCRIBE_SECRET") ?? "";
const enabled = Deno.env.get("AUTOMATIONS_ENABLED") === "true";
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

serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!sameSecret(req.headers.get("x-cron-secret") ?? "", cronSecret)) return json({ error: "Forbidden" }, 403);
  if (!appUrl || !unsubscribeSecret) return json({ error: "APP_URL and AUTOMATIONS_UNSUBSCRIBE_SECRET must be set" }, 500);

  const body = (await req.json().catch(() => ({}))) as { studioId?: string; dryRun?: boolean };
  const dryRun = !enabled || body.dryRun === true;
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  let studiosQuery = db.from("studios").select("id, name, slug, timezone, email, brand_primary_color");
  if (body.studioId) {
    if (!UUID.test(body.studioId)) return json({ error: "Bad studioId" }, 400);
    studiosQuery = studiosQuery.eq("id", body.studioId);
  }
  const { data: studios, error: studiosError } = await studiosQuery;
  if (studiosError) return json({ error: studiosError.message }, 500);

  const now = new Date();
  const report: Record<string, unknown>[] = [];

  for (const studio of (studios ?? []) as StudioRow[]) {
    const [{ data: settings, error: settingsError }, { data: candidates, error: candError }, { data: loc }] = await Promise.all([
      db.from("automation_settings").select("*").eq("studio_id", studio.id).maybeSingle(),
      db.rpc("get_automation_candidates", { p_studio_id: studio.id }),
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

    const plan = planStudio((candidates ?? []) as CandidateRow[], settings, now, studio.timezone || "UTC");
    const result = { studio: studio.slug, planned: plan.sends.length, skipped: plan.skipped, sent: 0, failed: 0, dryRun };
    report.push(result);
    if (dryRun || plan.sends.length === 0) continue;

    const scheduleUrl = `${appUrl}/s/${encodeURIComponent(studio.slug)}`;
    const address = formatAddress(loc);

    for (const s of plan.sends) {
      if (!isAutomationTemplate(s.decision.template)) continue;

      // Claim first; an existing row means another run already handled it.
      const { data: claimed, error: claimError } = await db
        .from("automation_sends")
        .upsert(
          {
            studio_id: studio.id,
            profile_id: s.profileId,
            automation_key: s.decision.key,
            step: s.decision.step,
            episode_key: s.decision.episode,
            status: "sent",
          },
          { onConflict: "studio_id,profile_id,automation_key,step,episode_key", ignoreDuplicates: true },
        )
        .select("id");
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

      const sent = await sendEmail({
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
      });

      if (sent.success) {
        result.sent++;
      } else {
        result.failed++;
        await db
          .from("automation_sends")
          .update({ status: "failed", error: (sent.error ?? "send failed").slice(0, 500) })
          .eq("id", claimed[0].id);
      }
    }
  }

  return json({ ok: true, enabled, report });
});
