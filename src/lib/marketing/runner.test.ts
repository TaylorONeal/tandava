import { describe, expect, it } from "vitest";
import { factsFromCandidate, formatAddress, planStudio, settingsFromRow, type CandidateRow } from "./runner";

const NOW = new Date("2026-10-08T17:00:00Z"); // noon in Chicago, outside quiet hours

const base = (p: Partial<CandidateRow>): CandidateRow => ({
  profile_id: "p1",
  email: "a@b.co",
  first_name: "Ana",
  is_guest: false,
  claimed_at: null,
  email_consent: true,
  first_booking_at: null,
  guest_booking_at: null,
  first_check_in_at: null,
  last_visit_at: null,
  visit_count: "0",
  booking_count: "0",
  median_gap_days: null,
  has_active_membership: false,
  has_active_pack: false,
  sends: [],
  ...p,
});

describe("factsFromCandidate", () => {
  it("coerces bigint strings and drops unknown send keys", () => {
    const f = factsFromCandidate(
      base({ visit_count: "3", median_gap_days: "6.5", sends: [{ key: "x", step: 0, episode: "e", sent_at: "t" }, { key: "lapsed", step: 0, episode: "e", sent_at: "t" }] }),
    );
    expect(f.visitCount).toBe(3);
    expect(f.medianGapDays).toBe(6.5);
    expect(f.sends.map((s) => s.key)).toEqual(["lapsed"]);
  });
});

describe("settingsFromRow", () => {
  it("defaults to all on", () => {
    expect(settingsFromRow(null).lapsedEnabled).toBe(true);
    expect(settingsFromRow({ lapsed_enabled: false }).lapsedEnabled).toBe(false);
  });
});

describe("planStudio", () => {
  const guest = base({ profile_id: "g", is_guest: true, guest_booking_at: "2026-10-06T17:00:00Z", booking_count: "1" });
  const noConsent = base({ profile_id: "n", is_guest: true, guest_booking_at: "2026-10-06T17:00:00Z", email_consent: false });
  const noEmail = base({ profile_id: "e", email: null });

  it("plans due sends and counts skips", () => {
    const plan = planStudio([guest, noConsent, noEmail], null, NOW, "America/Chicago");
    expect(plan.sends).toHaveLength(1);
    expect(plan.sends[0].decision.template).toBe("automation_guest_save_details");
    expect(plan.skipped.no_consent).toBe(1);
    expect(plan.skipped.no_email).toBe(1);
  });

  it("respects a studio switching the automation off", () => {
    expect(planStudio([guest], { guest_to_member_enabled: false }, NOW, "America/Chicago").sends).toHaveLength(0);
  });

  it("sends nothing in the studio's quiet hours", () => {
    const plan = planStudio([guest], null, NOW, "Pacific/Kiritimati"); // 07:00 next day there
    expect(plan.sends).toHaveLength(0);
    expect(plan.skipped.quiet_hours).toBe(1);
  });

  it("caps sends per run", () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ ...guest, profile_id: `g${i}` }));
    const plan = planStudio(many, null, NOW, "America/Chicago", 2);
    expect(plan.sends).toHaveLength(2);
    expect(plan.skipped.over_limit).toBe(3);
  });
});

describe("formatAddress", () => {
  it("formats a full address and refuses an incomplete one", () => {
    expect(formatAddress({ address_line1: "100 Congress Ave", address_line2: "Ste 2", city: "Austin", state: "TX", zip: "78701" })).toBe(
      "100 Congress Ave Ste 2, Austin, TX 78701",
    );
    expect(formatAddress({ address_line1: "100 Congress Ave" })).toBeNull();
    expect(formatAddress(null)).toBeNull();
  });
});
