import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  handle: undefined as undefined | ((request: Request) => Promise<Response>),
  email: vi.fn(), sms: vi.fn(), push: vi.fn(), createClient: vi.fn(),
  serviceKey: "service-key-for-unit-tests",
}));
vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({
  serve: (handle: (request: Request) => Promise<Response>) => { mocks.handle = handle; },
}));
vi.mock("../../supabase/functions/email/provider.ts", () => ({ sendEmail: mocks.email }));
vi.mock("../../supabase/functions/sms/provider.ts", () => ({ sendSms: mocks.sms }));
vi.mock("https://esm.sh/@supabase/supabase-js@2", () => ({ createClient: mocks.createClient }));
vi.mock("https://esm.sh/web-push@3.6.7", () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: mocks.push },
}));

const senders = [
  { name: "email", body: { to: "member@example.test", subject: "Message", html: "<p>Message</p>" } },
  { name: "sms", body: { to: "+15550100", body: "Message" } },
  { name: "push", body: { profileId: "member", title: "Message" } },
] as const;

async function invoke(name: string, body: unknown, authorization?: string) {
  const modulePath = `../../supabase/functions/${name}/index.ts`;
  await import(modulePath);
  return mocks.handle!(new Request(`https://edge.example/${name}`, {
    method: "POST", headers: authorization ? { Authorization: authorization } : {}, body: JSON.stringify(body),
  }));
}

describe("generic senders require trusted service authorization", () => {
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks();
    mocks.serviceKey = "service-key-for-unit-tests";
    vi.stubGlobal("Deno", { env: { get: (name: string) => name === "SUPABASE_SERVICE_ROLE_KEY" ? mocks.serviceKey : "test-value" } });
    mocks.email.mockResolvedValue({ success: true });
    mocks.sms.mockResolvedValue({ success: true });
    mocks.push.mockResolvedValue(undefined);
    mocks.createClient.mockReturnValue({ from: () => ({ select: () => ({ eq: async () => ({
      data: [{ id: "subscription", endpoint: "https://push.example.test", p256dh: "test", auth: "test" }], error: null,
    }) }) }) });
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  for (const sender of senders) {
    it.each([undefined, "Bearer ordinary-member-session", "Bearer eyJhbGciOiJub25lIn0.eyJyb2xlIjoic2VydmljZV9yb2xlIn0."])(
      `${sender.name} rejects untrusted authorization %s without dispatch`, async (authorization) => {
        const response = await invoke(sender.name, sender.body, authorization);
        expect(response.status).toBe(403);
        expect(mocks.email).not.toHaveBeenCalled(); expect(mocks.sms).not.toHaveBeenCalled(); expect(mocks.push).not.toHaveBeenCalled();
        expect(mocks.createClient).not.toHaveBeenCalled();
      },
    );
    it(`${sender.name} accepts the configured service bearer`, async () => {
      const response = await invoke(sender.name, sender.body, `Bearer ${mocks.serviceKey}`);
      expect(response.status).toBe(200);
      expect(mocks[sender.name]).toHaveBeenCalledTimes(1);
    });
    it(`${sender.name} fails closed when its service credential is absent`, async () => {
      mocks.serviceKey = "";
      const response = await invoke(sender.name, sender.body, "Bearer service-key-for-unit-tests");
      expect(response.status).toBe(403);
      expect(mocks.email).not.toHaveBeenCalled(); expect(mocks.sms).not.toHaveBeenCalled(); expect(mocks.push).not.toHaveBeenCalled();
    });
  }
});
