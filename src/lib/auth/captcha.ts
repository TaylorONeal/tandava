/**
 * Cloudflare Turnstile for Supabase Auth.
 *
 * When Supabase Auth has captcha switched on, every sign-up, password sign-in
 * and password-reset request must carry a fresh Turnstile token, or Supabase
 * rejects it. Turning captcha on in the dashboard before this code ships would
 * lock everyone out, so the order is: ship this, set VITE_TURNSTILE_SITE_KEY,
 * then enable captcha in Supabase with the secret key.
 *
 * Tokens are single use. The widget writes one here; the auth call takes it
 * (clearing it) and asks the widget for a new one.
 */

export const TURNSTILE_SITE_KEY: string = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? "";

export function captchaEnabled(siteKey: string = TURNSTILE_SITE_KEY): boolean {
  return siteKey.trim().length > 0;
}

type Listener = () => void;

let token: string | null = null;
const tokenListeners = new Set<Listener>();
const resetListeners = new Set<Listener>();

export function setCaptchaToken(value: string | null): void {
  token = value;
  tokenListeners.forEach((fn) => fn());
}

export function getCaptchaToken(): string | null {
  return token;
}

/** Take the current token for one auth call, then ask widgets for a new one. */
export function takeCaptchaToken(): string | undefined {
  const value = token ?? undefined;
  token = null;
  tokenListeners.forEach((fn) => fn());
  if (value) resetListeners.forEach((fn) => fn());
  return value;
}

export function onCaptchaToken(fn: Listener): () => void {
  tokenListeners.add(fn);
  return () => tokenListeners.delete(fn);
}

export function onCaptchaReset(fn: Listener): () => void {
  resetListeners.add(fn);
  return () => resetListeners.delete(fn);
}

/** Supabase auth `options` fragment: only present when there is a token. */
export function captchaOption(): { captchaToken?: string } {
  const value = takeCaptchaToken();
  return value ? { captchaToken: value } : {};
}
