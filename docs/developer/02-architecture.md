# System Architecture

High-level structure and data flow.

---

## Logical Layers

```mermaid
graph TB
    subgraph "Interfaces"
        WEB[Web App]
        API[REST API]
        EXPORT[Export Engine]
        WEBHOOK[Webhooks]
    end

    subgraph "Application Services"
        BOOKING_SVC[Booking Service]
        SCHEDULE_SVC[Schedule Service]
        PAYMENT_SVC[Payment Service]
        MEMBER_SVC[Member Service]
        PAYROLL_SVC[Payroll Service]
    end

    subgraph "Domain Core"
        STUDIO_DOM[Studio Domain]
        SESSION_DOM[Session Domain]
        CLIENT_DOM[Client Domain]
        FINANCE_DOM[Finance Domain]
    end

    subgraph "Infrastructure"
        DB[(PostgreSQL)]
        AUTH[Auth Provider]
        STRIPE[Payment Provider]
        STORAGE[File Storage]
    end

    WEB --> BOOKING_SVC
    WEB --> SCHEDULE_SVC
    API --> BOOKING_SVC
    API --> MEMBER_SVC

    BOOKING_SVC --> SESSION_DOM
    BOOKING_SVC --> CLIENT_DOM
    SCHEDULE_SVC --> SESSION_DOM
    PAYMENT_SVC --> FINANCE_DOM
    PAYROLL_SVC --> FINANCE_DOM

    SESSION_DOM --> DB
    CLIENT_DOM --> DB
    FINANCE_DOM --> DB

    PAYMENT_SVC --> STRIPE
    AUTH --> DB
    EXPORT --> DB
    WEBHOOK --> DB
```

---

## Data Flow: Write Path

When a booking is created:

```mermaid
sequenceDiagram
    participant UI as Web/API
    participant SVC as Booking Service
    participant DOM as Domain
    participant DB as Database
    participant EVT as Event Log

    UI->>SVC: Create Booking Request
    SVC->>DOM: Validate (session exists, capacity, entitlements)
    DOM->>DB: Check session capacity
    DB-->>DOM: Available
    DOM->>DB: Check client entitlements
    DB-->>DOM: Has valid membership
    SVC->>DB: INSERT booking
    DB-->>SVC: booking_id
    SVC->>EVT: Emit booking.created
    SVC-->>UI: Booking Confirmed
```

---

## Data Flow: Read Path

When rendering a schedule:

```mermaid
sequenceDiagram
    participant UI as Web App
    participant API as API Layer
    participant DB as Database
    participant RLS as Row-Level Security

    UI->>API: GET /sessions?date=2026-02-06
    API->>DB: SELECT from class_occurrences
    DB->>RLS: Check studio_id access
    RLS-->>DB: Allowed
    DB-->>API: Session rows
    API-->>UI: JSON response
```

---

## Boundaries

```mermaid
graph LR
    subgraph "Core System"
        DOMAIN[Domain Logic]
        DATA[Data Layer]
    end

    subgraph "Integrations"
        PAYMENT[Payment Provider]
        EMAIL[Email Service]
        CALENDAR[Calendar Sync]
        ACCOUNTING[Accounting Export]
        AUTOMATION[Zapier/Make]
    end

    subgraph "External Channels"
        PARTNER[Partner Bookings]
        CORPORATE[Corporate Accounts]
    end

    DOMAIN <-->|Stripe Connect| PAYMENT
    DOMAIN -->|SMTP/API| EMAIL
    DOMAIN -->|iCal/API| CALENDAR
    DOMAIN -->|CSV/Webhook| ACCOUNTING
    DOMAIN -->|Webhook/REST| AUTOMATION

    PARTNER -->|API| DOMAIN
    CORPORATE -->|API| DOMAIN
```

**Key principle:** The core system is self-contained. Integrations are satellites that connect via well-defined interfaces.

---

## Multi-Tenancy

Each studio is isolated at the database level via Row-Level Security (RLS).

```mermaid
graph TD
    subgraph "Application Layer"
        APP[Tandava App]
    end

    subgraph "Database Layer"
        RLS{RLS Policy}
        S1[(Studio A Data)]
        S2[(Studio B Data)]
        S3[(Studio C Data)]
    end

    APP -->|studio_id in JWT| RLS
    RLS -->|studio_id = A| S1
    RLS -->|studio_id = B| S2
    RLS -->|studio_id = C| S3
```

- Every table has a `studio_id` column
- RLS policies enforce: `studio_id = auth.jwt()->>'studio_id'`
- Cross-studio data access is impossible at the database level

---

## Event Architecture

The system emits events for significant operations:

```mermaid
graph LR
    subgraph "Event Sources"
        BOOKING[Booking Created]
        CHECKIN[Check-in Recorded]
        PAYMENT[Payment Completed]
        MEMBERSHIP[Membership Changed]
    end

    subgraph "Event Log"
        LOG[(event_log table)]
    end

    subgraph "Consumers"
        WEBHOOK[Webhook Delivery]
        ANALYTICS[Analytics Aggregation]
        NOTIFICATION[Notification Queue]
    end

    BOOKING --> LOG
    CHECKIN --> LOG
    PAYMENT --> LOG
    MEMBERSHIP --> LOG

    LOG --> WEBHOOK
    LOG --> ANALYTICS
    LOG --> NOTIFICATION
```

Events are:
- Stored durably in `event_log`
- Delivered via configurable webhooks
- Used for analytics aggregation
- Triggerable by automation platforms

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React + TypeScript | Web application |
| UI Components | shadcn/ui + Tailwind | Accessible, themeable UI |
| Backend | Supabase | Database, Auth, Storage, Realtime |
| Database | PostgreSQL | Relational data with RLS |
| Payments | Stripe Connect | Multi-tenant payment processing |
| Hosting | Any static host | Vercel, Netlify, Cloudflare, self-hosted |

---

## Related Documentation

- [01-domain-model.md](01-domain-model.md) — Entity relationships
- [03-key-flows.md](03-key-flows.md) — Operational flows
- [04-integrations.md](04-integrations.md) — Integration architecture
