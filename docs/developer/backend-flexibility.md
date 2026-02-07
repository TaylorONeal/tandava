# Backend Flexibility Guide

Tandava uses a **backend abstraction layer** that decouples application code from any specific backend provider. The default implementation uses Supabase, but you can swap in raw PostgreSQL, Firebase, a custom REST API, or any other backend by implementing a small set of interfaces.

## Architecture

```
Application Code
     │
     ▼
src/lib/backend/index.ts   ← single import point
     │
     ▼
src/lib/backend/types.ts   ← provider interfaces (AuthProvider, DataProvider, ApiProvider)
     │
     ├── src/lib/backend/supabase.ts    ← default implementation
     ├── (your-custom-provider.ts)      ← your implementation
     └── ...
```

All application code imports from `@/lib/backend` — **never** from a specific provider module directly.

```tsx
// ✅ Correct — uses the abstraction
import { auth, data, api, isBackendConfigured } from "@/lib/backend";

// ❌ Wrong — bypasses the abstraction
import { supabase } from "@/lib/supabase";
```

## The Backend Interface

The backend is split into three providers:

### AuthProvider

Handles authentication — sign in, sign up, OAuth, session management.

```typescript
interface AuthProvider {
  signInWithEmail(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }>;
  signUpWithEmail(email: string, password: string, metadata: SignUpMetadata): Promise<{ error: AuthError | null }>;
  signInWithOAuth(provider: "google" | "apple"): Promise<{ error: AuthError | null }>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<{ error: AuthError | null }>;
  getSession(): Promise<{ user: AuthUser | null }>;
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void;
}
```

### DataProvider

Handles database reads and writes.

```typescript
interface DataProvider {
  getProfile(userId: string): Promise<DataResult<Profile>>;
  createMessage(input: CreateMessageInput): Promise<MutationResult>;
}
```

As you add features, extend `DataProvider` with new methods rather than accessing the database directly.

### ApiProvider

Handles serverless function / API endpoint calls.

```typescript
interface ApiProvider {
  invoke<T = unknown>(functionName: string, body: Record<string, unknown>): Promise<ApiResult<T>>;
}
```

### Combined Backend

```typescript
interface Backend {
  auth: AuthProvider;
  data: DataProvider;
  api: ApiProvider;
  isConfigured(): boolean;
}
```

## Supabase (Default)

Supabase is the recommended and default backend. It provides all four concerns in a single service:

| Concern | Supabase Feature |
|---------|-----------------|
| **Database** | PostgreSQL with Row-Level Security (RLS) |
| **Auth** | Built-in auth (email, OAuth, magic links, MFA) |
| **Serverless Functions** | Edge Functions (Deno runtime) |
| **Realtime** | Websocket subscriptions (future use) |

### What you get with Supabase

- **Zero custom backend code** — no Express/Fastify server to deploy
- **Row-Level Security** — authorization enforced at the database level, not in application code
- **Auth + DB in one SDK** — `@supabase/supabase-js` handles both
- **Edge Functions** — deploy serverless functions alongside your database
- **Free tier** — generous free tier for small studios

### Setup

See [setup.md](./setup.md) for full Supabase configuration instructions.

## Raw PostgreSQL Alternative

If you prefer to manage your own PostgreSQL database (e.g., for on-premise deployments, existing infrastructure, or compliance requirements), here's what changes:

### What You Need to Build

| Supabase Feature | DIY Equivalent |
|-----------------|----------------|
| PostgreSQL + RLS | PostgreSQL (you manage it) + application-level authorization middleware |
| Supabase Auth | Passport.js, Auth0, Clerk, or custom JWT-based auth |
| Edge Functions | Express/Fastify/Hono API routes on your own server |
| `@supabase/supabase-js` | `pg` / Prisma / Drizzle ORM + `fetch` for API calls |

### What Stays the Same

- All React components, pages, and UI
- The `@/lib/backend` import interface
- Types in `src/types/database.ts` and `src/types/roles.ts`
- Stripe integration (frontend is unchanged; webhooks move to your server)
- Email system (already provider-agnostic)
- SEO, Sentry, and all other frontend features

### Implementation Steps

1. **Create your provider file** (e.g., `src/lib/backend/express-pg.ts`)
2. **Implement the `Backend` interface** — map your API calls to the same method signatures
3. **Swap the import** in `src/lib/backend/index.ts`:

```typescript
// Before (Supabase):
import { supabaseBackend as activeBackend } from "./supabase";

// After (your custom backend):
import { myBackend as activeBackend } from "./express-pg";
```

4. **Deploy your backend server** with auth, database, and API routes
5. **Migrate the database schema** — the SQL in `supabase/migrations/001_initial_schema.sql` is standard PostgreSQL (strip the RLS policies and add authorization middleware instead)

### Example: Express + PostgreSQL Provider

```typescript
// src/lib/backend/express-pg.ts
import type { Backend, AuthProvider, DataProvider, ApiProvider } from "./types";

const API_BASE = import.meta.env.VITE_API_URL;

const expressAuth: AuthProvider = {
  async signInWithEmail(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include", // for HTTP-only cookies
    });
    const body = await res.json();
    if (!res.ok) return { user: null, error: { message: body.message } };
    return { user: { id: body.user.id, email: body.user.email }, error: null };
  },

  // ... implement remaining AuthProvider methods
};

const expressData: DataProvider = {
  async getProfile(userId) {
    const res = await fetch(`${API_BASE}/profiles/${userId}`, {
      credentials: "include",
    });
    const body = await res.json();
    if (!res.ok) return { data: null, error: { message: body.message } };
    return { data: body, error: null };
  },

  // ... implement remaining DataProvider methods
};

const expressApi: ApiProvider = {
  async invoke(functionName, body) {
    const res = await fetch(`${API_BASE}/functions/${functionName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) return { data: null, error: { message: data.message } };
    return { data, error: null };
  },
};

export const expressBackend: Backend = {
  auth: expressAuth,
  data: expressData,
  api: expressApi,
  isConfigured: () => Boolean(import.meta.env.VITE_API_URL),
};
```

### Tradeoff Summary

| Factor | Supabase | Raw PostgreSQL |
|--------|----------|---------------|
| **Setup time** | Minutes (hosted service) | Hours–days (server setup) |
| **Hosting** | Managed (supabase.com or self-host) | You manage |
| **Auth** | Built-in, battle-tested | Build or integrate (Passport, Auth0) |
| **Authorization** | RLS at DB level | Middleware in your API |
| **Serverless functions** | Edge Functions (included) | Deploy your own API server |
| **Cost at scale** | Supabase pricing tiers | Your infrastructure costs |
| **Vendor lock-in** | Some (SDK-specific patterns) | None (standard PostgreSQL) |
| **Offline/on-premise** | Supabase self-host option | Full control |

### Recommendation

- **Starting out or small team?** Use Supabase. Zero backend code, fast iteration.
- **Enterprise/on-premise requirement?** Build a custom provider. The abstraction layer means your frontend code doesn't change.
- **Migrating later?** Start with Supabase, then implement a custom provider when needed. Both can coexist during migration.

## Extending the Data Provider

When adding new features that need database access, add methods to the `DataProvider` interface:

```typescript
// 1. Add to src/lib/backend/types.ts
export interface DataProvider {
  getProfile(userId: string): Promise<DataResult<Profile>>;
  createMessage(input: CreateMessageInput): Promise<MutationResult>;
  // New method:
  getStudioClasses(studioId: string): Promise<DataResult<ClassRow[]>>;
}

// 2. Implement in src/lib/backend/supabase.ts
const supabaseData: DataProvider = {
  // ... existing methods
  async getStudioClasses(studioId) {
    const { data, error } = await getClient()
      .from("classes")
      .select("*")
      .eq("studio_id", studioId)
      .order("start_time", { ascending: true });
    return { data, error: error ? { message: error.message } : null };
  },
};

// 3. Use in your component
import { data } from "@/lib/backend";
const { data: classes, error } = await data.getStudioClasses(studioId);
```

## Demo Mode

When `isConfigured()` returns `false` (no backend credentials set), the application runs in **demo mode**:

- Auth methods return mock data (no real sign-in)
- Data methods are skipped; components use placeholder data
- API calls are no-ops
- This allows the frontend to run completely standalone for demos and development

See `src/contexts/AuthContext.tsx` for how demo mode is handled in the auth flow.
