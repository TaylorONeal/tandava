# Lessons Learned

Common issues, their solutions, and competitor mistakes to avoid. This document helps both humans and AI agents avoid repeating known problems.

---

## Table of Contents
1. [TypeScript Issues](#typescript-issues)
2. [Database & RLS Issues](#database--rls-issues)
3. [Timezone Handling](#timezone-handling)
4. [Competitor Mistakes to Avoid](#competitor-mistakes-to-avoid)
5. [Frontend Gotchas](#frontend-gotchas)
6. [Mobile-Specific Issues](#mobile-specific-issues)
7. [Payment & Billing Edge Cases](#payment--billing-edge-cases)

---

## TypeScript Issues

### Issue: Implicit `any` Types

**Problem:**
```typescript
// This will fail strict TypeScript
function handleBooking(data) {
  return data.id;
}
```

**Solution:**
```typescript
function handleBooking(data: BookingData): string {
  return data.id;
}
```

### Issue: Optional Properties Access

**Problem:**
```typescript
// Unsafe: member.profile might be undefined
const name = member.profile.firstName;
```

**Solution:**
```typescript
// Safe: optional chaining
const name = member.profile?.firstName ?? 'Unknown';

// Or with type guard
if (member.profile) {
  const name = member.profile.firstName;
}
```

### Issue: Event Handler Types

**Problem:**
```typescript
// Missing event type
const handleChange = (e) => {
  setValue(e.target.value);
};
```

**Solution:**
```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};
```

---

## Database & RLS Issues

### Issue: RLS Policy Blocks Legitimate Access

**Problem:** User can't see their own data after RLS policy added.

**Diagnosis:**
```sql
-- Test as specific user
SET LOCAL request.jwt.claim.sub = 'user-uuid-here';
SELECT * FROM bookings; -- Should return user's bookings
```

**Solution:**
```sql
-- Ensure policy checks the right claim
CREATE POLICY "Users see own bookings" ON bookings
  FOR SELECT USING (
    member_id = auth.uid()
  );

-- For studio staff, check studio membership
CREATE POLICY "Staff see studio bookings" ON bookings
  FOR SELECT USING (
    studio_id IN (
      SELECT studio_id FROM studio_members
      WHERE user_id = auth.uid()
    )
  );
```

### Issue: Migration Creates NULL Violation

**Problem:** Adding NOT NULL column to existing data fails.

**Solution:**
```sql
-- Step 1: Add nullable column with default
ALTER TABLE classes ADD COLUMN delivery_mode VARCHAR(20) DEFAULT 'in_person';

-- Step 2: Backfill existing data
UPDATE classes SET delivery_mode = 'in_person' WHERE delivery_mode IS NULL;

-- Step 3: Add NOT NULL constraint
ALTER TABLE classes ALTER COLUMN delivery_mode SET NOT NULL;
```

### Issue: Foreign Key Reference Missing

**Problem:** Insert fails due to missing foreign key.

**Solution:**
```sql
-- Always check foreign keys exist before insert
-- In application code, validate relationships first

-- Or use ON DELETE CASCADE / SET NULL
ALTER TABLE bookings
ADD CONSTRAINT fk_class
FOREIGN KEY (class_id) REFERENCES classes(id)
ON DELETE CASCADE;
```

---

## Timezone Handling

### The Problem

**Mindbody Bug Example:** User in Central Time books a Hawaii class. The app shows the class at the wrong time because it displays the user's local time instead of the studio's time.

### The Rule

| Class Type | Time Display | Reason |
|------------|--------------|--------|
| **In-Person** | Studio's timezone | User will physically be there |
| **Virtual (Live)** | User's current timezone | User joins remotely |
| **Hybrid** | Show both | Different attendees have different needs |
| **On-Demand** | N/A (anytime) | Duration only, no start time |

### Implementation

```typescript
// src/lib/timezone.ts

import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

/**
 * Format class time for display based on delivery mode
 */
export function formatClassTime(
  classTime: Date,          // UTC time from database
  studioTimezone: string,   // e.g., 'Pacific/Honolulu'
  userTimezone: string,     // e.g., 'America/Chicago'
  deliveryMode: DeliveryMode
): string {
  // In-person: Always show studio time
  if (deliveryMode === 'in_person') {
    return formatInTimeZone(classTime, studioTimezone, "h:mm a 'HST'");
    // Returns: "6:00 PM HST"
  }

  // Virtual: Show user's local time
  if (deliveryMode === 'virtual') {
    return formatInTimeZone(classTime, userTimezone, "h:mm a zzz");
    // Returns: "10:00 PM CST"
  }

  // Hybrid: Show both
  if (deliveryMode === 'hybrid') {
    const studioTime = formatInTimeZone(classTime, studioTimezone, "h:mm a");
    const userTime = formatInTimeZone(classTime, userTimezone, "h:mm a zzz");
    return `${studioTime} (${userTime} your time)`;
    // Returns: "6:00 PM (10:00 PM CST your time)"
  }

  return formatInTimeZone(classTime, userTimezone, "h:mm a");
}

/**
 * Get user's current timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
```

### Calendar Integration

```typescript
// When adding to calendar, use UTC with timezone info
function generateCalendarEvent(classData: ClassOccurrence) {
  return {
    title: classData.title,
    // Store as UTC, let calendar app convert
    start: classData.startTimeUtc.toISOString(),
    end: classData.endTimeUtc.toISOString(),
    // Include timezone for clarity
    location: classData.deliveryMode === 'virtual'
      ? classData.virtualLink
      : `${classData.studioName} (${classData.studioTimezone})`,
  };
}
```

### Database Storage

```sql
-- Always store times in UTC
CREATE TABLE class_occurrences (
  id UUID PRIMARY KEY,
  start_time TIMESTAMPTZ NOT NULL,  -- UTC with timezone
  end_time TIMESTAMPTZ NOT NULL,    -- UTC with timezone
  studio_id UUID REFERENCES studios(id),
  -- Studio timezone comes from the studios table
);

-- Studios have their timezone
CREATE TABLE studios (
  id UUID PRIMARY KEY,
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/Los_Angeles',
  -- Use IANA timezone names
);
```

---

## Competitor Mistakes to Avoid

These are common issues found in Mindbody, Momence, Walla, and Arketa that we must not repeat.

### 1. Timezone Display Bugs (Mindbody)
**Issue:** Shows wrong time for classes in different timezones.
**Our Solution:** See [Timezone Handling](#timezone-handling) above.

### 2. Slow Mobile Performance (Mindbody, Walla)
**Issue:** App takes 5+ seconds to load schedule.
**Our Solution:**
- Skeleton loading states
- Optimistic updates
- Client-side caching
- Lazy load non-critical data

### 3. Confusing Booking Flow (Momence)
**Issue:** Too many taps to book a class (5-7 taps).
**Our Solution:**
- Quick-book mode (1 tap for members with coverage)
- Skip payment selection when unnecessary
- Remember preferences

### 4. No Offline Support (All)
**Issue:** App unusable without internet.
**Our Solution:**
- Service worker caching
- Show cached schedule data
- Queue actions for sync

### 5. Poor Error Messages (Mindbody)
**Issue:** "An error occurred" with no helpful info.
**Our Solution:**
```typescript
// WRONG
toast.error("An error occurred");

// RIGHT
toast.error("Couldn't book class: You're already on the waitlist", {
  action: { label: "View Waitlist", onClick: () => navigate("/waitlist") },
});
```

### 6. Duplicate Booking Prevention Failure (Walla)
**Issue:** Users accidentally book same class twice.
**Our Solution:**
```typescript
// Check for existing booking before allowing
async function canBook(memberId: string, classId: string): Promise<boolean> {
  const existing = await getBooking(memberId, classId);
  if (existing) {
    toast.info("You're already booked for this class");
    return false;
  }
  return true;
}
```

### 7. Inconsistent Cancellation Policies (Arketa)
**Issue:** Cancellation rules unclear, enforced inconsistently.
**Our Solution:**
- Show policy on booking confirmation
- Countdown to cancellation deadline
- Automated enforcement (no manual exceptions)

### 8. Missing Waitlist Auto-Promotion (Mindbody)
**Issue:** Waitlist doesn't auto-promote when spot opens.
**Our Solution:**
- Automatic promotion with configurable delay
- Immediate notification
- Time-limited to accept before going to next person

### 9. Calendar Sync Issues (All)
**Issue:** Calendar events don't update when class changes.
**Our Solution:**
- Use iCal subscription (live updates)
- Include class ID in event for updates
- Send calendar update notifications

### 10. Payment Failed but Class Booked (Momence)
**Issue:** Payment fails but system shows booking.
**Our Solution:**
- Atomic transactions (all or nothing)
- Clear error states
- Don't show success until payment confirmed

### 11. Instructor Schedule Conflicts (Walla)
**Issue:** System allows scheduling instructor for overlapping classes.
**Our Solution:**
```sql
-- Database constraint prevents overlaps
CREATE FUNCTION check_instructor_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM class_occurrences
    WHERE instructor_id = NEW.instructor_id
    AND id != NEW.id
    AND (start_time, end_time) OVERLAPS (NEW.start_time, NEW.end_time)
  ) THEN
    RAISE EXCEPTION 'Instructor already scheduled during this time';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 12. No Grace Period for Late Arrivals (Mindbody)
**Issue:** System marks no-show immediately at class start.
**Our Solution:**
- Configurable grace period (default 15 min)
- Late check-in option
- Distinguish late vs no-show

### 13. Complex Membership Rules (All)
**Issue:** Hard to understand what's included in membership.
**Our Solution:**
- Clear "What's Included" section
- Real-time check if class is covered
- Show "included" badge on covered classes

### 14. Notification Overload (Momence)
**Issue:** Too many notifications annoy users.
**Our Solution:**
- Granular notification preferences
- Smart batching
- Respect quiet hours

### 15. Account Recovery Difficulty (Mindbody)
**Issue:** Hard to recover account or reset password.
**Our Solution:**
- Multiple recovery methods (email, phone, magic link)
- Clear instructions
- Preserve booking history after recovery

### 16. Multi-Location Confusion (All)
**Issue:** Unclear which location class is at.
**Our Solution:**
- Always show location prominently
- Color-code by location
- Include location in all notifications

### 17. Instructor Substitution Chaos (Walla)
**Issue:** No clear sub request workflow.
**Our Solution:**
- Dedicated sub request flow
- Notify qualified subs automatically
- Track sub acceptance/decline

### 18. Partial Refund Complexity (Arketa)
**Issue:** Partial refunds require manual calculation.
**Our Solution:**
- Automatic prorated refund calculation
- Clear refund policy display
- One-click refund for admins

### 19. Report Export Limitations (Mindbody)
**Issue:** Can't export data in useful formats.
**Our Solution:**
- Export to CSV, Excel, PDF
- Scheduled report delivery
- API access for custom reporting

### 20. Mobile Check-in Failures (All)
**Issue:** Check-in doesn't work reliably on mobile.
**Our Solution:**
- Multiple check-in methods (QR, name search, photo)
- Offline check-in with sync
- Optimistic UI updates

---

## Frontend Gotchas

### Issue: Hydration Mismatch

**Problem:** Server and client render different content.

**Solution:**
```typescript
// Use useEffect for client-only code
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

if (!mounted) return null;
return <ClientOnlyComponent />;
```

### Issue: Stale Closure in useEffect

**Problem:** Effect uses outdated value.

**Solution:**
```typescript
// Include dependencies
useEffect(() => {
  fetchData(userId); // Uses current userId
}, [userId]); // Re-run when userId changes
```

### Issue: Flash of Unstyled Content

**Problem:** Page flashes before styles load.

**Solution:**
```typescript
// Preload critical CSS
<link rel="preload" href="/styles.css" as="style" />

// Use skeleton loading
{isLoading ? <Skeleton /> : <Content />}
```

---

## Mobile-Specific Issues

### Issue: Touch Target Too Small

**Problem:** Buttons hard to tap on mobile.

**Solution:**
```typescript
// Minimum 44x44px touch targets
<Button className="h-12 min-w-[44px]">Book</Button>

// Larger tap areas for important actions
<Button className="h-14 w-full text-lg">Book Now</Button>
```

### Issue: Keyboard Covers Input

**Problem:** On-screen keyboard hides input field.

**Solution:**
```typescript
// Scroll input into view
<Input
  onFocus={(e) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }}
/>
```

### Issue: Pull-to-Refresh Conflicts

**Problem:** Pull-to-refresh triggers when scrolling up.

**Solution:**
```css
/* Disable overscroll on specific containers */
.no-overscroll {
  overscroll-behavior: contain;
}
```

---

## Payment & Billing Edge Cases

### Issue: Double Charge Prevention

**Problem:** User clicks pay twice, gets charged twice.

**Solution:**
```typescript
// Disable button immediately
const [isProcessing, setIsProcessing] = useState(false);

const handlePayment = async () => {
  if (isProcessing) return; // Guard
  setIsProcessing(true);

  try {
    await processPayment();
  } finally {
    setIsProcessing(false);
  }
};

// Plus: Idempotency key on backend
```

### Issue: Promo Code Stacking

**Problem:** Users apply multiple promos that shouldn't stack.

**Solution:**
```typescript
// Only one promo per transaction
if (existingPromo && newPromo) {
  // Compare and keep better one
  const effectivePromo = calculateBetterPromo(existingPromo, newPromo);
  toast.info(`Applied ${effectivePromo.code} (best discount)`);
}
```

### Issue: Expired Card Handling

**Problem:** Recurring payment fails on expired card.

**Solution:**
- Notify member 30 days before expiry
- Retry with exponential backoff
- Grace period before suspension
- Easy card update flow

---

## Quick Reference: Prevention Patterns

| Issue Type | Prevention Pattern |
|------------|-------------------|
| Type errors | Strict TypeScript, no `any` |
| RLS bugs | Test policies with specific users |
| Timezone bugs | Use UTC storage, format at display |
| Double actions | Disable buttons, idempotency keys |
| Stale data | React Query, optimistic updates |
| Mobile UX | Test on real devices, large touch targets |
| Offline | Service worker, queue actions |
| Errors | Specific messages, recovery actions |

---

*Add new lessons as they're learned. Keep this file practical and action-oriented.*
