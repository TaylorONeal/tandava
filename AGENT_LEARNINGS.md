# AGENT_LEARNINGS.md

Compact external memory for reusable, verified Tandava lessons. This is not a transcript.

## Usage
- Search for task-relevant entries before non-trivial work; do not load the full file by default once it grows.
- Add an entry only after an observable failure or correction yields a reusable, verified improvement.
- Record trigger/symptom, verified cause, fix/prevention, evidence/source, and promotion target.
- Never store hidden reasoning, speculation, or every failed attempt.
- Promote mature lessons into tests, migrations, lint rules, scripts, or canonical docs, then prune duplicates here.
- Revalidate after dependency, schema, provider, or architecture changes.

## Active Lessons

### TAN-001 — Context should be loaded by domain
- Trigger: Starting a task in an unfamiliar Tandava area.
- Failure pattern: Reading key-files, full lessons, and design-system docs before every task wastes context and creates irrelevant constraints.
- Better approach: Use KEY_FILES only for navigation, design docs for UI work, and retrieve historical lessons only when symptoms/tasks match.
- Evidence: 2026-09-23 instruction audit.
- Promotion target: `docs/ai-agents/AGENTS.md`.

### TAN-002 — Preserve domain separations
- Trigger: Modeling bookings, payments, entitlements, attendance, or scheduled sessions.
- Failure pattern: Collapsing distinct operational and financial concepts creates vendor-shaped logic and brittle workflows.
- Better approach: Preserve Booking ≠ Transaction, Entitlement ≠ Payment, and Session independence unless a domain decision explicitly changes the model.
- Evidence: Current domain contract.
- Promotion target: domain-model docs and tests.

### TAN-003 — Schema changes need migration evidence
- Trigger: Database schema or RLS changes.
- Failure pattern: Code/types can drift from the actual database when schema edits are made without migrations or validation.
- Better approach: Create a migration, update generated/manual types as applicable, and validate RLS/multi-tenant behavior for the touched tables.
- Evidence: Current database architecture.
- Promotion target: migration tooling / CI.

## Promotion / Pruning
Keep the active file small and high-signal. Once a lesson is enforced elsewhere, remove it here or leave only a concise pointer.
