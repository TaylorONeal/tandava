/**
 * The studio named in the manage header. Live: the studio the signed-in user
 * manages (owner/admin assignment, get_my_admin_studio). Demo, including a
 * demo build that also has backend variables set: the sample studio.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { data as backendData } from "@/lib/backend";
import { manageHeaderName } from "@/lib/homeMode";
import { OXATL_STUDIO } from "@/data/demo/oxatl-yoga";
import type { MyAdminStudioRow } from "@/types/database";

export function useManageStudio(): { live: boolean; studioName: string } {
  const { isDemoMode } = useAuth();
  const live = !isDemoMode;
  const { data } = useQuery({
    queryKey: ["my-admin-studio"],
    enabled: live,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<MyAdminStudioRow | null> => {
      const { data, error } = await backendData.getMyAdminStudio();
      if (error) throw new Error(error.message);
      return data;
    },
  });
  return { live, studioName: manageHeaderName(live, data?.name, OXATL_STUDIO.name) };
}
