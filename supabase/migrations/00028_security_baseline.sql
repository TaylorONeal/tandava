-- 00022: Security baseline.
--
-- Found by the launch-v1 audit (docs/plans/PRD-launch-v1.md, wave W1):
--   1. 10 tables had RLS disabled. Supabase grants anon full privileges on new
--      public tables, so anyone with the public key could read and write them.
--      class_zoom_meetings exposes host_url, password and recordings.
--   2. "Discoverable studios are public" let anon read whole studio rows
--      (stripe_account_id, email, phone, fee columns). Public data is served by
--      get_studio_storefront / discover_classes / get_public_schedule instead.
--   3. SECURITY DEFINER functions were executable by anon, three of them
--      without a pinned search_path, and some trusted client-supplied ids.
--   4. src/lib/backend/supabase.ts inserts into `messages`, which no migration
--      created, so contact and feedback forms failed on a clean database.
--
-- Policy conventions (keep these for every new table):
--   * `(SELECT auth.uid())` instead of bare auth.uid(), so Postgres evaluates it
--     once per statement, not once per row.
--   * Staff access goes through my_staff_studio_ids() / my_admin_studio_ids()
--     (00020): SECURITY DEFINER, is_active aware, no policy recursion.
--   * Tables with no studio_id reach their tenant through the parent row.

-- ---------------------------------------------------------------------------
-- 1. RLS on the ten exposed tables
-- ---------------------------------------------------------------------------

ALTER TABLE class_zoom_meetings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_ratings                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_watch_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE on_demand_member_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_playlist_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_series_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_collection_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_field_mappings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_format_versions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_error_patterns         ENABLE ROW LEVEL SECURITY;

-- Zoom host credentials: studio owners and admins only (via the class's studio).
CREATE POLICY "Admins manage class zoom meetings"
  ON class_zoom_meetings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM class_occurrences co
    WHERE co.id = class_zoom_meetings.class_occurrence_id
      AND co.studio_id IN (SELECT my_admin_studio_ids())))
  WITH CHECK (EXISTS (
    SELECT 1 FROM class_occurrences co
    WHERE co.id = class_zoom_meetings.class_occurrence_id
      AND co.studio_id IN (SELECT my_admin_studio_ids())));

-- Ratings and watch sessions: the viewer owns their rows; staff can read their studio's.
CREATE POLICY "Members manage own video ratings"
  ON video_ratings FOR ALL
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));

CREATE POLICY "Staff view video ratings"
  ON video_ratings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM on_demand_videos v
    WHERE v.id = video_ratings.video_id
      AND v.studio_id IN (SELECT my_staff_studio_ids())));

CREATE POLICY "Members manage own watch sessions"
  ON video_watch_sessions FOR ALL
  USING (profile_id = (SELECT auth.uid()))
  WITH CHECK (profile_id = (SELECT auth.uid()));

CREATE POLICY "Staff view watch sessions"
  ON video_watch_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM on_demand_videos v
    WHERE v.id = video_watch_sessions.video_id
      AND v.studio_id IN (SELECT my_staff_studio_ids())));

-- On-demand subscriptions are written by the payment webhook (service role).
CREATE POLICY "Members view own on-demand subscriptions"
  ON on_demand_member_subscriptions FOR SELECT
  USING (profile_id = (SELECT auth.uid()));

CREATE POLICY "Staff view on-demand member subscriptions"
  ON on_demand_member_subscriptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM on_demand_subscriptions s
    WHERE s.id = on_demand_member_subscriptions.subscription_id
      AND s.studio_id IN (SELECT my_staff_studio_ids())));

-- Playlist items follow their playlist's owner.
CREATE POLICY "Members manage own playlist items"
  ON student_playlist_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM student_playlists p
    WHERE p.id = student_playlist_items.playlist_id
      AND p.profile_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (
    SELECT 1 FROM student_playlists p
    WHERE p.id = student_playlist_items.playlist_id
      AND p.profile_id = (SELECT auth.uid())));

-- Series and collection items follow their parent's studio.
CREATE POLICY "Staff view video series items"
  ON video_series_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM video_series s
    WHERE s.id = video_series_items.series_id
      AND s.studio_id IN (SELECT my_staff_studio_ids())));

CREATE POLICY "Admins manage video series items"
  ON video_series_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM video_series s
    WHERE s.id = video_series_items.series_id
      AND s.studio_id IN (SELECT my_admin_studio_ids())))
  WITH CHECK (EXISTS (
    SELECT 1 FROM video_series s
    WHERE s.id = video_series_items.series_id
      AND s.studio_id IN (SELECT my_admin_studio_ids())));

CREATE POLICY "Staff view video collection items"
  ON video_collection_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM video_collections c
    WHERE c.id = video_collection_items.collection_id
      AND c.studio_id IN (SELECT my_staff_studio_ids())));

CREATE POLICY "Admins manage video collection items"
  ON video_collection_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM video_collections c
    WHERE c.id = video_collection_items.collection_id
      AND c.studio_id IN (SELECT my_admin_studio_ids())))
  WITH CHECK (EXISTS (
    SELECT 1 FROM video_collections c
    WHERE c.id = video_collection_items.collection_id
      AND c.studio_id IN (SELECT my_admin_studio_ids())));

-- Import reference data: any signed-in user may read; only the service role writes.
CREATE POLICY "Authenticated read import field mappings"
  ON import_field_mappings FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated read import format versions"
  ON import_format_versions FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Authenticated read import error patterns"
  ON import_error_patterns FOR SELECT TO authenticated USING (TRUE);

-- ---------------------------------------------------------------------------
-- 2. messages: contact / feedback inbox the client already writes to
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type          TEXT NOT NULL
                CHECK (type IN ('class_feedback','studio_inquiry','platform_feedback','support_ticket')),
  studio_id     UUID REFERENCES studios(id) ON DELETE CASCADE,
  class_id      UUID REFERENCES class_occurrences(id) ON DELETE SET NULL,
  sender_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sender_name   TEXT CHECK (sender_name  IS NULL OR char_length(sender_name)  <= 200),
  sender_email  TEXT CHECK (sender_email IS NULL OR char_length(sender_email) <= 320),
  subject       TEXT NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
  body          TEXT NOT NULL CHECK (char_length(body)    BETWEEN 1 AND 5000),
  status        TEXT NOT NULL DEFAULT 'unread'
                CHECK (status IN ('unread','read','archived','replied')),
  honeypot      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_studio_status ON messages (studio_id, status, created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Anyone may submit (the contact form is public). Insert-only: no one reads the
-- inbox through the API except the studio's staff. A filled honeypot is a bot.
CREATE POLICY "Anyone can submit a message"
  ON messages FOR INSERT TO anon, authenticated
  WITH CHECK (
    COALESCE(honeypot, '') = ''
    AND status = 'unread'
    AND (sender_id IS NULL OR sender_id = (SELECT auth.uid()))
  );

CREATE POLICY "Staff read studio messages"
  ON messages FOR SELECT
  USING (studio_id IN (SELECT my_staff_studio_ids()));

CREATE POLICY "Admins update studio messages"
  ON messages FOR UPDATE
  USING (studio_id IN (SELECT my_admin_studio_ids()))
  WITH CHECK (studio_id IN (SELECT my_admin_studio_ids()));

-- ---------------------------------------------------------------------------
-- 3. studios: stop exposing whole rows to anyone
-- ---------------------------------------------------------------------------

-- Staff ("Staff can view their studios") and members ("Members can view their
-- studios") keep their own policies. Public pages use the RPCs.
DROP POLICY IF EXISTS "Discoverable studios are public" ON studios;

-- ---------------------------------------------------------------------------
-- 4. SECURITY DEFINER functions: pin search_path, close anon, least privilege
-- ---------------------------------------------------------------------------

ALTER FUNCTION handle_new_user()        SET search_path = public;
ALTER FUNCTION log_audit_event          SET search_path = public;
ALTER FUNCTION increment_video_view     SET search_path = public;

-- Server-side only (called by edge functions with the service role key).
-- log_audit_event trusts p_studio_id / p_actor_id; increment_* are webhook hooks.
REVOKE ALL ON FUNCTION log_audit_event          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION increment_event_registered FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION increment_tier_registered  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event          TO service_role;
GRANT EXECUTE ON FUNCTION increment_event_registered TO service_role;
GRANT EXECUTE ON FUNCTION increment_tier_registered  TO service_role;

-- Signed-in users only. (Rate limiting view counts is tracked as T6.x.)
REVOKE ALL ON FUNCTION increment_video_view FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION increment_video_view TO authenticated, service_role;

-- These reject a null auth.uid() already; also close the door at the grant level.
REVOKE ALL ON FUNCTION book_class            FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION cancel_booking        FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION get_my_effective_role FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION book_class            TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION cancel_booking        TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_my_effective_role TO authenticated, service_role;
