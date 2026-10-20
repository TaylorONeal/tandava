# Account deletion initiation (not yet launch-ready)

Migration 00045 provides an authenticated, durable request, visible only to its requester. Account → Delete account requires exact DELETE confirmation and a password/OAuth/OTP/MFA authentication event in the last ten minutes. Refreshing a JWT alone does not satisfy this check. A sole active studio owner must transfer ownership first. Duplicate submission returns the same reference. No profile, auth identity, booking, entitlement, or payment record is deleted by initiation.

**Release blocker:** assign an actual fulfillment operator, publish an achievable processing timeline, and implement/rehearse fulfillment before enabling this feature for launch. There is currently no automatic worker or established staffed queue. Pending is not deletion, and this implementation alone must not be represented as satisfying store account-deletion acceptance.

The operator must use the supported administration interface to inspect pending requests, verify identity/ownership again at fulfillment (ownership may change after submission), reconcile active billing and bookings, and apply the approved retention policy. Never simply delete `auth.users` or `profiles`: existing foreign keys cascade into financial and other records. Retain only legally required records with documented reason/expiry, remove personal data from unrelated tables, storage and attribution records, revoke sessions and authentication access, and verify the result before marking a request complete. Actual completion needs an audited, idempotent implementation and tests, not a manual status toggle. No operator permissions or service-role grants are introduced by this migration.

Do not claim an estimated completion date until the responsible operator and process exist. Do not require cancelling a paid subscription as a condition of erasure; explain that billing continues separately and provide the existing Manage billing action. A final implementation must handle active commitments explicitly.

## Bounded operator preparation and remaining fulfillment

The next implementation should be a non-destructive review stage, followed by separately authorized erasure stages. It must not label profile scrubbing alone as account deletion.

1. Generate a dry-run inventory from the database's actual foreign-key catalog. Include schema, table, column, constraint and affected row count for every reference to the profile. Return no row values, email addresses or payment payloads. Recheck sole active studio ownership. Explicitly report unsupported composite references and non-FK data; zero FK rows never proves absence of personal data.
2. Require an operator ticket and a reference to the approved retention policy. Record the reviewed inventory in an immutable audit receipt. Recompute the inventory before recording; reject a changed request or ownership state. This review must leave the account/request pending and preserve all financial rows. Counts are a discovery tool, not a concurrency lock or proof of erasure.
3. Build a versioned per-table erasure manifest from that inventory and the approved policy. Each retained category needs a reason, retention expiry and responsible processor. Unknown columns/tables, JSON payloads, free-text copies, storage objects, external processors and backups block completion rather than being silently skipped.
4. Implement idempotent, checkpointed execution. Disable authentication and revoke sessions through supported Auth administration before scrubbing, prevent application writes from repopulating data, preserve required financial relationships, and remove approved personal data. Recheck ownership at execution. Do not delete auth/profile rows while cascading financial foreign keys remain.
5. Independently verify each manifest step, authentication denial, storage removal and financial invariance. Only verified success can mark the request completed. External-processor or retention exceptions remain explicit, with expiry tracking; a status toggle is not proof.

Local tests to accompany implementation: anonymous/member operator denial, missing policy/operator reference denial, stale inventory rejection, new-table discovery, ownership changes after initiation, duplicate execution idempotency, injected partial failures, unchanged financial rows, and refusal to complete with unverified sinks. No fixture may contact external services.

2026-10-19: Taylor explicitly approved writing/testing the access rules in a disposable local database with synthetic data. The previously denied action was retried once under that new approval. Migration `00046_deletion_review.sql` implements stages 1–2 only: `preview_account_deletion(uuid)` returns counts and unresolved categories; `record_account_deletion_review(uuid,jsonb,text,text)` checks the reviewed snapshot and records a receipt. Both are service-role-only, pinned-search-path functions. Anonymous/member reads of the audit table return zero rows; direct service-role insert/update/delete is denied. Database administrators remain able to inspect the audit table. Operator/policy references are audit labels, not proof of policy authority or authenticated human identity.

The preview includes single-column profile-ID foreign keys and explicitly counts unsupported composite/alternate-key references. Recording is refused when unsupported references exist. It does not enumerate indirect dependencies or discover PII hidden in arbitrary JSON/free-text fields; these remain explicit unresolved categories. Same-count content changes and concurrent writes are not detected by this discovery snapshot. No receipt authorizes erasure, records a completed deletion, or changes request status. Production deployment and real account deletion remain unauthorized.

Remaining implementation: stages 3–5, approved retention policy, assigned fulfillment operator/timeline, Auth/storage/processor coverage and complete end-to-end rehearsal. Keep the UI feature flag OFF. Neither migration 00045 nor 00046 makes account deletion store-ready by itself.

### Required decisions before execution can be implemented/enabled

| Decision | Responsible role to assign | Required artifact / acceptance evidence |
| --- | --- | --- |
| Retention rules | Product owner with the applicable privacy/accounting policy owner | Versioned per-category policy identifying what is erased, retained, why, expiry and processor; no invented retention duration. Cover financial transactions, bookings/attendance, messages, waivers/emergency data, audit records and backups. |
| Fulfillment ownership | Named operations owner and backup | Restricted operator identity, request triage schedule, verified contact channel and approved processing timeline. Ticket labels in migration00046 do not establish operator identity. |
| Auth and write cutoff | Backend owner | Supported Auth administration design for session revocation/account disablement, a tested write barrier, failure recovery and verification that old sessions cannot repopulate data. No new production access is implied. |
| Data/processor coverage | Backend and integration owners | Versioned erasure manifest covering direct/indirect FKs, JSON/free text, storage, email/SMS, Stripe and backups; every unresolved category prevents completion. |
| Safe execution | Backend owner plus independent reviewer | Disposable synthetic rehearsal of idempotent checkpoints, partial failures/retries, ownership transfer, financial invariance and independent verification. No cascading profile/auth delete. |
| Enablement | Authorized release owner | Reviewed migration deployment, assigned operational workflow and observed end-to-end deletion of an explicitly disposable test account. Only then enable the UI flag and make accurate store/privacy claims. |

Next engineering milestone: after the versioned policy and fulfillment owner are
supplied, implement stages3–5 against injectable Auth/storage/processor adapters
and synthetic fixtures first. Keep dry-run inventory separate from execution.
Any production deployment, account disablement or real erasure needs its own
explicit authorization; the local access-rule test approval does not cover it.

## October 20 synthetic fulfillment executor

`scripts/deletion/fulfillment.mjs` now implements the execution ordering and
verification contract for a **disposable synthetic rehearsal only**. It is not
imported by the frontend or an Edge Function and supplies no live adapter. Both
the manifest and adapters must identify the disposable synthetic environment;
production execution is rejected. Tests run through `npm run test:scripts`.

The versioned manifest binds the request, subject, schema fingerprint, policy and
operator references. It requires explicit Auth, database, storage, free-text/JSON,
processor and backup coverage. Unknown inventory steps or unresolved sinks block
execution. Under a request lock, it verifies a write barrier and authentication
denial before scrubbing, rechecks sole ownership/inventory during execution, and
uses operation keys plus independent read-back to recover a lost response without
repeating a successful mutation. Checkpoints are not accepted as proof: every sink
is verified again before the final receipt, and a financial digest must remain
unchanged. Retention requires a reason, processor and expiry and leaves the receipt
`awaiting-retention`; expiry alone never counts as verified erasure.

Twelve failure/retry tests exercise these invariants, including schema drift,
ownership changes, missing cutoffs, partial failure, duplicate execution, changed
manifests, processor failure, financial mutation and data repopulation. A passing
receipt is named `verified-synthetic`, never a completed real account deletion.
The test journal and adapters are in-memory fixtures; they do not establish durable
production checkpoints, a real cross-process lock, session revocation or exhaustive
schema/processor coverage. Actual per-table adapters and the approved retention
manifest remain required, followed by real disposable-account acceptance under
separate hosted authorization. Keep the deletion UI feature flag OFF.

## October 20 production database stage (review only, NOT deployed)

Migration `00047_deletion_execution.sql` adds real database-side execution state
and a profile erasure adapter. Unlike the synthetic executor, these functions use
the actual `profiles`, booking, credit and financial tables. They have only been
executed in a fresh disposable PostgreSQL cluster with synthetic fixtures.

`begin_account_deletion_execution(request, review, manifest)` is service-role-only.
It binds an immutable manifest to migration46's matching review, rechecks inventory
and sole ownership, and leases the work for15minutes with a rotating fencing token.
A current token is required for the profile stage; an expired worker cannot reuse
its token after another worker acquires the lease. The private execution table has
no direct worker write access. Workers also lose direct completion-status writes
on the request table; no completion RPC is supplied by this migration.

A BEFORE trigger on each existing public table serializes writes by authenticated
JWT subject with the cutoff transaction and rejects that subject's later writes,
including writes inside SECURITY DEFINER booking functions. Other members retain
normal write access. Begin refuses new tables that lack this guard. Normal writers use shared advisory locks; an exclusive cutoff rejects new writers
with a retry error instead of waiting while they hold row locks. This needs performance review
before deployment. It is **not** a blanket service-role, webhook, storage or
processor cutoff. Those channels still require subject-aware adapters and checks.
The auto-book RPC now calls the same cutoff guard before its entitlement fallback,
so a blocked account gets an error instead of a misleading `needs_payment` result.
The existing membership/pack selection behavior is retained. Service-side payment
and processor requests still require their own subject checks.


`scrub_account_deletion_profile(request, token)` requires an active Auth ban and
no remaining Auth sessions, rechecks ownership, and refuses an unknown profile
column. The test Auth ban/session rows are local stand-ins, not a supported way to
modify hosted Auth. Production must establish these prerequisites through reviewed
Auth administration. The function tombstones contact/emergency/biographical fields,
reads them back, preserves the profile/auth keys and compares protected financial
and booking rows before/after under table locks. It never deletes `auth.users` or
`profiles`, and returns `account_completed: false`. Repeat execution is idempotent
for the scrubbed fields. The request stays `processing`; the write barrier stays on.
There is no production rollback/unblock procedure yet; resolve unexpected cutoffs
through a separately reviewed recovery process before enabling a worker.

Nineteen SQL assertions plus a two-session cutoff race cover operator denial, missing retention details, active
lease exclusion, old-JWT profile/booking writes, unaffected users, missing Auth ban,
remaining sessions, changed ownership/schema, tombstone and financial invariance,
stale-token rejection, immutable policy, protected history and no completion-toggle
shortcut. The complete existing SQL suite also passes with this migration applied
locally. The two-session test verifies a stale writer fails fast during an exclusive cutoff
without a row-lock deadlock. Full workflow concurrency and the remaining adapters are
still required; these passes do not close account deletion for store submission.

### Concrete retention and delivery decisions still needed

The published hosted privacy text already promises deletion/anonymization within
30days except legally required records (`src/content/legal/index.ts`, “Keeping and
deleting data”). Implement the workflow against that existing promise or obtain an
explicit approved policy change; do not invent another timeline in code.

| Category | Implementation disposition / required decision |
| --- | --- |
| Profile contact, emergency and biography fields | Actual tombstone adapter implemented; not deployed. Created/updated timestamps and opaque identity keys remain. |
| Transactions, memberships, class packs, credits and bookings | Currently preserved byte-for-byte by the profile stage, **not approved for indefinite retention**. Supply a policy reference, exact category/reason/expiry and responsible processor. Related descriptions/metadata may contain personal data and need explicit scrubbing rules. |
| Attendance, member notes/tags, waivers, messages, teacher/staff attribution | Per-table and indirect-FK erasure/anonymization manifest and appropriate retention decisions still required. No generic cascading deletion. |
| Auth identity, sessions and stale tokens | Select/rehearse supported Auth administration and PII erasure strategy while preserving financial FK relationships. Ban/session checks alone do not finish identity deletion. |
| Storage, email/SMS, Stripe and analytics | Inventory linked identifiers and objects, disable repopulating writers, add idempotent adapters and independent evidence. No processor contact occurred in these tests. |
| Backups and retained records | Identify actual provider retention/expiry and restore suppression procedure; record deferred obligations. Expiry alone is not proof of erasure. |
| Operations | Assign primary/backup fulfillment operators and a queue/reconciliation cadence capable of meeting the published30-day promise. Labels in a manifest are not authenticated operator identity. |

Next milestone: approved per-category manifest plus Auth/service-writer cutoff and
remaining data/processor adapters, then a complete disposable rehearsal with crash/
resume and concurrency. Only a verified complete workflow can enable the UI flag
or justify hosted disposable-account deletion acceptance. Production deployment,
real-account disablement/deletion and feature enablement remain unauthorized.

### Lease expiry during execution

The profile stage rechecks lease time after potentially blocking relation locks
and after its writes/read-back. Expiry during the mutation raises an exception
and rolls back both personal-data changes and the checkpoint. EXEC-21 injects a
slow synthetic row trigger to verify this; an entry-time check alone cannot fence
a worker that spends the rest of its lease waiting or writing. The request and
execution row locks prevent another worker rotating the token during the stage.
