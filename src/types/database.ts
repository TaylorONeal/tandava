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
