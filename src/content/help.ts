/**
 * One source for help text: the landing-page FAQ, in-app info icons (HelpTip),
 * settings help panels and docs/FAQ.md all draw from here, so an answer is
 * never different in two places.
 *
 * Rules (docs/HELP-AND-FAQ.md):
 *   - Every entry is true today. "Planned" says planned. No feature is
 *     described as live until it is verified against a real database.
 *   - Plain words, one idea per answer, no marketing adjectives.
 *   - `audience` decides where an entry surfaces: owners see owner entries
 *     before sign-up and in /manage; members see member entries on booking
 *     pages and in the member app.
 */

export type HelpAudience = "owner" | "member" | "teacher";

export interface HelpEntry {
  id: string;
  audience: HelpAudience[];
  question: string;
  /** One or two short paragraphs. Plain text; line breaks allowed. */
  answer: string;
  /** Shown when the feature is designed but not yet live. */
  status?: "planned";
  /** Where to read more (docs path or route). */
  learnMore?: string;
}

export const HELP: HelpEntry[] = [
  // --- Booking -------------------------------------------------------------
  {
    id: "express-booking",
    audience: ["owner", "member"],
    question: "Can someone book a class without creating an account?",
    answer:
      "Yes, when the studio turns on instant booking. A first-time visitor books a single drop-in or free class with their name and email, pays on the next screen if the class has a price, and is done. Memberships and class packs still need an account, because recurring billing against an unverified email is a different risk.\nStudios turn this on per studio. It is off until they do.",
    learnMore: "docs/prd/PRD-020-express-booking.md",
  },
  {
    id: "save-your-details",
    audience: ["member"],
    question: "What does \"Save my details for next time\" do?",
    answer:
      "After you book, we email a link to set a password on the same email. Open it and your bookings stay with your account, next time is one tap, and you can buy a class pack or membership. Nothing changes if you ignore the email.",
  },
  {
    id: "existing-account-booking",
    audience: ["member"],
    question: "Why did it ask me to sign in instead of booking?",
    answer:
      "The email you typed already has an account. Anyone can type anyone's email into a public form, so we never book into an existing account without you proving it is yours. Signing in is the fastest way through, and it lets your membership or pack apply.",
  },
  // --- Time zones and calendar --------------------------------------------
  {
    id: "class-time-zone",
    audience: ["member", "owner"],
    question: "Which time zone are class times shown in?",
    answer:
      "The studio's, always, with the zone named in words: \"6:00 AM Hawaii time\". If your phone is in a different zone, a second line shows your local time, and names the day when it differs. On-demand videos have no clock.",
  },
  {
    id: "add-to-calendar",
    audience: ["member"],
    question: "Does \"Add to calendar\" work on iPhone and Android?",
    answer:
      "Yes. On iPhone the first button opens Apple Calendar; on Android it opens Google Calendar (Chrome on Android downloads calendar files instead of adding them, so the Google link is more reliable there). Outlook and a plain calendar file are always available. The event carries the studio's address, the teacher, the cancellation deadline in studio time, and a reminder one hour before.",
  },
  // --- Studios, network, discovery ------------------------------------------
  {
    id: "studio-network-vs-classpass",
    audience: ["owner"],
    status: "planned",
    question: "Is the Studio Network the same as ClassPass?",
    answer:
      "No. ClassPass is a marketplace that lists your classes on its terms: its payout, its caps, its members. The Studio Network is Tandava's own, between studios on Tandava, and you set the terms: which classes, how many seats, from when, the lowest price, and who is excluded. The visitor becomes your member record, and converting them to a membership costs you nothing.\nYou can use both. The Network is off until you turn it on.",
    learnMore: "docs/prd/PRD-023-studio-network.md",
  },
  {
    id: "studio-network-cannibalisation",
    audience: ["owner"],
    status: "planned",
    question: "Will my members use the Network instead of paying me?",
    answer:
      "They can't. Anyone who bought from you in the last 90 days (you can change the window) is excluded from using Network credits at your studio. Seats are also only released inside a window before class and only if still unsold, so you never give away a seat that would have sold.",
  },
  {
    id: "explore-on-studio-page",
    audience: ["owner"],
    question: "Will my booking page show other studios?",
    answer:
      "No. Your page, your embedded schedule, your booking form, confirmations and emails show only your studio. Members reach the rest of Tandava through the app's own menu, never through anything on your page.",
    learnMore: "docs/prd/PRD-022-home-studio-time-zones-calendar.md",
  },
  // --- Privates and events --------------------------------------------------
  {
    id: "privates-requests",
    audience: ["owner", "member", "teacher"],
    status: "planned",
    question: "How do private sessions get booked?",
    answer:
      "Two ways. If a teacher publishes available times, a student picks one and books. Otherwise the student sends a request with up to three preferred times; the teacher accepts one, proposes other times, or hands it to the studio. There is no decline button: every request ends in a booking, a proposal or a person. The card is only charged when a time is accepted.",
    learnMore: "docs/prd/PRD-021-privates-and-appointments.md",
  },
  {
    id: "offsite-and-events",
    audience: ["owner"],
    status: "planned",
    question: "Can a teacher go to a client's home, or can I host a corporate class or a party?",
    answer:
      "Planned. Privates get a place (your room, the client's address, online) with a travel fee and travel time on the teacher's calendar, and off-site work is always request-based and opt-in per teacher. Group bookings (corporate classes, parties, room rentals) are quoted from your price list, take a deposit, give every attendee a link to sign the waiver, and can be invoiced to a company.",
    learnMore: "docs/prd/PRD-025-offsite-privates-and-private-events.md",
  },
  // --- Attribution and privacy ----------------------------------------------
  {
    id: "attribution",
    audience: ["owner"],
    status: "planned",
    question: "Can I see which post, link or ad brought me a paying member?",
    answer:
      "That is the goal: one view from the first click to the purchase, by source, campaign and landing page, for your booking page, your embedded schedule, your landing pages, your emails and the app. Today only instant bookings record the campaign tags on the link; the full view is being built and is a condition of the hosted pilot.",
    learnMore: "docs/prd/PRD-024-attribution-everywhere.md",
  },
  {
    id: "tracking-privacy",
    audience: ["member", "owner"],
    question: "What does Tandava track about students?",
    answer:
      "First-party only: which page, where the link came from, campaign tags, and the kind of device. No advertising pixels unless a studio adds one knowingly, no IP addresses stored, no fingerprinting. A studio sees that someone came from its own Instagram link, which is what a front desk would notice anyway.",
  },
];

export function helpById(id: string): HelpEntry | undefined {
  return HELP.find((h) => h.id === id);
}

export function helpFor(audience: HelpAudience, ids?: string[]): HelpEntry[] {
  const pool = ids ? ids.map(helpById).filter((h): h is HelpEntry => Boolean(h)) : HELP;
  return pool.filter((h) => h.audience.includes(audience));
}
