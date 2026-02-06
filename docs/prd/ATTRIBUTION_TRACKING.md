# Multi-Touch Attribution Tracking

Technical specification for tracking student acquisition journeys across multiple touchpoints.

---

## Overview

Studios need to understand:
1. **Where** students come from (first touch)
2. **What** convinced them to sign up (converting touch)
3. **Which** marketing channels drive the most value
4. **How long** the consideration journey takes

Traditional single-touch attribution misses the full picture. A student might:
1. Discover via Instagram ad
2. Return via Google search
3. Visit pricing page from email
4. Finally sign up from Google Maps

This system captures the entire journey.

---

## Data Model

### Core Tables

```sql
-- Visitor sessions (anonymous or identified)
CREATE TABLE visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL,                      -- Persistent across sessions
  member_id UUID REFERENCES member_profiles(id),  -- NULL until signup
  studio_id UUID REFERENCES studios(id),

  -- Session info
  session_started_at TIMESTAMPTZ DEFAULT NOW(),
  session_ended_at TIMESTAMPTZ,
  page_views INTEGER DEFAULT 1,

  -- First touch (entry point)
  landing_page TEXT NOT NULL,
  referrer_url TEXT,
  referrer_domain TEXT,

  -- UTM parameters
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  utm_term VARCHAR(100),

  -- Device info
  device_type VARCHAR(20),      -- mobile, tablet, desktop
  browser VARCHAR(50),
  os VARCHAR(50),

  -- Geo (approximate from IP)
  country VARCHAR(2),
  region VARCHAR(100),
  city VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attribution touchpoints (each significant interaction)
CREATE TABLE attribution_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID NOT NULL,
  member_id UUID REFERENCES member_profiles(id),
  studio_id UUID REFERENCES studios(id),
  session_id UUID REFERENCES visitor_sessions(id),

  -- Touchpoint classification
  touchpoint_type VARCHAR(50) NOT NULL,  -- page_view, form_start, booking_start, signup, purchase
  touchpoint_url TEXT,
  touchpoint_title TEXT,

  -- Attribution source
  source VARCHAR(100),          -- google, facebook, instagram, direct, email, etc.
  medium VARCHAR(100),          -- organic, cpc, social, referral, email
  campaign VARCHAR(100),
  content VARCHAR(100),

  -- Context
  is_first_touch BOOLEAN DEFAULT false,
  is_converting_touch BOOLEAN DEFAULT false,
  conversion_type VARCHAR(50),  -- signup, first_class, membership, pack_purchase

  -- Value (if conversion)
  conversion_value_cents INTEGER,

  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Conversion events
CREATE TABLE conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES member_profiles(id) NOT NULL,
  studio_id UUID REFERENCES studios(id),

  -- Conversion details
  conversion_type VARCHAR(50) NOT NULL,  -- signup, first_class, membership, pack_purchase
  conversion_value_cents INTEGER,

  -- Attribution (frozen at conversion)
  first_touch_source VARCHAR(100),
  first_touch_medium VARCHAR(100),
  first_touch_campaign VARCHAR(100),

  converting_touch_source VARCHAR(100),
  converting_touch_medium VARCHAR(100),
  converting_touch_campaign VARCHAR(100),

  -- Journey metrics
  touchpoint_count INTEGER,
  days_to_convert INTEGER,
  sessions_to_convert INTEGER,

  converted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for reporting
CREATE INDEX idx_sessions_studio_date ON visitor_sessions(studio_id, session_started_at);
CREATE INDEX idx_touchpoints_member ON attribution_touchpoints(member_id);
CREATE INDEX idx_conversions_studio_type ON conversion_events(studio_id, conversion_type, converted_at);
```

### Source Classification

```typescript
// src/lib/analytics/sourceClassifier.ts

interface SourceClassification {
  source: string;
  medium: string;
  channel: string;
}

export function classifySource(
  referrer: string | null,
  utmSource: string | null,
  utmMedium: string | null
): SourceClassification {
  // UTM params take priority
  if (utmSource && utmMedium) {
    return {
      source: utmSource,
      medium: utmMedium,
      channel: getChannel(utmMedium),
    };
  }

  // Classify by referrer
  if (!referrer) {
    return { source: "direct", medium: "none", channel: "Direct" };
  }

  const domain = new URL(referrer).hostname;

  // Search engines
  if (domain.includes("google.")) {
    return { source: "google", medium: "organic", channel: "Organic Search" };
  }
  if (domain.includes("bing.")) {
    return { source: "bing", medium: "organic", channel: "Organic Search" };
  }
  if (domain.includes("duckduckgo.")) {
    return { source: "duckduckgo", medium: "organic", channel: "Organic Search" };
  }

  // Social platforms
  if (domain.includes("instagram.") || domain.includes("l.instagram.")) {
    return { source: "instagram", medium: "social", channel: "Social" };
  }
  if (domain.includes("facebook.") || domain.includes("fb.")) {
    return { source: "facebook", medium: "social", channel: "Social" };
  }
  if (domain.includes("tiktok.")) {
    return { source: "tiktok", medium: "social", channel: "Social" };
  }
  if (domain.includes("linkedin.")) {
    return { source: "linkedin", medium: "social", channel: "Social" };
  }

  // Review/Maps platforms
  if (domain.includes("yelp.")) {
    return { source: "yelp", medium: "referral", channel: "Review Sites" };
  }
  if (domain.includes("tripadvisor.")) {
    return { source: "tripadvisor", medium: "referral", channel: "Review Sites" };
  }
  if (domain.includes("maps.google.")) {
    return { source: "google_maps", medium: "referral", channel: "Maps" };
  }
  if (domain.includes("maps.apple.")) {
    return { source: "apple_maps", medium: "referral", channel: "Maps" };
  }

  // Fitness platforms
  if (domain.includes("classpass.")) {
    return { source: "classpass", medium: "referral", channel: "Fitness Aggregators" };
  }
  if (domain.includes("mindbody.")) {
    return { source: "mindbody", medium: "referral", channel: "Fitness Aggregators" };
  }

  // Default: referral from domain
  return { source: domain, medium: "referral", channel: "Referral" };
}

function getChannel(medium: string): string {
  const channelMap: Record<string, string> = {
    organic: "Organic Search",
    cpc: "Paid Search",
    ppc: "Paid Search",
    social: "Social",
    email: "Email",
    referral: "Referral",
    affiliate: "Affiliate",
    display: "Display",
    video: "Video",
  };
  return channelMap[medium.toLowerCase()] || "Other";
}
```

---

## Tracking Implementation

### Session & Visitor Tracking

```typescript
// src/lib/analytics/sessionTracker.ts

const VISITOR_ID_KEY = "tandava_visitor_id";
const SESSION_ID_KEY = "tandava_session_id";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function initSession() {
  // Get or create visitor ID (persists forever)
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }

  // Check for existing session
  const sessionData = sessionStorage.getItem(SESSION_ID_KEY);
  let session = sessionData ? JSON.parse(sessionData) : null;

  // Create new session if expired or missing
  if (!session || Date.now() - session.lastActivity > SESSION_TIMEOUT) {
    session = createNewSession(visitorId);
  }

  // Update last activity
  session.lastActivity = Date.now();
  sessionStorage.setItem(SESSION_ID_KEY, JSON.stringify(session));

  return { visitorId, session };
}

function createNewSession(visitorId: string) {
  const urlParams = new URLSearchParams(window.location.search);

  const session = {
    id: crypto.randomUUID(),
    visitorId,
    startedAt: Date.now(),
    lastActivity: Date.now(),
    landingPage: window.location.pathname,
    referrer: document.referrer || null,
    utmSource: urlParams.get("utm_source"),
    utmMedium: urlParams.get("utm_medium"),
    utmCampaign: urlParams.get("utm_campaign"),
    utmContent: urlParams.get("utm_content"),
    utmTerm: urlParams.get("utm_term"),
  };

  // Send to server
  trackSessionStart(session);

  return session;
}

async function trackSessionStart(session: object) {
  await fetch("/api/analytics/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(session),
  });
}
```

### Touchpoint Capture

```typescript
// src/lib/analytics/touchpointTracker.ts

type TouchpointType =
  | "page_view"
  | "schedule_view"
  | "class_detail_view"
  | "pricing_view"
  | "booking_start"
  | "booking_complete"
  | "signup_start"
  | "signup_complete"
  | "purchase";

interface Touchpoint {
  type: TouchpointType;
  url: string;
  title: string;
  metadata?: Record<string, any>;
}

export function trackTouchpoint(touchpoint: Touchpoint) {
  const { visitorId, session } = initSession();
  const source = classifySource(
    session.referrer,
    session.utmSource,
    session.utmMedium
  );

  const payload = {
    visitorId,
    sessionId: session.id,
    ...touchpoint,
    ...source,
    timestamp: new Date().toISOString(),
  };

  // Use sendBeacon for reliable delivery
  navigator.sendBeacon(
    "/api/analytics/touchpoint",
    JSON.stringify(payload)
  );
}

// React hook for automatic page view tracking
export function usePageViewTracking() {
  const location = useLocation();

  useEffect(() => {
    trackTouchpoint({
      type: "page_view",
      url: location.pathname,
      title: document.title,
    });
  }, [location.pathname]);
}
```

### Conversion Attribution

```typescript
// src/lib/analytics/conversionTracker.ts

type ConversionType =
  | "signup"
  | "first_class"
  | "membership_purchase"
  | "pack_purchase"
  | "workshop_registration"
  | "training_registration";

export async function trackConversion(
  memberId: string,
  type: ConversionType,
  valueCents: number
) {
  const { visitorId, session } = initSession();

  // Fetch full journey for attribution
  const response = await fetch(
    `/api/analytics/journey/${visitorId}`
  );
  const journey = await response.json();

  // Calculate attribution
  const firstTouch = journey.touchpoints[0];
  const lastTouch = journey.touchpoints[journey.touchpoints.length - 1];

  const conversionEvent = {
    memberId,
    visitorId,
    conversionType: type,
    valueCents,

    // First touch attribution
    firstTouchSource: firstTouch?.source,
    firstTouchMedium: firstTouch?.medium,
    firstTouchCampaign: firstTouch?.campaign,

    // Last touch attribution
    convertingTouchSource: lastTouch?.source,
    convertingTouchMedium: lastTouch?.medium,
    convertingTouchCampaign: lastTouch?.campaign,

    // Journey metrics
    touchpointCount: journey.touchpoints.length,
    daysToConvert: calculateDays(firstTouch?.timestamp, new Date()),
    sessionsToConvert: journey.sessions.length,
  };

  await fetch("/api/analytics/conversion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(conversionEvent),
  });

  // Link visitor to member for future visits
  localStorage.setItem("tandava_member_id", memberId);
}
```

---

## Attribution Models

### Model Implementations

```typescript
// src/lib/analytics/attributionModels.ts

interface Touchpoint {
  source: string;
  medium: string;
  timestamp: Date;
}

interface AttributionResult {
  source: string;
  medium: string;
  credit: number; // 0-1, sums to 1
}

// First Touch: 100% credit to first interaction
export function firstTouchAttribution(
  touchpoints: Touchpoint[]
): AttributionResult[] {
  if (touchpoints.length === 0) return [];

  const first = touchpoints[0];
  return [{
    source: first.source,
    medium: first.medium,
    credit: 1.0,
  }];
}

// Last Touch: 100% credit to final interaction
export function lastTouchAttribution(
  touchpoints: Touchpoint[]
): AttributionResult[] {
  if (touchpoints.length === 0) return [];

  const last = touchpoints[touchpoints.length - 1];
  return [{
    source: last.source,
    medium: last.medium,
    credit: 1.0,
  }];
}

// Linear: Equal credit to all touchpoints
export function linearAttribution(
  touchpoints: Touchpoint[]
): AttributionResult[] {
  if (touchpoints.length === 0) return [];

  const creditPerTouch = 1.0 / touchpoints.length;
  const results: Map<string, AttributionResult> = new Map();

  for (const tp of touchpoints) {
    const key = `${tp.source}|${tp.medium}`;
    const existing = results.get(key);
    if (existing) {
      existing.credit += creditPerTouch;
    } else {
      results.set(key, {
        source: tp.source,
        medium: tp.medium,
        credit: creditPerTouch,
      });
    }
  }

  return Array.from(results.values());
}

// Time Decay: More recent touchpoints get more credit
export function timeDecayAttribution(
  touchpoints: Touchpoint[],
  halfLifeDays: number = 7
): AttributionResult[] {
  if (touchpoints.length === 0) return [];

  const now = new Date();
  const results: Map<string, number> = new Map();
  let totalWeight = 0;

  for (const tp of touchpoints) {
    const daysAgo = (now.getTime() - tp.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const weight = Math.pow(0.5, daysAgo / halfLifeDays);
    totalWeight += weight;

    const key = `${tp.source}|${tp.medium}`;
    results.set(key, (results.get(key) || 0) + weight);
  }

  // Normalize to sum to 1
  return Array.from(results.entries()).map(([key, weight]) => {
    const [source, medium] = key.split("|");
    return {
      source,
      medium,
      credit: weight / totalWeight,
    };
  });
}

// Position-Based (U-shaped): 40% first, 40% last, 20% middle
export function positionBasedAttribution(
  touchpoints: Touchpoint[]
): AttributionResult[] {
  if (touchpoints.length === 0) return [];
  if (touchpoints.length === 1) {
    return [{ source: touchpoints[0].source, medium: touchpoints[0].medium, credit: 1.0 }];
  }

  const results: Map<string, number> = new Map();

  for (let i = 0; i < touchpoints.length; i++) {
    const tp = touchpoints[i];
    const key = `${tp.source}|${tp.medium}`;
    let credit: number;

    if (i === 0) {
      credit = 0.4; // First touch: 40%
    } else if (i === touchpoints.length - 1) {
      credit = 0.4; // Last touch: 40%
    } else {
      credit = 0.2 / (touchpoints.length - 2); // Split 20% among middle
    }

    results.set(key, (results.get(key) || 0) + credit);
  }

  return Array.from(results.entries()).map(([key, credit]) => {
    const [source, medium] = key.split("|");
    return { source, medium, credit };
  });
}
```

---

## Reporting Queries

### Channel Performance

```sql
-- Channel performance with multiple attribution models
WITH conversions AS (
  SELECT
    c.*,
    -- First touch channel
    COALESCE(c.first_touch_source, 'unknown') as ft_source,
    COALESCE(c.first_touch_medium, 'unknown') as ft_medium,
    -- Last touch channel
    COALESCE(c.converting_touch_source, 'unknown') as lt_source,
    COALESCE(c.converting_touch_medium, 'unknown') as lt_medium
  FROM conversion_events c
  WHERE c.studio_id = $1
    AND c.converted_at >= $2
    AND c.converted_at < $3
)
SELECT
  -- First Touch Model
  ft_source || ' / ' || ft_medium as channel,
  'First Touch' as model,
  COUNT(*) as conversions,
  SUM(conversion_value_cents) / 100.0 as revenue
FROM conversions
GROUP BY ft_source, ft_medium

UNION ALL

SELECT
  -- Last Touch Model
  lt_source || ' / ' || lt_medium as channel,
  'Last Touch' as model,
  COUNT(*) as conversions,
  SUM(conversion_value_cents) / 100.0 as revenue
FROM conversions
GROUP BY lt_source, lt_medium

ORDER BY model, revenue DESC;
```

### Journey Analysis

```sql
-- Average journey metrics by channel
SELECT
  first_touch_source as source,
  first_touch_medium as medium,
  COUNT(*) as conversions,
  AVG(touchpoint_count) as avg_touchpoints,
  AVG(days_to_convert) as avg_days,
  AVG(sessions_to_convert) as avg_sessions,
  SUM(conversion_value_cents) / 100.0 as total_revenue
FROM conversion_events
WHERE studio_id = $1
  AND converted_at >= $2
GROUP BY first_touch_source, first_touch_medium
ORDER BY total_revenue DESC;
```

### Conversion Path Analysis

```sql
-- Most common conversion paths
WITH paths AS (
  SELECT
    member_id,
    string_agg(source || ' / ' || medium, ' → ' ORDER BY timestamp) as path
  FROM attribution_touchpoints
  WHERE is_converting_touch = true OR is_first_touch = true
  GROUP BY member_id
)
SELECT
  path,
  COUNT(*) as frequency
FROM paths
GROUP BY path
ORDER BY frequency DESC
LIMIT 20;
```

---

## Privacy & Compliance

### Data Retention

```sql
-- Purge old anonymous session data (90 days)
DELETE FROM visitor_sessions
WHERE member_id IS NULL
  AND session_started_at < NOW() - INTERVAL '90 days';

-- Purge old touchpoints without conversion (90 days)
DELETE FROM attribution_touchpoints
WHERE member_id IS NULL
  AND timestamp < NOW() - INTERVAL '90 days';

-- Keep conversion data for reporting (7 years for tax/business)
-- Member-linked data follows GDPR deletion requests
```

### Cookie Consent Integration

```typescript
// Only track if consent given
export function initTracking() {
  const consent = getConsentStatus();

  if (consent.analytics) {
    initSession();
  } else {
    // Basic page view tracking without personal identifiers
    trackAnonymousPageView();
  }
}
```

### GDPR Data Export

```typescript
// Export all member attribution data
export async function exportMemberData(memberId: string) {
  const sessions = await db.query(
    "SELECT * FROM visitor_sessions WHERE member_id = $1",
    [memberId]
  );
  const touchpoints = await db.query(
    "SELECT * FROM attribution_touchpoints WHERE member_id = $1",
    [memberId]
  );
  const conversions = await db.query(
    "SELECT * FROM conversion_events WHERE member_id = $1",
    [memberId]
  );

  return { sessions, touchpoints, conversions };
}
```

---

## Dashboard Integration

### Analytics Hub Display

The attribution data appears in `/manage/analytics`:

1. **Overview Tab**: Channel breakdown with model selector
2. **Journeys Tab**: Common paths visualization
3. **ROI Tab**: Campaign performance with cost data
4. **Sources Tab**: Detailed source/medium breakdown

### Key Metrics

| Metric | Description |
|--------|-------------|
| Sessions | Total visitor sessions |
| New Visitors | First-time visitor sessions |
| Signups | Member account creations |
| Signup Rate | Signups / New Visitors |
| First Classes | First class completions |
| Activation Rate | First Classes / Signups |
| Revenue | Total attributed revenue |
| ROAS | Revenue / Ad Spend (if tracked) |
| Avg Journey Length | Days from first touch to conversion |
| Avg Touchpoints | Interactions before conversion |

---

*Attribution data helps studios invest in channels that actually drive member acquisition.*
