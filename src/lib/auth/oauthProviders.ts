/**
 * Which social sign-ins the auth server actually has switched on. A Google
 * button for a provider that is off sends people to an error page, so the
 * buttons stay hidden until the server says yes.
 */
export type OAuthProviders = { google: boolean; apple: boolean };

export function readOAuthProviders(fetchImpl: typeof fetch = fetch): Promise<OAuthProviders> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) return Promise.resolve({ google: false, apple: false });
  return fetchImpl(`${url.replace(/\/$/, "")}/auth/v1/settings`, { headers: { apikey: key } })
    .then((r) => (r.ok ? r.json() : null))
    .then((body) => ({
      google: body?.external?.google === true,
      apple: body?.external?.apple === true,
    }))
    .catch(() => ({ google: false, apple: false }));
}
