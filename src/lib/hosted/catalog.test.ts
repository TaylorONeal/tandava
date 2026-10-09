import { describe, it, expect } from "vitest";
import {
  parseMoney, centsToInput, formatPrice, offeringFromForm, emptyOfferingForm, packFromForm, emptyPackForm,
  membershipFromForm, emptyMembershipForm, ruleEndTime, ruleFromForm, rulesByDay, uniqueSlug, formatTime,
} from "./catalog";

describe("money", () => {
  it("parses dollars to cents", () => {
    expect(parseMoney("25")).toBe(2500);
    expect(parseMoney("$25.5")).toBe(2550);
    expect(parseMoney("1,200")).toBe(120000);
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("abc")).toBeNaN();
    expect(parseMoney("-5")).toBeNaN();
  });
  it("round-trips to the input", () => {
    expect(centsToInput(2500)).toBe("25");
    expect(centsToInput(2550)).toBe("25.50");
    expect(centsToInput(null)).toBe("");
  });
  it("labels free and members-only classes", () => {
    expect(formatPrice(0)).toBe("Free");
    expect(formatPrice(null)).toBe("Members and packs only");
    expect(formatPrice(2500)).toBe("$25.00");
  });
});

describe("offeringFromForm", () => {
  it("accepts a valid class and keeps free and members-only distinct", () => {
    const f = { ...emptyOfferingForm(), name: " Yin ", dropIn: "0" };
    expect(offeringFromForm(f).patch).toMatchObject({ name: "Yin", drop_in_price_cents: 0, duration_minutes: 60 });
    expect(offeringFromForm({ ...f, dropIn: "" }).patch?.drop_in_price_cents).toBeNull();
  });
  it("rejects a missing name, bad length, and a paid price below Stripe's minimum", () => {
    const r = offeringFromForm({ ...emptyOfferingForm(), duration: "0", dropIn: "0.25" });
    expect(r.patch).toBeUndefined();
    expect(r.errors).toHaveLength(3);
  });
});

describe("packs and memberships", () => {
  it("needs a paid price and names a pack from its size", () => {
    expect(packFromForm({ ...emptyPackForm(), price: "" }).errors?.[0]).toMatch(/at least/);
    expect(packFromForm({ ...emptyPackForm(), price: "150" }).patch).toMatchObject({ name: "10-Class Pack", price_cents: 15000 });
  });
  it("treats blank classes per cycle as unlimited", () => {
    expect(membershipFromForm({ ...emptyMembershipForm(), price: "120" }).patch)
      .toMatchObject({ name: "Unlimited", classes_per_cycle: null, billing_cycle: "monthly" });
    expect(membershipFromForm({ ...emptyMembershipForm(), price: "120", classesPerCycle: "0" }).errors).toBeDefined();
  });
});

describe("schedule", () => {
  it("ends a class on the same day", () => {
    expect(ruleEndTime("18:00", 75)).toBe("19:15");
    expect(ruleEndTime("23:30:00", 60)).toBe("23:59");
  });
  it("builds a rule from the class length", () => {
    const r = ruleFromForm(
      { offeringId: "o1", day: "tuesday", start: "07:30", teacherId: "", locationId: "l1", isActive: true },
      [{ id: "o1", duration_minutes: 90 }],
    );
    expect(r.patch).toMatchObject({ end_time: "09:00", teacher_id: null, recurrence: "weekly" });
  });
  it("needs a class, a time and a location", () => {
    const r = ruleFromForm({ offeringId: "x", day: "tuesday", start: "7", teacherId: "", locationId: "", isActive: true }, []);
    expect(r.errors).toHaveLength(3);
  });
  it("groups Monday first, sorted by time", () => {
    const g = rulesByDay([
      { day_of_week: "sunday", start_time: "09:00:00" },
      { day_of_week: "monday", start_time: "18:00:00" },
      { day_of_week: "monday", start_time: "07:00:00" },
    ] as const as { day_of_week: "sunday" | "monday"; start_time: string }[]);
    expect(g.map((d) => d.day)).toEqual(["monday", "sunday"]);
    expect(g[0].rules[0].start_time).toBe("07:00:00");
  });
  it("formats times", () => {
    expect(formatTime("07:00:00")).toBe("7am");
    expect(formatTime("18:30")).toBe("6:30pm");
    expect(formatTime("12:00")).toBe("12pm");
  });
});

describe("uniqueSlug", () => {
  it("adds a number when taken", () => {
    expect(uniqueSlug("Hot Vinyasa!", [])).toBe("hot-vinyasa");
    expect(uniqueSlug("Hot Vinyasa", ["hot-vinyasa", "hot-vinyasa-2"])).toBe("hot-vinyasa-3");
  });
});
