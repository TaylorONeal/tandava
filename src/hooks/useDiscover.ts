/**
 * Discover data hook: upcoming classes across discoverable studios.
 * Thin React Query wrapper over the backend abstraction (see lib/discover.ts
 * for the pure filtering/grouping used by the page).
 */

import { useQuery } from "@tanstack/react-query";
import { data as backendData, isBackendConfigured } from "@/lib/backend";
import type { DiscoverClassRow } from "@/types/database";

export function useDiscoverClasses(city?: string) {
  return useQuery({
    queryKey: ["discover-classes", city ?? null],
    enabled: isBackendConfigured(),
    staleTime: 60_000,
    queryFn: async (): Promise<DiscoverClassRow[]> => {
      const { data, error } = await backendData.discoverClasses({
        p_city: city ?? null,
        p_limit: 100,
      });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}
