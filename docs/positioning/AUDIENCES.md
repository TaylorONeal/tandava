# Positioning by product and audience

**Date:** 2026-10-07
**Status:** Working agreement. Supersedes the single-message assumption in
[docs/competitive/MANGOMINT.md](../competitive/MANGOMINT.md) section 2.

---

## The problem this fixes

The Mangomint brief said "stop leading with open source." That was half right and stated too broadly.
Open source is the correct lead on the surfaces aimed at people who care about running and reading the
code. It is the wrong lead on the surfaces aimed at a studio owner comparing us to Mindbody, and
wronger still on the two consumer apps, where a prospective student has no idea what a repository is
and no reason to care.

There is no single Tandava message. There are five products with four audiences, and each one has one
job. Mixing them costs us twice: the developer audience gets marketing copy, and the studio owner gets
a license lecture when they wanted to know if it handles their waitlist.

---

## The five surfaces

| Surface | Audience | Their question | Leads with | Open source is |
|---|---|---|---|---|
| **1. Open-source project** (`/open-source`, README, GitHub) | Developers, self-hosters, technical studio owners, contributors | "Can I run and modify this myself?" | **Open source.** License, self-hosting, architecture, contribution. | The headline |
| **2. Hosted marketing site** (`/`, pricing, solutions pages) | Studio owners and managers evaluating software | "Will this run my studio better than what I have?" | **Class-native scheduling, flat price, unlimited teachers.** | A trust proof, below the fold |
| **3. Hosted product** (`/manage`, `/teach`, staff surfaces) | Studio owners, managers, front desk, teachers | "How do I get today's work done?" | **The work.** No positioning at all. | Invisible |
| **4. Discovery app** (`/schedule`, `/studios`, `/instructors`, storefronts, express booking) | Students and prospective students | "Where can I take a class tonight?" | **Classes, teachers, times, price.** | Absent |
| **5. Studio owner app** (native, planned) | Studio owners and managers on the go | "What is happening at my studio right now?" | **Today: bookings, revenue, who is teaching.** | Absent |

---

## Per-surface detail

### 1. Open-source project

**Audience:** people who will read or run the code. Developers, self-hosting studio owners,
contributors, and the technical evaluator inside a larger studio.

**Lead:** open source, and say which license. This is the only surface where the mechanism *is* the
value proposition, because this audience is buying the mechanism.

**Message:**
> Tandava is an open-source studio management platform. Run it yourself, read your own database,
> change what does not fit. No license server, no vendor lock, no per-seat tax.

**Say:** self-hosting path, license, architecture, domain model, data interoperability, how to
contribute, what is not production-ready yet.

**Do not say:** anything that reads like sales copy for the hosted service. This audience's trust is
earned by candor about what does not work. `HOSTED_PRODUCT_REVIEW.md` is an asset here, not a
liability.

### 2. Hosted marketing site

**Audience:** a studio owner with a Mindbody bill they resent, comparing three options in a browser
with ten tabs open.

**Lead:** the outcome. They do not buy source access; they buy a system that understands a class
schedule and a bill that does not grow when they hire a teacher.

**Message:**
> Studio software that understands a class schedule. Flat price, unlimited teachers, and your data
> stays yours because you can run it yourself.

The third clause is where open source enters, as the *reason to believe* the first two. Not the
headline.

**Say:** recurring class series, waitlist auto-promotion, teacher substitutions, class packs that
count correctly, flat pricing with unlimited teachers, migration from your current vendor, what the
hosted service includes and what it costs.

**Do not say:**
- "Open source" above the fold, or as the primary differentiator
- "Free" (the hosted service is not free, and the word poisons the pricing conversation)
- Anything about licenses, repositories, or contribution
- Any capability that is demonstrated UI rather than verified end to end. This is the surface where
  overclaiming turns into a churned pilot.

### 3. Hosted product (in-app)

**Audience:** the same people as surface 2, but after they have decided. They are not evaluating; they
are trying to add a class before a student calls.

**Lead:** nothing. A product that positions itself at a user who already bought is a product wasting
their time.

**Say:** labels, states, errors that name what to do next, empty states that teach the next action.

**Do not say:** marketing copy, upgrade nags, or anything about open source. The one legitimate
exception is a single unobtrusive link for the technically curious owner, in settings or the footer,
not in the workflow.

### 4. Discovery app (student-facing)

**Audience:** a student or prospective student. They have never heard of Tandava and should not need
to.

**Lead:** the class. Name, time, teacher, price, how to book.

**Say:** the studio's brand, the class, the time in the studio's timezone, the price, the cancellation
policy before the button. Express Booking (PRD-020) belongs entirely to this surface and is governed
by its rules: fewest possible fields, no account required, no platform voice.

**Do not say:** "Tandava" as the hero. The student is booking at *their studio*, not at us. The
platform gets a "Powered by Tandava" line and nothing more. Any sentence about open source here is
pure noise to this reader.

**Consequence:** express booking copy, storefront copy, and embed copy are written in the studio's
voice about the studio's class. The platform is plumbing.

### 5. Studio owner app (native, planned)

**Audience:** an owner between classes, on a phone, in the studio.

**Lead:** today. Bookings, revenue, who is teaching, what needs a decision.

**Say:** the state of the business right now, and the two or three actions worth taking from a phone.

**Do not say:** anything from surface 2. By the time this is installed, the sale is long closed.

**Note:** per `HOSTED_PRODUCT_REVIEW.md`, no native project exists in this checkout. Do not describe
native apps as shipped anywhere, on any surface.

---

## The test

Before writing copy for any surface, answer two questions:

1. **Who is reading this, and what do they want in the next sixty seconds?**
2. **Would this sentence help them, or does it help us feel a certain way about the project?**

"Open source" on the hosted pricing page fails question 2. It is there because we are proud of it, not
because a studio owner comparing waitlist features needs it in that paragraph.

---

## Where the current repo violates this

Audit items, not accusations. Each is small.

| Surface | Issue | Fix |
|---|---|---|
| 2 | Hosted marketing and open-source messaging are not clearly separated; `/open-source` exists but the hosted pitch has no distinct home yet | Build the hosted marketing page as its own surface with its own message |
| 4 | Storefront "Book" used to point at `/auth/register`, which is platform logic intruding on a student flow | Fixed in PRD-020: deep-links to express booking |
| 4 | Embed widget "Book" dumped the visitor on a generic schedule | Fixed in PRD-020: deep-links to the occurrence |
| 2 / 3 | Feature claims drawn from `FEATURE_INDEX.md` status labels without distinguishing demonstrated UI from verified | Only surface-2 copy for capabilities marked verified end to end |

---

## Related

- [docs/competitive/MANGOMINT.md](../competitive/MANGOMINT.md) — where the positioning question came from
- [docs/prd/PRD-020-express-booking.md](../prd/PRD-020-express-booking.md) — surface 4's conversion path
- [docs/HOSTED_PRODUCT_REVIEW.md](../HOSTED_PRODUCT_REVIEW.md) — what may honestly be claimed
- [docs/roadmap/PRICING_MODELS.md](../roadmap/PRICING_MODELS.md) — what surface 2 can say about price
