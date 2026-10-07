# PRD-020: Express Booking (login-free booking)

## Overview
**Phase:** 6
**Priority:** P0
**Status:** Phase 1 implemented, unverified against a live database
**Owner:** TBD
**Origin:** [docs/competitive/MANGOMINT.md](../competitive/MANGOMINT.md) section 6; promotes
[COMPETITOR_ISSUES_PRIORITY.md](../roadmap/COMPETITOR_ISSUES_PRIORITY.md) #3 from Tier 2 to Tier 1.

---

## Problem

A first-time visitor who finds a studio's class, on Instagram or Google or an embedded widget,
currently has to create an account before they can book. Tandava's storefront "Book" button pointed
at `/auth/register`. That is the largest single drop-off in studio conversion and the clearest
capability gap against Mangomint, whose Express Booking takes a client from link to booked in two
taps with no password.

The visitor's job is "get into the 6pm class." Creating an account is our requirement, not their
goal. Every screen between the link and the confirmation is a chance to lose someone who was
already willing to pay.

### Why this is worth building before most of the roadmap

It compounds with every marketing dollar a studio spends. A studio running ads, a link in bio, or an
embedded widget pays the same to acquire the click whether the booking flow is two taps or seven. The
feature also costs a studio nothing to adopt and nothing to learn, which is rare.

---

## Jobs to Be Done

### Job 1: Book without an account
**When** I find a class I want from a link someone sent me,
**I want** to reserve my spot by typing my name, email, and phone,
**So I can** be in that class without inventing a password I will never use again.

### Job 2: Know what I am committing to
**When** I am about to book,
**I want** the price, the time in the studio's own timezone, and the cancellation policy stated
before I tap the button,
**So I can** decide without discovering the terms in a receipt.

### Job 3: Turn a drop-in into a member (studio)
**When** a guest books their first class,
**I want** them to already exist as a member record with an attributed source,
**So I can** follow up, see which post produced the booking, and sell them a pack.

### Job 4: Not have my account used by a stranger (existing member)
**When** someone types my email into a public booking form,
**I want** nothing to happen to my account or my membership until I prove I control that mailbox,
**So I can** trust that a public form is not a way to act in my name.

---

## Goals

- A first-time visitor completes a booking in one screen with no password and no email round-trip.
- Guest bookings land in the same `bookings` table as member bookings, so rosters, waitlist
  promotion, and check-in work with no special cases.
- A guest becomes a real member record, attributable to a UTM source, claimable later by setting a
  password on the same email.
- Studios opt in. Guest booking changes who can create a row in their member list.

## Non-goals

- **Guest purchase of memberships or packs.** Recurring billing against an unverified identity is a
  different risk class. Packs and memberships stay behind a real account.
- **Guest access to an existing member's entitlements.** A guest has no entitlements by definition.
  Someone with a membership signs in; that is the correct trade, and the form says so.
- **Appointment / privates booking.** Different inventory model. See PRD-021.
- **Replacing the member booking flow.** `book_class()` and the entitlement engine stay exactly as
  they are. This is a parallel path, not a rewrite.

---

## Design decisions worth arguing about

### 1. A guest gets a real, passwordless identity

`bookings.profile_id` is `NOT NULL` and references `auth.users`. Three options:

| Option | Why not / why |
|---|---|
| Make `profile_id` nullable, add guest columns to `bookings` | Rejected. Every roster, entitlement, check-in, and analytics query that assumes a member behind a booking would need a null branch. One nullable column buys a permanent tax. |
| A separate `guest_bookings` table | Rejected. Dual-write, two sources of truth for capacity, and waitlist promotion would have to understand both. |
| **Create a passwordless auth user + profile + `studio_members` row** | **Chosen.** One member record, no dual-write, every downstream feature works unchanged, and the guest claims the account later by setting a password on the same email. |

Cost of the chosen option: creating an auth user needs the service role, so the write path has to be
an Edge Function rather than an anon-callable RPC. That is a real constraint and it is why
`express-book` exists.

`profiles.is_guest` marks the account until it is claimed, so staff can tell "booked as a guest" from
"registered member" and we do not email account-management copy to someone with no account.

### 2. An existing account is never booked into anonymously

Anyone can type anyone's email into a public form. If the address already belongs to a claimed
account, `express-book` does **not** create the booking and does not reveal the account's membership
state. It emails a signed continue link to that address and answers "check your email."

This is the one place the feature is deliberately slower than Mangomint. The alternative, booking
into a matched account on an anonymous request, means a public form can create charges and
commitments in someone else's name. A guest profile (no password) is not an "existing account" for
this rule: there is nothing to protect and no sign-in the visitor could complete.

**Accepted, named leak:** a visitor can tell a known address from an unknown one by whether they get
a booking or an email. Eliminating that would mean removing instant guest booking, which is the
entire feature. Mitigations: occurrence eligibility is checked *before* the email is considered, so
an unbookable class gives an identical answer either way; attempts are rate-limited per email and per
IP hash. Documented rather than hidden.

### 3. Waitlist claims never take payment

A waitlisted guest has no spot. Charging them creates exactly the partial-refund problem
`COMPETITOR_ISSUES_PRIORITY.md` #18 is about. Payment is collected when a promotion is accepted.

### 4. Capacity is decided server-side, under a lock

The page's `booked_count` is stale the moment it renders. `create_guest_booking()` locks the
occurrence row, re-checks capacity, and returns the placement it actually used, so two guests tapping
the last spot cannot both get it. The client decision is advisory.

### 5. Decision rules live in one tested module

`src/lib/booking/express.ts` holds validation, eligibility, and the decision. The Edge Function
imports it rather than copying it, so the branch that refuses to book into an existing account cannot
drift from the branch the tests cover. Same split as `src/lib/hosted/*`.

---

## User Stories

### US-20.1: Guest books a paid drop-in
**As a** first-time visitor,
**I want** to book and pay for a single class without an account.

- [x] `/s/:slug/book/:occurrenceId` renders class details above the form
- [x] Form is first name, last name, email, optional phone, waiver checkbox when required
- [x] Price stated before the button, in the studio's currency
- [x] Submitting opens Stripe Checkout; booking is created by the existing `stripe-webhook`
- [x] Returning with `?booked=1` shows a confirmation
- [ ] Confirmation email with the cancellation policy (needs the `express_confirmation` template)
- [ ] Verified end to end against a live Stripe account

### US-20.2: Guest books a free class
- [x] A zero-price or unpriced-but-free class books immediately, no payment step
- [x] An offering with **no** drop-in price is rejected with "sign in with a membership or pack",
      because a guest has nothing it could charge

### US-20.3: Guest joins a waitlist
- [x] A full class offers the waitlist when both `waitlist_enabled` and `express_waitlist_enabled`
- [x] No payment taken; copy says so explicitly
- [x] Waitlist position returned and shown
- [ ] Promotion flow collects payment from a guest (depends on PRD-009 wiring)

### US-20.4: Known email is diverted, not booked
- [x] A claimed account's email returns `continue_link_sent`
- [x] Token hash stored, raw token only in the email, 30-minute expiry
- [x] Page explains why we emailed instead of booking
- [ ] `/s/:slug/book/:id?continue=<token>` consumes the token and completes the booking

### US-20.5: Studio controls the policy
- [x] `studios.express_booking_enabled` (default **off**)
- [x] `express_booking_cutoff_minutes`, `express_waitlist_enabled`, `express_waiver_required`
- [ ] Settings UI under `/manage/settings` to edit them
- [ ] Claims visible to staff in `/manage` (table and RLS exist; no screen yet)

### US-20.6: Attribution
**As a** studio owner,
**I want** to know which link produced a booking.

- [x] `utm_source` / `utm_medium` / `utm_campaign` captured from the URL into the claim row
- [x] Guest member tagged `express-booking`
- [ ] Surfaced in `/manage/analytics` (PRD-011)

### US-20.7: One tap from where the class was found
- [x] Storefront "Book" deep-links to express booking instead of `/auth/register`
- [x] Embed widget "Book" deep-links to the occurrence instead of a generic schedule page

### US-20.8: Abuse control
- [x] Rate limit per email (6/hour) and per IP hash (20/hour)
- [x] IP stored only as a salted hash; `EXPRESS_IP_SALT` required for IP limiting
- [x] Every attempt recorded, including rejections, so a studio can tell "nobody tried" from
      "everybody was turned away by a cutoff set too tight"
- [x] Duplicate guard: one live claim per (occurrence, email)
- [ ] CAPTCHA or proof-of-work if abuse is observed in the pilot

---

## What shipped in Phase 1

| Piece | Path |
|---|---|
| Decision rules (pure, 60 tests) | `src/lib/booking/express.ts`, `express.test.ts` |
| Migration | `supabase/migrations/00019_express_booking.sql` |
| Edge Function | `supabase/functions/express-book/index.ts` |
| Booking page | `src/pages/ExpressBooking.tsx` |
| Route | `/s/:slug/book/:occurrenceId` in `src/App.tsx` |
| Hooks | `usePublicOccurrence`, `useExpressBook` in `src/hooks/useBooking.ts` |
| Backend contract | `getPublicOccurrence`, `ExpressBookInput`, `ExpressBookResult` |
| Entry points | `StudioStorefront.tsx`, `embed/EmbedSchedule.tsx` |
| Drop-in safety fix | `stripe-webhook` now books via `create_guest_booking()` |

### Database surface added

| Object | Purpose |
|---|---|
| `studios.express_booking_*` (4 columns) | Per-studio opt-in and policy |
| `profiles.is_guest`, `profiles.claimed_at` | Guest identity markers |
| `idx_profiles_email_lower` (unique) | One identity per address; stable guest lookup |
| `get_public_occurrence(slug, id)` | Narrow public read for one occurrence, anon-callable |
| `express_booking_claims` | Attempt ledger, duplicate guard, rate-limit substrate, token store |
| `count_recent_express_claims()` | Throttle counts; service-role only, returns counts not rows |
| `get_profile_identity_by_email()` | Indexed case-insensitive identity lookup; service-role only |
| `create_guest_booking()` | Capacity-safe, idempotent booking insert; service-role only |

Three things worth knowing about that surface:

- **`express_booking_claims` is deliberately not unique** on (occurrence, email). It is an audit log,
  and an audit log must never reject a write: a guest who books, cancels, and rebooks legitimately
  produces a second claim. The duplicate guard lives on `bookings` instead, where it can be enforced
  without discarding history.
- **Every service-role function needs an explicit `GRANT EXECUTE ... TO service_role`.** Revoking
  from `PUBLIC` also removes the grant `service_role` inherits, so omitting it makes every call fail
  with "permission denied for function".
- **Identity lookup goes through an RPC, not a PostgREST filter.** `ILIKE` cannot use
  `idx_profiles_email_lower`, so a filter would full-scan `profiles` on every booking attempt.

### Why `stripe-webhook` changed

The drop-in branch inserted the booking directly, with no capacity check and no idempotency. Express
booking routes paid guests through that path, so a guest paying for the last spot could have oversold
the room, and a replayed webhook could have double-booked. It now calls `create_guest_booking()`,
which locks the row and is idempotent per (occurrence, profile). This is the minimum change the
feature requires, not an unrelated cleanup.

---

## Launch gates (none of these are done)

1. **Apply migration 00019 to a live database** and confirm `idx_profiles_email_lower` does not
   collide with existing duplicate-email rows. On a database with duplicates the index creation will
   fail; dedupe first.
2. **Verify the Edge Function bundles.** It imports `../../../src/lib/booking/express.ts`, which
   crosses out of `supabase/functions/`. Confirm `supabase functions deploy express-book
   --no-verify-jwt` includes it. If the CLI refuses, move the rules module to a location both sides
   can reach rather than copying it.
3. **`--no-verify-jwt` is mandatory** on deploy. The caller is anonymous by design. Without it every
   express booking returns 401.
4. **Set `EXPRESS_IP_SALT`.** Without it IP rate limiting silently disables and only the per-email
   limit applies.
5. **Add the `express_continue` and `express_confirmation` email templates** in
   `supabase/functions/email/templates.ts`. Until then the continue link is generated and recorded
   but never delivered, which strands that path.
6. **Build the continue-token consumer.** `?continue=<token>` is generated and hashed but nothing
   redeems it yet, so an existing member currently reaches a dead end.
7. **Test the concurrent-last-spot case** against a live database. `create_guest_booking()` uses
   `FOR UPDATE`; that is untested PL/pgSQL.
8. **Test the auth-user race.** Two simultaneous claims on a new address rely on the
   `createUser` failure path resolving to the winner.
9. **Confirm the Stripe success path end to end.** The booking is created by the webhook, so a guest
   who closes the tab after paying must still end up booked.

Until 1 through 9 are done this is **demonstrated UI plus backend foundation**, not verified end to
end, in the labels `HOSTED_PRODUCT_REVIEW.md` uses. The feature index reflects that.

---

## Success Metrics

| Metric | Why | Target |
|---|---|---|
| Storefront view to booking conversion | The whole point | Baseline first, then +50% relative |
| Taps from link to confirmation | The specific complaint in #3 | 7 to 2 |
| Guest bookings that later claim an account | Whether this builds a member base or a list of strangers | 25% within 60 days |
| Guest first-class to pack/membership purchase | Whether express booking funnels or just discounts | Baseline first |
| Rate-limited attempts | Abuse signal | < 1% of attempts |
| Rejections by reason | Finds studios with a cutoff set too aggressively | Monitored, no target |

The second and third metrics matter more than the first. Raising bookings while producing no members
means we built a drop-in machine, not a funnel.

---

## Open questions

1. **Should a guest see their booking without an account?** A signed "manage this booking" link in
   the confirmation email would let them cancel without signing up. That is friction removed, and
   another token surface to secure.
2. **Phone: required or optional?** Optional here, because every required field costs bookings.
   Studios that text their rosters will want it required, which argues for a per-studio switch.
3. **How long does an unclaimed guest profile live?** It holds an email address for someone who never
   agreed to an account. A GDPR-shaped retention rule belongs here (`gdpr_requests` exists).
4. **Does the waiver checkbox satisfy the studio's legal need?** `waiver_templates` exists and is
   unused by this flow; a checkbox may not be enough where a versioned, auditable acceptance is
   required.
