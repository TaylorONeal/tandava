/**
 * Terms, privacy and refund policy for the hosted service (LP-9).
 *
 * One source for the three /terms, /privacy and /refunds pages. Plain
 * language on purpose. These cover hosted Tandava (tandavastudio.com); the
 * open-source code has its own license and self-hosters write their own.
 *
 * Changing a policy: edit here, bump LEGAL_UPDATED, and say what changed in
 * the PR. Material changes to Terms or Privacy are emailed to account holders.
 */

export const LEGAL_UPDATED = "October 10, 2026";

/**
 * These policies are the hosted service's: Purafield Studio runs
 * tandavastudio.com. They are published only there (or in a build that sets
 * VITE_LEGAL_HOSTED=true, such as the e2e run). A self-hosted deployment
 * names other providers and another operator, so it gets no policy pages,
 * no footer links and no consent checkbox; it writes its own (see
 * docs/DEPLOYMENT.md) instead of inheriting ours.
 */
export interface LegalIdentity { operator: string; contact: string; site: string }
export const HOSTED_IDENTITY: LegalIdentity = {
  operator: "Purafield Studio", contact: "hello@purafieldstudio.com", site: "tandavastudio.com",
};

export function resolveLegalIdentity(
  env: { VITE_LEGAL_HOSTED?: string },
  hostname: string | undefined,
): LegalIdentity | null {
  if (env.VITE_LEGAL_HOSTED?.trim() === "true") return HOSTED_IDENTITY;
  if (hostname && /(^|\.)tandavastudio\.com$/i.test(hostname)) return HOSTED_IDENTITY;
  return null;
}

export const LEGAL_IDENTITY = resolveLegalIdentity(
  import.meta.env as Record<string, string | undefined>,
  typeof location !== "undefined" ? location.hostname : undefined,
);
/** True where this deployment publishes the policies (and asks people to agree to them). */
export const LEGAL_PUBLISHED = LEGAL_IDENTITY !== null;
const identity = HOSTED_IDENTITY;
export const LEGAL_OPERATOR = identity.operator;
export const LEGAL_CONTACT = identity.contact;

export interface LegalSection {
  heading: string;
  /** Paragraphs. A paragraph that starts with "- " lines is rendered as a list. */
  body: string[];
}

export interface LegalDoc {
  slug: "terms" | "privacy" | "refunds";
  title: string;
  summary: string;
  sections: LegalSection[];
}

const contact = `Questions: email ${LEGAL_CONTACT}.`;

export const TERMS: LegalDoc = {
  slug: "terms",
  title: "Terms of Service",
  summary:
    "The rules for using Tandava to find and book classes, and for studios that run their business on it.",
  sections: [
    {
      heading: "Who we are",
      body: [
        `Tandava (tandavastudio.com) is run by ${LEGAL_OPERATOR} ("we", "us"). It lets people find and book classes at independent studios, and lets studios manage their schedule, members and payments. By creating an account or booking a class you agree to these terms.`,
      ],
    },
    {
      heading: "Studios run their own classes",
      body: [
        "Each studio is an independent business. The studio sets its classes, teachers, prices, cancellation window, waiver and studio rules, and is responsible for the class itself, including safety and instruction. We provide the software and process payments on the studio's behalf. We are not a party to what happens in class.",
        "Physical activity carries risk. Talk to a doctor if you are unsure whether a class is right for you, and follow the studio's waiver and instructions.",
      ],
    },
    {
      heading: "Your account",
      body: [
        "Use your real name and an email you can receive. Keep your password private. You are responsible for bookings and purchases made with your account. You must be at least 13 to have an account, and under 18 only with a parent or guardian's permission.",
      ],
    },
    {
      heading: "Bookings and payments",
      body: [
        "When you book, you reserve a spot under the studio's rules. Prices are shown before you pay and charged in the studio's currency. Card payments are processed by Stripe; we never see or store your full card number.",
        "Memberships renew automatically each billing period until you cancel. You can cancel any time from your account, and the membership stays active until the end of the period you paid for.",
        "Cancellations, late cancels, no-shows and refunds follow the studio's policy. See the Refund Policy for the defaults and how to ask for a refund.",
      ],
    },
    {
      heading: "For studios",
      body: [
        "A studio account holder confirms they are authorized to act for the studio. Studios connect their own Stripe account to get paid and agree to Stripe's terms. We may charge a platform fee on payments. We will email the studio account holder the fee and its start date at least 30 days before any fee applies. Studios are responsible for the accuracy of their listings and prices, for honoring bookings and their own refund policy, for their waivers and insurance, and for how they use their members' information (see the Privacy Policy).",
      ],
    },
    {
      heading: "Acceptable use",
      body: [
        "Do not misuse Tandava. That includes booking spots you do not intend to use to block others, using someone else's account or payment method, scraping or overloading the service, trying to get around security or access controls, posting unlawful or misleading content, and sending messages to people who did not agree to receive them.",
      ],
    },
    {
      heading: "Open source",
      body: [
        "The Tandava software is open source and its code is published under its own license. These terms cover the hosted service at tandavastudio.com, not copies of the code that others run.",
      ],
    },
    {
      heading: "Changes and ending your account",
      body: [
        "We may change the service or these terms. If a change matters, we will tell account holders by email before it takes effect. You can stop using Tandava and ask us to close your account any time. We may suspend accounts that break these terms or put others at risk.",
      ],
    },
    {
      heading: "Disclaimers and liability",
      body: [
        "Tandava is provided as is. We work to keep it available and correct, but we do not promise it will always be uninterrupted or error-free. To the extent the law allows, we are not liable for indirect or consequential losses, or for what happens at a studio or in a class, and our total liability to you is limited to the amount you paid through Tandava in the 12 months before the claim. Nothing here limits rights you have under consumer law that cannot be limited.",
      ],
    },
    {
      heading: "Law",
      body: [
        "These terms are governed by the laws of the State of Texas, USA, except where your local consumer law says otherwise.",
        contact,
      ],
    },
  ],
};

export const PRIVACY: LegalDoc = {
  slug: "privacy",
  title: "Privacy Policy",
  summary: "What we collect, why, who sees it, and how to get a copy or have it deleted.",
  sections: [
    {
      heading: "What we collect",
      body: [
        "- Account details you give us: name, email, and optionally phone, pronouns, date of birth, emergency contact and Instagram handle.\n- Bookings, check-ins, memberships, class packs and purchase records.\n- Payment details are handled by Stripe. We receive the payment result, never your card number.\n- How you found a studio page: the page you landed on, the referring site, campaign tags in the link, and device type. A random visitor ID is kept in your browser to connect visits. We store a salted hash of your IP address for abuse limits, never the address itself.\n- If product analytics is on, the steps you take in sign-up and checkout (for example \"checkout started\"), tied to that random ID.\n- If error monitoring is on: errors, page performance, and for a small share of visits and for visits where an error happens, a replay of what was on screen (typed form fields are hidden). These are linked to your account ID and email so we can fix problems you hit.",
      ],
    },
    {
      heading: "Why we use it",
      body: [
        "To run your account and bookings, take payments, send receipts and class messages, keep the service secure, and understand which pages bring people to a studio so studios can see what works. We do not sell your personal information and we do not use it for third-party advertising.",
      ],
    },
    {
      heading: "What studios see",
      body: [
        "When you book with or buy from a studio, that studio sees your name, contact details, bookings, attendance and purchases with them, and how you found their page. Each studio decides how it uses its members' information and is responsible for that use. Studios do not see your activity at other studios.",
      ],
    },
    {
      heading: "Emails",
      body: [
        "We send messages you need: receipts, booking confirmations, password resets. Marketing emails from a studio are sent only if you opted in to that studio, and every one has an unsubscribe link.",
      ],
    },
    {
      heading: "Service providers",
      body: [
        "We use providers to run Tandava, and they process data only for that purpose: Supabase (database and sign-in), Google or Apple (only if you choose to sign in with them; they share your name and email with us), Stripe (payments), Vercel (website hosting), Resend (email), Cloudflare Turnstile (bot checks on sign-in), PostHog (product analytics, only when enabled) and Sentry (error monitoring, only when enabled). Your data may be processed in the United States.",
      ],
    },
    {
      heading: "Keeping and deleting data",
      body: [
        "We keep your data while your account is open. If you booked as a guest without creating an account, we keep your booking details so the studio has its records, until you ask us to delete them. Ask us to delete your account or guest details and we will delete or anonymize your personal information within 30 days, except records we must keep by law, such as payment and tax records.",
        `To get a copy of your data, correct it, or delete it, email ${LEGAL_CONTACT} from the email on your account. You can update most details yourself on your Account page.`,
      ],
    },
    {
      heading: "Children",
      body: ["Tandava is not directed at children under 13 and we do not knowingly collect their information."],
    },
    {
      heading: "Security and changes",
      body: [
        "Data is encrypted in transit, and access is limited by account and by studio. If we change this policy in a way that matters, we will email account holders before it takes effect.",
        contact,
      ],
    },
  ],
};

export const REFUNDS: LegalDoc = {
  slug: "refunds",
  title: "Refund Policy",
  summary:
    "Each studio sets its own policy. These defaults apply when a studio's page does not say otherwise.",
  sections: [
    {
      heading: "Cancelling a class",
      body: [
        `Cancel from My Schedule (or, if you booked without an account, email ${LEGAL_CONTACT} from the email you booked with) before the studio's cancellation window (shown on the booking page before you book; 2 hours if the studio has not set one). On time, a class from a pack or membership is returned to you, and a paid drop-in can be refunded on request. Inside the window, or if you do not show up, the class is used and the studio may charge its late-cancel or no-show fee.`,
      ],
    },
    {
      heading: "When the studio cancels",
      body: [
        `If the studio cancels a class you booked, you get the class back on your pack or membership, or a full refund for a paid drop-in. Email ${LEGAL_CONTACT} with the class and date if it has not come back within 2 business days.`,
      ],
    },
    {
      heading: "Class packs",
      body: [
        "Packs expire on the date shown at purchase. Unused packs can be refunded within 14 days of purchase if no class from the pack has been used. After that, or once a class has been used, packs are not refundable unless the studio says otherwise.",
      ],
    },
    {
      heading: "Memberships",
      body: [
        "Cancel any time from your Account page. You keep access until the end of the period you paid for; we do not refund partial periods unless the law requires it.",
      ],
    },
    {
      heading: "Charged twice, or charged for a full class",
      body: [
        `If you were charged twice, or paid for a spot that was no longer available, you get a full refund. Email ${LEGAL_CONTACT} with the date and the email on your account and we will refund it.`,
      ],
    },
    {
      heading: "How to ask for a refund",
      body: [
        `Email ${LEGAL_CONTACT} with the studio name, the class or purchase, the date and the email on your account. We work it out with the studio and reply within 2 business days. If you already know the studio's contact details, you can also ask them directly. Refunds go back to the original payment method and usually arrive in 5 to 10 business days.`,
      ],
    },
  ],
};

export const LEGAL_DOCS = { terms: TERMS, privacy: PRIVACY, refunds: REFUNDS } as const;

const ALL_LEGAL_LINKS = [
  { to: "/terms", label: "Terms" },
  { to: "/privacy", label: "Privacy" },
  { to: "/refunds", label: "Refunds" },
] as const;

/** Footer links: only where this deployment has published policies. */
export const LEGAL_LINKS: readonly (typeof ALL_LEGAL_LINKS)[number][] = LEGAL_PUBLISHED ? ALL_LEGAL_LINKS : [];
export { ALL_LEGAL_LINKS };
