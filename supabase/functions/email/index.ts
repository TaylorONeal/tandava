/**
 * Email Sender (Supabase Edge Function)
 *
 * HTTP entry point that renders a named template and sends it through the
 * configured provider (Resend / SendGrid / SMTP / console). This is what the
 * frontend / database webhooks call to send transactional email.
 *
 * Authorization (TANDAVA-EMAIL-01): this function sends from the studio's
 * verified domain, so it is not callable by just anyone with an account.
 * A request must come from a server-side caller:
 *   - header `x-email-secret` matching EMAIL_FUNCTION_SECRET
 *     (constant-time compare, same pattern as run-automations'
 *     `x-cron-secret`), or an `Authorization: Bearer` service-role key
 *     (how server-side functions call in: express-book invokes this
 *     function via its service-role client, db.functions.invoke).
 *     For database webhooks and other server-side callers. Internal
 *     callers may use either request form below.
 *   Signed-in users, studio staff included, cannot call it: a staff route
 *   let caller-written text go out from the studio domain to any address
 *   the studio had imported, and nothing in the app used it. A staff send
 *   feature should build its message from database rows on the server.
 * Other edge functions mostly bypass this HTTP entry point:
 * cancel-class and run-automations import sendEmail from provider.ts
 * directly, and express-book uses provider.ts for its booking email;
 * its continue-link email does invoke this function, through its
 * service-role client, so the service-role path above covers it.
 * The internal check runs first and fails closed: when
 * EMAIL_FUNCTION_SECRET is unset, no header value can match.
 *
 * Request body:
 *   { "to": "user@example.com", "template": "bookingConfirmation", "data": { ... } }
 * or a raw message:
 *   { "to": "...", "subject": "...", "html": "...", "text": "..." }
 *
 * Deploy: supabase functions deploy email
 * Secrets:
 *   supabase secrets set EMAIL_FUNCTION_SECRET=<long random value>
 *   supabase secrets set EMAIL_PROVIDER=resend
 *   supabase secrets set RESEND_API_KEY=...
 *   supabase secrets set EMAIL_FROM=noreply@yourstudio.com
 *   supabase secrets set EMAIL_FROM_NAME="Your Studio"
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendEmail } from "./provider.ts";
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

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const emailFunctionSecret = Deno.env.get("EMAIL_FUNCTION_SECRET") ?? "";

// Constant-time compare, copied from run-automations (sameSecret there).
// Empty on either side never matches, so an unset secret fails closed.
function sameSecret(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

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
    "authorization, x-client-info, apikey, content-type, x-email-secret",
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

  let payload: Record<string, unknown>;
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: "Expected a JSON object" }, 400);
    }
    payload = body as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  // ---- Authorize the caller (see header comment) ----
  const bearer = (req.headers.get("Authorization") ?? "").replace(
    /^Bearer\s+/i,
    "",
  );
  const isInternal =
    sameSecret(req.headers.get("x-email-secret") ?? "", emailFunctionSecret) ||
    // Server-side callers invoke with the service-role key as Bearer
    // (express-book's db.functions.invoke("email", ...)): that key is
    // already fully trusted (it bypasses RLS), so it counts as internal.
    sameSecret(bearer, serviceKey);
  if (!isInternal) {
    return json({ error: "Not authorized to send email" }, 401);
  }

  const to = String(payload.to ?? "");
  if (!to) return json({ error: "Missing 'to' address" }, 400);

  const templateData = (payload.data as Record<string, unknown>) ?? {};

  let subject: string;
  let html: string;
  let text: string | undefined;

  if (payload.template) {
    const tpl = templates[String(payload.template)];
    if (!tpl) return json({ error: `Unknown template: ${payload.template}` }, 400);
    let rendered: TemplateResult;
    try {
      rendered = tpl(templateData);
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
