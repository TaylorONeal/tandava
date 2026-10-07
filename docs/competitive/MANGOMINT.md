# Competitive Brief: Mangomint vs Tandava

**Date:** 2026-10-07
**Analyst:** Claude Code session
**Decision this informs:** Feature prioritization and positioning for Tandava Studio / Tandava Cloud
**Shelf life:** Pricing and feature claims go stale fast. Mangomint repriced on 2026-08-01. Re-verify before any external use.

> **Acted on, 2026-10-07.** Four recommendations below have since been taken up:
> login-free booking is specified and built in [PRD-020](../prd/PRD-020-express-booking.md);
> appointments are specified in [PRD-021](../prd/PRD-021-privates-and-appointments.md);
> the per-audience messaging split that sections 2 and 8 call for is now
> [docs/positioning/AUDIENCES.md](../positioning/AUDIENCES.md), which narrows section 8's blanket
> "stop leading with open source" to the hosted and consumer surfaces only — the open-source
> project's own surfaces should and do lead with it;
> and section 3's pricing analysis, including the per-location part Mangomint gets right, is carried
> forward in [docs/roadmap/PRICING_MODELS.md](../roadmap/PRICING_MODELS.md).

---

## 0. Verification limits (read this first)

Mangomint's own domains (`mangomint.com`, `booking.mangomint.com`) and several review sites
(`thesalonbusiness.com`, `pabau.com`) are blocked by this session's network egress proxy. The example
booking link you gave could not be loaded directly.

Everything below about Mangomint comes from search-result snippets of Mangomint help articles, their
pricing-change announcements, G2/Capterra review aggregation, and a third-party audit of their public
API surface. Feature-level claims are sourced from Mangomint's own help documentation, which is
reliable about what exists and unreliable about how well it works.

**Confidence levels used:**
- **High** — stated in Mangomint's own docs or pricing announcements
- **Medium** — consistent across multiple third-party reviews
- **Low** — inferred from product shape; needs a live account to confirm

Tandava's side is sourced from this repository: `docs/FEATURE_INDEX.md`,
`docs/HOSTED_PRODUCT_REVIEW.md`, `docs/IMPLEMENTATION_HANDOFF.md`, and `docs/STATUS.md`.

---

## 1. The uncomfortable finding up front

**Mangomint is not a direct competitor to Tandava, and the URL you sent is the proof.**

`booking.mangomint.com/entertheoasis/daniella` is a provider-scoped booking link: business slug, then
a named service provider. That is the signature of appointment-first software. The client picks a
person, then a service, then a time slot. Nobody books "Daniella" the way they book a 6pm Vinyasa
class. The unit of inventory is a provider's calendar, not a session with capacity.

Mangomint sells to salons, spas, and medspas. Its class-shaped capability is a *group appointment*,
bolted on: multiple clients on one appointment, capped at **five clients for online booking**
(staff can exceed that only from the internal calendar), with class-style capacity achieved by
configuring a "group service" plus a resource constraint. Confidence: High, from their own
group-booking FAQ and help docs.

That is a workaround, not a class scheduler. There is no evidence of recurring class series with
per-occurrence overrides, waitlist auto-promotion, teacher substitution workflows, class packs with a
consumption ledger, spot or reformer assignment, or unlimited-membership coverage rules. Those are
the primitives a yoga or pilates studio lives on, and they are Tandava's entire domain model.

**So why does Mangomint still deserve analysis?** Three reasons, and only three:

1. **Segment overlap at the edges.** Studios running massage, bodywork, acupuncture, infrared sauna,
   or private 1:1 sessions alongside classes. A pilates studio that is 60% privates and duets is
   genuinely closer to Mangomint's shape than to Mindbody's.
2. **Adjacency risk.** Mangomint has money, product velocity, and just simplified pricing to buy
   share. Group bookings shipped as a real feature. "Wellness" is the natural adjacent market for
   salon software, and fitness studios are in that adjacency.
3. **UX benchmark.** This is the most valuable reason. Mangomint's reputation is built almost
   entirely on interface quality and support, not feature count. Their login-free booking flow is
   the thing worth studying and copying.

Mindbody, Momence, Arketa, Walla, and WellnessLiving remain the real competitive set. Treat
Mangomint as the **design benchmark and flank threat**, not the head-to-head.

---

## 2. Company and positioning

| | Mangomint | Tandava |
|---|---|---|
| Category claim | Salon, spa, and medspa management software | Open-source studio management for yoga, pilates, movement |
| Primary unit of inventory | Provider appointment slot | Class occurrence with capacity |
| Target buyer | Salon/spa/medspa owner, 1 to 20+ providers | Independent class-based studio, 1 location (per `IMPLEMENTATION_HANDOFF.md`) |
| GTM | Self-serve + sales, strong content and community in beauty | Open source, self-host free, optional managed hosting |
| Lock-in posture | No contracts, claims open data ownership | Self-hostable, data interoperability is an explicit legal posture |
| Stage | Established commercial SaaS, Stripe-backed, published case studies | Active development; substantial prototype plus backend foundation |

### Mangomint's positioning statement (extracted)

> For salon, spa, and medspa owners who are fed up with clunky legacy software, Mangomint is a
> management platform that feels genuinely fast and modern. Unlike Mindbody or Vagaro, Mangomint
> is built for the way beauty and wellness businesses actually operate, with no contracts.

**Message architecture:**
- L1 Category: salon/spa/medspa management platform
- L2 Differentiator: speed, polish, and support quality (not breadth)
- L3 Value prop: "your front desk stops fighting the software"
- L4 Proof: review-site ratings, exceptional-support testimonials, Stripe case study

### Tandava's positioning statement (as currently implied by the repo)

> For independent class-based studios who do not want to rent their own operational data, Tandava is
> an open-source studio management platform that models universal studio reality. Unlike Mindbody or
> Momence, you can self-host it, read your own database, and leave without a migration hostage
> negotiation.

**The gap in Tandava's message:** "open source" is a *mechanism*, not a benefit. Studio owners do not
buy source access. They buy escape from a vendor that raised their price, locked their data, and
stopped answering support tickets. The positioning needs to lead with that outcome. More on this in
section 8.

---

## 3. Pricing

### Mangomint, current (effective 2026-08-01) — Confidence: High

| Component | Price |
|---|---|
| Platform | **$120/mo per location** |
| Users | **$10/mo per user** |
| Phone add-on (formerly Connect) | $70/mo per line |
| Marketing credits | from $30/mo |
| Card processing, in person | 2.45% + $0.15 |
| Card processing, online | 2.90% + $0.30 |

All core features are now in the single plan: Express Booking, memberships, virtual waiting room,
HIPAA compliance. Forms & Charting, Web Chat, and all integration add-ons (Shopify, webhooks) moved
from paid to included.

**Historical, for context:** the previous three-tier model was Essentials $165 (up to 10 service
professionals), Standard $245 (up to 20), Unlimited $375 (unlimited), plus $95 to $175 per extra
location. Most review sites and comparison pages still publish these numbers. They are wrong as of
August 2026. Do not cite them.

### Why the per-user model is a structural wedge for Tandava

This is the single most actionable finding in this brief.

Mangomint's per-user pricing is designed for salons, where every user is a revenue-producing provider
sitting in a chair. A yoga studio's staff shape is the opposite: a long tail of part-time teachers
who each teach two or three classes a week.

Worked example, one-location studio, 14 teachers plus 3 front desk staff:

| | Monthly |
|---|---|
| Mangomint platform | $120 |
| 17 users at $10 | $170 |
| **Mangomint total** | **$290** |
| Tandava Cloud (proposed, per `IMPLEMENTATION_HANDOFF.md`) | **$99** |
| Tandava self-hosted | **$0** plus infrastructure |

Add the Phone line and Mangomint is $360/mo. A studio with 25 teachers pays $370 before add-ons.

**Mangomint charges a studio for having a teaching bench.** That is a pricing model that actively
punishes the staffing pattern every class-based studio uses. Tandava should never adopt per-seat
pricing, and should say so loudly: *unlimited teachers, always, because a studio with more teachers
is not a studio using more software.*

Caveat for honesty: Mangomint's $10/user buys a working product today. Tandava's $99 buys a product
that `HOSTED_PRODUCT_REVIEW.md` correctly says is "not yet a production-complete replacement."
Pricing advantage is only an advantage once the core works.

---

## 4. Feature comparison

Two matrices. The first is **scope**, which is what marketing pages compare. The second is **verified
capability**, which is what determines whether a studio can actually run on the thing. Conflating
them is how competitive analysis becomes self-flattery.

**Scale:** Strong (market-leading) / Adequate (works, undifferentiated) / Weak (exists, real gaps) /
Absent / Workaround (achievable only by misusing another feature)

### 4a. Scope comparison

| Capability | Why it matters | Mangomint | Tandava (designed scope) |
|---|---|---|---|
| **Class scheduling** | | | |
| Recurring class series | The core of a studio week | Absent | Strong (`schedule_rules`) |
| Per-occurrence override | Holiday weeks, one-off sub | Absent | Strong (`schedule_overrides`) |
| Capacity-limited group session | Can 18 people book one slot | Workaround (group service + resource) | Strong |
| Online group booking size cap | | **5 clients** | No cap by design |
| Waitlist | Fills cancellations, protects revenue | Absent | Strong |
| Waitlist auto-promotion | The part that actually saves labor | Absent | Strong (`waitlist_settings` + DB trigger) |
| Teacher substitution workflow | Weekly reality for studios | Absent | Strong (`sub_requests`, shift trades) |
| Spot / reformer / asset assignment | Table stakes for reformer pilates | Absent | Planned (Phase 7) |
| Room and buffer management | | Adequate (resources) | Schema / Planned |
| Multi-location | | Strong (priced per location) | Schema |
| **Appointments** | | | |
| 1:1 provider booking | Privates, massage, bodywork | **Strong** | Weak |
| Provider-specific booking links | The URL you sent | **Strong** | Absent |
| Provider availability management | | **Strong** | Schema (`instructor_availability`) |
| Service customizations / add-ons | Upsell at booking | **Strong** | Absent |
| Virtual waiting room | | **Strong** | Absent |
| **Client-side booking UX** | | | |
| Login-free booking | Biggest single conversion lever | **Strong (Express Booking)** | Weak |
| Book from Google / Instagram / Facebook link | | **Strong** | Partial (embed + landing pages) |
| Membership/package purchase during booking | | **Strong** | UI only |
| Gift card sale during booking | | **Strong** | Schema only |
| Self-checkout via texted payment link | | **Strong** | Absent |
| **Entitlements and money** | | | |
| Recurring memberships with auto-billing | | **Strong** | UI only |
| Service-credit memberships (N per period) | | **Strong** | UI only |
| Unlimited-membership class coverage rules | Core yoga entitlement model | Weak | Strong (designed) |
| Class packs with consumption ledger | | Workaround (packages) | UI only |
| Membership pause / freeze | Enormous support-ticket driver | Low confidence, likely Weak | Schema |
| Product and service member discounts | | **Strong** | Planned |
| Integrated POS with hardware | | **Strong** | Planned |
| Partial and prorated refunds | | Adequate | Tier-1 roadmap item |
| Payment plans | | Absent | Planned |
| **Staff** | | | |
| Payroll processing | Pay staff, not just report | **Strong** | Absent (reporting only) |
| Commission and tips | | **Strong** | Schema |
| Staff mobile app | | **Strong** | PWA only |
| Teacher-facing portal (schedule, subs, earnings) | | Weak | Strong (designed, `/teach`) |
| **Communication** | | | |
| Two-way texting / phone / web chat | | **Strong (Phone add-on)** | UI only |
| Forms and charting | HIPAA-shaped intake | **Strong, now free** | Schema (waivers) |
| Email campaigns and segmentation | | Adequate | UI only (extensive design) |
| Automated lifecycle / drip | | Adequate | Planned |
| **Data and integrations** | | | |
| Public documented REST API | | **Absent** | Supabase/PostgREST by construction |
| Zapier | | **Absent (no official app)** | Planned |
| Webhooks | | Adequate, now included, undocumented payloads | Planned |
| Integration breadth | | Weak (Mailchimp, Stripe, Shopify, a few one-offs) | Planned |
| Direct database access | | Absent | **Strong (self-host)** |
| Data export / portability | | Adequate, claims open ownership | Strong (explicit legal posture) |
| Vendor migration tooling | | Low confidence | UI only (Mindbody, Walla mappings) |
| **Reporting** | | | |
| Operational reporting | | Adequate | UI only |
| Financial reporting for bookkeeping | | **Weak (consistent complaint)** | UI only |
| Custom report builder | | Low confidence | Planned (PRD-013) |
| Accounting exports (QuickBooks) | | Low confidence | Planned (PRD-016) |
| **Platform** | | | |
| HIPAA compliance | Medspa requirement | **Strong** | Absent |
| Native mobile apps | | **Strong** | Absent (PWA; do not claim native) |
| On-demand video / streaming | | Absent | Planned (Phase 9) |
| Self-hosting | | Absent | **Strong** |

### 4b. Verified capability comparison

This is the matrix that matters, and it is unflattering. Per `HOSTED_PRODUCT_REVIEW.md` and
`FEATURE_INDEX.md`, most of Tandava's surface is "demonstrated UI" over mock data, not verified
end-to-end.

| Studio job | Mangomint | Tandava verified today |
|---|---|---|
| Publish a bookable schedule | Strong (appointments) | Demonstrated UI; occurrences not persisted end-to-end |
| Take money for it | Strong | Backend foundation; Stripe webhook replay-safety is a launch blocker |
| Book with atomic capacity + entitlement check | Strong | Not verified; duplicate prevention is Tier-1 roadmap |
| Check someone in | Strong | Demonstrated UI; QR is a placeholder pattern, not a credential |
| Reconcile a month of revenue | Weak but real | Demonstrated UI over sample figures |
| Pay staff | Strong | Reporting only |
| Isolate two studios' data | Strong (single-tenant SaaS) | RLS designed; two-studio authorization not proven |
| Migrate off a legacy vendor | Low confidence | Demonstrated UI with fixed mappings and simulated results |
| Run in production at all | Yes, thousands of businesses | No. Pilot gates are open. |

**Tandava currently wins the design argument and loses the operational one.** Any comparison deck
built on matrix 4a alone is a deck that will not survive a trial.

---

## 5. Strengths and weaknesses

### Mangomint strengths
- **Interface quality.** The most consistent praise across every review source. Staff onboard fast.
  This is a real moat and it is cultural, not technical. Tandava will not beat it by accident.
- **Support.** Second most consistent praise. Responsiveness is treated as a product feature.
- **Express Booking.** Login-free booking removes the single largest drop-off in studio conversion.
  Tandava has no equivalent.
- **Payments and POS depth.** Integrated processing, hardware, self-checkout by text link, real
  payroll. The entire money loop is closed.
- **Pricing simplification.** The August 2026 move to one plan plus moving forms, web chat, and
  integrations from paid to free is a confident, buyer-friendly play. It removes the "which tier do I
  need" friction their competitors still have.
- **No contracts, data ownership claims.** This partially neutralizes Tandava's lock-in message. Do
  not position against Mangomint as a data-hostage vendor. That is Mindbody's reputation, not theirs.

### Mangomint weaknesses
- **Classes are not a first-class concept.** The five-client online group cap is the tell. Any
  class-based studio hits a wall inside a week.
- **Financial reporting.** Repeatedly cited: "financial reports are lacking a lot," inadequate for
  bookkeeping. A vertical with real P&L needs ends up exporting to spreadsheets.
- **Integration ecosystem is thin.** Mailchimp, Stripe, Shopify, and a handful of vendor-built
  one-offs. No official Zapier app.
- **No public developer API.** No self-service developer portal, no published REST or GraphQL
  reference, no OpenAPI spec. Webhooks exist but with no published payload schema and no documented
  signature scheme. A studio cannot build on top of it.
- **Per-user pricing is wrong for studio staffing.** Section 3.
- **No class packs with a real consumption ledger, no waitlist, no sub workflow.**
- **No on-demand video or hybrid delivery.** Not their market, but it is table stakes in post-2020
  fitness.

### Tandava strengths
- **Correct domain model.** The separations in `CLAUDE.md` (booking vs transaction, entitlement vs
  payment, session independent of payment status) are the thing most competitors got wrong and cannot
  now fix. This is the durable asset.
- **Class-native primitives.** Recurring rules with overrides, waitlist auto-promotion in a DB
  trigger, sub requests, coverage rules. Designed, not retrofitted.
- **Teacher-facing portal.** Mangomint has staff tools; Tandava has a teacher product (schedule,
  availability, subs, earnings). Teachers are the actual daily users at a studio and nobody serves
  them well.
- **Self-hosting and direct database access.** Structurally impossible for any SaaS competitor to
  match.
- **Unlimited staff at a flat price.**
- **Breadth of design work.** 19 PRDs, ~140 tables, documented architecture. Genuine leverage if the
  core gets finished.

### Tandava weaknesses
- **Nothing is verified end-to-end.** Payment atomicity, tenant isolation, migration reality,
  attendance persistence. All open.
- **Breadth before depth.** Retail, inventory, purchase orders, UTM builders, campaign A/B testing,
  audience segments, and advanced BI all have UI while "publish a class and reliably take money for
  it" does not work. `HOSTED_PRODUCT_REVIEW.md` names this directly. It is the biggest strategic risk
  in the project.
- **No login-free booking.** The one UX pattern most worth stealing is absent.
- **No payments-complete loop.** No POS, no payroll, no payment plans, no partial-refund flow.
- **No native apps, no HIPAA, no on-demand video.**
- **Positioning leads with mechanism, not outcome.**

---

## 6. Opportunities

Ranked by leverage, not by effort.

1. **Own the "class-native + appointment-capable" position.** Nobody holds it. Mangomint is
   appointment-only. Mindbody and Momence treat privates as a weak afterthought. A studio running
   classes plus privates plus massage currently buys two systems or compromises. Adding real
   appointment booking to a class-native core is a smaller lift than adding class scheduling to an
   appointment-native core, which is why Mangomint cannot come the other way.
2. **Steal Express Booking immediately.** Login-free booking, provider-scoped and class-scoped
   deep links, booking in two taps. This is the highest-conversion, best-understood pattern in the
   category and it is already Tier-2 on `COMPETITOR_ISSUES_PRIORITY.md` (#3, "5-7 taps to 1-2 taps").
   Promote it to Tier 1.
3. **Make per-seat pricing the enemy.** "Unlimited teachers. Always." lands against Mangomint,
   Mindbody, and most of the field at once. It is concrete, verifiable, and the math favors you at
   every studio size.
4. **Win on the API no incumbent has.** Mangomint has no public API, no OpenAPI spec, no Zapier, and
   undocumented webhooks. Tandava gets a documented REST surface nearly free from Supabase/PostgREST.
   A published OpenAPI spec plus signed webhooks plus a Zapier app is a differentiator that
   Mangomint's architecture and GTM posture make them slow to answer.
5. **Win on financial reporting.** It is Mangomint's loudest complaint and the complaint about
   Mindbody too. PRD-013 and PRD-016 (custom reports, QuickBooks exports) target exactly this. But
   see section 9: reporting only differentiates once the underlying transactions are real.
6. **Serve teachers as users.** A teacher who loves the software lobbies for it. No competitor
   treats the instructor as a customer.

---

## 7. Threats

- **Mangomint expands into fitness.** They just ate their own add-on revenue to simplify pricing,
  which is what a company does when it is buying share. Group bookings already shipped. Raising the
  online group cap from 5 and adding recurring group services is a quarter of work, not a rewrite.
  If they ship real class scheduling with their UI quality, Tandava's "better domain model" argument
  gets much harder to sell.
- **The nightmare scenario:** Mangomint ships class scheduling, keeps the $120 + $10/user model but
  adds a flat "instructor" seat type at $2 to $3, and markets to boutique fitness. They would arrive
  with working payments, working payroll, native apps, and a support reputation Tandava cannot match
  for years.
- **Tandava's own breadth.** The more realistic threat is internal. Every month spent on inventory,
  UTM builders, and campaign A/B testing is a month the core booking-to-reconciliation path stays
  unverified. Mangomint got to where it is by doing less, better.
- **Support economics.** Mangomint's moat is support quality. A $99/mo managed service with
  business-hours email support cannot match it. Under-resourced support on a hosted product is worse
  than no hosted product.
- **Trial loss pattern.** A studio trials both. Mangomint's demo works. Tandava's demo is a
  prototype with simulated payments. Tandava loses on trust regardless of which has the better model.

---

## 8. Strategic implications

### Build
1. **Finish the money loop before anything else.** Publish class, purchase, book, attend, cancel,
   refund, reconcile. Verified, with tests, against a real database. `HOSTED_PRODUCT_REVIEW.md`
   already says this; this brief adds that Mangomint's existence does not change the order. Do not
   let a competitive matrix pull work forward.
2. **Promote login-free booking to Tier 1.** `COMPETITOR_ISSUES_PRIORITY.md` #3. It is the clearest
   borrowable win in the category and it compounds with every marketing dollar a studio spends.
3. **Scope appointment booking as a real Phase 7 item, not a maybe.** Provider-scoped deep links,
   provider availability, service durations and add-ons. This unlocks the pilates-privates and
   massage-side-business segments and it is the position nobody occupies.
4. **Publish the API as a product.** OpenAPI spec, signed webhooks with documented payloads, Zapier
   app. Cheap given the stack, structurally hard for Mangomint to answer.
5. **Keep spot/asset assignment on the roadmap and be honest that reformer studios are not served
   yet.** `HOSTED_PRODUCT_REVIEW.md` already takes this position. Hold it.

### Deprioritize
- Retail, inventory, purchase orders, campaign A/B testing, audience segments, advanced BI,
  on-demand video. All of it has UI and none of it is why a studio switches. Freeze it until the
  core is verified. This is the hardest recommendation in the brief and the most important one.
- Native apps. PWA is sufficient for pilot. Do not describe native apps as shipped anywhere.

### Differentiate vs. achieve parity

| Area | Posture |
|---|---|
| Class-native domain model | **Differentiate.** This is the whole thesis. |
| Teacher-as-customer | **Differentiate.** Unclaimed. |
| Self-hosting, data ownership, documented API | **Differentiate.** Structurally unmatchable. |
| Flat pricing, unlimited staff | **Differentiate.** Make it a headline. |
| Login-free booking | **Parity, urgently.** Table stakes you do not have. |
| Payments, POS, payroll | **Parity.** Required to be credible. Not a story. |
| Financial reporting | **Parity now, differentiate later.** |
| Interface quality and support | **Parity is the ceiling.** Mangomint wins here. Compete on fit, not polish. |
| HIPAA, charting, virtual waiting room | **Ignore.** Medspa requirements. Not your market. |

### Positioning adjustment

Stop leading with "open source." Lead with the outcome:

> Studio software that understands a class schedule. Flat price, unlimited teachers, and your data
> stays yours because you can run it yourself.

"Open source" becomes the proof point in L4, not the claim in L2. Studio owners buy the outcome; the
developers who contribute buy the mechanism. Those are two different audiences and the homepage is
written for the first one.

### Do not say

- Do not call Mangomint a data-hostage vendor. They advertise no contracts and open data ownership
  and reviews back it up. That attack is reserved for Mindbody.
- Do not claim Tandava beats Mangomint on UX. Not yet, and reviewers will check.
- Do not cite the $165/$245/$375 tiers. Dead since August 2026.
- Do not publish matrix 4a without matrix 4b. A comparison where you win everything is a comparison
  nobody believes.

---

## 9. What to monitor

| Signal | Why | Where |
|---|---|---|
| Mangomint raising the 5-client online group cap | The single clearest tell that they are entering class-based fitness | Their help docs and changelog |
| "Classes," "recurring group service," or "waitlist" in their release notes | Same | Their blog |
| Fitness or yoga language on their solutions pages | GTM intent before product ships | `/solutions/*` pages |
| Job postings mentioning fitness or studio verticals | Earliest available signal | Their careers page |
| A seat type priced below $10 | Would neutralize the pricing wedge | Pricing page |
| Any public API or OpenAPI spec | Would close the integration gap | Developer docs, apis.io |
| Financial reporting improvements | Would close their loudest complaint | Changelog, G2 reviews |

Suggested cadence: quarterly, plus an immediate re-read whenever they announce pricing or a major
release. Access to `mangomint.com` must be unblocked in the egress policy before the next pass; this
brief is weaker than it should be because of that.

---

## 10. Open questions

1. **Does `entertheoasis` actually run classes?** If this came from a studio evaluating both, that
   is a live data point worth chasing. If it is a spa, the whole comparison is less relevant than it
   looks.
2. **How much of the target segment is appointment-heavy?** If a meaningful share of prospects are
   pilates studios at 50%+ privates, appointment booking moves from Phase 7 to near-term.
3. **Is Tandava Cloud support staffed to compete on the one axis Mangomint wins?** If not, say so in
   positioning rather than losing trials on it quietly.
4. **Do any real prospects actually evaluate Mangomint?** This brief assumes they appear at the
   margins. One win/loss conversation would confirm or kill that assumption and is worth more than
   another round of desk research.

---

## Sources

Mangomint help documentation and announcements (accessed via search snippets; domain blocked for
direct fetch): group booking FAQ and overview, creating a group service, memberships and packages,
online booking overview and client perspective, payments and point-of-sale, 2026 pricing changes.

Third-party: [G2 Mangomint reviews](https://www.g2.com/products/mangomint/reviews),
[Capterra](https://www.capterra.com/p/187593/Mangomint/),
[SoftwareSuggest](https://www.softwaresuggest.com/mangomint),
[Pabau pricing analysis](https://pabau.com/blog/mangomint-pricing/),
[FinancesOnline tier breakdown](https://financesonline.com/mangomint-pricing/),
[Salon Today on the pricing model change](https://www.salontoday.com/articles/mangomint-rolls-out-a-simplified-pricing-model),
[API Evangelist audit of Mangomint's public API surface](https://github.com/api-evangelist/mangomint),
[Stripe customer case study](https://stripe.com/customers/mangomint),
[GlossGenius Vagaro vs Mangomint](https://glossgenius.com/blog/vagaro-vs-mangomint).

Tandava: `docs/FEATURE_INDEX.md`, `docs/HOSTED_PRODUCT_REVIEW.md`,
`docs/IMPLEMENTATION_HANDOFF.md`, `docs/STATUS.md`, `docs/roadmap/COMPETITOR_ISSUES_PRIORITY.md`,
`CLAUDE.md`.
