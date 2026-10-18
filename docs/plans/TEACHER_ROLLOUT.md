# Teacher attendance rollout packet — 2026-10-18

Prepared only. No hosted SQL, deployment, credentials, Stripe events, or workflow runs were changed.

## Source and current evidence

- Remote `main` remains `7353a2a16be3d5f19f19231d587677011264897a`; no open PRs when rechecked. Isolated local branch adds member regression `82c613e` and teacher implementation `209778a`.
- GitHub Vercel commit status reports success for main at deployment `HrDS9DXSLc6xvqZfgxUhi7s1jaW8`: https://vercel.com/tayloroneal-1467s-projects/tandava/HrDS9DXSLc6xvqZfgxUhi7s1jaW8 . Public `/teach` returns HTTP200 SPA HTML; this alone does not verify authenticated operation.
- Existing Supabase CLI authentication returns403 for `functions list --project-ref mkaixgjwakfufmmwembn`. No source download was attempted after denial. Migration00043 and deployed function versions remain unverified, not assumed absent.
- Migration00044 exists only locally; its three teacher RPCs are not on upstream main. New teacher frontend has not been deployed.
- Local checks: TypeScript and focused ESLint pass;526 application+32 script tests pass;23 browser tests pass with2 workers (including390×844 teacher attendance). Database tests remain unexecuted: PostgreSQL server tooling is unavailable. Do not deploy on browser mocks alone.

## Reviewable artifacts

| Artifact | Purpose |
|---|---|
| `scripts/db/prod/verify-00043-00044.sql` | Read-only function/table presence, grants, search paths and definition fingerprints; no user rows or secret values |
| Existing `scripts/db/prod/apply-00043.sql` | Existing owner class-cancellation migration bundle, only if owner verification proves needed |
| `scripts/db/prod/apply-00044.sql` | Exact migration00044 wrapped in BEGIN/COMMIT; execute only after DB validation and deployment approval |
| `supabase/tests/024_teacher_attendance.test.sql` |15 assignment/authorization/attendance cases, included in full test runner |
| `supabase/functions/cancel-class/index.ts` and `stripe-webhook/index.ts` | Existing main owner cancellation/refund code; separate from teacher RPC feature |

## Dependency order after approval

1. Complete local clean-database migration+full SQL suite using a disposable database. Preserve existing production migration history; earlier production SQL was manually applied, so do not issue blind `db push` or migration repair.
2. Project owner runs the read-only verification query and supplies function metadata (name/version/JWT mode) for `cancel-class` and `stripe-webhook`. Compare deployed source/definitions to main. Presence alone is not proof of matching implementation. Any absent or drifted prerequisite must be reviewed before writing.
3. If00043 is not installed, review and apply its established bundle first. Deploy matching `cancel-class` with JWT verification and `stripe-webhook` with Stripe signature verification (no JWT). Owner confirms webhook subscriptions include `refund.updated`, `refund.failed`, `charge.refund.updated`. These are state changes requiring approval. Do not run the broad deploy-functions script merely to update these two functions.
4. Review and apply00044 after its tests pass. The teacher feature requires no Edge Function deployment, new credential, or global role-permission change. New RPCs require active assigned teacher/owner/admin; existing general staff check-in RPC permissions remain unchanged.
5. Publish/review the local commits, then release the frontend after SQL is confirmed. Neither push nor merge nor deployment is authorized by this packet.
6. In an approved sandbox, verify assigned teacher sign-in → class list → roster → single committed check-in → refresh; verify student/unassigned/inactive callers cannot use new paths. Owner price/schedule and member booking flows remain part of the regression set.

## Payment proof remains separate

Latest scheduled Stripe smoke (2026-10-18): https://github.com/TaylorONeal/tandava/actions/runs/39131170968 . It fails before the flow starts because `SUPABASE_SERVICE_ROLE_KEY` is missing, mapped from GitHub environment `stripe-smoke` secret `SMOKE_SUPABASE_SECRET_KEY`. Also required: `SMOKE_STRIPE_TEST_KEY`, `SMOKE_STRIPE_WEBHOOK_SECRET` (presence unverified). Supply values directly through GitHub environment settings, never chat. This workflow mutates hosted sandbox test data and requires authorization before manual dispatch. A passing mock flow does not prove checkout/refund/webhook behavior live.
