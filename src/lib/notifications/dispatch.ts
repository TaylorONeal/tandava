/**
 * Notification dispatch helpers.
 *
 * Thin, typed wrappers over the transactional Edge Functions (email / sms /
 * push). Sending happens server-side; these just invoke the functions through
 * the backend abstraction so app code never builds provider requests directly.
 */

import { api } from "@/lib/backend";

export interface EmailDispatch {
  to: string;
  template?: string;
  data?: Record<string, unknown>;
  subject?: string;
  html?: string;
  replyTo?: string;
}

export interface SmsDispatch {
  to: string; // E.164
  template?: string;
  data?: Record<string, unknown>;
  body?: string;
}

export interface PushDispatch {
  profileId: string;
  title: string;
  body?: string;
  url?: string;
}

/** Send a transactional email via the `email` Edge Function. */
export function sendEmail(input: EmailDispatch) {
  return api.invoke("email", input as unknown as Record<string, unknown>);
}

/** Send an SMS via the `sms` Edge Function. */
export function sendSms(input: SmsDispatch) {
  return api.invoke("sms", input as unknown as Record<string, unknown>);
}

/** Send a web push notification to a member's devices via the `push` function. */
export function sendPush(input: PushDispatch) {
  return api.invoke("push", input as unknown as Record<string, unknown>);
}
