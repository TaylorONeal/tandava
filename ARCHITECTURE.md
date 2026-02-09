# Architecture

Technical decisions, trade-offs, and guidance for developers evaluating or working on Tandava.

This document is for lead engineers and technical founders deciding whether to fork this project. It explains what is intentional, what is replaceable, and what to leave alone.

---

## High-Level Layout

```
┌─────────────────────────────────────────────────────┐
│                    Browser (SPA)                      │
│                                                       │
│  React 18 + TypeScript + Vite                         │
│  shadcn/ui + Tailwind CSS                             │
│  React Router v6 + React Query (TanStack)             │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Auth Context  │  │ Demo Context │  │ Theme       │ │
│  │ (Supabase or  │  │ (mock data   │  │ Context     │ │
│  │  demo mock)   │  │  when active)│  │             │ │
│  └──────┬───────┘  └──────┬───────┘  └─────────────┘ │
│         │                 │                            │
│  ┌──────┴─────────────────┴──────────────────────────┐│
│  │              Backend Abstraction Layer              ││
│  │         src/lib/backend/ (provider interface)       ││
│  └──────────────────────┬────────────────────────────┘│
└─────────────────────────┼─────────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            │        Supabase            │
            │                            │
            │  PostgreSQL (data + RLS)   │
            │  Auth (JWT + sessions)     │
            │  Edge Functions (webhooks) │
            │  Storage (file uploads)    │
            │                            │
            └─────────────┬─────────────┘
                          │
                   ┌──────┴──────┐
                   │   Stripe    │
                   │  Connect    │
                   │ (Standard)  │
                   └─────────────┘
```

### What this means

- **No server runtime.** The frontend is a static SPA. All backend logic runs in Supabase (database + Edge Functions). You do not need a Node.js server, an Express app, or a container runtime in production.
- **Provider-agnostic backend.** Application code imports from `src/lib/backend/`, never from Supabase directly. The default implementation uses Supabase, but the interface is swappable.
- **Demo mode is a separate data path.** When `VITE_DEMO_MODE=true`, the app loads mock data from `src/data/demo/` and bypasses all backend calls. Demo and production code never mix at runtime.

---

## Intentional Coupling

These things are tightly coupled **on purpose**. Changing them requires understanding why they exist.

### Supabase as the default backend

PostgreSQL + Row Level Security + Edge Functions + Auth in one service. This is not an accident — it eliminates the need for a custom API server, reduces deployment complexity, and provides multi-tenant isolation at the database level.

**If you want to replace Supabase:** Implement the `Backend` interface in `src/lib/backend/types.ts`. You'll need to provide auth, data queries, file storage, and serverless function equivalents. This is doable but non-trivial.

### Row Level Security for tenant isolation

Every table has `studio_id`. RLS policies ensure users can only access data belonging to their studio. This is the security boundary — not application-level checks, not middleware.

**Do not bypass RLS** by using the service role key in client code. If you need cross-studio access, build it as an Edge Function with explicit authorization.

### Stripe Connect (Standard)

Each studio connects their own Stripe account via OAuth. The platform never holds money. Stripe routes payments directly to the studio's bank account.

**This is intentional.** Standard (not Custom or Express) gives studios full control of their Stripe dashboard, disputes, and payouts. The platform's only role is creating checkout sessions and handling webhooks.

---

## Intentionally Replaceable

These components are designed to be swapped without affecting the rest of the system.

### Email provider

`supabase/functions/email/provider.ts` implements a provider interface. Change one environment variable (`EMAIL_PROVIDER`) to switch between Resend, SendGrid, SMTP, or console logging. No code changes needed.

### Hosting

The built frontend is static HTML/JS/CSS. Deploy anywhere: Vercel, Netlify, Cloudflare Pages, nginx, Apache, S3 + CloudFront. The choice of host has zero impact on application behavior.

### UI components

All UI is built with shadcn/ui (Radix primitives + Tailwind). Components live in `src/components/ui/` and are individually customizable. You can restyle the entire app by modifying Tailwind config and component files without touching business logic.

### Theme

The "Mystical Night" dark theme is defined in CSS variables and Tailwind config. Replace it entirely by changing `tailwind.config.ts` and `src/index.css`. No component code changes required.

---

## What Studios Should Customize

When you fork Tandava for your studio, these are the things you will change:

| Area | Files | What to change |
|------|-------|---------------|
| **Studio branding** | `tailwind.config.ts`, `src/index.css` | Colors, fonts, logo |
| **Studio info** | Supabase data (or hardcoded in demo) | Name, locations, contact info |
| **Pricing** | Supabase data | Membership tiers, class pack prices |
| **Class types** | Supabase data | Offering names, descriptions, durations |
| **Email templates** | `supabase/functions/email/` | Wording, branding, layout |
| **Feature toggles** | Studio settings (or constants in code) | Tips, reviews, etc. |
| **SEO metadata** | Components using `SEOHead` | Page titles, descriptions, structured data |

### What you should NOT customize (unless you know what you're doing)

| Area | Why |
|------|-----|
| RLS policies | Security boundary. Mistakes leak data between studios. |
| Auth flow | Supabase Auth handles sessions, JWTs, and refresh. Custom auth is risky. |
| Database schema | Changing the schema diverges your fork from upstream. Prefer extending over modifying. |
| Backend abstraction layer | The interface is stable. Changing it breaks the Supabase provider. |

---

## Domain Model

The domain model is the conceptual foundation of the system. It represents how studios actually operate, not how any software vendor models it.

Key separations:
- **Booking ≠ Transaction** — A booking is an operational fact (intent to attend). A transaction is a financial settlement. They happen independently.
- **Entitlement ≠ Payment** — An entitlement is permission to attend (membership, class pack). A payment is how the entitlement was acquired.
- **Session exists independently** — A scheduled class instance exists whether anyone books it, pays for it, or shows up.

See [docs/architecture/DOMAIN_MODEL.md](docs/architecture/DOMAIN_MODEL.md) for the full conceptual model and [docs/developer/01-domain-model.md](docs/developer/01-domain-model.md) for entity relationship diagrams.

---

## Role System

Three-tier admin model with distinct route prefixes:

| Tier | Route Prefix | Who | What they can do |
|------|-------------|-----|-----------------|
| Platform Admin | `/admin/*` | Instance operator | Manage studios, users, instance config |
| Studio Owner | `/manage/*` | Studio owner/manager | Manage their studio's everything |
| Front Desk | `/staff/*` | Day-of staff | Check-in, waitlist, basic member lookup |
| Teacher | `/teach/*` | Instructor | Own schedule, earnings, availability, student check-in |
| Member | `/home`, `/schedule`, etc. | Student | Book, attend, review |

Permissions are defined in `src/types/roles.ts` and enforced via the `<ProtectedRoute>` component. In demo mode, `ProtectedRoute` is bypassed to allow exploring all roles.

---

## Where Future Extensibility Is Deferred

These areas are acknowledged but intentionally not built yet:

| Area | Status | Why deferred |
|------|--------|-------------|
| **Mobile apps** | Not started | Web-first. Native apps add significant build/deploy/review complexity. |
| **Multi-tenant SaaS mode** | Scaffolded, not primary | The primary use case is single-studio deployment. Platform mode is secondary. |
| **Plugin system** | Not planned | Premature abstraction. Studios should fork and modify directly. |
| **API versioning** | Not needed yet | No external API consumers. Internal queries go through Supabase client. |
| **Automated testing** | Minimal | Frontend is demo-mode-heavy. Integration tests need a real Supabase instance. |
| **i18n** | Not started | English only. Internationalization adds significant overhead to every component. |
| **Offline support** | Not planned | Studios have internet. Service workers add complexity without clear value. |

If you need any of these, you are taking on the engineering cost yourself. That is by design — we'd rather ship nothing than ship something half-baked.

---

## Detailed Documentation

| Document | What it covers |
|----------|---------------|
| [docs/developer/01-domain-model.md](docs/developer/01-domain-model.md) | Entity relationships with Mermaid diagrams |
| [docs/developer/02-architecture.md](docs/developer/02-architecture.md) | System layers and data flow sequences |
| [docs/developer/03-key-flows.md](docs/developer/03-key-flows.md) | Sequence diagrams for booking, check-in, payment |
| [docs/developer/04-integrations.md](docs/developer/04-integrations.md) | Stripe, email, and external service integration |
| [docs/developer/setup.md](docs/developer/setup.md) | Developer environment setup |
| [docs/architecture/DOMAIN_MODEL.md](docs/architecture/DOMAIN_MODEL.md) | Conceptual foundations and business language |
| [docs/architecture/ROLE_ACCESS_CONTROL.md](docs/architecture/ROLE_ACCESS_CONTROL.md) | Permission model and enforcement |
| [docs/architecture/AUDIT_COMPLIANCE.md](docs/architecture/AUDIT_COMPLIANCE.md) | Audit logging and compliance |
