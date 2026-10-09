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
8. [Launch v1 Lessons](#launch-v1-lessons-october-2026)

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

## Launch v1 Lessons (October 2026)

Found by the launch-v1 audit. Each has a test in `supabase/tests/`.

| Lesson | Why | Prevention |
|---|---|---|
| Supabase grants anon full rights on new public tables | 10 tables were readable and writable with the public key, including Zoom host passwords | RLS plus at least one policy on every table; SEC tests list tables without RLS |
| SECURITY DEFINER functions are executable by anon by default | Three lacked `search_path`, some trusted client ids | Pin `search_path`; `REVOKE ... FROM PUBLIC, anon` explicitly |
| Policies that reference each other recurse | households and household_members hit infinite recursion | Use definer helpers (`my_household_ids()`) |
| Counters kept in two places drift | Pack and membership counts disagreed with bookings | One ledger column and one trigger |
| Two triggers for one job | Waitlist promoted free classes and minted credits | One path, one function |
| A UNIQUE on (occurrence, profile) blocks rebooking | Cancel then book failed forever | Partial unique index on active statuses |
| Last credit race | Two sessions both consumed one credit | Row lock on pack or membership; test with two psql sessions |
| Sync Stripe `constructEvent` fails on Deno | Webhook rejected every event | `constructEventAsync` with SubtleCryptoProvider |
| Webhook that returns 200 on error loses events | No retry | 5xx on error plus `stripe_events` dedupe |
| Open redirect via success_url | Attacker-controlled return | Allowlist in `_shared/urls.ts` |
| Payments routed to platform account when studio not onboarded | Money to wrong account | Gate on `stripe_charges_enabled` |
| `interface` for Supabase rpc Args | Not assignable to Record<string, unknown> | Use `type` |
| A test that never failed proves nothing | Easy to write vacuous tests | Revert the fix, watch the test fail, then restore |
| Charge before reserving | A paid drop-in could land on a full class and only be flagged for refund | Take the seat first (`hold_spot`), count live holds in every capacity check |
| Docs drift from code | `.env.example` missed vars, STATUS was 8 months stale | W0-3 and W0-4: update docs in the same PR |

## Production database changes (October 2026)

How a merge that touches migrations should go. Followed on PR #64; it worked.

1. **Look at prod first, read-only.** `mcp__Supabase__list_migrations` returned nothing because prod was never migrated with the CLI, so it proves nothing. Ask the schema instead (`execute_sql`: `to_regclass` for tables, `pg_proc` for functions, column checks). Compare against each migration file to learn which are applied.
2. **Two branches, same migration numbers.** Rename OUR unapplied or already-hand-applied files to follow main's, in the same relative order. Prod has no tracking table, so renaming is free. Grep docs and scripts for the old names.
3. **Rehearse in prod order.** Build a throwaway local DB (`pg_ctlcluster 16 main start`, then a scratch database with `supabase/tests/support/supabase_stub.sql`), apply what prod already has, then the pending files, with `ON_ERROR_STOP`. Then run `npm run test:db` on the fresh order too.
4. **Check prod data against new constraints.** A unique index or NOT NULL on a live table fails on dirty rows. Count duplicates before proposing it.
5. **The auto-mode guard blocks `apply_migration` and DDL via `execute_sql` on prod, even after the user says approve in chat.** Do not retry or shrink the payload to get past it. Bundle the pending files into one `BEGIN; ... COMMIT;` file, send it with SendUserFile, and open the dashboard SQL editor for the user:
   `https://supabase.com/dashboard/project/<ref>/sql/new` (Browser pane `navigate`). Always open the exact page; never make the user hunt for it.
6. **Verify after, read-only.** Check functions, tables, columns, `pv_policies`, "RLS tables without a policy = 0", and that service-role-only functions are not executable by `anon`.

| Mistake | Fix |
|---|---|
| `schema_migrations` missing, assumed prod was empty | Query the real schema |
| Test stub lacked a column main's migration reads (`auth.users.encrypted_password`) | Keep the stub in step with the columns migrations touch |
| New RLS table with no policy fails SEC-07 | Add an explicit policy, even deny-all (`USING (false)`) |
| Two auth return helpers after a merge (`authReturn`, `auth/next`) | Keep both, point the pages at one, do not delete the other side's callers |

## Edge functions on prod (October 2026)

| Mistake | Cost | Fix |
|---|---|---|
| Merging code that adds or changes an edge function and assuming it is live | Express Booking page shipped while `express-book` did not exist on prod | Edge functions deploy separately from the web app. After any merge touching `supabase/functions/<name>`, redeploy that function and confirm with `get_edge_function` that the deployed source matches main; a name comparison alone misses changed functions |
| Sending Taylor to the Supabase CLI on his Mac | 30 minutes of 403s: CLI logged into a personal account, commands run from `~`, multi-line pastes eaten by the login prompt | Deploy from the session with the Supabase MCP `deploy_edge_function`; if the CLI is unavoidable, run it from the repo root, one command per paste, and always pass `--project-ref mkaixgjwakfufmmwembn` (or `supabase link` first); seeing tandava-prod in `projects list` does not select it |
| Navigating the browser pane away from a form the user is about to submit | Lost a filled secret form | Open a new tab for any other check while a hand-off is pending |
| Secrets and auth captcha | Saving secrets, deploying and merging are blocked for the agent even with chat approval; captcha on without the widget locks everyone out | Fill the form, hand off the one click; ship the Turnstile widget before enabling captcha |

## Merging and agent permissions (October 2026)

| Mistake | Cost | Fix |
|---|---|---|
| Assuming a blocked merge was a login problem | Taylor asked for GitHub MCP, CLI login or browser login; none would help | Agent GitHub REST is already authenticated. The block is the Claude Code auto-mode guard, which stops merges to main even after chat approval. Say so in one line and hand over the PR links in order |
| Trying to grant the agent merge rights from inside the session | Writing `.claude/settings.json` is blocked as [Self-Modification]; so is fetching a main that contains it | Only Taylor adds permission rules (GitHub web editor, commit to main; done in #83). They load when a session starts, so the next session gets them. Never route around the guard via auto_merge or the PR page |
| Saying a commit was not on main after checking only the newest commits | Told Taylor his #83 had not landed when it had merged before #79 | Check a file's history (`git log origin/main -- <path>`), not the top of the log |
| Asking Taylor to merge PRs that touch the same file in one batch | A later PR could conflict after an earlier merge | Give the order, say which pair shares a file, and re-check mergeability after each |

## Frontend launch bugs (October 2026)

| Mistake | Cost | Fix |
|---|---|---|
| Prerender scripts anchored on an inline script tag | Removing the inline service-worker script (CSP) broke the Vercel build (#78) | Explicit `<!-- /root -->` marker in index.html; the scripts throw if it is missing |
| Reload-once guard for stale chunks stored its flag in sessionStorage without checking the write | Infinite reload loop when storage is blocked (Safari private, embedded webviews) | Reload only if the flag was actually stored (#79) |
| A settings page that toasts "Saved" without saving | Owners could not unlist a studio after onboarding | Load the real row before enabling Save (`loaded` gate), persist only the field a switch owns, DB test for owner, other owner and student (#82, SET-01..03) |
| Static `<link rel="canonical">` in index.html on an SPA | Every route told Google its canonical was the old domain's homepage | No static canonical; SEOHead sets one per page from `VITE_APP_URL` |
| Copy promising a control the product does not have | #81 said "turn this off any time" before the toggle persisted | Check the code path before writing the promise |

## First live studio (October 2026)

| Mistake | Cost | Fix |
|---|---|---|
| Onboarding saved a weekly rule and nothing expanded it into classes | A new studio had a schedule with nothing to book; every booking and payment test was blocked | Seed one real studio end to end through the UI before calling a flow done. Rules now expand by trigger plus a daily job (00036, GEN tests) |
| Stripe API defaults move under you | `accounts.create` (v1) is refused for new Connect platforms in 2026 | Read the function log (`query_logs`, source `function_logs`) before guessing; record the Stripe setting you rely on in PROGRESS |
| Telling the user an account without checking | "Reset the app password" left Taylor guessing which account | Name the exact email and what it signs into; check `auth.users` read-only first |

## Quick Reference: Prevention Patterns

| Issue Type | Prevention Pattern |
|------------|-------------------|
| Type errors | Strict TypeScript, no `any` |
| RLS bugs | Test policies with specific users |
| Timezone bugs | Use UTC storage, format at display |
| Double actions | Disable buttons, idempotency keys |
| Stale data | React Query, optimistic updates |
| Mobile UX | Test on real devices, large touch targets |
| New table | RLS + policy + test in same migration |
| Definer fn | search_path pinned, revoke anon |
| Money event | Idempotent by event id, 5xx on failure |
| Prod migrations | Query schema, rehearse in prod order, hand over one transactional SQL file plus the dashboard link |
| Offline | Service worker, queue actions |
| Errors | Specific messages, recovery actions |

---

*Add new lessons as they're learned. Keep this file practical and action-oriented.*
