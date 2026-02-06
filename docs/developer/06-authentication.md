# Authentication

How authentication works in Tandava and options for customization.

---

## Current Implementation

Tandava uses **Supabase Auth** as the default authentication provider.

```
┌─────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   User                    Frontend                 Supabase     │
│     │                        │                        │         │
│     │──── Login ────────────►│                        │         │
│     │                        │──── Auth Request ─────►│         │
│     │                        │◄─── JWT Token ─────────│         │
│     │◄─── Session ───────────│                        │         │
│     │                        │                        │         │
│     │──── API Request ──────►│                        │         │
│     │                        │──── Query + JWT ──────►│         │
│     │                        │    (RLS enforced)      │         │
│     │                        │◄─── Data ──────────────│         │
│     │◄─── Response ──────────│                        │         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Why Supabase Auth

| Reason | Benefit |
|--------|---------|
| Integrated with database | RLS policies use auth.uid() directly |
| Self-hostable | Same auth works local or cloud |
| Multiple providers | Email, OAuth, magic links out of the box |
| JWT-based | Stateless, works with edge functions |

---

## Supported Login Methods

### Currently Implemented

| Method | Status | Notes |
|--------|--------|-------|
| Email + Password | Ready | Standard signup/login |
| Magic Link | Ready | Passwordless email login |
| Demo Mode | Ready | Mock auth for testing |

### Available via Supabase (Not Yet Configured)

| Method | Effort | Notes |
|--------|--------|-------|
| Google OAuth | Low | Add credentials in Supabase dashboard |
| Apple OAuth | Low | Required for iOS app |
| GitHub OAuth | Low | Good for developer-focused studios |
| Facebook OAuth | Low | Common for consumer apps |
| SAML/SSO | Medium | Enterprise studios |

---

## Configuration

### Environment Variables

```bash
# Required for Supabase Auth
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Redirect URLs
VITE_AUTH_REDIRECT_URL=http://localhost:8080
```

### Supabase Dashboard Settings

1. **Authentication > Providers**: Enable desired OAuth providers
2. **Authentication > URL Configuration**: Set redirect URLs
3. **Authentication > Email Templates**: Customize confirmation emails

---

## Code Structure

```
src/
├── contexts/
│   └── AuthContext.tsx      # Auth state management
├── lib/
│   └── supabase.ts          # Supabase client
├── pages/
│   └── auth/
│       ├── Login.tsx        # Login page
│       └── Register.tsx     # Registration page
└── components/
    └── ProtectedRoute.tsx   # Route guards
```

### AuthContext

```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
```

### Protected Routes

```typescript
// Usage in App.tsx
<Route
  path="/manage/*"
  element={
    <ProtectedRoute roles={['owner', 'admin', 'front_desk']}>
      <ManageLayout />
    </ProtectedRoute>
  }
/>
```

---

## Role-Based Access Control

Tandava uses a role system tied to studio membership:

| Role | Access | Typical User |
|------|--------|--------------|
| `owner` | Full access to all studio features | Studio owner |
| `admin` | Most features except billing/ownership | Manager |
| `front_desk` | Check-in, roster, basic member info | Reception staff |
| `teacher` | Own schedule, roster, earnings | Instructors |
| `student` | Booking, schedule, own account | Members |

### How Roles Work

1. User authenticates via Supabase Auth
2. App fetches user's `staff_profiles` record for the current studio
3. Role determines which routes and features are accessible
4. RLS policies enforce data access at the database level

```sql
-- Example RLS policy
CREATE POLICY "Staff can view studio members"
ON members FOR SELECT
USING (
  studio_id IN (
    SELECT studio_id FROM staff_profiles
    WHERE user_id = auth.uid()
  )
);
```

---

## Alternative Auth Providers

If you don't want to use Supabase Auth, here are alternatives:

### Option 1: Auth0

**Pros:** Feature-rich, good enterprise support
**Cons:** Can get expensive, external dependency

```typescript
// Would require replacing AuthContext with Auth0 SDK
import { Auth0Provider } from '@auth0/auth0-react';
```

### Option 2: Clerk

**Pros:** Great DX, built-in UI components
**Cons:** Hosted only, monthly cost

### Option 3: NextAuth.js / Auth.js

**Pros:** Flexible, many providers, self-hostable
**Cons:** Requires Next.js or adapter work for Vite

### Option 4: Custom JWT

**Pros:** Full control
**Cons:** Security responsibility, more work

```typescript
// Custom auth would need:
// 1. JWT signing/verification
// 2. Session management
// 3. Password hashing (bcrypt/argon2)
// 4. Rate limiting
// 5. CSRF protection
```

---

## Switching Auth Providers

If replacing Supabase Auth:

### Required Changes

1. **AuthContext.tsx**: Replace Supabase calls with new provider
2. **supabase.ts**: Update client to pass auth headers differently
3. **RLS Policies**: Modify to use custom auth claims or disable RLS
4. **Login/Register pages**: Update UI to use new provider

### RLS Considerations

Supabase RLS relies on `auth.uid()`. If using external auth:

```sql
-- Option A: Pass user ID as header, use in RLS
CREATE POLICY "Custom auth policy"
ON members FOR SELECT
USING (
  studio_id IN (
    SELECT studio_id FROM staff_profiles
    WHERE user_id = current_setting('app.user_id')::uuid
  )
);

-- Option B: Disable RLS, enforce in application layer
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
-- (Not recommended for multi-tenant)
```

---

## Security Checklist

Before going to production:

- [ ] HTTPS enabled on all endpoints
- [ ] Secure cookie settings (httpOnly, secure, sameSite)
- [ ] Rate limiting on auth endpoints
- [ ] Password requirements enforced
- [ ] Email verification required
- [ ] Session timeout configured
- [ ] Refresh token rotation enabled
- [ ] Failed login attempt tracking
- [ ] CORS configured properly
- [ ] CSP headers set

---

## Demo Mode Auth

In demo mode (`VITE_DEMO_MODE=true`), authentication is mocked:

```typescript
// Mock user for demo
const MOCK_USER = {
  id: 'demo-user-id',
  email: 'demo@example.com',
  role: 'owner', // Switchable via demo panel
};
```

Demo mode bypasses Supabase entirely. Useful for:
- UI development without database
- Testing role-based views
- Demos and screenshots

---

## Common Issues

### "Invalid API key"
- Check `VITE_SUPABASE_ANON_KEY` is set correctly
- Ensure key matches project URL

### "Email not confirmed"
- Enable email confirmations in Supabase dashboard
- Or disable for development: Auth > Settings > Disable email confirmations

### "User already registered"
- Use password reset flow
- Or delete user from Supabase dashboard (development only)

### RLS blocking queries
- Check user has correct role in `staff_profiles`
- Verify RLS policies match expected auth state
- Use Supabase dashboard to test policies

---

## Related Documentation

- [02-architecture.md](02-architecture.md) - System architecture
- [../architecture/RBAC_COMPLIANCE.md](../architecture/RBAC_COMPLIANCE.md) - Role details
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth) - Official docs
