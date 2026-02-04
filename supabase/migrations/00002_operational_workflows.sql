-- Tandava Studio Management Platform
-- Migration 002: Operational Workflows & Integration Architecture
--
-- Adds: promo codes, intro offers, guest passes, membership pause rules,
--       gift cards, waivers, referrals, onboarding tracking, and the
--       webhook/event system for future CRM/email/advertising integrations.

-- ============================================================================
-- NEW ENUMS
-- ============================================================================

CREATE TYPE promo_discount_type AS ENUM ('percentage', 'fixed_amount', 'free_classes');
CREATE TYPE promo_status AS ENUM ('active', 'scheduled', 'expired', 'disabled');
CREATE TYPE gift_card_status AS ENUM ('active', 'partially_used', 'exhausted', 'expired', 'revoked');
CREATE TYPE waiver_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE referral_status AS ENUM ('pending', 'completed', 'expired', 'rewarded');
CREATE TYPE webhook_event_type AS ENUM (
  -- Booking events
  'booking.created', 'booking.cancelled', 'booking.checked_in', 'booking.waitlist_promoted',
  -- Membership events
  'membership.created', 'membership.renewed', 'membership.paused', 'membership.resumed',
  'membership.cancelled', 'membership.expired', 'membership.payment_failed',
  -- Student events
  'student.registered', 'student.first_class', 'student.milestone',
  -- Class events
  'class.cancelled', 'class.teacher_subbed', 'class.spots_available',
  -- Transaction events
  'transaction.completed', 'transaction.refunded',
  -- Studio events
  'studio.onboarding_complete'
);
CREATE TYPE integration_provider AS ENUM (
  -- Email marketing
  'mailchimp', 'convertkit', 'sendgrid', 'resend',
  -- CRM
  'hubspot', 'salesforce',
  -- Advertising
  'meta_ads', 'google_ads',
  -- Calendar
  'google_calendar', 'apple_calendar',
  -- Accounting
  'quickbooks', 'xero',
  -- Communication
  'twilio', 'slack',
  -- Custom
  'custom_webhook'
);
CREATE TYPE onboarding_step AS ENUM (
  'studio_info', 'location', 'branding', 'offerings', 'schedule',
  'pricing', 'staff', 'waivers', 'import', 'stripe', 'launch'
);
CREATE TYPE membership_pause_status AS ENUM ('active', 'ended', 'cancelled');

-- ============================================================================
-- PROMO CODES & DISCOUNTS
-- ============================================================================

CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  -- Discount configuration
  discount_type promo_discount_type NOT NULL,
  discount_value INTEGER NOT NULL, -- percentage (0-100) or cents or class count
  -- Applicability
  applies_to TEXT[] DEFAULT '{}', -- 'membership', 'class_pack', 'drop_in', 'workshop', 'retreat'
  offering_ids UUID[] DEFAULT '{}', -- empty = all offerings
  membership_type_ids UUID[] DEFAULT '{}', -- empty = all membership types
  -- Restrictions
  new_students_only BOOLEAN DEFAULT FALSE,
  min_purchase_cents INTEGER, -- minimum purchase amount to apply
  max_discount_cents INTEGER, -- cap the discount at this amount
  -- Usage limits
  max_total_uses INTEGER, -- null = unlimited
  max_uses_per_student INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  -- Validity
  status promo_status NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id, code)
);

CREATE INDEX idx_promo_codes_studio ON promo_codes(studio_id);
CREATE INDEX idx_promo_codes_code ON promo_codes(studio_id, code);

CREATE TABLE promo_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id),
  -- What was discounted
  discount_amount_cents INTEGER NOT NULL,
  original_amount_cents INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_promo_redemptions_code ON promo_redemptions(promo_code_id);
CREATE INDEX idx_promo_redemptions_profile ON promo_redemptions(profile_id);

-- ============================================================================
-- INTRO OFFERS (first class free, new student specials)
-- ============================================================================

CREATE TABLE intro_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- What the offer provides
  offer_type TEXT NOT NULL, -- 'free_class', 'discounted_pack', 'discounted_membership', 'trial_period'
  -- For free_class: how many free classes
  free_class_count INTEGER,
  -- For discounted pricing
  original_price_cents INTEGER,
  offer_price_cents INTEGER,
  -- For trial periods (auto-applies to membership_types.trial_days)
  trial_days INTEGER,
  -- Eligibility
  new_students_only BOOLEAN DEFAULT TRUE,
  max_days_since_registration INTEGER, -- null = no time limit
  -- Limits
  max_redemptions INTEGER, -- null = unlimited
  current_redemptions INTEGER DEFAULT 0,
  -- Validity
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_intro_offers_studio ON intro_offers(studio_id);

CREATE TABLE intro_offer_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  intro_offer_id UUID NOT NULL REFERENCES intro_offers(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(intro_offer_id, profile_id) -- one redemption per student per offer
);

-- ============================================================================
-- GUEST PASSES (buy a class for someone else)
-- ============================================================================

CREATE TABLE guest_passes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  -- Who purchased
  purchased_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id),
  -- Recipient (may not have an account yet)
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_profile_id UUID REFERENCES profiles(id),
  -- Pass details
  code TEXT NOT NULL UNIQUE, -- shareable redemption code
  offering_ids UUID[] DEFAULT '{}', -- empty = any class
  classes_included INTEGER NOT NULL DEFAULT 1,
  classes_used INTEGER DEFAULT 0,
  -- Validity
  expires_at TIMESTAMPTZ NOT NULL,
  is_redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMPTZ,
  -- Message
  personal_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guest_passes_studio ON guest_passes(studio_id);
CREATE INDEX idx_guest_passes_code ON guest_passes(code);
CREATE INDEX idx_guest_passes_purchaser ON guest_passes(purchased_by_id);

-- ============================================================================
-- MEMBERSHIP PAUSE RULES & HISTORY
-- Extends the existing memberships table with pause governance
-- ============================================================================

-- Studio-level pause rules per membership type
ALTER TABLE membership_types ADD COLUMN IF NOT EXISTS allow_pause BOOLEAN DEFAULT FALSE;
ALTER TABLE membership_types ADD COLUMN IF NOT EXISTS max_pause_days INTEGER; -- max days per pause
ALTER TABLE membership_types ADD COLUMN IF NOT EXISTS max_pauses_per_year INTEGER; -- null = unlimited
ALTER TABLE membership_types ADD COLUMN IF NOT EXISTS min_active_days_before_pause INTEGER DEFAULT 30;
ALTER TABLE membership_types ADD COLUMN IF NOT EXISTS pause_extends_billing BOOLEAN DEFAULT TRUE;

-- Commitment period (minimum months before cancellation allowed)
ALTER TABLE membership_types ADD COLUMN IF NOT EXISTS commitment_months INTEGER DEFAULT 0;
ALTER TABLE membership_types ADD COLUMN IF NOT EXISTS early_cancel_fee_cents INTEGER DEFAULT 0;

-- Track each pause period
CREATE TABLE membership_pauses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status membership_pause_status NOT NULL DEFAULT 'active',
  -- Dates
  paused_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_resume_at TIMESTAMPTZ, -- when it should auto-resume
  actual_resumed_at TIMESTAMPTZ,
  -- Reason
  reason TEXT,
  -- Who initiated
  initiated_by UUID REFERENCES profiles(id), -- could be student or staff
  resumed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_membership_pauses_membership ON membership_pauses(membership_id);
CREATE INDEX idx_membership_pauses_studio ON membership_pauses(studio_id);

-- ============================================================================
-- GIFT CARDS / CERTIFICATES
-- ============================================================================

CREATE TABLE gift_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  -- Purchase info
  purchased_by_id UUID REFERENCES profiles(id),
  transaction_id UUID REFERENCES transactions(id),
  -- Card details
  code TEXT NOT NULL UNIQUE,
  original_amount_cents INTEGER NOT NULL,
  remaining_amount_cents INTEGER NOT NULL,
  status gift_card_status NOT NULL DEFAULT 'active',
  -- Recipient
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_profile_id UUID REFERENCES profiles(id),
  personal_message TEXT,
  -- Validity
  expires_at TIMESTAMPTZ,
  -- Redemption tracking
  redeemed_at TIMESTAMPTZ, -- first redemption
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gift_cards_studio ON gift_cards(studio_id);
CREATE INDEX idx_gift_cards_code ON gift_cards(code);

CREATE TABLE gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id),
  -- Amount used in this transaction
  amount_cents INTEGER NOT NULL,
  -- Running balance after this transaction
  balance_after_cents INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gift_card_txns ON gift_card_transactions(gift_card_id);

-- ============================================================================
-- WAIVERS
-- ============================================================================

CREATE TABLE waiver_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Content (markdown or HTML)
  content TEXT NOT NULL,
  -- Rules
  required_for_booking BOOLEAN DEFAULT TRUE,
  status waiver_status NOT NULL DEFAULT 'active',
  version INTEGER NOT NULL DEFAULT 1,
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_waiver_templates_studio ON waiver_templates(studio_id);

CREATE TABLE waiver_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  waiver_template_id UUID NOT NULL REFERENCES waiver_templates(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- What version was signed
  waiver_version INTEGER NOT NULL,
  -- Signature data
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  -- Consent record
  full_name_as_signed TEXT NOT NULL,
  UNIQUE(waiver_template_id, profile_id) -- latest signature per waiver per student
);

CREATE INDEX idx_waiver_signatures_profile ON waiver_signatures(profile_id);

-- ============================================================================
-- REFERRALS
-- ============================================================================

CREATE TABLE referral_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  -- Referrer reward
  referrer_reward_type TEXT NOT NULL, -- 'credit', 'free_class', 'discount'
  referrer_reward_value INTEGER NOT NULL, -- cents or percentage or class count
  -- Referee reward
  referee_reward_type TEXT NOT NULL, -- 'credit', 'free_class', 'discount'
  referee_reward_value INTEGER NOT NULL,
  -- Rules
  require_referee_purchase BOOLEAN DEFAULT TRUE, -- referee must make a purchase
  max_referrals_per_student INTEGER, -- null = unlimited
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referral_programs_studio ON referral_programs(studio_id);

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_program_id UUID NOT NULL REFERENCES referral_programs(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  -- Referrer
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Referee
  referee_email TEXT NOT NULL,
  referee_id UUID REFERENCES profiles(id),
  -- Tracking
  referral_code TEXT NOT NULL UNIQUE,
  status referral_status NOT NULL DEFAULT 'pending',
  -- Reward tracking
  referrer_rewarded_at TIMESTAMPTZ,
  referee_rewarded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);

-- ============================================================================
-- STUDIO ONBOARDING TRACKING
-- ============================================================================

CREATE TABLE studio_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE UNIQUE,
  -- Step completion tracking
  completed_steps onboarding_step[] DEFAULT '{}',
  current_step onboarding_step DEFAULT 'studio_info',
  -- Quick flags for checking completeness
  has_location BOOLEAN DEFAULT FALSE,
  has_branding BOOLEAN DEFAULT FALSE,
  has_offerings BOOLEAN DEFAULT FALSE,
  has_schedule BOOLEAN DEFAULT FALSE,
  has_pricing BOOLEAN DEFAULT FALSE,
  has_staff BOOLEAN DEFAULT FALSE,
  has_waiver BOOLEAN DEFAULT FALSE,
  has_imported_data BOOLEAN DEFAULT FALSE,
  has_stripe BOOLEAN DEFAULT FALSE,
  is_launched BOOLEAN DEFAULT FALSE,
  -- Dates
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INTEGRATION & WEBHOOK ARCHITECTURE
--
-- Extension points for CRM, email marketing, advertising, accounting,
-- and any custom integrations. Studios configure which events trigger
-- which integrations. Not built out yet — this is the foundation so
-- the data model supports it when we're ready.
-- ============================================================================

-- Stores connected integrations per studio
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  name TEXT NOT NULL, -- display name, e.g. "Our Mailchimp"
  -- Authentication (encrypted in production)
  config JSONB DEFAULT '{}', -- provider-specific config (API keys, list IDs, etc.)
  -- Which events this integration listens to
  subscribed_events webhook_event_type[] DEFAULT '{}',
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id, provider) -- one connection per provider per studio (for now)
);

CREATE INDEX idx_integrations_studio ON integrations(studio_id);

-- Custom webhook endpoints (for studios that want to build their own integrations)
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  description TEXT,
  -- Secret for request signing (HMAC)
  signing_secret TEXT NOT NULL,
  -- Which events to deliver
  subscribed_events webhook_event_type[] DEFAULT '{}',
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  -- Delivery stats
  total_deliveries INTEGER DEFAULT 0,
  total_failures INTEGER DEFAULT 0,
  last_delivered_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_endpoints_studio ON webhook_endpoints(studio_id);

-- Event log — every significant action in the system gets logged here.
-- Integrations and webhooks read from this table.
-- Also serves as an audit trail.
CREATE TABLE event_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  event_type webhook_event_type NOT NULL,
  -- What entity the event is about
  entity_type TEXT NOT NULL, -- 'booking', 'membership', 'student', 'class', 'transaction'
  entity_id UUID NOT NULL,
  -- Who triggered it
  actor_id UUID REFERENCES profiles(id),
  actor_role user_role,
  -- Event payload (all relevant data at time of event)
  payload JSONB NOT NULL DEFAULT '{}',
  -- Delivery tracking
  webhook_delivered BOOLEAN DEFAULT FALSE,
  integration_processed BOOLEAN DEFAULT FALSE,
  -- Timestamp
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_log_studio ON event_log(studio_id);
CREATE INDEX idx_event_log_type ON event_log(event_type);
CREATE INDEX idx_event_log_entity ON event_log(entity_type, entity_id);
CREATE INDEX idx_event_log_occurred ON event_log(occurred_at);
-- For webhook delivery queries: undelivered events
CREATE INDEX idx_event_log_undelivered ON event_log(studio_id, webhook_delivered) WHERE NOT webhook_delivered;

-- ============================================================================
-- EXTEND EXISTING TABLES
-- ============================================================================

-- Add promo code and gift card references to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS gift_card_id UUID REFERENCES gift_cards(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS discount_amount_cents INTEGER DEFAULT 0;

-- Add guest pass reference to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_pass_id UUID REFERENCES guest_passes(id);

-- Add intro offer reference to studio_members
ALTER TABLE studio_members ADD COLUMN IF NOT EXISTS intro_offer_id UUID REFERENCES intro_offers(id);
ALTER TABLE studio_members ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);
ALTER TABLE studio_members ADD COLUMN IF NOT EXISTS referral_id UUID REFERENCES referrals(id);

-- ============================================================================
-- ROW LEVEL SECURITY FOR NEW TABLES
-- ============================================================================

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intro_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE intro_offer_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_pauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiver_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiver_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_log ENABLE ROW LEVEL SECURITY;

-- Staff can manage promo codes
CREATE POLICY "Staff can manage promo codes"
  ON promo_codes FOR ALL
  USING (studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()));

-- Students can view active promos (for self-service entry)
CREATE POLICY "Members can view active promos"
  ON promo_codes FOR SELECT
  USING (
    status = 'active'
    AND studio_id IN (SELECT studio_id FROM studio_members WHERE profile_id = auth.uid())
  );

-- Intro offers visible to everyone at the studio
CREATE POLICY "Studio participants can view intro offers"
  ON intro_offers FOR SELECT
  USING (
    is_active = TRUE
    AND studio_id IN (
      SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()
      UNION
      SELECT studio_id FROM studio_members WHERE profile_id = auth.uid()
    )
  );

-- Guest passes: purchaser can see their own, staff can see all
CREATE POLICY "Users can view own guest passes"
  ON guest_passes FOR SELECT
  USING (purchased_by_id = auth.uid() OR recipient_profile_id = auth.uid());

CREATE POLICY "Staff can manage guest passes"
  ON guest_passes FOR ALL
  USING (studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()));

-- Membership pauses: student sees own, staff sees all
CREATE POLICY "Users can view own membership pauses"
  ON membership_pauses FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Staff can manage membership pauses"
  ON membership_pauses FOR ALL
  USING (studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()));

-- Gift cards: purchaser/recipient sees own, staff sees all
CREATE POLICY "Users can view own gift cards"
  ON gift_cards FOR SELECT
  USING (purchased_by_id = auth.uid() OR recipient_profile_id = auth.uid());

CREATE POLICY "Staff can manage gift cards"
  ON gift_cards FOR ALL
  USING (studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()));

-- Waivers: students can view templates, sign, and see own signatures
CREATE POLICY "Studio participants can view waiver templates"
  ON waiver_templates FOR SELECT
  USING (
    status = 'active'
    AND studio_id IN (
      SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()
      UNION
      SELECT studio_id FROM studio_members WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own waiver signatures"
  ON waiver_signatures FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Staff can view studio waiver signatures"
  ON waiver_signatures FOR SELECT
  USING (studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()));

-- Referrals: users see own, staff sees all
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  USING (referrer_id = auth.uid() OR referee_id = auth.uid());

CREATE POLICY "Staff can manage referrals"
  ON referrals FOR ALL
  USING (studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()));

-- Onboarding: owners/admins only
CREATE POLICY "Admins can manage onboarding"
  ON studio_onboarding FOR ALL
  USING (
    studio_id IN (
      SELECT studio_id FROM studio_staff
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Integrations: owners/admins only
CREATE POLICY "Admins can manage integrations"
  ON integrations FOR ALL
  USING (
    studio_id IN (
      SELECT studio_id FROM studio_staff
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Webhook endpoints: owners/admins only
CREATE POLICY "Admins can manage webhooks"
  ON webhook_endpoints FOR ALL
  USING (
    studio_id IN (
      SELECT studio_id FROM studio_staff
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Event log: staff can view
CREATE POLICY "Staff can view event log"
  ON event_log FOR SELECT
  USING (studio_id IN (SELECT studio_id FROM studio_staff WHERE profile_id = auth.uid()));

-- ============================================================================
-- TRIGGERS FOR NEW TABLES
-- ============================================================================

CREATE TRIGGER update_promo_codes_updated_at BEFORE UPDATE ON promo_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_intro_offers_updated_at BEFORE UPDATE ON intro_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_gift_cards_updated_at BEFORE UPDATE ON gift_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_waiver_templates_updated_at BEFORE UPDATE ON waiver_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_referral_programs_updated_at BEFORE UPDATE ON referral_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_studio_onboarding_updated_at BEFORE UPDATE ON studio_onboarding FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON webhook_endpoints FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-increment promo redemption count
CREATE OR REPLACE FUNCTION increment_promo_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE promo_codes SET
    current_uses = current_uses + 1
  WHERE id = NEW.promo_code_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_promo_on_redemption
  AFTER INSERT ON promo_redemptions
  FOR EACH ROW EXECUTE FUNCTION increment_promo_usage();

-- Auto-increment intro offer redemption count
CREATE OR REPLACE FUNCTION increment_intro_offer_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE intro_offers SET
    current_redemptions = current_redemptions + 1
  WHERE id = NEW.intro_offer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_intro_offer_on_redemption
  AFTER INSERT ON intro_offer_redemptions
  FOR EACH ROW EXECUTE FUNCTION increment_intro_offer_usage();

-- Auto-decrement gift card balance
CREATE OR REPLACE FUNCTION decrement_gift_card_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gift_cards SET
    remaining_amount_cents = NEW.balance_after_cents,
    status = CASE
      WHEN NEW.balance_after_cents <= 0 THEN 'exhausted'::gift_card_status
      WHEN NEW.balance_after_cents < (SELECT original_amount_cents FROM gift_cards WHERE id = NEW.gift_card_id)
        THEN 'partially_used'::gift_card_status
      ELSE status
    END,
    redeemed_at = COALESCE(redeemed_at, NOW())
  WHERE id = NEW.gift_card_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_gift_card_on_txn
  AFTER INSERT ON gift_card_transactions
  FOR EACH ROW EXECUTE FUNCTION decrement_gift_card_balance();
