import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  handle: undefined as undefined | ((request: Request) => Promise<Response>),
  portal: vi.fn(),
  retrieve: vi.fn(),
  createClient: vi.fn(),
}));

vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({
  serve: (handle: (request: Request) => Promise<Response>) => { mocks.handle = handle; },
}));
vi.mock("https://esm.sh/@supabase/supabase-js@2", () => ({ createClient: mocks.createClient }));
vi.mock("https://esm.sh/stripe@14?target=deno", () => ({
  default: class {
    subscriptions = { retrieve: mocks.retrieve };
    billingPortal = { sessions: { create: mocks.portal } };
  },
}));

describe("Stripe customer portal return destination", () => {
  afterEach(() => { vi.unstubAllGlobals(); });
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal("Deno", { env: { get: (name: string) => name === "APP_URL" ? "https://tandavastudio.com" : "test-config" } });
    const query = {
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), not: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { stripe_subscription_id: "sub_member", studio_id: "studio" } }),
    };
    mocks.createClient
      .mockReturnValueOnce({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "member" } } }) } })
      .mockReturnValueOnce({ from: vi.fn().mockReturnValue(query) });
    mocks.retrieve.mockResolvedValue({ customer: "cus_member" });
    mocks.portal.mockResolvedValue({ url: "https://billing.stripe.com/session/test" });
    const modulePath = "../../supabase/functions/stripe-portal/index.ts";
    await import(modulePath);
  });

  it.each(["https://evil.example/", "/\t/evil.example", "javascript:alert(1)"])(
    "replaces untrusted destination %s with the account page", async (returnUrl) => {
      const response = await mocks.handle!(new Request("https://edge.example/stripe-portal", {
        method: "POST", body: JSON.stringify({ returnUrl }),
      }));
      expect(response.status).toBe(200);
      expect(mocks.portal).toHaveBeenCalledWith({ customer: "cus_member", return_url: "https://tandavastudio.com/account" });
    },
  );

  it("preserves an app-relative return destination", async () => {
    await mocks.handle!(new Request("https://edge.example/stripe-portal", {
      method: "POST", body: JSON.stringify({ returnUrl: "/account?billing=done" }),
    }));
    expect(mocks.portal).toHaveBeenCalledWith({ customer: "cus_member", return_url: "https://tandavastudio.com/account?billing=done" });
  });
});
