import { describe, expect, it } from "vitest";
import { safeReturnUrl } from "../../supabase/functions/_shared/urls";

const APP = "https://tandava.app";
const FALLBACK = "https://tandava.app/account?checkout=success";

describe("safeReturnUrl", () => {
  it("accepts the app itself and its studio subdomains", () => {
    expect(safeReturnUrl("https://tandava.app/account", FALLBACK, APP)).toBe("https://tandava.app/account");
    expect(safeReturnUrl("https://oxatl.tandava.app/s/oxatl?x=1", FALLBACK, APP)).toBe("https://oxatl.tandava.app/s/oxatl?x=1");
  });

  it("accepts a plain path and resolves it against the app", () => {
    expect(safeReturnUrl("/account?checkout=success", FALLBACK, APP)).toBe("https://tandava.app/account?checkout=success");
  });

  it("rejects other hosts, look-alikes and open-redirect tricks", () => {
    for (const bad of [
      "https://evil.com/pay",
      "https://tandava.app.evil.com/",
      "https://eviltandava.app/",
      "https://tandava.app@evil.com/",
      "//evil.com/x",
      "/\\evil.com",
      "javascript:alert(1)",
      "http://tandava.app/insecure",
      "https://tandava.app:8443/other-port",
      "not a url",
    ]) {
      expect(safeReturnUrl(bad, FALLBACK, APP), bad).toBe(FALLBACK);
    }
  });

  it("falls back for missing, non-string or oversized input", () => {
    expect(safeReturnUrl(undefined, FALLBACK, APP)).toBe(FALLBACK);
    expect(safeReturnUrl(42, FALLBACK, APP)).toBe(FALLBACK);
    expect(safeReturnUrl("https://tandava.app/" + "a".repeat(3000), FALLBACK, APP)).toBe(FALLBACK);
  });

  it("allows http only for a localhost app (development)", () => {
    expect(safeReturnUrl("http://localhost:8080/account", "x", "http://localhost:8080")).toBe("http://localhost:8080/account");
    expect(safeReturnUrl("http://sub.localhost:8080/", "x", "http://localhost:8080")).toBe("x");
  });
});
