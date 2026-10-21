# Tandava Studio and Member release acceptance

Updated October 21, 2026. Local integration branch `codex/app-store-excellence` combines main with draft PR #102 and held draft PR #106. Current execution receipts are in [PROGRESS](../plans/PROGRESS.md). Historical candidate evidence below keeps its original source/build.
This is an acceptance plan and evidence ledger, not a claim of release readiness.
Every pass names its layer. Local mocks and synthetic database fixtures do not
establish hosted configuration, payment delivery or native reviewer acceptance.
Use PASS, FAILED or NOT RUN; blocked work stays NOT RUN with its dependency.

## Release gates and test setup

P0 failures block release: cross-tenant disclosure, unauthorized role action,
duplicate charge/booking, capacity/credit corruption, broken reviewer login,
false completion of deletion, or inability to use the advertised core journey.
P1 failures require a fix or an explicit release-owner decision with a workaround.
No merge, production migration, real deletion or store submission is implied.

Use two synthetic studios A/B with an owner, admin/front desk, assigned teacher,
unassigned teacher, member and anonymous visitor. Add a multi-studio staff member,
a revoked staff member, an invited-but-unaccepted member and an expired session.
Keep fixtures clearly labelled and isolated from real inventory and customers.
Use existing sandbox payment tooling only after its environment is confirmed.
Never create production credentials or send real notification messages as a test.
Record commit, app version/build, OS/device, environment, role, expected/observed
result and evidence path. Any test retry records its first failure too.

## Risk matrix and current evidence

| Priority / area | Scenarios and required result | Current result and evidence | Remaining acceptance |
|---|---|---|---|
| P0 roles and tenant isolation | Direct links and RPCs as every role; switch A/B; revoke role while signed in; no cached B data after switch/logout. Unassigned teachers cannot edit attendance. | PASS local SQL `010_isolation`, `021_function_hardening`, `024_teacher_attendance`; mocked owner/teacher browser journeys passed. | NOT RUN real review identities and physical role changes; review-account seed is prepared, not applied. |
| P0 invitations/auth | Valid, expired, reused and wrong-email invite; existing account; sign-out/back; recovery/deep link cold and warm launch; session expiry mid-save. No role escalation or lost destination. | NOT RUN complete invitation matrix. | Existing sandbox identities and controlled email destination, physical iOS and eventual Android candidate. |
| P0 booking and capacity | Free, pack, membership, paid drop-in; full/waitlist/cancelled/started class; two members race last seat; duplicate tap and lost response. One confirmed seat/charge, truthful waitlist. | PASS local SQL `030_booking`, `035_booking_integrity`, `037_book_auto`, `038_seat_holds`; last-seat race; mocked free/pack error→retry→confirmation→reopen journeys. | NOT RUN physical signed-in booking and hosted sandbox payment confirmation. |
| P0 credits/cancellations/refunds | Race final credit on two classes; cancel before/at/after deadline; owner class cancellation; partial/full/refund replay; same payment with new event ID. No negative credits or duplicate refund; server confirmation precedes success UI. | PASS local SQL booking, `023_class_cancel`, `060_payments`, last-credit race; mocked member cancellation rejects then retries successfully. | NOT RUN real Stripe test-mode checkout/webhook/refund round trip and native cancellation. |
| P1 recurrence/time | Generate and regenerate weekly schedule; edit future occurrence vs series; booked occurrence preservation; cross-midnight; spring missing hour/fall repeated hour; studio/viewer zone differs. No duplicate occurrences or shifted wall-clock classes. | PASS local SQL `017_schedule_generation` for existing assertions. Unit timezone/calendar tests tracked separately below. | NOT RUN full DST recurrence edit matrix and physical calendar imports; test Chicago DST boundaries, Honolulu, Makassar, non-hour offset zone. |
| P0 test payments/webhooks | Approved test card success/decline/3DS/cancel; delayed, replayed, out-of-order signed webhook; mismatched studio/amount; disconnect/reconnect. Confirm only after server event and preserve audit trail. | PASS synthetic database `060_payments`; this is not a Stripe delivery pass. | NOT RUN connected sandbox end-to-end, signature/retry delivery and reconciliation. No live charges. |
| P1 notifications | Confirmation/cancel/waitlist to controlled destination; retries, unsubscribe, bounced address, timezone and deep links; no other tenant recipient. | NOT RUN end-to-end delivery. | Confirm existing authorized sandbox destinations/providers; never mail real members for QA. |
| P0 repeated actions/offline | Double tap submit; timeout after server commit; airplane mode before/after submit; background/kill/relaunch; reconnect. Reconcile status, no optimistic false success or duplicated operation. | PASS bounded SQL booking/credit races and mocked error retries only. | NOT RUN physical network/relaunch matrix; do not equate retry-button tests with offline-native coverage. |
| P0 privacy/deletion | Request/retry, sole-owner transfer gate, unauthorized operator, stale inventory/token, concurrent stale writer, changed schema, failed processor, financial invariance and independent sink verification. No completion while any sink unresolved. | PASS full disposable SQL suite including `025`/`026`/`027` and cutoff race; 12 synthetic executor tests. | NOT RUN full real-adapter workflow. UI remains OFF; Auth/storage/processors/backups/retention and recovery still block enablement. See ACCOUNT-DELETION.md. |
| P1 empty/error/loading states | Zero public inventory, no search matches, unavailable service, no bookings, no teacher assignments, no studio setup; keep drafts on error. No demo inventory in hosted experience or signup promise. | Discovery changes under review with `e2e/discovery-states.spec.ts`; result recorded below after execution. Existing member empty-bookings path passed. | NOT RUN all owner/teacher empty setup and physical offline states. |
| P1 accessibility | Keyboard/tab order, labelled controls, visible focus, popup Escape/return focus, VoiceOver/TalkBack, Dynamic Type, contrast, reduced motion, touch targets. Errors announced and not color-only. | Discovery tests cover named controls and help dismissal only. | NOT RUN screen readers, large text, complete focus/contrast/touch audit. |
| P0 reviewer journey | Fresh install→anonymous discovery; sign in member→book→My Schedule→cancel; teacher→assigned roster→attendance; owner→catalog/schedule. Recovery, logout, legal/help and accurate screenshots. | PASS iPhone simulator launch for both build2 apps and local mocked role journeys. Signed development and distribution binaries verified. | NOT RUN physical authenticated journeys. App records, Apple validation and TestFlight installation remain separate gates. |

## Execution order and evidence

1. Run typecheck, lint changed files, focused unit tests, script tests and the full
   disposable PostgreSQL suite. The October20 DB run ended `RESULT: all database
   tests passed`, including `EXEC-20` concurrent cutoff. Database is synthetic and
   uses a private Unix socket; no hosted migration was executed.
2. Run browser suite against fake local Supabase with intercepted requests. Add
   no-inventory, filtered-empty and service-error recovery. Save output and traces
   for failures. These fixtures must never become marketplace listings.
3. Finish approved Apple records using existing bundle IDs and profiles. Validate
   each signed IPA, then use the authorized distribution path. Current Member
   validation FAILED because its App Store app record is missing. Studio validation
   NOT RUN: conditional payload approval has since been received, but its app record
   is still absent.
4. Verify physical iPhone identities and preserve installed data. TestFlight109
   belongs to TeacherTree; Tandava build2 has not been uploaded. No generic
   reinstall/reset instruction is an acceptable substitute for diagnosis.
5. With existing review accounts and sandbox configuration verified, execute P0
   role journeys and payment/notification cases, then accessibility and interruption
   passes. Attach evidence per candidate, not per repository alone.
6. Release owner reviews every FAILED/NOT RUN P0, deletion workflow, privacy and
   store claims. Keep PR draft/unmerged until approval; ask before merging.

### Repeatable local commands

- `npm run typecheck`
- `npm run test:scripts`
- `npx vitest run src/lib/discover.test.ts src/lib/time/classTime.test.ts src/lib/calendar/classEvent.test.ts`
- `PW_CHROMIUM_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e`
- Use the documented disposable DB runner (`supabase/tests/run.sh` requires a
  deliberately selected local synthetic database). Never use the production URL.

### UI/help contract

Essential recovery is visible: no public classes means ask the studio for its
usual booking link or Check again; failed fetch means check connection/Try again;
filtered-empty means Clear filters. No unsupported launch date, hidden listings,
or signup-to-unlock promise. Supplementary explanation uses the tap/keyboard
`HelpTip` with id `discovery-availability`, sourced from `src/content/help.ts` and
mirrored in `docs/FAQ.md`. Absence of class rows does not prove a studio has closed.

### Latest execution results

- PASS: full disposable PostgreSQL suite with migrations through00047 and the
  two-session cutoff test (`EXEC-20`). No hosted SQL executed.
- PASS: typecheck and changed-file ESLint;37 focused discovery/timezone/calendar
  unit assertions across3 files.
- Browser first run:27 PASS,1 FAILED. The help-popup test sent Escape before
  popup focus was established. It now waits for actual focus before Escape and
  checks focus returns to the trigger. Focused rerun: all3 discovery tests PASS.
  The remaining25 tests passed in the full run and were unchanged.
- Carried forward:44 script assertions including12 synthetic executor cases;
  successful build2 simulator launches and strict local binary signatures.
- NOT RUN: physical authenticated acceptance, full offline/accessibility matrix,
  external sandbox delivery and complete deletion adapters.
- Build3 IPAs now include the discovery changes and pass strict local signatures.
  Their source is270a0a1. Physical acceptance and Apple validation/upload remain
  NOT RUN; build2 simulator evidence is carried forward only for its original scope.

### Additional review findings

EXEC-21 now passes in the full disposable SQL suite: a slow profile write that
outlives its lease rolls back both profile changes and its execution checkpoint.
The [reviewer walkthrough](../app-store/REVIEWER-WALKTHROUGH.md) also identifies
a seed prerequisite: the unlisted synthetic studio has no explicit `page_live`
value, so its public booking page defaults OFF and cannot support the Member
booking journey. Resolve approved page visibility before provisioning; no RLS or
hosted visibility change was made. All physical journeys remain NOT RUN.

## Integrated release regression procedures — October 21

- Run all migration versions in order, including scoped Data API grants 46 and
  deletion 47–49, against one fresh disposable PostgreSQL cluster. Run the restricted
  API-role/column tests and the native deletion cutoff tests together; separate
  branch passes cannot establish integration. Never use a hosted database URL.
- Execute the actual Edge handlers with synthetic injected clients: normalized
  external return URLs fail closed; inactive studio staff cannot connect, onboard
  or import; generic email/SMS/push endpoints reject ordinary caller tokens;
  importing an existing member does not modify that person's shared profile.
- For both free-class and class-pack member booking, exercise server rejection,
  confirmed, waitlisted and missing responses. Waitlisting must never say a spot
  is confirmed or offer a confirmed calendar entry. Missing responses must link
  to My Schedule without inventing success. Reopen My Schedule and check status.
- On a 390×844 phone viewport, setup steps have visible names and selected-step
  semantics; the last navigation action is reachable by scrolling. Studio logout
  reports a failed backend request, permits retry and removes the private session
  only after confirmed success. Repeat setup inspection on desktop.
- Native lifecycle tests cover cold link, warm link, teardown and cold/warm races.
  Email recovery links must use reachable HTTPS origins. Hosted browser completion
  and native app sign-in are separate sessions until universal auth links are
  configured and verified. Use the actual signed candidate for final acceptance.
- Recheck the affected browser paths and final production build after all source
  edits. Local fixtures are not hosted email delivery, provider acceptance or
  physical-device proof. Severe host contention may require sequential checks;
  record interrupted runs as unexecuted, not passed.

- For smoke-harness changes, run `node --test scripts/smoke/*.test.mjs` and
  `bash scripts/smoke/local-store.integration.sh`. The latter provisions only a
  fresh synthetic PostgreSQL cluster. Verify no network calls for unsafe targets,
  restricted financial-table grants, marker enforcement, read/cleanup scope and
  failed-cleanup reporting. Provisioning a complete local Supabase fixture and
  real sandbox delivery are separate acceptance steps, not implied by these tests.
