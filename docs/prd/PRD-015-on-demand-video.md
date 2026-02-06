# PRD-015: On-Demand Video & Virtual Classes

## Overview
**Phase:** 9
**Priority:** P1
**Status:** Planned
**Owner:** TBD
**Dependencies:** Membership system, payment system

---

## Competitive Analysis

### Feature Matrix: Major Platforms

| Feature | MindBody | Momence | Walla | WellnessLiving | Peloton | Alo Moves | Glo | **Tandava** |
|---------|----------|---------|-------|----------------|---------|-----------|-----|-------------|
| **Video Hosting** |
| Self-hosted video | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| YouTube embed | ✓ | ✓ | ✓ | ✓ | - | - | - | ✓ |
| Vimeo embed | ✓ | ✓ | ✓ | ✓ | - | - | - | ✓ |
| Zoom integration | ✓ | ✓ | - | ✓ | - | - | - | ✓ |
| **Scheduling** |
| Live classes | ✓ | ✓ | ✓ | ✓ | ✓ | - | - | ✓ |
| Auto-record to library | - | ✓ | - | - | ✓ | - | - | ✓ |
| Scheduled premieres | - | - | - | - | ✓ | - | - | ✓ |
| In regular schedule | ✓ | ✓ | ✓ | ✓ | ✓ | - | - | ✓ |
| Separate library view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Access Control** |
| Included in membership | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Separate subscription | ✓ | ✓ | ✓ | ✓ | - | ✓ | ✓ | ✓ |
| One-off purchase | ✓ | ✓ | ✓ | ✓ | - | - | - | ✓ |
| Free preview | ✓ | ✓ | - | ✓ | - | ✓ | ✓ | ✓ |
| Class pack deduction | ✓ | ✓ | ✓ | ✓ | - | - | - | ✓ |
| **Content Organization** |
| Series/programs | - | ✓ | - | - | ✓ | ✓ | ✓ | ✓ |
| Collections/playlists | - | - | - | - | ✓ | ✓ | ✓ | ✓ |
| Categories/tags | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Difficulty levels | - | ✓ | - | - | ✓ | ✓ | ✓ | ✓ |
| **User Experience** |
| Progress tracking | - | ✓ | - | - | ✓ | ✓ | ✓ | ✓ |
| Bookmarks/favorites | - | - | - | - | ✓ | ✓ | ✓ | ✓ |
| Continue watching | - | - | - | - | ✓ | ✓ | ✓ | ✓ |
| Offline download | - | - | - | - | ✓ | ✓ | - | ✓* |
| Instructor filtering | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Duration filtering | - | ✓ | - | - | ✓ | ✓ | ✓ | ✓ |
| **Engagement** |
| Ratings/reviews | - | - | - | - | - | ✓ | ✓ | ✓ |
| View counts | - | - | - | - | ✓ | - | - | ✓ |
| Completion certificates | - | - | - | - | - | ✓ | - | ✓ |

*Offline download only for self-hosted content

### Key Insights from Competitive Analysis

1. **Peloton model is gold standard** for live-to-recorded workflow
2. **Alo Moves excels** at series/program structure
3. **Studio platforms** (MindBody, Momence) focus on access control integration
4. **Most lack** robust progress tracking and offline capability
5. **Opportunity:** Combine best of fitness apps with studio management

---

## Jobs to Be Done

### Job 1: Extend Reach Beyond Studio Walls
**When** I have great content and limited class capacity,
**I want to** offer on-demand classes to students anywhere,
**So I can** generate revenue without physical constraints.

### Job 2: Convert Live to Library
**When** I teach a great live class,
**I want** it to automatically become available on-demand,
**So I can** build a content library without extra production work.

### Job 3: Offer Flexible Virtual Options
**When** students can't attend in-person,
**I want to** offer live virtual or on-demand alternatives,
**So I can** retain students who move away or have schedule conflicts.

### Job 4: Gate Content by Access Level
**When** offering both free and premium content,
**I want to** control who can access what based on their membership,
**So I can** create clear value tiers and upgrade paths.

### Job 5: Build Multi-Class Programs
**When** teaching a progressive skill or program,
**I want to** bundle classes into a series with defined order,
**So I can** guide students through a structured learning journey.

### Job 6: Use External Hosting Flexibly
**When** I already have content on YouTube or recorded Zoom sessions,
**I want to** integrate them into my library without re-uploading,
**So I can** leverage existing content immediately.

---

## User Stories

### US-15.1: Video Library Management
**As a** studio owner,
**I want** to manage my on-demand video library,
**So that** students can browse and watch classes anytime.

**Acceptance Criteria:**
- [ ] Upload videos directly (self-hosted via Supabase Storage or S3)
- [ ] Embed YouTube videos (public or unlisted)
- [ ] Embed Vimeo videos (with privacy controls)
- [ ] Link Zoom cloud recordings
- [ ] Bulk import from folder/playlist
- [ ] Set video metadata (title, description, thumbnail)
- [ ] Assign instructor, style, level, duration
- [ ] Add equipment requirements
- [ ] Preview before publishing

### US-15.2: Schedule Integration
**As a** student,
**I want** to see virtual classes in the regular schedule,
**So that** I can plan my practice whether in-person or online.

**Acceptance Criteria:**
- [ ] Live virtual classes appear in schedule with "Live" badge
- [ ] Recorded classes can appear as "Premiere" (first showing)
- [ ] Option to show in main schedule or separate "On-Demand" section
- [ ] Filter schedule by: in-person, live virtual, on-demand
- [ ] Clear visual distinction between class types
- [ ] Timezone handling for live classes

### US-15.3: Access Control
**As a** studio owner,
**I want** to control who can access each video,
**So that** I can monetize content appropriately.

**Acceptance Criteria:**
- [ ] **Free:** Anyone can watch (great for marketing)
- [ ] **Members only:** Included with any active membership
- [ ] **Specific memberships:** Only certain membership tiers
- [ ] **Class pack:** Deduct from class pack balance
- [ ] **Rental:** Pay once, access for X days
- [ ] **Purchase:** Pay once, own forever
- [ ] **Subscription add-on:** Separate on-demand subscription
- [ ] **Free preview:** First X minutes free, then paywall

### US-15.4: Live Class to Recording
**As a** studio owner,
**I want** live Zoom classes to automatically become on-demand,
**So that** I build my library effortlessly.

**Acceptance Criteria:**
- [ ] Connect Zoom account (OAuth)
- [ ] Auto-import cloud recordings after live class
- [ ] Option to auto-publish or require review
- [ ] Inherit metadata from scheduled class
- [ ] Trim intro/outro (simple editor or manual timestamps)
- [ ] Notification when new recording ready for review

### US-15.5: Series & Programs
**As a** studio owner,
**I want** to create multi-class series,
**So that** students can follow structured programs.

**Acceptance Criteria:**
- [ ] Create series with ordered classes
- [ ] Series description and cover image
- [ ] Optional: prerequisite series
- [ ] Progress tracking per student
- [ ] Completion certificate (optional)
- [ ] Pricing: included, separate purchase, separate rental
- [ ] Drip release (unlock one per day/week)

### US-15.6: Collections & Playlists
**As a** studio owner,
**I want** to curate collections of related classes,
**So that** students can easily find themed content.

**Acceptance Criteria:**
- [ ] Create named collections (e.g., "Beginner Basics", "30-Day Challenge")
- [ ] Add any videos to collections
- [ ] Feature collections on library homepage
- [ ] Student-created playlists (favorites)
- [ ] Smart collections (auto-populate by tag/instructor)

### US-15.7: Student Experience
**As a** student,
**I want** a great video watching experience,
**So that** I enjoy practicing at home.

**Acceptance Criteria:**
- [ ] Responsive video player (works on all devices)
- [ ] Quality selection (auto, 720p, 1080p, 4K)
- [ ] Playback speed control (0.5x to 2x)
- [ ] Picture-in-picture mode
- [ ] Chromecast/AirPlay support
- [ ] Resume where I left off
- [ ] Skip intro button (if timestamps set)
- [ ] Chapter markers (if timestamps set)

### US-15.8: Progress Tracking
**As a** student,
**I want** to track my on-demand practice,
**So that** I stay motivated and see my progress.

**Acceptance Criteria:**
- [ ] Mark videos as watched (auto at 90% completion)
- [ ] Track minutes practiced (on-demand)
- [ ] Series completion progress bar
- [ ] "Continue Watching" section
- [ ] Watch history
- [ ] Streak tracking includes on-demand
- [ ] Download certificate for completed series

### US-15.9: Offline Access
**As a** student,
**I want** to download classes for offline viewing,
**So that** I can practice without internet.

**Acceptance Criteria:**
- [ ] Download button for eligible videos (self-hosted only)
- [ ] Choose quality for download
- [ ] Download expires after X days (configurable)
- [ ] Offline viewing in PWA/mobile app
- [ ] Sync watch progress when back online
- [ ] Clear downloads to free space

### US-15.10: Live Virtual Classes
**As a** studio owner,
**I want** to schedule and run live virtual classes,
**So that** remote students can participate in real-time.

**Acceptance Criteria:**
- [ ] Schedule live virtual class (Zoom link)
- [ ] Show in schedule with "Live" badge and start time
- [ ] Registration/booking required (for capacity/payment)
- [ ] Automatic join link delivery (email, in-app)
- [ ] Waiting room support
- [ ] Attendance tracking (who joined)
- [ ] Optional: hybrid (in-person + virtual simultaneously)

---

## Video Hosting Options

### Option 1: Self-Hosted (Supabase Storage / S3)

**Pros:**
- Full control over content
- No third-party dependencies
- Supports offline download
- No external branding
- Custom player controls

**Cons:**
- Bandwidth costs
- Need transcoding for adaptive streaming
- Storage costs scale with library size

**Implementation:**
- Upload to Supabase Storage or S3
- Use Cloudflare Stream or Mux for transcoding/delivery
- HLS adaptive streaming for quality adjustment

### Option 2: YouTube (Public/Unlisted)

**Pros:**
- Free hosting and bandwidth
- Built-in transcoding
- Embeddable
- SEO benefits (if public)

**Cons:**
- YouTube branding and ads (unless premium)
- Less control over UX
- Unlisted links can leak
- No offline download

**Implementation:**
- Store YouTube video ID
- Embed using YouTube IFrame API
- Use unlisted for paywalled content

### Option 3: Vimeo (Plus/Pro)

**Pros:**
- Professional player
- Privacy controls (domain restriction)
- No ads
- Better for premium content

**Cons:**
- Monthly cost ($12-75/mo)
- Bandwidth limits on lower tiers

**Implementation:**
- Store Vimeo video ID
- Embed using Vimeo Player SDK
- Use domain-restricted privacy

### Option 4: Zoom Recordings

**Pros:**
- Auto-capture from live classes
- Already using Zoom for live
- Cloud recordings available

**Cons:**
- Video quality varies
- Need Zoom paid plan for cloud recording
- Additional setup for embedding

**Implementation:**
- OAuth connection to Zoom
- Webhook for recording.completed
- Download and re-host OR use Zoom playback URL

### Recommended Approach: Hybrid

1. **Primary:** Self-hosted for premium/paywalled content
2. **Secondary:** YouTube unlisted for free/marketing content
3. **Integration:** Zoom for live-to-recorded workflow
4. **Optional:** Vimeo for studios wanting premium player

---

## Database Schema

```sql
-- ============================================================================
-- ON-DEMAND VIDEO LIBRARY
-- ============================================================================

CREATE TYPE video_hosting_type AS ENUM (
  'self_hosted',      -- Supabase Storage / S3 / Cloudflare Stream
  'youtube',          -- YouTube embed
  'vimeo',            -- Vimeo embed
  'zoom_recording',   -- Zoom cloud recording
  'external_url'      -- Generic external URL
);

CREATE TYPE video_access_type AS ENUM (
  'free',             -- Anyone can watch
  'members_only',     -- Any active membership
  'specific_memberships', -- Specific membership tiers
  'class_pack',       -- Deduct from class pack
  'rental',           -- Pay once, access X days
  'purchase',         -- Pay once, own forever
  'subscription'      -- Separate on-demand subscription
);

CREATE TYPE video_status AS ENUM (
  'draft',            -- Not yet published
  'processing',       -- Transcoding/importing
  'published',        -- Live and accessible
  'unlisted',         -- Accessible by direct link only
  'archived'          -- Hidden from library, still accessible to purchasers
);

CREATE TABLE on_demand_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,

  -- Hosting
  hosting_type video_hosting_type NOT NULL,
  video_url TEXT,                    -- For self-hosted or external
  video_id TEXT,                     -- For YouTube/Vimeo/Zoom
  embed_config JSONB DEFAULT '{}',   -- Platform-specific settings

  -- Transcoding (self-hosted)
  original_file_path TEXT,           -- Original upload
  transcoded_urls JSONB DEFAULT '{}', -- {"720p": "url", "1080p": "url", "hls": "url"}
  transcode_status TEXT,

  -- Media Info
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  preview_url TEXT,                  -- Short preview clip

  -- Timestamps for player
  chapters JSONB DEFAULT '[]',       -- [{"time": 0, "title": "Intro"}, ...]
  skip_intro_seconds INTEGER,        -- Skip to this timestamp

  -- Classification
  instructor_id UUID REFERENCES studio_staff(id),
  class_type_id UUID REFERENCES class_types(id),
  style TEXT,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all_levels')),
  equipment TEXT[],                  -- ['mat', 'blocks', 'strap']

  -- Access Control
  access_type video_access_type NOT NULL DEFAULT 'members_only',
  access_config JSONB DEFAULT '{}',
  /* Examples:
  For specific_memberships: {"membership_type_ids": ["uuid1", "uuid2"]}
  For rental: {"rental_days": 7, "price_cents": 999}
  For purchase: {"price_cents": 1999}
  For subscription: {"subscription_id": "uuid"}
  For free with preview: {"preview_seconds": 300}
  */

  -- For class pack deduction
  class_pack_deduction INTEGER DEFAULT 1, -- How many classes to deduct

  -- Status
  status video_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,

  -- Metadata
  view_count INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2),
  rating_count INTEGER DEFAULT 0,

  -- Source (if from live class)
  source_class_occurrence_id UUID REFERENCES class_occurrences(id),
  source_zoom_meeting_id TEXT,

  -- SEO
  seo_title TEXT,
  seo_description TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, slug)
);

-- ============================================================================
-- VIDEO SERIES / PROGRAMS
-- ============================================================================

CREATE TABLE video_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,

  -- Classification
  instructor_id UUID REFERENCES studio_staff(id),
  style TEXT,
  level TEXT,
  estimated_duration_minutes INTEGER,  -- Total series duration

  -- Access
  access_type video_access_type NOT NULL DEFAULT 'members_only',
  access_config JSONB DEFAULT '{}',

  -- Drip Release
  drip_enabled BOOLEAN DEFAULT false,
  drip_interval_days INTEGER DEFAULT 1, -- Unlock one every X days

  -- Completion
  certificate_enabled BOOLEAN DEFAULT false,
  certificate_template_id UUID,

  -- Prerequisite
  prerequisite_series_id UUID REFERENCES video_series(id),

  -- Status
  status video_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,

  -- Stats
  enrollment_count INTEGER DEFAULT 0,
  completion_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, slug)
);

-- Videos within a series (ordered)
CREATE TABLE video_series_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES video_series(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES on_demand_videos(id) ON DELETE CASCADE,

  sequence_number INTEGER NOT NULL,

  -- Override video title for series context
  custom_title TEXT,

  -- Drip settings (if different from series default)
  available_after_days INTEGER,  -- Override drip timing

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(series_id, video_id),
  UNIQUE(series_id, sequence_number)
);

-- ============================================================================
-- COLLECTIONS / PLAYLISTS
-- ============================================================================

CREATE TABLE video_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,

  -- Type
  collection_type TEXT NOT NULL CHECK (collection_type IN (
    'curated',    -- Staff-created collection
    'smart',      -- Auto-populated by rules
    'featured'    -- Homepage featured
  )),

  -- Smart collection rules
  smart_rules JSONB DEFAULT '{}',
  /* Example:
  {
    "instructor_ids": ["uuid"],
    "styles": ["vinyasa", "yin"],
    "levels": ["beginner"],
    "min_duration": 10,
    "max_duration": 30
  }
  */

  -- Display
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, slug)
);

CREATE TABLE video_collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES video_collections(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES on_demand_videos(id) ON DELETE CASCADE,

  sequence_number INTEGER,
  added_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(collection_id, video_id)
);

-- Student playlists (favorites)
CREATE TABLE student_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  title TEXT NOT NULL DEFAULT 'My Favorites',
  is_default BOOLEAN DEFAULT false,  -- The "favorites" playlist

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE student_playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES student_playlists(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES on_demand_videos(id) ON DELETE CASCADE,

  added_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(playlist_id, video_id)
);

-- ============================================================================
-- WATCH PROGRESS & HISTORY
-- ============================================================================

CREATE TABLE video_watch_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES on_demand_videos(id) ON DELETE CASCADE,

  -- Progress
  watched_seconds INTEGER DEFAULT 0,
  total_seconds INTEGER,
  progress_percent NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_seconds > 0
      THEN LEAST(100, (watched_seconds::NUMERIC / total_seconds) * 100)
      ELSE 0
    END
  ) STORED,

  -- Completion
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  -- For resume
  last_position_seconds INTEGER DEFAULT 0,

  -- Engagement
  started_at TIMESTAMPTZ DEFAULT now(),
  last_watched_at TIMESTAMPTZ DEFAULT now(),
  watch_count INTEGER DEFAULT 1,

  UNIQUE(profile_id, video_id)
);

CREATE TABLE video_watch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES on_demand_videos(id) ON DELETE CASCADE,

  -- Session timing
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,

  -- What was watched
  start_position_seconds INTEGER,
  end_position_seconds INTEGER,
  watched_seconds INTEGER,  -- Actual watch time (may differ from position delta)

  -- Context
  device_type TEXT,
  quality TEXT
);

-- ============================================================================
-- SERIES ENROLLMENT & PROGRESS
-- ============================================================================

CREATE TABLE series_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES video_series(id) ON DELETE CASCADE,

  -- Progress
  videos_completed INTEGER DEFAULT 0,
  videos_total INTEGER NOT NULL,
  progress_percent NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN videos_total > 0
      THEN (videos_completed::NUMERIC / videos_total) * 100
      ELSE 0
    END
  ) STORED,

  -- Completion
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  certificate_issued_at TIMESTAMPTZ,
  certificate_url TEXT,

  -- Drip
  current_drip_index INTEGER DEFAULT 0,  -- Which videos are unlocked
  next_unlock_at TIMESTAMPTZ,

  -- Timing
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,

  UNIQUE(profile_id, series_id)
);

-- ============================================================================
-- VIDEO RATINGS & REVIEWS
-- ============================================================================

CREATE TABLE video_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES on_demand_videos(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,

  -- Moderation
  is_visible BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(video_id, profile_id)
);

-- ============================================================================
-- VIDEO PURCHASES & RENTALS
-- ============================================================================

CREATE TABLE video_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID REFERENCES on_demand_videos(id),
  series_id UUID REFERENCES video_series(id),

  -- Purchase type
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('purchase', 'rental')),

  -- Payment
  amount_cents INTEGER NOT NULL,
  transaction_id UUID REFERENCES transactions(id),

  -- Rental expiration
  expires_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),

  CHECK (video_id IS NOT NULL OR series_id IS NOT NULL)
);

-- ============================================================================
-- ON-DEMAND SUBSCRIPTION (separate from studio membership)
-- ============================================================================

CREATE TABLE on_demand_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Pricing
  price_cents INTEGER NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),

  -- What's included
  access_all_videos BOOLEAN DEFAULT true,
  included_video_ids UUID[],  -- If not access_all

  -- Limits
  download_enabled BOOLEAN DEFAULT false,
  concurrent_streams INTEGER DEFAULT 2,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Student subscriptions to on-demand
CREATE TABLE on_demand_member_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES on_demand_subscriptions(id),
  profile_id UUID NOT NULL REFERENCES profiles(id),

  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'cancelled', 'paused')),

  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  payment_provider TEXT,
  provider_subscription_id TEXT,

  cancelled_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- LIVE VIRTUAL CLASS SUPPORT
-- ============================================================================

CREATE TABLE virtual_class_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Zoom integration
  zoom_connected BOOLEAN DEFAULT false,
  zoom_user_id TEXT,
  zoom_account_id TEXT,
  zoom_credentials_encrypted TEXT,

  -- Default settings for new live classes
  default_waiting_room BOOLEAN DEFAULT true,
  default_auto_record BOOLEAN DEFAULT true,
  default_record_to_cloud BOOLEAN DEFAULT true,

  -- Auto-import settings
  auto_import_recordings BOOLEAN DEFAULT true,
  auto_publish_recordings BOOLEAN DEFAULT false,
  default_recording_access video_access_type DEFAULT 'members_only',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id)
);

-- Link between scheduled class and Zoom meeting
CREATE TABLE class_zoom_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_occurrence_id UUID NOT NULL REFERENCES class_occurrences(id) ON DELETE CASCADE,

  zoom_meeting_id TEXT NOT NULL,
  join_url TEXT NOT NULL,
  host_url TEXT,
  password TEXT,

  -- Status
  meeting_status TEXT DEFAULT 'scheduled',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Attendance (populated after meeting)
  attendee_count INTEGER,
  attendee_data JSONB,

  -- Recording
  recording_status TEXT,
  recording_files JSONB,  -- Cloud recording URLs
  imported_video_id UUID REFERENCES on_demand_videos(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_videos_studio ON on_demand_videos(studio_id, status);
CREATE INDEX idx_videos_instructor ON on_demand_videos(instructor_id);
CREATE INDEX idx_videos_class_type ON on_demand_videos(class_type_id);
CREATE INDEX idx_videos_published ON on_demand_videos(studio_id, published_at DESC)
  WHERE status = 'published';

CREATE INDEX idx_series_studio ON video_series(studio_id, status);
CREATE INDEX idx_series_items ON video_series_items(series_id, sequence_number);

CREATE INDEX idx_watch_progress_profile ON video_watch_progress(profile_id, last_watched_at DESC);
CREATE INDEX idx_watch_progress_continue ON video_watch_progress(profile_id)
  WHERE is_completed = false AND progress_percent > 5;

CREATE INDEX idx_series_enrollments_profile ON series_enrollments(profile_id);
CREATE INDEX idx_series_enrollments_active ON series_enrollments(series_id)
  WHERE is_completed = false;

CREATE INDEX idx_video_purchases_profile ON video_purchases(profile_id, is_active);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE on_demand_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_watch_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_playlists ENABLE ROW LEVEL SECURITY;

-- Videos: staff can manage, members can view published
CREATE POLICY "Staff can manage videos"
  ON on_demand_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = on_demand_videos.studio_id
        AND studio_staff.profile_id = auth.uid()
    )
  );

CREATE POLICY "Members can view published videos"
  ON on_demand_videos FOR SELECT
  USING (
    status = 'published' AND (
      access_type = 'free'
      OR EXISTS (
        SELECT 1 FROM studio_members
        WHERE studio_members.studio_id = on_demand_videos.studio_id
          AND studio_members.profile_id = auth.uid()
      )
    )
  );

-- Watch progress: users own their data
CREATE POLICY "Users manage own watch progress"
  ON video_watch_progress FOR ALL
  USING (profile_id = auth.uid());

-- Playlists: users own their playlists
CREATE POLICY "Users manage own playlists"
  ON student_playlists FOR ALL
  USING (profile_id = auth.uid());
```

---

## API Endpoints

```
# Videos (Admin)
GET    /api/manage/videos                    # List all videos
POST   /api/manage/videos                    # Create video
GET    /api/manage/videos/:id                # Get video detail
PUT    /api/manage/videos/:id                # Update video
DELETE /api/manage/videos/:id                # Delete video
POST   /api/manage/videos/:id/publish        # Publish video
POST   /api/manage/videos/upload             # Get upload URL
POST   /api/manage/videos/import-youtube     # Import from YouTube
POST   /api/manage/videos/import-zoom        # Import Zoom recording

# Series (Admin)
GET    /api/manage/series                    # List series
POST   /api/manage/series                    # Create series
GET    /api/manage/series/:id                # Get series detail
PUT    /api/manage/series/:id                # Update series
DELETE /api/manage/series/:id                # Delete series
PUT    /api/manage/series/:id/videos         # Reorder videos

# Collections (Admin)
GET    /api/manage/collections               # List collections
POST   /api/manage/collections               # Create collection
PUT    /api/manage/collections/:id           # Update collection
DELETE /api/manage/collections/:id           # Delete collection

# Zoom Integration (Admin)
POST   /api/manage/zoom/connect              # OAuth connect
GET    /api/manage/zoom/recordings           # List available recordings
POST   /api/manage/zoom/import/:meetingId    # Import specific recording

# Videos (Student)
GET    /api/videos                           # Browse video library
GET    /api/videos/:id                       # Get video (with access check)
GET    /api/videos/:id/stream                # Get streaming URL

# Series (Student)
GET    /api/series                           # Browse series
GET    /api/series/:id                       # Get series detail
POST   /api/series/:id/enroll                # Enroll in series

# Watch Progress (Student)
GET    /api/me/watch-progress                # Get all progress
GET    /api/me/continue-watching             # Videos to continue
POST   /api/videos/:id/progress              # Update progress
POST   /api/videos/:id/complete              # Mark complete

# Playlists (Student)
GET    /api/me/playlists                     # My playlists
POST   /api/me/playlists                     # Create playlist
POST   /api/me/playlists/:id/videos          # Add to playlist
DELETE /api/me/playlists/:id/videos/:videoId # Remove from playlist
POST   /api/videos/:id/favorite              # Quick add to favorites

# Purchase (Student)
POST   /api/videos/:id/purchase              # Purchase video
POST   /api/videos/:id/rent                  # Rent video
POST   /api/series/:id/purchase              # Purchase series

# Webhooks
POST   /api/webhooks/zoom                    # Zoom webhooks (recording ready)
```

---

## UI Routes

```
# Admin
/manage/on-demand                      # Video library management
/manage/on-demand/upload               # Upload new video
/manage/on-demand/:id                  # Edit video
/manage/on-demand/series               # Series management
/manage/on-demand/series/:id           # Edit series
/manage/on-demand/collections          # Collection management
/manage/on-demand/settings             # Zoom connection, defaults

# Student
/on-demand                             # Video library browse
/on-demand/video/:slug                 # Watch video page
/on-demand/series                      # Browse series
/on-demand/series/:slug                # Series detail/progress
/on-demand/collections/:slug           # Collection view
/on-demand/my-list                     # My playlists/favorites
/on-demand/history                     # Watch history
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Video completion rate | 60%+ | Completed / Started |
| Series completion rate | 40%+ | Completed / Enrolled |
| Revenue per video | Varies | Total purchases + rental revenue |
| Watch time per user | 2+ hrs/week | Total watch minutes / Active users |
| On-demand subscriber retention | 80%+ | Retained / Total at period start |
| Live-to-recording conversion | 90%+ | Auto-imported / Live classes |

---

## Rollout Plan

### Phase A: Core Video Library (Week 1-2)
1. Video upload (self-hosted)
2. Basic metadata and categorization
3. Video player page
4. Access control (free vs members)

### Phase B: YouTube/Vimeo Embeds (Week 3)
1. YouTube import
2. Vimeo import
3. Mixed library support

### Phase C: Series & Collections (Week 4)
1. Series creation and ordering
2. Collection curation
3. Progress tracking

### Phase D: Zoom Integration (Week 5)
1. Zoom OAuth connection
2. Recording import
3. Auto-publish workflow

### Phase E: Student Features (Week 6)
1. Playlists/favorites
2. Continue watching
3. Watch history
4. Ratings

### Phase F: Monetization (Week 7)
1. Individual purchases
2. Rentals
3. On-demand subscriptions

---

## Open Questions

1. **Transcoding:** Self-host transcoding (FFmpeg) or use service (Mux, Cloudflare Stream)?
2. **DRM:** Is content protection needed for premium content?
3. **Bandwidth costs:** At what scale does self-hosting become expensive?
4. **Mobile app:** Native video player vs web view?
5. **Offline:** PWA-based download or native app only?

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-02-06 | 1.0 | Claude | Initial PRD with competitive analysis |
