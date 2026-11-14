import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ handle: undefined as undefined | ((r: Request) => Promise<Response>), send: vi.fn(), client: vi.fn() }));
vi.mock('https://deno.land/std@0.168.0/http/server.ts', () => ({ serve: (handle: (r: Request) => Promise<Response>) => { mocks.handle = handle; } }));
vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({ createClient: mocks.client }));
vi.mock('../../supabase/functions/email/provider.ts', () => ({ sendEmail: mocks.send }));
// Staff accounts are self-registered, so a staff JWT must never send from the studio domain.
describe('staff email boundary', () => {
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks();
    vi.stubGlobal('Deno', { env: { get: (name: string) => ({ SUPABASE_SERVICE_ROLE_KEY: 'service', EMAIL_FUNCTION_SECRET: 'internal', APP_URL: 'https://tandavastudio.com' })[name] ?? 'test' } });
    mocks.send.mockResolvedValue({ success: true });
  });
  afterEach(() => vi.unstubAllGlobals());
  const valid = { studioId: 'studio-a', recipientProfileId: 'member-a', to: 'member@example.test', template: 'welcome', data: { firstName: 'Sam', appUrl: 'https://evil.test' } };
  async function invoke(body: unknown, headers: Record<string, string> = { Authorization: 'Bearer staff-session' }) {
    const path = '../../supabase/functions/email/index.ts'; await import(path);
    return mocks.handle!(new Request('https://edge.test/email', { method: 'POST', headers, body: JSON.stringify(body) }));
  }
  it.each(['welcome', 'bookingConfirmation', 'bookingCancellation', 'classReminder', 'waitlistPromoted', 'express_continue', 'passwordReset', 'studioInquiryNotification'])(
    'rejects a staff JWT for %s without a lookup or dispatch', async template => {
      expect((await invoke({ ...valid, template })).status).toBe(401);
      expect(mocks.send).not.toHaveBeenCalled(); expect(mocks.client).not.toHaveBeenCalled();
    });
  it.each([null, [], 5])('rejects a non-object body without dispatch', async body => {
    expect((await invoke(body)).status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('still sends templates for the internal secret, with escaped text', async () => {
    const response = await invoke({ ...valid, data: { firstName: '<img src=x onerror=alert(1)>', appUrl: 'https://tandavastudio.com' } }, { 'x-email-secret': 'internal' });
    expect(response.status).toBe(200); expect(mocks.send).toHaveBeenCalledOnce();
    expect(mocks.send.mock.calls[0][0].html).not.toContain('<img');
  });
});
