/**
 * Email Templates
 *
 * Each template is a function that accepts typed data and returns
 * { subject, html, text } for the email provider.
 *
 * The HTML uses inline styles for maximum email client compatibility.
 * No external template engine dependency — plain TypeScript template literals.
 */

// ---------------------------------------------------------------------------
// Shared layout wrapper
// ---------------------------------------------------------------------------
const BRAND_COLOR = "#4fd1c5";
const BG_COLOR = "#0f0a14";
const CARD_BG = "#1a1520";
const TEXT_COLOR = "#f5f0e8";
const MUTED_COLOR = "#999";

function layout(body: string): string {
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

function button(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr><td style="background:${BRAND_COLOR};border-radius:8px;padding:14px 32px;">
    <a href="${url}" style="color:${BG_COLOR};text-decoration:none;font-weight:600;font-size:16px;">${text}</a>
  </td></tr>
</table>`;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface TemplateResult {
  subject: string;
  html: string;
  text: string;
}

/** Welcome email after registration */
export function welcomeEmail(data: {
  firstName: string;
  appUrl: string;
}): TemplateResult {
  return {
    subject: `Welcome to Tandava, ${data.firstName}!`,
    html: layout(`
      <h1 style="color:${TEXT_COLOR};font-size:24px;margin:0 0 16px;">Welcome, ${data.firstName}!</h1>
      <p>We're excited to have you join our yoga community. Here's what you can do next:</p>
      <ul style="padding-left:20px;">
        <li>Browse studios and find classes near you</li>
        <li>Book your first class</li>
        <li>Set up your practice preferences</li>
      </ul>
      ${button("Explore Classes", `${data.appUrl}/schedule`)}
      <p style="color:${MUTED_COLOR};">If you have any questions, feel free to reach out through the app.</p>
    `),
    text: `Welcome to Tandava, ${data.firstName}!\n\nWe're excited to have you join our yoga community.\n\nExplore classes: ${data.appUrl}/schedule`,
  };
}

/** Booking confirmation */
export function bookingConfirmationEmail(data: {
  firstName: string;
  className: string;
  studioName: string;
  dateTime: string;
  duration: number;
  instructor: string;
  address: string;
  appUrl: string;
}): TemplateResult {
  return {
    subject: `Booking Confirmed: ${data.className}`,
    html: layout(`
      <h1 style="color:${TEXT_COLOR};font-size:24px;margin:0 0 16px;">You're booked, ${data.firstName}!</h1>
      <table cellpadding="0" cellspacing="0" style="width:100%;background:rgba(79,209,197,0.1);border-radius:12px;padding:20px;margin:16px 0;">
        <tr><td>
          <p style="margin:0 0 8px;font-weight:600;font-size:18px;color:${BRAND_COLOR};">${data.className}</p>
          <p style="margin:0 0 4px;color:${TEXT_COLOR};">${data.dateTime} &bull; ${data.duration} min</p>
          <p style="margin:0 0 4px;color:${TEXT_COLOR};">with ${data.instructor}</p>
          <p style="margin:0;color:${MUTED_COLOR};">${data.studioName} &bull; ${data.address}</p>
        </td></tr>
      </table>
      ${button("View My Schedule", `${data.appUrl}/my-schedule`)}
      <p style="color:${MUTED_COLOR};font-size:14px;">Need to cancel? You can manage your booking from your schedule.</p>
    `),
    text: `Booking Confirmed: ${data.className}\n\n${data.dateTime} - ${data.duration} min\nwith ${data.instructor}\n${data.studioName} - ${data.address}\n\nView schedule: ${data.appUrl}/my-schedule`,
  };
}

/** Booking cancellation */
export function bookingCancellationEmail(data: {
  firstName: string;
  className: string;
  studioName: string;
  dateTime: string;
  appUrl: string;
}): TemplateResult {
  return {
    subject: `Booking Cancelled: ${data.className}`,
    html: layout(`
      <h1 style="color:${TEXT_COLOR};font-size:24px;margin:0 0 16px;">Booking Cancelled</h1>
      <p>Hi ${data.firstName}, your booking has been cancelled:</p>
      <p style="color:${MUTED_COLOR};">${data.className} at ${data.studioName}<br/>${data.dateTime}</p>
      <p>We hope to see you in another class soon!</p>
      ${button("Browse Classes", `${data.appUrl}/schedule`)}
    `),
    text: `Booking Cancelled: ${data.className} at ${data.studioName}\n${data.dateTime}\n\nBrowse classes: ${data.appUrl}/schedule`,
  };
}

/** Class reminder (24h or 1h before) */
export function classReminderEmail(data: {
  firstName: string;
  className: string;
  studioName: string;
  dateTime: string;
  instructor: string;
  address: string;
  timeUntil: string;
  appUrl: string;
}): TemplateResult {
  return {
    subject: `Reminder: ${data.className} in ${data.timeUntil}`,
    html: layout(`
      <h1 style="color:${TEXT_COLOR};font-size:24px;margin:0 0 16px;">Class Reminder</h1>
      <p>Hi ${data.firstName}, your class starts in <strong>${data.timeUntil}</strong>:</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;background:rgba(79,209,197,0.1);border-radius:12px;padding:20px;margin:16px 0;">
        <tr><td>
          <p style="margin:0 0 8px;font-weight:600;font-size:18px;color:${BRAND_COLOR};">${data.className}</p>
          <p style="margin:0 0 4px;color:${TEXT_COLOR};">${data.dateTime}</p>
          <p style="margin:0 0 4px;color:${TEXT_COLOR};">with ${data.instructor}</p>
          <p style="margin:0;color:${MUTED_COLOR};">${data.studioName} &bull; ${data.address}</p>
        </td></tr>
      </table>
      ${button("View Details", `${data.appUrl}/my-schedule`)}
    `),
    text: `Reminder: ${data.className} in ${data.timeUntil}\n${data.dateTime}\nwith ${data.instructor}\n${data.studioName} - ${data.address}`,
  };
}

/** Waitlist promoted (spot opened) */
export function waitlistPromotedEmail(data: {
  firstName: string;
  className: string;
  studioName: string;
  dateTime: string;
  appUrl: string;
}): TemplateResult {
  return {
    subject: `A spot opened up: ${data.className}!`,
    html: layout(`
      <h1 style="color:${TEXT_COLOR};font-size:24px;margin:0 0 16px;">You're In!</h1>
      <p>Great news, ${data.firstName}! A spot opened up and you've been moved from the waitlist to confirmed for:</p>
      <p style="font-weight:600;color:${BRAND_COLOR};font-size:18px;">${data.className}</p>
      <p style="color:${MUTED_COLOR};">${data.studioName} &bull; ${data.dateTime}</p>
      ${button("View My Schedule", `${data.appUrl}/my-schedule`)}
    `),
    text: `You're in! A spot opened for ${data.className} at ${data.studioName}\n${data.dateTime}\n\nView schedule: ${data.appUrl}/my-schedule`,
  };
}

/** Password reset */
export function passwordResetEmail(data: {
  firstName: string;
  resetUrl: string;
}): TemplateResult {
  return {
    subject: "Reset Your Password",
    html: layout(`
      <h1 style="color:${TEXT_COLOR};font-size:24px;margin:0 0 16px;">Reset Your Password</h1>
      <p>Hi ${data.firstName}, we received a request to reset your password. Click the button below to create a new one:</p>
      ${button("Reset Password", data.resetUrl)}
      <p style="color:${MUTED_COLOR};font-size:14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `),
    text: `Reset Your Password\n\nHi ${data.firstName}, click to reset: ${data.resetUrl}\n\nExpires in 1 hour. Ignore if you didn't request this.`,
  };
}

/** Studio inquiry notification (sent to studio owner) */
export function studioInquiryNotificationEmail(data: {
  studioName: string;
  senderName: string;
  senderEmail: string;
  messageSubject: string;
  messageBody: string;
  manageUrl: string;
}): TemplateResult {
  return {
    subject: `New inquiry for ${data.studioName}: ${data.messageSubject}`,
    html: layout(`
      <h1 style="color:${TEXT_COLOR};font-size:24px;margin:0 0 16px;">New Studio Inquiry</h1>
      <p>You have a new message for <strong>${data.studioName}</strong>:</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;background:rgba(255,255,255,0.05);border-radius:12px;padding:20px;margin:16px 0;">
        <tr><td>
          <p style="margin:0 0 8px;font-weight:600;color:${TEXT_COLOR};">${data.messageSubject}</p>
          <p style="margin:0 0 8px;color:${TEXT_COLOR};">${data.messageBody}</p>
          <p style="margin:0;color:${MUTED_COLOR};">From: ${data.senderName} (${data.senderEmail})</p>
        </td></tr>
      </table>
      ${button("View in Inbox", data.manageUrl)}
    `),
    text: `New inquiry for ${data.studioName}\n\nSubject: ${data.messageSubject}\n${data.messageBody}\n\nFrom: ${data.senderName} (${data.senderEmail})\n\nView: ${data.manageUrl}`,
  };
}
