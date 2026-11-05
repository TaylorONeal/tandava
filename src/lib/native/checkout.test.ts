import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ open: vi.fn(), native: true, assign: vi.fn() }));
vi.mock('@capacitor/browser', () => ({ Browser: { open: mocks.open } }));
vi.mock('./platform', () => ({ isNativeApp: () => mocks.native }));
import { openCheckoutUrl, consumeCheckoutReturn, isCheckoutReturn } from './checkout';
describe('checkout browser handoff', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.native = true; mocks.open.mockResolvedValue(undefined); consumeCheckoutReturn(); vi.stubGlobal('window', { location: { assign: mocks.assign } }); });
  afterEach(() => vi.unstubAllGlobals());
  it('keeps the native app alive and waits for a return without asserting payment', async () => {
    expect(await openCheckoutUrl('https://checkout.stripe.com/c/pay/test')).toEqual({});
    expect(mocks.open).toHaveBeenCalledWith({ url: 'https://checkout.stripe.com/c/pay/test' });
    expect(mocks.assign).not.toHaveBeenCalled();
    expect(consumeCheckoutReturn()).toBe(true); expect(consumeCheckoutReturn()).toBe(false);
  });
  it('recovers when the browser cannot open', async () => {
    mocks.open.mockRejectedValue(new Error('unavailable'));
    expect((await openCheckoutUrl('https://checkout.stripe.com/test')).error).toMatch(/try again/);
    expect(consumeCheckoutReturn()).toBe(false);
  });
  it.each(['javascript:alert(1)', 'http://checkout.stripe.com/test', 'https://checkout.stripe.com.evil.test', 'https://user@checkout.stripe.com/test', 'https://checkout.stripe.com:8443/test'])('rejects an unsafe destination %s', async (url) => {
    expect((await openCheckoutUrl(url)).error).toBeDefined(); expect(mocks.open).not.toHaveBeenCalled(); expect(mocks.assign).not.toHaveBeenCalled();
  });
  it('retains web checkout navigation', async () => {
    mocks.native = false; await openCheckoutUrl('https://checkout.stripe.com/test');
    expect(mocks.assign).toHaveBeenCalledWith('https://checkout.stripe.com/test'); expect(mocks.open).not.toHaveBeenCalled();
  });
  it('accepts only the current apps exact non-sensitive return signal', () => {
    expect(isCheckoutReturn('tandava-member://checkout-return', 'member')).toBe(true);
    for (const url of ['tandava-studio://checkout-return', 'tandava-member://checkout-return?paid=true', 'tandava-member://checkout-return/../manage', 'https://evil.test']) expect(isCheckoutReturn(url, 'member')).toBe(false);
  });
});
