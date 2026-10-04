import { describe, expect, it } from "vitest";
import { authHref, popReturn, resolveAfterAuth, safeNext, stashReturn } from "./authReturn";

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

describe("safeNext", () => {
  it("accepts same-site paths including query strings", () => {
    expect(safeNext("/s/oxatl?class=123")).toBe("/s/oxatl?class=123");
    expect(safeNext("/account")).toBe("/account");
  });

  it("rejects anything that could leave the site or loop", () => {
    for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "/\t/evil.com",
      "/auth/login", "/auth/register?next=/x", "evil.com", "", "/" + "a".repeat(2000)]) {
      expect(safeNext(bad), bad).toBeNull();
    }
    expect(safeNext(null)).toBeNull();
    expect(safeNext("https://evil.com", "/fallback")).toBe("/fallback");
  });
});

describe("authHref", () => {
  it("encodes the destination and drops unsafe ones", () => {
    expect(authHref("/auth/register", "/s/oxatl?class=1")).toBe("/auth/register?next=%2Fs%2Foxatl%3Fclass%3D1");
    expect(authHref("/auth/login", "https://evil.com")).toBe("/auth/login");
    expect(authHref("/auth/login", undefined)).toBe("/auth/login");
  });
});

describe("stash and pop", () => {
  it("returns the path once, then nothing", () => {
    const s = memoryStorage();
    stashReturn("/s/oxatl?class=1", s, 1000);
    expect(popReturn(s, 2000)).toBe("/s/oxatl?class=1");
    expect(popReturn(s, 2000)).toBeNull();
  });

  it("expires after an hour", () => {
    const s = memoryStorage();
    stashReturn("/s/oxatl", s, 0);
    expect(popReturn(s, 61 * 60 * 1000)).toBeNull();
  });

  it("ignores unsafe or corrupt data and missing storage", () => {
    const s = memoryStorage();
    stashReturn("https://evil.com", s);
    expect(popReturn(s)).toBeNull();
    s.setItem("tandava.authReturn", "{not json");
    expect(popReturn(s)).toBeNull();
    expect(popReturn(null)).toBeNull();
    expect(() => stashReturn("/x", null)).not.toThrow();
  });
});

describe("resolveAfterAuth", () => {
  it("prefers ?next=, then the stash, then router state, then the fallback", () => {
    const s = memoryStorage();
    stashReturn("/from-stash", s, 0);
    expect(resolveAfterAuth({ next: "/from-param", from: { pathname: "/manage" }, storage: s, now: 1 })).toBe("/from-param");

    stashReturn("/from-stash", s, 0);
    expect(resolveAfterAuth({ from: { pathname: "/manage" }, storage: s, now: 1 })).toBe("/from-stash");

    expect(resolveAfterAuth({ from: { pathname: "/manage", search: "?tab=1" }, storage: s, now: 1 })).toBe("/manage?tab=1");
    expect(resolveAfterAuth({ storage: s, fallback: "/account" })).toBe("/account");
    expect(resolveAfterAuth({ storage: s })).toBe("/");
  });

  it("clears the stash even when ?next= wins, so it cannot resurface later", () => {
    const s = memoryStorage();
    stashReturn("/stale", s, 0);
    resolveAfterAuth({ next: "/fresh", storage: s, now: 1 });
    expect(popReturn(s, 1)).toBeNull();
  });
});
