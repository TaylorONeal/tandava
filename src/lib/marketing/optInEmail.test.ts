import { describe, expect, it } from "vitest";
import { renderOptInConfirmEmail } from "./optInEmail";
import { signOptInConfirm, signUnsubscribe, verifyOptInConfirm, verifyUnsubscribe, OPT_IN_LINK_TTL_MS } from "./unsubscribeToken";

const S = "00000000-0000-4000-8000-00000000005a";
const P = "00000000-0000-4000-8000-0000000000b1";
const SECRET = "test-secret";

describe("opt-in confirm tokens", () => {
  it("round-trips and expires after 14 days", async () => {
    const now = Date.UTC(2026, 9, 8);
    const t = await signOptInConfirm(S, P, SECRET, now);
    expect(await verifyOptInConfirm(t, SECRET, now + 1000)).toEqual({ studioId: S, profileId: P });
    expect(await verifyOptInConfirm(t, SECRET, now + OPT_IN_LINK_TTL_MS + 1)).toBeNull();
    expect(await verifyOptInConfirm(t, "other", now)).toBeNull();
  });
  it("an unsubscribe token can't confirm an opt-in, and the reverse", async () => {
    const unsub = await signUnsubscribe(S, P, SECRET);
    expect(await verifyOptInConfirm(unsub, SECRET)).toBeNull();
    const optin = await signOptInConfirm(S, P, SECRET);
    expect(await verifyUnsubscribe(optin, SECRET)).toBeNull();
  });
});

describe("opt-in confirm email", () => {
  it("names the studio, escapes it, and carries the link", () => {
    const e = renderOptInConfirmEmail({ studioName: "Oxatl <Yoga>", confirmUrl: "https://app.example.com/email-updates?c=abc" });
    expect(e.subject).toContain("Oxatl <Yoga>");
    expect(e.html).toContain("Oxatl &lt;Yoga&gt;");
    expect(e.html).toContain("https://app.example.com/email-updates?c=abc");
    expect(e.text).toContain("14 days");
  });
});
