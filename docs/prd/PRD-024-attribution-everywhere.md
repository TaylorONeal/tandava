# PRD-024: Attribution everywhere, one linked view

## Overview
**Priority:** P0 for the pilot. Every other growth feature (Express Booking, the Network, privates, campaigns, landing pages) is judged by numbers this produces. Without it, a studio owner cannot tell what works, and neither can we.
**Status:** Phase 1 built (branch `feat/attribution-phase1`, migration 00035; built as 00025, renumbered after main's 00025 to 00034), not yet deployed or verified on a live database. See "Phase 1 as built" below and "What exists today" for the inventory before it.
**Origin:** Taylor, Oct 8 2026: attribution analytics is very important; check it for all the pages and apps and create a comprehensive interlinked view.
**Relationship to `ATTRIBUTION_TRACKING.md`:** that file is the technical design for sessions, touchpoints, models and queries. This PRD is the product contract: what gets captured on every surface, how it links into one journey, what the owner sees, and what is true today. Where they disagree, this file wins and the other gets updated.

---

## Phase 1 as built (Oct 8 2026)

| Piece | Where |
|---|---|
| Visit capture on storefront, booking page and embed (visitor id in localStorage, 30-minute session per studio, new session on tagged arrival); channel computed server side; no IP or user agent stored | `src/lib/analytics/session.ts`, `landing.ts`, `supabase/functions/analytics-session`, `record_session()` |
| Embed handoff: the Book link carries the visitor id (`tv`) and tags the parent site as the source | `withEmbedHandoff()` in `landing.ts`, `EmbedSchedule.tsx` |
| One person, many browsers: `link_visitor()` from express-book, `link_my_visitor()` on every sign-in (once per browser session) | `AuthContext.tsx`, `linkVisitorOnce()` |
| Conversions with frozen first and converting touches, deduped per entity: guest and member bookings, drop-ins, memberships, packs, event registrations; `studio_members.source` and acquisition set once | `record_conversion()`, `express-book`; paid ones by `stripe-webhook` after main's SQL fulfilment (`record_checkout_conversion()`, `record_renewal_conversion()` on `invoice.paid`); member bookings by a bookings trigger reading the page's session header (`book_class`, `book_class_auto`, `book_free_class`) |
| Consent from the booking form's marketing checkbox, append-only, latest wins | `record_consent()`, `has_consent()` |
| Owner report: channel → source/campaign, first or last visit, 30/90 days | `/manage/analytics/sources`, `get_attribution_sources()` |
| "How they found you" on member detail | `MemberSourceStrip`, `get_member_attribution()` |
| Tests | `scripts/db/test-attribution.sql` (SQL behaviour, run by `npm run test:db`), `src/lib/analytics/*.test.ts` |

Not in phase 1: landing pages, blog, emails' own clicks beyond UTM tags, the apps, journeys and funnel views, the per-feature channel pages.

## What exists today (checked Oct 8 2026, main at b47daf3 plus PRs #67/#68)

| Piece | State |
|---|---|
| `analytics_sessions`, `analytics_daily` (migration 00003) | Schema only. **Nothing writes to them.** |
| `link_clicks`, `utm_templates`, `landing_page_variants` (00008) | Schema only. UTM builder UI (`/manage/utm-builder`) renders; no click is recorded anywhere. |
| `/manage/analytics/site` and the Analytics Hub | Mock data. |
| `ATTRIBUTION_TRACKING.md` (735 lines) | Design for `visitor_sessions`, `attribution_touchpoints`, `conversion_events`, four attribution models, reporting SQL. Tables in it differ from the ones in 00003 (`member_profiles` vs `profiles`, `visitor_sessions` vs `analytics_sessions`). Never reconciled. No migration. |
| Express Booking (PRD-020) | The **only** live capture: `utm_source/medium/campaign` from the booking URL into `express_booking_claims`, and the guest's `studio_members` row tagged `express-booking`. No referrer, no landing page, no visitor id, no first touch. |
| `studio_members` | Has `tags`; no `source`, no first-touch columns. Self-registered members get no row at all (PRD-022 gap). |
| `transactions`, `memberships`, `class_packs`, `event_registrations` | No attribution columns. A membership cannot be traced to the Instagram post that started it. |
| Member app / owner app | Do not exist yet (STORE-APPS.md). No install attribution. |
| Third-party analytics | None, by design (privacy posture; Sentry is error reporting only). Keep it that way: first-party capture, no ad pixels by default. |

So: a good design document, an empty schema, one real capture point, and no view. The gap is not ideas; it is the plumbing from page to person to purchase.

---

## Jobs to Be Done

### Job 1: Owner — which post, ad, link or partner brought me paying people
**When** I spend money or time on marketing,
**I want** to see bookings, members and revenue by source, campaign and landing page,
**So I can** do more of what works and stop what doesn't.

### Job 2: Owner — see the whole journey, not a pixel
**When** someone finally buys a pack,
**I want** to know they first came from Instagram three weeks ago, booked a drop-in from the embed, claimed an account, and bought from the follow-up email,
**So I can** judge the top of the funnel by what it eventually produced.

### Job 3: Tandava — prove the platform's own features
**When** we say Express Booking or the Network converts,
**I want** that measured the same way for every studio,
**So I can** show value in the product and in the sales conversation with the next studio.

### Job 4: Member — not be surveilled
**When** I book a class,
**I want** the studio to know I came from its own Instagram link, and nothing more than that,
**So I can** trust the booking page the way I trust the front desk.

---

## The model: one visitor, one journey, frozen at conversion

Three ids, each outliving the one before:

| Id | Lives where | Created when | Links to |
|---|---|---|---|
| **visitor_id** | localStorage (first-party, per origin) and `analytics_sessions.visitor_id` | First page view on any Tandava surface | Sessions |
| **profile_id** | `profiles` | Guest identity (PRD-020) or signup | One profile, many visitors: `profile_visitors (profile_id, visitor_id, linked_at)`. The visitor that created the identity is linked first; every later sign-in on another browser, a reset browser or the app links that device's visitor too. Links are added, never replaced |
| **studio relationship** | `studio_members` (profile, studio) | First booking, purchase or signup at that studio | Carries `source`, first-touch and converting-touch for *that studio* |

A visitor can be anonymous for weeks. The moment they become a profile (express booking, signup, network booking), every session from any visitor linked to that profile is theirs. A person's **journey** is the union of sessions across all their linked visitors; the earliest session in it at the moment of a conversion is the **first touch** for that conversion, and the session containing the conversion is the **converting touch**. Both are frozen onto the conversion row so later re-processing cannot rewrite history, matching `ATTRIBUTION_TRACKING.md`'s `conversion_events` idea but on the existing tables. Linking a new device later extends the journey from then on; it does not reopen conversions already recorded, and a device linked *after* a conversion does not change that conversion's first touch even if its own sessions are older (the person was anonymous on it when they converted elsewhere; that history is reported as "linked later", not rewritten).

**Conversions** (each writes a `conversion_events` row with value and the frozen touches): guest booking, member booking, account claimed, signup, pack purchase, membership start, membership renewal (no touch; retained), workshop or retreat registration, private request accepted, network credit purchase (Tandava-level), network booking (studio-level), first check-in.

**Models:** first touch, last touch, linear, and position-based (40/20/40), computed at query time from the touchpoints, selectable on the report. Default view shows first and last side by side, because owners ask both "where do people come from" and "what closes".

---

## Every surface, what it captures, how it links

The point of this table is that nothing is left out. If a surface is missing here, it is missing from the owner's view.

| Surface | Capture | How the id survives | Status |
|---|---|---|---|
| **Studio page** `/s/:slug` | Session start: landing path, referrer, UTMs, device, coarse geo (edge), studio id | visitor_id in localStorage | Not built |
| **Express Booking** `/s/:slug/book/:id` | Same, plus `booking_start` touchpoint on form focus, `booking_submit`, outcome | Already captures UTMs into the claim row; add visitor_id and referrer | Partial (PRD-020) |
| **Stripe return** `?booked=1` | `payment_complete` touchpoint; the webhook writes the conversion with the frozen touches from the claim row | `express_booking_claims.stripe_checkout_session_id` joins to the webhook | Not built |
| **Save-your-details / claim** | `account_claimed` conversion; the guest's visitor_id becomes the profile's | profile_id is already on the claim | Not built |
| **Embed** `/embed/schedule/:slug` on the studio's own site | The iframe is a third-party context: its localStorage is partitioned and often blocked. So the embed generates a short-lived `tv` token and **appends it to every Book link**; the booking page adopts it as the visitor_id. Referrer = the studio's site; `utm_medium=embed` set automatically | Token in the URL, nothing stored in the iframe | Not built |
| **Landing pages** `/p/:slug` (PRD-011) | Session with `landing_page_id`; variant id for A/B | localStorage | Schema only |
| **Blog** `/blog/*` | Session; touchpoint `content_read` with the post slug | localStorage | Not built |
| **Teacher profiles** `/t/:slug` (PRD-018/021) | Session; `private_request_start` | localStorage | Planned |
| **Events / workshops / retreats** | Session; registration is a conversion with value | localStorage | Schema only |
| **UTM builder + link clicks** | `/l/:code` short links: record `link_clicks` (campaign, code, referrer, device), then 302 to the destination **with the UTMs appended**, so the page session and the click agree | The short link is the only thing in an Instagram bio; it must carry the campaign | UI only |
| **Campaign emails and SMS** (PRD-011) | Every link rewritten through `/l/:code` with `utm_medium=email|sms`, `utm_campaign=<campaign id>`, and the recipient's profile_id in the token so opens-to-bookings join without cookies | Token | Schema only |
| **QR codes** (front desk poster, studio code) | A `/l/:code` link with `utm_medium=qr`, `utm_content=<where the poster is>` | Same as links | Not built |
| **Member app (iOS/Android)** | App sessions post the same session record with `device_type=app`. Deep links carry UTMs through the universal link URL. Install attribution: **Android** Play Install Referrer passes `utm_*` through install; **iOS** App Store campaign links (`?pt=…&ct=<campaign>&mt=8`) are visible only in App Store Connect's analytics, not inside the app, so iOS install source is reported from ASC data, not joined per person. First launch asks nothing. | visitor_id in app storage; linked to the profile at sign-in as one more `profile_visitors` row | Planned (STORE-APPS.md) |
| **Owner app** | Not a consumer surface; no attribution capture. It *shows* the view. | | Planned |
| **Network** (PRD-023) | Explore impression → studio page → booking: `source=network` on the `studio_members` row; the Tandava-level credit purchase has its own first touch | Same visitor | Spec |
| **Privates** (PRD-021) | Request, proposal, acceptance as touchpoints; "private intro after first class" credited to the lifecycle automation that sent it | Same visitor | Spec |
| **Front desk / kiosk / import** | `studio_members.source = walk_in | import | staff`, so the owner's view adds up to 100% instead of "unknown: 60%" | Set by the writer | Partial (import tags only) |

Every table above shares one rule: **capture happens on the page, attribution is computed on the server, and the owner sees it per studio.** A visitor who books at two studios appears in each studio's view with only that studio's sessions and conversions. Tandava-level reporting (the Network, platform funnels) is aggregate only.

---

## Studios' own UTMs
Studios tag their own links (PRD-026's `/manage/share` offers eleven channel presets; owners also paste links from their website, Linktree, newsletters and ads). Capture keeps every `utm_*`, referrer and click id exactly as it arrived; reporting groups by `analytics_sessions.channel`, computed by one tested function, so "instagram/bio", "ig/linkinbio" and "Instagram/social" all land in organic social while drill-down still shows the raw tags. Links from the studio's own website reach Tandava through the embed token or a tagged link and keep their UTMs end to end. Ad click ids (`fbclid`, `gclid`, `gbraid`, `wbraid`, `ttclid`, `msclkid`) are captured at the first touch for PRD-027's server-side conversions. Schema: migration 00024.

## The interlinked view (what the owner opens)

One place, `/manage/analytics/attribution`, four tabs that drill into each other. Each number is a link to the rows behind it.

1. **Sources.** Source → medium → campaign → landing page, with sessions, bookings, new people, members, revenue, and the model selector. Click a campaign to see its links; click a link to see its clicks and what they became.
2. **Journeys.** The common paths as a flow: `instagram → studio page → express booking → claimed → pack`. Median days and touches to each conversion. Click a path to see the people on it (names only for the studio's own members; guests show as "guest, booked Oct 3").
3. **Funnel by surface.** Studio page → booking page → form started → submitted → paid → claimed → second visit → pack or membership, with drop-off at each step and the embed and the app as separate columns. This is where "Express Booking raised conversion by X" is read.
4. **Features.** Express Booking, Network, privates, campaigns, landing pages: each with the conversions it is credited with under the selected model, so the owner sees the product's features as marketing channels with ROI, and so do we.

Plus two things outside the page:
- **Member detail** (`/manage/members/:id`): a "How they found you" strip at the top: first touch, converting touch, journey length, every conversion with its source.
- **Monthly owner email** (PRD-007): three lines. Top source for new people, top source for revenue, one thing to try.

Definitions live in `/manage/definitions` (exists) so "first touch" means the same thing on every screen.

---

## Help, definitions and info icons
Every tile on the attribution page carries an info icon with its formula and its counterfactual in one sentence; `/manage/definitions` holds the same text. Help entries: `attribution` (landing, owner), `tracking-privacy` (landing, booking page, member app). The FAQ answer "What analytics does Tandava provide?" states what is live and what is planned, and is updated with each build step.

## Privacy posture (part of the product, not a footnote)
- First-party only. No Meta pixel, no Google Ads tag by default. A studio that wants one adds it knowingly in settings, and the page states it.
- No IP stored; coarse geo computed at the edge and dropped.
- Visitor ids are random, per origin, never shared across studios' views, deleted on account deletion (`gdpr_requests` exists).
- Consent: capture runs without consent only for what a server log would hold (path, referrer, UTMs, device class). Anything beyond that waits for the consent banner where the law requires one (`ATTRIBUTION_TRACKING.md` §Privacy).
- The member never sees a "we tracked you" moment. The studio sees "came from your Instagram link", which is what a front desk would notice anyway.

---

## Build order (each step ships value on its own)
1. **Session capture on every web surface** (one `src/lib/analytics/session.ts`, one edge function `analytics-session`), writing `analytics_sessions` with `visitor_id`; reconcile the 00003 schema with the spec in one migration (add `visitor_id`, `profile_visitors`, `touchpoints` JSONB or a `touchpoints` table, `conversion_events`).
2. **Link at identity time and at every sign-in:** `express-book`, signup, claim, OAuth callback and the app's sign-in insert a `profile_visitors` row for the current visitor; the webhook and the booking paths write the frozen touches onto `studio_members` and `conversion_events`.
3. **`studio_members.source` for every writer** (express, signup, import, staff, network), so the view sums to 100%.
4. **Short links** `/l/:code` with `link_clicks`, and the UTM builder producing them. The embed's `tv` token.
5. **The view:** Sources tab on real data, then Funnel, then Journeys, then Features. Member detail strip.
6. **App capture** when the member app exists: Install Referrer on Android, session posts from the app, deep-link UTMs.
7. **Network and privates hooks** when those ship.

Steps 1 to 3 are a pilot gate. A studio on Tandava for a month with no attribution view has no reason to believe the platform did anything.

## Acceptance (pilot)
- A visit from an Instagram bio link to the studio page, then an express booking two days later from a direct visit, shows as one journey with first touch Instagram and converting touch direct.
- A booking from the embed on the studio's own site shows source = the studio's domain, medium = embed, and links to the same person when they later claim an account.
- Every `studio_members` row created after launch has a non-null `source`.
- The Sources tab's totals equal the bookings and revenue reports for the same period, to the cent.
- A member's detail page shows first touch, converting touch and days between.

## Non-goals
- Ad-platform cost import and ROAS in v1 (ROAS needs spend; spend needs connectors; see `docs/ai-agents/BUSINESS_CONNECTORS.md`). Show revenue per channel; owners know their spend.
- Cross-device identity matching without sign-in. A phone and a laptop are two visitors until the person signs in on both; then both are linked to the profile (one-to-many), and nothing is guessed before that.
- Fingerprinting of any kind.

## Beyond Tandava (for the playbook)
The same first-party pattern and the same UTM vocabulary should apply across Purafield's other surfaces (purafieldstudio.com, cuecraftyoga.com, rationalyoga.com, the CueCraft and WakeState store listings), so one campaign can be read end to end: `app-launch-playbook/UTM-CONVENTIONS.md` holds the shared naming and the store-link rules (Android referrer, Apple campaign links).

## Related
`ATTRIBUTION_TRACKING.md` (technical design; to be reconciled to this), PRD-011 Campaign hub and UTM builder, PRD-007 lifecycle automation, PRD-020 Express Booking, PRD-021 privates, PRD-022 home studio and Explore, PRD-023 Studio Network, `docs/app-store/STORE-APPS.md` (deep links and install attribution).
