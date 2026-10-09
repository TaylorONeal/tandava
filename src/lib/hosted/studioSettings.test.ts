import { describe, expect, it } from "vitest";
import { toForm, toPatch, type StudioSettingsRow } from "./studioSettings";

const row: StudioSettingsRow = {
  id: "s1",
  name: "Purafield Studio",
  slug: "purafield",
  email: null,
  phone: "+1 512 555 0100",
  website: null,
  timezone: "America/Chicago",
  currency: "USD",
  brand_primary_color: "#2FBFA9",
  brand_secondary_color: null,
  default_cancellation_minutes: 120,
  late_cancel_fee_cents: 1500,
  no_show_fee_cents: 2050,
  waitlist_enabled: true,
  max_waitlist_size: 10,
  discoverable: false,
  express_booking_enabled: false,
  page_live: true,
};

describe("studio settings mapping", () => {
  it("shows cents as dollars and nulls as empty fields", () => {
    const f = toForm(row);
    expect(f.lateCancelFee).toBe("15");
    expect(f.noShowFee).toBe("20.50");
    expect(f.email).toBe("");
    expect(f.cancelMinutes).toBe("120");
  });

  it("round-trips to the same column values", () => {
    const r = toPatch(toForm(row));
    expect(r.status).toBe("ok");
    if (r.status !== "ok") return;
    expect(r.patch.late_cancel_fee_cents).toBe(1500);
    expect(r.patch.no_show_fee_cents).toBe(2050);
    expect(r.patch.email).toBeNull();
    expect(r.patch.brand_primary_color).toBe("#2fbfa9");
    expect(r.patch).not.toHaveProperty("slug");
    expect(r.patch).not.toHaveProperty("discoverable");
  });

  it("rejects bad input with readable errors", () => {
    const r = toPatch({ ...toForm(row), name: " ", lateCancelFee: "-1", primaryColor: "teal", maxWaitlist: "0" });
    expect(r.status).toBe("invalid");
    if (r.status !== "invalid") return;
    expect(r.errors).toHaveLength(4);
  });
});
