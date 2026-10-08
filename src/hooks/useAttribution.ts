/**
 * React Query wrappers for the PRD-024/027 phase-1 reports and settings.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { data as backendData, isBackendConfigured } from "@/lib/backend";
import type {
  AttributionModel,
  AttributionSourceRow,
  AutomationSettingsRow,
  MemberAttribution,
} from "@/types/attribution";
import type { MyAdminStudioRow } from "@/types/database";

/** The report for the studio the manage UI is showing (never one the server picks). */
export function useAttributionSources(studioId: string | undefined, days: number, model: AttributionModel) {
  return useQuery({
    queryKey: ["attribution-sources", studioId, days, model],
    enabled: Boolean(studioId) && isBackendConfigured(),
    queryFn: async (): Promise<AttributionSourceRow[]> => {
      const to = new Date();
      const from = new Date(to.getTime() - days * 86_400_000);
      const { data, error } = await backendData.getAttributionSources(studioId!, from, to, model);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useMemberAttribution(studioId: string | undefined, profileId: string | undefined) {
  return useQuery({
    queryKey: ["member-attribution", studioId, profileId],
    enabled: Boolean(studioId && profileId) && isBackendConfigured(),
    queryFn: async (): Promise<MemberAttribution | null> => {
      const { data, error } = await backendData.getMemberAttribution(studioId!, profileId!);
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * The studio owner-only screens act on: one the caller is owner/admin of.
 * get_my_studio() can return a studio where they only teach.
 */
export function useMyAdminStudio() {
  return useQuery({
    queryKey: ["my-admin-studio"],
    enabled: isBackendConfigured(),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<MyAdminStudioRow | null> => {
      const { data, error } = await backendData.getMyAdminStudio();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useAutomationSettings(studioId: string | undefined) {
  return useQuery({
    queryKey: ["automation-settings", studioId],
    enabled: Boolean(studioId) && isBackendConfigured(),
    queryFn: async (): Promise<AutomationSettingsRow | null> => {
      const { data, error } = await backendData.getAutomationSettings(studioId!);
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export function useSaveAutomationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: AutomationSettingsRow) => {
      const { error } = await backendData.saveAutomationSettings(row);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, row) => qc.invalidateQueries({ queryKey: ["automation-settings", row.studio_id] }),
  });
}
