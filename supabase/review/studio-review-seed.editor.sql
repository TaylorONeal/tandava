-- SQL-editor copy of studio-review-seed.sql with the five review addresses filled in.
-- Generated; edit studio-review-seed.sql and regenerate instead of editing this.
-- Applies to tandava-prod (org Purafield Studio, id mkaixgjwakfufmmwembn) only after
-- the five review users exist. Taylor said yes to running it on Nov 6 2026.
BEGIN;

CREATE TEMP TABLE review_people (role TEXT PRIMARY KEY, email TEXT NOT NULL, first_name TEXT, last_name TEXT) ON COMMIT DROP;
INSERT INTO review_people VALUES
  ('owner',   'review-owner@purafieldstudio.com',   'Riley',  'Owner (review)'),
  ('teacher', 'review-teacher@purafieldstudio.com', 'Sam',    'Teacher (review)'),
  ('member1', 'review-member-1@purafieldstudio.com', 'Avery',  'Member One'),
  ('member2', 'review-member-2@purafieldstudio.com', 'Jordan', 'Member Two'),
  ('member3', 'review-member-3@purafieldstudio.com', 'Quinn',  'Member Three');

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
