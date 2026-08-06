/**
 * Article and FAQ copy for /tools/studio-calculator.
 *
 * Two consumers import this module: the React page renders it, and
 * scripts/prerender-tools.ts writes the same text into the static HTML snapshot
 * and the FAQPage JSON-LD at build time. One copy means the structured data can
 * never claim a question the page does not answer.
 *
 * House rules for this copy: no em dashes, no hype verbs, no exclamation
 * points, numbers wherever a number will do.
 */

export const CALC_ROUTE = "/tools/studio-calculator";

export const CALC_TITLE =
  "Yoga Studio Profitability Calculator: Break-Even, Costs, and Cash Flow (Free)";

/** Under 155 characters. Counted, not estimated. */
export const CALC_META_DESCRIPTION =
  "Free calculator: break-even members, students per class, costs, and monthly cash flow for a yoga studio. Every assumption is editable.";

export const CALC_KEYWORDS = [
  "yoga studio profitability calculator",
  "yoga studio break even",
  "cost to open a yoga studio",
  "yoga studio profit margin",
  "yoga studio operating costs",
  "yoga studio business plan",
];

export const CALC_HERO_PROMISE =
  "Break-even members, students per class, and cash flow for your studio, in 60 seconds.";

export interface ArticleSection {
  /** Rendered as an <h2>. Written to match how people actually search. */
  heading: string;
  paragraphs: string[];
}

export const CALC_ARTICLE: ArticleSection[] = [
  {
    heading: "How much profit does a yoga studio make",
    paragraphs: [
      "A stabilized single-location yoga studio that is working tends to land somewhere between 8 and 18 percent EBITDA. That is earnings before interest, taxes, depreciation and amortization, which means it is the number before your loan payment, before the build-out you are still paying off, and before tax. A studio showing 12 percent EBITDA on 70,000 dollars a month of revenue is producing about 8,400 dollars a month of operating cash, and the owner may still be taking home very little of it once debt service and reinvestment are paid.",
      "The wide range is not noise. It is almost entirely explained by two decisions made before a single class is taught: how much space you signed for, and at what rent. A studio at 10 percent rent and a studio at 20 percent rent can run identical schedules, identical class sizes and identical teacher pay, and one of them will be comfortable while the other is quietly failing.",
      "The calculator above gives you your own version of that number. It is a stabilized-year model, so it describes a studio that has already filled up, not one in month four.",
    ],
  },
  {
    heading: "The fixed cost trap",
    paragraphs: [
      "In this model, between 85 and 91 percent of a typical studio's monthly cost does not move with attendance. Rent does not care. Utilities barely care. Insurance, software, cleaning, accounting and the front desk do not care at all. Teacher pay is the interesting one: it is set by your schedule rather than by your attendance, so it behaves like a fixed cost even though it feels variable. Put a class on the calendar and you owe the teacher whether four people come or forty.",
      "The consequence is that a yoga studio is a high-operating-leverage business. Every student above break-even is worth roughly the full price of their visit, because almost nothing gets more expensive when they walk in. The same leverage runs in reverse. A ten percent drop in visits does not cut ten percent of your cost, it cuts almost none of it, and the entire shortfall lands on the bottom line.",
      "This is why the two most powerful levers a studio owner has are the lease and the schedule. Those are the levers that actually move fixed cost. Working harder on retention is worth doing, but it moves a number that is already only nine to fifteen percent of the cost base.",
    ],
  },
  {
    heading: "Yoga studio break even point",
    paragraphs: [
      "Break-even is easier to reason about per visit than per month. Take everything that does not move with attendance, subtract whatever your workshops and teacher trainings net, and divide by your contribution per visit, which is the average revenue a visit brings in minus the costs that scale with it, mostly card processing and revenue-linked marketing. That gives you break-even visits. Divide by classes per month and you have the students per class you need. Multiply by your member share of visits and divide by visit frequency and you have break-even members.",
      "For the two-room Tier 2 studio loaded by default above, the model puts break-even near 297 members and roughly nine students per class across a sixty-class week, against an actual average near ten. That is a margin of safety around 13 percent. Thirteen percent is thinner than it sounds: it means a bad quarter, not a catastrophe, is enough to erase the year's profit.",
      "Margin of safety is the number worth writing on the wall. It tells you how far attendance can fall before the studio stops paying for itself. Under 10 percent, you are running the business from the bank balance rather than from the plan.",
    ],
  },
  {
    heading: "The 15 percent rent line",
    paragraphs: [
      "Rent below 12 percent of revenue is healthy. Between 12 and 15 percent is workable and worth watching. Above 15 percent, the lease is running the business, and every operational decision from then on is made in service of covering it.",
      "The heuristic that makes this concrete: every 4 dollars per square foot on the lease is about 10 members of break-even. On a 4,400 square foot space, 4 dollars per square foot per year is about 1,467 dollars a month, and at roughly 23 dollars of contribution per visit and 5.8 visits per member, that is ten members you have to find and keep before you have earned anything new. Negotiating 4 dollars off the asking rent is the same work as ten months of good retention, done once, in an afternoon.",
      "The corollary is about square footage rather than rate. Signing 600 more square feet than you need is the same mistake in a different costume, and it is harder to undo because you cannot renegotiate a wall.",
    ],
  },
  {
    heading: "Capacity vanity and the 1.5x rule",
    paragraphs: [
      "The most common expensive error in studio design is building the room for the class you hope to teach on a January Saturday rather than the class you will actually teach on a Tuesday at 2pm. A 60-mat room running an average of 10 students is paying rent on 50 empty mats, 32 times a week.",
      "A working rule: size the main room to about 1.5 times your realistic average class size, not to your peak. Peak demand is three or four slots a week. You pay for the room 168 hours a week. If your peak classes are genuinely turning people away, that is a scheduling problem with a scheduling solution, which is to add a class at the peak time rather than square footage for all time.",
      "The preset labelled the right-sized two-room studio in the calculator is the same business with 600 fewer square feet of rentable space. The schedule is nearly identical and the member base is smaller, and break-even still drops by roughly 20 members while utilization climbs. That gap is the price of the empty mats.",
    ],
  },
  {
    heading: "The seven-head class cut, and when not to make it",
    paragraphs: [
      "Because teacher pay is set by the schedule, a chronically empty class costs real money. A class averaging under about seven students usually does not cover its own fully loaded cost per class in a Tier 2 market, which includes its share of rent, utilities, teacher pay, front desk and everything else. Cutting it is often the fastest single improvement available to a struggling schedule.",
      "Three caveats, and they matter. First, some low-attendance classes are load-bearing: the Tuesday 2pm that serves eight loyal members may be the reason those members hold an unlimited membership at all, and cutting it can cost more membership revenue than it saves in teacher pay. Second, a class in its first eight to twelve weeks has not had time to find its audience, and cutting early is how a schedule slowly loses every class that was not an instant hit. Third, cutting classes shrinks the perceived value of an unlimited membership, which is the product you are actually selling.",
      "Use the per-room panel in the calculator to see the break-even headcount for each room, then compare it against the classes you are actually worried about, rather than against the studio average.",
    ],
  },
  {
    heading: "Seasonality and the reserve you need",
    paragraphs: [
      "Studio demand is strongly seasonal and its cost base is not. January runs about 25 percent above trend, the summer trough runs 15 to 20 percent below it, and December is usually the worst month of the year. Utilities move the opposite way, peaking exactly when revenue bottoms out in July and August.",
      "The practical consequence is that a studio which is comfortably profitable across a full year still has cash-negative months, usually two to four of them in summer and December. The model sums the depth of those months into a seasonal burn figure, and recommends holding about 2.5 times that burn in reserve.",
      "This is the number most first-year studios do not have, and it is the reason a profitable studio can still fail. Being annually profitable does not pay an August rent bill.",
    ],
  },
  {
    heading: "Should my studio accept ClassPass",
    paragraphs: [
      "Honestly, both things are true. Aggregator visits are worth substantially less per head than your own channels: somewhere near 8 to 14 dollars net against a member visit worth closer to 25 dollars in the default scenario. They also fill seats that would otherwise be empty, and empty seats are worth nothing at all.",
      "The distinction that matters is whether the aggregator is filling your off-peak or cannibalizing your peak. Off-peak aggregator visits are close to free money, since the class is running either way. Peak-time aggregator visits displace full-price students and train your local market to reach you through a cheaper channel, which is a slower and more expensive problem.",
      "The threshold worth watching is roughly 15 percent of total visits. Below that, dilution is manageable and the funnel argument holds. Above it, revenue per visit falls fast enough that the studio is effectively repricing itself, and the conversion rate from aggregator visitor to member has to be genuinely good to justify it. Turn the toggle on in the calculator and watch what the revenue-per-visit strip does as you move the share slider.",
    ],
  },
  {
    heading: "Yoga studio software cost comparison",
    paragraphs: [
      "Studio management software is not usually a studio's largest problem, and it is one of the few line items you can change in a week rather than at lease renewal. Estimated monthly costs for a two-room studio range from roughly 250 to 470 dollars a month at the commercial tiers, and self-hosted open-source options run near the cost of hosting.",
      "Over five years, the gap between the top of that range and the bottom is on the order of 26,000 dollars. That is not a business-saving amount for most studios, and anyone who tells you it is has something to sell. It is also not nothing: it is about a year of the reserve most studios do not hold. Worth checking your invoice against your plan once a year, and worth remembering that payment-processing terms bundled with the software are often the larger cost.",
      "This calculator does not name vendors. Pricing changes often, real invoices depend on plan, size, modules and negotiation, and a named price next to a number would imply a precision this model does not have. The options are described by market position with editable estimates. If you have a real quote, type it in.",
      "Tandava, which hosts this calculator, is one of the self-hosted open-source options in that list: MIT licensed, and you pay for hosting rather than a license. That is the whole of the pitch. The reason it is worth stating here at all is that the same principle applies to this page. The model below is not a black box you have to trust; the file it runs on is public, every constant in it is either sourced or labelled an assumption, and if one is wrong for your market you can change it in the drawer or send a correction.",
    ],
  },
  {
    heading: "Cost to open a yoga studio",
    paragraphs: [
      "This calculator models a stabilized operating month, not the money it takes to get there. Opening costs sit outside it entirely: build-out, flooring, sound, heat if you are running hot, lease deposits and personal guarantees, furniture, props, initial marketing, professional fees, and the several months of operating losses before the member base fills in.",
      "What the calculator does tell you about opening is the thing most opening budgets get wrong. It shows you the monthly obligation you are signing up for, which is the number that determines whether the opening budget was enough. A build-out you can afford in a space you cannot is the most common version of this mistake.",
      "Run your intended space through it before you sign anything, then run it again at 75 percent of your hoped-for member count. If the second version is survivable, the plan is real.",
    ],
  },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const CALC_FAQ: FaqItem[] = [
  {
    q: "What profit margin should a yoga studio make?",
    a: "A stabilized single-location studio that is working typically lands between 8 and 18 percent EBITDA. That is before debt service, build-out amortization and tax, so the cash reaching the owner is lower. Anything above 18 percent usually means either an unusually cheap lease or an owner working unpaid in a role the model would otherwise charge a salary for.",
  },
  {
    q: "How many members does a two-room yoga studio need to break even?",
    a: "In the default Tier 2 two-room scenario in this calculator, break-even is near 297 members, or roughly nine students per class across a sixty-class week. The number moves most with rent and with how many classes you schedule. A smaller room with the same schedule breaks even closer to 275 members. Your own number depends on your lease, your price and your visit frequency, which is why every input here is editable.",
  },
  {
    q: "What percentage of revenue should rent be for a yoga studio?",
    a: "Below 12 percent is healthy, 12 to 15 percent is workable and worth watching, and above 15 percent means the lease is setting the agenda. As a rule of thumb, every 4 dollars per square foot on the lease is about 10 members of break-even, so negotiating the rate down is worth roughly as much as a long stretch of good retention.",
  },
  {
    q: "Does ClassPass help or hurt a yoga studio?",
    a: "It depends entirely on whether it fills off-peak seats or displaces peak-time full-price students. Aggregator visits net roughly 8 to 14 dollars against a member visit worth closer to 25 dollars, so they dilute revenue per visit. Below about 15 percent of total visits that dilution is manageable and the funnel argument holds. Above that, the studio is effectively repricing itself and the conversion rate to membership has to justify it.",
  },
  {
    q: "How much does yoga studio software cost?",
    a: "Estimated monthly costs for a two-room studio run from roughly 250 to 470 dollars at the commercial tiers, with self-hosted open-source options near the cost of hosting. Over five years the spread is on the order of 26,000 dollars. Real invoices vary by plan, studio size, modules and negotiation, and bundled payment-processing terms are often the larger cost. This calculator uses editable estimates and does not name vendors.",
  },
  {
    q: "How much cash reserve does a yoga studio need?",
    a: "Enough to cover the seasonal trough, not just an average month. Most studios run two to four cash-negative months, typically in summer and December, while utilities peak in exactly those summer months. This model recommends holding about 2.5 times the total depth of those negative months. An annually profitable studio can still fail because it could not pay an August rent bill.",
  },
  {
    q: "Are the numbers in this calculator accurate for my market?",
    a: "They are modelled best guesses, not quotes and not a survey. Rent tiers are anchored to mid-2026 comps in a Tier 2 US metro and grossed up for triple-net pass-throughs, wages come from public aggregators, and software figures are illustrative estimates by market position rather than vendor prices. Every constant is editable in the advanced drawer, and you should replace them with your own quotes before making any decision. This is an educational model, not financial advice.",
  },
];

export const CALC_CAVEATS: string[] = [
  "Modelled data, not survey data. Every default here is a best-guess estimate assembled from public comps and public wage aggregators in mid-2026, not a quote for your space and not a study of real studio P&Ls. Individual studios vary enormously.",
  "Rent tiers are anchored to one market. The tier table is built from mid-2026 Austin retail comps and extrapolated outward, quoted all-in rather than as asking rent. Your market and your lease will differ, possibly by a lot.",
  "Software costs are estimates by market position, not vendor prices. No vendor is named, published pricing changes often, and real invoices depend on plan, size, modules, contract length and negotiation. Use your own quote.",
  "This is a stabilized year, not a ramp. Opening costs, build-out, deposits and the first twelve months of filling the room are all outside the model.",
  "EBITDA is not take-home. There is no debt service, depreciation, amortization, tax, owner draw beyond the GM line, or working capital in these numbers.",
  "The math is auditable, which is not the same as the math being right. Every formula and constant lives in one readable file you can go and check, and that is the point of publishing it, but a transparent model built on estimated inputs still produces estimated outputs.",
  "Not financial, tax, legal or accounting advice. No output here is a projection of what any particular studio will earn. Do not sign a lease on the strength of a number this page produced. Take it to an accountant who knows your market.",
];

export const CALC_DISCLAIMER_SHORT =
  "Estimates only. Every default is a modelled best guess, editable below, and none of this is financial advice.";

/**
 * Static HTML body for the build-time snapshot (scripts/prerender-tools.ts), so
 * crawlers and link-preview bots get the article, the FAQ and a worked example
 * at the URL without running any JavaScript. React replaces #root on load.
 */
export function calcStaticHtml(): string {
  const article = CALC_ARTICLE.map(
    (s) => `<h2>${s.heading}</h2>${s.paragraphs.map((p) => `<p>${p}</p>`).join("")}`,
  ).join("");
  const faq = CALC_FAQ.map((f) => `<h3>${f.q}</h3><p>${f.a}</p>`).join("");
  const caveats = CALC_CAVEATS.map((c) => `<li>${c}</li>`).join("");
  return `
    <h1>Yoga Studio Profitability Calculator</h1>
    <p>${CALC_HERO_PROMISE}</p>
    <h2>Default scenario: a two-room Tier 2 boutique studio</h2>
    <ul>
      <li>Two rooms, 60 mats and 30 mats, 60 classes per week</li>
      <li>149 dollar unlimited membership, 340 members, 5.8 visits per member per month</li>
      <li>Revenue about 70,100 dollars per month</li>
      <li>EBITDA about 7,400 dollars per month, a margin near 10.5 percent</li>
      <li>Cash break-even near 297 members, about 8.8 students per class</li>
      <li>Rent about 22.6 percent of revenue, which is above the 15 percent warning line</li>
      <li>Three cash-negative months per year, with a recommended reserve near 26,000 dollars</li>
    </ul>
    ${article}
    <h2>Frequently asked questions</h2>
    ${faq}
    <h2>Caveats</h2>
    <ul>${caveats}</ul>
  `;
}

/**
 * JSON-LD for the tool page. Built here rather than in the page so the runtime
 * <SEOHead> and the build-time snapshot in scripts/prerender-tools.ts emit
 * byte-identical structured data.
 *
 * SITE_URL is read lazily through a parameter because this module is imported
 * by a Node build script, where import.meta.env does not exist.
 */
export function calcStructuredData(
  siteUrl = "https://tandava.yoga",
): Record<string, unknown>[] {
  const url = `${siteUrl}${CALC_ROUTE}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Yoga Studio Profitability Calculator",
      url,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: CALC_META_DESCRIPTION,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      isAccessibleForFree: true,
      featureList: [
        "Break-even members and students per class",
        "Monthly cost breakdown by occupancy, labor, operating and variable",
        "Twelve-month cash flow and seasonal reserve",
        "Per-room break-even economics",
        "Aggregator revenue dilution",
        "Every assumption editable and shareable by link",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: CALC_TITLE,
      description: CALC_META_DESCRIPTION,
      author: { "@type": "Organization", name: "Tandava" },
      publisher: { "@type": "Organization", name: "Tandava" },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      articleSection: CALC_ARTICLE.map((s) => s.heading),
    },
    {
      // INVARIANT: mirrors CALC_FAQ, which the page itself renders.
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: CALC_FAQ.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ];
}
