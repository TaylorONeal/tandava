import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({ serve: vi.fn() }));
vi.mock("https://esm.sh/@supabase/supabase-js@2", () => ({ createClient: vi.fn() }));
vi.mock("https://esm.sh/stripe@14?target=deno", () => ({ default: class {} }));
vi.mock("../../supabase/functions/email/provider.ts", () => ({ emailProviderReady: vi.fn(), sendEmail: vi.fn() }));

describe("existing-member express booking continuation", () => {
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks();
    vi.stubGlobal("Deno", { env: { get: (name: string) => name === "APP_URL" ? "https://tandavastudio.com" : "test-value" } });
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("returns through real sign-in to the selected class without a phantom continuation token", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { success: true }, error: null });
    const modulePath = "../../supabase/functions/express-book/index.ts";
    const { sendContinueLink } = await import(modulePath);
    await sendContinueLink({ functions: { invoke } }, "member@example.test", "studio one", "class/id");
    expect(invoke).toHaveBeenCalledTimes(1);
    const [endpoint, request] = invoke.mock.calls[0];
    expect(endpoint).toBe("email");
    expect(request.body.template).toBe("express_continue");
    const destination = new URL(request.body.data.url);
    expect(destination.origin).toBe("https://tandavastudio.com");
    expect(destination.pathname).toBe("/auth/login");
    expect(destination.searchParams.get("next")).toBe("/s/studio%20one/book/class%2Fid");
    expect(destination.searchParams.has("continue")).toBe(false);
    expect(request.body.data).not.toHaveProperty("expires_minutes");
  });

  it("records a provider refusal without exposing delivery details to the public caller", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: null, error: { message: "provider refused" } });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const modulePath = "../../supabase/functions/express-book/index.ts";
    const { sendContinueLink } = await import(modulePath);
    await expect(sendContinueLink({ functions: { invoke } }, "member@example.test", "studio", "class")).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledWith("express-book: continue link email failed");
  });
});
