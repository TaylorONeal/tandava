import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Guards the embed widget (E2E-04 precondition): the global security headers
 * must not forbid framing /embed/*, otherwise studios cannot place the schedule
 * widget on their own websites. Everything else stays frame-denied.
 *
 * Vercel `source` values are path-to-regexp; the three patterns used here are
 * also valid regular expressions once anchored, which is all this test needs.
 */
type Rule = { source: string; headers: { key: string; value: string }[] };
const rules: Rule[] = JSON.parse(readFileSync(new URL("../../vercel.json", import.meta.url), "utf8")).headers;

function headersFor(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of rules) {
    if (new RegExp(`^${r.source}$`).test(path)) {
      for (const h of r.headers) out[h.key] = h.value;
    }
  }
  return out;
}

describe("vercel.json frame headers", () => {
  it("allows framing the embed widget", () => {
    const h = headersFor("/embed/schedule/oxatl");
    expect(h["X-Frame-Options"]).toBeUndefined();
    expect(h["Content-Security-Policy"]).toContain("frame-ancestors *");
    expect(h["Content-Security-Policy"]).not.toContain("frame-ancestors 'none'");
  });
  it("still denies framing everywhere else", () => {
    for (const path of ["/", "/manage", "/s/oxatl", "/discover", "/auth/login", "/embedding-guide"]) {
      const h = headersFor(path);
      expect(h["X-Frame-Options"], path).toBe("DENY");
      expect(h["Content-Security-Policy"], path).toContain("frame-ancestors 'none'");
    }
  });
  it("keeps the other security headers on embed pages", () => {
    const h = headersFor("/embed/event/abc");
    expect(h["Strict-Transport-Security"]).toBeDefined();
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
  });
  it("lets Stripe.js and Turnstile load their frames", () => {
    for (const path of ["/s/oxatl", "/embed/schedule/oxatl", "/auth/register"]) {
      const csp = headersFor(path)["Content-Security-Policy"] ?? "";
      const frameSrc = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("frame-src")) ?? "";
      for (const origin of ["https://js.stripe.com", "https://hooks.stripe.com", "https://challenges.cloudflare.com"]) {
        expect(frameSrc, `${path} ${origin}`).toContain(origin);
      }
    }
  });
});
