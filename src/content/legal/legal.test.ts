import { describe, it, expect } from "vitest";
import { LEGAL_DOCS, LEGAL_LINKS, LEGAL_CONTACT } from "./index";

describe("legal pages", () => {
  it("has a page for every footer link", () => {
    for (const l of LEGAL_LINKS) {
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
