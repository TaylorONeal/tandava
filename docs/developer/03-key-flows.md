# Key Flows

Visual walkthroughs of core system operations.

---

## 1. Schedule Creation

How a class gets from concept to bookable session.

```mermaid
sequenceDiagram
    participant ADMIN as Studio Admin
    participant SYS as System
    participant DB as Database

    Note over ADMIN,DB: Define the template
    ADMIN->>SYS: Create Offering (e.g., "Vinyasa Flow")
    SYS->>DB: INSERT into classes
    DB-->>SYS: offering_id

    Note over ADMIN,DB: Create recurring rule
    ADMIN->>SYS: Create Schedule Rule<br/>(Offering + Location + Teacher + Recurrence)
    SYS->>DB: INSERT into schedule_rules

    Note over ADMIN,DB: Generate instances
    SYS->>SYS: Apply recurrence pattern
    SYS->>DB: INSERT into class_occurrences (batch)
    DB-->>SYS: session_ids

    Note over ADMIN,DB: Sessions now bookable
    SYS-->>ADMIN: Schedule visible on calendar
```

**Key concepts:**
- **Offering** = what can happen
- **Schedule Rule** = when it repeats
- **Session (class_occurrence)** = specific instance

---

## 2. Direct Booking Flow

Student books a class through the app.

```mermaid
sequenceDiagram
    participant STUDENT as Student
    participant APP as Web App
    participant SVC as Booking Service
    participant DB as Database

    STUDENT->>APP: View Schedule
    APP->>DB: GET sessions for date
    DB-->>APP: Available sessions

    STUDENT->>APP: Select class, click Book
    APP->>SVC: Create Booking Request

    SVC->>DB: Check session capacity
    DB-->>SVC: 18/25 spots filled

    SVC->>DB: Check student entitlements
    DB-->>SVC: Has unlimited membership

    SVC->>DB: INSERT booking (status: confirmed)
    SVC->>DB: INSERT event_log (booking.created)

    DB-->>SVC: booking_id
    SVC-->>APP: Booking confirmed
    APP-->>STUDENT: "You're booked!"
```

---

## 3. Partner/Channel Booking Flow

Booking arrives from external source (e.g., corporate account, partner API).

```mermaid
sequenceDiagram
    participant PARTNER as External System
    participant API as Partner API
    participant SVC as Booking Service
    participant DB as Database

    PARTNER->>API: POST /bookings<br/>{session_id, client_email, channel: "partner"}
    API->>API: Authenticate partner credentials

    API->>SVC: Create Booking (channel = partner)
    SVC->>DB: Find or create client by email
    DB-->>SVC: client_id

    SVC->>DB: Check capacity
    DB-->>SVC: Available

    SVC->>DB: INSERT booking<br/>(channel: partner, source_ref: external_id)
    SVC->>DB: INSERT event_log

    DB-->>SVC: booking_id
    SVC-->>API: Booking confirmed
    API-->>PARTNER: 201 Created {booking_id}
```

**Key insight:** Same booking table, same roster, same session. Channel is metadata.

---

## 4. Check-in Flow

Recording attendance when student arrives.

```mermaid
sequenceDiagram
    participant STAFF as Front Desk
    participant APP as Kiosk/App
    participant SVC as Check-in Service
    participant DB as Database

    STAFF->>APP: View class roster
    APP->>DB: GET bookings for session
    DB-->>APP: List of booked students

    STAFF->>APP: Check in "Maya Patel"
    APP->>SVC: Record Check-in

    SVC->>DB: UPDATE booking SET status = 'checked_in'
    SVC->>DB: INSERT check_in record
    SVC->>DB: UPDATE class_occurrence attendance count
    SVC->>DB: UPDATE member_profile attendance stats
    SVC->>DB: INSERT event_log (checkin.completed)

    DB-->>SVC: Success
    SVC-->>APP: Check-in confirmed
    APP-->>STAFF: ✓ Maya Patel checked in
```

---

## 5. Payment Flow

Purchase that grants entitlement.

```mermaid
sequenceDiagram
    participant STUDENT as Student
    participant APP as Web App
    participant PAY as Payment Service
    participant STRIPE as Stripe
    participant DB as Database

    STUDENT->>APP: Select "10-Class Pack" ($180)
    APP->>PAY: Initiate purchase

    PAY->>STRIPE: Create PaymentIntent
    STRIPE-->>PAY: client_secret

    PAY-->>APP: Show payment form
    STUDENT->>APP: Enter card details
    APP->>STRIPE: Confirm payment

    STRIPE-->>PAY: payment_intent.succeeded webhook
    PAY->>DB: INSERT transaction (status: completed)
    PAY->>DB: INSERT class_pack (10 classes, expires in 90 days)
    PAY->>DB: INSERT event_log (purchase.completed)

    DB-->>PAY: Success
    PAY-->>APP: Purchase complete
    APP-->>STUDENT: "10 classes added to your account"
```

---

## 6. Entitlement Check (During Booking)

How the system determines if a student can book.

```mermaid
flowchart TD
    START[Booking Request] --> CHECK_MEMBERSHIP{Has active<br/>membership?}

    CHECK_MEMBERSHIP -->|Yes| MEMBERSHIP_VALID{Covers this<br/>class type?}
    MEMBERSHIP_VALID -->|Yes| ALLOW[Allow Booking]
    MEMBERSHIP_VALID -->|No| CHECK_PACK

    CHECK_MEMBERSHIP -->|No| CHECK_PACK{Has class pack<br/>with remaining?}

    CHECK_PACK -->|Yes| PACK_VALID{Not expired?}
    PACK_VALID -->|Yes| DEDUCT[Deduct 1 class] --> ALLOW
    PACK_VALID -->|No| CHECK_DROPIN

    CHECK_PACK -->|No| CHECK_DROPIN{Allow drop-in?}

    CHECK_DROPIN -->|Yes| REQUIRE_PAY[Require Payment] --> ALLOW
    CHECK_DROPIN -->|No| DENY[Deny Booking]

    ALLOW --> END[Booking Created]
    DENY --> END2[Show Error]
```

---

## 7. Payroll Calculation Flow

How teacher pay is calculated.

```mermaid
sequenceDiagram
    participant ADMIN as Studio Admin
    participant SYS as Payroll Service
    participant DB as Database

    ADMIN->>SYS: Generate payroll for Feb 1-15

    loop For each teacher
        SYS->>DB: GET class_occurrences taught
        DB-->>SYS: List of sessions

        loop For each session
            SYS->>SYS: Get pay model for teacher
            SYS->>DB: GET attendance count
            SYS->>DB: GET class revenue (if revenue share)
            SYS->>SYS: Calculate pay based on model
            SYS->>DB: INSERT payroll_entry
        end
    end

    SYS->>DB: GET tips for period
    SYS->>SYS: Add tips to totals

    SYS-->>ADMIN: Payroll summary ready
```

---

## 8. Export Flow

Generating data for external systems.

```mermaid
sequenceDiagram
    participant ADMIN as Studio Admin
    participant APP as Web App
    participant EXPORT as Export Engine
    participant DB as Database

    ADMIN->>APP: Request payroll export<br/>(Feb 1-15, CSV format)

    APP->>EXPORT: Generate export

    EXPORT->>DB: Query payroll_entries
    EXPORT->>DB: Query class_occurrences
    EXPORT->>DB: Query tips

    DB-->>EXPORT: Raw data

    EXPORT->>EXPORT: Transform to CSV format
    EXPORT->>EXPORT: Apply column mappings

    EXPORT-->>APP: CSV file ready
    APP-->>ADMIN: Download link

    Note over ADMIN: Import into QuickBooks/Gusto
```

---

## State Transitions

### Booking Status

```mermaid
stateDiagram-v2
    [*] --> pending: Created
    pending --> confirmed: Payment/Entitlement verified
    pending --> cancelled: User cancels
    confirmed --> checked_in: Attendance recorded
    confirmed --> no_show: Class ends, not checked in
    confirmed --> cancelled: User cancels (within policy)
    confirmed --> late_cancel: User cancels (outside policy)
    checked_in --> [*]
    no_show --> [*]
    cancelled --> [*]
    late_cancel --> [*]
```

### Membership Status

```mermaid
stateDiagram-v2
    [*] --> active: Purchased/Granted
    active --> paused: User pauses
    paused --> active: Pause ends
    active --> past_due: Payment fails
    past_due --> active: Payment succeeds
    past_due --> cancelled: Payment fails (grace period exceeded)
    active --> cancelled: User cancels
    active --> expired: Term ends
    cancelled --> [*]
    expired --> [*]
```

---

## Related Documentation

- [01-domain-model.md](01-domain-model.md) — Entity definitions
- [02-architecture.md](02-architecture.md) — System structure
- [05-scenarios.md](05-scenarios.md) — End-to-end scenarios
