import { describe, expect, it } from "vitest";
import {
  classCancelledEmail, describeCancellation, summarizeCancellation, type CancelPerson,
} from "./classCancel";

const person = (over: Partial<CancelPerson>): CancelPerson => ({
  booking_id: "b", profile_id: "p", name: "Ana Diaz", first_name: "Ana", email: "ana@example.com",
  status: "confirmed", source: "pack", refund_cents: 0, ...over,
});

describe("summarizeCancellation", () => {
  it("counts each consequence once", () => {
    const s = summarizeCancellation([
      person({ source: "pack" }),
      person({ source: "pack", email: null }),
      person({ source: "membership" }),
      person({ source: "drop_in", refund_cents: 2200 }),
      person({ source: "free" }),
      person({ source: "waitlist", status: "waitlisted" }),
    ]);
    expect(s).toEqual({
      booked: 5, waitlisted: 1, packReturns: 2, membershipReturns: 1,
      dropInRefunds: 1, refundCents: 2200, free: 1, currency: "USD", reachable: 5,
    });
  });
});

describe("describeCancellation", () => {
  it("says plainly when nobody is booked", () => {
    expect(describeCancellation(summarizeCancellation([]))).toEqual([
      "Nobody is booked. The class just comes off the schedule.",
    ]);
  });

  it("uses the right number words", () => {
    const one = describeCancellation(summarizeCancellation([person({ source: "pack" })]));
    expect(one).toContain("1 person is booked.");
    expect(one).toContain("1 class goes back on class packs.");
    expect(one).toContain("Everyone is told by email.");
    const many = describeCancellation(summarizeCancellation([
      person({ source: "drop_in", refund_cents: 2000 }), person({ source: "drop_in", refund_cents: 2500, email: null }),
    ]));
    expect(many).toContain("2 people are booked.");
    expect(many).toContain("2 drop-ins refunded in full: $45.00.");
    expect(many).toContain("Everyone with an email on file is told (1 of 2).");
  });
});

describe("classCancelledEmail", () => {
  const base = { className: "Vinyasa Flow", studioName: "Oxatl Yoga", when: "Tue, Oct 14, 6:00 PM", scheduleUrl: "https://tandavastudio.com/s/oxatl" };

  it("tells a drop-in what comes back and when", () => {
    const m = classCancelledEmail({ ...base, person: person({ source: "drop_in", refund_cents: 2200 }) });
    expect(m.subject).toBe("Cancelled: Vinyasa Flow, Tue, Oct 14, 6:00 PM");
    expect(m.text).toContain("Your $22.00 is being refunded");
    expect(m.text).toContain("Hi Ana,");
  });

  it("never promises a refund that did not go through", () => {
    const m = classCancelledEmail({ ...base, person: person({ source: "drop_in", refund_cents: 2200, refund_status: "failed" }) });
    expect(m.text).not.toContain("is being refunded to your card");
    expect(m.text).toContain("The studio is arranging your $22.00 refund");
  });

  it("shows the payment's currency", () => {
    const m = classCancelledEmail({ ...base, person: person({ source: "drop_in", refund_cents: 1800, currency: "eur" }) });
    expect(m.text).toContain("€18.00");
    const s = summarizeCancellation([person({ source: "drop_in", refund_cents: 1800, currency: "gbp" })]);
    expect(describeCancellation(s)).toContain("1 drop-in refunded in full: £18.00.");
  });

  it("escapes the studio's note and names", () => {
    const m = classCancelledEmail({
      ...base, studioName: "Om <b>&</b>", message: "<script>alert(1)</script> Sorry!",
      person: person({ first_name: "<img>" }),
    });
    expect(m.html).not.toContain("<script>");
    expect(m.html).not.toContain("<img>");
    expect(m.html).toContain("&lt;script&gt;");
    expect(m.html).toContain("Om &lt;b&gt;&amp;&lt;/b&gt;");
  });

  it("works without a name or note", () => {
    const m = classCancelledEmail({ ...base, person: person({ first_name: null, source: "waitlist" }) });
    expect(m.text.startsWith("Hi,")).toBe(true);
    expect(m.text).not.toContain("A note from");
    expect(m.text).toContain("nothing was charged");
  });
});
