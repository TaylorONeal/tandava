import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ createClient: vi.fn(), create: vi.fn(), rpc: vi.fn(), scope: 'unknown', user: true }));
vi.mock('https://esm.sh/@supabase/supabase-js@2', () => ({ createClient: mocks.createClient }));
vi.mock('https://esm.sh/stripe@14?target=deno', () => ({ default: class { checkout = { sessions: { create: mocks.create } }; } }));

describe('native physical-service checkout', () => {
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks(); mocks.scope = 'unknown'; mocks.user = true;
    vi.stubGlobal('Deno', { env: { get: (key: string) => ({ APP_URL: 'https://tandavastudio.com', STRIPE_CONNECT_MODE: 'direct' })[key] ?? 'test' } });
    mocks.rpc.mockResolvedValue({ error: null }); mocks.create.mockResolvedValue({ url: 'https://checkout.stripe.com/test' });
    mocks.createClient.mockImplementation(() => ({
      auth: { getUser: async () => ({ data: { user: mocks.user ? { id: 'buyer' } : null } }) }, rpc: mocks.rpc,
      from: (table: string) => {
        const row = table === 'class_occurrences' ? { id: 'class', studio_id: 'studio', offering_id: 'offering', is_cancelled: false }
          : { studio_id: 'studio', name: 'In-person class', price_cents: 2000, drop_in_price_cents: 2000, class_count: 5, validity_days: 90, billing_cycle: 'monthly', is_active: true, purchase_scope: mocks.scope, currency: 'USD' };
        const query = { select: () => query, eq: () => query, not: () => query, limit: async () => ({ data: [] }), single: async () => ({ data: row }) };
        return query;
      },
    }));
  });
  afterEach(() => vi.unstubAllGlobals());
  async function checkout(type: string, extra = {}, native = true) {
    const path = '../../supabase/functions/stripe-checkout/handler.ts';
    const { handleCheckout } = await import(path);
    return handleCheckout(new Request('https://edge.test/native-checkout', { method: 'POST', headers: { Authorization: 'Bearer test' }, body: JSON.stringify({ type, occurrenceId: 'class', membershipTypeId: 'plan', classPackTypeId: 'pack', ...extra }) }), native);
  }
  it.each(['drop_in', 'class_pack', 'membership'])('rejects unclassified %s before holds or payment', async (type) => {
    expect((await checkout(type, { purchase_scope: 'in_person' })).status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each(['drop_in', 'class_pack', 'membership'])('rejects digital/mixed %s', async (type) => {
    mocks.scope = 'digital_or_mixed'; expect((await checkout(type)).status).toBe(409); expect(mocks.create).not.toHaveBeenCalled();
  });
  it.each(['drop_in', 'class_pack', 'membership'])('sells physical %s with frozen scope and separate idempotency', async (type) => {
    mocks.scope = 'in_person'; expect((await checkout(type)).status).toBe(200);
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.create.mock.calls[0][0].metadata).toMatchObject({ purchase_scope: 'in_person', purchase_channel: 'native' });
    expect(mocks.create.mock.calls[0][1].idempotencyKey).toMatch(/^native:/);
  });
  it('rejects workshop and unknown types rather than falling through to web purchases', async () => {
    for (const type of ['workshop', 'digital', '']) expect((await checkout(type)).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('forces the hosted return page and ignores caller-supplied destinations', async () => {
    mocks.scope = 'in_person';
    await checkout('class_pack', { nativeApp: 'studio', successUrl: 'https://evil.test', cancelUrl: '/manage' });
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ success_url: 'https://tandavastudio.com/checkout/return?app=studio', cancel_url: 'https://tandavastudio.com/checkout/return?app=studio&cancelled=1' });
  });
  it('requires an authenticated buyer', async () => {
    mocks.user = false; expect((await checkout('class_pack')).status).toBe(401); expect(mocks.create).not.toHaveBeenCalled();
  });
  it('keeps web checkout available and snapshots its actual scope', async () => {
    expect((await checkout('class_pack', {}, false)).status).toBe(200);
    expect(mocks.create.mock.calls[0][0].metadata).toMatchObject({ purchase_scope: 'unknown', purchase_channel: 'web' });
    expect(mocks.create.mock.calls[0][1].idempotencyKey).toMatch(/^buyer:class_pack:/);
  });
});
