# Blog research backlog — studio software series

Topics requested for the studio-software series that are **not** adequately
covered by the existing research docs (feature-comparison, pricing, and the
competitive research doc). These need fresh, public-source research before they
can be written to the same "legally tight, sourced, uncertainty-flagged"
standard as the four shipped posts.

Shipped first (doc-grounded, drafts in `src/content/blog/`):
1. `how-to-choose-studio-software` (pillar)
2. `studio-software-feature-comparison-2026`
3. `studio-software-pricing-and-what-the-cut-buys`
4. `discovery-platforms-vs-your-own-funnel`

---

## 1. Implementation types & timelines

**Proposed post:** "Switching Studio Software: Implementation Types and Realistic
Timelines."

**What we already have (from the pricing doc's onboarding table):**
- WellnessLiving: free white-glove onboarding + 2 free data migrations.
- Walla: free data migration, fast human support.
- Vagaro: free trial, no mandatory setup fee.
- Momence: reportedly no setup/transfer fee.
- Mindbody: implementation not advertised; third-party estimates $1,500–3,000
  (secondhand).
- Glofox: 1-on-1 onboarding promoted; setup fees reported.
- Arketa: weekly onboarding sessions; dedicated onboarding on higher tiers.
- Tandava: DIY deploy + migrate (CSV importer auto-detects Mindbody/Momence/Walla
  exports).

**Needs research / sourcing:**
- Typical end-to-end migration timelines (days/weeks) per platform — currently
  unsourced. Look for vendor onboarding docs + operator accounts.
- What data actually migrates vs. what's lost (membership history, package
  balances, waivers, payment tokens). Payment-method re-tokenization is a known
  pain point — confirm per platform.
- Parallel-run vs. hard-cutover patterns; go-live checklists.
- Contract/lock-in timing relative to implementation (auto-renew traps).

**Risk notes:** keep timeline claims hedged; they vary wildly by studio size and
data cleanliness. Prefer vendor-published statements + clearly-labeled operator
reports.

---

## 2. Discounts, promos & partner programs

**Proposed post:** "Studio Software Deals: Promos, Discounts, and Partner Programs
Worth Knowing."

**What we already have (thin):**
- WellnessLiving: promos frequently cut the first ~2 months; 15% off for veterans
  and registered non-profits.
- Arketa: annual billing saves ~17% vs monthly.
- Walla: annual vs monthly pricing gap (Core $320 annual / $390 monthly).
- Momence: free tier as a loss-leader (high transaction cut instead).

**Needs research / sourcing:**
- Current/seasonal promotions (these change monthly — must be dated and linked,
  and re-checked at publish time).
- "Trusted partner" / "beta partner" / early-access programs: do vendors offer
  fee breaks or co-marketing for being a reference customer or beta tester?
  (e.g., founder/ambassador programs, association partnerships like Yoga Alliance
  discounts.) Mostly unverified — needs primary sources.
- Switching incentives / competitor-migration credits.
- Reseller, studio-network, or franchise group-buying discounts.

**Risk notes:** promo specifics date extremely fast and vary by rep/region. Frame
as "examples of the *kinds* of deals available, confirm current terms directly."
Avoid stating any discount as guaranteed.

---

## 3. Regional availability & market share by region

**Proposed post:** "Where Each Studio Platform Operates — and Who Leads by
Region."

**What we already have:** essentially nothing in the docs. Only data point:
Walla's branded app is noted as **US only**.

**Needs research / sourcing (HIGH uncertainty — handle carefully):**
- Country/region availability per platform (US, UK/EU, ANZ, APAC, etc.),
  currency/payment-rail support, language support, and data-residency/GDPR
  posture.
- Market-share-by-region is the hardest claim in the whole series: reliable,
  citable share figures for private studio-software vendors are scarce and often
  vendor-PR or analyst estimates behind paywalls. **Do not assert share numbers
  without a strong, dated, public source.** Consider reframing to a qualitative
  "regional strength" read (e.g., "Mindbody and ClassPass are strongest in the
  US; Glofox/ABC has notable UK/EU and franchise presence") rather than
  percentages.

**Risk notes:** highest legal/accuracy risk in the series. If hard share data
can't be sourced, ship a qualitative regional-strength piece and explicitly say
share figures are not publicly reliable.

---

## Standards for all three (carry over from shipped posts)

- Public information only; link every factual claim; date everything (checked
  June 2026 or later).
- Label opinion as opinion; label secondhand/estimated/sales-gated figures.
- Keep the positive-sum "technology as empowerment / find your fit" framing.
- Disclose Tandava self-interest.
- Include the standard disclaimer footer (trademarks belong to owners, not
  affiliated, verify before relying, not legal advice).
- Recommend a counsel pass before any competitor-comparison post goes live.
