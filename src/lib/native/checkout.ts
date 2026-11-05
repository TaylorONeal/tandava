import { Browser } from '@capacitor/browser';
import { isNativeApp, type NativeApp } from './platform';

let checkoutOpen = false;
export const checkoutReturnScheme = (app: NativeApp) => `tandava-${app}://checkout-return`;
export function isCheckoutReturn(raw: string, app: NativeApp | null): boolean {
  return app !== null && raw === checkoutReturnScheme(app);
}
export function consumeCheckoutReturn(): boolean {
  const wasOpen = checkoutOpen;
  checkoutOpen = false;
  return wasOpen;
}

/** Keep the authenticated app alive. A browser return never proves payment. */
export async function openCheckoutUrl(raw: string): Promise<{ error?: string }> {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com' || url.username || url.password || url.port) {
      return { error: 'The payment link was not valid. Please try again.' };
    }
    if (isNativeApp()) {
      checkoutOpen = true;
      try { await Browser.open({ url: url.href }); }
      catch { checkoutOpen = false; return { error: 'Could not open checkout. Please try again.' }; }
    } else {
      window.location.assign(url.href);
    }
    return {};
  } catch { return { error: 'The payment link was not valid. Please try again.' }; }
}
