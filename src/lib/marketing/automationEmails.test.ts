import { describe, expect, it } from "vitest";
import { AUTOMATION_TEMPLATES, escapeHtml, isAutomationTemplate, renderAutomationEmail, safeUrl } from "./automationEmails";
import { decideNext, DEFAULT_SETTINGS } from "./automations";

const input = {
  studioName: "Oxatl <Yoga> & Co",
  firstName: "Mia",
  scheduleUrl: "https://tandava.app/s/oxatl",
  saveDetailsUrl: "https://tandava.app/s/oxatl/save-details",
  unsubscribeUrl: "https://x.supabase.co/functions/v1/unsubscribe?t=abc.def",
  studioAddress: "100 Congress Ave, Austin, TX 78701",
};

describe("renderAutomationEmail", () => {
  it("renders every template with unsubscribe, address and escaped studio name", () => {
    for (const t of AUTOMATION_TEMPLATES) {
      const r = renderAutomationEmail(t, input);
      expect(r.subject.length).toBeGreaterThan(5);
      expect(r.html).toContain("Unsubscribe");
      expect(r.html).toContain("abc.def");
      expect(r.html).toContain("100 Congress Ave");
      expect(r.html).toContain("Oxatl &lt;Yoga&gt; &amp; Co");
      expect(r.html).not.toContain("<Yoga>");
      expect(r.text).toContain("Unsubscribe: https://x.supabase.co");
      expect(r.html).not.toMatch(/—/); // house style: no em dashes
    }
  });

  it("falls back to the schedule when no intro offer is set", () => {
    const r = renderAutomationEmail("automation_first_visit_intro_offer", input);
    expect(r.subject).toContain("Come back");
    expect(r.html).toContain("https://tandava.app/s/oxatl");
  });

  it("uses the intro offer url when set, but never a javascript: url", () => {
    expect(renderAutomationEmail("automation_guest_intro_offer", { ...input, introOfferUrl: "https://oxatl.com/intro" }).html).toContain(
      "https://oxatl.com/intro",
    );
    const bad = renderAutomationEmail("automation_guest_intro_offer", { ...input, introOfferUrl: "javascript:alert(1)" });
    expect(bad.html).not.toContain("javascript:");
  });

  it("greets without a name", () => {
    expect(renderAutomationEmail("automation_lapsed", { ...input, firstName: null }).text.startsWith("Hi,")).toBe(true);
  });

  it("covers every template the decision engine can pick", () => {
    const now = new Date("2026-10-08T17:00:00Z");
    const d = decideNext(
      {
        profileId: "p",
        isGuest: true,
        emailConsent: true,
        guestBookingAt: "2026-10-06T17:00:00Z",
        visitCount: 0,
        bookingCount: 1,
        hasActiveMembership: false,
        hasActivePack: false,
        sends: [],
      },
      now,
      "America/Chicago",
      DEFAULT_SETTINGS,
    );
    expect("decision" in d && isAutomationTemplate(d.decision.template)).toBe(true);
  });
});

describe("helpers", () => {
  it("escapes html", () => expect(escapeHtml(`"a'<b>&`)).toBe("&quot;a&#39;&lt;b&gt;&amp;"));
  it("only allows http(s) urls", () => {
    expect(safeUrl("ftp://x", "f")).toBe("f");
    expect(safeUrl(null, "f")).toBe("f");
    expect(safeUrl("https://a.b/c", "f")).toBe("https://a.b/c");
  });
});
