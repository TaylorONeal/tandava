# Task board: Studio Directory (PRD-028)

Status: not started. Written 2026-10-23. Owner: Taylor.
Order is dependency order. A task is done when its acceptance line is true,
not when code exists. **GATE** tasks need Taylor's explicit go-ahead and stop
the board until they get it.

Related: [PRD-028](../prd/PRD-028-studio-directory.md),
[SHARED-CORE.md](SHARED-CORE.md), [BOOKING-PLATFORMS.md](BOOKING-PLATFORMS.md),
[SCRAPING-PLAN.md](SCRAPING-PLAN.md).

---

## SD0: Spec and decisions

- [ ] **SD0-1 (GATE)** Taylor reviews this spec set and confirms: yoga-only
      v1, `/studios` route, public tier as defined, Austin as pilot market.
      Acceptance: decisions recorded in this file's Decisions log.
- [ ] **SD0-2** Confirm the Arketa spelling and seed taxonomy with a spot
      check of 10 real studio sites by hand.
      Acceptance: BOOKING-PLATFORMS section 1 updated with any vendor Tay
      names that is missing.
- [ ] **SD0-3** Write the crawler info page copy (what the directory is, why
      a studio is listed, correction/removal doors) as a doc for review.
      Acceptance: copy exists in `docs/directory/CRAWLER-INFO-PAGE.md` and
      is approved at the SD3 gate, not before it is needed.

## SD1: Private foundation (no public routes)

- [ ] **SD1-1** Migration: `directory_studios`, `directory_sources`,
      `directory_facts`, `directory_links`, `booking_platforms` (seeded),
      `booking_platform_history`, `directory_corrections`,
      `directory_audit_log`, `directory_suppressions`. Explicit GRANTs in
      the migration for any public-facing table/view (standing Supabase
      rule). Acceptance: migration applies clean on a scratch project;
      types regenerated.
- [ ] **SD1-2** RLS + public view: `directory_public_studios` exposes only
      published entities and verified public-tier facts.
      Acceptance: automated tests prove anon cannot read internal-tier
      columns, draft entities, or suppressed entities.
- [ ] **SD1-3** Admin review queue (port the TeacherTree PR #79 pattern):
      list drafts, inspect facts with evidence and source links, publish /
      edit / reject / suppress, revision conflict handling, audit entries.
      Acceptance: a hand-entered studio flows through every state; an edit
      racing a correction cannot silently overwrite it.
- [ ] **SD1-4** Correction queue admin: record a received correction or
      removal request, resolve with notes, suppression written on removal.
      Acceptance: removing a test studio suppresses its slug and domain so
      re-import cannot resurrect it.
- [ ] **SD1-5** Platform history editor: admin can set current platform and
      ordered previous platforms, each with source + observed date.
      Acceptance: the BOOKING-PLATFORMS section 3 worked example renders
      exactly "Booking via Arketa. Previously: Mindbody."

## SD2: Pilot collection, Austin (stays private)

- [ ] **SD2-1 (GATE)** Legal/ethics checklist in SCRAPING-PLAN section 4
      signed off for Austin (source terms written down, jurisdiction note,
      removal SLA adopted). Acceptance: checklist checked in with initials
      and date; no crawl before this.
- [ ] **SD2-2** Seed list: hand-build 100 to 200 Austin yoga studios (name,
      website, area). Acceptance: seed file committed under
      `scripts/directory/seeds/` with source notes per row.
- [ ] **SD2-3** Fetcher: robots-aware, honest UA, per-domain rate cap,
      content hashes into `directory_sources`. Acceptance: runs the seed
      list against a scratch DB; a robots-blocked test domain is recorded
      as blocked and never fetched.
- [ ] **SD2-4** Extractor: JSON-LD first, DOM heuristics second, LLM with
      evidence quotes last. Acceptance: every produced fact carries a
      source + evidence; a fact with no evidence cannot be saved.
- [ ] **SD2-5** Platform detector: signature module from BOOKING-PLATFORMS
      section 2, with sample-URL tests per signature.
      Acceptance: signature test suite green.
- [ ] **SD2-6** Dedupe + normalize pass and review of all pilot drafts by a
      human. Acceptance: zero duplicate domains published-ready.
- [ ] **SD2-7** Accuracy audit: hand-check a random 50 of the pilot set
      against the live sites. Acceptance: platform precision at least 95%,
      status precision 100% on the sample, or SD3 does not open and the
      misses are written up here.
- [ ] **SD2-8 (GATE)** Taylor reviews 10 sample pages rendered from private
      data and the accuracy write-up, and decides SD3.

## SD3: Public launch, Austin

- [ ] **SD3-1** Routes: `/studios` index (search + filters per PRD),
      `/studios/:slug` detail, `/directory` redirect. Public view only;
      noindex until the gate below passes. Acceptance: pages render only
      public-tier fields (snapshot test on the rendered HTML).
- [ ] **SD3-2** Claim door (request to claim routes to admin; full self-serve
      claim is a later task) and correction door (writes to
      `directory_corrections`) live on every page.
- [ ] **SD3-3** Crawler info page published (copy from SD0-3) before any
      re-crawl runs against listed sites.
- [ ] **SD3-4** SEO basics: sitemap includes published pages only, JSON-LD
      matches visible content, canonical slugs stable.
- [ ] **SD3-5 (GATE)** Taylor's explicit go-ahead to publish Austin.
      Acceptance: go-ahead recorded in Decisions log; only then are pages
      switched indexable.
- [ ] **SD3-6** Launch check: corrections inbox staffed (who reads it, SLA
      clock), analytics events for outbound clicks and claims (PostHog,
      consistent with existing Tandava analytics).

## SD4: More markets

- [ ] **SD4-1** Seattle: repeat SD2 pipeline + accuracy audit + per-market
      gate. Acceptance: same bars as Austin.
- [ ] **SD4-2** NYC, SF, LA: same pattern, one market at a time.
- [ ] **SD4-3** Bali and Koh Phangan: blocked until Indonesia PDP / Thailand
      PDPA review (Shared Core gate 2). Do not seed these markets before
      the review exists.
- [ ] **SD4-4** Monthly re-crawl job running in production: platform + status
      light check, change events into the review queue. Acceptance: a real
      platform migration is caught by the job and reviewed, not just in
      test data.

## SD5: Associations and claim merge

- [ ] **SD5-1** Consume TeacherTree D4 one-way studio fact sync; reconcile
      conflicts in favour of the claimed / first-party record.
- [ ] **SD5-2** Teacher chips on studio pages from TeacherTree associations
      (Shared Core 4.6), each linking to the teacher's TeacherTree page.
- [ ] **SD5-3** Claim merge UX: when a listed studio joins Tandava, its
      directory page and `/s/:slug` storefront merge without duplicate
      search results (canonical redirect, history preserved).

## Standing tasks

- [ ] **DIR-S1** Quarterly signature re-verification (BOOKING-PLATFORMS
      section 2 samples) and taxonomy sync check between the two repos'
      copies of SHARED-CORE.md and the platform seed list.
- [ ] **DIR-S2** Monthly sample audit of 20 published pages per live market
      (accuracy + tone). Any page failing tone (reads negative or salesy)
      is a bug against the PRD page contract.

## Decisions log

| Date | Decision | By |
|---|---|---|
| 2026-10-23 | Directory concept approved as spec only. Nothing collected, nothing published. Route working name `/studios`, index also reachable as `/directory` | Taylor (concept), Muse (docs) |
| 2026-10-23 | Shared core with TeacherTree teacher directory: one spec, two implementations, no shared database at v1 | Taylor (direction), Muse (design) |
| 2026-11-10 | Build v1 now as a static directory on `/studios`: listings generated from OpenStreetMap (ODbL) plus named seeds, bundled into the site, no database change. Archived studios stay listed, hidden from search unless asked for | Taylor (direction), Claude (build) |
| 2026-11-10 | Attributes: status (active vs archived), Instagram, website, phone, description, styles (multi-select from the shared taxonomy, hidden sub-styles like Power Vinyasa roll up), current and previous studio software from a full list (118 entries incl. gym, salon, scheduling). Filters: country, state, city, style, software | Taylor |
| 2026-11-10 | Phone and street address are shown (studio business details, never anyone's home). Supersedes PRD-028 "What the page never shows" for those two fields | Taylor |
| 2026-11-10 | Update and removal requests go to hello@purafieldstudio.com. Each listing shows last refreshed date and an accuracy disclaimer (LEGAL-COPY.md) | Taylor |
| 2026-11-10 | First markets: Austin, Seattle, San Francisco, Chicago, New York, Ubud (incl. every studio in the CueCraft Ubud guide), Nosara, Frankfurt, Koh Phangan, Bangkok. Supersedes the US-first gate in SHARED-CORE section 9 for studio listings; teacher data still waits for its privacy review | Taylor |
| 2026-11-10 | Software is shown when a public booking link matches a vendor domain (confidence 0.9) even before a person verifies it; site builders are never shown as booking software. Studio-site checks stay off until `/studios/about` is live | Claude (default) |
| 2026-11-10 | Site checker switched on before `/studios/about` ships (coordinator default; current software is Taylor's key attribute). One homepage fetch per studio, robots.txt honored, 25-day cache, the about URL in the user agent resolves once PR 127 merges | Coordinator (default) |
| 2026-11-10 | Gyms, YMCAs, rec centers and martial arts clubs that only list yoga as a sport are kept internally as `gym_with_yoga` and left off the public list. Thin markets get seeds from public guides (Nosara: Wanderlust Realty guide; Austin: Lantern and BookRetreats), each entry citing its source | Claude (default) |
| 2026-11-11 | Records that share a website, Instagram or name merge only when within 750 m (or, without positions, when one name contains the other). Chains like Club Pilates and CorePower were collapsing many locations into one; 79 locations came back. Second locations get the street in their slug | Claude (default) |
| 2026-11-11 | Studio websites and Instagram come only from pages read on the studio's own site (or a press piece naming it). A studio is marked closed only on a press piece or its own site saying so, never on an aggregator alone; a dead site with no current sign sets status unknown, which hides it. Edits to overrides or seeds now trigger the refresh, so the site checker reads new domains for software | Claude (default) |
| 2026-11-10 | Shared taxonomy lives in `app-launch-playbook/taxonomy/` (styles, studio software, record schema); Tandava vendors pinned copies in `src/data/taxonomy/` | Claude (default) |
