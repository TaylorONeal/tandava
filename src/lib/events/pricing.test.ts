import { describe, it, expect } from "vitest";
import {
  isEarlyBirdActive,
  resolveEventPrice,
  resolveTierPrice,
  resolveDeposit,
  registrationState,
  sessionsForTier,
} from "./pricing";

const NOW = new Date("2026-02-10T12:00:00Z");

describe("isEarlyBirdActive", () => {
  it("is active before the deadline and inactive after", () => {
    expect(isEarlyBirdActive(6000, "2026-02-14", NOW)).toBe(true);
    expect(isEarlyBirdActive(6000, "2026-02-01", NOW)).toBe(false);
  });
  it("is inactive without an early-bird price", () => {
    expect(isEarlyBirdActive(null, "2026-02-14", NOW)).toBe(false);
  });
  it("is active with a price and no deadline", () => {
    expect(isEarlyBirdActive(6000, null, NOW)).toBe(true);
  });
});

describe("resolveEventPrice", () => {
  it("returns regular when nothing else applies", () => {
    const r = resolveEventPrice({ regularCents: 7500, now: NOW });
    expect(r).toMatchObject({ cents: 7500, label: "regular", savingsCents: 0 });
  });

  it("applies an active early-bird discount", () => {
    const r = resolveEventPrice({ regularCents: 7500, earlyBirdCents: 6000, earlyBirdEndsAt: "2026-02-14", now: NOW });
    expect(r).toMatchObject({ cents: 6000, label: "early_bird", savingsCents: 1500 });
  });

  it("ignores an expired early-bird", () => {
    const r = resolveEventPrice({ regularCents: 7500, earlyBirdCents: 6000, earlyBirdEndsAt: "2026-02-01", now: NOW });
    expect(r.label).toBe("regular");
  });

  it("applies member price only for members", () => {
    expect(resolveEventPrice({ regularCents: 7500, memberCents: 6500, isMember: false, now: NOW }).label).toBe("regular");
    expect(resolveEventPrice({ regularCents: 7500, memberCents: 6500, isMember: true, now: NOW })).toMatchObject({ cents: 6500, label: "member" });
  });

  it("picks the lowest when member and early-bird both apply", () => {
    const r = resolveEventPrice({
      regularCents: 7500,
      memberCents: 6500,
      earlyBirdCents: 6000,
      earlyBirdEndsAt: "2026-02-14",
      isMember: true,
      now: NOW,
    });
    expect(r).toMatchObject({ cents: 6000, label: "early_bird", savingsCents: 1500 });
  });

  it("prefers the member label on a tie", () => {
    const r = resolveEventPrice({
      regularCents: 7500,
      memberCents: 6000,
      earlyBirdCents: 6000,
      earlyBirdEndsAt: "2026-02-14",
      isMember: true,
      now: NOW,
    });
    expect(r.label).toBe("member");
  });
});

describe("resolveTierPrice", () => {
  it("uses member price for members when present", () => {
    expect(resolveTierPrice({ priceCents: 12000, memberPriceCents: 10000 }, true)).toMatchObject({ cents: 10000, label: "tier_member", savingsCents: 2000 });
    expect(resolveTierPrice({ priceCents: 12000, memberPriceCents: 10000 }, false)).toMatchObject({ cents: 12000, label: "tier" });
    expect(resolveTierPrice({ priceCents: 12000 }, true).cents).toBe(12000);
  });
});

describe("resolveDeposit", () => {
  it("splits a total into deposit + balance", () => {
    expect(resolveDeposit(350000, 50000)).toEqual({ dueNowCents: 50000, balanceCents: 300000, isDeposit: true });
  });
  it("degrades to full payment when no/invalid deposit", () => {
    expect(resolveDeposit(7500, null)).toEqual({ dueNowCents: 7500, balanceCents: 0, isDeposit: false });
    expect(resolveDeposit(7500, 0)).toMatchObject({ isDeposit: false, dueNowCents: 7500 });
    expect(resolveDeposit(7500, 9000)).toMatchObject({ isDeposit: false, dueNowCents: 7500 });
  });
});

describe("registrationState", () => {
  it("is open within the window with spots", () => {
    expect(registrationState({ spotsLeft: 5, now: NOW })).toBe("open");
  });
  it("is not_open_yet before the open date", () => {
    expect(registrationState({ spotsLeft: 5, registrationOpensAt: "2026-02-20", now: NOW })).toBe("not_open_yet");
  });
  it("is closed after the close date or for non-active statuses", () => {
    expect(registrationState({ spotsLeft: 5, registrationClosesAt: "2026-02-01", now: NOW })).toBe("closed");
    expect(registrationState({ spotsLeft: 5, status: "cancelled", now: NOW })).toBe("closed");
  });
  it("is sold_out or waitlist when full", () => {
    expect(registrationState({ spotsLeft: 0, now: NOW })).toBe("sold_out");
    expect(registrationState({ spotsLeft: 0, waitlistEnabled: true, now: NOW })).toBe("waitlist");
  });
});

describe("sessionsForTier", () => {
  const sessions = [{ session_number: 1 }, { session_number: 2 }, { session_number: 3 }];
  it("returns all when the tier includes none explicitly", () => {
    expect(sessionsForTier(sessions, [])).toHaveLength(3);
    expect(sessionsForTier(sessions, undefined)).toHaveLength(3);
  });
  it("filters to the included session numbers", () => {
    expect(sessionsForTier(sessions, [1, 3]).map((s) => s.session_number)).toEqual([1, 3]);
  });
});
