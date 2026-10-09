import { describe, it, expect } from "vitest";
import { payoutState } from "./payouts";

describe("payoutState", () => {
  it("only reports ready when Stripe has charges enabled", () => {
    expect(payoutState({ connected: true, chargesEnabled: false }).kind).toBe("pending");
    expect(payoutState({ connected: true, chargesEnabled: true }).kind).toBe("ready");
  });
  it("covers loading and not started", () => {
    expect(payoutState(null).kind).toBe("loading");
    expect(payoutState({ connected: false, chargesEnabled: false }).kind).toBe("not_started");
  });
});
