// tandava main d8c1b43, bundled single file (dashboard deploy 2026-11-11)
// supabase/functions/email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// supabase/functions/email/provider.ts
function displayName(name) {
  return name.replace(/["<>\r\n]/g, "").slice(0, 80);
}
function createResendProvider() {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") || "noreply@tandava.yoga";
  const fromName = Deno.env.get("EMAIL_FROM_NAME") || "Tandava";
  return {
    name: "resend",
    async send(message) {
      if (!apiKey) return { success: false, error: "RESEND_API_KEY not set", provider: "resend" };
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `${displayName(message.fromName ?? fromName)} <${from}>`,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          reply_to: message.replyTo,
          headers: message.headers,
          tags: message.tags ? Object.entries(message.tags).map(([name, value]) => ({ name, value })) : void 0
        })
      });
      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err, provider: "resend" };
      }
      const data = await response.json();
      return { success: true, messageId: data.id, provider: "resend" };
    }
  };
}
function createSendGridProvider() {
  const apiKey = Deno.env.get("SENDGRID_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") || "noreply@tandava.yoga";
  const fromName = Deno.env.get("EMAIL_FROM_NAME") || "Tandava";
  return {
    name: "sendgrid",
    async send(message) {
      if (!apiKey) return { success: false, error: "SENDGRID_API_KEY not set", provider: "sendgrid" };
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: message.to }] }],
          from: { email: from, name: displayName(message.fromName ?? fromName) },
          headers: message.headers,
          reply_to: message.replyTo ? { email: message.replyTo } : void 0,
          subject: message.subject,
          content: [
            ...message.text ? [{ type: "text/plain", value: message.text }] : [],
            { type: "text/html", value: message.html }
          ]
        })
      });
      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err, provider: "sendgrid" };
      }
      const messageId = response.headers.get("x-message-id") || void 0;
      return { success: true, messageId, provider: "sendgrid" };
    }
  };
}
function createSMTPProvider() {
  return {
    name: "smtp",
    async send(message) {
      const relayUrl = Deno.env.get("SMTP_RELAY_URL");
      const from = Deno.env.get("EMAIL_FROM") || "noreply@tandava.yoga";
      if (!relayUrl) {
        return { success: false, error: "SMTP_RELAY_URL not configured", provider: "smtp" };
      }
      const response = await fetch(relayUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: message.fromName ? `${displayName(message.fromName)} <${from}>` : from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          replyTo: message.replyTo,
          headers: message.headers
        })
      });
      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err, provider: "smtp" };
      }
      return { success: true, provider: "smtp" };
    }
  };
}
function createConsoleProvider() {
  return {
    name: "console",
    async send(message) {
      console.log("=== EMAIL (console provider) ===");
      console.log(`To: ${message.to}`);
      console.log(`Subject: ${message.subject}`);
      console.log(`Body: ${message.text || message.html.substring(0, 200)}...`);
      console.log("================================");
      return { success: true, messageId: `console-${Date.now()}`, provider: "console" };
    }
  };
}
function getProvider() {
  const provider = (Deno.env.get("EMAIL_PROVIDER") || "console").toLowerCase();
  switch (provider) {
    case "resend":
      return createResendProvider();
    case "sendgrid":
      return createSendGridProvider();
    case "smtp":
      return createSMTPProvider();
    case "console":
    default:
      return createConsoleProvider();
  }
}
async function sendEmail(message) {
  const provider = getProvider();
  try {
    return await provider.send(message);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[email] ${provider.name} failed:`, errorMsg);
    return { success: false, error: errorMsg, provider: provider.name, uncertain: true };
  }
}

// supabase/functions/email/templates.ts
var BRAND_COLOR = "#4fd1c5";
var BG_COLOR = "#0f0a14";
var CARD_BG = "#1a1520";
var TEXT_COLOR = "#f5f0e8";
var MUTED_COLOR = "#999";
function layout(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${BG_COLOR};font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG_COLOR};padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:${CARD_BG};border-radius:16px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:32px 40px 16px;text-align:center;">
          <span style="font-size:28px;font-weight:bold;color:${BRAND_COLOR};letter-spacing:1px;">tandava</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:16px 40px 32px;color:${TEXT_COLOR};font-size:16px;line-height:1.6;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;color:${MUTED_COLOR};font-size:12px;">
          <p style="margin:0;">Sent by Tandava &mdash; Your yoga practice companion</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
function escapeHtml(value) {
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, (character) => entities[character]);
}
function button(text, url) {
  const destination = new URL(url);
  const localHttp = destination.protocol === "http:" && ["localhost", "127.0.0.1"].includes(destination.hostname);
  if (destination.protocol !== "https:" && !localHttp || destination.username || destination.password) {
    throw new Error("Invalid email link");
  }
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr><td style="background:${BRAND_COLOR};border-radius:8px;padding:14px 32px;">
    <a href="${escapeHtml(destination.href)}" style="color:${BG_COLOR};text-decoration:none;font-weight:600;font-size:16px;">${escapeHtml(text)}</a>
  </td></tr>
</table>`;
}
function expressContinueEmail(data) {
  const url = new URL(data.url);
  const localHttp = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !localHttp || url.username || url.password) {
    throw new Error("Invalid continuation email data");
  }
  return {
    subject: "Sign in to finish your booking",
    html: layout(`
      <h1 style="color:${TEXT_COLOR};font-size:24px;margin:0 0 16px;">Sign in to finish your booking</h1>
      <p>Sign in to continue booking your selected class.</p>
      ${button("Sign in and book", url.href)}
      <p style="color:${MUTED_COLOR};font-size:14px;">If you didn't request this, you can ignore this email.</p>
    `),
    text: `Sign in to finish your booking

Sign in to continue booking your selected class: ${url.href}

If you didn't request this, you can ignore this email.`
  };
}
function welcomeEmail(data) {
  return {
    subject: `Welcome to Tandava, ${data.firstName}!`,
    html: layout(`
      <h1 style="color:${TEXT_COLOR};font-size:24px;margin:0 0 16px;">Welcome, ${escapeHtml(data.firstName)}!</h1>
      <p>We're excited to have you join our yoga community. Here's what you can do next:</p>
      <ul style="padding-left:20px;">
        <li>Browse studios and find classes near you</li>
        <li>Book your first class</li>
        <li>Set up your practice preferences</li>
      </ul>
      ${button("Explore Classes", `${data.appUrl}/schedule`)}
      <p style="color:${MUTED_COLOR};">If you have any questions, feel free to reach out through the app.</p>
    `),
    text: `Welcome to Tandava, ${data.firstName}!

We're excited to have you join our yoga community.

Explore classes: ${data.appUrl}/schedule`
  };
}
function bookingConfirmationEmail(data) {
  return {
    subject: `Booking Confirmed: ${data.className}`,
    html: layout(`
      <h1 style="color:${TEXT_COLOR};font-size:24px;margin:0 0 16px;">You're booked, ${escapeHtml(data.firstName)}!</h1>
      <table cellpadding="0" cellspacing="0" style="width:100%;background:rgba(79,209,197,0.1);border-radius:12px;padding:20px;margin:16px 0;">
        <tr><td>
          <p style="margin:0 0 8px;font-weight:600;font-size:18px;color:${BRAND_COLOR};">${escapeHtml(data.className)}</p>
          <p style="margin:0 0 4px;color:${TEXT_COLOR};">${escapeHtml(data.dateTime)} &bull; ${escapeHtml(data.duration)} min</p>
          <p style="margin:0 0 4px;color:${TEXT_COLOR};">with ${escapeHtml(data.instructor)}</p>
          <p style="margin:0;color:${MUTED_COLOR};">${escapeHtml(data.studioName)} &bull; ${escapeHtml(data.address)}</p>
        </td></tr>
      </table>
      ${button("View My Schedule", `${data.appUrl}/my-schedule`)}
      <p style="color:${MUTED_COLOR};font-size:14px;">Need to cancel? You can manage your booking from your schedule.</p>
    `),
    text: `Booking Confirmed: ${data.className}

${data.dateTime} - ${data.duration} min
with ${data.instructor}
${data.studioName} - ${data.address}

View schedule: ${data.appUrl}/my-schedule`
  };
}
function bookingCancellationEmail(data) {
  return {
    subject: `Booking Cancelled: ${data.className}`,
    html: layout(`
      <h1 style="color:${TEXT_COLOR};font-size:24px;margin:0 0 16px;">Booking Cancelled</h1>
      <p>Hi ${escapeHtml(data.firstName)}, your booking has been cancelled:</p>
      <p style="color:${MUTED_COLOR};">${escapeHtml(data.className)} at ${escapeHtml(data.studioName)}<br/>${escapeHtml(data.dateTime)}</p>
      <p>We hope to see you in another class soon!</p>
      ${button("Browse Classes", `${data.appUrl}/schedule`)}
    `),
    text: `Booking Cancelled: ${data.className} at ${data.studioName}
${data.dateTime}

Browse classes: ${data.appUrl}/schedule`
  };
}
function classReminderEmail(data) {
  return {
    subject: `Reminder: ${data.className} in ${data.timeUntil}`,
    html: layout(`
      <h1 style="color:${TEXT_COLOR};font-size:24px;margin:0 0 16px;">Class Reminder</h1>
      <p>Hi ${escapeHtml(data.firstName)}, your class starts in <strong>${escapeHtml(data.timeUntil)}</strong>:</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;background:rgba(79,209,197,0.1);border-radius:12px;padding:20px;margin:16px 0;">
        <tr><td>
          <p style="margin:0 0 8px;font-weight:600;font-size:18px;color:${BRAND_COLOR};">${escapeHtml(data.className)}</p>
          <p style="margin:0 0 4px;color:${TEXT_COLOR};">${escapeHtml(data.dateTime)}</p>
          <p style="margin:0 0 4px;color:${TEXT_COLOR};">with ${escapeHtml(data.instructor)}</p>
          <p style="margin:0;color:${MUTED_COLOR};">${escapeHtml(data.studioName)} &bull; ${escapeHtml(data.address)}</p>
        </td></tr>
      </table>
      ${button("View Details", `${data.appUrl}/my-schedule`)}
    `),
    text: `Reminder: ${data.className} in ${data.timeUntil}
${data.dateTime}
with ${data.instructor}
${data.studioName} - ${data.address}`
  };
}
function waitlistPromotedEmail(data) {
  return {
    subject: `A spot opened up: ${data.className}!`,
    html: layout(`
      <h1 style="color:${TEXT_COLOR};font-size:24px;margin:0 0 16px;">You're In!</h1>
      <p>Great news, ${escapeHtml(data.firstName)}! A spot opened up and you've been moved from the waitlist to confirmed for:</p>
      <p style="font-weight:600;color:${BRAND_COLOR};font-size:18px;">${escapeHtml(data.className)}</p>
      <p style="color:${MUTED_COLOR};">${escapeHtml(data.studioName)} &bull; ${escapeHtml(data.dateTime)}</p>
      ${button("View My Schedule", `${data.appUrl}/my-schedule`)}
    `),
    text: `You're in! A spot opened for ${data.className} at ${data.studioName}
${data.dateTime}

View schedule: ${data.appUrl}/my-schedule`
  };
}
function passwordResetEmail(data) {
  return {
    subject: "Reset Your Password",
    html: layout(`
      <h1 style="color:${TEXT_COLOR};font-size:24px;margin:0 0 16px;">Reset Your Password</h1>
      <p>Hi ${escapeHtml(data.firstName)}, we received a request to reset your password. Click the button below to create a new one:</p>
      ${button("Reset Password", data.resetUrl)}
      <p style="color:${MUTED_COLOR};font-size:14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `),
    text: `Reset Your Password

Hi ${data.firstName}, click to reset: ${data.resetUrl}

Expires in 1 hour. Ignore if you didn't request this.`
  };
}
function studioInquiryNotificationEmail(data) {
  return {
    subject: `New inquiry for ${data.studioName}: ${data.messageSubject}`,
    html: layout(`
      <h1 style="color:${TEXT_COLOR};font-size:24px;margin:0 0 16px;">New Studio Inquiry</h1>
      <p>You have a new message for <strong>${escapeHtml(data.studioName)}</strong>:</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin:16px 0;">
        <tr><td>
          <p style="margin:0 0 8px;font-weight:600;color:${TEXT_COLOR};">${escapeHtml(data.messageSubject)}</p>
          <p style="margin:0 0 8px;color:${TEXT_COLOR};">${escapeHtml(data.messageBody)}</p>
          <p style="margin:0;color:${MUTED_COLOR};">From: ${escapeHtml(data.senderName)} (${escapeHtml(data.senderEmail)})</p>
        </td></tr>
      </table>
      ${button("View in Inbox", data.manageUrl)}
    `),
    text: `New inquiry for ${data.studioName}

Subject: ${data.messageSubject}
${data.messageBody}

From: ${data.senderName} (${data.senderEmail})

View: ${data.manageUrl}`
  };
}

// supabase/functions/email/index.ts
var supabaseUrl = Deno.env.get("SUPABASE_URL");
var serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
var anonKey = Deno.env.get("SUPABASE_ANON_KEY");
var emailFunctionSecret = Deno.env.get("EMAIL_FUNCTION_SECRET") ?? "";
var STAFF_ROLES = ["owner", "admin", "front_desk"];
function sameSecret(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
var templates = {
  welcome: (d) => welcomeEmail(d),
  bookingConfirmation: (d) => bookingConfirmationEmail(d),
  bookingCancellation: (d) => bookingCancellationEmail(d),
  classReminder: (d) => classReminderEmail(d),
  waitlistPromoted: (d) => waitlistPromotedEmail(d),
  passwordReset: (d) => passwordResetEmail(d),
  studioInquiryNotification: (d) => studioInquiryNotificationEmail(d),
  express_continue: (d) => expressContinueEmail(d)
};
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-email-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  let payload;
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: "Expected a JSON object" }, 400);
    }
    payload = body;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const bearer = (req.headers.get("Authorization") ?? "").replace(
    /^Bearer\s+/i,
    ""
  );
  const isInternal = sameSecret(req.headers.get("x-email-secret") ?? "", emailFunctionSecret) || // Server-side callers invoke with the service-role key as Bearer
  // (express-book's db.functions.invoke("email", ...)): that key is
  // already fully trusted (it bypasses RLS), so it counts as internal.
  sameSecret(bearer, serviceKey);
  if (!isInternal) {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const {
      data: { user },
      error: userError
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return json({ error: "Not authenticated" }, 401);
    }
    if (typeof payload.studioId !== "string" || !payload.studioId) {
      return json({ error: "Choose an authorized studio and member" }, 403);
    }
    const staffDatabase = createClient(supabaseUrl, serviceKey);
    const { data: staffRows, error: staffError } = await staffDatabase.from("studio_staff").select("studio_id, role").eq("profile_id", user.id).eq("studio_id", payload.studioId).eq("is_active", true).in("role", STAFF_ROLES).limit(1);
    if (staffError) return json({ error: "Could not verify studio access" }, 500);
    if (!staffRows || staffRows.length === 0) {
      return json({ error: "Not authorized to send email" }, 403);
    }
  }
  const to = String(payload.to ?? "");
  if (!to) return json({ error: "Missing 'to' address" }, 400);
  let templateData = payload.data ?? {};
  if (!isInternal) {
    const allowedTemplates = ["welcome", "bookingConfirmation", "bookingCancellation", "classReminder", "waitlistPromoted"];
    if (typeof payload.studioId !== "string" || !allowedTemplates.includes(String(payload.template)) || payload.replyTo || typeof payload.recipientProfileId !== "string" || !payload.recipientProfileId) {
      return json({ error: "This message requires an internal caller or verified studio member" }, 403);
    }
    const recipientDatabase = createClient(supabaseUrl, serviceKey);
    const { data: member, error: memberError } = await recipientDatabase.from("studio_members").select("profiles!inner(email)").eq("studio_id", payload.studioId).eq("profile_id", payload.recipientProfileId).maybeSingle();
    if (memberError) return json({ error: "Could not verify the recipient" }, 500);
    const recipient = Array.isArray(member?.profiles) ? member.profiles[0] : member?.profiles;
    if (typeof recipient?.email !== "string" || recipient.email.toLowerCase() !== to.trim().toLowerCase()) {
      return json({ error: "Recipient is not a member of this studio" }, 403);
    }
    const appUrl = Deno.env.get("APP_URL");
    if (!appUrl) return json({ error: "Email links are not configured" }, 503);
    templateData = { ...templateData, appUrl };
  }
  let subject;
  let html;
  let text;
  if (payload.template) {
    const tpl = templates[String(payload.template)];
    if (!tpl) return json({ error: `Unknown template: ${payload.template}` }, 400);
    let rendered;
    try {
      rendered = tpl(templateData);
    } catch {
      return json({ error: "Invalid template data" }, 400);
    }
    subject = rendered.subject;
    html = rendered.html;
    text = rendered.text;
  } else {
    if (!isInternal) {
      return json({ error: "Raw email requires an internal caller" }, 403);
    }
    subject = String(payload.subject ?? "");
    html = String(payload.html ?? "");
    text = payload.text ? String(payload.text) : void 0;
    if (!subject || !html) {
      return json({ error: "Provide a 'template' or 'subject'+'html'" }, 400);
    }
  }
  const result = await sendEmail({
    to,
    subject,
    html,
    text,
    replyTo: payload.replyTo ? String(payload.replyTo) : void 0
  });
  return json(result, result.success ? 200 : 502);
});
