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
import { data as backendData, api as backendApi, isBackendConfigured } from "@/lib/backend";
import type { BookClassInput, ExpressBookInput, ExpressBookResult } from "@/lib/backend";
import type { ClassOccurrence, Membership, ClassPack, PublicScheduleRow, PublicOccurrenceRow, StudioStorefront } from "@/types/database";
import { resolvePaymentSources } from "@/lib/booking/entitlements";
import type { PaymentSource } from "@/components/booking/PaymentSourceSelector";

const enabled = () => isBackendConfigured();

/** Public upcoming schedule for a discoverable studio by slug (embed widget). */
export function usePublicSchedule(slug: string | undefined) {
  return useQuery({
    queryKey: ["public-schedule", slug],
    enabled: Boolean(slug) && enabled(),
    queryFn: async (): Promise<PublicScheduleRow[]> => {
      const { data, error } = await backendData.getPublicSchedule(slug!);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

/** Public storefront (profile + offerings + pricing) for a discoverable studio by slug. */
export function useStudioStorefront(slug: string | undefined) {
  return useQuery({
    queryKey: ["studio-storefront", slug],
    enabled: Boolean(slug) && enabled(),
    queryFn: async (): Promise<StudioStorefront | null> => {
      const { data, error } = await backendData.getStudioStorefront(slug!);
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

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

// ---------------------------------------------------------------------------
// Express Booking (PRD-020)
// ---------------------------------------------------------------------------

/**
 * Public booking facts for one occurrence — what the express booking page needs.
 *
 * Unlike the other hooks here this one is for anonymous visitors, so it does not
 * gate on an authenticated session. It still requires a configured backend;
 * demo mode supplies its own fixture in the page.
 */
export function usePublicOccurrence(slug: string | undefined, occurrenceId: string | undefined) {
  return useQuery({
    queryKey: ["public-occurrence", slug, occurrenceId],
    enabled: Boolean(slug) && Boolean(occurrenceId) && enabled(),
    // A visitor sitting on the page while the class fills should see the real
    // count when they submit, not a cached one from five minutes ago. The
    // authoritative check is server-side in create_guest_booking either way.
    staleTime: 30_000,
    queryFn: async (): Promise<PublicOccurrenceRow | null> => {
      const { data, error } = await backendData.getPublicOccurrence(slug!, occurrenceId!);
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

/**
 * Submit the express booking form.
 *
 * Every write lives in the `express-book` Edge Function (it needs the service
 * role to create the guest's identity), so this is an `api.invoke` rather than a
 * data call. The function answers with an outcome for every path including
 * refusals, so a non-2xx response still carries a message worth showing: the
 * mutation resolves with the payload instead of throwing, and the page branches
 * on `outcome`.
 */
export function useExpressBook() {
  return useMutation({
    mutationFn: async (input: ExpressBookInput): Promise<ExpressBookResult> => {
      const { data, error } = await backendApi.invoke<ExpressBookResult>("express-book", {
        ...input,
      });
      if (data && typeof data === "object" && "outcome" in data) return data;
      // No structured outcome: a transport failure, or a 400 whose body carried
      // field errors instead. Surface it as a rejection the page can render.
      const asRecord = (data ?? {}) as Partial<ExpressBookResult> & { error?: string };
      return {
        outcome: "rejected",
        message:
          asRecord.message ??
          asRecord.error ??
          error?.message ??
          "Could not complete your booking. Try again in a moment.",
        fields: asRecord.fields,
      };
    },
  });
}
