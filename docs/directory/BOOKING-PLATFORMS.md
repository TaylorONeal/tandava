# Booking platform taxonomy and detection signatures

Status: spec, not built. Written 2026-10-23. Owner: Taylor.
Part of [PRD-028](../prd/PRD-028-studio-directory.md). The seed list in
section 1 is shared verbatim with TeacherTree (see
[SHARED-CORE.md](SHARED-CORE.md) section 4.5).

Spelling note: the platform Tay named as "Arqueta" is **Arketa**
(arketa.com). The taxonomy uses the vendor's own spelling.

---

## 1. Seed taxonomy (`booking_platforms`)

| id | Display name | Notes |
|---|---|---|
| `mindbody` | Mindbody | The incumbent. Most migration history starts here |
| `arketa` | Arketa | Common Mindbody destination for yoga/pilates |
| `momence` | Momence | Common for yoga studios, strong on workshops/retreats |
| `walla` | Walla | Boutique fitness |
| `mariana-tek` | Mariana Tek | Large boutique brands |
| `vagaro` | Vagaro | Salon/spa crossover studios |
| `fresha` | Fresha | Spa/wellness crossover |
| `acuity` | Acuity Scheduling | Squarespace Scheduling; solo and small studios |
| `momoyoga` | Momoyoga | Small yoga studios, EU heavy |
| `teamup` | TeamUp | UK/EU and CrossFit crossover |
| `glofox` | Glofox | Gyms and studios |
| `zen-planner` | Zen Planner | Gyms, martial arts, some yoga |
| `pike13` | Pike13 | |
| `fitogram` | Fitogram | EU |
| `eversports` | Eversports | EU |
| `fitgrid` | FitGrid | Livestream-era layer, sometimes alongside a system of record |
| `union` | Union | Yoga-specific, livestream roots |
| `tandava` | Tandava | Us. Detected the same way as everyone else, no special casing |
| `custom` | Own website | Booking built into their own site with no vendor fingerprint |
| `none` | No online booking | In-person / DM / phone only, as observed |
| `unknown` | Unknown | Default state. Never displayed publicly |

Rules:

- Adding a platform is a taxonomy change in both repos in the same session.
- `unknown` and `none` are observations, not insults, and `none` only displays
  when a human verified there is genuinely no booking link.

## 2. Detection signatures

Detection is evidence gathering, not a verdict. Each signature produces a
candidate with a confidence and the matched evidence string; a human verifies
before anything publishes (see [SCRAPING-PLAN.md](SCRAPING-PLAN.md)).

| Platform | Booking link domains | Page / script fingerprints |
|---|---|---|
| Mindbody | `clients.mindbodyonline.com`, `cart.mindbodyonline.com` | `widgets.healcode.com` script, `healcode` widget divs, Mindbody branded app links |
| Arketa | `app.arketa.co` | Arketa embed script, `arketa` iframe hosts |
| Momence | `momence.com`, `app.momence.com` | Momence widget script, `momence.com` schedule embeds |
| Walla | `app.wallafitness.com` | Walla booking links/subdomains |
| Mariana Tek | `*.marianatek.com` branded subdomains | Mariana Tek web components |
| Vagaro | `vagaro.com` | Vagaro widget script |
| Fresha | `fresha.com` | Fresha booking links |
| Acuity | `acuityscheduling.com`, `app.squarespacescheduling.com` | Acuity embed iframe |
| Momoyoga | `momoyoga.com` schedule subdomains | Momoyoga schedule links |
| TeamUp | `goteamup.com` | TeamUp embeds |
| Glofox | `app.glofox.com` | Glofox portal links |
| Zen Planner | `zenplanner.com` member app subdomains | Zen Planner iframes |
| Pike13 | `*.pike13.com` subdomains | |
| Fitogram | `fitogram.pro` / `widget.fitogram.de` | |
| Eversports | `eversports.at` / `eversports.de` partner pages | |
| FitGrid | `fitgrid.com` class links | Often a secondary signal; check for a system of record underneath |
| Union | `union.fit` | Union schedule embeds |
| Tandava | `tandavastudio.com/s/:slug`, studio subdomains on the root domain | Our own storefront routes |

Signature maintenance:

- The signature table is code (a versioned JSON/TS module), and this doc is
  its human-readable mirror. A signature change updates both.
- Every signature carries `added_on` and a sample URL it was verified against.
  Vendor rebrands happen (Healcode into Mindbody, Squarespace Scheduling out
  of Acuity branding); a quarterly pass re-verifies samples.
- Multiple fingerprints on one site are normal during a migration. That is a
  history event in progress, not an error: the review queue shows both, with
  dates, and the reviewer decides which is current.

## 3. History model, worked example

Studio: "Aloha Yoga" (fictional). Crawls observe:

| Observed | Evidence | Resulting history rows |
|---|---|---|
| 2026-11-02 | Booking link to `clients.mindbodyonline.com` | Mindbody, current, observed_from 2026-11-02 |
| 2027-02-14 | Booking link now `app.arketa.co`; Mindbody link gone | Arketa, current, observed_from 2027-02-14. Mindbody row gets observed_to 2027-02-14, is_current false |
| 2027-02-20 | Studio confirms via correction door they moved in January | Rows unchanged (we publish observed dates, not their contract dates). Internal note records the claim |

Public rendering: "Booking via Arketa. Previously: Mindbody."
With two moves: "Booking via Momence. Previously: Arketa, Mindbody."
Order is most recent first. Nothing else is said. No dates are published at
v1; if dates are ever shown they are the observed dates and labelled as such.

## 4. Accuracy bar

- Platform detection on the pilot market must reach at least 95% precision on
  a human-checked sample of 50 studios before public launch. Recall matters
  less: "Unknown" internally is acceptable, a wrong platform published is not.
- A platform claim with confidence under the auto threshold, conflicting
  fingerprints, or a change since last crawl always routes to a human.
- `permanently_closed` plus a platform history is the most error-prone
  combination (dead sites keep old fingerprints). Closed studios show platform
  history only, never a current platform.
