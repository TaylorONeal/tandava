import { describe, expect, it } from "vitest";
import {
  classCancelledEmail, describeCancellation, describeFollowup, refundSentEmail, summarizeCancellation,
  type CancelFollowup, type CancelPerson,
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

describe("describeFollowup", () => {
  const base = (over: Partial<CancelFollowup>): CancelFollowup => ({
    occurrence_id: "o", starts_at: "2026-10-20T18:00:00Z", class_name: "Flow", cancelled: true,
    people: [], refunds_sent: 0, refunds_sent_cents: 0, refunds_outstanding: 0,
    emails_sent: 0, emails_outstanding: 0, emails_failed: 0, emails_uncertain: 0, refund_updates_owed: 0, ...over,
  });

  it("reports a clean finish with nothing to retry", () => {
    const r = describeFollowup(base({
      people: [person({ source: "pack", notice_status: "sent" }), person({ source: "drop_in", refund_cents: 2200, refund_status: "sent", notice_status: "sent" })],
      refunds_sent: 1, refunds_sent_cents: 2200, emails_sent: 2,
    }));
    expect(r.done).toEqual(["1 class returned to packs and memberships.", "$22.00 refunded to 1 card.", "2 emails sent."]);
    expect(r.problems).toEqual([]);
    expect(r.canRetry).toBe(false);
  });

  it("names who was not emailed and offers a retry for refunds and emails", () => {
    const r = describeFollowup(base({
      people: [
        person({ name: "Ana Diaz", notice_status: "failed" }),
        person({ name: "Ben Ito", notice_status: "pending" }),
        person({ name: "Cy Moss", email: null, notice_status: "no_email" }),
      ],
      refunds_outstanding: 1, emails_outstanding: 2, emails_failed: 1,
    }));
    expect(r.problems).toEqual([
      "1 refund did not go through yet. Until it does, those students are told you are arranging it. Try again, or refund them from Stripe.",
      "1 email did not go out (Ana Diaz). Try again, or contact them directly and mark it handled.",
      "1 person has not been emailed yet.",
      "No email on file for Cy Moss. Contact them directly.",
    ]);
    expect(r.canRetry).toBe(true);
  });

  it("does not offer an email retry when email is not set up", () => {
    const r = describeFollowup(base({ people: [person({ notice_status: "pending" })], emails_outstanding: 1 }), true);
    expect(r.problems).toEqual(["Email is not set up for this studio yet, so 1 person was not emailed. Please let them know, then mark it handled."]);
    expect(r.canRetry).toBe(false);
    expect(r.canMarkHandled).toBe(true);
  });

  it("never offers to resend an email that may already have gone out", () => {
    const r = describeFollowup(base({
      people: [person({ name: "Ana Diaz", notice_status: "sending" })], emails_outstanding: 1, emails_uncertain: 1,
    }));
    expect(r.problems).toEqual(["1 email may not have gone out (Ana Diaz). Check with them, then mark it handled."]);
    expect(r.canRetry).toBe(false);
    expect(r.canMarkHandled).toBe(true);
  });
});

describe("refund updates", () => {
  it("offers to tell students their refund went through", () => {
    const r = describeFollowup({
      occurrence_id: "o", starts_at: "x", class_name: "Flow", cancelled: true, people: [],
      refunds_sent: 1, refunds_sent_cents: 2200, refunds_outstanding: 0,
      emails_sent: 1, emails_outstanding: 0, emails_failed: 0, emails_uncertain: 0, refund_updates_owed: 1,
    });
    expect(r.problems).toEqual(["1 student has not been told their refund went through."]);
    expect(r.canRetry).toBe(true);
  });

  it("confirms the amount and escapes the studio's words", () => {
    const e = refundSentEmail({
      person: person({ source: "drop_in", refund_cents: 2200, currency: "eur", first_name: "Ana" }),
      className: "Flow <3", studioName: "Oxatl Yoga", when: "Tue, Oct 20, 6:00 PM", scheduleUrl: "https://x.test/s/oxatl",
    });
    expect(e.subject).toBe("Refund sent: Flow <3, Tue, Oct 20, 6:00 PM");
    expect(e.text).toContain("Your €22.00 refund for Flow <3");
    expect(e.html).toContain("Flow &lt;3");
    expect(e.html).not.toContain("Flow <3");
  });
});
