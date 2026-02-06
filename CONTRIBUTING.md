# Contributing to Tandava

Thank you for your interest in contributing.

This project exists to provide **open, interoperable, and user-centered infrastructure** for studio management and business systems integration. Contributions are welcome, but they work best when grounded in shared goals, clear scope, and mutual respect for the project's direction.

This guide explains how to contribute constructively and how decisions are made.

---

## What This Project Is (and Is Not)

Before contributing, please familiarize yourself with:

- **[README.md](README.md)** — Project philosophy, features, and architecture
- **[DATA_INTEROPERABILITY.md](DATA_INTEROPERABILITY.md)** — Data ownership, neutral structures, and legal posture
- **[docs/ROADMAP.md](docs/ROADMAP.md)** — Phased development plan
- **[docs/FEATURE_INDEX.md](docs/FEATURE_INDEX.md)** — Current feature status and schema mapping

This is a **production-grade, infrastructure-focused project**, not an experimental playground.

It is intentionally:
- Conservative in core abstractions
- Careful about legal and interoperability boundaries
- Incremental rather than disruptive

Contributions that align with this mindset are highly valued.

---

## Types of Contributions We Welcome

We especially welcome:

- **Bug fixes** — Correctness matters
- **Performance improvements** — Efficiency at scale
- **Schema clarifications and documentation** — Clarity for maintainers and users
- **New export formats** — CSV, Excel, accounting, payroll, analytics
- **Connector improvements** — Automation events, webhooks, APIs
- **Tests** — Coverage for existing and new functionality
- **Clear, scoped refactors** — Preserve behavior while improving structure
- **Documentation improvements** — Increase clarity or usability

We value contributions that:
- Solve real problems studios face
- Reduce complexity or ambiguity
- Improve correctness and reliability
- Are easy to review and reason about

### Relevant Documentation for Contributors

| Area | Key Documents |
|------|---------------|
| Domain model & concepts | [docs/architecture/DOMAIN_MODEL.md](docs/architecture/DOMAIN_MODEL.md) |
| Business exports & connectors | [docs/ai-agents/BUSINESS_CONNECTORS.md](docs/ai-agents/BUSINESS_CONNECTORS.md), [docs/prd/PRD-016-accounting-exports.md](docs/prd/PRD-016-accounting-exports.md) |
| Workflow automation | [docs/guides/WORKFLOW_AUTOMATION.md](docs/guides/WORKFLOW_AUTOMATION.md) |
| Access control | [docs/architecture/ROLE_ACCESS_CONTROL.md](docs/architecture/ROLE_ACCESS_CONTROL.md) |
| Audit & compliance | [docs/architecture/AUDIT_COMPLIANCE.md](docs/architecture/AUDIT_COMPLIANCE.md) |
| All PRDs | [docs/prd/](docs/prd/) |

---

## Contributions That Are Likely to Be Declined

To save everyone time, the following are generally out of scope:

- Large architectural rewrites without prior discussion
- Replacing core data models for stylistic or ideological reasons
- Introducing proprietary dependencies without strong justification
- Changes that undermine interoperability or data portability
- "All-in-one" redesigns that expand scope without roadmap alignment
- Legal or licensing debates inside pull requests

This doesn't mean these ideas are invalid. It means they require **discussion first**, not code.

---

## How to Propose a Change

### 1. Start with an Issue or Discussion

For anything beyond a small fix:

- Open an issue or discussion
- Describe:
  - The problem you're solving
  - Why it matters
  - How it fits the project's goals
- Be concrete and specific

This helps maintainers guide the solution before time is spent coding.

### 2. Keep Pull Requests Focused

Good pull requests:
- Do one thing well
- Are easy to review
- Preserve existing behavior unless explicitly changing it
- Include context in the description

If a PR is large:
- Explain why it needs to be large
- Break it into logical commits where possible

### 3. Respect Existing Patterns

Please:
- Follow existing naming conventions
- Match code style and structure
- Reuse existing utilities and abstractions where appropriate

If you believe an existing pattern is flawed:
- Explain why
- Propose an alternative
- Avoid changing unrelated code

### 4. Model Reality, Not Software

Tandava models **universal studio reality**—the way studios actually operate, independent of any software system.

When adding features or entities, ask:
- Does this correspond to something real in a studio's operation?
- Would a studio owner recognize this concept without explanation?
- Is this how the business works, or how some software implements it?

**Do:**
- Use universal business concepts (classes, bookings, members, transactions)
- Keep operations and monetization as separate concerns
- Design entities that exist independently of any integration

**Don't:**
- Mirror workflows from proprietary systems
- Introduce vendor-specific assumptions
- Collapse distinct concepts (e.g., booking ≠ payment)

See [DOMAIN_MODEL.md](docs/architecture/DOMAIN_MODEL.md) for the conceptual foundations.

---

## Development Setup

```bash
# Clone the repository
git clone https://github.com/TaylorONeal/tandava.git
cd tandava

# Install dependencies
npm install

# Start development server (demo mode)
echo "VITE_DEMO_MODE=true" > .env.local
npm run dev

# Run with local Supabase (full stack)
supabase start
supabase db reset
npm run dev

# Build for production
npm run build
```

See the [README.md](README.md#getting-started) for detailed setup instructions.

---

## How We Evaluate Contributions

Maintainers review contributions based on:

1. **Correctness** — Does it work as intended?
2. **Clarity** — Is the code understandable?
3. **Alignment with project goals** — Does it fit the roadmap?
4. **Impact on interoperability** — Does it preserve data portability and neutrality?
5. **Long-term maintainability** — Will this be easy to evolve?

Not all accepted contributions are merged immediately. Some may be staged, revised, or deferred.

---

## Feedback, Criticism, and Disagreement

Constructive disagreement is welcome.

**Helpful feedback:**
- Is specific
- Is grounded in concrete examples
- Proposes alternatives, not just objections
- Respects the project's stated goals

**Unhelpful feedback:**
- Re-litigates foundational decisions already documented
- Focuses on personal preference rather than project needs
- Assumes bad faith or hidden intent
- Frames disagreement as urgency or crisis

If a discussion becomes unproductive, maintainers may pause or close it to keep the project healthy.

---

## Legal and Interoperability Boundaries

This project operates within clearly defined legal and interoperability principles documented in [DATA_INTEROPERABILITY.md](DATA_INTEROPERABILITY.md).

By contributing, you agree that:

- Contributions must not introduce circumvention, scraping, or unauthorized access
- Contributions must respect user-directed data access
- Contributions must avoid copying proprietary code, UI, or confidential logic
- Contributions must preserve the project's neutral, vendor-agnostic posture

If you are unsure whether a contribution crosses a boundary, ask before submitting.

---

## Code of Conduct

Be professional, respectful, and patient.

This is a collaborative, long-term project. We value thoughtful participation over volume or speed.

Harassment, hostility, or bad-faith engagement will not be tolerated.

---

## Recognition and Credit

All contributors are credited through Git history and release notes where appropriate.

Meaningful, sustained contributions may be invited into deeper collaboration or maintainership over time.

---

## Final Note

Open-source works best when contributors share a mental model, not just a codebase.

If you're excited about:
- Interoperability
- Data portability
- Practical software that respects users

You're in the right place.

We're glad you're here.

---

*See also: [README.md](README.md) | [DATA_INTEROPERABILITY.md](DATA_INTEROPERABILITY.md) | [docs/INDEX.md](docs/INDEX.md)*
