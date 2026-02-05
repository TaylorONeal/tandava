// Tandava Studio Management Platform - TypeScript Types
// Generated from the Supabase schema for type-safe client usage

// ============================================================================
// ENUMS
// ============================================================================

export type UserRole = 'owner' | 'admin' | 'teacher' | 'front_desk' | 'student';
export type BookingStatus = 'confirmed' | 'waitlisted' | 'cancelled' | 'no_show' | 'checked_in' | 'late_cancel';
export type MembershipStatus = 'active' | 'paused' | 'cancelled' | 'expired' | 'past_due';
export type MembershipBillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'annual';
export type ClassPackStatus = 'active' | 'expired' | 'exhausted';
export type TransactionType = 'membership_purchase' | 'membership_renewal' | 'class_pack_purchase' | 'drop_in' | 'workshop' | 'retreat' | 'late_cancel_fee' | 'refund' | 'credit_purchase';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentMethodType = 'card' | 'bank_account' | 'apple_pay' | 'google_pay';
export type ScheduleRecurrence = 'daily' | 'weekly' | 'biweekly' | 'monthly';
export type OverrideType = 'sub' | 'cancellation' | 'room_change' | 'time_change' | 'one_off';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
export type ImportSource = 'mindbody' | 'walla' | 'arketa' | 'momoyoga' | 'generic_csv';
export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';
export type TeacherPayType = 'per_class' | 'revenue_share' | 'hourly' | 'salary';
export type CreditType = 'earned' | 'purchased' | 'gifted' | 'promotional';
export type CreditStatus = 'available' | 'used' | 'expired';

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface Studio {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  timezone: string;
  currency: string;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  discoverable: boolean;
  brand_primary_color: string;
  brand_secondary_color: string;
  brand_font: string;
  default_cancellation_minutes: number;
  late_cancel_fee_cents: number;
  no_show_fee_cents: number;
  waitlist_enabled: boolean;
  max_waitlist_size: number;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  studio_id: string;
  name: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  rooms: { name: string; capacity: number }[];
  amenities: string[];
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  pronouns: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  bio: string | null;
  specialties: string[];
  certifications: string[];
  instagram_handle: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudioStaff {
  id: string;
  studio_id: string;
  profile_id: string;
  role: UserRole;
  pay_type: TeacherPayType | null;
  pay_rate_cents: number | null;
  pay_revenue_share_pct: number | null;
  is_active: boolean;
  can_sub: boolean;
  notify_on_sub_request: boolean;
  notify_on_booking: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: Profile;
}

export interface StudioMember {
  id: string;
  studio_id: string;
  profile_id: string;
  notes: string | null;
  tags: string[];
  waiver_signed_at: string | null;
  total_classes_attended: number;
  last_class_at: string | null;
  lifetime_revenue_cents: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: Profile;
  memberships?: Membership[];
  class_packs?: ClassPack[];
}

export interface Offering {
  id: string;
  studio_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  style: string | null;
  level: string;
  is_heated: boolean;
  duration_minutes: number;
  capacity: number;
  drop_in_price_cents: number | null;
  image_url: string | null;
  what_to_bring: string[];
  benefits: string[];
  discoverable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleRule {
  id: string;
  studio_id: string;
  offering_id: string;
  location_id: string;
  teacher_id: string | null;
  recurrence: ScheduleRecurrence;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room: string | null;
  capacity_override: number | null;
  effective_from: string;
  effective_until: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  offering?: Offering;
  teacher?: Profile;
  location?: Location;
}

export interface ClassOccurrence {
  id: string;
  studio_id: string;
  offering_id: string;
  schedule_rule_id: string | null;
  location_id: string;
  teacher_id: string | null;
  starts_at: string;
  ends_at: string;
  room: string | null;
  capacity: number;
  is_cancelled: boolean;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  original_teacher_id: string | null;
  is_subbed: boolean;
  sub_requested_at: string | null;
  sub_confirmed_at: string | null;
  sub_notes: string | null;
  booked_count: number;
  waitlist_count: number;
  checked_in_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  offering?: Offering;
  teacher?: Profile;
  original_teacher?: Profile;
  location?: Location;
  bookings?: Booking[];
}

export interface ScheduleOverride {
  id: string;
  studio_id: string;
  class_occurrence_id: string;
  override_type: OverrideType;
  new_teacher_id: string | null;
  new_room: string | null;
  new_starts_at: string | null;
  new_ends_at: string | null;
  reason: string | null;
  created_by: string | null;
  students_notified: boolean;
  notified_at: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  studio_id: string;
  class_occurrence_id: string;
  profile_id: string;
  status: BookingStatus;
  waitlist_position: number | null;
  membership_id: string | null;
  class_pack_id: string | null;
  transaction_id: string | null;
  checked_in_at: string | null;
  checked_in_by: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  is_late_cancel: boolean;
  booked_at: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: Profile;
  class_occurrence?: ClassOccurrence;
}

export interface MembershipType {
  id: string;
  studio_id: string;
  name: string;
  description: string | null;
  billing_cycle: MembershipBillingCycle;
  price_cents: number;
  classes_per_cycle: number | null;
  locations: string[];
  offering_ids: string[];
  trial_days: number;
  trial_price_cents: number;
  auto_renew: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  studio_id: string;
  profile_id: string;
  membership_type_id: string;
  status: MembershipStatus;
  current_period_start: string;
  current_period_end: string;
  classes_used_this_cycle: number;
  stripe_subscription_id: string | null;
  stripe_payment_method_id: string | null;
  started_at: string;
  paused_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  membership_type?: MembershipType;
}

export interface ClassPackType {
  id: string;
  studio_id: string;
  name: string;
  description: string | null;
  class_count: number;
  price_cents: number;
  validity_days: number;
  offering_ids: string[];
  locations: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ClassPack {
  id: string;
  studio_id: string;
  profile_id: string;
  class_pack_type_id: string;
  status: ClassPackStatus;
  classes_remaining: number;
  classes_total: number;
  purchased_at: string;
  expires_at: string;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  class_pack_type?: ClassPackType;
}

export interface Transaction {
  id: string;
  studio_id: string;
  profile_id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount_cents: number;
  currency: string;
  tax_cents: number;
  net_amount_cents: number | null;
  platform_fee_cents: number;
  membership_id: string | null;
  class_pack_id: string | null;
  booking_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  stripe_refund_id: string | null;
  refunded_amount_cents: number;
  refund_reason: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined fields
  profile?: Profile;
}

export interface Credit {
  id: string;
  studio_id: string;
  profile_id: string;
  type: CreditType;
  status: CreditStatus;
  amount_cents: number;
  remaining_cents: number;
  reason: string | null;
  expires_at: string | null;
  used_at: string | null;
  transaction_id: string | null;
  booking_id: string | null;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  studio_id: string;
  profile_id: string;
  type: PaymentMethodType;
  stripe_payment_method_id: string;
  brand: string | null;
  last_four: string | null;
  exp_month: number | null;
  exp_year: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface PayrollEntry {
  id: string;
  studio_id: string;
  teacher_id: string;
  class_occurrence_id: string | null;
  pay_type: TeacherPayType;
  base_rate_cents: number | null;
  revenue_share_pct: number | null;
  calculated_amount_cents: number;
  class_date: string;
  class_name: string | null;
  attendee_count: number;
  class_revenue_cents: number;
  is_paid: boolean;
  paid_at: string | null;
  payment_reference: string | null;
  pay_period_start: string | null;
  pay_period_end: string | null;
  created_at: string;
  // Joined fields
  teacher?: Profile;
}

export interface Notification {
  id: string;
  studio_id: string;
  profile_id: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  action_url: string | null;
  class_occurrence_id: string | null;
  booking_id: string | null;
  is_read: boolean;
  read_at: string | null;
  sent_at: string;
  created_at: string;
}

export interface ImportJob {
  id: string;
  studio_id: string;
  source: ImportSource;
  status: ImportStatus;
  file_name: string | null;
  file_url: string | null;
  file_size_bytes: number | null;
  column_mapping: Record<string, string>;
  total_rows: number;
  processed_rows: number;
  success_rows: number;
  error_rows: number;
  skipped_rows: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  import_type: string;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  value: string;
}

export interface ImportWarning {
  row: number;
  field: string;
  message: string;
}

export interface ImportFieldMapping {
  id: string;
  source: ImportSource;
  import_type: string;
  source_field: string;
  target_table: string;
  target_field: string;
  transform_function: string | null;
  is_required: boolean;
  default_value: string | null;
  description: string | null;
  created_at: string;
}

// ============================================================================
// OPERATIONAL WORKFLOW TYPES (Migration 002)
// ============================================================================

// Enums
export type PromoDiscountType = 'percentage' | 'fixed_amount' | 'free_classes';
export type PromoStatus = 'active' | 'scheduled' | 'expired' | 'disabled';
export type GiftCardStatus = 'active' | 'partially_used' | 'exhausted' | 'expired' | 'revoked';
export type WaiverStatus = 'draft' | 'active' | 'archived';
export type ReferralStatus = 'pending' | 'completed' | 'expired' | 'rewarded';
export type MembershipPauseStatus = 'active' | 'ended' | 'cancelled';
export type WebhookEventType =
  | 'booking.created' | 'booking.cancelled' | 'booking.checked_in' | 'booking.waitlist_promoted'
  | 'membership.created' | 'membership.renewed' | 'membership.paused' | 'membership.resumed'
  | 'membership.cancelled' | 'membership.expired' | 'membership.payment_failed'
  | 'student.registered' | 'student.first_class' | 'student.milestone'
  | 'class.cancelled' | 'class.teacher_subbed' | 'class.spots_available'
  | 'transaction.completed' | 'transaction.refunded'
  | 'studio.onboarding_complete';
export type IntegrationProvider =
  | 'mailchimp' | 'convertkit' | 'sendgrid' | 'resend'
  | 'hubspot' | 'salesforce'
  | 'meta_ads' | 'google_ads'
  | 'google_calendar' | 'apple_calendar'
  | 'quickbooks' | 'xero'
  | 'twilio' | 'slack'
  | 'custom_webhook';
export type OnboardingStep =
  'studio_info' | 'location' | 'branding' | 'offerings' | 'schedule' |
  'pricing' | 'staff' | 'waivers' | 'import' | 'stripe' | 'launch';

// Promo Codes
export interface PromoCode {
  id: string;
  studio_id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: PromoDiscountType;
  discount_value: number;
  applies_to: string[];
  offering_ids: string[];
  membership_type_ids: string[];
  new_students_only: boolean;
  min_purchase_cents: number | null;
  max_discount_cents: number | null;
  max_total_uses: number | null;
  max_uses_per_student: number;
  current_uses: number;
  status: PromoStatus;
  starts_at: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromoRedemption {
  id: string;
  promo_code_id: string;
  studio_id: string;
  profile_id: string;
  transaction_id: string | null;
  discount_amount_cents: number;
  original_amount_cents: number;
  redeemed_at: string;
}

// Intro Offers
export interface IntroOffer {
  id: string;
  studio_id: string;
  name: string;
  description: string | null;
  offer_type: string;
  free_class_count: number | null;
  original_price_cents: number | null;
  offer_price_cents: number | null;
  trial_days: number | null;
  new_students_only: boolean;
  max_days_since_registration: number | null;
  max_redemptions: number | null;
  current_redemptions: number;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Guest Passes
export interface GuestPass {
  id: string;
  studio_id: string;
  purchased_by_id: string;
  transaction_id: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  recipient_profile_id: string | null;
  code: string;
  offering_ids: string[];
  classes_included: number;
  classes_used: number;
  expires_at: string;
  is_redeemed: boolean;
  redeemed_at: string | null;
  personal_message: string | null;
  created_at: string;
}

// Membership Pauses
export interface MembershipPause {
  id: string;
  membership_id: string;
  studio_id: string;
  profile_id: string;
  status: MembershipPauseStatus;
  paused_at: string;
  scheduled_resume_at: string | null;
  actual_resumed_at: string | null;
  reason: string | null;
  initiated_by: string | null;
  resumed_by: string | null;
  created_at: string;
}

// Gift Cards
export interface GiftCard {
  id: string;
  studio_id: string;
  purchased_by_id: string | null;
  transaction_id: string | null;
  code: string;
  original_amount_cents: number;
  remaining_amount_cents: number;
  status: GiftCardStatus;
  recipient_name: string | null;
  recipient_email: string | null;
  recipient_profile_id: string | null;
  personal_message: string | null;
  expires_at: string | null;
  redeemed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Waivers
export interface WaiverTemplate {
  id: string;
  studio_id: string;
  name: string;
  content: string;
  required_for_booking: boolean;
  status: WaiverStatus;
  version: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaiverSignature {
  id: string;
  waiver_template_id: string;
  studio_id: string;
  profile_id: string;
  waiver_version: number;
  signed_at: string;
  ip_address: string | null;
  user_agent: string | null;
  full_name_as_signed: string;
}

// Referrals
export interface ReferralProgram {
  id: string;
  studio_id: string;
  name: string;
  description: string | null;
  referrer_reward_type: string;
  referrer_reward_value: number;
  referee_reward_type: string;
  referee_reward_value: number;
  require_referee_purchase: boolean;
  max_referrals_per_student: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  referral_program_id: string;
  studio_id: string;
  referrer_id: string;
  referee_email: string;
  referee_id: string | null;
  referral_code: string;
  status: ReferralStatus;
  referrer_rewarded_at: string | null;
  referee_rewarded_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// Onboarding
export interface StudioOnboarding {
  id: string;
  studio_id: string;
  completed_steps: OnboardingStep[];
  current_step: OnboardingStep;
  has_location: boolean;
  has_branding: boolean;
  has_offerings: boolean;
  has_schedule: boolean;
  has_pricing: boolean;
  has_staff: boolean;
  has_waiver: boolean;
  has_imported_data: boolean;
  has_stripe: boolean;
  is_launched: boolean;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Integrations
export interface Integration {
  id: string;
  studio_id: string;
  provider: IntegrationProvider;
  name: string;
  config: Record<string, unknown>;
  subscribed_events: WebhookEventType[];
  is_active: boolean;
  last_synced_at: string | null;
  last_error: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookEndpoint {
  id: string;
  studio_id: string;
  url: string;
  description: string | null;
  signing_secret: string;
  subscribed_events: WebhookEventType[];
  is_active: boolean;
  total_deliveries: number;
  total_failures: number;
  last_delivered_at: string | null;
  last_failure_at: string | null;
  last_failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventLogEntry {
  id: string;
  studio_id: string;
  event_type: WebhookEventType;
  entity_type: string;
  entity_id: string;
  actor_id: string | null;
  actor_role: UserRole | null;
  payload: Record<string, unknown>;
  webhook_delivered: boolean;
  integration_processed: boolean;
  occurred_at: string;
}

// ============================================================================
// EVENTS, LANDING PAGES, ANALYTICS, ENGAGEMENT (Migration 003)
// ============================================================================

// Enums
export type EventType = 'workshop' | 'training' | 'retreat' | 'series' | 'immersion';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed' | 'sold_out';
export type EventRegistrationStatus = 'registered' | 'waitlisted' | 'cancelled' | 'refunded' | 'attended';
export type LandingPageStatus = 'draft' | 'published' | 'archived';
export type ContentBlockType = 'hero' | 'text' | 'features' | 'testimonials' | 'cta' | 'faq' | 'gallery' | 'schedule' | 'pricing' | 'team';
export type SeoSeverity = 'info' | 'warning' | 'critical';
export type NewsletterStatus = 'pending' | 'confirmed' | 'unsubscribed' | 'bounced';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type ConversionType = 'booking' | 'signup' | 'purchase' | 'newsletter';
export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'churned';
export type TimePreference = 'morning' | 'midday' | 'evening';
export type NudgeType = 'booking_reminder' | 'streak_at_risk' | 'comeback' | 'milestone_approaching' | 'new_class_suggestion' | 'pack_running_low' | 'membership_expiring' | 'friend_activity' | 'event_recommendation' | 'review_request';
export type NudgeChannel = 'in_app' | 'push' | 'email';
export type EngagementEventName = 'app_open' | 'schedule_view' | 'class_detail_view' | 'booking_started' | 'booking_completed' | 'check_in' | 'review_submitted' | 'referral_sent' | 'event_viewed' | 'landing_page_viewed' | 'newsletter_signup' | 'promo_applied' | 'membership_page_viewed' | 'streak_shared';

// Events / Workshops
export interface StudioEvent {
  id: string;
  studio_id: string;
  title: string;
  slug: string;
  description: string | null;
  long_description: string | null;
  event_type: EventType;
  status: EventStatus;
  image_url: string | null;
  gallery_urls: string[];
  location_id: string | null;
  venue_name: string | null;
  venue_address: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string;
  total_capacity: number | null;
  registered_count: number;
  waitlist_count: number;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  cancellation_policy: string | null;
  refund_policy: string | null;
  what_to_bring: string[];
  prerequisites: string | null;
  is_recurring: boolean;
  series_id: string | null;
  tags: string[];
  discoverable: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventSession {
  id: string;
  event_id: string;
  studio_id: string;
  title: string | null;
  description: string | null;
  starts_at: string;
  ends_at: string;
  room: string | null;
  capacity_override: number | null;
  sort_order: number;
  created_at: string;
}

export interface EventTeacher {
  id: string;
  event_id: string;
  studio_id: string;
  teacher_id: string;
  role: string;
  sort_order: number;
  created_at: string;
  // Joined
  teacher?: Profile;
}

export interface EventPricingTier {
  id: string;
  event_id: string;
  studio_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  capacity: number | null;
  sold_count: number;
  early_bird_price_cents: number | null;
  early_bird_ends_at: string | null;
  member_price_cents: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  studio_id: string;
  profile_id: string;
  pricing_tier_id: string | null;
  session_ids: string[];
  status: EventRegistrationStatus;
  amount_paid_cents: number;
  transaction_id: string | null;
  promo_code_id: string | null;
  discount_cents: number;
  waitlist_position: number | null;
  notes: string | null;
  registered_at: string;
  cancelled_at: string | null;
  attended_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  profile?: Profile;
  event?: StudioEvent;
}

// Landing Pages
export interface LandingPage {
  id: string;
  studio_id: string;
  title: string;
  slug: string;
  meta_description: string | null;
  meta_keywords: string[];
  og_image_url: string | null;
  status: LandingPageStatus;
  content_blocks: ContentBlock[];
  custom_css: string | null;
  header_script: string | null;
  conversion_goal: ConversionType | null;
  total_views: number;
  unique_views: number;
  total_conversions: number;
  conversion_rate: number;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentBlock {
  type: ContentBlockType;
  content: Record<string, unknown>;
  sort_order: number;
}

export interface SeoRecommendation {
  id: string;
  landing_page_id: string;
  studio_id: string;
  category: string;
  severity: SeoSeverity;
  title: string;
  description: string;
  current_value: string | null;
  recommended_value: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

// Newsletter
export interface NewsletterSubscriber {
  id: string;
  studio_id: string;
  email: string;
  profile_id: string | null;
  first_name: string | null;
  last_name: string | null;
  status: NewsletterStatus;
  source: string;
  source_detail: string | null;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// Analytics Sessions
export interface AnalyticsSession {
  id: string;
  studio_id: string;
  profile_id: string | null;
  session_token: string;
  referrer_url: string | null;
  referrer_domain: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_page_url: string | null;
  landing_page_id: string | null;
  device_type: DeviceType | null;
  browser: string | null;
  os: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  page_views: number;
  duration_seconds: number;
  converted: boolean;
  conversion_type: ConversionType | null;
  conversion_entity_id: string | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

// Analytics Daily Aggregation
export interface AnalyticsDaily {
  id: string;
  studio_id: string;
  date: string;
  total_sessions: number;
  unique_visitors: number;
  page_views: number;
  total_bookings: number;
  total_signups: number;
  total_purchases: number;
  total_newsletter_signups: number;
  revenue_cents: number;
  top_referrers: Record<string, number>[];
  top_campaigns: Record<string, number>[];
  top_landing_pages: Record<string, number>[];
  total_check_ins: number;
  avg_class_fill_rate: number;
  returning_students: number;
  new_students: number;
  created_at: string;
  updated_at: string;
}

// Engagement Profiles
export interface EngagementProfile {
  id: string;
  studio_id: string;
  profile_id: string;
  is_activated: boolean;
  activation_date: string | null;
  days_to_activate: number | null;
  current_streak_weeks: number;
  longest_streak_weeks: number;
  avg_classes_per_week: number;
  preferred_day: DayOfWeek | null;
  preferred_time: TimePreference | null;
  preferred_styles: string[];
  preferred_teachers: string[];
  days_since_last_class: number;
  risk_level: RiskLevel;
  risk_updated_at: string | null;
  milestones_reached: string[];
  next_milestone: string | null;
  next_milestone_progress: number;
  engagement_score: number;
  computed_at: string;
  created_at: string;
  updated_at: string;
  // Joined
  profile?: Profile;
}

// Engagement Events
export interface EngagementEvent {
  id: string;
  studio_id: string;
  profile_id: string | null;
  session_id: string | null;
  event: EngagementEventName;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
}

// Nudge Rules
export interface NudgeRule {
  id: string;
  studio_id: string;
  nudge_type: NudgeType;
  is_active: boolean;
  trigger_condition: Record<string, unknown>;
  channel: NudgeChannel;
  title_template: string;
  body_template: string;
  action_url: string | null;
  max_per_week: number;
  max_per_month: number;
  cooldown_hours: number;
  can_dismiss: boolean;
  created_at: string;
  updated_at: string;
}

export interface NudgeLogEntry {
  id: string;
  nudge_rule_id: string;
  studio_id: string;
  profile_id: string;
  channel: NudgeChannel;
  title: string;
  body: string;
  action_url: string | null;
  delivered_at: string;
  seen_at: string | null;
  clicked_at: string | null;
  dismissed_at: string | null;
  converted: boolean;
  conversion_entity_id: string | null;
}

// Milestones
export interface Milestone {
  id: string;
  studio_id: string | null;
  key: string;
  name: string;
  description: string | null;
  criteria: Record<string, unknown>;
  reward_type: string | null;
  reward_value: number | null;
  icon: string | null;
  badge_image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MilestoneAchievement {
  id: string;
  milestone_id: string;
  studio_id: string;
  profile_id: string;
  achieved_at: string;
  reward_granted: boolean;
  reward_transaction_id: string | null;
  shared: boolean;
  created_at: string;
  // Joined
  milestone?: Milestone;
  profile?: Profile;
}

// ============================================================================
// ADVANCED ANALYTICS (Migration 004)
// ============================================================================

// MRR Snapshots
export interface MrrSnapshot {
  id: string;
  studio_id: string;
  snapshot_date: string;
  total_mrr_cents: number;
  new_mrr_cents: number;
  expansion_mrr_cents: number;
  contraction_mrr_cents: number;
  churned_mrr_cents: number;
  reactivation_mrr_cents: number;
  paused_mrr_cents: number;
  active_memberships: number;
  new_memberships: number;
  churned_memberships: number;
  paused_memberships: number;
  net_membership_change: number;
  created_at: string;
}

// Revenue Forecast
export interface RevenueForecastConfig {
  id: string;
  studio_id: string;
  name: string;
  assumptions: {
    expected_churn_rate?: number;
    expected_growth_rate?: number;
    avg_new_students_per_month?: number;
    avg_revenue_per_student_cents?: number;
    seasonal_adjustments?: Record<string, number>;
    pause_rate?: number;
    app_store_cut_pct?: number;
    payment_processing_fee_pct?: number;
    expected_payroll_pct?: number;
    rent_cents_monthly?: number;
    other_fixed_costs_cents?: number;
  };
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RevenueForecast {
  id: string;
  studio_id: string;
  config_id: string;
  forecast_month: string;
  projected_mrr_cents: number;
  projected_total_revenue_cents: number;
  projected_membership_revenue_cents: number;
  projected_pack_revenue_cents: number;
  projected_dropin_revenue_cents: number;
  projected_event_revenue_cents: number;
  projected_expenses_cents: number;
  projected_payroll_cents: number;
  projected_platform_fees_cents: number;
  projected_net_revenue_cents: number;
  projected_active_members: number;
  confidence_level: number;
  computed_at: string;
  created_at: string;
}

// Customer Lifetime Value
export type AcquisitionSource = 'organic' | 'referral' | 'promo' | 'event' | 'landing_page' | 'walk_in' | 'import';

export interface ClvCohort {
  id: string;
  studio_id: string;
  cohort_month: string;
  acquisition_source: AcquisitionSource;
  total_students: number;
  still_active: number;
  avg_lifetime_days: number;
  avg_total_revenue_cents: number;
  avg_classes_attended: number;
  median_total_revenue_cents: number;
  retention_rate_30d: number;
  retention_rate_90d: number;
  retention_rate_180d: number;
  retention_rate_365d: number;
  projected_clv_cents: number;
  computed_at: string;
  created_at: string;
}

// P&L Summaries
export interface PlMonthlySummary {
  id: string;
  studio_id: string;
  month: string;
  // Revenue
  membership_revenue_cents: number;
  pack_revenue_cents: number;
  dropin_revenue_cents: number;
  event_revenue_cents: number;
  gift_card_revenue_cents: number;
  other_revenue_cents: number;
  total_gross_revenue_cents: number;
  refunds_cents: number;
  discounts_cents: number;
  total_net_revenue_cents: number;
  // Expenses
  payroll_cents: number;
  payment_processing_fees_cents: number;
  platform_fees_cents: number;
  rent_cents: number;
  utilities_cents: number;
  insurance_cents: number;
  marketing_cents: number;
  software_cents: number;
  other_expenses_cents: number;
  total_expenses_cents: number;
  // Bottom line
  net_operating_income_cents: number;
  operating_margin_pct: number;
  notes: string | null;
  is_finalized: boolean;
  finalized_by: string | null;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
}

// Promo Performance
export interface PromoPerformance {
  id: string;
  studio_id: string;
  promo_code_id: string;
  period_start: string;
  period_end: string;
  total_redemptions: number;
  unique_students: number;
  total_discount_cents: number;
  total_revenue_from_promo_users_cents: number;
  new_students_acquired: number;
  returning_students: number;
  subsequent_purchases: number;
  subsequent_revenue_cents: number;
  estimated_roi_pct: number;
  computed_at: string;
  created_at: string;
}

// Conversion Funnels
export interface ConversionFunnel {
  id: string;
  studio_id: string;
  period_start: string;
  period_end: string;
  funnel_type: string;
  steps: FunnelStep[];
  overall_conversion_rate: number;
  top_drop_off_step: string | null;
  computed_at: string;
  created_at: string;
}

export interface FunnelStep {
  step_name: string;
  count: number;
  drop_off_rate: number;
  conversion_rate: number;
}

// Seasonality
export interface SeasonalityPattern {
  id: string;
  studio_id: string;
  year: number;
  metric_type: string;
  monthly_values: Record<string, number>;
  monthly_indexes: Record<string, number>;
  peak_month: number;
  trough_month: number;
  seasonal_variance: number;
  computed_at: string;
  created_at: string;
}

// Benchmarks
export interface BenchmarkCategory {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  studio_size: string;
  created_at: string;
}

export interface BenchmarkMetric {
  id: string;
  category_id: string;
  metric_name: string;
  display_name: string;
  description: string | null;
  unit: string;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  source: string;
  sample_size: number | null;
  last_updated: string | null;
  created_at: string;
}

export interface StudioBenchmarkConfig {
  id: string;
  studio_id: string;
  benchmark_category_id: string;
  contribute_anonymous_metrics: boolean;
  contributing_since: string | null;
  last_contributed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Scheduled Reports
export interface ScheduledReport {
  id: string;
  studio_id: string;
  name: string;
  report_type: string;
  frequency: string;
  delivery_day: number | null;
  delivery_hour: number;
  recipients: { profile_id: string; email: string }[];
  filters: Record<string, unknown> | null;
  format: string;
  is_active: boolean;
  last_sent_at: string | null;
  next_send_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Expansion Analysis
export interface ExpansionIndicator {
  id: string;
  studio_id: string;
  analyzed_at: string;
  avg_class_fill_rate: number;
  peak_hour_fill_rate: number;
  classes_at_capacity_pct: number;
  waitlist_frequency: number;
  new_student_growth_rate: number;
  student_zip_code_distribution: Record<string, number>;
  search_demand_notes: string | null;
  current_monthly_net_income_cents: number;
  revenue_growth_rate_3m: number;
  revenue_growth_rate_12m: number;
  operating_margin_pct: number;
  expansion_score: number;
  recommendation: string;
  reasoning: { signal: string; value: number | string; interpretation: string }[];
  created_at: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export function formatCents(cents: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function getFullName(profile: Profile): string {
  if (profile.display_name) return profile.display_name;
  return [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email;
}

export function getInitials(profile: Profile): string {
  const name = getFullName(profile);
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
