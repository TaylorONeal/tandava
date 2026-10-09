# PRD-027: CRM marketing automation, measured ads, and switching from other systems

## Overview
**Phase:** foundation now (tables, migration 00024); features after the pilot (PRD-024 build steps 1 to 3 first).
**Priority:** P1 strategic. Automated marketing is a large part of why studios pay for Mindbody's top tier; the switching path is what lets them leave.
**Status:** Spec, schema foundation (00024) and phase 1 built (00035, branch `feat/attribution-phase1`; not yet deployed). Phase 1 build notes are under "Phase 1: pilot". Research: `docs/competitive/MARKETING-AUTOMATION-AND-ADS-2026-10.md` (sources there).
**Builds on:** PRD-007 lifecycle automation (planned), PRD-011 campaign hub (schema in 00008: `campaigns`, `campaign_messages`, `campaign_sends`, `audience_segments`, `utm_templates`, `link_clicks`), PRD-024 attribution, PRD-026 booking links, connector/import infrastructure (00005: `import_jobs_v2`, `entity_sync_mappings`, `studio_connectors`).

---

## What the market does, and the gap
Every competitor ships the same lifecycle triggers (first visit, intro offer expiring, pack low, membership change, lapsed or at-risk, birthday, milestone), usually behind the top tier or a paid add-on (Mindbody: Ultimate tier; Arketa: Marketing Suite add-on; Glofox: XLerate add-on). AI appears as copy generation and a lead-qualifying front desk. Momence runs Meta campaigns in-app with ROI reporting; Walla sells ads as a service.

**What nobody publicly documents:** server-side conversions (Meta Conversions API, Google's Data Manager API) feeding the ad platforms *booked and paid* outcomes, and ROAS on real revenue. Mindbody's own page says conversion tracking is "coming soon". That is Tandava's opening: not more messages, but marketing whose results are measured the same way the money is.

---

## Three layers, built in this order

### Layer 1. Measurement (foundation now; PRD-024)
First-party sessions with click ids (`fbclid`, `gclid`, `gbraid`, `wbraid`, `ttclid`, `msclkid`) captured at first touch, one profile to many visitors, conversions with frozen first and converting touches and a stable `event_id`, consent per purpose. **Tables exist as of migration 00024**; nothing writes yet.

### Layer 2. Lifecycle automation (after the pilot)
One engine, studio-editable, with defaults that work untouched (HELP-AND-FAQ rule):

| Automation (default on) | Trigger | Default sequence | Stops when |
|---|---|---|---|
| Welcome / first visit | first check-in | thank-you + what to book next (day 0), intro offer reminder (day 3) | they book again |
| Intro offer conversion | intro pack bought | 3 messages across the offer window, last one 2 days before expiry | membership or pack bought |
| Guest to member | express guest booked (PRD-020) | save-your-details (day 0), intro offer (day 2) | account claimed or purchase |
| Pack running low | 1 class left | "1 class left" + renew link | pack bought |
| Membership expiring / failed payment | 7 days before end / payment failed | renew / update card | renewed / paid |
| Lapsed | no visit in 21 days (studio-tunable, computed from their own median gap) | we miss you + next class at their usual time | they book |
| Win-back | no visit in 60 days | offer chosen by the studio | they book |
| Birthday / milestone | date / 10th, 50th, 100th class | celebration, optional gift | |
| Review request | 2nd check-in, once | review link (PRD-006) | |
| Network visitor | 2nd network visit (PRD-023) | studio's intro offer | joined |
| Private intro | after first class (PRD-021) | private intro offer with the teacher | booked |

Engine shape: `automations` (trigger, conditions, steps, enabled), `automation_runs` (per person, current step, stop reason), messages through the existing `campaign_messages` / `campaign_sends`. Every send checks `consent_records` for that purpose and the quiet hours in the studio's time zone. SMS requires explicit opt-in (TCPA) and keyword opt-out. Every automation reports its conversions through PRD-024, so the owner sees "Intro offer conversion: 14 memberships, $X, last 90 days", not open rates.

AI: copy drafting in the studio's voice, always reviewed before the first send of a new sequence; never auto-sends new copy. A lead-reply assistant is a later question (see the app-ai-decisions contract).

### Layer 3. Measured advertising (later, opt-in per studio)
**Not** a media-buying service in v1. The owner keeps running ads in their own Meta and Google accounts; Tandava makes those ads smarter and the results honest:
1. **Connect** (Settings → Advertising): Meta through Meta Business Extension (per-studio dataset id and token in Supabase Vault, `ad_integrations.vault_secret_id`), Google through OAuth with the Data Manager API scope. Off until a test event succeeds; `send_events` stays off until the owner turns it on.
2. **Send conversions server-side**, from the `conversion_deliveries` outbox, one row per conversion per destination, retried with backoff:

| Tandava conversion | Meta event | Google conversion action |
|---|---|---|
| lead (form, Meta lead) | Lead | Lead |
| signup / account claimed | CompleteRegistration | Sign-up |
| first booking (guest or member) | Schedule | Booking |
| intro offer bought | StartTrial (value) | Purchase (value) |
| membership start | Subscribe (value) | Purchase (value) |
| pack / workshop / private | Purchase (value) | Purchase (value) |

   Browser pixel (if the studio has one) and server event share `event_id` = `conversion_events.id` so Meta dedupes. User data hashed SHA-256 after normalisation; IP, user agent, `fbc`, `fbp` unhashed per Meta's rules. Consent: nothing is sent for a person without `ad_user_data` granted where the law requires it; Meta Limited Data Use flags for the US states that need them; Google Consent Mode v2 signals on the page.
3. **Audiences** (phase 2): exclude current members from acquisition campaigns, lookalikes from converted members; synced lists, consent-gated.
4. **Report**: spend (read from the platform) next to Tandava revenue per campaign, so ROAS is computed on money that arrived, not on platform-modelled conversions.
5. **Managed ads** (agency-style, % of spend): not in scope. Revisit only if pilots ask, and then as a partner, not as Tandava staff buying media.

Platform obligations before Layer 3 ships: Meta App Review and **Tech Provider verification** (required before other businesses can grant ads permissions), `partner_agent` on every event; Google: build on the **Data Manager API** (the Google Ads API stopped accepting new offline-conversion users on June 15, 2026), OAuth verification for the scope; TikTok Events API later.

---

## Studios' own UTMs (from their website, social, email)
Studios already tag their links: PRD-026 (`/manage/share`) gives them eleven channel presets (Instagram bio and story, Linktree, TeacherTree, Google Business Profile, printed QR, email signature, newsletter, Facebook, SMS, plain). Their vocabulary is theirs and will never be consistent across studios, so:
- **Capture is raw:** whatever `utm_*`, referrer and click ids arrive are stored as-is on the session (PRD-024).
- **Reporting is normalised:** `analytics_sessions.channel` is computed by one tested function (`instagram` + `bio` → organic_social; `gclid` present → search paid; referrer = the studio's own domain + `utm_medium=embed` → embed; and so on), so every studio's report groups the same way while the raw tags stay visible on drill-down.
- **Their own website:** the embed (PRD-024 token through the Book link) carries the visitor id and the page's UTMs from the studio's site into Tandava; a studio that pastes a link with its own UTMs keeps them end to end.
- **Their own pixels:** if a studio wants its Meta pixel on its Tandava pages, it adds the id in Settings → Advertising; the page states it (privacy posture), consent banner applies, and the server-side event dedupes against it.

---

## Switching from other systems
Existing: a CSV import wizard that recognises six source formats (Mindbody, Momence, Walla, Arketa, WellnessLiving, generic), but the `import-members` function persists **client profiles only** (`import_type: "clients"`); attendance and transaction import are listed as remaining work in `docs/ROADMAP.md`. Schema for more exists: `import_jobs_v2`, `entity_sync_mappings` (external id ↔ Tandava id), quality reports. Gaps this PRD adds:

| Gap | Plan |
|---|---|
| **Pack balances** | Import the source's "visits remaining" report into `class_packs.remaining` with the original expiry; show the member their balance on first sign-in |
| **Memberships and renewal dates** | Import active contracts with next billing date; create the Stripe subscription only after the card is in place, never charge earlier than the old system would have |
| **Cards on file** | Stripe PAN import from the old processor (Mindbody: formal data release, ~30 days' notice, PGP; WellnessLiving/Paragon: export fee + agreement; Stripe-based systems: copy between Stripe accounts, which does not copy subscriptions). Confirm with Stripe that imports can land in the studio's **Connect** account. Fallback: a "confirm your card" email before the first renewal |
| **Visit history** | Import as historical attendance (for lapsed/at-risk automations and the attribution baseline), marked `source = import` |
| **Consent** | Import marketing opt-ins as `consent_records` with `source = import`; anyone without a recorded opt-in is not emailed marketing until they opt in |
| **Mapping file** | Keep the old id → Tandava id → Stripe `cus_`/`pm_` mapping in `entity_sync_mappings` for support and audits |
| **Cutover** | A dated runbook: export, dry-run import, card release request, final delta export on launch day (Mindbody charges per export, so plan two), switch booking links, turn on automations a week later |
| **Not transferred** | Schedules, staff, product catalogue and payment history rarely export cleanly; the onboarding wizard rebuilds schedules, and payment history stays as an archived CSV |

The help center gets a page per source ("Switching from Mindbody") with what moves, what doesn't, the timeline and the fees the old provider may charge, stated plainly.

---

## Phasing (recommendation, Oct 8 2026)

The rule: phase 1 needs no third-party approval, no per-studio registration and no ad-platform API. Everything in it is ours to ship, and each piece makes the next one measurable.

### Phase 1: pilot (ship with the first studios)
| Area | What | Why now |
|---|---|---|
| UTM capture | First-party sessions on storefront, booking page, embed (token through the Book link) and landing pages; visitor id; raw UTMs, referrer and ad click ids stored; `channel` via `classifyChannel` | Studios' tagged links from `/manage/share` (PRD-026) already exist; without capture they measure nothing |
| Identity link | `express-book`, signup, claim and the Stripe webhook write `profile_visitors`, `studio_members.source` and `conversion_events` with frozen touches | Turns visits into "this Instagram link produced 6 members and $X" |
| Owner view | Sources tab (channel → source → campaign → landing page, by bookings, new people, members, revenue) and the "How they found you" strip on member detail | The one screen a pilot owner will open weekly |
| Consent | Write `consent_records` from the existing marketing checkbox on booking and signup (email only) | Automations can't legally run without it |
| Email automations (3, defaults on) | Guest to member (save your details + intro offer), first-visit welcome + intro-offer follow-up, lapsed at the studio's median gap | Highest-value sequences across every competitor; each reports its own conversions |
| Sending | One provider, Tandava's sending domain with the studio's name and reply-to; quiet hours and one-a-day cap | No per-studio DNS work on day one |
| Paid ads | Click ids and UTMs captured, so paid traffic shows up in Sources by campaign with real revenue. No pixel, no API | The owner sees what their ads returned without us touching their ad accounts |

Not in phase 1: SMS, custom sending domains, short links, browser pixels, any ad-platform connection.

**Phase 1 as built (Oct 8 2026).** Decisions: `src/lib/marketing/automations.ts` (quiet hours, daily cap, consent, episodes, lapsed threshold) and `runner.ts`; emails: `automationEmails.ts` (studio name as sender, reply-to the studio email, postal address from the primary location, unsubscribe in footer and List-Unsubscribe one-click header); runner: `supabase/functions/run-automations` (hourly via pg_cron, shared secret, dry run unless `AUTOMATIONS_ENABLED=true`, claims each send before sending so overlapping runs can't double-send, failed sends are recorded and not retried); unsubscribe: HMAC token (`unsubscribeToken.ts`), `supabase/functions/unsubscribe` plus the `/unsubscribe` page (GET never changes anything); the save-your-details email lands on `/s/:slug/save-details`, which sends a fresh claim link because password links expire within the hour. Owner settings: `/manage/automations` with smart defaults and an info icon per choice. Operator steps: `docs/OPERATOR_SETUP.md`. Each automation's own conversions show in Sources as channel Email with `utm_campaign` = the automation key.

### Phase 2: after the pilot proves the reports match the money
- SMS automations (per-studio 10DLC registration, explicit opt-in, keyword opt-out)
- Remaining default automations (pack low, membership expiring/failed payment, win-back, birthday/milestone, review request, network visitor, private intro)
- Studio's own sending domain (SPF/DKIM), branded templates
- `/l/:code` short links with click counts; QR and bio links switch to them
- Funnel by surface and Journeys tabs
- Optional studio Meta/Google pixel on Tandava pages behind a consent banner (privacy page updated first)
- Google Data Manager API uploads from the `conversion_deliveries` outbox (OAuth app verification; no Tech Provider step)
- Migration: pack balances, active memberships with renewal dates, imported consent, Stripe card import runbook

### Phase 3: platform verifications and audiences
- Meta Tech Provider verification + App Review, Meta Business Extension connect, Conversions API with pixel dedupe, CAPI for CRM lead stages
- Audiences: exclude members, lookalikes from converted members (consent-gated)
- Spend import and ROAS on received revenue
- TikTok Events API
- AI copy drafting for sequences (reviewed before first send)

## Smart defaults and help
Automations ship on with conservative defaults (one message per person per day max, quiet hours 9 PM to 8 AM studio time, SMS only with opt-in). Each automation and each advertising setting gets an info icon. Help entries to add to `src/content/help.ts`: "Does Tandava send marketing for me?", "How do I measure my Instagram and Google ads?", "Can I keep using my Meta pixel?", "How do I switch from Mindbody?" (planned until built).

## Gates
1. PRD-024 build steps 1 to 3 (capture writing to the 00024 tables). Without measurement, automation and ads are guesses.
2. Email provider with per-studio sending domain (SPF/DKIM) and an SMS provider with 10DLC registration per studio (US).
3. Consent banner and policy versions live; privacy page updated before any ad pixel or server event is enabled.
4. Meta Tech Provider verification and App Review; Google Data Manager API OAuth verification.
5. Stripe confirmation on PAN import into Connect accounts.

## Non-goals
Running ads on a studio's behalf; buying or selling audiences across studios; any cross-studio identity sharing with ad platforms; scraping competitors' systems for migration.

## Success metrics
| Metric | Target |
|---|---|
| Revenue attributed to automations per studio per month | Baseline first, then shown on the owner's monthly email |
| Studios with an ad platform connected and sending events | 30% of active studios a quarter after launch |
| Share of Meta conversions deduplicated (pixel + server) | 90%+ where both are present |
| Migration: share of active packs and memberships carried over with correct balances | 99% |
| Members who had to re-enter a card at switch | Minimise; report it |

## Related
PRD-007, PRD-011, PRD-020, PRD-021, PRD-023, PRD-024, PRD-026, `docs/HELP-AND-FAQ.md`, `docs/competitive/MARKETING-AUTOMATION-AND-ADS-2026-10.md`, migration `00024_attribution_marketing_foundation.sql`.
