import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ client: vi.fn(), portal: vi.fn(), subscription: vi.fn(), configuration: vi.fn(),
  eq: vi.fn(), scope: 'in_person', configId: 'bpc_native', member: true }));
vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({ createClient: mocks.client }));
vi.mock('https://esm.sh/stripe@14?target=deno', () => ({ default: class { subscriptions = { retrieve: mocks.subscription }; billingPortal = { sessions: { create: mocks.portal }, configurations: { retrieve: mocks.configuration } }; } }));
describe('native physical membership billing', () => {
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks(); mocks.scope = 'in_person'; mocks.configId = 'bpc_native'; mocks.member = true;
    vi.stubGlobal('Deno', { env: { get: (key: string) => key === 'NATIVE_BILLING_PORTAL_CONFIGURATION' ? mocks.configId : key === 'APP_URL' ? 'https://tandavastudio.com' : 'test' } });
    mocks.portal.mockResolvedValue({ url: 'https://billing.stripe.com/session/test' });
    mocks.subscription.mockResolvedValue({ customer: 'cus_owned' });
    mocks.configuration.mockResolvedValue({ active: true, features: { subscription_update: { enabled: false }, subscription_cancel: { enabled: true } } });
    mocks.client.mockImplementation(() => ({
      auth: { getUser: async () => ({ data: { user: { id: 'buyer' } } }) },
      from: () => {
        const q = { select: () => q, eq: (key: string, value: unknown) => { mocks.eq(key, value); return q; }, not: () => q, order: () => q, limit: () => q,
          maybeSingle: async () => ({ data: mocks.member ? { stripe_subscription_id: 'sub_selected', studio_id: 'studio', purchase_scope: mocks.scope } : null }) };
        return q;
      },
    }));
  });
  afterEach(() => vi.unstubAllGlobals());
  async function invoke(body: Record<string, unknown> = { studioId: 'studio', membershipId: 'membership' }) {
    const path = '../../supabase/functions/stripe-portal/handler.ts'; const { handlePortal } = await import(path);
    return handlePortal(new Request('https://edge.test/native-portal', { method: 'POST', body: JSON.stringify(body) }), true);
  }
  it('uses the selected owned membership and a dedicated no-upgrade configuration', async () => {
    expect((await invoke()).status).toBe(200);
    expect(mocks.eq).toHaveBeenCalledWith('id', 'membership'); expect(mocks.eq).toHaveBeenCalledWith('profile_id', 'buyer');
    expect(mocks.portal).toHaveBeenCalledWith({ customer: 'cus_owned', configuration: 'bpc_native', return_url: 'https://tandavastudio.com/checkout/return?app=member&billing=1' });
  });
  it.each(['unknown','digital_or_mixed'])('rejects %s purchases without opening the portal', async (scope) => {
    mocks.scope = scope; expect((await invoke({ studioId: 'studio', membershipId: 'membership', purchase_scope: 'in_person' })).status).toBe(409);
    expect(mocks.portal).not.toHaveBeenCalled(); expect(mocks.subscription).not.toHaveBeenCalled();
  });
  it('requires explicit membership selection instead of guessing the latest subscription', async () => {
    expect((await invoke({ studioId: 'studio' })).status).toBe(400); expect(mocks.portal).not.toHaveBeenCalled();
  });
  it('rejects a membership outside the caller ownership query', async () => {
    mocks.member = false; expect((await invoke()).status).toBe(404); expect(mocks.portal).not.toHaveBeenCalled();
  });
  it('fails closed when no dedicated configuration is provisioned', async () => {
    mocks.configId = ''; expect((await invoke()).status).toBe(503); expect(mocks.portal).not.toHaveBeenCalled();
  });
  it.each([
    { active: false, features: { subscription_update: { enabled: false }, subscription_cancel: { enabled: true } } },
    { active: true, features: { subscription_update: { enabled: true }, subscription_cancel: { enabled: true } } },
    { active: true, features: { subscription_update: { enabled: false }, subscription_cancel: { enabled: false } } },
    { active: true, features: {} },
  ])('refuses unsafe or incomplete portal configuration', async (config) => {
    mocks.configuration.mockResolvedValue(config); expect((await invoke()).status).toBe(503); expect(mocks.portal).not.toHaveBeenCalled();
  });
});
