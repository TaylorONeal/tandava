/**
 * The five phase-1 automation emails (PRD-027). Pure so vitest covers them and
 * the Deno runner imports the same file.
 *
 * Sent in the studio's name, plain and short, one button each. Every email
 * carries the studio's postal address when it has one (CAN-SPAM), why the
 * person is receiving it, and a one-click unsubscribe link.
 */

export type AutomationTemplate =
  | "automation_guest_save_details"
  | "automation_guest_intro_offer"
  | "automation_first_visit_welcome"
  | "automation_first_visit_intro_offer"
  | "automation_lapsed";

export interface AutomationEmailInput {
  studioName: string;
  firstName?: string | null;
  /** https://.../s/<slug> */
  scheduleUrl: string;
  /** https://.../s/<slug>/save-details */
  saveDetailsUrl: string;
  introOfferUrl?: string | null;
  unsubscribeUrl: string;
  studioAddress?: string | null;
  brandColor?: string | null;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only http(s) URLs go into an href; anything else falls back. */
export function safeUrl(url: string | null | undefined, fallback: string): string {
  if (!url) return fallback;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : fallback;
  } catch {
    return fallback;
  }
}

function color(c: string | null | undefined): string {
  return c && /^#[0-9a-fA-F]{6}$/.test(c) ? c : "#2f6f6a";
}

interface Body {
  subject: string;
  paragraphs: string[];
  cta: { label: string; url: string };
}

function body(t: AutomationTemplate, i: AutomationEmailInput): Body {
  const hi = i.firstName?.trim() ? `Hi ${i.firstName.trim()},` : "Hi,";
  const studio = i.studioName;
  const offer = i.introOfferUrl ? safeUrl(i.introOfferUrl, i.scheduleUrl) : null;
  switch (t) {
    case "automation_guest_save_details":
      return {
        subject: `Book ${studio} in one tap next time`,
        paragraphs: [
          hi,
          `Thanks for booking with ${studio}. If you set a password on the email you booked with, next time is one tap: no form, and you can see your classes in one place.`,
          "It takes a minute. If you'd rather not, nothing changes and you can keep booking as a guest.",
        ],
        cta: { label: "Save my details", url: i.saveDetailsUrl },
      };
    case "automation_guest_intro_offer":
    case "automation_first_visit_intro_offer":
      return offer
        ? {
            subject: `Your intro offer at ${studio}`,
            paragraphs: [
              hi,
              `If you'd like to keep coming to ${studio}, the intro offer is the easiest way to start. It's set up for people who are new to the studio.`,
            ],
            cta: { label: "See the intro offer", url: offer },
          }
        : {
            subject: `Come back to ${studio} this week?`,
            paragraphs: [hi, `We'd love to see you again. Here's what's on the schedule at ${studio} this week.`],
            cta: { label: "See the schedule", url: i.scheduleUrl },
          };
    case "automation_first_visit_welcome":
      return {
        subject: `Welcome to ${studio}`,
        paragraphs: [
          hi,
          `Thanks for coming to your first class at ${studio}.`,
          "If you have questions about classes, levels or what to bring next time, just reply to this email.",
        ],
        cta: { label: "Book your next class", url: i.scheduleUrl },
      };
    case "automation_lapsed":
      return {
        subject: `It's been a little while, from ${studio}`,
        paragraphs: [
          hi,
          `We haven't seen you at ${studio} in a while. The schedule is below whenever you'd like to come back.`,
        ],
        cta: { label: "See this week's classes", url: i.scheduleUrl },
      };
  }
}

export function renderAutomationEmail(t: AutomationTemplate, i: AutomationEmailInput): RenderedEmail {
  const b = body(t, i);
  const accent = color(i.brandColor);
  const studio = escapeHtml(i.studioName);
  const address = i.studioAddress?.trim() ? escapeHtml(i.studioAddress.trim()) : null;
  const unsubscribe = escapeHtml(i.unsubscribeUrl);
  const ctaUrl = escapeHtml(b.cta.url);
  const paras = b.paragraphs
    .map((p) => `<p style="margin:0 0 14px;">${escapeHtml(p)}</p>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(b.subject)}</title></head>
<body style="margin:0;padding:0;background:#f6f4ef;font-family:'Helvetica Neue',Arial,sans-serif;color:#1d1b18;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;">
<tr><td style="padding:28px 32px 8px;font-size:20px;font-weight:600;color:${accent};">${studio}</td></tr>
<tr><td style="padding:8px 32px 8px;font-size:16px;line-height:1.55;">${paras}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 8px;"><tr><td style="background:${accent};border-radius:8px;padding:12px 24px;">
<a href="${ctaUrl}" style="color:#ffffff;text-decoration:none;font-weight:600;">${escapeHtml(b.cta.label)}</a></td></tr></table>
</td></tr>
<tr><td style="padding:20px 32px 28px;font-size:12px;line-height:1.5;color:#6b665e;border-top:1px solid #eee;">
You're getting this because you said yes to emails from ${studio}.
<a href="${unsubscribe}" style="color:#6b665e;">Unsubscribe</a>${address ? `<br>${address}` : ""}
</td></tr></table></td></tr></table></body></html>`;

  const text = [
    ...b.paragraphs,
    "",
    `${b.cta.label}: ${b.cta.url}`,
    "",
    "--",
    `You're getting this because you said yes to emails from ${i.studioName}.`,
    `Unsubscribe: ${i.unsubscribeUrl}`,
    ...(i.studioAddress?.trim() ? [i.studioAddress.trim()] : []),
  ].join("\n");

  return { subject: b.subject, html, text };
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  "automation_guest_save_details",
  "automation_guest_intro_offer",
  "automation_first_visit_welcome",
  "automation_first_visit_intro_offer",
  "automation_lapsed",
];

export function isAutomationTemplate(t: string): t is AutomationTemplate {
  return (AUTOMATION_TEMPLATES as string[]).includes(t);
}
