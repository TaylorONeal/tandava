# Integrations

How external systems connect to Tandava.

---

## Integration Philosophy

```
┌─────────────────────────────────────────────────────────────┐
│  The core system is complete without integrations.          │
│  Integrations extend; they do not enable.                   │
│  Data flows outward by default. Inward flow is explicit.    │
└─────────────────────────────────────────────────────────────┘
```

**Principles:**
- **Export-first** — Studios can always extract their data
- **User-authorized** — No integration accesses data without studio consent
- **Additive** — Integrations annotate; they don't fork reality
- **Channel-aware** — External bookings are tracked by source

---

## Integration Architecture

```mermaid
graph TD
    subgraph "Core System"
        DOMAIN[Domain Layer]
        DATA[(Database)]
        EVENTS[Event Log]
    end

    subgraph "Outbound Integrations"
        EXPORT[Export Engine]
        WEBHOOK[Webhook Delivery]
        EMAIL[Email/SMS]
    end

    subgraph "Inbound Integrations"
        PARTNER_API[Partner Booking API]
        IMPORT[Data Import]
    end

    subgraph "Bidirectional"
        PAYMENT[Payment Provider]
        CALENDAR[Calendar Sync]
    end

    subgraph "External Systems"
        ACCOUNTING[Accounting Software]
        PAYROLL[Payroll Systems]
        MARKETING[Marketing Platforms]
        AUTOMATION[Zapier/Make/n8n]
        PARTNERS[Booking Partners]
    end

    DOMAIN --> EVENTS
    EVENTS --> WEBHOOK
    WEBHOOK --> AUTOMATION
    WEBHOOK --> MARKETING

    DOMAIN --> EXPORT
    EXPORT --> ACCOUNTING
    EXPORT --> PAYROLL

    DOMAIN <--> PAYMENT
    DOMAIN <--> CALENDAR

    PARTNER_API --> DOMAIN
    PARTNERS --> PARTNER_API

    IMPORT --> DATA
```

---

## Integration Categories

### 1. Export Integrations (Outbound, Pull)

Studio pulls data out for use elsewhere.

```mermaid
flowchart LR
    subgraph "Tandava"
        DATA[(Data)]
        EXPORT[Export Engine]
    end

    subgraph "Destinations"
        QB[QuickBooks]
        GUSTO[Gusto]
        SHEETS[Google Sheets]
        CSV[CSV Download]
    end

    DATA --> EXPORT
    EXPORT -->|CSV/XLSX| QB
    EXPORT -->|CSV| GUSTO
    EXPORT -->|API| SHEETS
    EXPORT -->|Download| CSV
```

**Available exports:**
- Daily sales summary
- Detailed transactions
- Teacher payroll
- Stripe reconciliation
- Member directory
- Attendance reports

### 2. Webhook Integrations (Outbound, Push)

System pushes events to external endpoints.

```mermaid
flowchart LR
    subgraph "Tandava"
        EVENT[Event Occurs]
        LOG[Event Log]
        DELIVER[Webhook Delivery]
    end

    subgraph "Subscribers"
        ZAPIER[Zapier]
        MAKE[Make]
        CUSTOM[Custom Endpoint]
    end

    EVENT --> LOG
    LOG --> DELIVER
    DELIVER -->|POST + HMAC| ZAPIER
    DELIVER -->|POST + HMAC| MAKE
    DELIVER -->|POST + HMAC| CUSTOM
```

**Available events:**
| Event | Trigger |
|-------|---------|
| `booking.created` | New booking |
| `booking.cancelled` | Booking cancelled |
| `checkin.completed` | Student checked in |
| `sale.created` | Purchase completed |
| `sale.refunded` | Refund processed |
| `membership.created` | New membership |
| `membership.cancelled` | Membership cancelled |
| `class.cancelled` | Class cancelled by studio |

### 3. Partner API (Inbound)

External systems create bookings in Tandava.

```mermaid
flowchart LR
    subgraph "Partners"
        CORP[Corporate Accounts]
        RESELLER[Resellers]
        EMBED[Embedded Widgets]
    end

    subgraph "Tandava"
        API[Partner API]
        BOOKING[Booking Service]
        DATA[(Database)]
    end

    CORP -->|POST /bookings| API
    RESELLER -->|POST /bookings| API
    EMBED -->|POST /bookings| API

    API --> BOOKING
    BOOKING -->|channel: partner| DATA
```

**Key rules:**
- Partner provides API credentials
- Bookings tagged with `channel` and `source_ref`
- Same capacity checks as direct bookings
- Appears on same roster

### 4. Payment Integration (Bidirectional)

```mermaid
sequenceDiagram
    participant APP as Tandava
    participant STRIPE as Stripe Connect

    Note over APP,STRIPE: Purchase Flow
    APP->>STRIPE: Create PaymentIntent
    STRIPE-->>APP: client_secret
    APP->>STRIPE: Confirm payment
    STRIPE-->>APP: Webhook: payment_intent.succeeded

    Note over APP,STRIPE: Payout Flow
    STRIPE->>APP: Webhook: payout.paid
    APP->>APP: Update payout records
```

### 5. Calendar Sync (Bidirectional)

```mermaid
flowchart LR
    subgraph "Tandava"
        SCHEDULE[Schedule]
        ICAL[iCal Feed]
    end

    subgraph "Calendars"
        GOOGLE[Google Calendar]
        OUTLOOK[Outlook]
        APPLE[Apple Calendar]
    end

    SCHEDULE --> ICAL
    ICAL --> GOOGLE
    ICAL --> OUTLOOK
    ICAL --> APPLE
```

- Read-only iCal feed for teachers and students
- Subscribe URL per user
- Updates automatically

---

## Integration Evolution

```mermaid
graph LR
    subgraph "Phase 1: Export-First"
        E1[CSV Downloads]
        E2[Scheduled Exports]
    end

    subgraph "Phase 2: Automation"
        A1[Webhooks]
        A2[Zapier/Make]
    end

    subgraph "Phase 3: APIs"
        P1[Partner Booking API]
        P2[Public REST API]
    end

    subgraph "Phase 4: Native"
        N1[QuickBooks Direct]
        N2[Gusto Direct]
    end

    E1 --> E2 --> A1 --> A2 --> P1 --> P2 --> N1 --> N2
```

**Current status:**
- ✅ Phase 1: Export-First (implemented)
- 🔄 Phase 2: Automation (in progress)
- 📋 Phase 3: APIs (planned)
- 📋 Phase 4: Native (future)

---

## Channel Attribution

When bookings come from external sources, they're tracked:

```mermaid
graph TD
    subgraph "Booking Sources"
        DIRECT[Direct<br/>channel: direct]
        PARTNER[Partner API<br/>channel: partner]
        CORP[Corporate<br/>channel: corporate]
        GIFT[Gift Pass<br/>channel: gift]
    end

    subgraph "Single Roster"
        SESSION[Class Session]
        ROSTER[Attendance Roster]
    end

    subgraph "Reporting"
        REPORT[Channel Attribution Report]
    end

    DIRECT --> SESSION
    PARTNER --> SESSION
    CORP --> SESSION
    GIFT --> SESSION

    SESSION --> ROSTER
    ROSTER --> REPORT
```

**Exports include:**
- `booking.channel` — How the booking was created
- `booking.source_ref` — External system's ID
- `booking.source_metadata` — Additional context

---

## Security Model

```mermaid
flowchart TD
    subgraph "Authentication"
        JWT[JWT Token<br/>studio_id claim]
        API_KEY[API Key<br/>partner_id]
        WEBHOOK_SECRET[Webhook Secret<br/>HMAC signature]
    end

    subgraph "Authorization"
        RLS[Row-Level Security]
        SCOPE[API Scopes]
    end

    JWT --> RLS
    API_KEY --> SCOPE
    WEBHOOK_SECRET --> |Verify| EXTERNAL[External System]

    RLS --> |Enforces| DATA[(Studio Data)]
    SCOPE --> |Limits| API[API Access]
```

- **Web app:** JWT with studio_id, enforced by RLS
- **Partner API:** API key with defined scopes
- **Webhooks:** HMAC signature verification

---

## Related Documentation

- [WORKFLOW_AUTOMATION.md](../guides/WORKFLOW_AUTOMATION.md) — Zapier/Make setup
- [BUSINESS_CONNECTORS.md](../ai-agents/BUSINESS_CONNECTORS.md) — Export specifications
- [PRD-016](../prd/PRD-016-accounting-exports.md) — Accounting exports PRD
