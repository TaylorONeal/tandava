/**
 * Copy for the hosted studio-owner pages: the home page (/ and /for-studios)
 * and the search landing pages. One source for three readers:
 *   - the React pages (src/pages/ForStudios.tsx, src/pages/marketing/LandingPage.tsx)
 *   - the static HTML that scripts/prerender-pages.ts writes for crawlers
 *   - llms.txt, written by the same script
 *
 * Rules (docs/plans/AUDIENCES_AND_COPY.md):
 *   - Every claim is true of the hosted product today. The app is "coming
 *     soon" until STUDIO_APP_LIVE flips, and the copy reads that flag.
 *   - No price until decision D1. Pilot wording stays.
 *   - Open source is a trust line below the fold here; /open-source owns it.
 *   - Plain words. No hype, no dashes as punctuation.
 */
import { STUDIO_APP, STUDIO_APP_LIVE, studioAppAvailability } from "../../config/studioApp";

export interface MarketingSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Ordered steps, rendered as a numbered list. */
  steps?: { title: string; body: string }[];
}

export interface MarketingFaq {
  q: string;
  a: string;
}

export interface MarketingPage {
  route: string;
  /** <title> before " | Tandava". Aim for under 60 characters in total. */
  title: string;
  /** Meta description. Aim for 120 to 158 characters. */
  description: string;
  eyebrow: string;
  h1: string;
  intro: string[];
  sections: MarketingSection[];
  faq: MarketingFaq[];
  /** Internal links at the foot of the page. */
  related: { to: string; label: string }[];
  ogImage: string;
  /** True for the page about the iPhone app itself. */
  isAppPage?: boolean;
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** "coming soon to the App Store" or "on the App Store for iPhone". */
export function appStatusPhrase(live: boolean = STUDIO_APP_LIVE): string {
  return lower(studioAppAvailability(live));
}

/** What the iPhone app does. Only what Tandava Studio 1.0 does (PR 113 scope). */
export const STUDIO_APP_FEATURES = [
  "Scan a member's check-in pass with the camera. A green card and a short buzz confirm it.",
  "Check people in from the class roster when they don't have their pass.",
  "See today's classes, and the next two weeks of what you teach.",
  "Move a weekly class or change a price without opening a laptop.",
  "Share your booking link from the iPhone share sheet.",
];

/** What owners run on the web. Each line is live on the hosted product. */
export const WEB_FEATURES = [
  "Class schedule, rooms and teachers",
  "Drop-ins, class packs and memberships",
  "Online booking, waitlists and cancellations",
  "A booking page you can share, and a schedule you can embed on your own site",
  "Front desk check-in, including a kiosk screen",
  "Student records and attendance",
  "Revenue and attendance reports",
  "Workshops and events",
];

/**
 * Owner questions on the home page (src/content/help.ts ids, in order). Only things that work today: planned
 * features stay on /help, where they are labelled, so a first visit isn't a
 * roadmap.
 */
export const HOME_FAQ_IDS = [
  "where-to-sign-up",
  "need-to-host",
  "express-booking",
  "explore-on-studio-page",
  "class-time-zone",
  "tracking-privacy",
];

// ---------------------------------------------------------------------------
// Home (/ and /for-studios)
// ---------------------------------------------------------------------------

export function homeContent(live: boolean = STUDIO_APP_LIVE) {
  return {
    route: "/",
    title: "Studio software for yoga and pilates studios",
    description: live
      ? "Set up your yoga, pilates or barre studio on the web: schedule, packs, memberships and booking. Staff check members in with the Tandava Studio iPhone app."
      : "Set up your yoga, pilates or barre studio on the web: schedule, packs, memberships and booking. A staff check-in app for iPhone is coming soon.",
    eyebrow: "For yoga, pilates and movement studios",
    h1: "Set up your studio on the web. Check people in from your phone.",
    intro: `Tandava runs your class schedule, class packs, memberships and online booking. You set it up here, in your browser. Your front desk and teachers check members in at the door with ${STUDIO_APP.name}, our iPhone app, ${appStatusPhrase(live)}.`,
    finePrint: "No card needed to set up. Pricing is agreed with you before you take a single payment.",
    steps: [
      {
        title: "Create your studio on the web",
        body: "Sign up with your email, then add your name, location, teachers and class types. The setup wizard saves as you go, so you can stop and pick it up later.",
      },
      {
        title: "Publish your schedule",
        body: "You get a booking page to share and a schedule to embed on your own website. Students pay by card when they book. You add your bank details once, in a short form run by our payments partner Stripe.",
      },
      {
        title: "Invite your staff",
        body: `Add your teachers and front desk by email during setup. They sign in to ${STUDIO_APP.name} with that email and check people in at the door.`,
      },
    ],
    webCard: {
      heading: "On the web, for owners",
      body: "Everything about running the studio lives here. This is also where a studio is created: the app has no sign-up.",
    },
    appCard: {
      heading: `In the app, for the door`,
      body: `${STUDIO_APP.name} for iPhone is for owners, front desk staff and teachers. Staff sign in with the account their studio invited.`,
    },
    pilot: {
      heading: "We are starting with a few studios",
      body: "Tandava is new. We are onboarding our first studios in Austin and working with each owner directly, so when something is rough you talk to the person who can fix it. Pricing is agreed with you before you take a single payment.",
    },
    openSource: {
      heading: "Open source, if you ever want it",
      body: "Tandava's code is public under the AGPL-3.0 license. You don't need to care about that to use it: the hosted version is the same code, run for you. It does mean you can read exactly how your data is stored. If you have a developer and would rather run your own copy, start here.",
      linkLabel: "Self-hosting and the code",
    },
    guides: [
      { to: "/studio-app", label: `${STUDIO_APP.name}, the check-in app` },
      { to: "/yoga-studio-software", label: "Yoga studio software for small studios" },
      { to: "/class-booking-software", label: "Online class booking" },
      { to: "/tools/studio-calculator", label: "Free studio profitability calculator" },
    ],
  };
}

// ---------------------------------------------------------------------------
// Search landing pages
// ---------------------------------------------------------------------------

export function landingPages(live: boolean = STUDIO_APP_LIVE): MarketingPage[] {
  const status = appStatusPhrase(live);
  return [
    {
      route: "/studio-app",
      isAppPage: true,
      title: "Tandava Studio: check-in app for yoga studios",
      description: live
        ? "Scan members in at the door with your iPhone camera, check in from the roster and run today's classes. Free for studios on Tandava."
        : "Scan members in at the door with your iPhone camera, check in from the roster and run today's classes. Coming soon to the App Store.",
      eyebrow: `${STUDIO_APP.name} for iPhone`,
      h1: "Check members in at the door with your phone.",
      intro: [
        `${STUDIO_APP.name} is the staff app for studios that run on Tandava. Point the camera at a member's check-in pass and they're in. No pass? Tap their name on the roster.`,
        `It's free, it's for iPhone, and it's ${status}.`,
      ],
      sections: [
        { heading: "What it does", bullets: STUDIO_APP_FEATURES },
        {
          heading: "How your team gets it",
          steps: [
            { title: "Set up your studio on the web", body: "Studios are created at tandavastudio.com, not in the app." },
            { title: "Invite your staff by email", body: "Teachers and front desk staff get an email invitation to join your studio." },
            { title: "They install the app and sign in", body: "Same email, same password. Owners use it too." },
          ],
        },
        {
          heading: "Where members get their pass",
          paragraphs: [
            `${live ? "Members" : "When the app launches, members"} open My Schedule on the web and tap Check-in pass for the class they booked. Check-in opens 60 minutes before class starts. Scanning the same pass twice changes nothing, so a double scan at a busy door is harmless.`,
          ],
        },
        {
          heading: "Your camera, your phone",
          paragraphs: [
            "The camera is used only to read the pass, on the phone. No photos or video are stored or sent. The app shows a banner when you're offline, because a check-in needs a connection to save.",
          ],
        },
      ],
      faq: [
        {
          q: "Can I create my studio in the app?",
          a: "No. You create your studio on the web, then invite your staff by email. The app is for signing in and running the door.",
        },
        {
          q: "Is there an Android version?",
          a: "Not yet. Tandava Studio is iPhone only for now. On any other device, staff can check people in from the class roster in a web browser.",
        },
        {
          q: "Do members need the app?",
          a: live
            ? "No. Members book and get their check-in pass on the web, in their phone's browser. The app is for staff."
            : "No. Members book on the web, in their phone's browser, and that's where their check-in pass will be when the app launches. The app is for staff.",
        },
        {
          q: "What does it cost?",
          a: "The app is free. It works with your studio's Tandava account.",
        },
      ],
      related: [
        { to: "/", label: "Set up your studio on the web" },
        { to: "/yoga-studio-software", label: "Yoga studio software for small studios" },
        { to: "/class-booking-software", label: "Online class booking" },
      ],
      ogImage: "/og-studio-app.png",
    },
    {
      route: "/yoga-studio-software",
      title: "Yoga studio software for small, independent studios",
      description:
        "Schedule, class packs, memberships, online booking and check-in for small yoga studios. Set it up on the web; staff check people in from an iPhone app.",
      eyebrow: "Yoga studio software",
      h1: "Yoga studio software for small, independent studios",
      intro: [
        "Tandava is made for a studio with one or two rooms, a few teachers and an owner who also teaches the early class. It covers the daily work of running classes and leaves out the rest.",
      ],
      sections: [
        { heading: "What it covers", bullets: WEB_FEATURES },
        {
          heading: "Built around classes",
          paragraphs: [
            "A class has a room, a teacher, a capacity and a waitlist. Tandava models those directly, so a drop-in, a class pack and a membership all book into the same class the same way, and your attendance numbers mean the same thing everywhere.",
          ],
        },
        {
          heading: "Run the door from your phone",
          paragraphs: [
            `${STUDIO_APP.name}, our iPhone app for owners, front desk and teachers, scans members' check-in passes and checks people in from the roster. It is ${status}. Until then, check-in works from the roster in a browser.`,
          ],
        },
        {
          heading: "What it costs",
          paragraphs: [
            "We are onboarding our first studios now, and pricing for the hosted version is agreed with each studio before you take a single payment. The code is open source under AGPL-3.0, so a studio with a developer can also run its own copy and pay only for hosting.",
          ],
        },
      ],
      faq: [
        {
          q: "Does it work for pilates and barre studios too?",
          a: "Yes, for anything that runs as scheduled classes with a teacher and a capacity: yoga, mat pilates, barre, meditation, dance.",
        },
        {
          q: "Do my students need to download an app?",
          a: "No. They book on your booking page in their phone's browser. When you turn on instant booking, a first-time visitor can book a drop-in with just a name and email.",
        },
        {
          q: "Can I keep my own website?",
          a: "Yes. Embed your Tandava schedule on it, or link to your booking page.",
        },
        {
          q: "Who builds it?",
          a: "Purafield Studio, a small company in Austin, Texas. Write to hello@purafieldstudio.com and a person answers.",
        },
      ],
      related: [
        { to: "/", label: "Set up your studio" },
        { to: "/studio-app", label: `${STUDIO_APP.name}, the check-in app` },
        { to: "/class-booking-software", label: "Online class booking" },
        { to: "/tools/studio-calculator", label: "Free studio profitability calculator" },
        { to: "/open-source", label: "Open source studio software" },
      ],
      ogImage: "/og-image.png",
    },
    {
      route: "/class-booking-software",
      title: "Class booking software for small studios",
      description:
        "A booking page students can use on a phone, waitlists, class packs and memberships, and a schedule to embed on your site. For yoga, pilates and barre studios.",
      eyebrow: "Online class booking",
      h1: "Online class booking for small studios",
      intro: [
        "Students want to pick a class and pay in under a minute, on their phone. Tandava gives your studio a booking page that does that, and a schedule you can put on your own website.",
      ],
      sections: [
        {
          heading: "What students see",
          bullets: [
            "Your schedule, with times in your studio's time zone",
            "Book a class and pay by card on the next screen",
            "Instant booking for first-time visitors: name and email, no account, when you turn it on",
            "A waitlist when a class is full",
            "Add the class to their calendar",
          ],
        },
        {
          heading: "What you set",
          bullets: [
            "Drop-in prices, class packs and memberships",
            "Capacity for each class",
            "Whether your booking page is live",
            "Whether your classes are listed on Tandava Discover, where students search for a class",
          ],
        },
        {
          heading: "On your own website",
          paragraphs: [
            "Copy one embed code from your settings and your live schedule appears on your site, on any site builder that lets you paste custom code. Or just link to your booking page.",
          ],
        },
        {
          heading: "At the door",
          paragraphs: [
            live
              ? `Every booking comes with a check-in pass. Your staff scan it with ${STUDIO_APP.name}, our iPhone app, or check people in from the roster.`
              : `Today your staff check people in from the class roster. With ${STUDIO_APP.name}, our iPhone app ${status}, each booking also gets a check-in pass they scan at the door.`,
          ],
        },
      ],
      faq: [
        {
          q: "Do students need an account to book?",
          a: "Not for a single drop-in when instant booking is on. Class packs and memberships need an account, because they bill again later.",
        },
        {
          q: "How do I get paid?",
          a: "Students pay by card through Stripe. You add your bank details once and payouts go to your account. While we onboard our first studios, payments are switched on with you after pricing is agreed.",
        },
        {
          q: "Which time zone do students see?",
          a: "The studio's, named in words. If a student's phone is in another zone, they also see their local time.",
        },
      ],
      related: [
        { to: "/", label: "Set up your studio" },
        { to: "/yoga-studio-software", label: "Yoga studio software for small studios" },
        { to: "/studio-app", label: `${STUDIO_APP.name}, the check-in app` },
      ],
      ogImage: "/og-image.png",
    },
  ];
}

export const LANDING_ROUTES = ["/studio-app", "/yoga-studio-software", "/class-booking-software"] as const;

export function landingPageFor(route: string, live: boolean = STUDIO_APP_LIVE): MarketingPage | undefined {
  return landingPages(live).find((p) => p.route === route);
}
