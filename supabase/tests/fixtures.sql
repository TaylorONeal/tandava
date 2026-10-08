-- Test fixtures: two independent studios with one staff user and students each.
-- Plain SQL (no pgTAP) so it runs on any Postgres: see supabase/tests/run.sh.
-- Fixed UUIDs make assertions readable. Safe to re-run (see cleanup below).

-- Idempotent: remove any previous run's rows first (cascades do the rest).
DELETE FROM studios WHERE id IN (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000002',
  'cccccccc-0000-0000-0000-000000000003');
DELETE FROM auth.users WHERE id IN (
  'a0000000-0000-0000-0000-00000000000a',
  'b0000000-0000-0000-0000-00000000000b',
  'a1000000-0000-0000-0000-0000000000a1',
  'a2000000-0000-0000-0000-0000000000a2',
  'b1000000-0000-0000-0000-0000000000b1');

-- Users (the on_auth_user_created trigger creates the profiles).
INSERT INTO auth.users (id, email) VALUES
  ('a0000000-0000-0000-0000-00000000000a', 'staff-a@test.dev'),
  ('b0000000-0000-0000-0000-00000000000b', 'staff-b@test.dev'),
  ('a1000000-0000-0000-0000-0000000000a1', 'student-a1@test.dev'),
  ('a2000000-0000-0000-0000-0000000000a2', 'student-a2@test.dev'),
  ('b1000000-0000-0000-0000-0000000000b1', 'student-b1@test.dev');

INSERT INTO studios (id, name, slug, discoverable, timezone) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Studio A', 'studio-a', TRUE,  'America/Chicago'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Studio B', 'studio-b', TRUE,  'America/Chicago'),
  ('cccccccc-0000-0000-0000-000000000003', 'Hidden C', 'hidden-c', FALSE, 'America/Chicago');

INSERT INTO studio_staff (studio_id, profile_id, role) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-00000000000a', 'owner'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-00000000000b', 'owner');

INSERT INTO studio_members (studio_id, profile_id) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-0000000000a1'),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-0000000000a2'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-0000000000b1');

INSERT INTO locations (id, studio_id, name, city, state) VALUES
  ('aaaaaaaa-1000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'A Main', 'Austin', 'TX'),
  ('bbbbbbbb-1000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', 'B Main', 'Austin', 'TX'),
  ('cccccccc-1000-0000-0000-000000000003', 'cccccccc-0000-0000-0000-000000000003', 'C Main', 'Austin', 'TX');

INSERT INTO offerings (id, studio_id, name, slug, style, capacity, drop_in_price_cents, discoverable, is_active) VALUES
  ('aaaaaaaa-2000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'Vinyasa A',  'vinyasa-a', 'Vinyasa', 1, 2200, TRUE,  TRUE),
  ('aaaaaaaa-2000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Private A',  'private-a', 'Private', 5, 9000, FALSE, TRUE),
  ('bbbbbbbb-2000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002', 'Yin B',      'yin-b',     'Yin',     8, 2000, TRUE,  TRUE),
  ('cccccccc-2000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003', 'Secret C',   'secret-c',  'Vinyasa', 8, 2000, TRUE,  TRUE);

-- Occurrences: A-open (capacity 1), A-private (offering not discoverable), A-cancelled,
-- A-past, B-open, C-open (studio not discoverable).
INSERT INTO class_occurrences (id, studio_id, offering_id, location_id, starts_at, ends_at, capacity, is_cancelled) VALUES
  ('aaaaaaaa-3000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2000-0000-0000-000000000001', 'aaaaaaaa-1000-0000-0000-000000000001', NOW() + interval '2 days',  NOW() + interval '2 days 1 hour',  1, FALSE),
  ('aaaaaaaa-3000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2000-0000-0000-000000000002', 'aaaaaaaa-1000-0000-0000-000000000001', NOW() + interval '3 days',  NOW() + interval '3 days 1 hour',  5, FALSE),
  ('aaaaaaaa-3000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2000-0000-0000-000000000001', 'aaaaaaaa-1000-0000-0000-000000000001', NOW() + interval '4 days',  NOW() + interval '4 days 1 hour',  1, TRUE),
  ('aaaaaaaa-3000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-2000-0000-0000-000000000001', 'aaaaaaaa-1000-0000-0000-000000000001', NOW() - interval '1 day',   NOW() - interval '23 hours',       1, FALSE),
  ('bbbbbbbb-3000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002', 'bbbbbbbb-2000-0000-0000-000000000001', 'bbbbbbbb-1000-0000-0000-000000000002', NOW() + interval '2 days',  NOW() + interval '2 days 1 hour',  8, FALSE),
  ('cccccccc-3000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003', 'cccccccc-2000-0000-0000-000000000001', 'cccccccc-1000-0000-0000-000000000003', NOW() + interval '2 days',  NOW() + interval '2 days 1 hour',  8, FALSE);

-- Class packs (so students can book through book_class()).
INSERT INTO class_pack_types (id, studio_id, name, class_count, price_cents) VALUES
  ('aaaaaaaa-4000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', '5 pack A', 5, 10000),
  ('bbbbbbbb-4000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000002', '5 pack B', 5, 10000);

INSERT INTO class_packs (id, studio_id, profile_id, class_pack_type_id, classes_remaining, classes_total, expires_at) VALUES
  ('aaaaaaaa-5000-0000-0000-0000000000a1', 'aaaaaaaa-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-0000000000a1', 'aaaaaaaa-4000-0000-0000-000000000001', 5, 5, NOW() + interval '90 days'),
  ('aaaaaaaa-5000-0000-0000-0000000000a2', 'aaaaaaaa-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-0000000000a2', 'aaaaaaaa-4000-0000-0000-000000000001', 5, 5, NOW() + interval '90 days'),
  ('bbbbbbbb-5000-0000-0000-0000000000b1', 'bbbbbbbb-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-0000000000b1', 'bbbbbbbb-4000-0000-0000-000000000002', 5, 5, NOW() + interval '90 days');

-- One transaction per studio (to prove staff of one cannot read the other's).
INSERT INTO transactions (studio_id, profile_id, type, amount_cents) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-0000000000a1', 'class_pack_purchase', 10000),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-0000000000b1', 'class_pack_purchase', 10000);
