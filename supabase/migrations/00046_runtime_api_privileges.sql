-- Forward correction to 00045. REVIEW REQUIRED before production execution.
-- Preserve historical migrations; replace their broad grants only on the 161
-- app-owned tables present through 00044. Unknown tables/views/sequences and
-- function/schema grants are untouched. RLS policies are unchanged.
-- Migration 00045's default grants apply to its executing creator role. Run this
-- with the SAME creator; audit other creators/inherited/global grants separately.
-- Browser role operations: src/lib/backend/supabase.ts, lib/hosted/studioSettings.ts.
-- Server operations: supabase/functions/*/index.ts. RPC-only tables stay closed.

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated, service_role;

DO $acl$
DECLARE table_name text; columns_sql text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'ad_integrations', 'analytics_admission', 'analytics_daily', 'analytics_sessions',
    'audience_segment_members', 'audience_segments', 'audit_logs', 'audit_logs_archive',
    'automation_sends', 'automation_settings', 'benchmark_categories', 'benchmark_metrics',
    'booking_attribution_context', 'bookings', 'campaign_messages', 'campaign_sends',
    'campaigns', 'class_cancel_notices', 'class_occurrences', 'class_pack_types',
    'class_packs', 'class_zoom_meetings', 'clv_cohorts', 'connector_definitions',
    'consent_records', 'conversion_deliveries', 'conversion_events', 'conversion_funnels',
    'conversion_retry_queue', 'corporate_accounts', 'corporate_employees', 'credits',
    'email_templates', 'engagement_events', 'engagement_profiles', 'entity_sync_mappings',
    'event_log', 'event_pricing_tiers', 'event_registrations', 'event_sessions',
    'event_teachers', 'events', 'expansion_indicators', 'export_jobs',
    'express_booking_claims', 'gdpr_requests', 'gift_card_transactions', 'gift_cards',
    'guest_passes', 'household_members', 'households', 'import_error_patterns',
    'import_field_mappings', 'import_format_versions', 'import_jobs', 'import_jobs_v2',
    'import_quality_reports', 'import_row_results', 'instructor_availability', 'integrations',
    'intro_offer_redemptions', 'intro_offers', 'inventory_levels', 'inventory_movements',
    'kiosk_devices', 'landing_page_variants', 'landing_pages', 'link_clicks',
    'locations', 'member_check_in_codes', 'membership_addon_subscriptions', 'membership_addons',
    'membership_pauses', 'membership_types', 'memberships', 'messages',
    'milestone_achievements', 'milestones', 'mrr_snapshots', 'newsletter_subscribers',
    'notification_deliveries', 'notification_delivery_log', 'notification_preferences', 'notification_provider_configs',
    'notification_templates_v2', 'notifications', 'nudge_log', 'nudge_rules',
    'offerings', 'on_demand_member_subscriptions', 'on_demand_subscriptions', 'on_demand_videos',
    'payment_methods', 'payroll_entries', 'pl_monthly_summaries', 'pricing_rules',
    'products', 'profile_visitors', 'profiles', 'promo_codes',
    'promo_performance', 'promo_redemptions', 'purchase_order_items', 'purchase_orders',
    'push_subscriptions', 'referral_programs', 'referrals', 'refund_requests',
    'revenue_forecast_configs', 'revenue_forecasts', 'review_request_settings', 'review_requests',
    'room_configurations', 'schedule_overrides', 'schedule_rules', 'scheduled_exports',
    'scheduled_reports', 'schema_markers', 'seasonality_patterns', 'seat_holds',
    'seo_recommendations', 'series_enrollments', 'shift_trades', 'sms_conversations',
    'sms_messages', 'staff_tasks', 'stripe_events', 'student_playlist_items',
    'student_playlists', 'studio_benchmark_config', 'studio_connectors', 'studio_features',
    'studio_members', 'studio_onboarding', 'studio_staff', 'studios',
    'sub_requests', 'sync_operations', 'task_activity', 'task_attachments',
    'task_categories', 'task_comments', 'task_recurrence_rules', 'task_templates',
    'tips', 'transactions', 'utm_templates', 'video_collection_items',
    'video_collections', 'video_purchases', 'video_ratings', 'video_series',
    'video_series_items', 'video_watch_progress', 'video_watch_sessions', 'virtual_class_settings',
    'waitlist_promotions', 'waitlist_settings', 'waiver_signatures', 'waiver_templates',
    'webhook_endpoints'
  ] LOOP
    -- Table REVOKE does not remove a separately granted column privilege.
    SELECT string_agg(quote_ident(attname), ', ' ORDER BY attnum)
      INTO columns_sql FROM pg_attribute
      WHERE attrelid = format('public.%I', table_name)::regclass
        AND attnum > 0 AND NOT attisdropped;
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated, service_role', table_name);
    EXECUTE format('REVOKE ALL (%s) ON TABLE public.%I FROM PUBLIC, anon, authenticated, service_role', columns_sql, table_name);
  END LOOP;
END $acl$;

-- Public contact form only. Public discovery uses the existing definer RPCs.
GRANT INSERT ON public.messages TO anon, authenticated;

-- Browser reads, including PostgREST embedded relationships.
GRANT SELECT ON public.profiles, public.offerings,
  public.class_pack_types, public.membership_types, public.schedule_rules,
  public.locations, public.automation_settings, public.class_occurrences,
  public.bookings,
  public.memberships, public.class_packs TO authenticated;

-- Settings projection and schedule timezone embedding; no Stripe metadata.
GRANT SELECT (id, name, slug, email, phone, website, timezone, currency,
  brand_primary_color, brand_secondary_color, default_cancellation_minutes,
  late_cancel_fee_cents, no_show_fee_cents, waitlist_enabled, max_waitlist_size,
  discoverable, express_booking_enabled, page_live) ON public.studios TO authenticated;
-- Schedule badges and outstanding-count filters need only status and join keys.
-- Contact snapshots, message bodies and payment/error details use the authorized
-- class_cancel_followup definer RPC (owner/admin/front_desk), not raw SELECT.
GRANT SELECT (studio_id, occurrence_id, status) ON public.refund_requests TO authenticated;
GRANT SELECT (studio_id, occurrence_id, status, refund_told) ON public.class_cancel_notices TO authenticated;

-- Existing invoker RLS policies on profiles/studios/classes read these tables
-- (00001:717-788); their own RLS limits the dependency reads to participants.
GRANT SELECT (studio_id, profile_id, role, is_active) ON public.studio_staff TO authenticated;
GRANT SELECT (studio_id, profile_id) ON public.studio_members TO authenticated;

-- MyProfilePatch and markProfileClaimed; never identity/payment/admin columns.
GRANT UPDATE (first_name, last_name, phone, pronouns, date_of_birth,
  emergency_contact_name, emergency_contact_phone, instagram_handle,
  is_guest, claimed_at) ON public.profiles TO authenticated;
-- StudioSettingsPatch + public-page toggles; Stripe/platform fields stay server-only.
GRANT UPDATE (name, email, phone, website, timezone, currency,
  brand_primary_color, brand_secondary_color, default_cancellation_minutes,
  late_cancel_fee_cents, no_show_fee_cents, waitlist_enabled, max_waitlist_size,
  discoverable, express_booking_enabled, page_live) ON public.studios TO authenticated;
-- Catalog save (retirement uses is_active, not DELETE), and settings UPSERT.
GRANT INSERT, UPDATE ON public.offerings, public.class_pack_types,
  public.membership_types, public.schedule_rules, public.automation_settings TO authenticated;

-- Server-side direct Data API reads (BYPASSRLS does not bypass table ACLs).
GRANT SELECT ON public.analytics_sessions, public.automation_settings,
  public.automation_sends, public.booking_attribution_context, public.bookings,
  public.class_cancel_notices, public.class_occurrences, public.class_pack_types,
  public.consent_records, public.event_pricing_tiers, public.event_registrations,
  public.events, public.import_jobs, public.locations, public.membership_types,
  public.memberships, public.offerings, public.profile_visitors, public.profiles,
  public.push_subscriptions, public.refund_requests, public.schedule_rules,
  public.studio_members, public.studio_onboarding, public.studio_staff,
  public.studios, public.waiver_templates TO service_role;
-- Onboarding/import/guest claim INSERTs and UPSERTs.
GRANT INSERT ON public.studios, public.locations, public.offerings,
  public.membership_types, public.class_pack_types, public.schedule_rules,
  public.waiver_templates, public.profiles, public.studio_staff,
  public.studio_members, public.studio_onboarding, public.import_jobs,
  public.express_booking_claims TO service_role;
GRANT UPDATE ON public.studios, public.locations, public.offerings,
  public.membership_types, public.class_pack_types, public.schedule_rules,
  public.waiver_templates, public.profiles, public.studio_staff,
  public.studio_members, public.studio_onboarding, public.import_jobs,
  public.memberships, public.refund_requests, public.class_cancel_notices,
  public.booking_attribution_context, public.automation_sends TO service_role;
-- Only these direct server deletion paths exist: withdrawn automation claim and
-- expired push subscription. Booking, fulfillment and deletion remain RPC-only.
GRANT DELETE ON public.automation_sends, public.push_subscriptions TO service_role;
