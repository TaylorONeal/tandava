import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  handle: undefined as undefined | ((request: Request) => Promise<Response>),
  sendEmail: vi.fn(),
}));
vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({
  serve: (handle: (request: Request) => Promise<Response>) => { mocks.handle = handle; },
}));
vi.mock("../../supabase/functions/email/provider.ts", () => ({ sendEmail: mocks.sendEmail }));

describe("express booking continuation email", () => {
  beforeEach(async () => {
    vi.resetModules(); vi.clearAllMocks();
    vi.stubGlobal("Deno", { env: { get: () => "service-key-for-unit-tests" } });
    mocks.sendEmail.mockResolvedValue({ success: true });
    const modulePath = "../../supabase/functions/email/index.ts";
    await import(modulePath);
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  const request = (url: string) => new Request("https://edge.example/email", {
    method: "POST", headers: { Authorization: "Bearer service-key-for-unit-tests" },
    body: JSON.stringify({ to: "member@example.test", template: "express_continue", data: { url } }),
  });

  it("dispatches the registered template with the exact sign-in return destination", async () => {
    const url = "https://tandavastudio.com/auth/login?next=%2Fs%2Fstudio%2Fbook%2Fclass&source=email";
    const response = await mocks.handle!(request(url));
    expect(response.status).toBe(200);
    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
    const message = mocks.sendEmail.mock.calls[0][0];
    expect(message.to).toBe("member@example.test");
    expect(message.subject).toBe("Sign in to finish your booking");
    expect(message.text).toContain(url);
    expect(message.html).toContain('href="https://tandavastudio.com/auth/login?next=%2Fs%2Fstudio%2Fbook%2Fclass&amp;source=email"');
    expect(message.text).not.toMatch(/booking confirmed|you.re booked|expires|30 minutes/i);
  });

  it("does not send a continuation email with an unsafe destination", async () => {
    const response = await mocks.handle!(request("javascript:alert(1)"));
    expect(response.status).toBe(400);
    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });
});
