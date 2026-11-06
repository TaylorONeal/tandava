import type { QueryClient } from '@tanstack/react-query';

/** Auth epochs also invalidate profile reads and mounted observers, not only data. */
export function createAuthCacheBoundary(client: QueryClient) {
  let identity: string | null | undefined;
  let revision = 0;
  let epoch = 0;
  return {
    get revision() { return revision; },
    transition(next: string | null) {
      revision += 1;
      if (identity !== next) {
        identity = next;
        epoch += 1;
        // Cancel synchronously before removal: late network responses must not
        // refill a cache reused by another person. Clear mutations as well.
        void client.cancelQueries();
        client.clear();
      }
      return { revision, epoch };
    },
    purge() {
      revision += 1;
      epoch += 1;
      void client.cancelQueries();
      client.clear();
      return { revision, epoch };
    },
    isCurrent(value: number) { return revision === value; },
    invalidate() { revision += 1; },
  };
}
