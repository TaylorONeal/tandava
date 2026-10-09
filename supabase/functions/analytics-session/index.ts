/**
 * analytics-session (Supabase Edge Function) — PRD-024 step 1
 *
 * Records one first-party visit to a studio's public surface (storefront,
 * booking page, embed, landing page). Anonymous by design.
 *
 * What it stores: path, referrer, utm_* tags, ad click ids, device class, and
 * a channel computed here (never trusted from the client). What it never
 * stores: IP address, user agent string, cookies. (Rate limiting keeps a
 * salted hash of the source for at most a day, never next to a visit.) Unknown or private studios
 * record nothing and the response doesn't say why.
 *
 * Deploy: supabase functions deploy analytics-session --no-verify-jwt
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { classifyChannel } from "../../../src/lib/analytics/channel.ts";
import { sanitizeUrl } from "../../../src/lib/analytics/landing.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Salt for the per-source rate limit (never an IP in storage). Falls back to
// express booking's salt; with neither, only the per-studio cap applies.
const ipSalt = Deno.env.get("ANALYTICS_IP_SALT") ?? Deno.env.get("EXPRESS_IP_SALT") ?? "";

/** Page views one source may record per hour, and one studio per hour. */
const PER_SOURCE_PER_HOUR = 300;
const PER_STUDIO_PER_HOUR = 20_000;

async function sourceBucket(req: Request): Promise<string | null> {
  if (!ipSalt) return null;
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  if (!ip) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${ipSalt}:${ip}`));
  return "src:" + Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

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
  // Sanitized here too: never trust the client to have dropped tokens.
  const referrer = sanitizeUrl(str(body.referrer, 2000));
  const deviceType = ["mobile", "tablet", "desktop"].includes(body.deviceType) ? body.deviceType : null;

  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Public endpoint, client-chosen ids: cap what one source, and one studio,
  // can write. Over the cap the visit just isn't recorded (no error shown).
  // The source is checked first, and the studio is resolved before its bucket
  // exists, so made-up slugs can't each mint a new rate-limit row.
  const source = await sourceBucket(req);
  if (source) {
    const { data: ok, error } = await db.rpc("analytics_admit", { p_bucket: source, p_limit: PER_SOURCE_PER_HOUR, p_window_seconds: 3600 });
    if (error || ok !== true) return json({ sessionId: null });
  }

  // Same rule as record_session (00038): a studio whose booking page is off records nothing.
  const { data: studio } = await db.from("studios").select("id, website").eq("slug", slug).eq("page_live", true).maybeSingle();
  if (!studio) return json({ sessionId: null });
  {
    const { data: ok, error } = await db.rpc("analytics_admit", { p_bucket: `studio:${studio.id}`, p_limit: PER_STUDIO_PER_HOUR, p_window_seconds: 3600 });
    if (error || ok !== true) return json({ sessionId: null });
  }

  // The studio's own website host lets a visit from it count as "embed".
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
    p_landing_page_url: sanitizeUrl(str(body.landingUrl, 2000)),
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
