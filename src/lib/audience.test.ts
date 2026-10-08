import { describe, expect, it } from "vitest";
import { parseIntent, STUDIO_ONBOARDING_PATH, STUDIO_SIGNUP_HREF } from "./audience";
import { safeNext } from "./authReturn";

describe("audience entry points", () => {
  it("only intent=studio is an owner; anything else is a student", () => {
    expect(parseIntent("studio")).toBe("studio");
    expect(parseIntent("student")).toBe("student");
    expect(parseIntent(null)).toBe("student");
    expect(parseIntent("Studio ")).toBe("student");
  });

  it("the studio signup link carries a next path that survives the open-redirect guard", () => {
    const url = new URL(STUDIO_SIGNUP_HREF, "https://x.test");
    expect(url.searchParams.get("intent")).toBe("studio");
    expect(safeNext(url.searchParams.get("next"))).toBe(STUDIO_ONBOARDING_PATH);
  });
});
