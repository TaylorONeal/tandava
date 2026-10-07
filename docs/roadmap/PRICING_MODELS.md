# Pricing models for Tandava Cloud

**Date:** 2026-10-07
**Status:** Roadmap exploration. Not approved pricing. The working default stays $99/month flat
(`docs/IMPLEMENTATION_HANDOFF.md`).

---

## Why this document exists

The Mangomint brief ([docs/competitive/MANGOMINT.md](../competitive/MANGOMINT.md) section 3) argued
that per-seat pricing is structurally wrong for class-based studios and that flat pricing with
unlimited teachers is a wedge. That is still the recommendation for the headline. But Mangomint's
model is more interesting than "wrong," and dismissing it loses the part worth borrowing.

This records what is interesting, what is not currently supported, and what a roadmap version
would need.

---

## What Mangomint actually does

As of 2026-08-01: **$120/month per location + $10/month per user**, one plan, all core features.
Add-ons: Phone $70/month per line, marketing credits from $30/month. Processing 2.45% + $0.15 in
person, 2.90% + $0.30 online.

The design insight: in a salon, **a user is a revenue centre**. Every service professional occupies a
chair, books their own clients, and produces attributable revenue. Charging per user is charging per
unit of production. It scales with the customer's business and it is trivially easy to explain.

That is a good pricing model. It is just a good pricing model for salons.

## Why it does not transfer to class studios

A yoga studio's staff shape is inverted. A long tail of part-time teachers each teach two or three
classes a week. They are not revenue centres; the *class* is, and one teacher can fill a 25-person
room. Charging per teacher charges for the bench.

| Studio shape | Users | Mangomint | Tandava flat |
|---|---|---|---|
| Small, 1 location | 8 | $200 | $99 |
| Typical, 1 location | 17 | $290 | $99 |
| Busy, 1 location | 25 | $370 | $99 |
| Two locations, 30 users | 30 | $540 | TBD |

So the headline message stays: **unlimited teachers, always, because a studio with more teachers is
not a studio using more software.**

---

## The part worth borrowing

Two things, neither of which is per-teacher pricing.

### 1. Per-location is defensible; per-teacher is not

A second location is genuinely a second business: more rooms, more schedules, more reporting, more
support load. Mangomint charges per location and almost nobody objects. Tandava currently has no
multi-location pricing position at all, and `locations` is schema-only.

**Roadmap:** a per-location component is the right place to put expansion revenue. It tracks the
customer's growth, it is easy to explain, and it does not punish the staffing pattern the product is
built for.

### 2. A seat concept for *staff with system access*, not for teachers

There is a real distinction Tandava does not currently model in pricing:

| Role | What they do | Should they cost? |
|---|---|---|
| Teacher | Teaches classes; uses `/teach` to see their schedule, claim subs, see earnings | **No.** This is the bench. Charging for it is the trap. |
| Front desk | Checks members in, takes payments, manages bookings | Arguably. They are operational capacity. |
| Manager / admin | Schedules, pricing, reporting, settings | Arguably. |
| Owner | Everything | Included. |

A model of *flat base + per-location + unlimited teachers + a small charge above N admin seats* keeps
the wedge intact (teachers are always free, which is the sentence that sells) while letting revenue
scale with a growing operation.

**This is not currently supported.** What exists and what would be needed:

| Needed | State |
|---|---|
| Role-scoped staff records | Exists: `studio_staff.role`, `get_my_effective_role()` (migration 00017) |
| Per-studio seat counting by role | Does not exist |
| Multi-location billing entity | `locations` is schema-only; no billing relationship |
| Platform subscription entitlement, separate from studio payments | Scaffold only; named as a blocker in `IMPLEMENTATION_HANDOFF.md` |
| Seat-count enforcement (block, warn, or bill-after) | Does not exist |
| Proration on seat and location changes | Does not exist |

### 3. Simplification as a competitive act

The most instructive thing Mangomint did was not the per-user charge. It was moving Forms, Web Chat,
and every integration add-on from paid to included, and collapsing three tiers into one. That is a
company spending add-on revenue to remove friction from the buying decision.

**Implication for Tandava:** resist the tier ladder. One plan, one price, everything included, is a
position that is hard to attack and cheap to explain. Any feature we are tempted to make an add-on
should first be tested against "would a studio churn over paying extra for this."

---

## Candidate models

| Model | Shape | Pro | Con |
|---|---|---|---|
| **A. Flat (current default)** | $99/mo, everything, unlimited everything | Simplest possible sentence. Maximum contrast with the field. | No expansion revenue. A 4-location, 60-staff business pays the same as a one-room studio. |
| **B. Flat + per-location** | $99/mo first location, $N per additional | Keeps the teacher wedge, adds expansion revenue, easy to explain | Needs the multi-location billing entity |
| **C. Flat + per-location + admin seats above N** | B, plus a charge above ~5 admin seats | Scales with real operational size; teachers still free | More to explain. Risks sounding like per-seat pricing, which is the thing we are attacking. |
| **D. Percentage of studio revenue** | A cut of bookings | Perfectly aligned with customer success | `IMPLEMENTATION_HANDOFF.md` explicitly rejects a Tandava percentage fee. Studios hate it. Reverses the open-source trust position. |

**Recommendation:** ship A for the pilot. Move to B once multi-location is real, because a second
location is where the cost actually lands. Treat C as a later option and only if pilot data shows
single-site studios subsidising large multi-site ones. Keep D off the table.

## Risk to watch

The Mangomint brief's monitoring plan already includes this: if Mangomint introduces a cheap
non-revenue seat type (a $2 to $3 "instructor" seat), the pricing wedge narrows sharply and the
argument has to shift back to the domain model. Flat pricing is a good position; it is not a moat.

---

## Related

- [docs/competitive/MANGOMINT.md](../competitive/MANGOMINT.md) section 3
- [docs/IMPLEMENTATION_HANDOFF.md](../IMPLEMENTATION_HANDOFF.md) — the three pre-pilot decisions
- [docs/positioning/AUDIENCES.md](../positioning/AUDIENCES.md) — which surface may say what about price
- `docs/architecture/MULTI_TENANCY.md` — what multi-location would require technically
