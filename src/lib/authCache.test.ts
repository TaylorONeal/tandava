import { describe, expect, it } from 'vitest';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { createAuthCacheBoundary } from './authCache';

describe('auth cache isolation', () => {
  it('removes all private data and mutations before a different identity reads', () => {
    const client = new QueryClient();
    const boundary = createAuthCacheBoundary(client);
    const first = boundary.transition('A');
    for (const key of ['my-bookings', 'my-studio', 'my-entitlements']) {
      client.setQueryData([key], { owner: 'A' });
    }
    client.getMutationCache().build(client, { mutationKey: ['private-write'] });
    onlineManager.setOnline(false);
    try {
      const next = boundary.transition('B');
      expect(next.epoch).toBeGreaterThan(first.epoch);
      expect(client.getQueryCache().getAll()).toEqual([]);
      expect(client.getMutationCache().getAll()).toEqual([]);
      expect(boundary.isCurrent(first.revision)).toBe(false);
    } finally { onlineManager.setOnline(true); client.clear(); }
  });

  it('cancels a pending A request even when its transport ignores abort', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const boundary = createAuthCacheBoundary(client);
    boundary.transition('A');
    let resolve!: (value: string) => void;
    const pending = client.fetchQuery({
      queryKey: ['my-bookings'], queryFn: () => new Promise<string>(r => { resolve = r; }),
    }).catch(() => 'cancelled');
    boundary.transition('B');
    client.setQueryData(['my-bookings'], 'B');
    resolve('A');
    expect(await pending).toBe('cancelled');
    expect(client.getQueryData(['my-bookings'])).toBe('B');
    client.clear();
  });

  it('preserves data on token refresh but rejects older profile completions', () => {
    const client = new QueryClient();
    const boundary = createAuthCacheBoundary(client);
    const original = boundary.transition('A');
    client.setQueryData(['my-bookings'], 'A');
    const refresh = boundary.transition('A');
    expect(refresh.epoch).toBe(original.epoch);
    expect(client.getQueryData(['my-bookings'])).toBe('A');
    expect(boundary.isCurrent(original.revision)).toBe(false);
    const signedOut = boundary.transition(null);
    expect(signedOut.epoch).toBeGreaterThan(refresh.epoch);
    expect(client.getQueryData(['my-bookings'])).toBeUndefined();
    boundary.invalidate();
    expect(boundary.isCurrent(signedOut.revision)).toBe(false);
  });
});

it('purges pending private reads without pretending the current identity signed out', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const boundary = createAuthCacheBoundary(client);
  const authenticated = boundary.transition('A');
  let resolve!: (value: string) => void;
  const pending = client.fetchQuery({ queryKey: ['my-bookings'], queryFn: () => new Promise<string>(r => { resolve = r; }) }).catch(() => undefined);
  const purged = boundary.purge();
  resolve('old-private-data');
  await pending;
  expect(client.getQueryData(['my-bookings'])).toBeUndefined();
  expect(boundary.isCurrent(authenticated.revision)).toBe(false);
  // A failed sign-out leaves A authenticated. Same-identity refresh must not
  // become a new identity transition; a later B must still clear fresh A data.
  expect(boundary.transition('A').epoch).toBe(purged.epoch);
  client.setQueryData(['my-bookings'], 'fresh-A');
  expect(boundary.transition('B').epoch).toBeGreaterThan(purged.epoch);
  expect(client.getQueryData(['my-bookings'])).toBeUndefined();
  client.clear();
});
