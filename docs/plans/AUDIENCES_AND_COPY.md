# Audiences, doors and copy rules

Decided 2026-10-07. Replaces the old rule that `/` was one page serving everyone.

## Three audiences, three doors

| Audience | Wants | Door | Sign-up path |
|---|---|---|---|
| Student | Find a class, book it, no app | `/` once Discover is live (`VITE_HOME_MODE=discover`), always `/discover`, `/s/:slug` | Last step of booking, or `/auth/register` |
| Studio owner (hosted) | Run the studio without servers, get found | `/for-studios` (also `/` until Discover has 5 studios) | `/auth/register?intent=studio&next=/manage/onboarding` |
| Developer / self-hoster | Read, run, change the code | `/open-source` | None. GitHub and DEPLOYMENT.md |

Rules:
- A page serves one audience. Cross-links are one line, not a second pitch.
- `/open-source` never sells the hosted product. `/for-studios` never explains the stack.
- Hosted pages state no price until decision D1 is made. Pilot wording: "Pricing is agreed with you before you take a single payment."
- Stripe: hosted owners "set up payouts" (Stripe is named once, as the payments partner). "Bring your own Stripe account/keys" is self-host language and lives only on `/open-source` and in DEPLOYMENT.md. The manage app serves both, so it uses the neutral "payments / payouts" wording.
- Footers and shared chrome never lead with "open source"; that is the self-hoster door's job.
- No claim ships unless the code does it today. "Demo", "mock data" and "in active development" language lives only on `/demo` and in docs.

## Flows

| Flow | Path |
|---|---|
| Owner | `/for-studios` → Start your studio → register (owner copy, terms only, no student waiver) → confirm email → sign in (owner copy) → `/manage/onboarding` |
| Student | `/discover` → class → studio page → book → sign up at last step (`?next=` returns to the class) → Find a class / add details |
| Self-hoster | `/open-source` → GitHub → DEPLOYMENT.md |

Code: `src/lib/audience.ts` (intent), `src/components/layout/MarketingShell.tsx` (shared nav), `src/pages/ForStudios.tsx`, `src/pages/OpenSource.tsx`.

## Still to do (copy and flows)

| ID | Item |
|---|---|
| C-1 | DONE 2026-10-08: /demo and DemoPanel now pitch hosted setup to owners; one link to /open-source. Was: `/demo` page and `DemoPanel` still pitch open source, AGPL, self-host and "Run your own" to everyone. Retarget to owners evaluating the hosted product; link `/open-source` once |
| C-2 | DONE 2026-10-08 (robots + sitemap): mock-data routes disallowed and out of the sitemap; /discover, /for-studios, /open-source, /demo added. Real data still to come (W6-3). Was: `/schedule`, `/events`, `/instructors` still show mock data and student-facing copy. Gate or noindex (W6-3) |
| C-3 | DONE 2026-10-08: owner-signup auth strings and the two new nav labels translated in every locale except Balinese (ban falls back to English). Missing `_one` plurals in ja/ko/zh/th/vi/id/ms are correct (those languages use only `other`). Was: Translate new `auth.json` keys (other locales fall back to English) |
| C-4 | DONE 2026-10-08: /auth/callback shows an expired-link state with resend. Was: Post-confirmation landing: email link returns to `/` with an error fragment if expired. Add a friendly `/auth/callback` expired state and resend |
| C-5 | Onboarding wizard copy pass for owners (hosted vs self-host assumptions) |
| C-6 | DONE 2026-10-08: blog CTA and calculator footer point owners to /for-studios. Was: Blog and tools footers say "open source" first; point to `/for-studios` for owners |
| C-7 | DONE 2026-10-08: notification settings show the fake provider forms only in demo mode. Was: Hosted-only config: hide self-host/demo notices when `VITE_DEMO_MODE` is off |
| C-8 | Full string audit of `src/pages/manage/*`, emails and `public/locales/*` for hosted vs self-host assumptions (Stripe, SMTP, "your server") |
| C-9 | Auth: `/auth/reset` and `/auth/reset-confirm` added 2026-10-07; confirm Supabase redirect allow-list includes `/auth/reset-confirm` on prod and previews |
| C-10 | DONE 2026-10-08: branded templates live, Resend SMTP on purafieldstudio.com. Was: Auth emails: branded templates in `supabase/templates/`, pushed with `scripts/set-auth-emails.sh`. Still needs Resend SMTP (built-in mail is 2/hour and unbranded sender) and an expired-link resend on `/auth/reset-confirm` is in; consider token-hash links if mail scanners burn single-use links |
