import { describe, expect, it } from "vitest";
import { captchaBridgeUrl, parseBridgeMessage } from "./captchaBridge";

describe("captcha bridge", () => {
  it("builds the bridge address on the public site", () => {
    expect(captchaBridgeUrl("0x4AAAAAAAtest", false)).toBe("https://tandavastudio.com/captcha-bridge.html?k=0x4AAAAAAAtest");
    expect(captchaBridgeUrl("0x4AAAAAAAtest", true)).toContain("theme=dark");
  });

  it("accepts a token only from the public site", () => {
    const msg = { type: "tandava-turnstile", event: "token", token: "abc" };
    expect(parseBridgeMessage("https://tandavastudio.com", msg)).toEqual({ event: "token", token: "abc" });
    expect(parseBridgeMessage("https://evil.example", msg)).toBeNull();
    expect(parseBridgeMessage("https://www.tandavastudio.com", msg)).toBeNull();
  });

  it("ignores malformed messages", () => {
    const o = "https://tandavastudio.com";
    expect(parseBridgeMessage(o, null)).toBeNull();
    expect(parseBridgeMessage(o, "token")).toBeNull();
    expect(parseBridgeMessage(o, { type: "other", event: "token", token: "x" })).toBeNull();
    expect(parseBridgeMessage(o, { type: "tandava-turnstile", event: "token", token: "" })).toBeNull();
    expect(parseBridgeMessage(o, { type: "tandava-turnstile", event: "reset" })).toBeNull();
    expect(parseBridgeMessage(o, { type: "tandava-turnstile", event: "expired" })).toEqual({ event: "expired" });
  });
});
