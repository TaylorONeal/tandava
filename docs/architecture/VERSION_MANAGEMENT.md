# Version Management & Upgrade Strategy

How to safely upgrade Tandava without losing data or breaking functionality for existing studios, teachers, and members.

## Table of Contents
1. [Version Philosophy](#version-philosophy)
2. [Semantic Versioning](#semantic-versioning)
3. [Database Migrations](#database-migrations)
4. [API Versioning](#api-versioning)
5. [Frontend Updates](#frontend-updates)
6. [Rollback Procedures](#rollback-procedures)
7. [Multi-Tenant Considerations](#multi-tenant-considerations)

---

## Version Philosophy

### Core Principles

1. **Zero Data Loss** - Migrations must be reversible and tested
2. **Minimal Downtime** - Deploy without interrupting active users
3. **Backward Compatibility** - Old clients work with new server (grace period)
4. **Forward Compatibility** - New clients gracefully handle old data
5. **Gradual Rollout** - Canary deployments before full release

### Version Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Tandava Platform                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React SPA)           │  v2.3.1                   │
│  Backend API (Supabase)         │  v2.3.0                   │
│  Database Schema                │  Migration #042           │
│  Mobile Apps (iOS/Android)      │  v2.2.0                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Semantic Versioning

We follow [SemVer](https://semver.org/) strictly:

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └── Bug fixes, security patches (no API changes)
  │     └──────── New features, backward-compatible changes
  └────────────── Breaking changes, major rewrites
```

### Version Examples

| Version | Type | Changes |
|---------|------|---------|
| 1.0.0 → 1.0.1 | Patch | Fix booking confirmation email, patch security issue |
| 1.0.1 → 1.1.0 | Minor | Add waitlist feature, new instructor dashboard widget |
| 1.1.0 → 2.0.0 | Major | New membership model, requires data migration |

### When to Bump

**PATCH (1.0.x)**
- Bug fixes
- Security patches
- Performance improvements
- Documentation updates
- Dependency updates (non-breaking)

**MINOR (1.x.0)**
- New features (backward compatible)
- New API endpoints
- New UI components
- New configuration options
- Deprecations (with grace period)

**MAJOR (x.0.0)**
- Breaking API changes
- Data model changes requiring migration
- Removed deprecated features
- Minimum dependency version bumps

---

## Database Migrations

### Migration File Structure

```
supabase/migrations/
├── 001_initial_schema.sql
├── 002_add_user_profiles.sql
├── 003_create_studios_table.sql
├── ...
├── 041_add_virtual_class_fields.sql
├── 042_add_notification_preferences.sql
└── 043_add_feature_toggles.sql
```

### Migration Best Practices

#### 1. Always Reversible

```sql
-- 042_add_notification_preferences.sql

-- Up Migration
ALTER TABLE member_profiles
ADD COLUMN notification_prefs JSONB DEFAULT '{"email": true, "push": true, "sms": false}';

-- Down Migration (commented, for reference)
-- ALTER TABLE member_profiles DROP COLUMN notification_prefs;
```

#### 2. Non-Destructive by Default

```sql
-- WRONG: Destructive rename
ALTER TABLE users RENAME TO members;

-- RIGHT: Add new, migrate data, deprecate old
ALTER TABLE users ADD COLUMN member_type VARCHAR(50);
-- Later migration removes old column after data verified
```

#### 3. Handle NULL Gracefully

```sql
-- WRONG: NOT NULL on existing data
ALTER TABLE bookings ADD COLUMN source VARCHAR(50) NOT NULL;

-- RIGHT: Default value, then backfill
ALTER TABLE bookings ADD COLUMN source VARCHAR(50) DEFAULT 'web';
UPDATE bookings SET source = 'web' WHERE source IS NULL;
ALTER TABLE bookings ALTER COLUMN source SET NOT NULL;
```

#### 4. Index Concurrently

```sql
-- WRONG: Locks table during index creation
CREATE INDEX idx_bookings_member ON bookings(member_id);

-- RIGHT: Non-blocking (PostgreSQL)
CREATE INDEX CONCURRENTLY idx_bookings_member ON bookings(member_id);
```

### Migration Testing Checklist

- [ ] Run on copy of production data
- [ ] Verify data integrity after migration
- [ ] Test rollback procedure
- [ ] Measure migration duration
- [ ] Check for table locks
- [ ] Verify RLS policies still work
- [ ] Test from all client types (web, iOS, Android)

---

## API Versioning

### Versioning Strategy

We use **URL path versioning** for major changes:

```
/api/v1/bookings      # Current stable
/api/v2/bookings      # Next major version (when needed)
```

For minor/patch changes, the same version handles backward compatibility.

### Deprecation Policy

1. **Announce deprecation** - Document in changelog, add header warnings
2. **Grace period** - Minimum 3 months before removal
3. **Monitor usage** - Track deprecated endpoint calls
4. **Notify users** - Email studios still using deprecated features
5. **Remove** - Only after zero usage or forced migration

### Header Warnings

```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 1 Jun 2026 00:00:00 GMT
Link: </api/v2/bookings>; rel="successor-version"
```

### Client Compatibility

```typescript
// Frontend should handle version gracefully
const API_VERSION = 'v1';

async function fetchBookings() {
  const response = await fetch(`/api/${API_VERSION}/bookings`);

  // Check for deprecation warning
  if (response.headers.get('Deprecation')) {
    console.warn('API version deprecated, upgrade soon');
    // Optionally notify admins
  }

  return response.json();
}
```

---

## Frontend Updates

### Update Types

#### 1. Hot Updates (No App Store Approval)

With Capacitor, we can update the web bundle without store approval:

```bash
# Build new web bundle
npm run build

# Deploy to CDN/server
# Capacitor apps fetch latest bundle on next launch
```

**Use for:**
- Bug fixes
- Content changes
- Minor UI tweaks
- Copy updates

**Limitations:**
- Cannot change native code
- Cannot add new native plugins
- Some stores (Apple) may reject if overused

#### 2. Store Updates (Requires Approval)

```bash
# Bump version in package.json and native projects
npm version patch

# Build native apps
npx cap sync
npx cap build ios
npx cap build android

# Submit to stores
```

**Use for:**
- New features
- Native functionality changes
- Major UI redesigns
- New Capacitor plugins

### Version Display

Show version in app for debugging:

```typescript
// src/config/version.ts
export const APP_VERSION = '2.3.1';
export const BUILD_NUMBER = '42';
export const API_VERSION = 'v1';

// Display in Settings or About screen
function VersionInfo() {
  return (
    <div className="text-xs text-muted-foreground">
      Version {APP_VERSION} ({BUILD_NUMBER})
    </div>
  );
}
```

---

## Rollback Procedures

### Database Rollback

```bash
# List applied migrations
supabase migration list

# Revert last migration (if reversible)
supabase migration revert

# For complex rollbacks, restore from backup
supabase db restore --backup-id <backup_id>
```

### Frontend Rollback

```bash
# Revert to previous commit
git revert HEAD

# Rebuild and deploy
npm run build
npm run deploy

# For mobile apps, submit expedited review
# Apple: Request expedited review with explanation
# Google: Use staged rollout → halt → rollback
```

### Rollback Checklist

- [ ] Identify issue scope (data? UI? API?)
- [ ] Communicate to affected users
- [ ] Execute rollback procedure
- [ ] Verify fix in staging
- [ ] Monitor post-rollback
- [ ] Post-mortem and prevention

---

## Multi-Tenant Considerations

### Studio-Specific Upgrades

Different studios may be on different versions:

```sql
-- Studio feature flags table
CREATE TABLE studio_feature_flags (
  studio_id UUID REFERENCES studios(id),
  feature_key VARCHAR(100),
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0,
  PRIMARY KEY (studio_id, feature_key)
);

-- Check if feature enabled for studio
CREATE FUNCTION is_feature_enabled(p_studio_id UUID, p_feature TEXT)
RETURNS BOOLEAN AS $$
  SELECT enabled FROM studio_feature_flags
  WHERE studio_id = p_studio_id AND feature_key = p_feature;
$$ LANGUAGE sql;
```

### Gradual Rollout

```typescript
// Feature rollout by percentage
function shouldShowFeature(studioId: string, feature: string): boolean {
  const flag = await getFeatureFlag(studioId, feature);

  if (!flag) return false;
  if (flag.enabled) return true;

  // Percentage-based rollout
  const hash = hashString(studioId + feature);
  return (hash % 100) < flag.rolloutPercentage;
}
```

### Data Isolation

Each studio's data is isolated via RLS:

```sql
-- All queries automatically filtered by studio
CREATE POLICY "Studios see only their data" ON bookings
  FOR ALL USING (
    studio_id = current_setting('app.current_studio_id')::uuid
  );
```

Migrations must maintain this isolation:
- Never expose cross-studio data
- Test RLS policies after each migration
- Audit logs for cross-tenant access

---

## Quick Reference

### Pre-Deployment Checklist

- [ ] Version bumped appropriately
- [ ] Changelog updated
- [ ] Migrations tested on staging
- [ ] API backward compatibility verified
- [ ] Feature flags configured
- [ ] Rollback procedure documented
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment

### Emergency Contacts

```
Database Issues: [DBA contact]
API Issues: [Backend lead]
Frontend Issues: [Frontend lead]
Mobile App Issues: [Mobile lead]
Escalation: [Engineering manager]
```

---

*Last Updated: February 2026*
