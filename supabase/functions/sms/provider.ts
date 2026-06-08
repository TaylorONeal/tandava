/**
 * SMS Provider Abstraction
 *
 * Unified SMS sending. Swap providers via the SMS_PROVIDER env var:
 *   - "twilio"  — Twilio (https://twilio.com)
 *   - "console" — logs to stdout (development/testing)
 *
 * Errors are returned, never thrown, so a failed text never blocks the
 * operation that triggered it (fire-and-forget).
 */

export interface SmsMessage {
  to: string; // E.164, e.g. +14155550123
  body: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

interface SmsProviderAdapter {
  name: string;
  send(message: SmsMessage): Promise<SmsResult>;
}

function createTwilioProvider(): SmsProviderAdapter {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM");

  return {
    name: "twilio",
    async send(message) {
      if (!sid || !token || !from) {
        return { success: false, error: "Twilio env not configured", provider: "twilio" };
      }
      const body = new URLSearchParams({ To: message.to, From: from, Body: message.body });
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        },
      );
      if (!res.ok) {
        return { success: false, error: await res.text(), provider: "twilio" };
      }
      const data = await res.json();
      return { success: true, messageId: data.sid, provider: "twilio" };
    },
  };
}

function createConsoleProvider(): SmsProviderAdapter {
  return {
    name: "console",
    async send(message) {
      console.log("=== SMS (console provider) ===");
      console.log(`To: ${message.to}`);
      console.log(`Body: ${message.body}`);
      console.log("==============================");
      return { success: true, messageId: `console-${Date.now()}`, provider: "console" };
    },
  };
}

function getProvider(): SmsProviderAdapter {
  const provider = (Deno.env.get("SMS_PROVIDER") || "console").toLowerCase();
  switch (provider) {
    case "twilio":
      return createTwilioProvider();
    case "console":
    default:
      return createConsoleProvider();
  }
}

export async function sendSms(message: SmsMessage): Promise<SmsResult> {
  const provider = getProvider();
  try {
    return await provider.send(message);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[sms] ${provider.name} failed:`, errorMsg);
    return { success: false, error: errorMsg, provider: provider.name };
  }
}
