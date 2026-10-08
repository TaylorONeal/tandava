# PRD-021: Privates and appointments

## Overview
**Phase:** 7
**Priority:** P1
**Status:** Planned (not started). Oct 8 2026 answer to "how are private bookings working?": they are not, yet. No `appointments` table, no request workflow, no room check. `instructor_availability` exists (migration 00006) and drives a display-only screen. This revision adds the request-and-approve flow, room handling, and the rule that no request ends in a bare "no".
**Owner:** TBD
**Origin:** [docs/competitive/MANGOMINT.md](../competitive/MANGOMINT.md) sections 1 and 6

---

## The observation this starts from

Most private sessions at most studios are not in the software. A student asks a teacher after class,
they text about a time, money moves by Venmo or cash, and the studio never sees it. That is not a
scheduling problem. It is a problem of the private being outside the system entirely.

Two consequences:

1. **The studio cannot help.** It cannot promote privates, cannot package them, cannot refer a new
   student to the right teacher, cannot take the cut it is arguably owed for the room.
2. **The teacher does the admin.** They are the scheduler, the invoicer, and the reminder system, for
   one client at a time.

So the goal is not "add appointment booking because Mangomint has it." The goal is to make the private
session worth putting in the system, for the teacher first. If a teacher's answer to "why would I use
this instead of texting?" is "no reason," nothing else in this PRD matters.

### Honest statement of the risk

This may not work. Teachers taking privates offline is partly about convenience and partly about
keeping 100% of the money and the relationship. A studio that introduces a revenue split on privates
that previously bypassed it is asking teachers to accept a pay cut, and they will simply keep texting.

**That makes the revenue-split model the central product question, not an implementation detail.**
Build the scheduling first with a studio-configurable split that can be set to 0%, and let studios
decide. Do not assume a split, and do not ship a flow that only makes sense if the studio takes a cut.

---

## Why Tandava should do this at all

From the competitive brief: **"class-native and appointment-capable" is an unoccupied position.**
Mangomint is appointment-only and cannot schedule a class. Mindbody and Momence treat privates as a
weak afterthought. A studio running classes, privates, and bodywork currently buys two systems or
compromises.

Adding appointments to a class-native core is a smaller lift than adding class scheduling to an
appointment-native core, which is precisely why Mangomint cannot come the other way. That asymmetry is
the strategic reason to build this, and it only holds while the class core stays strong.

---

## Jobs to Be Done

### Job 1: Teacher — less admin than texting
**When** a student asks me about a private,
**I want** to send one link that shows my real availability and takes the deposit,
**So I can** stop being a scheduler and a bill collector.

### Job 2: Student — book a private as easily as a class
**When** I want one-on-one time with a specific teacher,
**I want** to see when they are actually free and book it,
**So I can** stop a four-message text thread.

### Job 3: Studio — see and grow private revenue
**When** privates happen in my space,
**I want** them visible, packageable, and attributable,
**So I can** promote them, sell them in bundles, and know what the room is earning.

### Job 4: Studio — upsell the new student
**When** someone takes their first class,
**I want** to offer a private intro at the right moment,
**So I can** convert a drop-in into a committed student.

---

## Goals

- A teacher publishes availability and gets a shareable booking link.
- A student books a private without an account (reuses PRD-020's express path).
- Privates appear on the studio calendar alongside classes without distorting class capacity.
- Privates can be sold singly or in packs, and bundled with memberships.
- Configurable revenue split per studio, defaulting to **100% teacher** so the feature is adoptable
  before the money conversation.

## Non-goals

- **Becoming salon software.** No chairs, no resource trees, no medspa charting, no HIPAA.
- **Multi-provider appointments.** One student, one teacher, one slot in v1.
- **Replacing class scheduling.** Appointments are a second inventory type, not a refactor of the
  first.
- **Group appointments.** Two students in one private (a duet) is a real pilates need and is phase 2
  of this PRD, deliberately after the 1:1 case works.

---

## The modelling question

This is the decision that determines whether the feature fits the domain model or fights it.

`CLAUDE.md` is explicit that distinct domain concepts must not be collapsed. A private session and a
class occurrence are genuinely different: a class is scheduled first and filled after; a private is
created *by* the booking. Capacity-1 is an accident of the shape, not the essence.

| Option | Shape | Assessment |
|---|---|---|
| **A. `class_occurrences` with capacity 1** | Reuse everything | Tempting and wrong. Every capacity, waitlist, roster, and schedule query would need an "except privates" branch, and a private has no existence before its booking. This collapses two concepts, which `CLAUDE.md` forbids. |
| **B. New `appointments` table + `appointment_types`** | Parallel inventory type | Correct separation. Costs duplicated query surface for calendars and reporting, which is honest work rather than hidden debt. |
| **C. Generalise both into `scheduled_events`** | One abstraction over both | The right end state on a whiteboard and the wrong move now. It means migrating a working class model to serve a feature with no validated demand. |

**Recommendation: B.** Revisit C only if a third inventory type appears.

### Sketch

| Table | Purpose |
|---|---|
| `appointment_types` | What can be booked 1:1: name, duration, price, which teachers offer it, location/room needs |
| `appointments` | One booked session: teacher, student profile, type, start/end, status, transaction |
| `instructor_availability` | **Already exists** (migration 00006, PRD-001). Currently drives the `/teach/availability` screen. Would become the source of bookable windows. |
| `appointment_requests` | A request before it becomes an appointment: student profile (guest or member), type, teacher or "any", up to three proposed times, note, status (requested, proposed, accepted, expired, handed_off), Stripe authorisation id, expiry. Proposed alternatives live on the same row as a JSON list with who proposed them. |
| `appointment_packs` | Privates sold in bundles. Likely reuses the `class_packs` pattern rather than a new one. |
| `appointment_types.booking_mode`, `room_requirements` | `instant` or `request`; which rooms (or none) the type needs |
| `studios.private_revenue_split_bps` | Studio's share, default 0 |

Note what already exists and is reusable: `instructor_availability`, the entitlement engine's
scope-by-offering pattern, `express_booking_claims` and the whole PRD-020 guest identity path, and
`create_guest_booking`'s capacity-lock discipline.

---

## User Stories

### US-21.1: Teacher publishes availability
- [ ] `/teach/availability` becomes bookable windows, not just a display
- [ ] Per-type opt-in: a teacher offers "60-min private" but not "90-min bodywork"
- [ ] Buffer before/after, and a minimum notice period
- [ ] Teaching a class automatically blocks that window
- [ ] Teacher can block time without explaining why

### US-21.2: Teacher gets a shareable link
**The whole adoption bet is here.** If this link is not easier than texting, nothing else lands.

- [ ] `/t/:teacherSlug` shows real availability for that teacher's offered types
- [ ] Copyable from `/teach` in one tap, for Instagram bio or a text reply
- [ ] Works with no account on the student side (PRD-020 path)
- [ ] Teacher is notified immediately on a booking

### US-21.3: Student books a private
- [ ] Pick type, see honest availability, pick a slot, pay or deposit
- [ ] Cancellation policy stated before the button (per PRD-020's rules)
- [ ] Reschedule within policy without contacting anyone
- [ ] Add to calendar on confirmation (PRD-022 calendar module), with the room and the teacher's name

### US-21.8: Request a time that isn't published (Oct 8 2026)
Instant booking against published windows is the fast path. Most real private requests are "could we do Thursday around 4?" and the answer from the software must never be a dead end. Every path either books, proposes, or holds; nothing just declines.

**Two booking modes per appointment type, set by the teacher (studio can set a default):**
- **Instant:** published windows book immediately (US-21.1 to 21.3).
- **Request:** the student proposes up to three times; the teacher confirms one or proposes others. Default for a teacher who has not published windows yet, so the feature works on day one with zero setup.

**The request form (student, no account required via PRD-020):**
- [ ] Type, preferred teacher (or "any teacher who offers this"), up to three preferred times, a note
- [ ] Before submit, each preferred time is checked against teacher availability, the teacher's classes, existing appointments and **room** availability. A time that can't work is marked, with the nearest two times that can, so the student fixes it before asking: "Thu 4:00 PM: Daniella is teaching. Thu 5:30 PM and Fri 4:00 PM are open."
- [ ] A card or deposit is authorised at request time and **captured only on acceptance** (Stripe manual capture; authorisations last 7 days, so requests expire at 6 days unanswered). Nobody is charged for a request that was not accepted.
- [ ] Requested times are soft-held for 24 hours against other requests, not against member class bookings (a hold never blocks a class).

**The teacher's side (`/teach/requests`, push + email):**
- [ ] One screen per request: student, type, the three times with conflicts already shown, the note
- [ ] Three buttons, all positive: **Accept** (picks one of the times), **Propose other times** (teacher taps two or three slots from their own calendar; the student gets a link and accepts with one tap, no account), **Hand to the studio** (front desk takes it: another teacher, another room, a package)
- [ ] No "Decline" button. A teacher who cannot do it proposes or hands off. If every path is exhausted, the studio replies with the waitlist option below. The copy the student sees is always "here's what we can do", never "no".
- [ ] Unanswered after 12 hours: reminder to the teacher. After 24 hours: front desk sees it in `/manage/inbox` and can act. After 6 days: request expires, authorisation released, student told and offered the teacher's next published windows.

**Rooms:**
- [ ] `appointment_types.room_requirements` (any room / specific rooms / no room, e.g. outdoor or online)
- [ ] Room assignment at acceptance; conflicts with classes and other appointments checked under the same lock discipline as `create_guest_booking`
- [ ] A teacher can accept with a different room than requested; the student sees the room on the confirmation and the calendar event

**Alternatives are generated, not typed:**
- [ ] Same teacher, nearest open slots (two before, two after the asked time)
- [ ] Same time, another teacher who offers the type (only if the student picked "any teacher")
- [ ] Notify-me: hold the student's interest in a slot that is taken; if it opens (cancellation), they get first refusal for 2 hours
- [ ] Each alternative is one tap to accept from the message or the app

**Studio controls (`/manage/settings/privates`):**
- [ ] Default mode (instant / request) for new appointment types
- [ ] Response-time targets and who gets the escalation
- [ ] Whether front desk can accept on a teacher's behalf
- [ ] Deposit amount or full payment at request

### US-21.9: What the student sees while waiting
- [ ] A status page (`/s/:slug/requests/:id`, signed link): requested, teacher looking, proposed times (accept here), confirmed, expired
- [ ] Every status message says the next step and when: "Daniella usually replies within a few hours. If you don't hear by tomorrow 4 PM, the studio will step in."
- [ ] Confirmation adds the appointment to the calendar (PRD-022) and tells the student how to reschedule

### US-21.4: It appears on the studio calendar
- [ ] `/manage/schedule` shows privates alongside classes, visually distinct
- [ ] Room conflicts between a private and a class are prevented
- [ ] Front desk sees privates on the day view and can check the student in

### US-21.5: Privates are sellable as product
- [ ] Sell as a pack ("3 privates")
- [ ] Bundle with a membership ("Unlimited + 1 private/month")
- [ ] Member pricing distinct from non-member pricing

### US-21.6: The studio can funnel into privates
This is the part that makes privates a growth lever rather than a calendar feature.

- [ ] Offer a private intro after a student's first class (hooks PRD-007 lifecycle automation)
- [ ] Surface "book a private with this teacher" on teacher profiles (PRD-018)
- [ ] Private conversion visible in `/manage/analytics`

### US-21.7: The money is explicit
- [ ] Configurable studio/teacher split, default 100% teacher
- [ ] Teacher sees private earnings in `/teach/earnings` separately from class pay
- [ ] Private revenue separated in studio financials
- [ ] Payouts flow through the same Stripe Connect path as everything else

---

## Customer-service rules this PRD commits to
1. The software never says no. It books, proposes, holds, or hands to a person.
2. Nobody is charged for something that did not happen. Authorise at request, capture at acceptance.
3. Every waiting state names the next step and the time it will happen by.
4. The student never has to repeat themselves: a hand-off carries the whole request.
5. A proposal from the teacher is one tap to accept, without an account.

## Dependencies

| Depends on | Why |
|---|---|
| PRD-020 Express Booking | The guest identity and public-booking path is the same. Do not build a second one. |
| PRD-022 Calendar and time zones | Confirmations use the calendar module; request times are shown in studio time with the zone named |
| PRD-024 Attribution | "Private intro after first class" (US-21.6) is a conversion the attribution model has to credit |
| PRD-001 Staff portal | `instructor_availability` already lives there |
| PRD-002 Tips and commission | The split and earnings model overlaps |
| Verified payments core | This adds a second thing to charge for. Doing it before the first is reliable multiplies an unsolved problem. |

**Sequencing:** this is Phase 7 and should stay there. `HOSTED_PRODUCT_REVIEW.md` is right that the
class booking-to-reconciliation path has to be verified end to end first. A second inventory type
built on an unverified payment core is two unverified features.

---

## Success Metrics

| Metric | Why | Target |
|---|---|---|
| Teachers who publish availability | Whether the teacher-first bet worked at all | 40% of active teachers in 90 days |
| Privates booked through the link vs. logged manually | The real adoption test. Manual logging means we built a ledger, not a scheduler. | 70% through the link |
| Teachers who still take privates offline | The honest denominator. Ask, do not infer. | Measured, not targeted |
| First-class to private-intro conversion | Whether the funnel idea is real | Baseline first |
| Studios setting a non-zero split | Whether the money model is acceptable | Measured |

The third metric is the one that tells the truth. If teachers publish availability *and* keep texting
for the bookings that matter, the feature failed and the dashboards will not say so.

---

## Open questions

1. **Does a teacher want the studio in this loop at all?** Worth asking five teachers before writing
   any code. If the answer is no, build the scheduling as a teacher tool with the studio's visibility
   optional, and drop the revenue-split story entirely.
2. **Whose client is it?** If a teacher leaves, who keeps the private client relationship? This is a
   policy question with a data model consequence, and getting it wrong is how a studio gets sued.
3. **Does the studio charge for the room?** A split is one answer; a flat room fee per private is
   another and may be easier for teachers to accept.
4. **Duets and small-group privates:** real pilates demand, deliberately phase 2. Confirm the
   `appointments` shape does not make a second participant structurally awkward before shipping v1.
5. **Does this pull us toward massage and bodywork?** Those have intake forms, contraindications, and
   sometimes HIPAA. Say no clearly now, or scope it deliberately later. Drifting into it accidentally
   is how Tandava becomes bad salon software.
