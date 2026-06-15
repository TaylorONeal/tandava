-- Migration: public read of a discoverable studio's class schedule
--
-- The embeddable booking widget (public/embed.js + /embed/* routes) renders a
-- studio's upcoming classes on their own website using the anon key. Studios,
-- offerings, and published events are already publicly readable when
-- discoverable; class_occurrences was participants-only. This opens read access
-- to non-cancelled occurrences of discoverable studios so the embed can show
-- real availability. Writes/bookings still require auth + the existing policies.

CREATE POLICY "Public can view discoverable studio schedule" ON class_occurrences
  FOR SELECT
  USING (
    is_cancelled = FALSE
    AND studio_id IN (SELECT id FROM studios WHERE discoverable = TRUE)
  );
