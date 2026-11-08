import { useEffect, useState } from "react";
import { isBackendConfigured } from "@/lib/backend";
import { readOAuthProviders, type OAuthProviders } from "@/lib/auth/oauthProviders";

let cached: Promise<OAuthProviders> | null = null;

/** Social sign-ins the server has on. Demo builds keep Google so the demo flow is unchanged. */
export function useOAuthProviders(): OAuthProviders {
  const demo = !isBackendConfigured();
  const [providers, setProviders] = useState<OAuthProviders>(
    demo ? { google: true, apple: false } : { google: false, apple: false },
  );
  useEffect(() => {
    if (demo) return;
    let live = true;
    cached ??= readOAuthProviders();
    cached.then((p) => { if (live) setProviders(p); });
    return () => { live = false; };
  }, [demo]);
  return providers;
}
