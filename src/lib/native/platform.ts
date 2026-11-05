import { Capacitor } from '@capacitor/core';

export type NativeApp = 'member' | 'studio';
export function parseNativeApp(value: unknown): NativeApp | null {
  return value === 'member' || value === 'studio' ? value : null;
}
export const nativeApp = parseNativeApp(import.meta.env.VITE_NATIVE_APP);
export const isNativeApp = () => nativeApp !== null && Capacitor.isNativePlatform();
// Native release uses first-party email authentication only. Web OAuth remains unchanged.
export const offersSocialAuth = () => nativeApp === null;
// Email links must open a reachable website, never the bundled capacitor://localhost.
// Native auth handoff requires separately configured and verified app links.
export function authRedirectOrigin(app: NativeApp | null, browserOrigin: string): string {
  return app === null ? browserOrigin : 'https://tandavastudio.com';
}
export function nativeHome(app: NativeApp, signedIn: boolean, canManage: boolean, canTeach: boolean): string {
  if (app === 'member') return signedIn ? '/my-schedule' : '/discover';
  if (!signedIn) return '/auth/login?next=%2F';
  return canManage ? '/manage' : canTeach ? '/teach/schedule' : '/account';
}
export function nativeLink(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.origin !== 'https://tandavastudio.com' || url.username || url.password) return null;
    if (!/^\/s\/[a-z0-9-]+(?:\/book\/[a-f0-9-]+)?\/?$/.test(url.pathname)) return null;
    return url.pathname + url.search;
  } catch { return null; }
}

// Enable only for a candidate backed by migration 50 + native-checkout and a
// verified native handoff. This is a release switch, never a server authorization.
export const nativePhysicalPayments = import.meta.env.VITE_NATIVE_PHYSICAL_PAYMENTS === 'true';
/** Ambiguous endpoints remain blocked; physical checkout has its own endpoint. */
export function blocksNativePayment(app: NativeApp | null, functionName: string, physicalEnabled = nativePhysicalPayments): boolean {
  return app !== null && (functionName === 'express-book'
    || (['stripe-checkout', 'native-checkout', 'stripe-portal', 'native-portal'].includes(functionName) && !physicalEnabled));
}
