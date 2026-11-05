# PRD-028: Public Studio Directory (`/studios`)

## Overview
**Phase:** Post-launch growth. Starts only when Taylor says go; sequencing per
the 2026-10-23 launch order puts Tandava last of the three launch tracks, and
this directory is a growth surface, not a launch dependency.
**Priority:** P2 strategic. The data asset compounds; the pages are cheap.
**Status:** Spec. Nothing exists in code, no data has been collected, and
nothing is published. This PRD authorizes design only.
**Origin:** Taylor, Oct 23 2026: a public directory of studios we know about,
built from publicly available information on their own sites. Not a review
site. Positive only. Each listing shows the studio's status and the booking
software it uses now and used previously, and links out to the studio.
**Companions:** [Shared Directory Core](../directory/SHARED-CORE.md) (the
architecture this shares with the TeacherTree teacher directory),
[Booking Platforms](../directory/BOOKING-PLATFORMS.md),
[Scraping Plan](../directory/SCRAPING-PLAN.md),
[Task board](../directory/TASKS.md).

---

## What this is, and what it is not

**Is:** a factual, positive directory of yoga studios (later: pilates and
boutique fitness if the model holds), one light page per studio, that answers
"does this studio exist, is it open, where is it, how do people book there,
and where is its real site and socials."

**Is not:**

- Not a review site. No reviews, no ratings, no rankings of quality, ever.
  Adding any of those is a different product decision, not a feature.
- Not a booking surface. We link out to the studio's own booking. (A studio
  that later joins Tandava gets its Tandava storefront linked like any other
  first-party fact; it does not get better placement.)
- Not a lead list. The internal data tier never becomes an outreach list
  (Shared Core, section 5).
- Not the existing in-app studio directory / Discover. Tandava already has
  customer-facing surfaces (`/s/:slug` storefronts, Discover classes) for
  studios **on** Tandava. This directory lists studios whether or not they
  use Tandava, lives on the marketing site, and uses sourced records that are
  strictly separated from the `studios` table (Shared Core, section 3).

## Why build it

1. **The market map is the asset.** Knowing which booking platform every
   studio in a market uses, and watching migrations over time, is exactly
   the intelligence a studio-software company needs and no one publishes.
   The public page is the honest reason to collect it.
2. **Search surface.** "Yoga studios in Austin", "studios that use Arketa",
   a named studio plus its city: real queries, thin competition, and every
   page is a door into Tandava for owners and a useful answer for students.
3. **The claim funnel.** A studio page an owner can claim is a warmer first
   contact than any ad: they arrive to correct or complete their own listing
   and find the product behind it. TeacherTree runs the same loop for
   teachers; the two loops reinforce each other once teacher to studio
   associations land (Shared Core, section 4.6).
4. **Goodwill.** A directory that is accurate, positive, and easy to correct
   or leave is a genuinely useful thing for the community, and it makes
   Tandava known as the people who keep the map, not the people who scrape
   and spam.

## Jobs to be done

### Job 1: Student: find a real studio near me
**When** I am new in a city or travelling, **I want** a list of studios that
are actually open, with a straight link to their real site and booking,
**so I can** book a class without wading through dead listings and SEO spam.

### Job 2: Studio owner: my listing should be right, and mine
**When** I find my studio listed, **I want** the facts right, and a way to
claim, correct, or remove the page, **so I can** trust the directory and
maybe look at the product behind it.

### Job 3: Taylor (operator): see the market clearly
**When** I plan Tandava outreach, pricing, or a migration offer, **I want**
to know platform share and movement per market, **so I can** aim at studios
in motion instead of spraying everyone.

## The public pages

### Index: `/studios` (with `/directory` redirecting to it)

- Search by studio name; filter by city/market, status (open by default,
  closed and historic behind a toggle), style, and booking platform.
- Result cards are minimal: name, area, status, "Booking via X", link out.
- No sponsored order, no quality sort. Default sort: alphabetical within a
  market. What we do not know, we do not fake.

### Detail: `/studios/:slug`

Renders only the public tier (Shared Core, section 5):

- Name, status line (Open / Temporarily closed / Closed / Historic, with
  years for historic where sourced)
- City and area (neighbourhood), not the street address at v1
- Our original one or two sentence summary
- Links out, as buttons: Website, Instagram, YouTube (when they have one),
  Book a class (their booking page)
- Booking platform line: "Booking via Arketa. Previously: Mindbody."
  (history model and wording: Booking Platforms, section 3)
- Styles offered, when sourced (short tag list, factual)
- "Last checked" date
- Claim door: "Run this studio? Claim this page." Correction door:
  "Something wrong? Tell us." Both live from the first public day.

### What the page never shows

Street address, phone, email, anything from the internal tier, any score or
ranking, any other studio's data, any text copied from the studio's site, and
any photo we scraped. If a studio claims, they can add their own media
through the normal storefront flow, on their record, not the sourced one.

## Data model (Tandava implementation of the Shared Core)

New tables, prefixed `directory_`, migrations starting after 00030, every new
public table carrying its explicit GRANT in the creating migration (standing
Supabase rule from the Oct 30 Data API change):

- `directory_studios`, `directory_sources`, `directory_facts`,
  `directory_links` (Shared Core, sections 4.1 to 4.4)
- `booking_platforms`, `booking_platform_history` (section 4.5; seed data
  from Booking Platforms, section 1)
- `directory_corrections`, `directory_audit_log`, `directory_suppressions`
  (section 4.7, ported from the TeacherTree PR #79 pattern)
- `directory_relationships` is **not** built in Tandava v1. Teacher to
  studio associations are built in TeacherTree first and synced per D4.

RLS: public read only through a `directory_public_studios` view that exposes
published entities and verified public-tier facts only. The base tables are
service-role / admin only. An anonymous caller must never be able to read an
internal-tier field; this gets an explicit RLS test (TeacherTree had exactly
this bug class in its studios table in Oct 2026 and closed it; do not
re-open it here).

## Collection

The full plan is [SCRAPING-PLAN.md](../directory/SCRAPING-PLAN.md). In one
paragraph: seed a market by hand, discover candidates from map/association
sources, fetch only the studio's own public site politely and under robots
rules, extract typed facts with evidence (JSON-LD first, LLM last), detect
the booking platform from fingerprints, dedupe on domain, and put everything
in front of a human before it publishes. Monthly light re-crawl watches for
the two changes that matter: status and platform migrations.

## Rollout (SD phases; names mirror TeacherTree D phases on purpose)

| Phase | What | Gate to exit |
|---|---|---|
| SD0 | This spec set: PRD, shared core, taxonomy, scraping plan, tasks | Taylor has read and approved the shape (this is the "remind me later" checkpoint) |
| SD1 | Private foundation: tables, admin review + correction queue, platform history, zero public routes | RLS tests pass; a hand-entered test studio flows draft to verified and back |
| SD2 | Pilot collection, Austin, 100 to 200 studios, **stays private** | Platform precision at least 95% on a 50-studio hand-checked sample; status corroboration rule exercised |
| SD3 | Public launch, Austin only: `/studios` + detail pages, claim + correction doors live, crawler info page live | All Shared Core section 8 gates pass for Austin; explicit owner go-ahead to publish |
| SD4 | More markets (Seattle, then NYC/SF/LA), Bali/Koh Phangan only after jurisdiction review | Per-market go-ahead, same gates each time |
| SD5 | Associations + sync: teachers on studio pages come from TeacherTree via its D4 sync; claimed studios merge their directory page with their storefront | TeacherTree D4 shipped |

Phases do not auto-advance. Each gate is a decision for Taylor, and SD3 is
the bright line: before it, everything is private drafts.

## Success measures (once public, per market)

- Coverage: share of operating studios in the market listed and verified
- Accuracy: correction requests per 100 pages per quarter (lower is better;
  target under 2), platform errors found per re-crawl
- Freshness: median days since last verified (target under 45)
- Funnel: claim rate on pages viewed by their owners; claimed to Tandava
  trial conversion (tracked, never used to rank or pressure)
- Usefulness: directory to studio-site click-throughs (we send real traffic
  out; that is the goodwill engine)

Explicitly not a measure: time on page, ad value, leads scraped. If those
become the point, the product has drifted from this PRD.

## Risks and open questions

| # | Item | State |
|---|---|---|
| Q1 | Route final: `/studios` on tandavastudio.com vs a subdomain? PRD assumes main domain for search value | Open, decide at SD3 |
| Q2 | Do we show historic/closed studios in search results by default? PRD says listed but toggled off in default index filters | Open, decide at SD2 with real data |
| Q3 | Studio chains with one site, many locations: entity per location (scraping plan) may flood a market | Review at SD2 |
| Q4 | "Booking via" line could read as endorsement or as surveillance depending on tone; copy needs one careful pass with real examples before SD3 | Open |
| Q5 | Interaction with PRD-023 Studio Network and Discover if a listed studio joins Tandava: directory page and storefront must merge gracefully, not duplicate | Design at SD5 |
| Q6 | Fitness scope creep (pilates, barre, gyms): v1 is yoga studios, TeacherTree's world, on purpose | Decided for v1 |
