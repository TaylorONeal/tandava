# Help, FAQ and smart defaults: one source, every surface

Written Oct 8 2026. Taylor: "all of this needs to be in in-app help, FAQs on the page before sign-up and anywhere else", and "we should have suggested smart defaults and info icons to explain choices".

## The rule
1. **One source of help text:** `src/content/help.ts`. Each entry has an id, an audience (owner, member, teacher), a question, a plain answer, and `status: "planned"` when the thing is designed but not live. `docs/FAQ.md` is the long-form owner FAQ and must agree with it; when they differ, fix both in the same PR.
2. **Every setting that asks someone to decide has three things:** a smart default (computed from the studio's own data when there is data; a stated fixed value when there isn't), an info icon (`<HelpTip id>`, a tap-to-open popover, never hover-only) that explains the choice in one sentence, and a "why this default" line. A page of settings should work untouched.
3. **Every answer is true today.** No feature is described as live until it is verified against a real database. "Planned" says planned, on the landing page too; the badge is part of the trust.
4. **Where help surfaces:**

| Surface | What | Audience | Status |
|---|---|---|---|
| Landing page (`/`, anonymous) | `<FaqSection audience="owner">` with the pre-signup questions | owner | Built (this PR) |
| Demo page `/demo` | Its own developer FAQ (self-hosting); keep separate, it answers a different reader | developer | Exists |
| Booking page, confirmation | `<HelpTip>` next to the save-your-details choice; "Why did it ask me to sign in?" on the existing-account screen | member | Partly built |
| Studio settings (`/manage/settings/*`) | Info icon per setting + a "How this works" panel per feature (Network, privates, Express Booking, attribution) | owner | Planned with each feature |
| Analytics tiles | Info icon with the formula and the counterfactual in one sentence (PRD-023 ROI page, PRD-024). Sources report and member strip have theirs (`attribution`, `attribution-model`, `attribution-tags`) | owner | Sources built; ROI planned |
| Teacher opt-ins (`/teach/availability`) | Off-site safety defaults and the insurance note (PRD-025) | teacher | Planned |
| Member app | Same `help.ts` content, member audience, in the Me tab under Help | member | Planned (STORE-APPS.md) |
| Automations (`/manage/automations`) | One info icon per automation plus the lapsed threshold and intro offer link (`automation-*`) | owner | Built; entries stay `planned` until deployed and verified |
| Emails | One line and a link, never the full answer | all | Planned |
| `docs/FAQ.md`, `docs/FAQ-detailed.md` | Long form for owners and search engines | owner | Exists; updated Oct 8 |

## Adding an entry
Add to `HELP` in `src/content/help.ts` with the right audience and status; add or update the matching answer in `docs/FAQ.md`; if it explains a setting, place `<HelpTip id="…" />` next to that setting. Run `npm run build` (the landing renders the owner entries).

## Related
PRD-020 to PRD-025 each carry a "Help and FAQ" section listing their entries. `docs/ai-agents/DESIGN_SYSTEM.md` has the settings rule for agents.
