/**
 * SMS Sender (Supabase Edge Function)
 *
 * Renders a named template (or a raw body) and sends it via the configured
 * provider (Twilio / console). Mirrors the email function.
 *
 * Request body:
 *   { "to": "+14155550123", "template": "classReminder", "data": { ... } }
 * or:
 *   { "to": "+14155550123", "body": "..." }
 *
 * Deploy: supabase functions deploy sms
 * Secrets:
 *   supabase secrets set SMS_PROVIDER=twilio
 *   supabase secrets set TWILIO_ACCOUNT_SID=AC... TWILIO_AUTH_TOKEN=... TWILIO_FROM=+1...
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendSms } from "./provider.ts";
import {
  classReminderSms,
  waitlistPromotedSms,
  classCancelledSms,
  bookingConfirmationSms,
  type SmsTemplateResult,
} from "./templates.ts";

type TemplateFn = (data: Record<string, unknown>) => SmsTemplateResult;

const templates: Record<string, TemplateFn> = {
  classReminder: (d) => classReminderSms(d as Parameters<typeof classReminderSms>[0]),
  waitlistPromoted: (d) => waitlistPromotedSms(d as Parameters<typeof waitlistPromotedSms>[0]),
  classCancelled: (d) => classCancelledSms(d as Parameters<typeof classCancelledSms>[0]),
  bookingConfirmation: (d) => bookingConfirmationSms(d as Parameters<typeof bookingConfirmationSms>[0]),
};

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

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const to = String(payload.to ?? "");
  if (!to) return json({ error: "Missing 'to' number" }, 400);

  let body: string;
  if (payload.template) {
    const tpl = templates[String(payload.template)];
    if (!tpl) return json({ error: `Unknown template: ${payload.template}` }, 400);
    body = tpl((payload.data as Record<string, unknown>) ?? {}).body;
  } else {
    body = String(payload.body ?? "");
    if (!body) return json({ error: "Provide a 'template' or 'body'" }, 400);
  }

  const result = await sendSms({ to, body });
  return json(result, result.success ? 200 : 502);
});
