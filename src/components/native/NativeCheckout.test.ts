import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ effect: null as null | (() => (() => void) | void), navigate: vi.fn(), invalidate: vi.fn(),
  appOpen: null as null | ((event: { url: string }) => void), finished: null as null | (() => void), close: vi.fn(), consume: vi.fn(), remove: vi.fn(), launch: vi.fn() }));
vi.mock('react', () => ({ useEffect: (effect: () => (() => void) | void) => { mocks.effect = effect; } }));
vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: mocks.invalidate }) }));
vi.mock('@capacitor/app', () => ({ App: { getLaunchUrl: mocks.launch, addListener: async (_: string, listener: typeof mocks.appOpen) => { mocks.appOpen = listener; return { remove: mocks.remove }; } } }));
vi.mock('@capacitor/browser', () => ({ Browser: { close: mocks.close, addListener: async (_: string, listener: typeof mocks.finished) => { mocks.finished = listener; return { remove: mocks.remove }; } } }));
vi.mock('@/lib/native/platform', () => ({ isNativeApp: () => true, nativeApp: 'member' }));
vi.mock('@/lib/native/checkout', () => ({ consumePaymentReturn: mocks.consume, paymentReturnPath: (raw: string) => raw === 'tandava-member://checkout-return' ? '/checkout/status' : raw === 'tandava-member://billing-return' ? '/account' : null }));
async function mount() {
  const { NativeCheckout } = await import('./NativeCheckout'); NativeCheckout();
  const cleanup = mocks.effect?.(); await Promise.resolve(); await Promise.resolve();
  return cleanup;
}
describe('native checkout lifecycle', () => {
  beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); mocks.launch.mockResolvedValue(undefined); mocks.close.mockResolvedValue(undefined); mocks.remove.mockResolvedValue(undefined); mocks.consume.mockReturnValue('/checkout/status'); });
  it('refreshes server records on a supported return without claiming payment', async () => {
    await mount(); mocks.appOpen?.({ url: 'tandava-member://checkout-return' });
    expect(mocks.close).toHaveBeenCalledOnce(); expect(mocks.invalidate).toHaveBeenCalledOnce();
    expect(mocks.navigate).toHaveBeenCalledWith('/checkout/status', { replace: true });
  });
  it('handles Done or cancellation only when checkout was opened', async () => {
    await mount(); mocks.consume.mockReturnValue(null); mocks.finished?.(); expect(mocks.navigate).not.toHaveBeenCalled();
    mocks.consume.mockReturnValue('/checkout/status'); mocks.finished?.(); expect(mocks.navigate).toHaveBeenCalledOnce();
  });
  it('rejects foreign links and ignores events after unmount', async () => {
    const cleanup = await mount(); mocks.appOpen?.({ url: 'tandava-studio://checkout-return' }); expect(mocks.navigate).not.toHaveBeenCalled();
    if (cleanup) cleanup(); mocks.appOpen?.({ url: 'tandava-member://checkout-return' }); mocks.finished?.();
    expect(mocks.navigate).not.toHaveBeenCalled(); expect(mocks.remove).toHaveBeenCalledTimes(2);
  });
  it('refreshes billing changes and returns to the account', async () => {
    await mount(); mocks.appOpen?.({ url: 'tandava-member://billing-return' });
    expect(mocks.navigate).toHaveBeenCalledWith('/account', { replace: true });
    expect(mocks.invalidate).toHaveBeenCalledOnce();
  });
  it('recovers a cold return from the browser', async () => {
    mocks.launch.mockResolvedValue({ url: 'tandava-member://checkout-return' }); await mount();
    expect(mocks.navigate).toHaveBeenCalledOnce();
  });
});
