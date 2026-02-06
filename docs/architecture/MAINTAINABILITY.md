# Maintainability Guide

How to keep the Tandava codebase healthy, understandable, and easy to modify over time.

## Table of Contents
1. [Code Organization](#code-organization)
2. [Coding Standards](#coding-standards)
3. [Testing Strategy](#testing-strategy)
4. [Documentation Standards](#documentation-standards)
5. [Dependency Management](#dependency-management)
6. [Technical Debt](#technical-debt)
7. [Code Review Guidelines](#code-review-guidelines)

---

## Code Organization

### Directory Structure

```
tandava/
├── docs/                    # Documentation
│   ├── ai-agents/          # AI assistant guides
│   ├── app-store/          # App store submission
│   └── architecture/       # Architecture docs
├── public/                  # Static assets
│   ├── icons/              # App icons
│   └── favicon.svg         # Favicon
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Base UI primitives (shadcn)
│   │   ├── booking/       # Booking-specific components
│   │   ├── schedule/      # Schedule components
│   │   ├── manage/        # Admin components
│   │   └── layout/        # Layout components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities and helpers
│   ├── pages/             # Route pages
│   │   ├── auth/          # Authentication
│   │   ├── manage/        # Studio management
│   │   └── teach/         # Instructor portal
│   ├── services/          # API clients
│   └── types/             # TypeScript types
├── supabase/              # Database
│   ├── functions/         # Edge functions
│   └── migrations/        # SQL migrations
└── tests/                 # Test files
```

### Component Organization

```typescript
// Feature-based component structure
src/components/booking/
├── BookingModal.tsx        # Main component
├── PaymentSourceSelector.tsx
├── BookingConfirmation.tsx
├── useBookingState.ts     # Related hook
├── booking.types.ts       # Types
└── index.ts               # Exports
```

### Import Order

```typescript
// 1. React and framework
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Third-party libraries
import { format } from 'date-fns';
import { toast } from 'sonner';

// 3. Internal components (absolute imports)
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. Internal utilities
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

// 5. Types
import type { Booking, Member } from '@/types/database';

// 6. Relative imports (same feature)
import { PaymentSourceSelector } from './PaymentSourceSelector';
```

---

## Coding Standards

### TypeScript Guidelines

#### Use Strict Types

```typescript
// WRONG: Implicit any
function processBooking(data) {
  return data.id;
}

// RIGHT: Explicit types
function processBooking(data: BookingData): string {
  return data.id;
}
```

#### Prefer Interface over Type for Objects

```typescript
// RIGHT: Interface for objects
interface Member {
  id: string;
  email: string;
  profile: MemberProfile;
}

// RIGHT: Type for unions, primitives, functions
type MemberStatus = 'active' | 'inactive' | 'suspended';
type FormatFn = (value: number) => string;
```

#### Avoid Type Assertions

```typescript
// WRONG: Type assertion
const member = data as Member;

// RIGHT: Type guard
function isMember(data: unknown): data is Member {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'email' in data
  );
}

if (isMember(data)) {
  // data is safely typed as Member
}
```

### React Guidelines

#### Component Patterns

```typescript
// Functional component with proper typing
interface ClassCardProps {
  classData: ClassOccurrence;
  onBook: (id: string) => void;
  isLoading?: boolean;
}

export function ClassCard({
  classData,
  onBook,
  isLoading = false,
}: ClassCardProps) {
  // Hooks at top
  const [isExpanded, setIsExpanded] = useState(false);

  // Derived state
  const isFull = classData.spotsLeft === 0;

  // Event handlers
  const handleBook = () => {
    if (!isFull) onBook(classData.id);
  };

  // Render
  return (
    <Card>
      {/* ... */}
    </Card>
  );
}
```

#### Avoid Props Drilling

```typescript
// WRONG: Passing props through many levels
<Parent user={user}>
  <Child user={user}>
    <GrandChild user={user} />
  </Child>
</Parent>

// RIGHT: Use context for widely-used data
const UserContext = createContext<User | null>(null);

function useUser() {
  const user = useContext(UserContext);
  if (!user) throw new Error('Must be within UserProvider');
  return user;
}
```

#### Custom Hooks for Logic

```typescript
// Extract complex logic into hooks
function useBookingFlow(classId: string) {
  const [step, setStep] = useState<BookingStep>('select');
  const [selectedPayment, setSelectedPayment] = useState<PaymentSource | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canProceed = selectedPayment !== null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await createBooking(classId, selectedPayment);
      setStep('success');
    } catch (error) {
      toast.error('Booking failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    step,
    selectedPayment,
    isProcessing,
    canProceed,
    setStep,
    setSelectedPayment,
    handleConfirm,
  };
}
```

---

## Testing Strategy

### Testing Pyramid

```
                    ┌───────────┐
                    │    E2E    │  Few: Critical paths only
                    │  (Cypress)│
                    ├───────────┤
                    │Integration│  Some: API + DB tests
                    │ (Vitest)  │
                    ├───────────┤
                    │   Unit    │  Many: Functions, hooks
                    │ (Vitest)  │
                    └───────────┘
```

### What to Test

| Layer | What | Examples |
|-------|------|----------|
| Unit | Pure functions | `formatCurrency`, `calculateTotal`, `validateEmail` |
| Unit | Hooks | `useBookingFlow`, `useAuth` |
| Integration | API routes | `POST /api/bookings` creates booking |
| Integration | Database | RLS policies, migrations |
| E2E | Critical flows | Book class, check in, purchase membership |

### Test File Structure

```
tests/
├── unit/
│   ├── lib/
│   │   └── format.test.ts
│   └── hooks/
│       └── useBookingFlow.test.ts
├── integration/
│   ├── api/
│   │   └── bookings.test.ts
│   └── db/
│       └── rls.test.ts
└── e2e/
    ├── booking-flow.spec.ts
    └── auth.spec.ts
```

### Testing Best Practices

```typescript
// Good test structure
describe('BookingFlow', () => {
  // Setup
  beforeEach(() => {
    // Reset state
  });

  describe('when user has membership', () => {
    it('should enable quick book', () => {
      // Arrange
      const user = createMockUser({ hasMembership: true });

      // Act
      const { result } = renderHook(() => useBookingFlow(user));

      // Assert
      expect(result.current.canQuickBook).toBe(true);
    });
  });

  describe('when class is full', () => {
    it('should add to waitlist instead of booking', async () => {
      // ...
    });
  });
});
```

---

## Documentation Standards

### Code Comments

```typescript
// WRONG: Obvious comments
// Increment counter by 1
counter += 1;

// RIGHT: Explain WHY, not WHAT
// Using 2-hour buffer per studio cancellation policy requirements
const cancellationDeadline = subHours(classTime, 2);

// RIGHT: Document complex logic
/**
 * Calculates the effective price after applying discounts.
 *
 * Priority order:
 * 1. Promo code discount (if valid)
 * 2. Membership discount (if applicable)
 * 3. Intro offer (if first purchase)
 *
 * Discounts do not stack - highest discount wins.
 */
function calculateEffectivePrice(/* ... */) {
  // ...
}
```

### README Pattern

Each major feature should have:

```markdown
# Feature Name

Brief description of what this feature does.

## Usage

```tsx
import { FeatureComponent } from '@/components/feature';

<FeatureComponent prop={value} />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `prop` | `string` | required | What it does |

## Examples

### Basic Usage
...

### Advanced Usage
...
```

---

## Dependency Management

### Dependency Policy

| Category | Policy | Examples |
|----------|--------|----------|
| **Core** | Pin exact version | React, TypeScript |
| **UI** | Minor range allowed | Radix UI, Tailwind |
| **Utilities** | Patch range allowed | date-fns, clsx |
| **Dev** | Latest stable | ESLint, Vite |

### Update Schedule

- **Security patches**: Immediate
- **Bug fixes**: Weekly
- **Minor versions**: Bi-weekly review
- **Major versions**: Quarterly evaluation

### Avoiding Bloat

Before adding a dependency, ask:

1. **Can we do this ourselves in <50 lines?** → Don't add dependency
2. **Is it actively maintained?** → Check GitHub activity
3. **What's the bundle size impact?** → Use bundlephobia.com
4. **Do we need the whole library?** → Consider tree-shaking

```bash
# Check bundle impact before adding
npx bundlephobia <package-name>
```

---

## Technical Debt

### Debt Tracking

```typescript
// Mark tech debt with TODO comments
// TODO(tech-debt): Replace with proper date picker
// Tracking: https://github.com/org/repo/issues/123
const date = prompt('Enter date');

// Categories:
// TODO(tech-debt): Code quality issue
// TODO(performance): Optimization needed
// TODO(security): Security improvement needed
// TODO(accessibility): A11y improvement needed
```

### Debt Prioritization

| Priority | Criteria | Action |
|----------|----------|--------|
| P0 | Security risk, data loss risk | Fix immediately |
| P1 | Causes bugs, blocks features | Fix this sprint |
| P2 | Slows development | Schedule this quarter |
| P3 | Nice to have | Backlog |

### Refactoring Guidelines

1. **Boy Scout Rule**: Leave code better than you found it
2. **One refactor per PR**: Don't mix refactoring with features
3. **Tests first**: Ensure test coverage before refactoring
4. **Incremental**: Small, frequent improvements over big rewrites

---

## Code Review Guidelines

### Review Checklist

**Functionality**
- [ ] Code does what the PR claims
- [ ] Edge cases handled
- [ ] Error handling appropriate

**Code Quality**
- [ ] Follows coding standards
- [ ] No unnecessary complexity
- [ ] Good naming conventions

**Testing**
- [ ] Tests added for new code
- [ ] Tests pass
- [ ] Edge cases tested

**Performance**
- [ ] No obvious performance issues
- [ ] Database queries optimized
- [ ] No memory leaks

**Security**
- [ ] No hardcoded secrets
- [ ] Input validated
- [ ] RLS policies correct

### Review Etiquette

**For Reviewers:**
- Be constructive, not critical
- Explain the "why" behind suggestions
- Approve with minor nits to unblock
- Use suggestions feature for code changes

**For Authors:**
- Keep PRs small (<400 lines)
- Write good PR descriptions
- Respond to all comments
- Don't take feedback personally

### PR Description Template

```markdown
## Summary
Brief description of changes.

## Changes
- Added X
- Updated Y
- Fixed Z

## Testing
How to test these changes.

## Screenshots
(If UI changes)

## Checklist
- [ ] Tests added
- [ ] Documentation updated
- [ ] No console errors
```

---

*Last Updated: February 2026*
