import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  handle: undefined as undefined | ((request: Request) => Promise<Response>),
  email: vi.fn(), sms: vi.fn(), push: vi.fn(), createClient: vi.fn(),
  serviceKey: "service-key-for-unit-tests", user: null as null | { id: string }, activeStaff: false, staffQuery: vi.fn(),
}));
vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({
  serve: (handle: (request: Request) => Promise<Response>) => { mocks.handle = handle; },
}));
vi.mock("../../supabase/functions/email/provider.ts", () => ({ sendEmail: mocks.email }));
vi.mock("../../supabase/functions/sms/provider.ts", () => ({ sendSms: mocks.sms }));
vi.mock("https://esm.sh/@supabase/supabase-js@2", () => ({ createClient: mocks.createClient }));
vi.mock("https://esm.sh/web-push@3.6.7", () => ({
  setVapidDetails: vi.fn(), sendNotification: mocks.push,
}));

const senders = [
  { name: "email", body: { to: "member@example.test", subject: "Message", html: "<p>Message</p>" } },
  { name: "sms", body: { to: "+15550100", body: "Message" } },
  { name: "push", body: { profileId: "member", title: "Message" } },
] as const;

async function invoke(name: string, body: unknown, authorization?: string, headers: Record<string, string> = {}) {
  const modulePath = `../../supabase/functions/${name}/index.ts`;
  await import(modulePath);
  return mocks.handle!(new Request(`https://edge.example/${name}`, {
    method: "POST", headers: { ...headers, ...(authorization ? { Authorization: authorization } : {}) }, body: JSON.stringify(body),
  }));
}

describe("generic senders require trusted service authorization", () => {
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks();
    mocks.serviceKey = "service-key-for-unit-tests"; mocks.user = null; mocks.activeStaff = false;
    vi.stubGlobal("Deno", { env: { get: (name: string) => name === "SUPABASE_SERVICE_ROLE_KEY" ? mocks.serviceKey : "test-value" } });
    mocks.email.mockResolvedValue({ success: true });
    mocks.sms.mockResolvedValue({ success: true });
    mocks.push.mockResolvedValue(undefined);
    mocks.createClient.mockImplementation(() => ({
      auth: { getUser: async () => ({ data: { user: mocks.user }, error: null }) },
      from: (table: string) => {
        if (table === 'studio_staff') {
          const filters: Record<string, unknown> = {};
          const query = { select: () => query, eq: (key: string, value: unknown) => { filters[key] = value; return query; },
            in: () => query, limit: async () => { mocks.staffQuery(filters); return { data: mocks.activeStaff ? [{ studio_id: 'studio-a', role: 'owner' }] : [], error: null }; } };
          return query;
        }
        return { select: () => ({ eq: async () => ({ data: [{ id: 'subscription', endpoint: 'https://push.example.test', p256dh: 'test', auth: 'test' }], error: null }) }) };
      },
    }));
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  for (const sender of senders) {
    it.each([undefined, "Bearer ordinary-member-session", "Bearer eyJhbGciOiJub25lIn0.eyJyb2xlIjoic2VydmljZV9yb2xlIn0."])(
      `${sender.name} rejects untrusted authorization %s without dispatch`, async (authorization) => {
        const response = await invoke(sender.name, sender.body, authorization);
        expect(response.status).toBe(sender.name === "email" ? 401 : 403);
        expect(mocks.email).not.toHaveBeenCalled(); expect(mocks.sms).not.toHaveBeenCalled(); expect(mocks.push).not.toHaveBeenCalled();
        if (sender.name !== "email") expect(mocks.createClient).not.toHaveBeenCalled();
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
      expect(response.status).toBe(sender.name === "email" ? 401 : 403);
      expect(mocks.email).not.toHaveBeenCalled(); expect(mocks.sms).not.toHaveBeenCalled(); expect(mocks.push).not.toHaveBeenCalled();
    });
  }
});

describe('upstream email caller compatibility', () => {
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks();
    vi.stubGlobal('Deno', { env: { get: (name: string) => ({ SUPABASE_SERVICE_ROLE_KEY: 'service', EMAIL_FUNCTION_SECRET: 'internal-test-secret' })[name] ?? 'test' } });
    mocks.email.mockResolvedValue({ success: true });
    const query = { select: () => query, eq: vi.fn(() => query), in: () => query,
      limit: async () => ({ data: [{ studio_id: 'studio-a', role: 'owner' }], error: null }) };
    mocks.createClient.mockReturnValue({ auth: { getUser: async () => ({ data: { user: { id: 'staff-a' } }, error: null }) }, from: () => query });
  });
  afterEach(() => vi.unstubAllGlobals());
  it('allows the configured internal secret without a service bearer', async () => {
    const response = await invoke('email', senders[0].body, undefined, { 'x-email-secret': 'internal-test-secret' });
    expect(response.status).toBe(200); expect(mocks.email).toHaveBeenCalledOnce(); expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it('does not let an active staff JWT send an unscoped authentication link', async () => {
    const response = await invoke('email', { to: 'member@example.test', template: 'express_continue', data: { url: 'https://tandavastudio.com/auth/login' } }, 'Bearer staff-session');
    expect(response.status).toBe(403); expect(mocks.email).not.toHaveBeenCalled();
  });
  it('rejects an authenticated user without an active staff role', async () => {
    const query = { select: () => query, eq: () => query, in: () => query, limit: async () => ({ data: [], error: null }) };
    mocks.createClient.mockReturnValue({ auth: { getUser: async () => ({ data: { user: { id: 'inactive-staff' } }, error: null }) }, from: () => query });
    const response = await invoke('email', { to: 'member@example.test', template: 'express_continue', data: { url: 'https://tandavastudio.com/auth/login' } }, 'Bearer inactive-session');
    expect(response.status).toBe(403); expect(mocks.email).not.toHaveBeenCalled();
  });
  it('keeps arbitrary raw messages restricted to internal callers', async () => {
    const response = await invoke('email', senders[0].body, 'Bearer staff-session');
    expect(response.status).toBe(403); expect(mocks.email).not.toHaveBeenCalled();
  });
});
