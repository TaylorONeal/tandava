-- Apply 00041 (function hardening, LP-8) to tandava-prod. Independent of 00038..00040.
-- Paste all of it into https://supabase.com/dashboard/project/mkaixgjwakfufmmwembn/sql/new and Run.
BEGIN;
-- 00041: clear the Supabase security advisor warnings that are real (LP-8).
--
-- 1. Function Search Path Mutable (21 functions, all from the original schema
--    and feature migrations). A function without a pinned search_path resolves
--    unqualified names through the caller's search_path, so a caller who can
--    create objects earlier in that path can hijack it. Pin every listed
--    function to `public, extensions` (pg_catalog is always searched first).
--    `extensions` stays visible because hosted Supabase installs pgcrypto there
--    and generate_check_in_code calls gen_random_bytes unqualified.
-- 2. SECURITY DEFINER trigger functions callable over the API. Postgres checks
--    EXECUTE on a trigger function only when the trigger is created, never when
--    it fires, so revoking it from PUBLIC, anon and authenticated changes
--    nothing for the triggers and removes them from /rest/v1/rpc.
-- 3. book_free_class: anon could call it (it then raises "Sign in to book").
--    Signed-in only now.
--
-- Left as is on purpose, with the reason:
-- - my_staff_studio_ids, my_admin_studio_ids, my_household_ids,
--   my_staff_household_ids: RLS policies call them for every role, including
--   anon on public tables; revoking EXECUTE would break those reads. For anon
--   they return nothing.
-- - Public read RPCs (discover_classes, get_studio_storefront,
--   get_public_schedule, get_public_occurrence): public by design.
-- - The authenticated SECURITY DEFINER RPCs (book_class, cancel_booking, ...):
--   the app's write path; each checks auth.uid() and studio membership itself.

DO $$
DECLARE f RECORD;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p
     WHERE p.pronamespace = 'public'::regnamespace
       AND p.proname IN (
         'increment_promo_usage', 'increment_intro_offer_usage', 'decrement_gift_card_balance',
         'update_event_registration_counts', 'increment_landing_page_views', 'get_available_inventory',
         'can_cancel_membership', 'update_inventory_on_sale', 'update_updated_at', 'update_booking_counts',
         'promote_from_waitlist', 'decrement_class_pack', 'increment_membership_usage',
         'update_member_stats_on_checkin', 'process_waitlist_promotion', 'generate_check_in_code',
         'update_task_attachments_count', 'log_task_status_change', 'update_campaign_stats',
         'update_video_rating', 'bookings_entitlement_sync')
       AND NOT EXISTS (SELECT 1 FROM unnest(COALESCE(p.proconfig, '{}')) c WHERE c LIKE 'search_path=%')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions', f.sig);
  END LOOP;

  FOR f IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p
     WHERE p.pronamespace = 'public'::regnamespace
       AND p.prosecdef
       AND p.prorettype = 'trigger'::regtype
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
  END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION book_free_class(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION book_free_class(UUID) TO authenticated;
COMMIT;
