# PRD-026: Booking links and widget install

## Overview
**Phase:** 6
**Priority:** P0
**Status:** Implemented (links and widget install fixes), unverified against a live database
**Origin:** Mangomint brief section 6; follows PRD-020

---

## The finding that shaped this

The booking widget was already built, and better than expected: four variants
(inline schedule, Book Now button with lightbox, single event, and a no-iframe web component),
a ~4KB loader, postMessage auto-resize, no keys on the studio's site. Documented in
`docs/guides/website-embed.md`.

**It was not in the manage navigation.** Zero references in `ManageLayout`. A studio owner could not
find it unless they knew the URL.

And the direct booking link everyone wants for Instagram and Linktree already existed too:
`/s/:slug` is a branded storefront, and PRD-020 made `/s/:slug/book/:occurrenceId` book in one tap.
**Nothing in the product told an owner either URL existed.** No copy button, no QR, no short link.
The storefront URL appeared nowhere in `/manage`.

So the highest-leverage work here was not building a booking surface. It was surfacing one that
already worked.

## The decision

**Direct link first, widget second.** A studio on Squarespace still posts to Instagram every day. A
link needs no install, no plan upgrade, and no web person. The widget matters for the studio that
already has traffic on its own site; the link matters for everyone.

**Audience: the owner, installing alone.** No slugs to type, no hex codes to find, no Supabase keys,
no jargon. That one choice drives most of what follows.

---

## What shipped

### Booking Links — `/manage/share`

| Thing | Why |
|---|---|
| Studio page link with per-channel UTM presets | Eleven channels studios actually use (Instagram bio and story, Linktree, TeacherTree, Google Business Profile, printed QR, email signature, newsletter, Facebook, SMS, plain). Picked from a list, not typed. |
| Optional campaign name | Tells two pushes apart in reports later. Normalized, so "Spring Challenge" and "spring-challenge" cannot become two rows. |
| Per-class links | Skips the schedule and opens that class ready to book. For a story sticker, or replying to "when's your next class?" |
| **Real** printable QR code | 1024px PNG at error-correction M, downloaded with a filename a printer can read. Always encodes the print-tagged link regardless of the channel picker, because a printed code is a printed code. |
| "See what they'll see" | Opens the actual page. An owner should never share a link they have not looked at. |
| Discoverability warning at the top | A studio that is not discoverable has every link on this page silently fail. That belongs above the links, not in a footnote. |
| Instant-booking notice | If `express_booking_enabled` is off, visitors get asked to make an account. The page says so rather than letting the owner find out from a student. |
| Where-to-put-it guidance | Named placements with the actual menu path, including Google Business Profile, which is often a studio's busiest link and the easiest to forget. |

The QR deserves a note: `CheckInQRCode` draws a pseudo-random pattern that only *looks* like a QR
code, which `HOSTED_PRODUCT_REVIEW.md` already calls out. A QR an owner prints for the front desk has
to resolve, so this one is encoded properly with the `qrcode` library. That is a new dependency and
it is the honest way to ship this.

### Widget install fixes

| Was | Now |
|---|---|
| Not in the nav at all | **Website Embed** in the nav, next to Booking Links |
| Owner types their own slug, defaulting to the literal `your-studio-slug` | Prefilled from the studio record via `get_my_studio()`, editable only if they want to differ |
| Owner picks a brand color by hand | Prefilled from `studios.brand_primary_color` |
| Web component shown as a fourth peer option, exposing a Supabase URL and anon key | Collapsed behind "My site strips scripts or blocks iframes", badged **For developers** |
| One sentence covering five platforms: "paste it into a code/embed block" | Real step-by-step for **Squarespace, Wix, WordPress**, each collapsible |
| Squarespace plan requirement unmentioned | Named up front as a hard blocker, because discovering it twenty minutes in is the specific thing that makes a competitor's install page a mess |
| Discoverability as a parenthetical | A warning card when the studio is actually not discoverable |
| No alternative for an owner who cannot edit their site | "Don't have a website, or can't edit it?" card linking to Booking Links |

### Supporting

| Piece | Path |
|---|---|
| Link construction (42 tests) | `src/lib/booking/shareLinks.ts`, `shareLinks.test.ts` |
| `get_my_studio()` | `supabase/migrations/00020_my_studio.sql` |
| Hook | `useMyStudio` in `src/hooks/useBooking.ts` |
| Page | `src/pages/manage/ShareLinks.tsx` |
| Nav labels | `public/locales/*/manage.json` (en, es, fr, de, pt, it; others fall back to en) |

**Why `get_my_studio()` is a new RPC.** A plain `SELECT * FROM studios` nearly works: migration 00001
has a staff SELECT policy. But that policy's subquery reads `studio_staff`, which carries the
self-referential policy migration 00017 added a SECURITY DEFINER function to sidestep. Rather than
rely on that resolving, this follows 00017 and 00018: one narrow function returning exactly the
columns owner-facing screens need.

---

## Launch gates

1. **Apply migration 00020.** Without it `useMyStudio` returns null and both pages fall back to
   their empty states rather than breaking, but neither prefills.
2. **Multi-studio staff.** `get_my_studio()` returns the caller's *first* active staff record,
   ordered by `created_at` so the choice is deterministic rather than arbitrary. Staff at two
   studios will see one of them with no way to switch. A studio picker is the follow-up when
   multi-location becomes real.
3. **Verify the QR scans from print**, not just on screen. Error correction M and 1024px are the
   right settings on paper; nobody has held a printed card yet.
4. **Walk the three platform guides on real accounts.** They are written from how those editors
   work, not from someone doing it. Squarespace in particular changes its editor regularly.

## Deliberately not built

- **A short link / custom domain** (`book.studio.com/oxatl`). Wants the hosted domain work in
  `src/lib/hosted/domains.ts` to be connected first. The full URL is not pretty but it works today.
- **Per-teacher links.** Belongs with PRD-021, not here.
- **Webflow and Showit steps.** Those are designer-built sites, which almost always means a handoff
  rather than a self-install. The "send them the snippet" line covers it until asked for.
- **Translated nav labels for all 19 locales.** English fallback is honest; invented translations
  are not.

## Open question

**Does an owner find this, or does it need to be in onboarding?** A nav entry fixes "cannot find
it at all" and does not fix "never thought to look." Getting the booking link in front of an owner
during setup, as a step that ends with them pasting it into their Instagram bio, is probably worth
more than everything above. That is an onboarding change (`/manage/onboarding`), and it should be
informed by whether pilot studios actually reach this page on their own.

---

## Related

- [PRD-020](PRD-020-express-booking.md) — the one-tap booking page these links point at
- [docs/positioning/AUDIENCES.md](../positioning/AUDIENCES.md) — surface 4 rules, which this follows
- [docs/guides/website-embed.md](../guides/website-embed.md) — the owner-facing widget guide
- [docs/competitive/MANGOMINT.md](../competitive/MANGOMINT.md) — where the install-friction question came from
