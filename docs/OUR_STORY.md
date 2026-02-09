# Our Story: Building Tandava

*How an open-source studio management platform went from a blank canvas to 55,000 lines of working software in 68 days — and why we think it matters.*

---

## The Starting Point

Tandava started with a frustration that anyone who's run a yoga studio knows well: the tools available to small movement businesses are either expensive, locked-down, or both. Studios pour their schedules, member lists, financial records, and operational knowledge into platforms they don't own and can't leave without pain. The data these studios generate — their class histories, their member relationships, their revenue patterns — belongs to them. But try exporting it in a format that actually works, and you'll understand the problem.

We wanted to build something different. Not a competitor to MindBody or Momence, but an alternative philosophy: a platform where studios own their infrastructure the same way they own their keys. One you can deploy yourself, inspect completely, and leave whenever you want — taking everything with you.

The name comes from Shiva's cosmic dance — *tandava* — the rhythm of creation and dissolution. It felt right for a project about building systems that move with you rather than locking you in.

---

## Day One: A Template and a Domain Model

The first commit landed on December 3, 2025. It was a Vite + React + TypeScript scaffold with shadcn/ui components — a solid starting point, but nothing more than buttons and blank pages.

Before writing any features, we wrote a domain model. This turned out to be one of the most important decisions of the entire build. Instead of looking at what MindBody's interface does and copying screens, we asked: *what actually happens in a studio?*

The answer shaped everything:

- A **Studio** owns locations, staff, and class offerings
- An **Offering** is a template — "Vinyasa Flow" or "Yin Restore" — that exists independently of any particular time slot
- A **Session** is a scheduled instance — Tuesday at 9am, this specific room, this instructor
- A **Booking** is an operational fact: a person intends to show up
- A **Check-in** confirms they actually did
- An **Entitlement** is permission to attend — a membership, a class pack, a drop-in pass
- A **Transaction** is a financial settlement

The critical insight was in the separations. A booking is not a transaction. Operations and finance are different concerns. A session exists whether or not anyone has paid for it — because in the real world, the class happens regardless. An entitlement grants permission to attend, but permission is not the same as purchase. These distinctions sound academic until you try to build reporting, handle refunds, or let a studio offer a free community class without breaking your data model.

We documented this as a formal domain model with entity relationship diagrams before writing the first component. It saved us from dozens of architectural dead ends later.

---

## The Design System: Finding Our Voice

The initial visual design went through a false start. The first attempt was a bright, Gen-Z-inspired aesthetic — bold colors, rounded everything, playful energy. It looked fine in isolation, but it didn't feel like a studio. Yoga studios are spaces of intention. The software should feel the same way.

Within the first week, we rebuilt the entire visual language into what we called "Mystical Night" — a dark foundation (#0f0a14) with carefully chosen accent colors: teal for primary actions, coral for urgency, gold for achievements, sage for growth. The typography stack uses Cormorant Garamond for display headings (elegant, serif, breathes), DM Sans for body text (clean, readable, modern), and Cinzel for Sanskrit terms and spiritual references.

Glass effects, gradient borders, and subtle glow animations give the interface depth without distraction. Every component was built to feel calm and intentional — the way a well-designed studio space feels when you walk in.

This wasn't just aesthetics. The design system became a decision-making framework. When we weren't sure how a feature should look, we'd ask: *does this feel like walking into a studio, or walking into an enterprise dashboard?* The answer always pointed us in the right direction.

---

## Architecture: Deploy Your Own

Early on, we made a fundamental architectural choice: Tandava would not be a centrally hosted SaaS product. It would be a self-contained system that any studio (or developer, or cooperative) could deploy on their own infrastructure.

This meant:

- **Supabase** for the backend — PostgreSQL with Row-Level Security, authentication, storage, and edge functions. Critically, Supabase is self-hostable, so studios aren't dependent on any single cloud provider.
- **Stripe Connect (Standard)** for payments — money flows directly to the studio's own Stripe account, not through us.
- **Provider-agnostic email** — an abstraction layer that works with Resend, SendGrid, raw SMTP, or even console output for development. No vendor lock-in at any layer.
- **Demo mode** — when Supabase isn't configured, the entire platform runs on local mock data. No backend needed. This isn't just for development convenience; it means anyone can evaluate the complete platform without creating accounts or configuring infrastructure.

The demo mode decision turned out to be transformative. It meant every feature we built had to work in two modes: real (Supabase-backed) and demo (local state). This forced clean separation of concerns throughout the codebase. Data fetching, state management, and UI rendering are properly decoupled because they *had* to be.

---

## Building in Roles: Three Perspectives at Once

Studio software isn't one product — it's at least four, depending on who's using it. We built Tandava around four distinct user roles, each with their own interface tier:

**The Studio Owner** sees everything through `/manage/*` — the dashboard with revenue analytics, the schedule builder, member management, financial reports, staff oversight, marketing campaigns, and system settings. This is where business decisions happen.

**The Instructor** works through `/teach/*` — their personal dashboard showing upcoming classes, student counts, earnings breakdowns, availability management, and profile settings. Instructors need to feel autonomous without being overwhelmed by business operations they don't manage.

**The Front Desk Staff** operates from `/staff/*` — a streamlined check-in interface, waitlist management, and the operational tools needed to keep the physical studio running smoothly. Speed matters here. Every interaction should be one or two taps.

**The Student/Member** experiences the public-facing app — browsing the schedule, booking classes, managing their memberships, tracking their practice, and engaging with the studio community.

Each role has its own navigation, its own dashboard, and its own set of permissions. The permission system (defined in `src/types/roles.ts`) is enforced at the route level through `<ProtectedRoute>` components. A front desk worker can't access financials. An instructor can't modify the schedule. A member can't see other members' data. This isn't just UI hiding — it's structural.

Building all four perspectives simultaneously was one of the hardest parts of the project. Every feature had to be considered from multiple angles: the owner configures a waitlist policy, the front desk staff promotes members from it, the instructor sees updated class rosters, and the member gets notified. One feature, four interfaces, one consistent data model underneath.

---

## The Feature Build: Sixty-Eight Days of Momentum

With the domain model, design system, and architecture in place, features came fast. Here's roughly how it unfolded:

### Phase 1: Core Platform (Week 1-2)
The scheduling system, booking flow, basic member management, and studio profiles. These are the load-bearing walls — nothing else works without them. We built the schedule as an offering-to-session hierarchy: studios define class types once, then create recurring or one-off sessions from those templates. Bookings attach to sessions, not to offerings, which means schedule changes don't break booking history.

### Phase 2: Operations (Week 2-4)
Staff portal with role-based access. Check-in system with QR code support. Waitlist management with configurable auto-promotion rules. Notifications (SMS, email, push) with two-way communication. These are the features that replace clipboards and sticky notes — the daily operational reality of running a physical space.

### Phase 3: Revenue & Growth (Week 4-6)
Stripe Connect integration for direct payments. Membership management with various plan types. Class packs and drop-in pricing. Tips and commission tracking. Retail product sales and basic inventory. Payment plans for higher-ticket items. The financial layer was built on the principle that operations come first — a class happens whether or not the payment cleared.

### Phase 4: Intelligence & Marketing (Week 6-8)
Analytics dashboards with revenue trends, attendance patterns, and instructor performance. Custom report builder. Campaign and advertising hub with template management. Lifecycle automation triggers. Engagement nudges designed to feel helpful rather than manipulative — following Reforge principles of right message, right time, right place.

### Phase 5: Data Ecosystem (Week 8-9)
This was close to our hearts. The data import wizard supports six source platforms — MindBody, Momence, Walla, Arketa, WellnessLiving, and generic CSV. It auto-detects the source format, maps columns intelligently, previews the import, and processes records in bulk. Twenty-one business connectors span migration tools, marketplace sync (ClassPass, Gympass), calendar integration, CRM connections, accounting exports (QuickBooks, Xero), automation webhooks, and analytics pipelines.

The accounting export system generates proper QuickBooks IIF files, Xero-compatible CSVs, and standard CSV formats — with date range filtering and browser-side download. No data leaves the studio's infrastructure unless they explicitly export it.

### Phase 6: Polish & Documentation (Week 9-10)
On-demand video library UI for virtual and hybrid classes. Mobile-optimized layouts across all four role interfaces. SEO landing pages. A guided tour system that walks new users through the platform based on their role. The demo landing page with Oxatl Yoga — our fictional Austin studio that makes the platform tangible.

---

## Oxatl Yoga: Making It Real

One of the most effective decisions was creating a complete fictional studio to populate the demo. Oxatl Yoga is a three-location studio in Austin, Texas, with a full year of booking and transaction data, a roster of instructors with distinct specialties, a diverse class schedule, and realistic member profiles.

The name blends "Ocelotl" (Aztec for jaguar — strength, grace) with Austin's creative spirit. It has locations in East Austin, South Congress, and a virtual studio. Instructors like Devika Sharma (Ashtanga, Sanskrit chanting), Marcus Chen (power vinyasa, athletics recovery), and Luna Reyes (yin, restorative, sound healing) each have distinct teaching styles and followings.

This wasn't just demo data. It was a design tool. Every feature we built, we tested against Oxatl's reality: *Would Marcus's Tuesday morning power flow students actually see this notification? Would the front desk at South Congress use this check-in flow during their 6pm rush? Would the owner look at this revenue chart and understand their business better?*

Having a concrete studio to reference kept us grounded in real use cases rather than abstract feature lists.

---

## The Documentation Commitment

For an open-source project, documentation isn't optional — it's infrastructure. We wrote extensively:

- **20+ Product Requirement Documents** covering every major feature area, from staff portals to accounting exports
- **A formal domain model** with entity relationship diagrams and conceptual foundations
- **Visual developer documentation** with Mermaid sequence diagrams showing key operational flows
- **A design system guide** documenting colors, typography, spacing, and component patterns
- **Studio manager guides** written for non-technical users
- **A data interoperability statement** establishing the project's legal and philosophical posture on data ownership
- **A contributor guide** explaining not just how to contribute, but *what kind of project this is* — production-grade, conservative in core abstractions, incremental rather than disruptive

The DATA_INTEROPERABILITY.md document deserves special mention. It explicitly states that business records generated by a studio's operations are owned and controlled by the studio. It establishes that our data structures are functional, vendor-agnostic, and transformative — not copies of any proprietary system. This isn't just philosophy; it's a legal foundation for the entire project's approach to data portability.

---

## Challenges and What We Learned

### The Demo Mode Duality
Building every feature to work both with a live Supabase backend and with local demo state was genuinely difficult. It doubled the surface area of every data flow. But it produced better architecture — cleaner interfaces, more testable components, and a codebase that doesn't collapse when a backend service is unavailable.

### Role Complexity
Four user roles means four times the UI surface area, four times the navigation design, four times the permission boundaries. Features that seem simple — "add a waitlist" — expand into configure (owner), manage (front desk), view roster updates (instructor), and receive notifications (member). We underestimated this multiplier early on and learned to plan for it.

### Design Consistency at Scale
With 190+ source files and 60+ UI components from shadcn/ui, keeping the design language consistent required constant attention. The Mystical Night theme helped — having a strong visual identity made decisions easier. But every new page was a chance for drift, and we had to actively resist the temptation to "just try something different here."

### The Import Problem
Data migration from existing platforms is the single biggest barrier to studio software adoption. Building importers for six different source formats — each with their own column names, date formats, and data quirks — was tedious, detailed work. But it's the feature that actually makes switching possible. Without it, everything else is theoretical.

### Keeping It Open
The AGPL-3.0 license was a deliberate choice. It ensures that anyone who deploys Tandava — even as a hosted service — must share their modifications. This prevents the "open-core bait-and-switch" where a project's most valuable features get locked behind a proprietary fork. The license protects the community's investment in the codebase.

---

## What We Built: By the Numbers

- **55,000+ lines** of TypeScript and React across **193 source files**
- **89 commits** over **68 days** of active development
- **20+ PRDs** documented, **12 fully implemented**, **6 partially implemented**
- **4 user roles** with distinct interfaces and permission boundaries
- **60+ UI components** from shadcn/ui, customized to the Mystical Night design system
- **6 platform importers** (MindBody, Momence, Walla, Arketa, WellnessLiving, CSV)
- **21 business connectors** across 7 integration categories
- **3 accounting export formats** (CSV, QuickBooks IIF, Xero)
- **1 complete demo studio** (Oxatl Yoga) with a full year of realistic data

---

## What Comes Next

Tandava is a foundation, not a finished product. The architecture is designed for others to build on:

- **The backend integration layer** is abstracted — swap Supabase for another PostgreSQL host, swap Stripe for another payment processor, swap Resend for another email provider. The patterns are there.
- **The permission system** is extensible — new roles, new capabilities, new access patterns can be added without restructuring.
- **The connector framework** is ready for real API integrations — the import wizard, export pipelines, and webhook infrastructure are built. They need production endpoints.
- **The domain model** is documented well enough that contributors can understand not just *what* exists but *why* it's structured the way it is.

There are features we'd love to see the community build: real-time class capacity updates, instructor substitution workflows, automated marketing campaigns based on attendance patterns, and deeper analytics with predictive modeling. The PRDs for these features are written. The data model supports them. The architecture is ready.

---

## Why We Think It Matters

The fitness and wellness industry is a $96 billion market served primarily by closed platforms that charge monthly fees per location and make it difficult to leave. Studios — many of them small, independently owned businesses run by people who care deeply about their communities — deserve tools that respect their autonomy.

Tandava is our attempt to prove that studio management software can be open, portable, and beautiful. That a small team moving fast can build something comprehensive enough to be useful and principled enough to be trustworthy. That the data a studio generates in the course of serving its community belongs to that studio, full stop.

We built this because we'd use it ourselves. We're sharing it because we think others should be able to, too.

---

*Tandava is open source under the AGPL-3.0 license. Contributions, feedback, and forks are welcome.*

*Built with intention in Austin, Texas. 2025–2026.*
