import { describe, expect, it } from "vitest";
import { signUnsubscribe, verifyUnsubscribe } from "./unsubscribeToken";

const S = "11111111-1111-4111-8111-111111111111";
const P = "22222222-2222-4222-8222-222222222222";

describe("unsubscribe tokens", () => {
  it("round-trips", async () => {
    const t = await signUnsubscribe(S, P, "secret");
    expect(await verifyUnsubscribe(t, "secret")).toEqual({ studioId: S, profileId: P });
  });
  it("rejects a wrong secret, a tampered payload and junk", async () => {
    const t = await signUnsubscribe(S, P, "secret");
    expect(await verifyUnsubscribe(t, "other")).toBeNull();
    const other = await signUnsubscribe(S, "33333333-3333-4333-8333-333333333333", "secret");
    const tampered = `${other.split(".")[0]}.${t.split(".")[1]}`;
    expect(await verifyUnsubscribe(tampered, "secret")).toBeNull();
    expect(await verifyUnsubscribe("nope", "secret")).toBeNull();
    expect(await verifyUnsubscribe("", "secret")).toBeNull();
    expect(await verifyUnsubscribe(t, "")).toBeNull();
  });
  it("is url safe", async () => {
    expect(await signUnsubscribe(S, P, "secret")).toMatch(/^[A-Za-z0-9_.-]+$/);
  });
});
