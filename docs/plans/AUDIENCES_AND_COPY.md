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
| C-1 | `/demo` page copy still pitches open source to everyone. Retarget: owners evaluating the product |
| C-2 | `/schedule`, `/events`, `/instructors` still show mock data and student-facing copy. Gate or noindex (W6-3) |
| C-3 | Translate new `auth.json` keys (other locales fall back to English) |
| C-4 | Post-confirmation landing: email link returns to `/` with an error fragment if expired. Add a friendly `/auth/callback` expired state and resend |
| C-5 | Onboarding wizard copy pass for owners (hosted vs self-host assumptions) |
| C-6 | Blog and tools footers say "open source" first; point to `/for-studios` for owners |
| C-7 | Hosted-only config: hide self-host/demo notices when `VITE_DEMO_MODE` is off |
