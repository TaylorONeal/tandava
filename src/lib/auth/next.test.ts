import { describe, expect, it } from "vitest";
import { expressBookingPath, loginHref, safeNextPath } from "./next";

describe("safeNextPath", () => {
  it("keeps same-origin paths with query strings", () => {
    expect(safeNextPath("/s/oxatl/book/abc?utm_source=ig")).toBe("/s/oxatl/book/abc?utm_source=ig");
  });
  it.each([
    "https://evil.example/",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "s/oxatl",
    "",
    "/auth/login",
    "/ok\nSet-Cookie: x",
  ])("rejects %j", (raw) => {
    expect(safeNextPath(raw, "/fallback")).toBe("/fallback");
  });
  it("rejects non-strings", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath({ pathname: "/x" })).toBe("/");
  });
});

describe("loginHref", () => {
  it("encodes the return path", () => {
    expect(loginHref("/s/oxatl/book/abc")).toBe("/auth/login?next=%2Fs%2Foxatl%2Fbook%2Fabc");
  });
  it("drops an unsafe or root return path", () => {
    expect(loginHref("https://evil.example")).toBe("/auth/login");
    expect(loginHref("/")).toBe("/auth/login");
  });
});

describe("expressBookingPath", () => {
  it("encodes both segments", () => {
    expect(expressBookingPath("oxatl yoga", "a/b")).toBe("/s/oxatl%20yoga/book/a%2Fb");
  });
});
