-- Migration 006: Phase 1 - Staff Portal, Retail/Inventory, Membership Enhancements
-- Enables instructor self-service, retail sales, and flexible membership options

-- ============================================================================
-- STAFF PORTAL: INSTRUCTOR AVAILABILITY
-- ============================================================================

CREATE TYPE availability_type AS ENUM ('unavailable', 'preferred', 'available');

CREATE TABLE instructor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Type of availability
  availability_type availability_type NOT NULL DEFAULT 'unavailable',

  -- Time specification
  start_date DATE NOT NULL,
  end_date DATE,                        -- null = single day
  start_time TIME,                      -- null = all day
  end_time TIME,

  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('weekly', 'biweekly', 'monthly')),
  recurrence_days INTEGER[],            -- 0=Sun through 6=Sat
  recurrence_end_date DATE,

  -- Metadata
  reason TEXT,
  is_visible_to_others BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_time_range CHECK (start_time IS NULL OR end_time IS NULL OR start_time < end_time),
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date <= end_date)
);

CREATE INDEX idx_instructor_availability_profile ON instructor_availability(profile_id, start_date);
CREATE INDEX idx_instructor_availability_studio ON instructor_availability(studio_id, start_date);

-- ============================================================================
-- STAFF PORTAL: SUB REQUESTS
-- ============================================================================

CREATE TYPE sub_request_status AS ENUM (
  'open',
  'claimed',
  'approved',
  'denied',
  'cancelled',
  'expired'
);

CREATE TABLE sub_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  class_occurrence_id UUID NOT NULL REFERENCES class_occurrences(id) ON DELETE CASCADE,

  -- Requestor
  requesting_teacher_id UUID NOT NULL REFERENCES profiles(id),
  reason TEXT,
  reason_visible_to_subs BOOLEAN DEFAULT false,

  -- Suggested teachers (optional)
  suggested_teacher_ids UUID[],

  -- Status
  status sub_request_status NOT NULL DEFAULT 'open',

  -- Claiming
  claimed_by_id UUID REFERENCES profiles(id),
  claimed_at TIMESTAMPTZ,

  -- Approval
  approved_by_id UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  denial_reason TEXT,

  -- Pay override
  sub_pay_cents INTEGER,                -- null = use default rate

  -- Urgency (class within 24 hours)
  is_urgent BOOLEAN DEFAULT false,

  -- Notifications sent
  notification_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(class_occurrence_id)           -- Only one sub request per class
);

CREATE INDEX idx_sub_requests_status ON sub_requests(studio_id, status);
CREATE INDEX idx_sub_requests_teacher ON sub_requests(requesting_teacher_id);
CREATE INDEX idx_sub_requests_claimed ON sub_requests(claimed_by_id) WHERE claimed_by_id IS NOT NULL;

-- ============================================================================
-- STAFF PORTAL: SHIFT TRADES
-- ============================================================================

CREATE TYPE shift_trade_status AS ENUM (
  'proposed',
  'accepted',
  'approved',
  'declined',
  'denied',
  'cancelled',
  'expired'
);

CREATE TABLE shift_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- The proposer and their class
  proposer_id UUID NOT NULL REFERENCES profiles(id),
  proposer_class_id UUID NOT NULL REFERENCES class_occurrences(id),

  -- The recipient and their class
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  recipient_class_id UUID NOT NULL REFERENCES class_occurrences(id),

  -- Status
  status shift_trade_status NOT NULL DEFAULT 'proposed',

  -- Response
  responded_at TIMESTAMPTZ,
  response_note TEXT,

  -- Admin approval
  approved_by_id UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  denial_reason TEXT,

  -- Expiration
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '48 hours'),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_shift_trades_status ON shift_trades(studio_id, status);
CREATE INDEX idx_shift_trades_proposer ON shift_trades(proposer_id);
CREATE INDEX idx_shift_trades_recipient ON shift_trades(recipient_id);

-- ============================================================================
-- STAFF PORTAL: TIPS
-- ============================================================================

CREATE TYPE tip_status AS ENUM ('pending', 'paid', 'cancelled');

CREATE TABLE tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Who receives the tip
  teacher_id UUID NOT NULL REFERENCES profiles(id),

  -- Who gave the tip
  member_id UUID REFERENCES profiles(id),          -- null if anonymous
  is_anonymous BOOLEAN DEFAULT false,

  -- Context
  class_occurrence_id UUID REFERENCES class_occurrences(id),
  transaction_id UUID REFERENCES transactions(id),

  -- Amount
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT DEFAULT 'USD',

  -- Payment
  stripe_payment_intent_id TEXT,
  status tip_status NOT NULL DEFAULT 'pending',

  -- Payout tracking
  included_in_payroll_id UUID,          -- Will reference payroll_runs when built
  paid_out_at TIMESTAMPTZ,

  -- Note from tipper
  message TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tips_teacher ON tips(teacher_id, created_at DESC);
CREATE INDEX idx_tips_studio ON tips(studio_id, created_at DESC);
CREATE INDEX idx_tips_status ON tips(status) WHERE status = 'pending';

-- ============================================================================
-- RETAIL: PRODUCT CATALOG
-- ============================================================================

CREATE TYPE product_type AS ENUM (
  'physical',           -- Mats, blocks, merchandise
  'consumable',         -- Water, snacks, towels
  'rental',             -- Equipment rental
  'digital'             -- Downloads, guides
);

CREATE TYPE product_status AS ENUM ('active', 'inactive', 'out_of_stock', 'discontinued');

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,                             -- Stock keeping unit
  barcode TEXT,                         -- UPC/EAN for scanning

  -- Classification
  product_type product_type NOT NULL DEFAULT 'physical',
  category TEXT,                        -- 'apparel', 'equipment', 'food_beverage', etc.
  tags TEXT[],

  -- Pricing
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  cost_cents INTEGER,                   -- Cost to studio (for margin calculation)
  currency TEXT DEFAULT 'USD',

  -- Tax
  is_taxable BOOLEAN DEFAULT true,
  tax_category TEXT,                    -- For tax rate lookup

  -- Images
  image_urls TEXT[],

  -- Status
  status product_status DEFAULT 'active',

  -- Inventory settings
  track_inventory BOOLEAN DEFAULT true,
  allow_backorder BOOLEAN DEFAULT false,
  low_stock_threshold INTEGER DEFAULT 5,

  -- Rental specific
  rental_duration_hours INTEGER,        -- For rental products
  rental_deposit_cents INTEGER,

  -- Digital specific
  digital_file_url TEXT,                -- For digital products
  download_limit INTEGER,

  -- Metadata
  vendor TEXT,
  weight_grams INTEGER,
  dimensions_cm JSONB,                  -- {length, width, height}

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_studio ON products(studio_id, status);
CREATE INDEX idx_products_sku ON products(studio_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;

-- ============================================================================
-- RETAIL: INVENTORY
-- ============================================================================

CREATE TABLE inventory_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,

  -- Current levels
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,    -- Reserved for pending orders
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,

  -- Thresholds
  reorder_point INTEGER,                -- When to reorder
  reorder_quantity INTEGER,             -- How much to reorder

  -- Tracking
  last_counted_at TIMESTAMPTZ,
  last_restocked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(product_id, location_id)
);

CREATE INDEX idx_inventory_levels_product ON inventory_levels(product_id);
CREATE INDEX idx_inventory_levels_low_stock ON inventory_levels(quantity_on_hand)
  WHERE quantity_on_hand <= 5;

-- ============================================================================
-- RETAIL: INVENTORY MOVEMENTS
-- ============================================================================

CREATE TYPE inventory_movement_type AS ENUM (
  'sale',               -- Sold to customer
  'return',             -- Customer return
  'restock',            -- Received from vendor
  'adjustment',         -- Manual adjustment (count correction)
  'transfer',           -- Between locations
  'damage',             -- Damaged/write-off
  'rental_out',         -- Rented out
  'rental_return'       -- Rental returned
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,

  -- Movement details
  movement_type inventory_movement_type NOT NULL,
  quantity INTEGER NOT NULL,            -- Positive = in, negative = out
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,

  -- Reference
  transaction_id UUID REFERENCES transactions(id),
  transfer_to_location_id UUID REFERENCES locations(id),
  notes TEXT,

  -- Audit
  performed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id, created_at DESC);
CREATE INDEX idx_inventory_movements_location ON inventory_movements(location_id, created_at DESC);

-- ============================================================================
-- RETAIL: PURCHASE ORDERS (for restocking)
-- ============================================================================

CREATE TYPE purchase_order_status AS ENUM (
  'draft',
  'submitted',
  'confirmed',
  'partially_received',
  'received',
  'cancelled'
);

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id),

  -- Vendor
  vendor_name TEXT NOT NULL,
  vendor_contact TEXT,
  vendor_email TEXT,

  -- Status
  status purchase_order_status DEFAULT 'draft',
  order_number TEXT,

  -- Dates
  ordered_at TIMESTAMPTZ,
  expected_at DATE,
  received_at TIMESTAMPTZ,

  -- Totals
  subtotal_cents INTEGER DEFAULT 0,
  tax_cents INTEGER DEFAULT 0,
  shipping_cents INTEGER DEFAULT 0,
  total_cents INTEGER GENERATED ALWAYS AS (subtotal_cents + tax_cents + shipping_cents) STORED,

  -- Notes
  notes TEXT,

  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),

  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,

  unit_cost_cents INTEGER NOT NULL,
  total_cents INTEGER GENERATED ALWAYS AS (quantity_ordered * unit_cost_cents) STORED,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_purchase_order_items_po ON purchase_order_items(purchase_order_id);

-- ============================================================================
-- MEMBERSHIP ENHANCEMENTS: FAMILY/HOUSEHOLD LINKING
-- ============================================================================

CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT,                            -- "The Smith Family"
  primary_member_id UUID NOT NULL REFERENCES profiles(id),

  -- Billing
  consolidated_billing BOOLEAN DEFAULT true,
  billing_profile_id UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),

  -- Role
  is_primary BOOLEAN DEFAULT false,
  is_dependent BOOLEAN DEFAULT false,   -- Minor/dependent
  relationship TEXT,                    -- 'spouse', 'child', 'parent', etc.

  -- Permissions
  can_book_for_others BOOLEAN DEFAULT false,
  can_view_others_schedule BOOLEAN DEFAULT true,

  added_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(household_id, profile_id)
);

CREATE INDEX idx_household_members_profile ON household_members(profile_id);
CREATE INDEX idx_household_members_household ON household_members(household_id);

-- ============================================================================
-- MEMBERSHIP ENHANCEMENTS: CORPORATE/GROUP MEMBERSHIPS
-- ============================================================================

CREATE TABLE corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Company info
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  industry TEXT,

  -- Contact
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  billing_email TEXT,

  -- Contract
  contract_start_date DATE,
  contract_end_date DATE,
  max_employees INTEGER,                -- Seat limit

  -- Pricing
  pricing_type TEXT CHECK (pricing_type IN ('per_seat', 'flat_rate', 'usage_based')),
  per_seat_cents INTEGER,
  flat_rate_cents INTEGER,
  discount_percent NUMERIC(5,2),

  -- Billing
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
  payment_terms_days INTEGER DEFAULT 30,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE corporate_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id),

  -- Employee info
  employee_id TEXT,                     -- Company's employee ID
  department TEXT,

  -- Access
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ DEFAULT now(),
  deactivated_at TIMESTAMPTZ,

  -- Usage tracking
  classes_this_month INTEGER DEFAULT 0,
  classes_limit_per_month INTEGER,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(corporate_account_id, profile_id)
);

CREATE INDEX idx_corporate_employees_account ON corporate_employees(corporate_account_id);
CREATE INDEX idx_corporate_employees_profile ON corporate_employees(profile_id);

-- ============================================================================
-- MEMBERSHIP ENHANCEMENTS: COMMITMENT TRACKING
-- ============================================================================

-- Add commitment enforcement to membership_types
ALTER TABLE membership_types ADD COLUMN IF NOT EXISTS
  commitment_months INTEGER DEFAULT 0;

ALTER TABLE membership_types ADD COLUMN IF NOT EXISTS
  early_termination_fee_cents INTEGER DEFAULT 0;

ALTER TABLE membership_types ADD COLUMN IF NOT EXISTS
  commitment_discount_percent NUMERIC(5,2) DEFAULT 0;

-- Track commitment status on active memberships
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS
  commitment_start_date DATE;

ALTER TABLE memberships ADD COLUMN IF NOT EXISTS
  commitment_end_date DATE;

ALTER TABLE memberships ADD COLUMN IF NOT EXISTS
  commitment_fulfilled BOOLEAN DEFAULT false;

ALTER TABLE memberships ADD COLUMN IF NOT EXISTS
  early_termination_fee_charged BOOLEAN DEFAULT false;

-- ============================================================================
-- MEMBERSHIP ENHANCEMENTS: DYNAMIC PRICING
-- ============================================================================

CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Applicability
  applies_to TEXT NOT NULL CHECK (applies_to IN (
    'drop_in',
    'class_pack',
    'membership',
    'event',
    'product'
  )),

  -- Targeting (null = applies to all)
  offering_ids UUID[],
  membership_type_ids UUID[],
  event_ids UUID[],
  product_ids UUID[],

  -- Conditions
  condition_type TEXT NOT NULL CHECK (condition_type IN (
    'time_of_day',      -- Off-peak pricing
    'day_of_week',      -- Weekend pricing
    'capacity',         -- Low-fill discounts
    'advance_booking',  -- Book early discount
    'last_minute',      -- Last-minute discount
    'member_tenure',    -- Loyalty pricing
    'total_spend'       -- High-value customer discount
  )),

  -- Time-based conditions
  valid_days INTEGER[],                 -- 0-6 for days
  valid_start_time TIME,
  valid_end_time TIME,

  -- Capacity-based conditions
  min_capacity_percent INTEGER,
  max_capacity_percent INTEGER,

  -- Booking window conditions
  min_hours_before INTEGER,
  max_hours_before INTEGER,

  -- Member conditions
  min_member_months INTEGER,
  min_total_spend_cents INTEGER,

  -- Discount
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed', 'new_price')),
  discount_value NUMERIC(10,2) NOT NULL,

  -- Limits
  max_uses_total INTEGER,
  max_uses_per_member INTEGER,
  current_uses INTEGER DEFAULT 0,

  -- Validity
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,

  -- Priority (higher = applied first)
  priority INTEGER DEFAULT 0,

  -- Stacking
  stackable BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pricing_rules_studio ON pricing_rules(studio_id, is_active);

-- ============================================================================
-- MEMBERSHIP ENHANCEMENTS: ADD-ONS
-- ============================================================================

CREATE TABLE membership_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Pricing
  price_cents INTEGER NOT NULL,
  billing_frequency TEXT CHECK (billing_frequency IN ('one_time', 'per_billing_cycle', 'monthly')),

  -- What it provides
  addon_type TEXT NOT NULL CHECK (addon_type IN (
    'guest_passes',     -- X guest passes per month
    'locker',           -- Locker rental
    'towel_service',    -- Towel service
    'parking',          -- Parking spot
    'laundry',          -- Laundry service
    'retail_discount',  -- % off retail
    'priority_booking', -- Book X hours earlier
    'unlimited_freezes', -- No freeze limits
    'custom'
  )),

  -- Configuration
  quantity_per_cycle INTEGER,           -- e.g., 2 guest passes
  discount_percent NUMERIC(5,2),        -- e.g., 10% retail discount
  hours_advance INTEGER,                -- e.g., 24 hours early booking

  -- Availability
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Link add-ons to active memberships
CREATE TABLE membership_addon_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES membership_addons(id),

  -- Status
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,

  -- Usage tracking (for quantity-based add-ons)
  quantity_used_this_cycle INTEGER DEFAULT 0,
  cycle_reset_at TIMESTAMPTZ,

  -- Billing
  stripe_subscription_item_id TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(membership_id, addon_id)
);

CREATE INDEX idx_membership_addon_subs ON membership_addon_subscriptions(membership_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE instructor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_addon_subscriptions ENABLE ROW LEVEL SECURITY;

-- Instructor availability: visible to studio staff and the instructor
CREATE POLICY "Instructors can manage their availability"
  ON instructor_availability FOR ALL
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = instructor_availability.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
  );

-- Sub requests: studio staff and involved teachers
CREATE POLICY "Sub requests visible to studio staff and teachers"
  ON sub_requests FOR SELECT
  USING (
    requesting_teacher_id = auth.uid()
    OR claimed_by_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = sub_requests.studio_id
        AND studio_staff.profile_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create sub requests"
  ON sub_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = sub_requests.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role = 'teacher'
    )
  );

-- Tips: visible to recipient and studio admins
CREATE POLICY "Tips visible to recipient and admins"
  ON tips FOR SELECT
  USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = tips.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
  );

-- Products: visible to studio staff
CREATE POLICY "Products managed by studio staff"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = products.studio_id
        AND studio_staff.profile_id = auth.uid()
    )
  );

-- Inventory: managed by studio staff
CREATE POLICY "Inventory managed by studio staff"
  ON inventory_levels FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN studio_staff ss ON ss.studio_id = p.studio_id
      WHERE p.id = inventory_levels.product_id
        AND ss.profile_id = auth.uid()
    )
  );

-- Households: visible to members and studio staff
CREATE POLICY "Household members can view their household"
  ON households FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = households.id
        AND hm.profile_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = households.studio_id
        AND studio_staff.profile_id = auth.uid()
    )
  );

-- Corporate accounts: managed by studio admins
CREATE POLICY "Corporate accounts managed by admins"
  ON corporate_accounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = corporate_accounts.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
  );

-- Pricing rules: managed by studio admins
CREATE POLICY "Pricing rules managed by admins"
  ON pricing_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM studio_staff
      WHERE studio_staff.studio_id = pricing_rules.studio_id
        AND studio_staff.profile_id = auth.uid()
        AND studio_staff.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Calculate available inventory
CREATE OR REPLACE FUNCTION get_available_inventory(p_product_id UUID, p_location_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(quantity_on_hand - quantity_reserved, 0)
  FROM inventory_levels
  WHERE product_id = p_product_id AND location_id = p_location_id;
$$ LANGUAGE SQL STABLE;

-- Check if member can early-terminate (commitment fulfilled)
CREATE OR REPLACE FUNCTION can_cancel_membership(p_membership_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_membership memberships%ROWTYPE;
  v_membership_type membership_types%ROWTYPE;
  v_result JSONB;
BEGIN
  SELECT * INTO v_membership FROM memberships WHERE id = p_membership_id;
  SELECT * INTO v_membership_type FROM membership_types WHERE id = v_membership.membership_type_id;

  IF v_membership.commitment_fulfilled OR v_membership.commitment_end_date IS NULL OR v_membership.commitment_end_date <= CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'can_cancel', true,
      'fee_cents', 0,
      'reason', 'No commitment or commitment fulfilled'
    );
  ELSE
    RETURN jsonb_build_object(
      'can_cancel', true,
      'fee_cents', v_membership_type.early_termination_fee_cents,
      'reason', 'Early termination fee applies',
      'commitment_end_date', v_membership.commitment_end_date
    );
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update inventory on sale
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- This would be called by transaction processing
  -- Decrements inventory and creates movement record
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
