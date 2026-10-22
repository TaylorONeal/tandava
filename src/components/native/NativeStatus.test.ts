import { beforeEach, describe, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => ({
  navigate: vi.fn(),
  setOffline: vi.fn(),
  effect: null as null | (() => (() => void) | void),
  openUrl: null as null | ((event: { url: string }) => void),
  launch: vi.fn(),
  remove: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('react', async () => ({
  ...await vi.importActual<typeof import('react')>('react'),
  useEffect: (effect: () => (() => void) | void) => { native.effect = effect; },
  useState: () => [false, native.setOffline],
  useRef: (value: unknown) => ({ current: value }),
}));
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/discover', search: '' }),
  useNavigate: () => native.navigate,
}));
vi.mock('@capacitor/app', () => ({ App: {
  getLaunchUrl: native.launch,
  addListener: vi.fn(async (_name: string, listener: (event: { url: string }) => void) => {
    native.openUrl = listener;
    return { remove: native.remove };
  }),
} }));
vi.mock('@capacitor/network', () => ({ Network: {
  getStatus: vi.fn(async () => ({ connected: true })),
  addListener: vi.fn(async () => ({ remove: native.remove })),
} }));
vi.mock('@capacitor/share', () => ({ Share: { share: vi.fn() } }));
vi.mock('@/lib/native/platform', async () => ({
  ...await import('../../lib/native/platform'),
  isNativeApp: () => true,
}));

let NativeStatus: typeof import('./NativeStatus').NativeStatus;

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('native link lifecycle', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    native.effect = null;
    native.openUrl = null;
    native.launch.mockResolvedValue(undefined);
    ({ NativeStatus } = await import('./NativeStatus'));
  });

  it('opens a cold-launch studio link through the router without reloading the bridge', async () => {
    native.launch.mockResolvedValue({ url: 'https://tandavastudio.com/s/test-studio?class=123' });
    NativeStatus();
    const cleanup = native.effect?.();
    await flush();
    expect(native.navigate).toHaveBeenCalledExactlyOnceWith('/s/test-studio?class=123', { replace: true });
    expect(native.launch).toHaveBeenCalledTimes(1);
    if (typeof cleanup === 'function') cleanup();
  });

  it('opens warm links without allowing unrelated hosts or privileged paths', async () => {
    NativeStatus();
    const cleanup = native.effect?.();
    await flush();
    native.openUrl?.({ url: 'https://tandavastudio.com/manage' });
    native.openUrl?.({ url: 'https://evil.test/s/test-studio' });
    expect(native.navigate).not.toHaveBeenCalled();
    native.openUrl?.({ url: 'https://tandavastudio.com/s/test-studio' });
    expect(native.navigate).toHaveBeenCalledExactlyOnceWith('/s/test-studio');
    if (typeof cleanup === 'function') cleanup();
  });

  it('ignores a pending launch link and removes listeners after unmount', async () => {
    let resolveLaunch!: (value: { url: string }) => void;
    native.launch.mockImplementation(() => new Promise(resolve => { resolveLaunch = resolve; }));
    NativeStatus();
    const cleanup = native.effect?.();
    if (typeof cleanup === 'function') cleanup();
    resolveLaunch({ url: 'https://tandavastudio.com/s/test-studio' });
    native.openUrl?.({ url: 'https://tandavastudio.com/s/test-studio' });
    await flush();
    expect(native.navigate).not.toHaveBeenCalled();
    expect(native.remove).toHaveBeenCalledTimes(2);
  });

  it('does not replace a newer opened link with a late launch URL', async () => {
    let resolveLaunch!: (value: { url: string }) => void;
    native.launch.mockImplementation(() => new Promise(resolve => { resolveLaunch = resolve; }));
    NativeStatus();
    const cleanup = native.effect?.();
    native.openUrl?.({ url: 'https://tandavastudio.com/s/new-studio' });
    resolveLaunch({ url: 'https://tandavastudio.com/s/old-studio' });
    await flush();
    expect(native.navigate).toHaveBeenCalledExactlyOnceWith('/s/new-studio');
    if (typeof cleanup === 'function') cleanup();
  });

  it('does not replay a consumed launch link after an auth remount', async () => {
    native.launch.mockResolvedValue({ url: 'https://tandavastudio.com/s/old-studio' });
    NativeStatus();
    const firstCleanup = native.effect?.();
    await flush();
    if (typeof firstCleanup === 'function') firstCleanup();
    native.navigate.mockClear();

    NativeStatus();
    const secondCleanup = native.effect?.();
    await flush();
    expect(native.launch).toHaveBeenCalledTimes(1);
    expect(native.navigate).not.toHaveBeenCalled();
    native.openUrl?.({ url: 'https://tandavastudio.com/s/new-studio' });
    expect(native.navigate).toHaveBeenCalledExactlyOnceWith('/s/new-studio');
    if (typeof secondCleanup === 'function') secondCleanup();
  });

  it('delivers a pending launch link to the active remount only', async () => {
    let resolveLaunch!: (value: { url: string }) => void;
    native.launch.mockImplementation(() => new Promise(resolve => { resolveLaunch = resolve; }));
    NativeStatus();
    const firstCleanup = native.effect?.();
    if (typeof firstCleanup === 'function') firstCleanup();

    NativeStatus();
    const secondCleanup = native.effect?.();
    resolveLaunch({ url: 'https://tandavastudio.com/s/test-studio' });
    await flush();
    expect(native.launch).toHaveBeenCalledTimes(1);
    expect(native.navigate).toHaveBeenCalledExactlyOnceWith('/s/test-studio', { replace: true });
    if (typeof secondCleanup === 'function') secondCleanup();
  });

  it('keeps a warm link ahead of a delayed launch link across remounts', async () => {
    let resolveLaunch!: (value: { url: string }) => void;
    native.launch.mockImplementation(() => new Promise(resolve => { resolveLaunch = resolve; }));
    NativeStatus();
    const firstCleanup = native.effect?.();
    native.openUrl?.({ url: 'https://tandavastudio.com/s/new-studio' });
    if (typeof firstCleanup === 'function') firstCleanup();

    NativeStatus();
    const secondCleanup = native.effect?.();
    resolveLaunch({ url: 'https://tandavastudio.com/s/old-studio' });
    await flush();
    expect(native.launch).toHaveBeenCalledTimes(1);
    expect(native.navigate).toHaveBeenCalledExactlyOnceWith('/s/new-studio');
    if (typeof secondCleanup === 'function') secondCleanup();
  });
});
