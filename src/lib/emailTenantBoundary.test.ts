import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ handle: undefined as undefined | ((r: Request) => Promise<Response>), send: vi.fn(), client: vi.fn(), active: true, staffStudio: 'studio-a', recipientStudio: 'studio-a', recipientId: 'member-a' }));
vi.mock('https://deno.land/std@0.168.0/http/server.ts', () => ({ serve: (handle: (r: Request) => Promise<Response>) => { mocks.handle = handle; } }));
vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({ createClient: mocks.client }));
vi.mock('../../supabase/functions/email/provider.ts', () => ({ sendEmail: mocks.send }));
describe('staff email tenant boundary', () => {
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks(); mocks.active = true; mocks.staffStudio = 'studio-a'; mocks.recipientStudio = 'studio-a'; mocks.recipientId = 'member-a';
    vi.stubGlobal('Deno', { env: { get: (name: string) => ({ SUPABASE_SERVICE_ROLE_KEY: 'service', EMAIL_FUNCTION_SECRET: 'internal', APP_URL: 'https://tandavastudio.com' })[name] ?? 'test' } });
    mocks.send.mockResolvedValue({ success: true });
    mocks.client.mockImplementation(() => ({ auth: { getUser: async () => ({ data: { user: { id: 'staff-a' } }, error: null }) }, from: (table: string) => {
      const filters: Record<string, unknown> = {};
      const row = () => table === 'studio_staff' ? ((filters.is_active === undefined || filters.is_active === mocks.active) && (filters.studio_id === undefined || filters.studio_id === mocks.staffStudio) ? { studio_id: mocks.staffStudio, role: 'owner' } : null)
        : filters.studio_id === mocks.recipientStudio && filters.profile_id === mocks.recipientId ? { profiles: { email: 'member@example.test' } } : null;
      const q = { select: () => q, eq: (key: string, value: unknown) => { filters[key] = value; return q; }, in: () => q,
        limit: async () => ({ data: row() ? [row()] : [], error: null }), maybeSingle: async () => ({ data: row(), error: null }) }; return q;
    } }));
  });
  afterEach(() => vi.unstubAllGlobals());
  const valid = { studioId: 'studio-a', recipientProfileId: 'member-a', to: 'member@example.test', template: 'welcome', data: { firstName: '<img src=x onerror=alert(1)>', appUrl: 'https://evil.test' } };
  async function invoke(body: unknown) {
    const path = '../../supabase/functions/email/index.ts'; await import(path);
    return mocks.handle!(new Request('https://edge.test/email', { method: 'POST', headers: { Authorization: 'Bearer staff-session' }, body: JSON.stringify(body) }));
  }
  it('allows a template for an owned studio member with the trusted app destination', async () => {
    expect((await invoke(valid)).status).toBe(200);
    expect(mocks.send).toHaveBeenCalledOnce();
    const message = mocks.send.mock.calls[0][0]; expect(message.html).not.toContain('https://evil.test'); expect(message.html).not.toContain('<img'); expect(message.text).toContain('https://tandavastudio.com');
  });
  it('rejects inactive staff in the correct studio', async () => {
    mocks.active = false;
    expect((await invoke(valid)).status).toBe(403);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each([null, [], 5])('rejects a non-object body without dispatch', async body => {
    expect((await invoke(body)).status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each([
    { ...valid, studioId: undefined }, { ...valid, studioId: 'studio-b' },
    { ...valid, recipientProfileId: 'unrelated-person' }, { ...valid, to: 'stranger@example.test' },
    { ...valid, replyTo: 'attacker@example.test' },
  ])('rejects messages outside the verified studio/recipient contract', async body => {
    expect((await invoke(body)).status).toBe(403); expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each(['express_continue','passwordReset','studioInquiryNotification'])('keeps %s service-only', async template => {
    expect((await invoke({ ...valid, template, data: { url: 'https://evil.test', resetUrl: 'https://evil.test' } })).status).toBe(403); expect(mocks.send).not.toHaveBeenCalled();
  });
});
