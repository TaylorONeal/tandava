# Tandava Studio: product completeness and hosted launch plan

> Historical code audit of `0af1c00`. Reconciliation with upstream `8d93c0d` found several blockers already implemented, including migration cleanup and booking/import/payment endpoints. See [current implementation status](IMPLEMENTATION_HANDOFF.md) before treating findings below as outstanding work. Product recommendations remain proposals.

Reviewed September 10, 2026. Proposal, not a statement of shipped capabilities or approved pricing.

## Recommendation

Build one open-source studio product, with an optional managed service called **Tandava Cloud**. Sell hosting, reliable operations, onboarding, and support. Keep the core studio workflows available to self-hosters without a Tandava subscription or license server.

Start with independent, class-based yoga and movement studios with one location. Support small multi-location businesses after validating the operating model. Reformer studios needing equipment assignment, appointment-heavy businesses, franchises, and video-first businesses have additional requirements; do not initially claim to replace their entire system.

The current repository is a substantial interactive prototype and backend foundation. It is **not yet a production-complete replacement** for Momence, Mindbody, or Arketa. Adding a signup page and Stripe subscription would not close that gap. First establish a reliable path from published class to purchase, booking, attendance, cancellation/refund, and financial reconciliation.

Recommended commercial sequence:

1. Accurate demo and reproducible self-hosted release.
2. Small, assisted hosted pilot using studio subdomains.
3. Self-service hosted signup, billing, migration, and support.
4. Custom domains and proven retention workflows.
5. Shared member app; separately priced studio-branded apps only after demand and operating costs are validated.

## Evidence and limits

Code reviewed at local commit `0af1c00`. Inspected the public demo at [tandava-flame.vercel.app](https://tandava-flame.vercel.app), including landing, owner dashboard, schedule, and front-desk pages, with desktop and 390px mobile screenshots. Sidebar navigation to the schedule worked. The deployed landing includes Blog and Website Embed entries not present in the reviewed local landing source, so deployment and checkout are not assumed identical.

This is a product and implementation readiness review, not a full security audit, payment certification, or exhaustive acceptance test. Competitor facts below come from public vendor pages accessed on the review date; marketing claims are not independent verification. Prices are region-, plan-, and billing-period-specific. Proposed Tandava prices and targets are hypotheses.

No database migration or live payment was run. A clean `npm ci --ignore-scripts` failed because `package-lock.json` has inconsistent `picomatch` entries: locked 2.3.1 does not satisfy 4.0.7, with missing 2.3.2 entries. Tests and build were therefore not run. This is a reproducibility finding, not a test failure in business logic.

## 1. Completeness of the open-source product

Use four release labels consistently: **demonstrated UI**, **backend foundation**, **verified end-to-end**, and **planned**. A screen, SQL table, or success toast is not evidence of the third label. Avoid an overall completeness percentage until each required workflow has an acceptance test.

| Studio job | Evidence in this checkout | Assessment and release requirement |
|---|---|---|
| Schedule recurring classes and substitutions | `src/pages/manage/ScheduleManage.tsx` starts from `mockSchedule`, mutates local state | Demonstrated UI. Persist occurrences, validate teacher/room conflicts, handle studio timezones and DST, and distinguish one-instance edits from recurring-series edits. |
| Book, cancel, and join a waitlist | `src/components/booking/BookingModal.tsx` uses mock payment sources and simulated delays | Demonstrated UI. Atomic capacity and entitlement checks, duplicate prevention, cancellation rules, and durable waitlist promotion are launch requirements. |
| Sell memberships and packs | Financial UI, schema, Stripe helpers and webhook | Backend foundation. Implement checkout, renewal, failed payment recovery, pack ledger, expiry, pause/cancel, refunds, and reconciliation. |
| Check members in | `src/pages/staff/StaffCheckin.tsx` maintains a local checked-in set | Demonstrated UI. Persist attendance; show the same roster to owner, teacher, and front desk. Counts must be scoped to class, not whichever class is selected. |
| QR check-in | `src/components/CheckInQRCode.tsx` explicitly draws a placeholder pattern | Not a working QR credential. Use real encoding, server validation and expiration; local `vercel.json` currently disables camera access. Manual check-in can launch first. |
| Member profiles and waivers | Profile screens and database structures | Partial. Verify registration, consent/versioned waiver records, emergency contacts, editing permissions, and export. |
| Instructor management and pay | Availability, substitutions and earnings screens | Demonstrated UI. Verify persisted assignments and payroll calculations against attendance; distinguish payroll reporting from paying staff. |
| Authentication and authorization | Real Supabase auth adapter exists; AuthContext falls back to demo if backend is unconfigured | Foundation, not “mock only.” Missing configuration must fail closed outside explicit demo mode. Per-studio authorization needs verification. |
| Import an existing studio | `src/pages/manage/Import.tsx` uses fixed mappings and simulated results of 347 rows | Demonstrated UI. Real CSV parsing, preview, deduplication, error download, resumability, and reconciliation are required. Do not advertise completed migrations from six vendors. |
| Email/SMS and retention | Provider abstractions, templates, campaigns and SMS screens | Partial. Needs triggers, durable delivery, suppression/consent, retries and delivery status. Launch transactional email before bulk campaigns or SMS. |
| Financial and retention reporting | Extensive dashboards and sample figures | Demonstrated UI. Reconcile actual payments/refunds and define metrics before using reports for operating decisions. |
| Retail, advanced marketing, video | Screens, types, PRDs and schema | Later scope. They broaden the demo without establishing a reliable core. |
| Self-host installation and upgrades | Deployment docs, static frontend architecture, migrations | Incomplete release path. Clean install currently fails; conflicting schema tracks need reconciliation and upgrade/restore verification. |
| Hosted tenant creation and billing | Onboarding and admin screens; studio slugs and Connect fields | Scaffold. No verified tenant provisioning, hostname routing, platform subscription entitlement, or publish workflow found. |
| Mobile apps | PWA manifest/service worker and architecture docs | Web foundation. No native project or Capacitor dependency was found in this checkout. Do not describe native apps as shipped. |

### Critical blockers before any real studio depends on it

**Conflicting database foundations.** `supabase/migrations/00001_initial_schema.sql` and `001_initial_schema.sql` both create `user_role`, `profiles`, `studios`, `bookings`, and other core structures, with incompatible roles and models. Applying both as one migration chain is not a coherent bootstrap. Choose a canonical model and provide explicit migration paths for any existing installations; do not simply delete history on a deployed database. Generate application types from that model.

**Payment delivery can be lost or duplicated.** `src/lib/stripe.ts` invokes `stripe-checkout` and `stripe-portal`, but matching functions are absent from the checked-in functions directory. The webhook logs write errors and still acknowledges receipt with HTTP 200, and class-pack handling inserts without a visible processed-event guard. Add idempotent event processing, durable retry/replay and account-to-studio validation. Reconcile successful payments even when a browser closes before returning. Verify subscription data against the chosen schema and current SDK.

**App access and tenant isolation are not proven.** In `src/App.tsx`, platform admin routes use `ProtectedRoute`, while management, teacher and staff routes are mounted without equivalent wrappers. Client guards are only navigation protection; database and server authorization remain mandatory. Check owner/staff/member access across two studios, including exports, storage, background jobs and payment events. Global profile roles cannot substitute for membership roles scoped to a studio.

**Onboarding success is simulated.** `src/pages/manage/Onboarding.tsx` saves progress to local state and displays a launch toast without provisioning. The backend `DataProvider` exposes profile retrieval and message creation, not the operational studio CRUD suggested by the UI. Connecting credentials alone does not make the application production-ready.

**Documentation overstates readiness.** README says “not a hosted SaaS” and “no onboarding wizard,” while a wizard UI exists. The roadmap marks Stripe integration complete; STATUS says auth is mock-only and staff routing/lazy loading are missing, although current code contains them. Establish a single release-status matrix and link claims to working acceptance tests. Keep the old feature backlog, but stop treating its checkmarks as release evidence.

### Minimum credible open-source release

An independent developer must be able to follow the documented install on a clean machine, create an owner and studio, connect their own payment/email providers, publish a class, sell a pack or membership, book and cancel, check in, export records, back up, restore, and upgrade a pinned release. Document infrastructure costs and responsibility for maintenance. No managed account should be required for core operations.

## 2. Competitive assessment

| Alternative | Relevant public offering | What Tandava should learn |
|---|---|---|
| Momence | Bookings, payments, behavior-driven marketing, connected customer history, shared and branded apps. Studio pricing is quoted. [Features](https://www.momence.com/), [pricing](https://www.momence.com/pricing-2/) | Connected workflows matter more than separate feature screens. Show attendance leading to an appropriate follow-up and repeat purchase. |
| Mindbody | Booking/payments, website widgets, consumer discovery, reporting; higher tiers add resource/spot management and marketing; branded app add-on. [Plans](https://www.mindbodyonline.com/business/pricing) | Marketplace distribution is a separate advantage that a new app does not recreate. Do not promise comparable customer acquisition. |
| Arketa | Studio Core includes operations, POS and payroll reporting; Growth adds campaigns, workflows and leads; Suite adds branded web/app experiences. Studio prices are custom. Its $49 annual-billing individual offer is not a studio quote. [Plans](https://www.arketa.com/pricing) | Brand continuity and guided launch are part of the product. Organize the experience around “run, grow, retain.” |
| TeamUp | Memberships/packs, appointments, waivers, family accounts, payments, reporting and support. Pricing page displayed $189/month for 101–200 active customers; branded app $99/month. [Pricing](https://goteamup.com/pricing) | A transparent, dependable core is a serious competitor. Family accounts and operational edge cases matter more than adding speculative AI. |
| Walla | Core displayed $320/month/location, with unlimited users, retention intelligence, reporting and support. [Pricing](https://www.hellowalla.com/pricing) | Owners pay for retention and help operating the system. Tandava must define its own support promise precisely. |
| Momoyoga | Yoga-focused plans: Standard €29 and Plus €59/month billed annually; recurring memberships appear in Plus. Free plan adds a 5% platform fee to processor charges. [Pricing](https://www.momoyoga.com/en/pricing) | “Cheaper than Mindbody” is insufficient positioning: lower-priced, focused alternatives already exist. Win on ownership, trustworthy operations and service. |

Tandava has substantial **interface breadth**, but the alternatives package functioning operations, migration assistance, delivery infrastructure, billing recovery, and support. Those are the largest competitive gaps. Open source is a meaningful ownership benefit; it does not replace operational reliability.

Prioritize reliable group-class workflows and easy switching. Add equipment/spot assignment before targeting reformer-heavy studios; appointments before private-session businesses; family accounts before children's programs. ClassPass or other distribution integrations require actual access and commercial arrangements, not just connector UI.

## 3. Demo and navigation fixes

The dark visual system and role views provide a useful foundation. The current acquisition flow prioritizes developers: the first headline asks visitors to “fork, deploy, and own,” the tech stack appears early, and “Not yet for” excludes the hosted customer. Twenty flat owner-sidebar entries then put purchase orders and UTM tools beside essential daily work.

### Positioning and acquisition navigation

Use **Tandava Studio** for the open product and **Tandava Cloud** for managed hosting. Domains below are examples until ownership and brand decisions are confirmed.

Proposed hero: **“Run your studio. Keep your independence.”**

Supporting copy: “Scheduling, memberships and studio operations—with your brand and your data. Host it yourself, or let Tandava handle hosting, updates and support.”

During development, add visible status: **“Interactive preview. Managed hosting is in development.”** Primary CTA: **Explore the studio demo**. Secondary CTA: **Join the hosted pilot**, only once a real lead-capture endpoint and follow-up process exist. Permanent tertiary link: **Self-host / View source**. Once hosted gates pass, replace the pilot CTA with **Start your studio** and disclose trial terms.

Top navigation: **Product · Demo · Pricing · Self-host · Help**, with **Sign in** and the current signup/pilot CTA. Pricing should compare responsibilities, availability and costs, not imply that hosted service already exists.

Replace “self-host forever at no cost” with “No software license fee. You provide hosting, provider accounts, updates and operations. Community documentation is included; managed support is optional.” Avoid claims that all competing vendors charge per member or prevent export.

### Fix the existing tour before adding a new library

`GuidedTour.tsx` is mounted through `DemoPanel.tsx`, but App explicitly removed DemoPanel in favor of DemoRoleBar. Thus the active app does not mount that tour. Its owner route `/manage/members` is also unregistered; the list route is `/manage/students`. “Next” changes the step but does not navigate.

Recommended interaction: an **optional, dismissible task checklist**, with one short contextual hint at a time. Use a side panel on desktop and a collapsed bottom sheet on mobile. Avoid a mandatory sequence of spotlight bubbles that covers controls and requires constant positioning maintenance.

Default to the owner story. Keep instructor/front-desk/member views as secondary perspectives, with explicit role transitions when demonstrating a shared workflow.

| Demo task | User action | Proof of value |
|---|---|---|
| Publish your week | Add a sample class | Class appears on both owner and member schedules. |
| Turn an inquiry into a booking | Open member view; use a sample intro offer | Booking appears in the same class roster; display “simulated payment.” |
| Run the front desk | Check the sample member in | Roster and attendance update consistently across roles. |
| Bring someone back | Preview an expiring-pack reminder | Show the audience, message, next booking link, and example result; do not imply an email was sent. |

End with **“Use Tandava for your studio”**, offering hosted pilot/signup and self-host docs. Let visitors explore freely, restart, skip tasks and resume. Measure completion by the actual demo action, not “Next” clicks.

Use one shared demo dataset and reducer/store for the story. Today different pages hardcode different teachers, classes, studio names and totals. Persist demo changes only in a namespaced local sandbox with a clear reset action; never copy sample members or transactions into a real tenant.

### Owner information architecture

| Primary item | Contents |
|---|---|
| Today | Classes, check-in, urgent issues and next setup step |
| Schedule | Classes, offerings, events, substitutions |
| People | Members, leads, instructors and staff |
| Sales | Memberships, packs, transactions, refunds; retail only when enabled |
| Grow | Intro offers, referrals, retention, campaigns; UTM tools in advanced settings |
| Reports | Revenue, attendance, retention, export and metric definitions |

Keep **Settings & billing**, **Help**, and **View booking site** in a consistent secondary area. Place import in onboarding and Settings → Data. Nest inventory/purchase orders under retail. Use “Members” consistently in navigation; studio-specific terminology can be configurable later. Consolidate the two ManageLayout implementations so advanced pages do not change navigation patterns.

### Prioritized demo fixes

| Priority | Fix | Acceptance evidence |
|---|---|---|
| P0 | Make simulated vs available vs planned behavior explicit | No fake import, payment, notification or launch action is presented as real. |
| P0 | Restore task-tour entry and valid routes | Start, skip, resume, reset and finish work; changing role does not leave a stale step. |
| P1 | Consolidate owner navigation and branding | One layout, one fictional studio, no separate conflicting sidebar vocabulary. |
| P1 | Make mobile demo controls understandable | Role buttons have accessible names and at least 44px touch targets; mobile home/exit-demo control remains visible. Current mobile snapshot has unnamed role buttons. |
| P1 | Fix stacked sticky headers | Role bar, header and drawer have coordinated offsets; keyboard focus is not hidden under them. |
| P1 | Make action links complete their advertised action | “Add class” opens the add form; expiring-pack links open the intended filtered members, with a next action. |
| P1 | Add a real commercial next step | Hosted CTA captures interest or creates a real draft studio, appropriate to launch phase. |
| P2 | Reduce decorative dashboard interruption | Today's work comes first; sample growth insights do not push operational content below the first screen. |

Website embeds deserve a separate implementation check: the live landing advertises one, but the local Vercel config denies framing. A future iframe embed requires a deliberately scoped route/policy; a script-rendered widget has different requirements. Do not weaken all management-page headers to enable booking embeds.

## 4. Hosted onboarding and communication

Offer a **14-day private setup trial without a card** as the initial hypothesis. Let owners preview their own branded schedule immediately. Require a paid hosting subscription and payment readiness before public paid bookings. This is intentionally a setup trial; say so plainly. Test whether that restriction hurts conversion during the assisted pilot.

1. **Create account:** verify email; ask name and studio name. Ask operating country early to confirm payment availability. Separate marketing opt-in from required service communication.
2. **Create draft studio:** allocate a unique slug and show `yourstudio.<hosting-domain>`. Confirm timezone/currency; browser location is only a suggestion. Persist each step and allow resumption.
3. **Show a branded preview:** logo/color optional, sensible defaults. Sample preview content remains separate from production records.
4. **Build one bookable offering:** class type, instructor, date/time, capacity, drop-in or intro price. Defer detailed payroll, retail and campaigns.
5. **Connect payments:** use Stripe's hosted Connect onboarding. Distinguish “connected” from “charges enabled”; show outstanding verification requirements and resumable links.
6. **Bring members:** choose start fresh, self-service CSV, or assisted migration. Show import preview, exact errors and totals before committing. Card tokens are not CSV data; payment-method migration requires processor-supported arrangements.
7. **Preview the member journey:** test booking, confirmation, cancellation and refund in test mode. Display outstanding launch requirements rather than a generic completion percentage.
8. **Activate hosting and publish:** Stripe Checkout for Tandava's fee, webhook-confirmed entitlement, final readiness check, then public URL and a copyable booking link for the studio's current website/social profiles.

The first activation metric is **first genuine member booking**, followed by a successfully reconciled payment and first week of classes. Wizard completion alone is not activation.

Keep three communication streams separate:

| Stream | Initial messages | Rules |
|---|---|---|
| Tandava → owner | Verification, resume setup, payment verification pending, publish confirmation, hosting invoice/failure, incident and release notices | Deep-link to the unfinished action. Stop onboarding nudges after completion. Critical service notices are distinct from promotional consent. |
| Studio → members | Welcome, booking/cancellation, reminder, waitlist offer, receipt/refund | Branded sender display name, verified platform sending domain initially, studio Reply-To. Durable outbox, dedupe, delivery logs and bounce suppression. |
| Studio → prospects/members marketing | Intro-offer follow-up, pack renewal, win-back | Opt-in/opt-out and frequency controls, quiet hours where relevant; no automatic bulk sends during import. SMS later with explicit budgets and compliant registration. |

Build an in-product **Launch checklist**, context-sensitive Help, and a small searchable help center before a general-purpose support chatbot. Support requests should attach studio ID, page and request ID with user-visible context, not secrets or payment data. Publish supported hours and realistic response expectations; a solo operator should not promise unlimited live chat or 24/7 human service.

## 5. Hosting architecture and low-cost operations

Retain React/Vite and Supabase for the first release. A Next.js rewrite is not necessary to allocate subdomains. Use one shared frontend deployment, one production database initially, and tenant-scoped data. Keep a separate staging environment; the public demo must use synthetic data and cannot send real payments/messages.

```text
Marketing site → hosted signup / billing / studio selection
                          ↓
             shared tenant application
       studio-a.<host>   studio-b.<host>
                          ↓
        Supabase Auth + PostgreSQL + Storage
                          ↓
   booking transactions · outbox worker · payment webhooks
            ↙                           ↘
  Tandava platform billing       studio Connect accounts
```

Do not create a database, Vercel project or code fork per hosted studio. Studio-specific configuration belongs in data; all hosted studios run a tested release. Shared infrastructure lowers the fixed cost but increases the impact of an isolation bug, so cross-studio tests are a release gate.

### Domain and tenant resolution

Use a wildcard hostname on an owned domain from the hosted pilot onward. Vercel documents wildcard configuration and currently requires nameserver verification for the standard setup. One wildcard registration serves studio subdomains; adding a studio should usually be a database operation, not a deployment. Preserve existing DNS/mail records when configuring the domain. [Vercel domain setup](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

Proposed records: extend `studios`; add `studio_domains` (normalized hostname, studio ID, verification state, primary flag), `platform_subscriptions`, `onboarding_progress`, `provisioning_jobs`, `processed_payment_events`, and a notification outbox. Reuse existing structures where equivalent; reconcile the schema before adding tables.

Enforce globally unique slugs/hostnames, reserved names (`www`, `app`, `admin`, `api`, `demo`, `support`, etc.), and studio ownership. Unknown or inactive hosts return a safe not-found/unavailable response, never another studio. Hostname lookup determines public branding; authorization still checks authenticated studio membership. Scope query caches, storage, jobs and logs to studio ID. Public tenant responses must not expose provider secrets.

Use tenant-local sessions initially. Do not assume Supabase localStorage sessions automatically work across subdomains or custom domains. Provide an explicit studio switch/login experience. If central sign-on becomes necessary, implement a short-lived, single-use server-validated handoff rather than putting bearer tokens in URLs or broadly sharing cookies.

Keep management login on stable platform-controlled URLs when adding custom booking domains. Custom domains later need ownership verification, TLS provisioning state, removal/reassignment protection, canonical redirects, and health checks. Browser origin changes also affect login, service-worker caches and installed PWAs; migration requires an explicit user experience.

### Provisioning and operations

Create owner membership and draft studio transactionally, using a request idempotency key. Track `requested → provisioning → ready` and a recoverable failure state. Separate that from `draft/published` and billing status. Refreshing signup must not create duplicate studios or subscriptions. A small admin screen needs retry, view readiness, resend invitation, inspect payment/email failures, suspend abusive signup and export tenant data, with audited actions.

Run one release pipeline and migration process. Schedule reminders and reconciliation centrally in batches; do not create a cron job per studio. Index `(studio_id, time/status)` for frequent queries. Limit photo sizes, paginate reports and avoid loading all members into the browser. Delay hosted video, SMS, AI and permanent realtime connections until paid demand justifies their variable cost.

Daily database backup is not a complete recovery plan: test restoration, back up uploaded assets and configuration, and document tenant-level export/restore. Set cost alerts and usage limits, but do not let an unreviewed spending kill switch silently disable live bookings.

### Planning budget

Published entry prices are [Vercel Pro $20/month](https://vercel.com/pricing) and [Supabase Pro $25/month](https://supabase.com/pricing), with usage/compute limits and additional costs. The $45 combined figure is a starting platform baseline, not a per-studio quote or full operating budget.

For the small pilot, reserve **$75–150/month total infrastructure** as a planning allowance for hosting, database, staging, transactional email, monitoring and backup storage. Validate against actual vendor selections and traffic. It excludes staff time, taxes, Stripe fees, SMS, video and unusual migration work. Never promise a fixed number of studios fits on the smallest database without load testing.

At 10 studios paying $99, MRR is $990. An illustrative $150 infrastructure bill leaves $840 before payment fees, support and other expenses. Ten studios requiring one hour/month at an internal $50/hour cost consume another $500. Support efficiency and onboarding quality are therefore more important to margin than shaving a few dollars off static hosting.

## 6. Stripe and pricing

There are **two different billing relationships**:

| Relationship | Proposed implementation |
|---|---|
| Studio pays Tandava for hosting | Customer/subscription on Tandava's Stripe account; Checkout, Billing and Customer Portal. Server-side plan IDs and webhook-derived entitlements. |
| Member pays a studio | Studio connected account, initially favoring direct charges and studio-owned customer/subscription records where supported by the chosen configuration. |

Stripe documents SaaS subscriptions and Connect as separate money flows. Resolve the current supported account/controller configuration during implementation; existing “Standard” comments are not enough to settle fees, liability or available countries. Do not claim Tandava has no payment responsibilities solely because it uses direct charges. [Stripe subscriptions with Connect](https://docs.stripe.com/connect/subscriptions), [direct charges](https://docs.stripe.com/connect/direct-charges)

Use separate platform-hosting and member-purchase handlers/event classifications. Enforce event uniqueness, account-to-studio mapping, test/live separation, authenticated portal creation, and reconciliation. Prices and entitlements must come from the server. A Checkout return URL is not proof of payment. Handle pending/failed payments, refunds, disputes and out-of-order events.

**Proposed launch offer, in USD; validate with paid pilots:**

| Offer | Price hypothesis | Scope |
|---|---|---|
| Self-host | $0 software license fee | Same released core workflows; operator pays infrastructure/providers and maintains installation. Community docs/issues; no included private support. |
| Tandava Cloud | $99/month for one location | Managed subdomain, updates, backups, core workflows, transactional email within published limits, and business-hours email support. No Tandava percentage fee on studio sales proposed; processor/provider fees remain. |
| Guided launch | $299 one-time, optional | One setup session and one standard-format member import with a written scope. Complex migration is quoted separately. |

Launch one paid subscription rather than three artificial feature tiers. Do not sell unlimited email, SMS, storage or customization. Publish usage allowances before sales begin. Additional locations can be tested at +$49/location/month after multi-location workflows are reliable. Defer annual plans until retention/support economics are known; do not use a lifetime deal to finance ongoing service obligations.

At cancellation, provide an explicit export and migration window. Explain what happens to the public booking page and member subscriptions separately: cancelling hosting must not silently cancel studio memberships, nor leave owners unaware that billing may continue at Stripe. Provide documented continuity/offboarding steps, data retention/deletion rules, and an assisted path where needed.

Open-source positioning also needs source/license notices and a clear trademark policy. Selling service does not require closing the product. Payment tokens, third-party subscriptions and unsupported custom forks cannot be promised to migrate as easily as ordinary CSV records.

## 7. Growth priorities and measurement

First sell **“your branded booking page, predictable hosting, and help switching”**. Ownership supports trust; it is not a substitute for a clear operational benefit. Keep technical installation instructions on the self-host path. An owner should not need to learn Supabase, Git or DNS during hosted onboarding.

Start with 3–5 design-partner studios matching the narrow class-based scope. Observe setup and the first week of operations, record repeated support needs, and ask for payment after the core is trustworthy. Build real case studies from measured outcomes, not fictional studio statistics. Avoid broad paid acquisition while activation or reliability is unresolved.

Prioritize studio growth tools in this order: intro offer → first attendance → second visit → pack/membership conversion → expiring pack/failed-payment recovery → win-back. Start with three editable templates, transparent audience rules and one-click review before sending. Defer a general campaign builder and AI scoring until these basic loops work.

Track `demo_started`, `demo_task_completed`, `hosted_interest_submitted`, `signup_verified`, `studio_draft_created`, `offering_created`, `connect_ready`, `hosting_activated`, `studio_published`, `first_paid_booking`, and `first_week_completed`. Server-confirm financial milestones; never treat a toast as conversion. Do not put member names or health information in analytics payloads.

| Measure | Initial decision target, not a claimed benchmark |
|---|---|
| Branded preview | Median under 10 minutes after verified signup |
| Unassisted setup | At least 4 of 5 target owners can publish without developer intervention before broad self-service launch |
| Demo comprehension | Evaluators can explain both hosted and self-host options and identify simulated features |
| Operational accuracy | No duplicate charges/entitlements or overbooking in race/replay tests |
| Support load | Trend toward under 30 minutes per active studio per month after onboarding |
| Commercial viability | Positive contribution after infrastructure, billing costs and realistic support allocation |

Segment new studios from migrations; their time-to-value differs. Use small-sample interviews first, then compare conversion cohorts when traffic supports meaningful conclusions. Referral programs and agency/developer partners can follow proven activation; marketplace demand generation is a later business, not a launch assumption.

## 8. App choices by phase

| Phase | Available option | Reason / gate |
|---|---|---|
| Pilot and hosted launch | Responsive member/staff web; studio-branded installable PWA once verified | One release path and low cost. Correct tenant manifest, icons, start URL, install help and logout/cache handling are required; the current generic manifest is insufficient. |
| Established hosted service | Shared Tandava member app with studio code/link, favorites, bookings and notifications | One store release per platform. Build when repeat use and notification needs justify native maintenance; it is a companion, not automatically a discovery marketplace. |
| Later paid add-on | Studio-branded iOS/Android apps from a maintained common codebase | Gate on committed paying demand, release automation and app support capacity. Charge setup plus recurring maintenance; price after measuring actual costs. |
| Separate later decision | Public studio discovery marketplace | Requires geographic supply/demand density, ranking, moderation and acquisition economics. Studios should opt in. |

Do not initially offer both a shared native app and white-label apps. Begin with the branded web/PWA, then the shared member app. Owners and staff can remain on mobile web until a specific native need emerges.

For self-hosters, the local PWA should work independently. Do not promise inclusion in the managed shared app; that would require compatible API versions, trusted endpoints and a support/distribution policy. A future published app source/build guide is a separate possibility.

Apple's template-app rule 4.2.6 affects who submits branded apps; its physical-services rule differs from digital content purchase rules. Plan studio-owned developer accounts/content-provider submission for branded apps and review both Apple and Google policies at implementation. Start native scope with physical class bookings; paid video/livestream entitlements require a separate store-billing design. Store acceptance is not guaranteed. [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/)

## 9. Delivery backlog and release gates

These phases replace feature breadth as the execution order. Existing PRDs remain a backlog, not proof of readiness. Sequence by gates rather than unsupported delivery dates.

| Phase | Deliverables | Exit gate |
|---|---|---|
| 0 — Truthful preview and release foundation | Correct status claims; demo task navigation; consistent dataset; clean lockfile; canonical migrations/types; explicit demo isolation | Clean install/build; clean database bootstrap and upgrade test; demo actions labeled; no unconfigured production deployment silently enters demo. |
| 1 — Operable open-source core | Persisted scheduling, members, booking/cancel/waitlist, entitlements, Stripe, attendance, transactional email, export, backup/restore | Independent install and a full studio operating loop succeed; payment replay, capacity race and two-studio access tests pass. |
| 2 — Assisted hosted pilot | Shared app/database, wildcard subdomains, resumable provisioning, platform billing, readiness checks, support/admin tools | 3–5 studios complete real operations and a billing cycle; restore/reconciliation verified; costs and support load measured. |
| 3 — Self-service hosted launch | Public pricing, no-code onboarding, standard CSV import, help/checklist, automated billing/offboarding | Target owners can launch without a developer; first paid booking and member confirmations work; repeated setup failures are resolved. |
| 4 — Brand and retention expansion | Custom domains, verified sender domains where justified, intro/renewal/win-back loops, multi-location packaging | Domain failures recover safely; automation consent/delivery and retention results verified. |
| 5 — App expansion | Shared native app first; branded app offering only after commercial validation | Demonstrated native use case, maintainable release process, store review and positive support economics. |

First implementation tickets: **(1)** reconcile status and release claims, **(2)** repair reproducible install and database baseline, **(3)** specify/test the booking and payment state machines, **(4)** replace demo-local core mutations with persistent operations, **(5)** restore the optional task demo, **(6)** build hosted provisioning and separate platform billing after the core gate.

The highest-value product decision is to make one studio reliably launch and operate. Custom domains, more dashboards, and native apps should follow evidence that this works.
