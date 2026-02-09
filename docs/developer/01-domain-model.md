# Domain Model

Visual reference for Tandava's core entities and relationships.

> For narrative explanation, see [architecture/DOMAIN_MODEL.md](../architecture/DOMAIN_MODEL.md)

---

## Core Principle

```
┌─────────────────────────────────────────────────────────────┐
│  This system models universal studio reality.               │
│  Every entity corresponds to something physically real.     │
│  Software abstractions that exist only in code are avoided. │
└─────────────────────────────────────────────────────────────┘
```

---

## Entity Relationship Diagram

```mermaid
erDiagram
    STUDIO ||--o{ LOCATION : has
    STUDIO ||--o{ STAFF : employs
    STUDIO ||--o{ OFFERING : defines
    STUDIO ||--o{ CLIENT : serves

    LOCATION ||--o{ SESSION : hosts

    OFFERING ||--o{ SESSION : instantiates

    SESSION ||--o{ BOOKING : receives
    SESSION }o--|| STAFF : taught_by

    BOOKING }o--|| CLIENT : made_by
    BOOKING ||--o| CHECKIN : confirms

    CLIENT ||--o{ ENTITLEMENT : holds
    CLIENT ||--o{ TRANSACTION : pays

    ENTITLEMENT }o--o| TRANSACTION : purchased_via

    STUDIO {
        uuid id
        string name
        string timezone
        jsonb settings
    }

    LOCATION {
        uuid id
        string name
        string address
        int capacity
    }

    OFFERING {
        uuid id
        string name
        string type
        int duration_minutes
    }

    SESSION {
        uuid id
        datetime start_time
        datetime end_time
        string status
    }

    BOOKING {
        uuid id
        string status
        string channel
        datetime booked_at
    }

    CLIENT {
        uuid id
        string name
        string email
        datetime joined_at
    }

    STAFF {
        uuid id
        string name
        string role
        jsonb pay_config
    }

    ENTITLEMENT {
        uuid id
        string type
        int remaining
        date expires_at
    }

    TRANSACTION {
        uuid id
        int amount_cents
        string status
        datetime created_at
    }

    CHECKIN {
        uuid id
        datetime checked_in_at
    }
```

---

## Entity Responsibilities

```mermaid
graph TB
    subgraph "Organizational"
        STUDIO[Studio]
        LOCATION[Location]
        STAFF[Staff]
    end

    subgraph "Catalog"
        OFFERING[Offering]
    end

    subgraph "Operational"
        SESSION[Session]
        BOOKING[Booking]
        CHECKIN[Check-in]
    end

    subgraph "Identity"
        CLIENT[Client]
    end

    subgraph "Access"
        ENTITLEMENT[Entitlement]
    end

    subgraph "Financial"
        TRANSACTION[Transaction]
    end

    STUDIO --> LOCATION
    STUDIO --> STAFF
    STUDIO --> OFFERING
    STUDIO --> CLIENT

    OFFERING --> SESSION
    LOCATION --> SESSION
    STAFF --> SESSION

    SESSION --> BOOKING
    CLIENT --> BOOKING
    BOOKING --> CHECKIN

    CLIENT --> ENTITLEMENT
    CLIENT --> TRANSACTION
```

---

## Key Separations

These entities are intentionally distinct:

| Concept A | Concept B | Why Separate |
|-----------|-----------|--------------|
| **Offering** | **Session** | Template vs. instance. "Vinyasa Flow" vs. "Vinyasa Flow on Tuesday at 9am" |
| **Booking** | **Check-in** | Intent vs. actuality. Reserved ≠ attended |
| **Booking** | **Transaction** | Operational fact vs. financial settlement |
| **Entitlement** | **Transaction** | Permission vs. payment. Access can exist without purchase |
| **Session** | **Transaction** | Classes happen regardless of payment status |

```mermaid
graph LR
    subgraph "Operational Layer"
        A[Session] --> B[Booking] --> C[Check-in]
    end

    subgraph "Financial Layer"
        D[Transaction] --> E[Entitlement]
    end

    B -.->|"uses"| E
    B -.->|"may create"| D

    style A fill:#e1f5fe
    style B fill:#e1f5fe
    style C fill:#e1f5fe
    style D fill:#fff3e0
    style E fill:#fff3e0
```

---

## Channel as Metadata

Bookings can originate from multiple sources. The channel is **metadata**, not a separate system.

```mermaid
graph TD
    subgraph "One Reality"
        SESSION[Session]
        BOOKING[Booking]
        ROSTER[Roster]
    end

    subgraph "Many Channels"
        DIRECT[Direct Booking]
        PARTNER[Partner API]
        CORPORATE[Corporate Account]
        GIFT[Gift Pass]
    end

    DIRECT -->|channel: direct| BOOKING
    PARTNER -->|channel: partner| BOOKING
    CORPORATE -->|channel: corporate| BOOKING
    GIFT -->|channel: gift| BOOKING

    BOOKING --> SESSION
    SESSION --> ROSTER
```

**Key insight:** There is one schedule, one roster, one attendance record. Channels annotate how the booking arrived—they do not fork reality.

---

## Tandava Terminology Mapping

| Concept | Tandava Schema | Notes |
|---------|----------------|-------|
| Studio | `studios` | Root organizational entity |
| Location | `locations` | Physical or virtual venue |
| Offering | `classes` | Reusable class/workshop template |
| Session | `class_occurrences` | Scheduled instance |
| Booking | `bookings` | Reservation record |
| Check-in | `check_ins` | Attendance confirmation |
| Client | `member_profiles` | Person who attends |
| Staff | `staff_profiles` | Person who works/teaches |
| Entitlement | `memberships`, `class_packs` | Access permissions |
| Transaction | `transactions` | Financial settlement |

---

## Related Documentation

- [DOMAIN_MODEL.md](../architecture/DOMAIN_MODEL.md) — Narrative explanation
- [ROLE_ACCESS_CONTROL.md](../architecture/ROLE_ACCESS_CONTROL.md) — Who sees what
- [02-architecture.md](02-architecture.md) — System layers
