import { describe, it, expect } from "vitest";
import {
  membershipCoverage,
  packCoverage,
  resolvePaymentSources,
  pickRecommended,
  sortByPreference,
  isLateCancel,
  cancellationDeadline,
} from "./entitlements";
import type { Membership, ClassPack } from "@/types/database";

const NOW = new Date("2026-06-08T12:00:00Z");
const OFFERING_ID = "off-vinyasa";
const LOCATION_ID = "loc-downtown";
const ctx = { offeringId: OFFERING_ID, locationId: LOCATION_ID, now: NOW };

function membership(overrides: Partial<Membership> & { type?: Partial<NonNullable<Membership["membership_type"]>> } = {}): Membership {
  const { type, ...rest } = overrides;
  return {
    id: "mem-1",
    studio_id: "s1",
    profile_id: "p1",
    membership_type_id: "mt-1",
    status: "active",
    current_period_start: "2026-06-01T00:00:00Z",
    current_period_end: "2026-07-01T00:00:00Z",
    classes_used_this_cycle: 0,
    stripe_subscription_id: null,
    stripe_payment_method_id: null,
    started_at: "2026-06-01T00:00:00Z",
    paused_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    expires_at: null,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    membership_type: {
      id: "mt-1",
      studio_id: "s1",
      name: "Unlimited Monthly",
      description: null,
      billing_cycle: "monthly",
      price_cents: 15000,
      classes_per_cycle: null,
      locations: [],
      offering_ids: [],
      trial_days: 0,
      trial_price_cents: 0,
      auto_renew: true,
      is_active: true,
      sort_order: 0,
      created_at: "2026-06-01T00:00:00Z",
      updated_at: "2026-06-01T00:00:00Z",
      ...type,
    },
    ...rest,
  };
}

function pack(overrides: Partial<ClassPack> & { type?: Partial<NonNullable<ClassPack["class_pack_type"]>> } = {}): ClassPack {
  const { type, ...rest } = overrides;
  return {
    id: "pack-1",
    studio_id: "s1",
    profile_id: "p1",
    class_pack_type_id: "pt-1",
    status: "active",
    classes_remaining: 7,
    classes_total: 10,
    purchased_at: "2026-05-01T00:00:00Z",
    expires_at: "2026-08-01T00:00:00Z",
    stripe_payment_intent_id: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    class_pack_type: {
      id: "pt-1",
      studio_id: "s1",
      name: "10-Class Pack",
      description: null,
      class_count: 10,
      price_cents: 18000,
      validity_days: 90,
      offering_ids: [],
      locations: [],
      is_active: true,
      sort_order: 0,
      created_at: "2026-05-01T00:00:00Z",
      updated_at: "2026-05-01T00:00:00Z",
      ...type,
    },
    ...rest,
  };
}

describe("membershipCoverage", () => {
  it("covers when active, in period, unlimited, all scopes", () => {
    expect(membershipCoverage(membership(), ctx)).toEqual({ covers: true, remaining: null });
  });

  it("does not cover when inactive", () => {
    expect(membershipCoverage(membership({ status: "paused" }), ctx).reason).toBe("inactive");
  });

  it("does not cover outside the billing period", () => {
    const m = membership({ current_period_end: "2026-06-05T00:00:00Z" });
    expect(membershipCoverage(m, ctx).reason).toBe("out_of_period");
  });

  it("respects offering scope", () => {
    const m = membership({ type: { offering_ids: ["off-other"] } });
    expect(membershipCoverage(m, ctx).reason).toBe("offering_not_covered");
  });

  it("respects location scope", () => {
    const m = membership({ type: { locations: ["loc-other"] } });
    expect(membershipCoverage(m, ctx).reason).toBe("location_not_covered");
  });

  it("tracks remaining for limited plans and blocks when exhausted", () => {
    const limited = membership({ classes_used_this_cycle: 6, type: { classes_per_cycle: 8 } });
    expect(membershipCoverage(limited, ctx)).toEqual({ covers: true, remaining: 2 });

    const used = membership({ classes_used_this_cycle: 8, type: { classes_per_cycle: 8 } });
    expect(membershipCoverage(used, ctx)).toEqual({ covers: false, remaining: 0, reason: "no_classes_left" });
  });

  it("honors a hard expiry date", () => {
    const m = membership({ expires_at: "2026-06-07T00:00:00Z" });
    expect(membershipCoverage(m, ctx).reason).toBe("expired");
  });
});

describe("packCoverage", () => {
  it("covers when active, unexpired, has classes", () => {
    expect(packCoverage(pack(), ctx)).toEqual({ covers: true, remaining: 7 });
  });

  it("does not cover when expired", () => {
    expect(packCoverage(pack({ expires_at: "2026-06-01T00:00:00Z" }), ctx).reason).toBe("expired");
  });

  it("does not cover when exhausted", () => {
    expect(packCoverage(pack({ classes_remaining: 0 }), ctx).reason).toBe("no_classes_left");
  });

  it("respects offering scope", () => {
    expect(packCoverage(pack({ type: { offering_ids: ["off-other"] } }), ctx).reason).toBe("offering_not_covered");
  });
});

describe("resolvePaymentSources + recommendation", () => {
  const offering = { id: OFFERING_ID, drop_in_price_cents: 2500 };

  it("builds covering sources first and appends drop-in", () => {
    const sources = resolvePaymentSources({
      offering,
      locationId: LOCATION_ID,
      memberships: [membership()],
      packs: [pack()],
      now: NOW,
    });
    expect(sources.map((s) => s.type)).toEqual(["MEMBERSHIP", "CLASS_PACK", "DROP_IN"]);
    expect(sources[0].covers).toBe(true);
  });

  it("recommends unlimited membership over a pack", () => {
    const sources = resolvePaymentSources({
      offering,
      locationId: LOCATION_ID,
      memberships: [membership()],
      packs: [pack()],
      now: NOW,
    });
    expect(pickRecommended(sources)?.type).toBe("MEMBERSHIP");
  });

  it("recommends a pack over a limited membership that is out of classes, and never a non-covering source", () => {
    const exhaustedMembership = membership({ classes_used_this_cycle: 8, type: { classes_per_cycle: 8 } });
    const sources = resolvePaymentSources({
      offering,
      locationId: LOCATION_ID,
      memberships: [exhaustedMembership],
      packs: [pack()],
      now: NOW,
    });
    const rec = pickRecommended(sources);
    expect(rec?.type).toBe("CLASS_PACK");
    expect(rec?.covers).toBe(true);
  });

  it("falls back to drop-in when nothing covers", () => {
    const sources = resolvePaymentSources({
      offering,
      locationId: LOCATION_ID,
      memberships: [membership({ status: "cancelled" })],
      packs: [],
      now: NOW,
    });
    expect(pickRecommended(sources)?.type).toBe("DROP_IN");
  });

  it("omits drop-in when the offering has no drop-in price", () => {
    const sources = resolvePaymentSources({
      offering: { id: OFFERING_ID, drop_in_price_cents: null },
      locationId: LOCATION_ID,
      memberships: [],
      packs: [],
      now: NOW,
    });
    expect(sources).toHaveLength(0);
    expect(pickRecommended(sources)).toBeNull();
  });

  it("sorts non-covering sources to the bottom", () => {
    const sources = resolvePaymentSources({
      offering,
      locationId: LOCATION_ID,
      memberships: [membership({ type: { offering_ids: ["off-other"] } })], // does not cover
      packs: [pack()],
      now: NOW,
    });
    const sorted = sortByPreference(sources);
    expect(sorted[sorted.length - 1].covers).toBe(false);
  });
});

describe("cancellation policy", () => {
  it("computes the deadline", () => {
    const deadline = cancellationDeadline("2026-06-08T18:00:00Z", 120);
    expect(deadline.toISOString()).toBe("2026-06-08T16:00:00.000Z");
  });

  it("flags late cancels inside the window", () => {
    const start = "2026-06-08T13:00:00Z"; // 1h from NOW
    expect(isLateCancel(start, 120, NOW)).toBe(true); // window opened at 11:00
    expect(isLateCancel(start, 30, NOW)).toBe(false); // window opens at 12:30
  });
});
