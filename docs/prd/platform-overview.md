# Tandava Platform — Product Requirements Document

## Overview

Tandava is an open-source yoga studio booking and management platform. It is designed as a **self-contained, deploy-your-own-instance** application — a studio operator clones the repo, configures their environment, and deploys to any static hosting provider.

## Architecture

### Frontend
- **React 18** with TypeScript, built with **Vite**
- **Tailwind CSS** with custom "Mystical Night" design system
- **shadcn/ui** (60+ Radix UI components)
- **React Router v6** for client-side routing
- **React Query** (TanStack Query) for server state
- **react-helmet-async** for per-page SEO meta tags

### Backend
- **Supabase** (PostgreSQL + Auth + Edge Functions + RLS)
- No custom backend server — all logic runs in Supabase or the client

### Payments
- **Stripe Connect (Standard)** — each studio links their own Stripe account
- Checkout, subscriptions, class packs, and customer portal

### Email
- Provider-agnostic interface supporting Resend, SendGrid, SMTP, or console
- Templates in TypeScript — no external template engine

### Error Monitoring
- **Sentry** (optional) — initialized only when DSN is configured

## User Roles

### Three-Tier Admin Model

| Tier | Who | Routes | Purpose |
|------|-----|--------|---------|
| **Platform Admin** | Developer/operator who deployed the instance | `/admin/*` | Instance health, studio management, user management, billing config |
| **Studio Owner/Manager** | Runs the yoga studio | `/manage/*` | Schedule, members, instructors, billing, inbox, settings |
| **Staff (Front Desk)** | Day-of operations | `/staff/*` | Class check-in, waitlist management |

### Member Roles
- **Member** — books classes, tracks practice, views on-demand content
- **Instructor** — teaches classes, views own class analytics

## Database Schema

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

### Core Tables
- `profiles` — extends Supabase auth.users with role, preferences
- `studios` — studio directory with Stripe Connect info
- `studio_members` — maps users to studios with per-studio roles
- `classes` — the class schedule
- `bookings` — reservations with payment tracking
- `memberships` — subscriptions and class packs
- `messages` — unified messaging (inquiries, feedback, support)
- `email_log` — audit trail for sent emails
- `platform_announcements` — admin-to-studio-owner communications

### Row-Level Security

Every table has RLS enabled and forced. Key principles:
- Members read their own data; studio staff read their studio's data
- Platform admins have full access
- Anonymous users can only insert studio inquiries (with honeypot validation)
- Messages are append-only — no user can edit or delete sent messages

## Feature Matrix

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication (email + Google OAuth) | Foundation | Supabase Auth via AuthContext |
| Class booking flow | UI complete | Needs Supabase data integration |
| Studio directory | UI complete | Needs Supabase data integration |
| Instructor profiles | UI complete | Needs Supabase data integration |
| On-demand video library | UI complete | Needs storage/streaming integration |
| Stripe payments (drop-in, membership, packs) | Foundation | Webhook handler + client helpers |
| Email notifications | Foundation | Provider-agnostic, 7 templates |
| SEO (per-page meta, JSON-LD, sitemap) | Foundation | react-helmet-async + structured data |
| Platform admin panel | Scaffold | 6 admin pages with layout |
| Studio management panel | Scaffold | 5 management pages with layout |
| Staff check-in | Scaffold | Check-in + waitlist pages |
| Contact/feedback system | Foundation | ContactForm + RLS + honeypot |
| Error monitoring (Sentry) | Foundation | Optional, zero-config when disabled |

## Deployment Model

1. Clone the repository
2. Copy `.env.example` to `.env` and configure
3. Set up Supabase project and run migrations
4. Configure Stripe (optional)
5. `npm run build` → deploy `dist/` to any static host
6. No Node.js server required in production
