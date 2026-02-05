# PRD-011: Campaign & Advertising Hub

## Overview
**Phase:** 4
**Priority:** P0
**Status:** Planned
**Owner:** TBD

---

## Jobs to Be Done

### Job 1: Unified Campaign Management
**When** I'm planning a marketing initiative (new class launch, seasonal promo, referral push),
**I want to** create and manage the campaign in one place,
**So I can** coordinate messaging, tracking, and analysis without switching tools.

### Job 2: Ad Performance Visibility
**When** I'm spending money on Facebook/Instagram/Google ads,
**I want to** see which ads are driving actual bookings and revenue,
**So I can** optimize my ad spend for real business outcomes.

### Job 3: Attribution Clarity
**When** a new member signs up,
**I want to** know which marketing touchpoint(s) influenced them,
**So I can** understand what's working and double down on effective channels.

### Job 4: Promotional Coordination
**When** running a promo code campaign,
**I want to** coordinate the promo, landing page, email, and ads together,
**So I can** ensure consistent messaging and easy tracking.

---

## User Stories

### US-11.1: Campaign Dashboard
**As a** studio owner/marketing manager,
**I want** a central dashboard showing all active and past campaigns,
**So that** I can quickly understand my marketing performance.

**Acceptance Criteria:**
- [ ] List view of campaigns with: name, status, dates, channel(s), performance
- [ ] Filter by: status (active/paused/ended), channel, date range
- [ ] Key metrics per campaign: impressions, clicks, conversions, revenue, ROI
- [ ] Quick actions: pause, duplicate, view details
- [ ] "Create Campaign" prominent CTA

### US-11.2: Campaign Creation Wizard
**As a** studio owner,
**I want** a guided flow to create coordinated marketing campaigns,
**So that** I don't miss any important elements.

**Acceptance Criteria:**
- [ ] Step 1: Campaign basics (name, goal, dates, budget)
- [ ] Step 2: Target audience (new vs existing, segments, demographics)
- [ ] Step 3: Channels (email, SMS, social, paid ads)
- [ ] Step 4: Content (copy, images, landing page)
- [ ] Step 5: Promo code (optional, auto-create or link existing)
- [ ] Step 6: Tracking setup (UTM parameters auto-generated)
- [ ] Step 7: Review and launch
- [ ] Save as draft, schedule, or launch immediately

### US-11.3: UTM Builder & Link Tracking
**As a** marketer,
**I want** easy UTM parameter generation and short link creation,
**So that** I can accurately track traffic sources.

**Acceptance Criteria:**
- [ ] UTM builder with: source, medium, campaign, content, term
- [ ] Auto-generate UTMs based on campaign and channel
- [ ] Short link creation (tandava.link/xyz or studio's domain)
- [ ] Click tracking on short links
- [ ] QR code generation for print materials
- [ ] Copy-to-clipboard for easy use

### US-11.4: Ad Platform Integration
**As a** studio owner running paid ads,
**I want to** connect my Meta (Facebook/Instagram) and Google Ads accounts,
**So that** I can see ad performance alongside studio data.

**Acceptance Criteria:**
- [ ] OAuth connection to Meta Ads Manager
- [ ] OAuth connection to Google Ads
- [ ] Import: campaigns, ad sets, ads, spend, impressions, clicks
- [ ] Match ad clicks to Tandava conversions (via pixel/UTM)
- [ ] Show true CAC (Customer Acquisition Cost) per ad
- [ ] Refresh data daily (or manual refresh)

### US-11.5: Conversion Tracking Pixels
**As a** studio owner,
**I want to** have Meta Pixel and Google Analytics properly configured,
**So that** ad platforms can optimize for actual conversions.

**Acceptance Criteria:**
- [ ] Easy pixel setup (paste pixel ID, we handle the rest)
- [ ] Fire events: PageView, ViewContent, InitiateCheckout, Purchase, Lead
- [ ] Event parameters: value, currency, content_type, content_id
- [ ] Conversion API (server-side) for better accuracy
- [ ] Test mode to verify pixel firing
- [ ] GDPR/CCPA consent integration

### US-11.6: Attribution Reporting
**As a** studio owner,
**I want to** see how members discovered and converted,
**So that** I understand the customer journey.

**Acceptance Criteria:**
- [ ] First-touch attribution: what originally brought them
- [ ] Last-touch attribution: what converted them
- [ ] Multi-touch view: all touchpoints in journey
- [ ] Attribution by: channel, campaign, ad, content
- [ ] Time-to-conversion analysis
- [ ] Cohort comparison (e.g., Facebook leads vs Google leads retention)

### US-11.7: A/B Testing for Landing Pages
**As a** marketer,
**I want to** test different landing page variants,
**So that** I can optimize for conversions.

**Acceptance Criteria:**
- [ ] Create variant of existing landing page
- [ ] Split traffic (50/50 or custom)
- [ ] Track conversions per variant
- [ ] Statistical significance indicator
- [ ] Declare winner and redirect all traffic
- [ ] Test history for learnings

---

## Edge Cases

### EC-1: Ad Platform Connection Expires
**Scenario:** OAuth token expires for Meta/Google.
**Handling:**
- Show warning in campaign hub
- Send email to admin
- Continue showing cached data with "Last updated" timestamp
- One-click re-authentication flow

### EC-2: Attribution Conflict
**Scenario:** User clicks Facebook ad, then later searches Google and clicks organic.
**Handling:**
- Record both touchpoints
- Show first-touch as Facebook, last-touch as organic
- Allow studio to choose their attribution model
- Default: last-touch for conversion credit

### EC-3: Pixel Blocked
**Scenario:** User has ad blocker, pixel doesn't fire.
**Handling:**
- Server-side Conversion API as backup
- Log conversion in Tandava regardless
- Show estimated impact of blocked pixels in reports

### EC-4: Campaign Runs Over Budget
**Scenario:** Promo code has no usage limit and goes viral.
**Handling:**
- Alert when redemptions exceed threshold
- Option to auto-pause promo at limit
- Real-time spend tracking in campaign view

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Campaign creation rate | 2+/month avg | Campaigns created / active studios |
| Ad platform connection rate | 40%+ | Studios with connected ad accounts |
| Attribution accuracy | 85%+ | Attributed conversions / total conversions |
| CAC visibility | 90%+ | Conversions with known CAC |
| A/B test completion | 70%+ | Tests reaching significance / tests started |

---

## Technical Design

### Database Schema

```sql
-- Marketing campaigns
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT,  -- 'new_members', 'reactivation', 'event_promotion', 'awareness'

  -- Timeline
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'ended')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,

  -- Budget
  budget_cents INTEGER,
  spent_cents INTEGER DEFAULT 0,

  -- Targeting
  target_audience JSONB,  -- segments, demographics, etc.

  -- Channels
  channels TEXT[],  -- 'email', 'sms', 'meta', 'google', 'organic_social'

  -- Linked resources
  promo_code_id UUID REFERENCES promo_codes(id),
  landing_page_id UUID REFERENCES landing_pages(id),

  -- UTM defaults
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Performance (denormalized for quick access)
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Campaign links (tracked short links)
CREATE TABLE campaign_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,

  -- Link info
  short_code TEXT NOT NULL UNIQUE,
  destination_url TEXT NOT NULL,

  -- UTM parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Tracking
  click_count INTEGER DEFAULT 0,
  unique_click_count INTEGER DEFAULT 0,
  last_clicked_at TIMESTAMPTZ,

  -- QR code
  qr_code_url TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Link clicks
CREATE TABLE campaign_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES campaign_links(id) ON DELETE CASCADE,

  -- Visitor info
  visitor_id TEXT,  -- Anonymous ID or profile_id
  ip_address INET,
  user_agent TEXT,
  referer TEXT,

  -- Geo (from IP)
  country TEXT,
  region TEXT,
  city TEXT,

  clicked_at TIMESTAMPTZ DEFAULT now()
);

-- Ad platform connections
CREATE TABLE ad_platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  platform TEXT NOT NULL CHECK (platform IN ('meta', 'google', 'tiktok')),

  -- OAuth
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Account info
  account_id TEXT,
  account_name TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, platform)
);

-- Imported ad data
CREATE TABLE ad_platform_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES ad_platform_connections(id) ON DELETE CASCADE,

  -- External IDs
  platform_campaign_id TEXT NOT NULL,
  platform_adset_id TEXT,
  platform_ad_id TEXT,

  -- Names
  campaign_name TEXT,
  adset_name TEXT,
  ad_name TEXT,

  -- Metrics (daily rollup)
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend_cents INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,  -- Platform-reported
  platform_cpa_cents INTEGER,

  -- Tandava-attributed
  tandava_conversions INTEGER DEFAULT 0,
  tandava_revenue_cents INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(connection_id, platform_campaign_id, platform_adset_id, platform_ad_id, date)
);

-- Conversion attribution
CREATE TABLE conversion_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- What converted
  profile_id UUID REFERENCES profiles(id),
  conversion_type TEXT NOT NULL,  -- 'signup', 'first_booking', 'purchase'
  conversion_value_cents INTEGER,
  converted_at TIMESTAMPTZ NOT NULL,

  -- First touch
  first_touch_source TEXT,
  first_touch_medium TEXT,
  first_touch_campaign TEXT,
  first_touch_at TIMESTAMPTZ,

  -- Last touch
  last_touch_source TEXT,
  last_touch_medium TEXT,
  last_touch_campaign TEXT,
  last_touch_at TIMESTAMPTZ,

  -- All touches
  touchpoints JSONB,  -- Array of all touchpoints

  -- Links
  campaign_id UUID REFERENCES marketing_campaigns(id),
  campaign_link_id UUID REFERENCES campaign_links(id),
  ad_platform_campaign_id UUID REFERENCES ad_platform_campaigns(id),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- A/B tests
CREATE TABLE ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- What we're testing
  test_type TEXT NOT NULL CHECK (test_type IN ('landing_page', 'email', 'cta')),

  -- Variants
  control_id UUID NOT NULL,  -- Landing page ID, email template ID, etc.
  variant_id UUID NOT NULL,

  -- Traffic split
  control_weight INTEGER DEFAULT 50,  -- Percentage to control

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  winner TEXT,  -- 'control', 'variant', null

  -- Results
  control_visitors INTEGER DEFAULT 0,
  control_conversions INTEGER DEFAULT 0,
  variant_visitors INTEGER DEFAULT 0,
  variant_conversions INTEGER DEFAULT 0,

  -- Statistical significance
  confidence_level NUMERIC(5,2),  -- e.g., 95.5

  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Pixel Events

```typescript
// Standard events to fire
const PIXEL_EVENTS = {
  PAGE_VIEW: 'PageView',
  VIEW_CONTENT: 'ViewContent',        // View class/offering
  INITIATE_CHECKOUT: 'InitiateCheckout', // Start booking
  ADD_TO_CART: 'AddToCart',           // Add to cart (if applicable)
  PURCHASE: 'Purchase',               // Complete booking/purchase
  LEAD: 'Lead',                       // Newsletter signup, trial request
  COMPLETE_REGISTRATION: 'CompleteRegistration', // Account created
  SCHEDULE: 'Schedule',               // Book a class (custom)
};

// Event parameters
interface PixelEventParams {
  value?: number;
  currency?: string;
  content_type?: string;  // 'class', 'membership', 'event'
  content_id?: string;
  content_name?: string;
  num_items?: number;
}
```

---

## Dependencies

- Meta Marketing API access
- Google Ads API access
- Consent management for GDPR/CCPA

---

## Rollout Plan

1. **Phase A:** Campaign management + UTM builder (no integrations)
2. **Phase B:** Link tracking + basic attribution
3. **Phase C:** Meta Pixel integration
4. **Phase D:** Google Analytics integration
5. **Phase E:** Ad platform connections + full attribution
6. **GA:** A/B testing

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-02-05 | 1.0 | Claude | Initial PRD |
