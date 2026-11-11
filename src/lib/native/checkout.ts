import { Browser } from '@capacitor/browser';
import { isNativeApp, type NativeApp } from './platform';

let paymentReturn: '/checkout/status' | '/account' | null = null;
export const checkoutReturnScheme = (app: NativeApp, billing = false) => `tandava-${app}://${billing ? 'billing' : 'checkout'}-return`;
export function isCheckoutReturn(raw: string, app: NativeApp | null): boolean {
  return app !== null && raw === checkoutReturnScheme(app);
}
export function paymentReturnPath(raw: string, app: NativeApp | null): '/checkout/status' | '/account' | null {
  if (isCheckoutReturn(raw, app)) return '/checkout/status';
  return app && raw === checkoutReturnScheme(app, true) ? '/account' : null;
}
export function consumePaymentReturn(): '/checkout/status' | '/account' | null {
  const path = paymentReturn;
  paymentReturn = null;
  return path;
}

/** Keep the authenticated app alive. A browser return never proves payment. */
async function openPaymentUrl(raw: string, billing: boolean): Promise<{ error?: string }> {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.hostname !== (billing ? 'billing.stripe.com' : 'checkout.stripe.com') || url.username || url.password || url.port) {
      return { error: 'The payment link was not valid. Please try again.' };
    }
    if (isNativeApp()) {
      paymentReturn = billing ? '/account' : '/checkout/status';
      try { await Browser.open({ url: url.href }); }
      catch { paymentReturn = null; return { error: `Could not open ${billing ? 'billing' : 'checkout'}. Please try again.` }; }
    } else {
      window.location.assign(url.href);
    }
    return {};
  } catch { return { error: 'The payment link was not valid. Please try again.' }; }
}

export const openCheckoutUrl = (url: string) => openPaymentUrl(url, false);
export const openBillingUrl = (url: string) => openPaymentUrl(url, true);
