import { describe, it, expect } from "vitest";
import { getStudioSlugFromHost } from "./studio-host";

const ROOT = "tandavastudio.com";

describe("getStudioSlugFromHost", () => {
  it("resolves a single-label studio subdomain", () => {
    expect(getStudioSlugFromHost("oxatl.tandavastudio.com", ROOT)).toBe("oxatl");
    expect(getStudioSlugFromHost("green-lotus.tandavastudio.com", ROOT)).toBe("green-lotus");
  });

  it("is case-insensitive and tolerates a trailing dot", () => {
    expect(getStudioSlugFromHost("Oxatl.TandavaStudio.com", ROOT)).toBe("oxatl");
    expect(getStudioSlugFromHost("oxatl.tandavastudio.com.", ROOT)).toBe("oxatl");
  });

  it("returns null for the apex and www", () => {
    expect(getStudioSlugFromHost("tandavastudio.com", ROOT)).toBeNull();
    expect(getStudioSlugFromHost("www.tandavastudio.com", ROOT)).toBeNull();
  });

  it("returns null for reserved platform labels", () => {
    for (const label of ["app", "api", "admin", "docs", "demo", "preview"]) {
      expect(getStudioSlugFromHost(`${label}.tandavastudio.com`, ROOT)).toBeNull();
    }
  });

  it("returns null for a different domain (previews, localhost, custom)", () => {
    expect(getStudioSlugFromHost("tandava-git-abc.vercel.app", ROOT)).toBeNull();
    expect(getStudioSlugFromHost("localhost", ROOT)).toBeNull();
    expect(getStudioSlugFromHost("127.0.0.1", ROOT)).toBeNull();
    expect(getStudioSlugFromHost("book.someotherstudio.com", ROOT)).toBeNull();
  });

  it("returns null for multi-level subdomains", () => {
    expect(getStudioSlugFromHost("a.b.tandavastudio.com", ROOT)).toBeNull();
  });

  it("returns null for invalid slug shapes", () => {
    expect(getStudioSlugFromHost("_bad.tandavastudio.com", ROOT)).toBeNull();
    expect(getStudioSlugFromHost("-lead.tandavastudio.com", ROOT)).toBeNull();
    expect(getStudioSlugFromHost("trail-.tandavastudio.com", ROOT)).toBeNull();
  });

  it("is off (null) when no root domain is configured", () => {
    expect(getStudioSlugFromHost("oxatl.tandavastudio.com", undefined)).toBeNull();
    expect(getStudioSlugFromHost("oxatl.tandavastudio.com", "")).toBeNull();
  });

  it("normalizes a root domain given with leading/trailing dots", () => {
    expect(getStudioSlugFromHost("oxatl.tandavastudio.com", ".tandavastudio.com.")).toBe("oxatl");
  });

  it("returns null for missing host", () => {
    expect(getStudioSlugFromHost(undefined, ROOT)).toBeNull();
    expect(getStudioSlugFromHost("", ROOT)).toBeNull();
  });
});
