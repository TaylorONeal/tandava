/**
 * Studio cancels a class (LP-1d): the rules both the owner's screen and the
 * cancel-class edge function use. Plain TypeScript with no imports, so the
 * edge function can import it directly (as express-book does with express.ts).
 *
 * The database decides what happens (cancel_class, migration 00043); this
 * module only describes it: the owner's summary before and after, and the
 * email each affected person gets.
 */

export type CancelSource = "pack" | "membership" | "drop_in" | "free" | "waitlist";

export interface CancelPerson {
  booking_id: string;
  profile_id: string;
  name: string | null;
  first_name: string | null;
  email: string | null;
  status: string;
  source: CancelSource;
  refund_cents: number;
  /** Currency of the payment (or the studio), ISO code. */
  currency?: string | null;
  /** Set after the refund was attempted: "failed" means it did not go through yet. */
  refund_status?: "sent" | "failed" | null;
}

export interface CancelSummary {
  booked: number;
  waitlisted: number;
  packReturns: number;
  membershipReturns: number;
  dropInRefunds: number;
  refundCents: number;
  free: number;
  /** Currency of the refunds (a studio charges in one currency). */
  currency: string;
  /** People with an email address we can tell. */
  reachable: number;
}

export function summarizeCancellation(people: CancelPerson[]): CancelSummary {
  const s: CancelSummary = {
    booked: 0, waitlisted: 0, packReturns: 0, membershipReturns: 0,
    dropInRefunds: 0, refundCents: 0, free: 0, currency: "USD", reachable: 0,
  };
  for (const p of people) {
    if (p.email) s.reachable += 1;
    if (p.source === "waitlist") { s.waitlisted += 1; continue; }
    s.booked += 1;
    if (p.source === "pack") s.packReturns += 1;
    else if (p.source === "membership") s.membershipReturns += 1;
    else if (p.source === "drop_in") {
      s.dropInRefunds += 1;
      s.refundCents += Math.max(0, p.refund_cents);
      if (p.currency) s.currency = p.currency.toUpperCase();
    }
    else s.free += 1;
  }
  return s;
}

export function formatMoney(cents: number, currency?: string | null): string {
  const code = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${code}`;
  }
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * One line per consequence, in the order an owner cares about: who loses a
 * class, what comes back, what money goes out. Empty classes say so.
 */
export function describeCancellation(s: CancelSummary): string[] {
  if (s.booked === 0 && s.waitlisted === 0) return ["Nobody is booked. The class just comes off the schedule."];
  const lines: string[] = [];
  if (s.booked) lines.push(`${plural(s.booked, "person is", "people are")} booked.`);
  if (s.packReturns) lines.push(`${plural(s.packReturns, "class goes", "classes go")} back on class packs.`);
  if (s.membershipReturns) lines.push(`${plural(s.membershipReturns, "membership class goes", "membership classes go")} back for this period.`);
  if (s.dropInRefunds) lines.push(`${plural(s.dropInRefunds, "drop-in")} refunded in full: ${formatMoney(s.refundCents, s.currency)}.`);
  if (s.free) lines.push(`${plural(s.free, "free booking")} cancelled.`);
  if (s.waitlisted) lines.push(`${plural(s.waitlisted, "person", "people")} on the waitlist removed.`);
  const unreachable = s.booked + s.waitlisted - s.reachable;
  lines.push(unreachable > 0
    ? `Everyone with an email on file is told (${s.reachable} of ${s.booked + s.waitlisted}).`
    : "Everyone is told by email.");
  return lines;
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** What happens to this person's payment, in their words. */
export function personOutcome(p: CancelPerson): string {
  switch (p.source) {
    case "pack": return "The class is back on your class pack.";
    case "membership": return "The class is back on your membership for this period.";
    case "drop_in":
      return p.refund_status === "failed"
        ? `The studio is arranging your ${formatMoney(p.refund_cents, p.currency)} refund and will confirm when it is sent.`
        : `Your ${formatMoney(p.refund_cents, p.currency)} is being refunded to your card. It usually shows in 5 to 10 business days.`;
    case "waitlist": return "You were on the waitlist, so nothing was charged.";
    default: return "Nothing was charged.";
  }
}

export interface CancelEmailInput {
  person: CancelPerson;
  className: string;
  studioName: string;
  /** Already formatted in the studio's time zone, e.g. "Tue, Oct 14, 6:00 PM". */
  when: string;
  /** Optional note from the studio. */
  message?: string | null;
  scheduleUrl: string;
}

export function classCancelledEmail(input: CancelEmailInput): { subject: string; html: string; text: string } {
  const { person, className, studioName, when, scheduleUrl } = input;
  const hi = person.first_name?.trim() ? `Hi ${person.first_name.trim()},` : "Hi,";
  const note = input.message?.trim() ? input.message.trim().slice(0, 1000) : "";
  const outcome = personOutcome(person);
  const subject = `Cancelled: ${className}, ${when}`;
  const text = [
    hi, "",
    `${studioName} has cancelled ${className} on ${when}.`,
    ...(note ? ["", `A note from ${studioName}: ${note}`] : []),
    "", outcome, "",
    `Find another class: ${scheduleUrl}`,
  ].join("\n");
  const e = escapeHtml;
  const html = `<p>${e(hi)}</p>
<p><strong>${e(studioName)}</strong> has cancelled <strong>${e(className)}</strong> on ${e(when)}.</p>
${note ? `<p style="border-left:3px solid #4fd1c5;padding-left:12px;">A note from ${e(studioName)}: ${e(note)}</p>` : ""}
<p>${e(outcome)}</p>
<p><a href="${e(scheduleUrl)}">Find another class</a></p>`;
  return { subject, html, text };
}
