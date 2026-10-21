/**
 * Email Sender (Supabase Edge Function)
 *
 * HTTP entry point that renders a named template and sends it through the
 * configured provider (Resend / SendGrid / SMTP / console). This is what the
 * frontend / database webhooks call to send transactional email.
 *
 * Request body:
 *   { "to": "user@example.com", "template": "bookingConfirmation", "data": { ... } }
 * or a raw message:
 *   { "to": "...", "subject": "...", "html": "...", "text": "..." }
 *
 * Deploy: supabase functions deploy email
 * Secrets:
 *   supabase secrets set EMAIL_PROVIDER=resend
 *   supabase secrets set RESEND_API_KEY=re_...
 *   supabase secrets set EMAIL_FROM=noreply@yourstudio.com
 *   supabase secrets set EMAIL_FROM_NAME="Your Studio"
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendEmail } from "./provider.ts";
import { isServiceRequest } from "../_shared/service-auth.ts";
import {
  welcomeEmail,
  bookingConfirmationEmail,
  bookingCancellationEmail,
  classReminderEmail,
  waitlistPromotedEmail,
  passwordResetEmail,
  studioInquiryNotificationEmail,
  expressContinueEmail,
  type TemplateResult,
} from "./templates.ts";

type TemplateFn = (data: Record<string, unknown>) => TemplateResult;

// Each template declares a specific data shape; wrap so the dispatcher can
// accept a generic object while keeping the underlying templates strongly typed.
const templates: Record<string, TemplateFn> = {
  welcome: (d) => welcomeEmail(d as Parameters<typeof welcomeEmail>[0]),
  bookingConfirmation: (d) =>
    bookingConfirmationEmail(d as Parameters<typeof bookingConfirmationEmail>[0]),
  bookingCancellation: (d) =>
    bookingCancellationEmail(d as Parameters<typeof bookingCancellationEmail>[0]),
  classReminder: (d) => classReminderEmail(d as Parameters<typeof classReminderEmail>[0]),
  waitlistPromoted: (d) =>
    waitlistPromotedEmail(d as Parameters<typeof waitlistPromotedEmail>[0]),
  passwordReset: (d) => passwordResetEmail(d as Parameters<typeof passwordResetEmail>[0]),
  studioInquiryNotification: (d) =>
    studioInquiryNotificationEmail(d as Parameters<typeof studioInquiryNotificationEmail>[0]),
  express_continue: (d) => expressContinueEmail(d as Parameters<typeof expressContinueEmail>[0]),
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  if (!isServiceRequest(req, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"))) {
    return json({ error: "Forbidden" }, 403);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const to = String(payload.to ?? "");
  if (!to) return json({ error: "Missing 'to' address" }, 400);

  let subject: string;
  let html: string;
  let text: string | undefined;

  if (payload.template) {
    const tpl = templates[String(payload.template)];
    if (!tpl) return json({ error: `Unknown template: ${payload.template}` }, 400);
    let rendered: TemplateResult;
    try {
      rendered = tpl((payload.data as Record<string, unknown>) ?? {});
    } catch {
      return json({ error: "Invalid template data" }, 400);
    }
    subject = rendered.subject;
    html = rendered.html;
    text = rendered.text;
  } else {
    subject = String(payload.subject ?? "");
    html = String(payload.html ?? "");
    text = payload.text ? String(payload.text) : undefined;
    if (!subject || !html) {
      return json({ error: "Provide a 'template' or 'subject'+'html'" }, 400);
    }
  }

  const result = await sendEmail({
    to,
    subject,
    html,
    text,
    replyTo: payload.replyTo ? String(payload.replyTo) : undefined,
  });

  return json(result, result.success ? 200 : 502);
});
