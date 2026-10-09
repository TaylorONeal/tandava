import { describe, it, expect } from "vitest";
import { profileToForm, formToPatch, toEntitlementView } from "./myAccount";
import type { MyEntitlementRow, Profile } from "@/types/database";

const NOW = new Date("2026-10-09T12:00:00Z");

describe("profile form", () => {
  it("never shows made-up data: an empty profile is an empty form", () => {
    const f = profileToForm(null);
    expect(Object.values(f).every((v) => v === "")).toBe(true);
  });
  it("round-trips a real profile and trims, nulls blanks, drops a leading @", () => {
    const f = profileToForm({ first_name: "Taylor", last_name: null, instagram_handle: null } as unknown as Profile);
    expect(f.firstName).toBe("Taylor");
    const { patch } = formToPatch({ ...f, lastName: "  ", instagramHandle: "@purafield", phone: " 512 " }, NOW);
    expect(patch).toMatchObject({ first_name: "Taylor", last_name: null, instagram_handle: "purafield", phone: "512" });
  });
  it("rejects a future or malformed date of birth", () => {
    expect(formToPatch({ ...profileToForm(null), dateOfBirth: "2030-01-01" }, NOW).errors).toBeDefined();
    expect(formToPatch({ ...profileToForm(null), dateOfBirth: "01/02/1990" }, NOW).errors).toBeDefined();
  });
});

const ent = (over: Partial<MyEntitlementRow> = {}): MyEntitlementRow => ({
  kind: "membership", entitlement_id: "m1", studio_id: "s1", studio_name: "Purafield Studio (test)",
  studio_slug: "p", currency: "USD", name: "Test Unlimited Monthly", status: "active", price_cents: 9900,
  billing_cycle: "monthly", ends_at: "2026-11-09T12:00:00Z", classes_remaining: null, has_subscription: true, ...over,
});

describe("toEntitlementView", () => {
  it("labels an active membership with price, renewal and billing", () => {
    const v = toEntitlementView(ent(), NOW);
    expect(v).toMatchObject({ priceLabel: "$99 / month", dateLabel: "Renews Nov 9, 2026", statusLabel: "Active", isActive: true, canManageBilling: true });
  });
  it("labels a pack with classes left and expiry", () => {
    const v = toEntitlementView(ent({ kind: "pack", name: "Test 5-Class Pack", price_cents: 8000, billing_cycle: null, classes_remaining: 1, has_subscription: false, ends_at: "2027-01-07T00:00:00Z" }), NOW);
    expect(v).toMatchObject({ priceLabel: "$80", remainingLabel: "1 class left", dateLabel: "Expires Jan 7, 2027", canManageBilling: false });
  });
  it("shows an expired pack as expired even if its row still says active", () => {
    const v = toEntitlementView(ent({ kind: "pack", ends_at: "2026-10-01T00:00:00Z", classes_remaining: 3 }), NOW);
    expect(v).toMatchObject({ isActive: false, statusLabel: "Expired", dateLabel: "Expired Oct 1, 2026" });
  });
  it("humanises past_due", () => {
    expect(toEntitlementView(ent({ status: "past_due" }), NOW).statusLabel).toBe("Past due");
  });
});
