-- Tandava Studio 1.0: synthetic App Review studio.
--
-- RUN ONLY WITH TAYLOR'S YES, after migrations 00050 to 00052 are applied to
-- tandava-prod (org Purafield Studio, project id mkaixgjwakfufmmwembn).
--
-- Before running, create the five review sign-ins in the Supabase dashboard
-- (tandava-prod > Authentication > Users > Add user > Create new user, Auto Confirm
-- on). Taylor types each password there; passwords never go in this repo or chat.
-- Use addresses Purafield controls, for example:
--   owner    review-owner@purafieldstudio.com
--   teacher  review-teacher@purafieldstudio.com
--   members  review-member-1@, review-member-2@, review-member-3@purafieldstudio.com
--
-- Run with psql against tandava-prod (or paste into the SQL editor after replacing
-- the five :'...' variables with the quoted addresses):
--   psql "$TANDAVA_PROD_DB_URL" -v ON_ERROR_STOP=1 \
--     -v owner_email=review-owner@purafieldstudio.com \
--     -v teacher_email=review-teacher@purafieldstudio.com \
--     -v member1_email=review-member-1@purafieldstudio.com \
--     -v member2_email=review-member-2@purafieldstudio.com \
--     -v member3_email=review-member-3@purafieldstudio.com \
--     -f supabase/review/studio-review-seed.sql
--
-- What it makes (all visibly synthetic, unlisted, page not live):
--   * Studio "Juniper Review Studio (synthetic)", slug app-review-synthetic,
--     discoverable = false, page_live = false.
--   * Owner and teacher staff rows, three members.
--   * "Review Check-in (open all review period)": ONE occurrence from now for 21 days,
--     taught by the teacher, so check-in is open whenever the reviewer scans.
--     The three members hold confirmed bookings with FIXED ids, so the QR passes in
--     docs/app-store/review/studio-review-passes.pdf match before this runs.
--   * Ordinary classes (Vinyasa 7:30 AM, Pilates Mat 12:00 PM, Barre 6:00 PM, studio
--     time) for the next 14 days so the schedule and roster screens look real.
-- Safe to re-run: it deletes its own studio first (cascades remove the rest).
-- To remove it after review:  DELETE FROM studios WHERE id = 'f5a1d000-0000-4000-8000-0000000000a1';

\set ON_ERROR_STOP on
BEGIN;

CREATE TEMP TABLE review_people (role TEXT PRIMARY KEY, email TEXT NOT NULL, first_name TEXT, last_name TEXT) ON COMMIT DROP;
INSERT INTO review_people VALUES
  ('owner',   :'owner_email',   'Riley',  'Owner (review)'),
  ('teacher', :'teacher_email', 'Sam',    'Teacher (review)'),
  ('member1', :'member1_email', 'Avery',  'Member One'),
  ('member2', :'member2_email', 'Jordan', 'Member Two'),
  ('member3', :'member3_email', 'Quinn',  'Member Three');

DO $$
DECLARE missing TEXT;
BEGIN
  SELECT string_agg(rp.email, ', ') INTO missing FROM review_people rp
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(rp.email));
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Create these sign-ins in the Supabase dashboard first: %', missing;
  END IF;
END $$;

CREATE TEMP TABLE review_ids ON COMMIT DROP AS
  SELECT rp.role, u.id FROM review_people rp JOIN auth.users u ON lower(u.email) = lower(rp.email);

UPDATE profiles p SET first_name = rp.first_name, last_name = rp.last_name,
       display_name = rp.first_name || ' ' || rp.last_name
  FROM review_people rp JOIN review_ids ri USING (role) WHERE p.id = ri.id;

DELETE FROM studios WHERE id = 'f5a1d000-0000-4000-8000-0000000000a1' OR slug = 'app-review-synthetic';

INSERT INTO studios (id, name, slug, discoverable, page_live, timezone)
VALUES ('f5a1d000-0000-4000-8000-0000000000a1', 'Juniper Review Studio (synthetic)', 'app-review-synthetic', FALSE, FALSE, 'America/Chicago');

INSERT INTO studio_staff (studio_id, profile_id, role)
SELECT 'f5a1d000-0000-4000-8000-0000000000a1', id, role::user_role FROM review_ids WHERE role IN ('owner', 'teacher');

INSERT INTO studio_members (studio_id, profile_id)
SELECT 'f5a1d000-0000-4000-8000-0000000000a1', id FROM review_ids WHERE role LIKE 'member%';

INSERT INTO locations (id, studio_id, name, city, state)
VALUES ('f5a1d000-0000-4000-8000-0000000000b1', 'f5a1d000-0000-4000-8000-0000000000a1', 'Main Room (synthetic)', 'Austin', 'TX');

INSERT INTO offerings (id, studio_id, name, slug, style, capacity, drop_in_price_cents, discoverable, is_active) VALUES
  ('f5a1d000-0000-4000-8000-0000000000c1', 'f5a1d000-0000-4000-8000-0000000000a1', 'Review Check-in (open all review period)', 'review-check-in', 'Vinyasa', 20, 0,    FALSE, TRUE),
  ('f5a1d000-0000-4000-8000-0000000000c2', 'f5a1d000-0000-4000-8000-0000000000a1', 'Vinyasa Flow',  'vinyasa-flow',  'Vinyasa', 20, 2400, FALSE, TRUE),
  ('f5a1d000-0000-4000-8000-0000000000c3', 'f5a1d000-0000-4000-8000-0000000000a1', 'Pilates Mat',   'pilates-mat',   'Pilates', 16, 2600, FALSE, TRUE),
  ('f5a1d000-0000-4000-8000-0000000000c4', 'f5a1d000-0000-4000-8000-0000000000a1', 'Barre Sculpt',  'barre-sculpt',  'Barre',   18, 2800, FALSE, TRUE);

-- The always-open review class: one occurrence covering the whole review period.
INSERT INTO class_occurrences (id, studio_id, offering_id, location_id, teacher_id, starts_at, ends_at, capacity, is_cancelled)
SELECT 'f5a1d000-0000-4000-8000-0000000000d1', 'f5a1d000-0000-4000-8000-0000000000a1', 'f5a1d000-0000-4000-8000-0000000000c1',
       'f5a1d000-0000-4000-8000-0000000000b1', id, NOW() - interval '5 minutes', NOW() + interval '21 days', 20, FALSE
  FROM review_ids WHERE role = 'teacher';

-- Fixed booking ids: these are the QR passes 1 to 3 in the review PDF.
INSERT INTO bookings (id, studio_id, class_occurrence_id, profile_id, status)
SELECT v.booking_id::uuid, 'f5a1d000-0000-4000-8000-0000000000a1', 'f5a1d000-0000-4000-8000-0000000000d1', ri.id, 'confirmed'
  FROM (VALUES ('member1', 'f5a1d000-0000-4000-8000-0000000000e1'),
               ('member2', 'f5a1d000-0000-4000-8000-0000000000e2'),
               ('member3', 'f5a1d000-0000-4000-8000-0000000000e3')) v(role, booking_id)
  JOIN review_ids ri USING (role);

-- Ordinary classes for 14 days (studio time), taught by the teacher, each with the
-- three members booked so rosters have names.
WITH days AS (
  SELECT d::date AS day FROM generate_series((NOW() AT TIME ZONE 'America/Chicago')::date,
                                             (NOW() AT TIME ZONE 'America/Chicago')::date + 13, interval '1 day') d
), slots(offering_id, at_time, minutes) AS (
  VALUES ('f5a1d000-0000-4000-8000-0000000000c2'::uuid, time '07:30', 60),
         ('f5a1d000-0000-4000-8000-0000000000c3'::uuid, time '12:00', 50),
         ('f5a1d000-0000-4000-8000-0000000000c4'::uuid, time '18:00', 55)
), occ AS (
  INSERT INTO class_occurrences (studio_id, offering_id, location_id, teacher_id, starts_at, ends_at, capacity, is_cancelled)
  SELECT 'f5a1d000-0000-4000-8000-0000000000a1', s.offering_id, 'f5a1d000-0000-4000-8000-0000000000b1',
         (SELECT id FROM review_ids WHERE role = 'teacher'),
         (d.day + s.at_time) AT TIME ZONE 'America/Chicago',
         (d.day + s.at_time + make_interval(mins => s.minutes)) AT TIME ZONE 'America/Chicago', 20, FALSE
    FROM days d CROSS JOIN slots s
   WHERE (d.day + s.at_time) AT TIME ZONE 'America/Chicago' > NOW()
  RETURNING id
)
INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status)
SELECT 'f5a1d000-0000-4000-8000-0000000000a1', occ.id, ri.id, 'confirmed'
  FROM occ CROSS JOIN review_ids ri WHERE ri.role LIKE 'member%';

COMMIT;

SELECT 'Pass ' || right(b.id::text, 1) AS pass, p.display_name AS member,
       'tandava:checkin:v1:' || b.id AS qr_text
  FROM bookings b JOIN profiles p ON p.id = b.profile_id
 WHERE b.class_occurrence_id = 'f5a1d000-0000-4000-8000-0000000000d1' ORDER BY b.id;
