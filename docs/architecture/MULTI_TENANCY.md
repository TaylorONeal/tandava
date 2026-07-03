# Multi-Tenancy & Host-Based Routing

How one Tandava deployment serves many studios today, and the phased plan for giving each studio its own web address (subdomain, then custom domain).

**Audience:** developers and operators. Owner-facing and public versions of this material live in [studio-manager/getting-started.md](../studio-manager/getting-started.md) ("Your studio's web address") and [FAQ.md](../FAQ.md).

---

## Where we are today

Tandava is **multi-tenant by row-level security**. Every domain table carries `studio_id`, and RLS policies isolate each studio's data at the database level (see [DOMAIN_MODEL.md](DOMAIN_MODEL.md) and [ROLE_ACCESS_CONTROL.md](ROLE_ACCESS_CONTROL.md)). One deployment — one frontend, one Supabase project — serves every studio.

**A studio is resolved from the logged-in user, not from the URL.** When an owner or staff member hits `/manage/*`, the app and edge functions look up which studio they belong to via `studio_staff` (and the effective-role RPC, `get_my_effective_role()`). There is **no host-based or path-based tenant resolution**: every studio is reached through the same shared origin, distinguished only by who is signed in.

This is why the shared-domain hosted model (`tandavastudio.com`) works with zero per-studio infrastructure — see [OPERATOR_SETUP.md](../OPERATOR_SETUP.md). It's also the ceiling we're raising here: today a studio has no public web address of its own.

### What already supports addressing a studio

The data layer is further along than the routing:

- `studios.slug` — unique per studio, already the public identifier.
- `studios.discoverable` — boolean; whether the studio is listed publicly.
- `get_public_schedule(slug)` RPC + the embed widget (`/embed/schedule/:slug`, `public/embed.js`) already fetch a single studio's public data **by slug** with no login. This proves slug-based public reads end-to-end.

What's missing is (a) resolving a **hostname** to a studio, and (b) a real per-studio **storefront** page to render once resolved.

---

## The prerequisite: a real studio storefront

Before any host-based routing is useful, the public root of a studio needs to show **that studio's** content.

Today `src/pages/Index.tsx` (the `/` route) is hardcoded to the **Oxatl demo studio** — it imports `@/data/demo` directly regardless of `VITE_DEMO_MODE`. On the shared hosted instance, that means the root currently renders fictional Oxatl content to everyone. That's a bug for the shared-domain launch and a hard blocker for host-based routing (a subdomain that shows someone else's demo data is worse than no subdomain).

**Work:** a slug-driven storefront that reads a studio (by slug/host) and renders its real schedule, offerings, teachers, and pricing via the existing public RPCs — the same data the embed widget already pulls. This is the largest single piece of the effort and is worth doing on its own merits, independent of subdomains.

---

## Tier 1 — Subdomains (`oxatl.tandavastudio.com`)

The recommended first step after the shared-domain launch. Low ongoing ops, no per-studio manual work.

**Resolution (code):**
- A `StudioHostProvider` reads `window.location.hostname`, extracts the left-most label (the subdomain), and resolves it to a studio by `slug`.
- The apex host (`tandavastudio.com`, `www`) and any reserved labels (`app`, `admin`, `api`, `docs`, …) resolve to the platform/marketing surface, not a studio.
- Resolved studio id/slug flows into a context the storefront and member views consume.

**Infrastructure (one-time):**
- Add a **wildcard domain** `*.tandavastudio.com` to the Vercel project.
- Wildcard DNS + wildcard TLS. Vercel issues the wildcard certificate when the domain's nameservers are delegated to Vercel.
- After that, every new studio's subdomain works automatically — **zero per-studio provisioning**.

**Effort:** moderate, mostly frontend. The storefront prerequisite is the bulk of it; the resolver itself is small.

---

## Tier 2 — Custom domains (`booking.oxatlyoga.com`)

A premium convenience. Defer until a studio actually asks — it carries real per-studio ops.

**Data model:** a `studio_domains` table mapping `hostname → studio_id` (with a verification status and timestamps). The host resolver checks this table before falling back to subdomain parsing.

**Provisioning flow:**
1. Owner enters their domain in settings.
2. We show the DNS record to add (a `CNAME` to the Vercel target).
3. We add the domain to the Vercel project **programmatically via the Vercel Domains API**, then poll for verification + TLS issuance.
4. UI reflects pending / verified / error states.

**Effort:** significant, and ongoing (each studio's domain is its own verification + SSL lifecycle). This is the classic SaaS custom-domain problem — well-trodden but not free.

---

## Auth & session considerations

Browser sessions are **per-origin**. Consequences:

- **Subdomains** can share auth cookies across `*.tandavastudio.com` with domain-scoped cookies, but Supabase's default session lives in `localStorage`, which is **not** shared across origins. A member signed in on the apex is not automatically signed in on `oxatl.tandavastudio.com`.
- **Custom domains** are fully separate origins — no session sharing at all.

For a booking app this is acceptable, arguably preferable: members sign in **per studio**, which matches the mental model (a member of Studio A shouldn't carry a session into Studio B). Owners manage each studio from wherever they sign in; studio resolution for `/manage` stays login-based regardless of host. We should **not** try to synchronize sessions across hosts — treat each studio host as its own sign-in surface.

---

## Open decision: public-by-default vs. `discoverable`-gated

When a visitor hits a studio host, should an unlisted studio be reachable?

**Recommendation: gate on `studios.discoverable`.** A subdomain/custom-domain storefront renders only when the studio is `discoverable = true`; otherwise it shows a neutral "not available" page (the studio can still operate privately and share direct booking links). This respects the flag studios already control, avoids surfacing studios that haven't chosen to be public, and matches how `get_public_schedule` / the public-studios policy already behave. Make it a single choke point in the host resolver so the policy is one line to change.

---

## Recommended phasing

1. **Now — shared domain.** `tandavastudio.com`, login-based studio resolution. Live via [OPERATOR_SETUP.md](../OPERATOR_SETUP.md). No per-studio infra.
2. **Next — storefront + subdomains (Tier 1).** Build the slug-driven storefront (also fixes the demo-data-at-root bug), add the host resolver, and configure the wildcard domain. Every studio gets `slug.tandavastudio.com` automatically.
3. **On demand — custom domains (Tier 2).** Add the `studio_domains` table, the Vercel Domains API provisioning flow, and the owner-facing verification UI when studios ask for vanity domains.

Each phase is independently shippable and each earlier phase de-risks the next.

---

## Schema sketch (Tier 2)

```sql
-- Custom domains mapped to studios (Tier 2 only; subdomains need no table).
CREATE TABLE studio_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  hostname TEXT NOT NULL UNIQUE,            -- e.g. 'booking.oxatlyoga.com'
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | verified | error
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_studio_domains_studio ON studio_domains(studio_id);
-- Public read of verified hostname → studio mapping powers host resolution;
-- writes restricted to the studio's owner via RLS.
```

Subdomains (Tier 1) need no table — the subdomain label maps directly to `studios.slug`.
