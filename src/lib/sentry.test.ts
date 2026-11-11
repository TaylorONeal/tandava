import { afterEach, describe, expect, it, vi } from 'vitest';
const sdk = vi.hoisted(() => ({ init: vi.fn(), setUser: vi.fn(), tracing: { name: 'Tracing' } }));
vi.mock('@sentry/react', () => ({
  init: sdk.init, setUser: sdk.setUser,
  browserTracingIntegration: () => sdk.tracing,
  ErrorBoundary: () => null,
}));
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); vi.clearAllMocks(); });
describe('monitoring privacy', () => {
  it('does not initialize when no DSN is configured', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    const sentry = await import('./sentry');
    sentry.initSentry();
    expect(sdk.init).not.toHaveBeenCalled();
  });
  it('never installs replay or sends user email when monitoring is configured', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@example.invalid/1');
    const sentry = await import('./sentry');
    sentry.initSentry();
    expect(sdk.init).toHaveBeenCalledWith(expect.objectContaining({
      integrations: [sdk.tracing], replaysSessionSampleRate: 0, replaysOnErrorSampleRate: 0,
    }));
    sentry.setSentryUser({ id: 'qa-user', email: 'private@example.invalid' });
    expect(sdk.setUser).toHaveBeenCalledWith({ id: 'qa-user' });
    sentry.setSentryUser(null);
    expect(sdk.setUser).toHaveBeenLastCalledWith(null);
  });
});
