# Launch runbook: from demo site to hosted product

Status 2026-10-06. Production (tandavastudio.com) is a demo build: its bundle points at
`https://placeholder.supabase.co`. No Tandava database exists anywhere. Every step below is
ordered by dependency. "Taylor" steps need a human (account creation, cards, secrets).
"Claude" steps run from a session once the step before it is done.

## 0. Decide the operating identity (Taylor, 2 min)

One entity owns Supabase, Vercel, Stripe, Resend and Cloudflare. Decided 2026-10-07: **Purafield Studio**,
email **purafieldstudio@gmail.com**, operator and first tenant. Reason: billing, Stripe platform verification and support mail all show
one business name, and Taylor's personal account stays a member, not the owner.

| Service | Why it must be this identity |
|---|---|
| Supabase | Free-project limit is per account holder (2), not per org. Taylor's login already uses both (ThinkerMetrics, CueCraft). A separate Supabase account signed up as purafieldstudio@gmail.com gets its own 2 free projects. Pro ($25/mo) is optional later: removes the 7-day inactivity pause and adds backups. Do NOT host Tandava inside the CueCraft or ThinkerMetrics projects (shared auth, colliding `stripe_events`, `waitlist`, `sessions`, `users`/`profiles` tables) |
| Vercel | Hobby teams are for non-commercial use. A paid booking product needs Pro ($20/mo) |
| Stripe | The Connect platform account is verified against a legal entity (EIN or SSN) and a bank account. Longest lead time |
| Resend | Supabase's built-in mail is 2 emails per hour. Sign-up confirmations need custom SMTP from a verified domain |

## 1. Accounts (Taylor, ~20 min)

1. Supabase: sign up a NEW account with purafieldstudio@gmail.com (Free, no card). Org "Purafield Studio".
   Invite `taylor.oneal@gmail.com` as Owner only if the connector needs it; otherwise re-authorize the
   Supabase connector while signed in as the Purafield account (connector is scoped to one login).
   Upgrade to Pro only when the first paying studio is live.
2. Vercel: upgrade team `tayloroneal_austin` to Pro (keeps the verified domain and deploy history).
   Rename the team later if wanted. Re-authorize the Vercel connector with env-var access
   (today it returns 403 on environment variables).
3. Stripe: create or confirm the Purafield Studio account. Enable Connect. Stay in **test mode**
   until step 5 passes.
4. Resend: sign up, add domain `tandavastudio.com`, add the DNS records it shows.
5. Cloudflare: sign up or sign in, Turnstile, add widget for `tandavastudio.com` and `*.vercel.app`.
   Copy site key and secret key.
6. Delete the empty "Purafield Studio" org created on 2026-10-04 under the personal login, or ignore it.

## 2. Database and functions (Claude, ~15 min)

- Create project `tandava-prod`, region `us-east-2` (closest to Austin), in the Purafield org.
- Apply migrations 00001 to 00027 in order. Run security and performance advisors; fix anything red.
- Deploy edge functions: `stripe-checkout`, `stripe-webhook`, `stripe-connect`, `email`.
- Report project ref, URL and anon key (both are public values).

## 3. Secrets (Taylor, ~10 min, exact commands)

Claude never types keys. Run these on your machine after `npm i -g supabase && supabase login`:

```bash
supabase link --project-ref <ref>
supabase secrets set STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_... \
  APP_URL=https://tandavastudio.com STRIPE_CONNECT_MODE=platform \
  EMAIL_PROVIDER=resend RESEND_API_KEY=re_... EMAIL_FROM=hello@tandavastudio.com EMAIL_FROM_NAME=Tandava
```

Vercel project `tandava`, Production and Preview: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_TURNSTILE_SITE_KEY`, `VITE_HOME_MODE=platform`. Supabase Auth: custom SMTP (Resend),
captcha provider Turnstile with the secret key (ONLY after a deploy with `VITE_TURNSTILE_SITE_KEY` set is live; captcha on without the widget locks everyone out), Site URL `https://tandavastudio.com`, redirect
allowlist `https://tandavastudio.com/**` and `https://*-tayloroneal-1467s-projects.vercel.app/**`.
Stripe webhook endpoint: `https://<ref>.supabase.co/functions/v1/stripe-webhook`, events listed in
`supabase/functions/stripe-webhook/index.ts`.

## 4. First tenant and verification (Claude, ~30 min)

- Seed Purafield Studio as studio one (owner = Purafield email account), one location, three
  offerings, two weeks of classes, one membership, one pack. `discoverable = true`.
- Point a Vercel preview at prod Supabase; run `npm run test:e2e` against it with Supabase mocks off.
- Stripe test mode: buy a drop-in, a pack and a membership with card 4242; confirm one transaction
  each; refund one; confirm the booking cancels. Replay the webhook; confirm no duplicate.
- Check the embed headers and robots/sitemap on the preview.

## 5. Go live

- Merge PR #64. Production deploys with the real backend.
- Stripe live mode once Stripe finishes verifying the Purafield account.
- Flip `VITE_HOME_MODE=discover` at 5 discoverable studios (D4).

## Running cost before the first paying studio

| Item | Monthly |
|---|---|
| Supabase Free (separate Purafield account; Pro later) | $0 |
| Vercel Pro (verify Hobby commercial-use rule first) | $0 to $20 |
| Resend, Cloudflare Turnstile | $0 |
| Stripe | per transaction only |
| Total | $0 to $20 |

One studio at $99/month covers it.
