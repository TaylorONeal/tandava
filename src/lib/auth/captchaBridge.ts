/**
 * Native apps cannot run Turnstile on capacitor://localhost or https://localhost,
 * so they frame https://tandavastudio.com/captcha-bridge.html and take the token
 * it posts back. Only messages from that exact origin are trusted.
 */
export const CAPTCHA_BRIDGE_ORIGIN = "https://tandavastudio.com";

export function captchaBridgeUrl(siteKey: string, dark: boolean): string {
  const q = new URLSearchParams({ k: siteKey });
  if (dark) q.set("theme", "dark");
  return `${CAPTCHA_BRIDGE_ORIGIN}/captcha-bridge.html?${q.toString()}`;
}

export type BridgeEvent =
  | { event: "token"; token: string }
  | { event: "expired" | "error" | "show" | "hide" };

export function parseBridgeMessage(origin: string, data: unknown): BridgeEvent | null {
  if (origin !== CAPTCHA_BRIDGE_ORIGIN || !data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (d.type !== "tandava-turnstile") return null;
  if (d.event === "token") {
    return typeof d.token === "string" && d.token.length > 0 && d.token.length < 4096
      ? { event: "token", token: d.token }
      : null;
  }
  if (d.event === "expired" || d.event === "error" || d.event === "show" || d.event === "hide") {
    return { event: d.event };
  }
  return null;
}
