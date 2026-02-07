# Demo Mode Guide

Tandava includes a comprehensive demo mode for showcasing the platform without connecting to a real database. This guide covers how demo mode works and how to customize it for your needs.

---

## Quick Start

### Enabling Demo Mode

Set the environment variable:

```bash
# .env or .env.local
VITE_DEMO_MODE=true
```

Restart the dev server:
```bash
npm run dev
```

When enabled, the demo panel appears in the bottom-right corner, allowing visitors to switch between persona views (Owner, Front Desk, Teacher, Student).

### Disabling Demo Mode

```bash
VITE_DEMO_MODE=false  # or simply don't set it
```

The DemoProvider will render children without context, and the DemoPanel won't appear.

---

## Architecture

### File Structure

```
src/data/demo/
├── index.ts                  # Central exports, demo handle detection
├── oxatl-yoga.ts             # Demo studio, teachers, members, schedule
└── bookings-transactions.ts  # Historical booking/transaction data (2018)

src/contexts/
└── DemoContext.tsx           # React context, personas, role switching
```

### Key Concepts

1. **Demo data is completely separate from database tables.** The demo files export TypeScript constants that match the database types. They never touch Supabase.

2. **Demo personas map to real roles.** Switching personas changes what UI elements are visible, simulating the role-based access control.

3. **Historical data is pre-generated.** Bookings and transactions are from 2018, giving realistic historical data for analytics dashboards.

---

## Demo Studio: Oxatl Yoga

The demo uses a fictional yoga studio based in Austin, Texas:

| Attribute | Value |
|-----------|-------|
| Name | Oxatl Yoga |
| Slug | `oxatl-yoga` |
| Locations | 3 (Domain, South Congress, East Austin) |
| Owner | Mariana Trench |
| Front Desk | Cassia Ray |
| Teachers | 18 (15 female, 3 male) |
| Members | 500 |
| Time Period | Jan 22 - Dec 31, 2018 |

### Schedule Pattern

**Weekdays (Mon-Fri):**
- 7:00 AM, 10:30 AM, 12:00 PM, 6:00 PM (Mon/Wed)
- 7:00 AM, 10:30 AM, 12:00 PM, 4:00 PM (Tue/Thu)

**Saturday:**
- 9:00 AM, 12:00 PM, 3:00 PM

**Sunday:**
- 10:30 AM, 12:00 PM, 4:00 PM

### Class Types

10 recurring class types with realistic styles:
- Power Vinyasa, Slow Flow, Hot Power, Yin, Vinyasa & Yin
- Yoga Sculpt, Core Flow, Hatha, Prenatal Yoga, Restorative

### Workshop Templates

7 special event templates:
- Myofascial Release, Breathwork, Mantra & Chanting
- Glow Yoga, Yin & Music Night, Sound Bath, Full Moon Ceremony

---

## Customizing Demo Data

### Changing the Demo Studio

Edit `src/data/demo/oxatl-yoga.ts`:

```typescript
export const OXATL_STUDIO: Studio = {
  id: 'demo-studio-oxatl-001',
  name: 'Your Studio Name',
  slug: 'your-studio',
  timezone: 'America/Los_Angeles',  // Your timezone
  // ...
};
```

### Adding/Modifying Teachers

Teachers are defined with a helper function:

```typescript
const TEACHER_DATA = [
  { first: 'New', last: 'Teacher', specialties: ['Vinyasa', 'Power Flow'] },
  // Add more...
];

export const OXATL_TEACHERS = TEACHER_DATA.map((t, i) => createTeacher(t, i));
```

### Changing Member Count

The member generator creates realistic profiles:

```typescript
// In oxatl-yoga.ts, change the count parameter
export const OXATL_MEMBERS = generateMembers(500);  // Change to any number
```

### Adjusting Historical Date Range

Edit `src/data/demo/bookings-transactions.ts`:

```typescript
export const DEMO_START_DATE = new Date('2018-01-22');
export const DEMO_END_DATE = new Date('2018-12-31');
```

Bookings and transactions are generated for this range with realistic patterns (weekend peaks, holiday dips, growth simulation).

---

## Using Demo Data in Components

### Accessing Demo Context

```typescript
import { useDemo } from '@/contexts/DemoContext';

function MyComponent() {
  const {
    isDemoMode,
    demoStudio,
    demoStats,
    activePersona,
    activeProfile,
    switchPersona,
  } = useDemo();

  if (!isDemoMode) {
    // Use real data from Supabase
  }

  return <div>Welcome, {activeProfile.display_name}</div>;
}
```

### Accessing Demo Data Directly

```typescript
import {
  OXATL_TEACHERS,
  OXATL_MEMBERS,
  OXATL_SCHEDULE,
  getDemoTeachers,
  getDemoMembers,
  getDemoTeacherById,
} from '@/data/demo';

// Get all teachers
const teachers = getDemoTeachers();

// Get first 10 members
const members = getDemoMembers(10);

// Find specific teacher
const teacher = getDemoTeacherById('demo-teacher-001');
```

### Checking for Demo Handles

```typescript
import { isDemoHandle, isDemoStudio } from '@/data/demo';

// Check if a URL slug is a demo identifier
if (isDemoHandle(params.studioSlug)) {
  // Load demo data instead of querying database
}

// Check if a studio ID is the demo studio
if (isDemoStudio(studioId)) {
  // Return demo data
}
```

---

## Demo Bookings & Transactions

### Booking Statistics (2018)

| Metric | Value |
|--------|-------|
| Total Bookings | ~15,000+ |
| Checked In | 75% |
| Cancelled | 10% |
| No-Show | 8% |
| Waitlist | 5% |
| Late Cancel | 2% |

### Transaction Types

| Type | Description |
|------|-------------|
| `membership_purchase` | New membership signups |
| `membership_renewal` | Monthly renewals |
| `class_pack_purchase` | Class pack purchases |
| `drop_in` | Single class purchases |
| `workshop_registration` | Workshop signups |
| `late_cancel_fee` | Late cancellation fees |
| `no_show_fee` | No-show fees |
| `refund` | Various refunds |

### Accessing Booking Data

```typescript
import {
  OXATL_BOOKINGS,
  OXATL_TRANSACTIONS,
  OXATL_CLASS_OCCURRENCES,
  OXATL_BOOKING_STATS,
  OXATL_TRANSACTION_STATS,
} from '@/data/demo/bookings-transactions';

// Use stats for dashboards
console.log(OXATL_BOOKING_STATS.totalBookings);
console.log(OXATL_TRANSACTION_STATS.totalRevenue);

// Filter bookings by date
const marchBookings = OXATL_BOOKINGS.filter(b =>
  b.created_at.startsWith('2018-03')
);
```

---

## Removing Demo Mode Entirely

If you're forking Tandava for production and want to remove all demo code:

1. **Delete demo data directory:**
   ```bash
   rm -rf src/data/demo/
   ```

2. **Remove DemoProvider from App.tsx:**
   ```tsx
   // Before
   <DemoProvider>
     <App />
   </DemoProvider>

   // After
   <App />
   ```

3. **Delete demo components:**
   ```bash
   rm src/components/DemoPanel.tsx
   rm src/contexts/DemoContext.tsx
   ```

4. **Remove demo imports from components** that use `useDemo()` or demo data.

5. **Remove environment variable:**
   ```bash
   # Delete from .env
   VITE_DEMO_MODE=true
   ```

---

## Best Practices

### When Building New Features

1. **Check for demo mode first:**
   ```typescript
   const { isDemoMode, demoStudio } = useDemo();
   if (isDemoMode) {
     return <MyComponent studio={demoStudio} />;
   }
   // Real data fetching...
   ```

2. **Keep demo data realistic:** Match the types exactly. Use the same field names and structures as the database.

3. **Test both modes:** Always verify features work with both demo data and real Supabase data.

### For Demo Site Deployments

1. **Set VITE_DEMO_MODE=true** in production environment for demo.yourdomain.com

2. **Use a subdomain** to clearly separate demo from production

3. **Consider rate limiting** since demo mode doesn't require authentication

---

## Troubleshooting

### Demo panel not appearing

- Verify `VITE_DEMO_MODE=true` is set (check `.env` or `.env.local`)
- Restart the dev server after changing environment variables
- Check browser console for errors

### TypeScript errors with demo data

- Ensure demo data exports match the types in `src/types/database.ts`
- Run `npm run build` to check for type errors

### Demo data not updating

- Demo data is static. Changes require editing the source files and rebuilding.
- For dynamic demo experiences, consider seeding a test Supabase instance instead.

---

## Reference Data Integration

Demo mode integrates with the reference data utilities for consistent styling and validation:

```typescript
import { CLASS_STYLES, WORKSHOP_TYPES } from '@/lib/reference-data';
import { validateEmail, sanitizeHandle } from '@/lib/validation';

// Class types use canonical style names
const validStyles = CLASS_STYLES; // 50 options

// Workshop templates use canonical types
const validWorkshops = WORKSHOP_TYPES; // 30 options
```

See `src/lib/reference-data.ts` for all canonical lists and `src/lib/validation.ts` for form validation utilities.

---

*Last updated: 2025-02-06*
