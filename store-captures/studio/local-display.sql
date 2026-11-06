-- LOCAL CAPTURE STACK ONLY. Never run against tandava-prod.
-- Runs after supabase/review/studio-review-seed.sql on the throwaway local Supabase in the
-- store-captures workflow. Store screenshots are public, so the review labels
-- ("(synthetic)", "Review Check-in (open all review period)") are swapped for plain made-up
-- names, five more made-up members fill the roster, and the open class moves to start in
-- 20 to 35 minutes so it shows as upcoming with check-in already open.
\set ON_ERROR_STOP on
BEGIN;

UPDATE studios   SET name = 'Juniper Yoga' WHERE id = 'f5a1d000-0000-4000-8000-0000000000a1';
UPDATE locations SET name = 'Main Room'    WHERE id = 'f5a1d000-0000-4000-8000-0000000000b1';
UPDATE offerings SET name = 'Open Flow', slug = 'open-flow', drop_in_price_cents = 2200
 WHERE id = 'f5a1d000-0000-4000-8000-0000000000c1';

UPDATE class_occurrences
   SET starts_at = to_timestamp(ceil(extract(epoch FROM now() + interval '20 minutes') / 900) * 900),
       ends_at   = to_timestamp(ceil(extract(epoch FROM now() + interval '20 minutes') / 900) * 900) + interval '60 minutes'
 WHERE id = 'f5a1d000-0000-4000-8000-0000000000d1';

CREATE TEMP TABLE display_names (email TEXT PRIMARY KEY, first_name TEXT, last_name TEXT) ON COMMIT DROP;
INSERT INTO display_names VALUES
  ('review-owner@juniper.example',    'Riley',  'Park'),
  ('review-teacher@juniper.example',  'Sam',    'Rivera'),
  ('review-member-1@juniper.example', 'Avery',  'Lin'),
  ('review-member-2@juniper.example', 'Jordan', 'Reyes'),
  ('review-member-3@juniper.example', 'Quinn',  'Harper'),
  ('review-member-4@juniper.example', 'Maya',   'Brooks'),
  ('review-member-5@juniper.example', 'Theo',   'Grant'),
  ('review-member-6@juniper.example', 'Nina',   'Alvarez'),
  ('review-member-7@juniper.example', 'Leo',    'Marsh'),
  ('review-member-8@juniper.example', 'Ivy',    'Chen');

UPDATE profiles p SET first_name = d.first_name, last_name = d.last_name,
       display_name = d.first_name || ' ' || d.last_name
  FROM display_names d JOIN auth.users u ON lower(u.email) = d.email
 WHERE p.id = u.id;

-- Extra members 4 to 8: studio members, booked into the open class and the next ordinary classes.
INSERT INTO studio_members (studio_id, profile_id)
SELECT 'f5a1d000-0000-4000-8000-0000000000a1', u.id FROM auth.users u
 WHERE u.email ~ '^review-member-[4-8]@juniper\.example$'
ON CONFLICT DO NOTHING;

INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status)
SELECT 'f5a1d000-0000-4000-8000-0000000000a1', 'f5a1d000-0000-4000-8000-0000000000d1', u.id, 'confirmed'
  FROM auth.users u WHERE u.email ~ '^review-member-[4-8]@juniper\.example$';

INSERT INTO bookings (studio_id, class_occurrence_id, profile_id, status)
SELECT 'f5a1d000-0000-4000-8000-0000000000a1', o.id, u.id, 'confirmed'
  FROM (SELECT id FROM class_occurrences WHERE studio_id = 'f5a1d000-0000-4000-8000-0000000000a1'
          AND id <> 'f5a1d000-0000-4000-8000-0000000000d1' ORDER BY starts_at LIMIT 9) o
 CROSS JOIN auth.users u WHERE u.email ~ '^review-member-[4-6]@juniper\.example$';

COMMIT;

-- Pricing rows for the Classes and pricing screen. Kept out of the transaction so a schema
-- difference only skips the row instead of failing the run.
\set ON_ERROR_STOP off
INSERT INTO class_pack_types (studio_id, name, description, class_count, price_cents, validity_days)
VALUES ('f5a1d000-0000-4000-8000-0000000000a1', '10-Class Pack', 'Any class, any time.', 10, 18000, 180);
INSERT INTO membership_types (studio_id, name, description, billing_cycle, price_cents)
VALUES ('f5a1d000-0000-4000-8000-0000000000a1', 'Monthly Unlimited', 'Every class, every week.', 'monthly', 12900);

SELECT o.name, c.starts_at, count(b.*) AS booked
  FROM class_occurrences c JOIN offerings o ON o.id = c.offering_id
  LEFT JOIN bookings b ON b.class_occurrence_id = c.id
 WHERE c.id = 'f5a1d000-0000-4000-8000-0000000000d1' GROUP BY 1, 2;
