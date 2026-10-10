import { describe, it, expect } from "vitest";
import { LEGAL_DOCS, ALL_LEGAL_LINKS, LEGAL_CONTACT, HOSTED_IDENTITY, resolveLegalIdentity } from "./index";

describe("legal pages", () => {
  it("has a page for every footer link", () => {
    for (const l of ALL_LEGAL_LINKS) {
      expect(LEGAL_DOCS[l.to.slice(1) as keyof typeof LEGAL_DOCS]).toBeDefined();
    }
  });
  it("gives a contact address and has content in every section", () => {
    for (const doc of Object.values(LEGAL_DOCS)) {
      expect(doc.sections.length).toBeGreaterThan(2);
      for (const s of doc.sections) expect(s.body.join("").trim().length).toBeGreaterThan(20);
      expect(JSON.stringify(doc)).toContain(LEGAL_CONTACT);
    }
  });
  it("matches the product: 2-hour default cancellation window and no card storage", () => {
    expect(JSON.stringify(LEGAL_DOCS.refunds)).toContain("2 hours");
    expect(JSON.stringify(LEGAL_DOCS.privacy)).toContain("never your card number");
  });
});

describe("resolveLegalIdentity", () => {
  it("publishes the hosted policies only on tandavastudio.com or a hosted build", () => {
    expect(resolveLegalIdentity({}, "tandavastudio.com")).toEqual(HOSTED_IDENTITY);
    expect(resolveLegalIdentity({}, "www.tandavastudio.com")).toEqual(HOSTED_IDENTITY);
    expect(resolveLegalIdentity({ VITE_LEGAL_HOSTED: "true" }, "127.0.0.1")).toEqual(HOSTED_IDENTITY);
    expect(resolveLegalIdentity({}, "yoga.example.com")).toBeNull();
    expect(resolveLegalIdentity({}, "nottandavastudio.com")).toBeNull();
  });
});
