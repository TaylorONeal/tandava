import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { isNativeApp, nativeLink } from '@/lib/native/platform';

/** Native lifecycle and offline status. Does not cache private records across identities. */
export function NativeStatus() {
  const location = useLocation();
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    if (!isNativeApp()) return;
    let disposed = false;
    const removers: Array<() => Promise<void>> = [];
    const keep = async (registration: Promise<{ remove: () => Promise<void> }>) => {
      const h = await registration.catch(() => null);
      if (!h) return;
      if (disposed) await h.remove(); else removers.push(() => h.remove());
    };
    void Network.getStatus().then(s => { if (!disposed) setOffline(!s.connected); }).catch(() => setOffline(true));
    void keep(Network.addListener('networkStatusChange', s => setOffline(!s.connected)));
    void keep(App.addListener('appUrlOpen', ({ url }) => {
      const path = nativeLink(url);
      if (path) window.location.assign(path);
    }));
    void App.getLaunchUrl().then(result => {
      const path = result && nativeLink(result.url);
      if (!disposed && path) window.location.assign(path);
    }).catch(() => undefined);
    return () => { disposed = true; removers.forEach(remove => { void remove().catch(() => undefined); }); };
  }, []);
  if (!isNativeApp()) return null;
  const sharePath = nativeLink('https://tandavastudio.com' + location.pathname + location.search);
  const share = async () => {
    if (!sharePath) return;
    try { await Share.share({ title: 'Tandava', url: 'https://tandavastudio.com' + sharePath }); } catch { /* Dismissal does not change booking state. */ }
  };
  return <>{sharePath && <button type="button" onClick={() => void share()} className="fixed bottom-20 right-4 z-40 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg">Share studio</button>}{offline ? <div role="status" className="sticky top-0 z-50 bg-amber-100 p-2 text-center text-sm text-amber-950">You’re offline. Reconnect before booking or recording attendance.</div> : null}</>;
}
