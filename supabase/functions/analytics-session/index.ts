/**
 * analytics-session (Supabase Edge Function) — PRD-024 step 1
 *
 * Records one first-party visit to a studio's public surface (storefront,
 * booking page, embed, landing page). Anonymous by design.
 *
 * What it stores: path, referrer, utm_* tags, ad click ids, device class, and
 * a channel computed here (never trusted from the client). What it never
 * stores: IP address, user agent string, cookies. Unknown or private studios
 * record nothing and the response doesn't say why.
 *
 * Deploy: supabase functions deploy analytics-session --no-verify-jwt
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { classifyChannel } from "../../../src/lib/analytics/channel.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SURFACES = new Set(["storefront", "booking", "embed", "landing", "blog", "teacher", "app"]);
const str = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);

function pick(obj: unknown, keys: string[], n: number): Record<string, string> {
  const out: Record<string, string> = {};
  if (obj && typeof obj === "object") {
    for (const k of keys) {
      const v = str((obj as Record<string, unknown>)[k], n);
      if (v) out[k] = v;
    }
  }
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return json({ error: "Invalid body" }, 400);

  const slug = str(body.slug, 100);
  const visitorId = typeof body.visitorId === "string" && UUID.test(body.visitorId) ? body.visitorId : null;
  const sessionToken = str(body.sessionToken, 64);
  const surface = typeof body.surface === "string" && SURFACES.has(body.surface) ? body.surface : null;
  if (!slug || !visitorId || !sessionToken || !surface) return json({ error: "Missing fields" }, 400);

  const utm = pick(body.utm, ["source", "medium", "campaign", "content", "term"], 200);
  const clickIds = pick(body.clickIds, ["fbclid", "gclid", "gbraid", "wbraid", "ttclid", "msclkid"], 500);
  const referrer = str(body.referrer, 1000);
  const deviceType = ["mobile", "tablet", "desktop"].includes(body.deviceType) ? body.deviceType : null;

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // The studio's own website host lets a visit from it count as "embed".
  const { data: studio } = await db.from("studios").select("website").eq("slug", slug).maybeSingle();
  let studioSiteHost: string | null = null;
  try {
    studioSiteHost = studio?.website ? new URL(studio.website).hostname.replace(/^www\./, "") : null;
  } catch {
    studioSiteHost = null;
  }

  const channel = classifyChannel({
    utmSource: utm.source,
    utmMedium: utm.medium,
    referrer,
    studioSiteHost,
    ...clickIds,
  });

  const { data, error } = await db.rpc("record_session", {
    p_studio_slug: slug,
    p_visitor_id: visitorId,
    p_session_token: sessionToken,
    p_surface: surface,
    p_landing_page_url: str(body.landingUrl, 1000),
    p_referrer_url: referrer,
    p_utm: utm,
    p_click_ids: clickIds,
    p_channel: channel,
    p_device_type: deviceType,
  });
  if (error) {
    console.error("analytics-session: record_session failed", error.message);
    return json({ sessionId: null });
  }
  return json({ sessionId: data ?? null });
});
