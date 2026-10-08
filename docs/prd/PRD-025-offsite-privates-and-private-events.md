# PRD-025: Off-site privates and private events (corporate, parties, group bookings)

## Overview
**Phase:** 7, after PRD-021 v1 (1:1 privates in the studio)
**Priority:** P1. This is where a small studio's highest-margin revenue already is, and none of it is in the software.
**Status:** Spec. Nothing exists. `events` (workshops, migration 00003) and `instructor_availability` (00006) are the two things to build on.
**Origin:** Taylor, Oct 8 2026: do privates have on-site vs off-site (home or other)? Hosting an event, corporate or party, off-site or with a room in the studio?

---

## The three things people actually ask a studio for

1. **"Can you come to me?"** A 1:1 or small private at the client's home, office, hotel or a park. Same service as PRD-021, different place, plus travel.
2. **"Can you do a class for my team?"** Corporate wellness: a one-off or weekly class at an office (or online), paid by a company, attended by people who are not members and may never be. Invoiced, not swiped.
3. **"Can we have the studio for a party?"** Birthday, bachelorette, team offsite, retreat day: a group booking that takes a room, usually a teacher, sometimes just the room, with a deposit, a headcount and a waiver for every attendee.

Today all three happen by text and bank transfer, and the studio's calendar, roster, waivers and books don't know. The owner's two questions are "is the room free and is the teacher free" and "did they pay the deposit". Both are answered by the software only if the booking lives in it.

---

## Jobs to Be Done

### Job 1: Owner — quote it in two minutes, not two days
**When** a company emails asking for a weekly class for 20 people at their office,
**I want** to send a quote with the price, the teacher, travel and the terms from one screen,
**So I can** win the booking before they email the next studio.

### Job 2: Teacher — go to a stranger's home safely and get paid for the trip
**When** I accept an off-site private,
**I want** the address confirmed, the travel paid, and the studio to know where I am,
**So I can** say yes to more of them.

### Job 3: Client — book a party without a phone tag
**When** I'm organising a group,
**I want** to pick a date, say how many people, pay a deposit, and send one link so everyone signs the waiver,
**So I can** stop being the middleman.

### Job 4: Owner — turn 20 strangers at an office into members
**When** a corporate class ends,
**I want** every attendee to be a member record with consent, and an offer in their inbox,
**So I can** make the corporate account a funnel, not a one-off.

---

## The model: one site concept, two inventories

Two existing concepts carry this with one addition each. No new inventory type.

| What the person asks for | Inventory | What is added |
|---|---|---|
| Private 1:1 or duet, anywhere | `appointments` (PRD-021) | a **site** |
| Group booking of any kind (corporate class, party, team offsite, room rental) | `events` (00003: sessions, registrations, pricing tiers, teachers) | `visibility = private`, a **client**, a **quote**, a **site** |

A private event is a workshop nobody can find: same roster, same check-in, same registrations, same calendar block, hidden from the schedule and bookable only through the client's link. That reuse is the point: rooms, teacher conflicts, registrations and check-in already exist for workshops and do not need a second implementation.

### Site (shared by appointments and events)
| Field | Values | Notes |
|---|---|---|
| `site_type` | `studio_room`, `client_address`, `public_place`, `online` | `studio_room` blocks the room like a class does; `online` reuses `virtual_link` |
| `address` | structured, geocoded | Shown to the teacher only after confirmation; never on a public page |
| `travel_fee_cents`, `travel_minutes_each_way` | computed from the studio's travel policy, editable | Travel time blocks the teacher's availability before and after, so they are not booked back-to-back across town |
| `access_notes` | parking, gate code, floor, contact on site | Visible to the assigned teacher from 24 hours before |
| `equipment` | mats, blocks, speaker: who brings what | Checklist on the teacher's day sheet |

### Travel policy (`/manage/settings/privates`, defaults with info icons per PRD-023's rule)
| Setting | Smart default | Info text |
|---|---|---|
| Service radius | 15 km / 10 mi from the primary location | "Off-site requests beyond this show 'ask us' instead of a price." |
| Travel fee | Flat $25 up to 10 km, then $2/km (studio currency) | "Added to the quote and shown before the client books. Paid to the teacher unless you set a split." |
| Travel time buffer | 30 min each way inside the radius | "Blocks the teacher's calendar so they aren't double-booked across town." |
| Minimum notice for off-site | 48 hours | "Off-site needs confirmation of the address and the teacher's travel." |

### Safety (non-negotiable defaults, studio can tighten, not loosen)
- An off-site private is **request mode only** (PRD-021 US-21.8); never instant. The teacher accepts the person and the place, not just the time.
- The client's identity is verified at least by a paid deposit on a card; for a home address, the studio can require a prior studio visit (default on for the first booking).
- The teacher's day sheet has a "share my location with the studio" toggle and a one-tap "I've arrived / I've left" check-in that the front desk sees; a missing "left" 30 minutes after the end pings the studio contact.
- Any teacher can decline off-site work by default without it counting against them; off-site is opt-in per teacher in `/teach/availability`.
- These are policy defaults, not a guarantee; the help text says exactly that.

---

## Quote workflow (events) and the "never a no" rule
Follows PRD-021's request flow, with money shaped for groups.

1. **Request** (public link `/s/:slug/private-events`, no account): what kind (corporate class, party, team offsite, room only, other), where (our studio / your place / online), preferred dates (up to 3), headcount (range), budget (optional), notes, company name if invoicing.
2. **Instant estimate** before submit, from the studio's price list: base price for the format + per-person over the included headcount + travel + room. Shown as "from $X" with the breakdown. Dates that conflict with the room or the likely teacher show the nearest free dates (PRD-021's generated alternatives).
3. **Quote** (owner or front desk, one screen): pick teacher(s), room, confirm price lines, deposit (default 30%, min $50), terms (cancellation, headcount changes allowed until 48 h before, overtime rate), waiver requirement. Send; the client gets a link.
4. **Accept** = pay the deposit (card) or accept an invoice (companies: PO number, net 30, Stripe invoicing). Acceptance creates the private event, blocks the room and teacher, and issues the client an **attendee link**.
5. **Attendees** register through the link as guests (PRD-020 identity): name, email, waiver (versioned, per person), dietary/accessibility note if the event asks. The client sees the count and can nudge non-signers. Headcount lock at 48 hours; final price adjusts within the agreed range.
6. **Day of**: teacher day sheet (site, access notes, equipment, roster, waivers signed/missing); check-in by the teacher's phone; "arrived / left" for off-site.
7. **After**: balance captured or invoice sent; attendees get the studio's intro offer (consent-gated); the owner sees the event in revenue and in attribution (PRD-024: `source = private_event`, campaign = the client).
8. **Recurring corporate**: a quote can be weekly; each occurrence is a session of the same private event with its own roster; one monthly invoice.

Counter-proposals, holds, escalation timers and the student status page are exactly PRD-021 US-21.8/21.9. A declined date never ends the thread; it proposes.

---

## Pricing elements the studio sets once (`/manage/offerings` → "Private events")
| Element | Example | Default |
|---|---|---|
| Format | Corporate class 60 min, Party 90 min, Room rental per hour, Retreat half-day | Four templates, editable |
| Base price, included headcount | $350 includes 15 | Studio enters; estimate from recent workshop pricing if blank |
| Per extra person | $15 | |
| Room fee (studio-site) | $75/h | From `locations.rooms` when the studio sets it |
| Travel | per policy above | |
| Teacher pay | per-event rate or % of base; travel to the teacher by default | Hooks PRD-002 compensation |
| Deposit | 30%, min $50 | |
| Cancellation | Full refund to 7 days, deposit kept inside 7 days, no refund inside 48 h | Shown on the quote and the attendee link |

---

## Data (sketch)
- `sites` (id, studio_id, site_type, address fields, lat/long, access_notes) referenced by `appointments.site_id` and `events.site_id`
- `events`: add `visibility` (`public` | `private`), `client_profile_id`, `client_company`, `quote_id`
- `event_quotes`: event draft fields, price lines JSON, deposit, terms, status (draft, sent, accepted, expired, declined-with-alternative), invoice id
- `event_registrations`: already per attendee; add `waiver_template_version_id`, `invited_via_link`
- `studio_travel_policy` columns on `studios`
- Teacher: `instructor_availability.offsite_ok`, `teacher_site_checkins` (event or appointment, arrived_at, left_at, location opt-in)

---

## Gates
1. PRD-021 v1 live (appointments, request flow) and PRD-020 verified: attendee links and quotes ride on the guest identity path.
2. Versioned waivers wired (PRD-020 gate 10): a party of 20 strangers without a real waiver is a liability, not a feature.
3. Stripe invoicing for companies set up on the Connect account (Standard accounts can issue invoices; confirm in the pilot).
4. Insurance read: off-site teaching is often excluded or priced differently by studio insurers. The help text must tell owners to check, and the off-site switch stays off until they confirm.

## Non-goals
- Catering, venue sourcing, or anything that makes Tandava an events agency. The studio hosts; the client brings the rest.
- Multi-day retreats with lodging: PRD-003/events already cover registration; lodging and travel logistics stay out.
- Marketplace listing of private-event availability (the Network is for seats in classes, not parties).

## Help and FAQ entries
Pre-signup: "Can students book a private at their home?", "Can I host corporate classes or parties?", "Does Tandava handle invoicing a company?"
In app: travel policy info icons; the safety defaults explained on the teacher's off-site opt-in; the insurance note on the off-site switch; a "How quotes work" panel on the first quote.

## Success metrics
| Metric | Target |
|---|---|
| Private events booked through the link vs logged after the fact | 70% through the link in 90 days |
| Quote to acceptance time | Under 48 hours median |
| Attendees who sign the waiver before the day | 90% |
| Attendees who become members within 90 days | Baseline first |
| Teachers opting in to off-site | Measured |

## Related
PRD-021 (1:1 privates, request flow), PRD-020 (guest identity and attendee links), PRD-022 (calendar event for the site), PRD-024 (attribution of attendees), PRD-002 (teacher pay), PRD-023 (what the Network is and is not for).
