import { describe, expect, it } from "vitest";
import { deviceType, parseLanding, withEmbedHandoff } from "./landing";

describe("parseLanding", () => {
  it("reads UTMs and click ids from a full URL", () => {
    const f = parseLanding("https://tandava.app/s/aloha?utm_source=instagram&utm_medium=bio&utm_campaign=fall&gclid=G1&fbclid=F1");
    expect(f.utm).toMatchObject({ source: "instagram", medium: "bio", campaign: "fall" });
    expect(f.clickIds).toMatchObject({ gclid: "G1", fbclid: "F1" });
  });
  it("works with a path and ignores junk", () => {
    expect(parseLanding("/s/aloha?utm_source=%20%20").utm.source).toBeUndefined();
    expect(parseLanding("not a url at all").utm).toEqual({
      source: undefined, medium: undefined, campaign: undefined, content: undefined, term: undefined,
    });
  });
  it("only adopts a well-formed handoff visitor id", () => {
    expect(parseLanding("/s/a/book/1?tv=11111111-1111-1111-1111-111111111111").handoffVisitorId).toBe(
      "11111111-1111-1111-1111-111111111111",
    );
    expect(parseLanding("/s/a/book/1?tv=<script>").handoffVisitorId).toBeUndefined();
  });
  it("clips very long values", () => {
    expect(parseLanding(`/x?utm_campaign=${"a".repeat(500)}`).utm.campaign).toHaveLength(200);
  });
});

describe("withEmbedHandoff", () => {
  const v = "11111111-1111-1111-1111-111111111111";
  it("adds visitor, embed medium and the parent site as source", () => {
    const url = new URL(withEmbedHandoff("/s/aloha/book/x", v, "alohayoga.com"), "https://t.app");
    expect(url.searchParams.get("tv")).toBe(v);
    expect(url.searchParams.get("utm_medium")).toBe("embed");
    expect(url.searchParams.get("utm_source")).toBe("alohayoga.com");
  });
  it("keeps the studio's own tags", () => {
    const url = new URL(withEmbedHandoff("/s/aloha/book/x?utm_source=newsletter&utm_medium=email", v, "alohayoga.com"), "https://t.app");
    expect(url.searchParams.get("utm_source")).toBe("newsletter");
    expect(url.searchParams.get("utm_medium")).toBe("email");
  });
});

describe("deviceType", () => {
  it.each([
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", "mobile"],
    ["Mozilla/5.0 (Linux; Android 14; Pixel 4 XL) Mobile", "mobile"],
    ["Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)", "tablet"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)", "desktop"],
  ])("%s → %s", (ua, t) => expect(deviceType(ua)).toBe(t));
});
