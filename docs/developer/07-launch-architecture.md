# Launch architecture (v1)

Diagrams for the booking, payment and security model built for launch. Rationale lives in the [PRD](../plans/PRD-launch-v1.md); task order in the [backlog](../plans/BACKLOG.md). Complements [02-architecture](02-architecture.md) and [03-key-flows](03-key-flows.md).

## 1. System context

```mermaid
flowchart LR
  S[Student] --> W[React app on Vercel]
  O[Studio staff] --> W
  W -->|anon: public RPCs only| DB[(Supabase Postgres + RLS)]
  W -->|authenticated: RLS + RPCs| DB
  W -->|checkout| EF1[edge: stripe-checkout]
  W -->|onboarding| EF2[edge: stripe-connect]
  ST[Stripe] -->|signed events| EF3[edge: stripe-webhook]
  EF1 --> ST
  EF2 --> ST
  EF1 -->|service role| DB
  EF3 -->|service role, SQL fulfilment| DB
```

Anon reads go through `get_public_schedule`, `get_studio_storefront`, `discover_classes`. No table is readable by anon.

## 2. Booking state machine and entitlement ledger

```mermaid
stateDiagram-v2
  [*] --> waitlisted: class full
  [*] --> confirmed: book_class_auto / book_class
  waitlisted --> confirmed: promote_waitlist (entitlement valid)
  confirmed --> checked_in: check_in_booking (staff, window)
  confirmed --> cancelled: cancel before deadline
  confirmed --> late_cancel: cancel after deadline
  cancelled --> confirmed: rebook (partial unique index)
  note right of confirmed: entitlement_consumed = true
  note right of cancelled: credit released
  note right of late_cancel: credit kept
```

One trigger (`bookings_entitlement_sync`) owns consume and release. Lock order: occurrence, booking, pack or membership.

## 3. Guest to booked

```mermaid
sequenceDiagram
  actor G as Guest
  participant UI as Storefront
  participant A as Auth pages
  participant DB as Postgres
  participant CO as stripe-checkout
  participant ST as Stripe
  participant WH as stripe-webhook
  G->>UI: open /s/slug?class=id
  UI->>A: Book (next=/s/slug?class=id)
  A->>A: stash return, sign up or in
  A->>UI: resolveAfterAuth
  UI->>DB: book_class_auto(class)
  alt membership or pack covers it
    DB-->>UI: booked
  else needs payment
    DB-->>UI: needs_payment
    UI->>CO: drop-in checkout
    CO->>ST: session (idempotency key)
    ST-->>WH: checkout.session.completed
    WH->>DB: fulfill_stripe_checkout (dedupe by event id)
    DB-->>G: booking confirmed
  end
```

## 4. Webhook idempotency

```mermaid
flowchart TD
  E[Stripe event] --> V{signature ok?}
  V -- no --> R400[400]
  V -- yes --> L{event id in stripe_events?}
  L -- yes --> OK[200 duplicate]
  L -- no --> F[SQL function in one transaction]
  F -- error --> R500[5xx, Stripe retries]
  F -- ok --> OK2[record event, 200]
```

## 5. Wave dependencies

```mermaid
flowchart LR
  W0[W0 safety net] --> W1[W1 security]
  W1 --> W2[W2 money]
  W1 --> W3[W3 booking]
  W3 --> W4[W4 guest booking]
  W2 --> W4
  W1 --> W5[W5 studio supply]
  W4 --> W5
  W4 --> W6[W6 growth]
  W5 --> W7[W7 pilot]
  W2 --> W7
```

## 6. RLS policy classes (migration 00023)

| Class | Pattern | Example tables |
|---|---|---|
| A studio config | staff read, owner/admin write | nudge_rules, referral_programs |
| B member activity | member reads own, staff read, server writes | promo_redemptions, engagement_events |
| C child of parent | tenant reached via parent row | purchase_order_items, sms_messages |
| D household and queue | member own, staff read | households, waitlist_promotions |
| E event detail | staff read, admin write, public via RPC | event_sessions |
| F restricted | admin only or the two parties | shift_trades, corporate_employees |

Conventions: `(SELECT auth.uid())`, staff via `my_staff_studio_ids()` / `my_admin_studio_ids()`, every definer function pins `search_path` and revokes from PUBLIC and anon.
