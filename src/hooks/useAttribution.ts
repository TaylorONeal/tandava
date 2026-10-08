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

export function useAttributionSources(days: number, model: AttributionModel) {
  return useQuery({
    queryKey: ["attribution-sources", days, model],
    enabled: isBackendConfigured(),
    queryFn: async (): Promise<AttributionSourceRow[]> => {
      const to = new Date();
      const from = new Date(to.getTime() - days * 86_400_000);
      const { data, error } = await backendData.getAttributionSources(from, to, model);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export function useMemberAttribution(profileId: string | undefined) {
  return useQuery({
    queryKey: ["member-attribution", profileId],
    enabled: Boolean(profileId) && isBackendConfigured(),
    queryFn: async (): Promise<MemberAttribution | null> => {
      const { data, error } = await backendData.getMemberAttribution(profileId!);
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
