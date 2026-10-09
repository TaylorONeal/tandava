/**
 * The signed-in owner's studio catalog (classes, packs, memberships, weekly
 * schedule, locations) plus a save helper that refreshes it. Live mode only.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { data as backendData } from "@/lib/backend";
import type { CatalogTable, StaffName, StudioCatalog } from "@/lib/hosted/catalog";
import type { MyAdminStudioRow } from "@/types/database";

export function useStudioCatalog() {
  const queryClient = useQueryClient();

  const studioQuery = useQuery({
    queryKey: ["my-admin-studio"],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<MyAdminStudioRow | null> => {
      const { data, error } = await backendData.getMyAdminStudio();
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const studio = studioQuery.data ?? null;
  const studioId = studio?.studio_id ?? null;

  const catalogQuery = useQuery({
    queryKey: ["studio-catalog", studioId],
    enabled: Boolean(studioId),
    queryFn: async (): Promise<StudioCatalog> => {
      const { data, error } = await backendData.getStudioCatalog(studioId as string);
      if (error || !data) throw new Error(error?.message ?? "Could not load your classes");
      return data;
    },
  });

  const staffQuery = useQuery({
    queryKey: ["studio-staff-names", studioId],
    enabled: Boolean(studioId),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<StaffName[]> => {
      const { data, error } = await backendData.getStudioStaffNames(studioId as string);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  /** Saves one row and reloads the catalog. Returns an error message or null. */
  const save = async (table: CatalogTable, row: Record<string, unknown> & { id?: string }): Promise<string | null> => {
    if (!studioId) return "No studio found for your account.";
    const { error } = await backendData.saveCatalogRow(table, studioId, row);
    await queryClient.invalidateQueries({ queryKey: ["studio-catalog", studioId] });
    return error ? error.message : null;
  };

  return {
    studio,
    catalog: catalogQuery.data ?? null,
    staff: staffQuery.data ?? [],
    isLoading: studioQuery.isLoading || (Boolean(studioId) && catalogQuery.isLoading),
    error: studioQuery.error ?? catalogQuery.error ?? null,
    noStudio: studioQuery.isSuccess && !studio,
    save,
  };
}
