# AI Agent Guide

How AI coding assistants (Claude, Cursor, Copilot, etc.) should work with the Tandava codebase.

## Quick Start

When starting work on Tandava, read these files first:
1. **This file** - Understand how to work here
2. `docs/ai-agents/KEY_FILES.md` - Find what you need
3. `docs/ai-agents/LESSONS_LEARNED.md` - Avoid known pitfalls
4. `docs/ai-agents/DESIGN_SYSTEM.md` - UI consistency

---

## Codebase Overview

### What is Tandava?

Tandava is an **open-source yoga studio management platform** competing with Mindbody, Momence, and Walla.

**Three User Roles:**
1. **Member (Student)** - Books classes, tracks practice, manages account
2. **Teacher (Instructor)** - Checks in students, views schedule, tracks earnings
3. **Owner (Studio Admin)** - Manages everything: schedule, staff, members, finances

**Tech Stack:**
- Frontend: React + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- Mobile: Capacitor wrapper for iOS/Android
- Hosting: Vercel (web) + Supabase (backend)

---

## Working Patterns

### Before Making Changes

1. **Read the relevant file(s)** - Understand existing code before modifying
2. **Check for related components** - Use grep/glob to find similar patterns
3. **Verify types exist** - Check `src/types/database.ts` for data models
4. **Look for existing utilities** - Don't recreate `src/lib/utils.ts` helpers

### File Editing Rules

```typescript
// ALWAYS read before writing
// ✓ Read file → Understand context → Make targeted edits

// NEVER create new files if existing ones can be extended
// ✓ Prefer: Edit existing component to add prop
// ✗ Avoid: Create new component that duplicates 90% of existing

// NEVER add comments/docs unless asked
// ✗ Avoid: Adding JSDoc to every function
// ✓ Prefer: Self-documenting code with clear names
```

### Commit Message Format

```
<type>: <brief description>

<optional body explaining why>

https://claude.ai/code/session_<session_id>
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

Example:
```
feat: Add quick-book mode for members with active memberships

Skip payment selection step when user has valid membership coverage.
Reduces booking friction from 3 taps to 1.

https://claude.ai/code/session_01A1LeH1CyCFCxREZpLXrJNt
```

---

## Common Tasks

### Adding a New Page

1. Create page in appropriate directory:
   - Member-facing: `src/pages/`
   - Studio admin: `src/pages/manage/`
   - Instructor: `src/pages/teach/`

2. Add route in `src/App.tsx`:
```typescript
import NewPage from "./pages/NewPage";
// ...
<Route path="/new-page" element={<NewPage />} />
```

3. Use appropriate layout:
   - Member: `<AppLayout>`
   - Admin: `<ManageLayout>`
   - Instructor: Inherits from teach layout

### Adding a Component

1. Determine location:
   - Reusable UI → `src/components/ui/`
   - Feature-specific → `src/components/<feature>/`

2. Follow existing patterns:
```typescript
// Check existing components for patterns
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

### Adding Database Fields

1. Create migration in `supabase/migrations/`:
```sql
-- XXX_description.sql
ALTER TABLE table_name ADD COLUMN new_column TYPE DEFAULT value;
```

2. Update types in `src/types/database.ts`:
```typescript
export interface TableName {
  // ... existing fields
  new_column: string | null;
}
```

3. Update any RLS policies if needed

### Adding API Functionality

1. Check if Supabase client method exists:
```typescript
// src/lib/supabase.ts has the client
import { supabase } from "@/lib/supabase";
```

2. For complex operations, use Edge Functions:
```typescript
// supabase/functions/function-name/index.ts
```

---

## Design System Reference

### Colors (Tailwind)

```css
/* Primary brand color - gold/yellow */
primary: #D4A72C

/* Accent colors */
accent-sage: #A8B5A2   /* Success, nature */
accent-lilac: #C4B7D1  /* Calm, virtual */
accent-coral: #E8998D  /* Warning, heated */
accent-gold: #D4A72C   /* Primary, highlight */
accent-peach: #F5D5C8  /* Soft accent */

/* Semantic */
destructive: Red for errors
warning: Amber for caution
```

### Component Patterns

```typescript
// Card with standard styling
<Card className="p-4 sm:p-6">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>

// Button variants
<Button>Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>

// Badges for status
<Badge variant="mint">Active</Badge>
<Badge variant="coral">Heated</Badge>
<Badge variant="lilac">Virtual</Badge>
```

### Responsive Patterns

```typescript
// Mobile-first approach
<div className="
  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
  gap-4 sm:gap-6
  p-4 sm:p-6
">

// Hide on mobile
<div className="hidden sm:block">Desktop only</div>

// Show on mobile only
<div className="block sm:hidden">Mobile only</div>
```

---

## Known Issues & Gotchas

### TypeScript Strict Mode

```typescript
// WRONG: Will fail strict checks
function getUser(id) { /* ... */ }

// RIGHT: Explicit types
function getUser(id: string): Promise<User> { /* ... */ }
```

### Supabase RLS

```sql
-- Always test RLS policies!
-- Common issue: Policy blocks legitimate access

-- Check policy is working
SELECT * FROM table_name; -- Should only return allowed rows
```

### Tailwind Class Order

```typescript
// Use cn() utility for conditional classes
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className // Allow override from props
)} />
```

### Date/Time Handling

```typescript
// ALWAYS use date-fns for date manipulation
import { format, addDays, subHours } from 'date-fns';

// ALWAYS consider timezones for class times
// See LESSONS_LEARNED.md for timezone handling
```

---

## Testing Your Changes

### Quick Verification

```bash
# Type check
npm run lint

# Build check
npm run build

# Dev server
npm run dev
```

### Manual Testing Checklist

- [ ] Works on mobile viewport (< 640px)
- [ ] Works on desktop viewport (> 1024px)
- [ ] No console errors
- [ ] Loading states visible
- [ ] Error states handled
- [ ] Accessibility: keyboard navigable

---

## Getting Help

### Finding Examples

```bash
# Find similar components
grep -r "pattern" src/components/

# Find usage of a component
grep -r "ComponentName" src/

# Find all TypeScript types
grep -r "interface\|type" src/types/
```

### Understanding Context

Key context files:
- `src/contexts/AuthContext.tsx` - User authentication
- `src/contexts/DemoContext.tsx` - Demo mode with mock data
- `src/contexts/ThemeContext.tsx` - Dark/light mode

### Escalation

If stuck:
1. Check `LESSONS_LEARNED.md` for similar issues
2. Search existing code for patterns
3. Read the component's existing tests (if any)
4. Ask for clarification rather than guessing

---

*Keep this file updated as the codebase evolves.*
