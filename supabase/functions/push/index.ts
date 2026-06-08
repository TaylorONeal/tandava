/**
 * Web Push Sender (Supabase Edge Function)
 *
 * Sends a Web Push notification to every subscription a profile has registered
 * (push_subscriptions table). Uses VAPID; configure keys as secrets.
 *
 * Request body:
 *   { "profileId": "...", "title": "...", "body": "...", "url": "/my-schedule" }
 *
 * Deploy: supabase functions deploy push
 * Secrets:
 *   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@studio.com
 *
 * NOTE: integration-test against a live project before production. Generate
 * VAPID keys once with `npx web-push generate-vapid-keys`. Stale/expired
 * subscriptions (404/410) are pruned automatically.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";

if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
}

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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!vapidPublic || !vapidPrivate) return json({ error: "VAPID keys not configured" }, 503);

  let payload: { profileId?: string; title?: string; body?: string; url?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!payload.profileId || !payload.title) {
    return json({ error: "Missing profileId or title" }, 400);
  }

  const db = createClient(supabaseUrl, serviceKey);
  const { data: subs, error } = await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("profile_id", payload.profileId);
  if (error) return json({ error: error.message }, 500);
  if (!subs || subs.length === 0) return json({ sent: 0 });

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body ?? "",
    url: payload.url ?? "/",
  });

  let sent = 0;
  const stale: string[] = [];
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notification,
      );
      sent++;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) stale.push(sub.id); // gone — prune
      else console.error("[push] send failed:", err);
    }
  }

  if (stale.length > 0) {
    await db.from("push_subscriptions").delete().in("id", stale);
  }

  return json({ sent, pruned: stale.length });
});
