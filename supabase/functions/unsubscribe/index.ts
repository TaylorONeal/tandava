/**
 * unsubscribe (Supabase Edge Function): PRD-027 phase 1
 *
 * Target of the List-Unsubscribe header on every automation email, and the API
 * behind the app's /unsubscribe page (the link in the email footer).
 *
 *   GET  ?t=<token>  -> 303 to APP_URL/unsubscribe?t=<token>. Link scanners in
 *                       mail filters fetch GET links, so GET never changes
 *                       anything (and Supabase's default domain won't render
 *                       HTML anyway).
 *   POST ?t=<token>  -> RFC 8058 one-click from the mail client: records
 *                       email_marketing = false.
 *   POST {t, preview?} JSON from the app page: preview returns the studio
 *                       name without changing anything; otherwise records the
 *                       opt-out.
 *
 * The token is an HMAC over studio + profile (src/lib/marketing/unsubscribeToken.ts)
 * and can only turn email off. Transactional email is not affected.
 *
 * Confirmed opt-in (same function, separate token type):
 *   GET  ?c=<token>  -> 303 to APP_URL/email-updates?c=<token> (GET never changes anything)
 *   POST {c, preview?} from the app's /email-updates page: preview returns the
 *                       studio name; otherwise records email_marketing = true
 *                       (source email_confirmation). Confirm tokens carry an
 *                       "optin" prefix and expire after 14 days, so an
 *                       unsubscribe token can never opt someone in.
 *
 * Deploy: supabase functions deploy unsubscribe --no-verify-jwt
 * Secret: AUTOMATIONS_UNSUBSCRIBE_SECRET (same value as run-automations), APP_URL
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyOptInConfirm, verifyUnsubscribe } from "../../../src/lib/marketing/unsubscribeToken.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const secret = Deno.env.get("AUTOMATIONS_UNSUBSCRIBE_SECRET") ?? "";
const appUrl = (Deno.env.get("APP_URL") ?? "").replace(/\/+$/, "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);

  if (req.method === "GET") {
    const t = url.searchParams.get("t") ?? "";
    if (!appUrl) return json({ error: "APP_URL not set" }, 500);
    const c = url.searchParams.get("c");
    if (c) {
      return new Response(null, {
        status: 303,
        headers: { Location: `${appUrl}/email-updates?c=${encodeURIComponent(c)}`, "Referrer-Policy": "no-referrer" },
      });
    }
    return new Response(null, {
      status: 303,
      headers: { Location: `${appUrl}/unsubscribe?t=${encodeURIComponent(t)}`, "Referrer-Policy": "no-referrer" },
    });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // One-click posts form data with the token in the URL; the app posts JSON.
  let token = url.searchParams.get("t") ?? "";
  let confirmToken: string | null = null;
  let preview = false;
  if ((req.headers.get("content-type") ?? "").includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { t?: unknown; c?: unknown; preview?: unknown };
    if (typeof body.t === "string") token = body.t;
    if (typeof body.c === "string") confirmToken = body.c;
    preview = body.preview === true;
  }

  if (confirmToken !== null) {
    const who = await verifyOptInConfirm(confirmToken, secret);
    if (!who) return json({ ok: false, error: "invalid_link" }, 400);
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: studio } = await db.from("studios").select("name").eq("id", who.studioId).maybeSingle();
    const studioName = studio?.name ?? null;
    if (preview) return json({ ok: true, studioName });
    const { error } = await db.rpc("record_consent", {
      p_studio_id: who.studioId,
      p_profile_id: who.profileId,
      p_visitor_id: null,
      p_purpose: "email_marketing",
      p_granted: true,
      p_source: "email_confirmation",
      p_policy_version: "2026-10",
    });
    if (error) {
      console.error("unsubscribe: confirm record_consent failed", error.message);
      return json({ ok: false, error: "save_failed" }, 500);
    }
    return json({ ok: true, studioName, confirmed: true });
  }

  const who = await verifyUnsubscribe(token, secret);
  if (!who) return json({ ok: false, error: "invalid_link" }, 400);

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: studio } = await db.from("studios").select("name").eq("id", who.studioId).maybeSingle();
  const studioName = studio?.name ?? null;
  if (preview) return json({ ok: true, studioName });

  const { error } = await db.rpc("record_consent", {
    p_studio_id: who.studioId,
    p_profile_id: who.profileId,
    p_visitor_id: null,
    p_purpose: "email_marketing",
    p_granted: false,
    p_source: "unsubscribe_link",
    p_policy_version: "2026-10",
  });
  if (error) {
    console.error("unsubscribe: record_consent failed", error.message);
    return json({ ok: false, error: "save_failed" }, 500);
  }
  return json({ ok: true, studioName, unsubscribed: true });
});
