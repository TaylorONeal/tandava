/**
 * Booking data hooks.
 *
 * Thin React Query wrappers over the backend abstraction for the booking flow:
 * upcoming classes, a member's entitlements, and the covered-booking mutation.
 * Resolving which sources cover a given class is done with the (tested)
 * entitlements engine via `useBookingSources`.
 */

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { data as backendData, isBackendConfigured } from "@/lib/backend";
import type { BookClassInput } from "@/lib/backend";
import type { ClassOccurrence, Membership, ClassPack } from "@/types/database";
import { resolvePaymentSources } from "@/lib/booking/entitlements";
import type { PaymentSource } from "@/components/booking/PaymentSourceSelector";

const enabled = () => isBackendConfigured();

/** Upcoming class occurrences for a studio (offering + location joined). */
export function useUpcomingClasses(studioId: string | undefined) {
  return useQuery({
    queryKey: ["upcoming-classes", studioId],
    enabled: Boolean(studioId) && enabled(),
    queryFn: async (): Promise<ClassOccurrence[]> => {
      const { data, error } = await backendData.getUpcomingClasses(studioId!);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

/** A member's memberships + class packs for entitlement resolution. */
export function useMemberEntitlements(profileId: string | undefined, studioId: string | undefined) {
  return useQuery({
    queryKey: ["entitlements", profileId, studioId],
    enabled: Boolean(profileId) && Boolean(studioId) && enabled(),
    queryFn: async (): Promise<{ memberships: Membership[]; packs: ClassPack[] }> => {
      const { data, error } = await backendData.getMemberEntitlements(profileId!, studioId!);
      if (error) throw new Error(error.message);
      return data ?? { memberships: [], packs: [] };
    },
  });
}

/**
 * Resolve the PaymentSource list the booking UI renders for a specific class,
 * given the member's entitlements. Pure — safe to call with partial data.
 */
export function useBookingSources(
  occurrence: Pick<ClassOccurrence, "offering_id" | "location_id"> & {
    offering?: { id: string; drop_in_price_cents: number | null } | null;
  },
  entitlements: { memberships: Membership[]; packs: ClassPack[] } | undefined,
): PaymentSource[] {
  return useMemo(() => {
    if (!entitlements || !occurrence.offering) return [];
    return resolvePaymentSources({
      offering: {
        id: occurrence.offering.id,
        drop_in_price_cents: occurrence.offering.drop_in_price_cents,
      },
      locationId: occurrence.location_id,
      memberships: entitlements.memberships,
      packs: entitlements.packs,
    });
  }, [occurrence.offering, occurrence.location_id, entitlements]);
}

/** Book a class against a covered entitlement; invalidates dependent queries. */
export function useBookClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BookClassInput) => {
      const { data, error } = await backendData.bookClass(input);
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entitlements"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-classes"] });
    },
  });
}

/** Cancel a booking (late-cancel fee + entitlement refund handled server-side). */
export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await backendData.cancelBooking(bookingId);
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entitlements"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-classes"] });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
  });
}
