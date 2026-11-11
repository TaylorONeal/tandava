import { describe, expect, it, vi } from "vitest";
import { readOAuthProviders } from "./oauthProviders";

describe("readOAuthProviders", () => {
  it("is off without a backend", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    await expect(readOAuthProviders(vi.fn() as unknown as typeof fetch)).resolves.toEqual({ google: false, apple: false });
    vi.unstubAllEnvs();
  });

  it("follows the auth server settings", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://x.supabase.co/");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "pk");
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ external: { google: true, apple: false } }) });
    await expect(readOAuthProviders(f as unknown as typeof fetch)).resolves.toEqual({ google: true, apple: false });
    expect(f).toHaveBeenCalledWith("https://x.supabase.co/auth/v1/settings", { headers: { apikey: "pk" } });
    vi.unstubAllEnvs();
  });

  it("stays off when the server cannot be read", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "pk");
    const f = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(readOAuthProviders(f as unknown as typeof fetch)).resolves.toEqual({ google: false, apple: false });
    vi.unstubAllEnvs();
  });
});
