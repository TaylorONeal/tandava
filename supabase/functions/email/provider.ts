/**
 * Email Provider Abstraction
 *
 * Provides a unified interface for sending emails regardless of the
 * underlying provider. Swap providers by changing the EMAIL_PROVIDER
 * environment variable.
 *
 * Supported providers:
 *   - "resend"   — Resend (https://resend.com)
 *   - "sendgrid" — SendGrid (https://sendgrid.com)
 *   - "smtp"     — Generic SMTP (works with AWS SES, Mailgun, self-hosted)
 *   - "console"  — Logs to stdout (development/testing)
 *
 * Usage from a Supabase Edge Function:
 *   import { sendEmail } from "./email/provider.ts";
 *   await sendEmail({ to: "user@example.com", subject: "Hello", html: "<p>Hi</p>" });
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Record<string, string>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

interface EmailProviderAdapter {
  name: string;
  send(message: EmailMessage): Promise<EmailResult>;
}

// ---------------------------------------------------------------------------
// Provider: Resend
// ---------------------------------------------------------------------------
function createResendProvider(): EmailProviderAdapter {
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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${fromName} <${from}>`,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          reply_to: message.replyTo,
          tags: message.tags
            ? Object.entries(message.tags).map(([name, value]) => ({ name, value }))
            : undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err, provider: "resend" };
      }

      const data = await response.json();
      return { success: true, messageId: data.id, provider: "resend" };
    },
  };
}

// ---------------------------------------------------------------------------
// Provider: SendGrid
// ---------------------------------------------------------------------------
function createSendGridProvider(): EmailProviderAdapter {
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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: message.to }] }],
          from: { email: from, name: fromName },
          reply_to: message.replyTo ? { email: message.replyTo } : undefined,
          subject: message.subject,
          content: [
            ...(message.text ? [{ type: "text/plain", value: message.text }] : []),
            { type: "text/html", value: message.html },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err, provider: "sendgrid" };
      }

      const messageId = response.headers.get("x-message-id") || undefined;
      return { success: true, messageId, provider: "sendgrid" };
    },
  };
}

// ---------------------------------------------------------------------------
// Provider: SMTP (via raw fetch to smtp relay or nodemailer-compatible API)
// ---------------------------------------------------------------------------
function createSMTPProvider(): EmailProviderAdapter {
  return {
    name: "smtp",
    async send(message) {
      // In Deno Edge Functions, SMTP requires a relay service.
      // This implementation posts to a generic SMTP relay API endpoint.
      // For direct SMTP, deploy as a Node.js function with nodemailer.
      const relayUrl = Deno.env.get("SMTP_RELAY_URL");
      const from = Deno.env.get("EMAIL_FROM") || "noreply@tandava.yoga";

      if (!relayUrl) {
        return { success: false, error: "SMTP_RELAY_URL not configured", provider: "smtp" };
      }

      const response = await fetch(relayUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          replyTo: message.replyTo,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return { success: false, error: err, provider: "smtp" };
      }

      return { success: true, provider: "smtp" };
    },
  };
}

// ---------------------------------------------------------------------------
// Provider: Console (development)
// ---------------------------------------------------------------------------
function createConsoleProvider(): EmailProviderAdapter {
  return {
    name: "console",
    async send(message) {
      console.log("=== EMAIL (console provider) ===");
      console.log(`To: ${message.to}`);
      console.log(`Subject: ${message.subject}`);
      console.log(`Body: ${message.text || message.html.substring(0, 200)}...`);
      console.log("================================");
      return { success: true, messageId: `console-${Date.now()}`, provider: "console" };
    },
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
function getProvider(): EmailProviderAdapter {
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Send an email using the configured provider.
 * Errors are caught and returned — never thrown — so email failures
 * don't block the calling operation (fire-and-forget pattern).
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const provider = getProvider();
  try {
    return await provider.send(message);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[email] ${provider.name} failed:`, errorMsg);
    return { success: false, error: errorMsg, provider: provider.name };
  }
}
