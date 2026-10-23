# Studio Directory docs

The public studio directory for tandavastudio.com (`/studios`): a positive,
factual list of yoga studios built from their own public websites, showing
status and current/previous booking software, linking out. Not a review
site. Spec only as of 2026-10-23; nothing is collected or published yet.

| Doc | What it is |
|---|---|
| [PRD-028](../prd/PRD-028-studio-directory.md) | The product spec: pages, tiers, rollout phases SD0 to SD5, gates |
| [SHARED-CORE.md](SHARED-CORE.md) | The directory engine shared with TeacherTree's teacher directory: schema pattern, attribute tiers, status vocabulary, gates. Canonical copy lives here; an identical copy lives in the teachertree repo |
| [BOOKING-PLATFORMS.md](BOOKING-PLATFORMS.md) | Vendor taxonomy (shared seed list) + detection fingerprints + the platform history model |
| [SCRAPING-PLAN.md](SCRAPING-PLAN.md) | Collection pipeline, sources, politeness and legal gates, accuracy rules |
| [TASKS.md](TASKS.md) | The ordered task board with acceptance lines and decision gates |

Start with the PRD. The one-sentence version of the whole design: sourced
records stay separate from first-party studio records, every published fact
carries its source, and a human approves every page before it is public.
