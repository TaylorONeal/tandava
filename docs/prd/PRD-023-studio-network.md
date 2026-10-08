# PRD-023: Studio Network (cross-studio credits, studio-controlled)

## Overview
**Phase:** 10 (Marketplace, matching `docs/ROADMAP.md`; after the pilot studio is live and PRD-020/022/024 are verified)
**Priority:** P1 strategic, P3 by date. Nothing here is buildable before there are several studios in one city.
**Status:** Spec. Nothing exists in code. Today a pass belongs to one studio (`class_packs.studio_id`, `memberships.studio_id`) and there is no concept of a credit that works across studios.
**Origin:** Taylor, Oct 8 2026: "Cross like ClassPass is a great idea but we need to be better than ClassPass, the studio must be able to enable or disable it, and we must show the studio its value and ROI."
**Working name:** Studio Network. The member-facing name is a decision for later (not "Tandava Pass" until it is checked for trademark overlap).

---

## What we are not building
Not an aggregator that sits between the studio and the student. ClassPass's model, as studio owners commonly describe it: a per-visit payout well below the studio's own drop-in price, visitors the studio cannot contact or convert, no control over which classes or how many seats, and existing members who move their spend to the aggregator because it is cheaper. Whether every one of those complaints is fair is beside the point. They are the reasons owners say no, and each one is a design constraint here.

The job is the opposite: a studio with empty seats tonight fills them with people it can keep, on its own terms, and can see exactly what it earned from it.

---

## Jobs to Be Done

### Job 1: Studio owner — fill seats I would have lost anyway
**When** the 6 AM Tuesday class has seven empty mats an hour before it starts,
**I want** those seats offered to people who are not my members, at a price I set,
**So I can** earn something from a seat that was about to earn nothing, without undercutting the people who already pay me.

### Job 2: Studio owner — know whether this is worth it
**When** I look at the network after a month,
**I want** to see seats filled, revenue earned, new people discovered, and how many of them became members,
**So I can** turn it up, turn it down, or turn it off with evidence rather than a feeling.

### Job 3: Member — practise when I travel, or try somewhere new
**When** I'm in another city, or curious about the studio down the road,
**I want** to book a class there as easily as at home, with the same account,
**So I can** keep my practice without a new signup and a new app.

### Job 4: Studio owner — keep the relationship
**When** a network visitor takes a class with me,
**I want** them to be my member record, with contact permission, and a clean path to joining,
**So I can** convert a visitor into a member, which is the entire point of letting them in.

---

## Principles (what "better than ClassPass" means in practice)

| Principle | What it means in the product |
|---|---|
| **Opt in, per studio, per class, reversible** | Off by default. A studio chooses which offerings, which days and times, how many seats per class, and can pause with one switch. Nothing is released without a setting the owner touched. |
| **Only seats that would have been empty** | Seats are released into the network inside a window the studio sets (default: from 24 hours before class until the booking cutoff), and only unsold seats. A member booking at any time takes priority; a released seat is withdrawn the moment a member or drop-in books it. |
| **The studio sets the price** | Floor price per offering, defaulting to the drop-in price. The network never sells below the floor. Credits map to money, not to an opaque points scale. |
| **No cannibalisation** | A studio's own current members and recent drop-ins cannot use network credits at that studio (default 90-day lookback, configurable). The network is for people who are not already paying this studio. |
| **The studio owns the visitor** | A network booking creates a `studio_members` row at that studio with the booking, waiver, and contact consent (asked once, at the first network booking). The visitor is in the studio's roster, campaigns and analytics like anyone else. |
| **Conversion is the goal, and it is free** | After a visitor's second (configurable) visit, the member app shows the studio's own intro offer. Memberships, packs, workshops, retreats and privates sold to a converted visitor carry no network fee, ever. Tandava earns on the seat it filled, not on the relationship the studio built. |
| **Transparent economics before enabling** | The settings screen shows the payout per seat at the studio's floor, the Tandava fee, and last month's empty-seat count, before the switch is turned on. |
| **Caps that favour the studio** | Per-visitor cap per studio per month (default 3). After the cap, the only way to keep coming is to join the studio. ClassPass caps protect ClassPass; these caps push conversion to the studio. |

---

## How it works

### Member side
1. Credits are bought in the member's account (web checkout; see store note below) or granted by a home studio that opts into reciprocity (phase 2).
2. Explore (PRD-022 chrome) lists network-eligible classes near the member, each with the credit price and the studio's name and colors. Tapping opens that studio's canvas, exactly as a deep link would.
3. Booking a network seat uses a **new atomic path**, not the existing one: `book_class()` (migration 00012) accepts only `membership` and `class_pack` and raises `Unsupported payment source` for anything else, and it knows nothing about released seats. A `book_network_seat(occurrence, profile, release)` function, under the same row lock as `create_guest_booking()`, must in one transaction: verify the release is live and has quota left, verify the member is eligible (not excluded by the lookback, under the cap), debit the credit ledger at the floor price, insert the `bookings` row with `source_type = 'network_credit'` and the release id, and decrement the release. Any failed check rolls back the debit. The resulting booking then gets the same calendar event and the same cancellation policy as the studio's drop-ins; a cancellation inside policy credits the ledger back and returns the seat to the release if the window is still open.
4. The first booking at a studio asks for the studio's waiver and for contact consent ("Let Aloha Yoga email you about classes"). One screen, defaults off.
5. After the second visit, the studio's intro offer appears on the confirmation. After the cap, booking says: "You've used your 3 network visits at Aloha Yoga this month. Join Aloha Yoga from $X." The studio's own offer, not ours.

### Studio side
- `/manage/settings/network`: on/off; offerings and time windows; seats per class; release window; floor price per offering; member lookback; per-visitor cap; contact consent copy. Each setting shows what it changes in plain words.
- `/manage/schedule`: released seats are visible on each class ("3 network seats released, 1 taken").
- `/manage/analytics/network`: the ROI view (below).
- Payouts: Stripe Connect transfer per network booking at the floor price minus the Tandava fee, on the same schedule as other payouts, itemised.

### Economics
- The studio's base plan stays flat ($99/month per `docs/roadmap/PRICING_MODELS.md`). The network is the one place a percentage fee makes sense, because every network booking is revenue the studio would otherwise not have had. Proposal: Tandava keeps 20% of the credit price; the studio keeps 80% of a seat that was earning 0%. Decision for Taylor, with the pilot's data.
- Credit pricing is cash-denominated (a credit is $1, or local equivalent) so the floor price is legible. No bundles in v1; volume discounts only after there is evidence they move behaviour.
- Credits expire after 12 months, refundable before first use. Legal review before launch (gift-card and prepaid rules vary by state and country).

---

## ROI analytics: the proof the studio sees

The analytics page answers one question: **what did the network earn me that I would not have had?** Everything on it is built from facts the system already records, with the counterfactual stated honestly.

| Tile | How it is computed | Why the studio trusts it |
|---|---|---|
| **Seats filled** | Network bookings that were attended (check-in) | Seats were released only when unsold inside the window, so each one is a seat that was empty when released |
| **Displaced drop-ins (estimate)** | Of released seats, the share that historically sold as drop-ins inside the same window at this studio, last 90 days | Shown as a range, labelled estimate. Hiding it would be the ClassPass move |
| **Net new revenue** | Network payout minus displaced-drop-in estimate | The number the owner decides on |
| **Discovery** | People whose first-ever record at this studio came from a network booking | From `studio_members.source = 'network'` |
| **Conversion** | Discovered people who later bought a membership, pack, workshop, retreat or private here, within 90 days, and what they paid | Joined through `transactions.profile_id`; attribution rules in PRD-024 |
| **Repeat** | Discovered people with 2+ visits; cap hits | Shows whether visitors are samplers or future members |
| **Per class type** | All of the above by offering and time slot | Finds the 6 AM problem and the Saturday non-problem |
| **Recommendation** | "Tuesday 6 AM averaged 7 empty seats over 8 weeks. Releasing 4 at your floor would have earned about $X." | Computed from `class_occurrences.booked_count` history; the owner can act on it with one tap |

Monthly owner email with the same numbers (PRD-007 lifecycle automation carries it). The email is the retention mechanism for the feature: an owner who sees "$412 net new, 3 members converted" keeps it on.

---

## Data model (sketch)

| Table / column | Purpose |
|---|---|
| `studio_network_settings` (one row per studio) | enabled, release_window_hours, member_lookback_days, visitor_monthly_cap, contact_consent_copy, fee_bps (platform-set, visible) |
| `network_offering_rules` | studio_id, offering_id, weekday/time filters, seats_per_class, floor_price_cents, enabled |
| `network_releases` | class_occurrence_id, seats_released, released_at, withdrawn_at; written by a scheduled job inside the window, withdrawn when a member books |
| `network_credits` | profile_id, balance_cents, purchases and debits (ledger, append-only) |
| `bookings.source_type` gains `network_credit`; `bookings.network_release_id` | The booking stays in `bookings`: rosters, waitlist, check-in and calendar need no special case (same reasoning as PRD-020). Written only by `book_network_seat()` |
| `book_network_seat()` (new RPC, service role) | Atomic eligibility + quota + ledger debit + booking insert; `book_class()` is left untouched |
| `studio_members.source` | `network`, `express`, `import`, `signup`; first-touch of the relationship with this studio |
| `transactions.network_fee_cents` | Itemised fee, so payouts and the ROI page agree to the cent |

Scheduled job: every 15 minutes, for each enabled studio, compute releasable seats for occurrences inside the window and upsert `network_releases`; withdraw releases for occurrences that filled.

---

## Gates (in order)
1. Pilot studio live on the web with verified payments (hosted product review gates). A network on an unverified payment core is two unverified things.
2. PRD-022 shipped (Explore in the chrome, passes grouped by studio).
3. PRD-024 attribution live, because the ROI page is an attribution report.
4. Three or more studios in one city willing to pilot with the switch on. Austin is the obvious first market.
5. Legal read on prepaid credits (expiry, refunds, state rules) and on cross-studio waivers.
6. Store review note: credits buy real-world classes, so App Store 3.1.3(e) applies and Stripe stays. Buy credits on the web in v1 to avoid the argument; revisit in-app purchase of credits only if conversion data says it matters.

## Non-goals
- Reciprocity between studios (a home membership that roams) is phase 2. It needs the first phase's data to price.
- Selling the network to studios that are not on Tandava. Supply comes from Tandava studios; that is what keeps the controls honest.
- Ranking or reviews across studios on Explore in v1. Alphabetical by distance; the studio's own page sells it.
- Any seat released outside the owner's settings, for any reason, including Tandava's revenue.

## Success metrics
| Metric | Target |
|---|---|
| Studios that enable it after seeing the settings page | 50% of studios in a city with 3+ studios |
| Studios that keep it on after 60 days | 80% of those |
| Net new revenue per enabled studio per month | Baseline first; the number has to be visible before it has a target |
| Network visitors converting to a studio purchase within 90 days | 15% |
| Owner complaints about cannibalisation | Zero that the lookback rule does not already answer |

## Open questions for Taylor
1. Fee: 20% proposed. Alternative: flat per-seat fee (simpler to explain, worse for cheap classes).
2. Cap default: 3 visits per studio per month, or per city?
3. Name. "Studio Network" is the working name; the member-facing name needs a trademark check.
4. Should a studio be able to offer network seats at a *higher* price than drop-in (visitor premium)? The floor allows it; the question is whether the UI should encourage it.

## Related
- PRD-022 (Explore, passes, home studio), PRD-024 (attribution and the ROI page), PRD-020 (the guest identity a network visitor without an account would use), PRD-007 (the monthly owner email), `docs/roadmap/PRICING_MODELS.md` (flat base plan), `docs/ROADMAP.md` Phase 10 "ClassPass integration" (superseded by this: Tandava's own network first; a ClassPass connector only if a studio asks and the commercial terms exist).
