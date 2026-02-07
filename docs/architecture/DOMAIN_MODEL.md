# Domain Model

Conceptual foundations for Tandava's data architecture.

---

## Guiding Principle

> **This system models universal studio reality, not any proprietary software system.**

Studios exist independently of software. Classes happen. Students attend. Teachers teach. These are facts of the physical world. Tandava's data model reflects this reality—it does not invent abstractions that exist only in software.

Every entity in the system corresponds to something a studio owner could point to and say: "That's real. That exists whether or not I have software."

---

## Core Entities

### Studio

A real-world business entity. Owns locations, staff, offerings, and policies. The organizational root of all data.

### Location

A physical or virtual place where sessions occur. Studios may have one or many.

### Offering

A reusable definition of an experience: a class type, workshop type, or training program. Offerings describe *what* can happen, not *when* it happens.

**Examples:** "Vinyasa Flow," "Beginner Pilates," "200-Hour Teacher Training"

### Class Occurrence (Session)

A time-bound instance of an offering. This is the **operational spine** of the system—the record that a specific class is scheduled to happen at a specific time, in a specific location, with a specific teacher.

Sessions exist independently of whether anyone books them or pays for them.

### Booking

An operational fact that a person is expected at a session.

Bookings are **facts**, not financial instruments. A booking records intent to attend. It does not determine whether the session happens, nor does it require payment to exist.

### Check-In

Confirmation that attendance occurred. The definitive record of who was actually in the room.

### Client (Member)

A real person with a relationship to the studio. Long-lived identity that persists across bookings, purchases, and time.

### Staff

People who operate or teach, with role-based visibility and permissions.

### Transaction

A settlement record. Transactions capture the financial event—money moved, a purchase completed, a refund issued.

Transactions never determine whether a session occurs. A class can happen with or without associated revenue. This separation is fundamental.

### Entitlement

Permission to attend sessions. Memberships, class packs, and passes are entitlements.

**Entitlements are permissions, not payments.** A membership grants access to classes. The transaction that purchased it is a separate concern. This separation allows:
- Comped memberships (entitlement without payment)
- Failed payments on active memberships (payment issue, entitlement still valid for grace period)
- Prepaid annual plans (one transaction, 12 months of entitlement)

---

## Architectural Principles

### 1. Reality First

The data model reflects what already exists in the physical world. We don't invent abstractions that only make sense inside software.

**Test:** Can a studio owner with no technical background recognize this entity as something real in their business?

### 2. Operations Before Monetization

Sessions happen regardless of payment success. Attendance is operational truth.

A yoga class occurs because a teacher shows up and students attend. Whether they paid with a membership, a class pack, drop-in, or not at all—the class happened. The operational record is primary; financial settlement is secondary.

**Implication:** Booking and transaction are separate entities. Check-in and payment are separate events.

### 3. One Reality, Many Channels

There is one schedule, one roster, one attendance record.

How a booking originated (direct, partner integration, corporate account, gift pass) is metadata—a "channel" annotation on the booking. It does not create parallel schedules or duplicate sessions.

**Implication:** Integrations annotate bookings with source information. They do not fork reality into separate systems.

### 4. Entitlements Are Permissions, Not Payments

Access rules and financial settlement are separate concerns.

A membership is a permission: "This person may attend unlimited classes in this category." The transaction that granted that membership is a separate record. This separation handles edge cases cleanly:

- **Gifted membership:** Entitlement exists, transaction is zero or attributed elsewhere
- **Corporate accounts:** Entitlement granted by employer, transaction is B2B invoice
- **Payment failure:** Entitlement continues during grace period while billing retries

### 5. Exports Are a First-Class Interface

Data is meant to move. Exports are intentional, structured, and channel-aware.

Studios must be able to extract their data for accounting, payroll, compliance, and portability. This is not an afterthought—it's a design requirement. Export formats are documented, stable, and include channel/source metadata for reconciliation.

### 6. Open Structures, Not Hidden Logic

Explicit entities, documented relationships, additive evolution.

When business logic changes, we add new entities or fields rather than overloading existing ones. A contributor reading the schema should understand the domain without needing to read application code.

---

## Entity Relationships

```
Studio
  ├── Locations
  ├── Staff
  ├── Offerings
  │     └── Class Occurrences (Sessions)
  │           ├── Bookings → Client
  │           └── Check-Ins → Client
  ├── Clients (Members)
  │     ├── Entitlements (Memberships, Packs)
  │     ├── Bookings
  │     └── Transactions
  └── Transactions
```

Key separations:
- **Offering → Session:** Template vs. instance
- **Booking → Check-In:** Intent vs. actuality
- **Entitlement → Transaction:** Permission vs. payment
- **Session → Transaction:** Operation vs. settlement

---

## Naming Conventions

| Concept | Tandava Term | Notes |
|---------|--------------|-------|
| Scheduled class instance | `class_occurrence` | The operational record |
| Access permission | `membership`, `class_pack` | Entitlements |
| Person who attends | `member_profile`, `client` | Long-lived identity |
| Person who teaches/works | `staff_profile` | Role-based |
| Financial event | `transaction` | Settlement record |
| Booking source | `channel`, `source` | Metadata annotation |

---

## Why This Matters

This domain model enables:

1. **Clean integrations:** Partner systems annotate bookings; they don't create parallel realities
2. **Accurate reporting:** Revenue and attendance are separate facts that can be correlated
3. **Flexible monetization:** New pricing models don't require schema changes
4. **Data portability:** Exports reflect business reality, not software abstractions
5. **Auditability:** Every fact has a clear source and timestamp

Studios using Tandava should recognize their business in the data model. If something feels foreign or confusing, we've failed to model reality correctly.

---

## Related Documentation

- [DATA_INTEROPERABILITY.md](../../DATA_INTEROPERABILITY.md) - Legal posture and data ownership
- [ROLE_ACCESS_CONTROL.md](ROLE_ACCESS_CONTROL.md) - Who sees what
- [AUDIT_COMPLIANCE.md](AUDIT_COMPLIANCE.md) - Compliance requirements

---

*This document describes conceptual architecture. For implementation details, see the database schema and PRDs.*
