/**
 * The "confirm email updates" message sent when someone ticks the marketing
 * box on the public booking form (confirmed opt-in). Nothing is sent from the
 * studio's automations until this is confirmed. Pure, so it can be tested.
 */

// No imports: this file is also loaded by the express-book Edge Function (Deno),
// which needs explicit .ts paths that the app's bundler setup doesn't use.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface OptInEmailInput {
  studioName: string;
  confirmUrl: string;
}

export function renderOptInConfirmEmail(i: OptInEmailInput): { subject: string; html: string; text: string } {
  const studio = escapeHtml(i.studioName);
  const url = escapeHtml(i.confirmUrl);
  const subject = `Confirm email updates from ${i.studioName}`;
  const text = [
    `You asked ${i.studioName} to send you occasional emails about classes and offers.`,
    `Confirm here (the link works for 14 days): ${i.confirmUrl}`,
    `Didn't ask for this? Ignore this email and you won't get any.`,
  ].join("\n\n");
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:24px;background:#f6f5f2;font-family:Helvetica,Arial,sans-serif;color:#1d1d1f;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:28px;">
<tr><td style="font-size:16px;line-height:1.6;">
<p style="margin:0 0 14px;">You asked ${studio} to send you occasional emails about classes and offers.</p>
<p style="margin:0 0 20px;">Tap below to confirm. The link works for 14 days.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#1d1d1f;border-radius:8px;padding:12px 24px;">
<a href="${url}" style="color:#ffffff;text-decoration:none;font-weight:600;">Yes, send me updates</a></td></tr></table>
<p style="margin:20px 0 0;font-size:13px;color:#6e6e73;">Didn't ask for this? Ignore this email and you won't get any.</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, html, text };
}
