# Tandava in the app stores: two apps, one backend

Status: **decided Oct 8, 2026; nothing built yet.** Bundle ids are registered with Apple. No native project exists in this repo. Cross-app launch tracking lives in the private `app-launch-playbook` repo (`prds/P3-TANDAVA-STORES.md`, `DECISIONS.md`).

This file replaces the per-studio white-label guide (archived as `ARCHIVED-white-label-guide.md`).

## The two apps

| | **Tandava** (members) | **Tandava Studio** (owners and staff) |
|---|---|---|
| Bundle id / package | `com.tandava.app` | `com.tandava.studio` |
| Apple bundle id registered | Yes, Oct 8 2026 (`WJF8DWPMZW`) | Yes, Oct 8 2026 (`Q29237U4L4`) |
| Play package | Claimed at first AAB upload | Claimed at first AAB upload |
| Who | Students booking classes | Owners, front desk, teachers |
| Core | Find your studio, schedule, book, pay drop-ins, passes, check-in QR, cancel | Schedule, roster, check-in, payments setup, reports |
| Price | Free | Free download; studio pays hosting off-store |
| In-app purchase | None. Classes, packs and memberships are real-world services (App Store 3.1.3(e)); Stripe stays | None. B2B SaaS billed on the web |

Why the plain `com.tandava.app` goes to the member app: it is the listing people search for. The qualifier goes on the smaller-audience tool.

Why not white-label: one listing, review cycle and screenshot set per studio forever, plus Apple's 4.3 duplicate-app rule. A studio gets its own page, logo and colors inside the member app instead (below).

## "Feels like the studio's own app" without being one

The member app opens straight into a studio when the person came from that studio's link. Same effect as a branded app for the member, one listing for us.

### 1. Links that open the app (installed)

The storefront URL is the deep link. No new URL shape:

| Link a studio shares | Opens in the app | Without the app |
|---|---|---|
| `https://<host>/s/<slug>` | That studio's page, studio colors and logo | Web storefront (works today) |
| `https://<host>/s/<slug>/book/<occurrenceId>` | That class, ready to book | Express Booking on the web (PRD-020) |
| `https://<slug>.<root-domain>/` (when subdomains are on) | That studio's page | Web storefront |

Needs: `public/.well-known/apple-app-site-association` (paths `/s/*`) and `public/.well-known/assetlinks.json`, served as JSON with no redirect, plus the Associated Domains entitlement and Android intent filters in the native shells. Universal links only open the app from a tap in another app (Instagram, Messages, email), not from typing the URL, which is fine for how studios share.

Note: `docs/architecture/MOBILE_ARCHITECTURE.md` proposes `https://[studio].tandava.app/class/{id}`. Use the real routes above instead; one URL shape for web and app.

### 2. Links before install (the harder half)

Neither store passes a URL through a fresh install by default. Plan, cheapest first:

1. **Web first, app second.** The link always works on the web (storefront, Express Booking), so nobody is blocked by not having the app. The page offers the app after a booking, not before it.
2. **Smart App Banner** on `/s/*` pages: `<meta name="apple-itunes-app" content="app-id=…, app-argument=<current URL>">`. Opens the app at that studio when installed.
3. **Android:** Play Install Referrer carries `referrer=studio%3D<slug>` from the Play link through install. The app reads it on first launch and opens that studio. Free, first-party.
4. **iOS first launch:** "Find your studio" with search, plus a short studio code or the studio's QR (front desk poster). No fingerprinting, no paid deferred-link SDK.
5. A member who belongs to several studios gets a studio switcher (data model already allows it; UI does not exist).

### 3. Per-studio look inside one app

Studio page and booking screens take `studios.primary_color` and logo (already on the storefront). App icon and store listing stay Tandava. That keeps us clear of 4.3 while the member mostly sees their studio.

## Guest booking and account conversion

Express Booking (PRD-020) lets someone book a drop-in or free class with name and email, no password. The account step comes after the booking:

- In the form: optional "Save my details for next time" checkbox.
- After booking (and after returning from Stripe): a "Save your details" card. It emails a link to set a password on the same address. The link proves the person controls the mailbox before a password is attached to the identity the public form created.
- `/auth/reset-confirm?claim=1` sets the password and marks the profile claimed (`is_guest = false`, `claimed_at`).
- "Sign in and book now" returns to the same class after sign-in (`?next=`), including Google sign-in.

In the member app the same flow applies: guest booking for a first class, then the account nudge. Sign in with Apple becomes mandatory once Google sign-in ships in the iOS app (guideline 4.8).

## Gates before store work starts

1. Pilot studio live on the web (hosted product review gates: migrations verified, tenancy test, webhook idempotency, Express Booking launch gates in PRD-020).
2. Native shell choice. Recommendation: Capacitor, same as Purafield's shipped apps, with native schedule, booking, push, offline cache and check-in QR so the member app clears 4.2 (minimum functionality). `docs/architecture/APP_STORE_COMPLIANCE.md` has the checklist.
3. Seeded review studio in a real database plus two review accounts (member, owner). Demo mode personas cannot sign in, so they don't count.
4. Sign in with Apple wired (buttons exist, disabled).
5. AASA and assetlinks files, Associated Domains, Android intent filters.
6. Store listings, privacy labels, screenshots per app.

## Not decided here

- Production host for links (`tandavastudio.com` vs another domain). The app links have to match whatever the pilot ships on.
- Whether the owner app ships before or after the member app. Default: member app first (studios can run from the web; members expect an app).
