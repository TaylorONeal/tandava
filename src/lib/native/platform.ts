import { Capacitor } from '@capacitor/core';

export type NativeApp = 'member' | 'studio';
export function parseNativeApp(value: unknown): NativeApp | null {
  return value === 'member' || value === 'studio' ? value : null;
}
export const nativeApp = parseNativeApp(import.meta.env.VITE_NATIVE_APP);
export const isNativeApp = () => nativeApp !== null && Capacitor.isNativePlatform();
// Native release uses first-party email authentication only. Web OAuth remains unchanged.
export const offersSocialAuth = () => nativeApp === null;
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

/** Until catalog delivery types are enforceable, native must not create web checkout. */
export function blocksNativePayment(app: NativeApp | null, functionName: string): boolean {
  return app !== null && ['stripe-checkout', 'express-book', 'stripe-portal'].includes(functionName);
}
