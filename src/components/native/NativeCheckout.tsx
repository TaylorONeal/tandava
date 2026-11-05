import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { isNativeApp, nativeApp } from '@/lib/native/platform';
import { consumeCheckoutReturn, isCheckoutReturn } from '@/lib/native/checkout';

let initialReturnRead = false;
export function NativeCheckout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!isNativeApp()) return;
    let disposed = false;
    const handles: Array<{ remove: () => Promise<void> }> = [];
    const keep = async (registration: Promise<{ remove: () => Promise<void> }>) => {
      const handle = await registration.catch(() => null);
      if (handle) { if (disposed) await handle.remove(); else handles.push(handle); }
    };
    const returned = () => {
      if (disposed) return;
      void queryClient.invalidateQueries();
      navigate('/checkout/status', { replace: true });
    };
    const onUrl = (url: string) => {
      if (disposed || !isCheckoutReturn(url, nativeApp)) return;
      consumeCheckoutReturn();
      void Browser.close().catch(() => undefined);
      returned();
    };
    void keep(App.addListener('appUrlOpen', ({ url }) => onUrl(url)));
    void keep(Browser.addListener('browserFinished', () => {
      if (!disposed && consumeCheckoutReturn()) returned();
    }));
    if (!initialReturnRead) {
      void App.getLaunchUrl().then(result => {
        if (disposed || initialReturnRead) return;
        initialReturnRead = true;
        if (result) onUrl(result.url);
      }).catch(() => undefined);
    }
    return () => { disposed = true; handles.forEach(handle => { void handle.remove().catch(() => undefined); }); };
  }, [navigate, queryClient]);
  return null;
}
