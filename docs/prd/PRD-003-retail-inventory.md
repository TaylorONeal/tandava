# PRD-003: Retail Product Sales & Inventory Management

## Overview
**Phase:** 1
**Priority:** P1
**Status:** Planned
**Owner:** TBD
**Dependencies:** Core booking/payment infrastructure

---

## Jobs to Be Done

### Job 1: Studio Retail Revenue Capture
**When** students want to buy yoga mats, water, or branded merchandise at my studio,
**I want to** sell products through the same platform they use for classes,
**So I can** capture retail revenue without a separate POS system.

### Job 2: Inventory Awareness
**When** I'm managing my studio's retail inventory,
**I want to** know current stock levels and get alerts when items are running low,
**So I can** reorder before popular items sell out.

### Job 3: Front Desk Efficiency
**When** a student wants to buy something at check-in,
**I want to** add retail items to their booking transaction quickly,
**So I can** complete the sale without slowing down the check-in line.

### Job 4: Student Self-Service Purchase
**When** I realize I need water or forgot my mat,
**I want to** buy it through the app before/during class,
**So I can** have it ready when I arrive or grab it without waiting at the desk.

### Job 5: Retail Performance Analysis
**When** deciding what products to stock,
**I want to** see which items sell well, their margins, and seasonal patterns,
**So I can** optimize my inventory investment and product mix.

### Job 6: Teacher Product Recommendations
**When** teaching a class and students ask about props or equipment,
**I want to** easily recommend specific products available at the studio,
**So I can** help students while supporting the studio's retail business.

### Job 7: Seamless Bundle Sales
**When** selling a membership or class pack,
**I want to** offer product bundles (e.g., "New Student Kit" with mat + blocks),
**So I can** increase average transaction value and improve student experience.

---

## User Stories

### US-3.1: Product Catalog Management
**As a** studio owner/manager,
**I want** to create and manage a product catalog,
**So that** I can list all items available for sale.

**Acceptance Criteria:**
- [ ] Create products with: name, description, images, SKU
- [ ] Set base price and optional member price
- [ ] Assign categories (Apparel, Equipment, Drinks, Snacks, Accessories)
- [ ] Set product variants (size: S/M/L, color: black/blue)
- [ ] Mark products as taxable or non-taxable
- [ ] Set products as active/inactive
- [ ] Bulk import from CSV
- [ ] Duplicate existing products

### US-3.2: Inventory Tracking
**As a** studio manager,
**I want** to track inventory levels for each product/variant,
**So that** I know what's in stock and when to reorder.

**Acceptance Criteria:**
- [ ] Set initial inventory count per product/variant
- [ ] Automatic decrement on sale
- [ ] Manual adjustment capability with reason (shrinkage, damage, recount)
- [ ] Set reorder point threshold per product
- [ ] Low stock alerts (in-app, email)
- [ ] Out-of-stock indicator on product (auto-hide or show "sold out")
- [ ] Inventory value report (qty x cost)
- [ ] Track cost per unit for margin calculations

### US-3.3: Multi-Location Inventory
**As a** multi-location studio owner,
**I want** to track inventory separately per location,
**So that** I know what's available at each studio.

**Acceptance Criteria:**
- [ ] Inventory tracked per location
- [ ] Transfer inventory between locations
- [ ] View consolidated inventory across all locations
- [ ] Location-specific pricing (optional)
- [ ] Location-specific product availability
- [ ] Cross-location low stock alerts

### US-3.4: Front Desk POS Interface
**As a** front desk staff member,
**I want** a quick-access POS interface for retail sales,
**So that** I can process sales efficiently during busy periods.

**Acceptance Criteria:**
- [ ] Quick-select grid of popular products
- [ ] Barcode scanner support (optional)
- [ ] Search products by name or SKU
- [ ] Add multiple items to cart
- [ ] Apply discounts (percentage or fixed)
- [ ] Associate sale with student profile (optional)
- [ ] Multiple payment methods (card, cash, credit balance)
- [ ] Split payment support
- [ ] Print or email receipt
- [ ] Quick void/refund for same-day transactions

### US-3.5: Student App Purchase Flow
**As a** student,
**I want** to browse and buy products through the studio app,
**So that** I can purchase items without waiting at the front desk.

**Acceptance Criteria:**
- [ ] Browse products by category
- [ ] See product details, images, variants
- [ ] See member vs. non-member pricing (if applicable)
- [ ] Add to cart with variant selection
- [ ] Checkout with saved payment method
- [ ] Pick-up options: "Will pick up today" / "Pick up at next class"
- [ ] Order confirmation with estimated pick-up time
- [ ] Order history in account section
- [ ] Digital receipt

### US-3.6: Add Retail to Booking Transaction
**As a** front desk staff,
**I want** to add retail items to a student's check-in,
**So that** they can pay for everything at once.

**Acceptance Criteria:**
- [ ] "Add retail" button on check-in screen
- [ ] Quick product selector
- [ ] Shows combined total (class + retail)
- [ ] Single payment for both
- [ ] Clear itemization on receipt
- [ ] Works with all payment types (membership doesn't cover retail)

### US-3.7: Product Bundles
**As a** studio owner,
**I want** to create product bundles at a discounted price,
**So that** I can increase sales and offer better value.

**Acceptance Criteria:**
- [ ] Create bundle with multiple products
- [ ] Set bundle price (typically less than sum of parts)
- [ ] Bundle shows savings amount
- [ ] Inventory decremented for each included item
- [ ] Bundles can be standalone or attached to memberships
- [ ] "New Student Kit" can be auto-offered on first membership purchase

### US-3.8: Inventory Receiving & Purchase Orders
**As a** studio manager,
**I want** to record inventory received from suppliers,
**So that** I can track incoming stock and costs accurately.

**Acceptance Criteria:**
- [ ] Create purchase order (PO) with supplier, expected items
- [ ] Receive against PO (full or partial)
- [ ] Record actual cost per unit (for COGS tracking)
- [ ] Variance report: ordered vs. received
- [ ] PO history and status tracking
- [ ] Supplier management (name, contact, lead time)

### US-3.9: Retail Reporting Dashboard
**As a** studio owner,
**I want** comprehensive retail analytics,
**So that** I can optimize my product strategy.

**Acceptance Criteria:**
- [ ] Revenue by product, category, time period
- [ ] Units sold by product
- [ ] Gross margin by product (revenue - cost)
- [ ] Inventory turnover rate
- [ ] Top sellers and slow movers
- [ ] Sales by hour of day (optimize stocking for busy times)
- [ ] Sales by staff member (if tracking)
- [ ] Member vs. non-member purchase patterns
- [ ] Attach rate (retail with class booking %)

### US-3.10: Teacher Product Commission (Phase 1.1)
**As a** studio owner,
**I want** to give teachers commission on products they sell or recommend,
**So that** they're incentivized to promote retail.

**Acceptance Criteria:**
- [ ] Set commission percentage per product or category
- [ ] Teacher can "claim" a sale (e.g., "Sarah recommended this")
- [ ] Commission tracked in teacher's earnings
- [ ] Report showing teacher-attributed sales
- [ ] Configurable: auto-attribute to class teacher if bought within 30 min of class

### US-3.11: Consignment Support (Phase 1.1)
**As a** studio owner,
**I want** to sell products on consignment from local makers,
**So that** I can offer unique products without upfront inventory investment.

**Acceptance Criteria:**
- [ ] Mark product as consignment
- [ ] Track consignment partner
- [ ] Set revenue split (e.g., 60% studio, 40% consigner)
- [ ] Consignment payout report
- [ ] Separate inventory tracking for consigned items
- [ ] Consigner portal to view sales (future)

---

## Edge Cases

### EC-1: Sale During Inventory Sync
**Scenario:** Two front desks sell the last item simultaneously.
**Handling:**
- Optimistic locking on inventory count
- Second sale fails with "item no longer available"
- Show real-time stock on POS (WebSocket updates)
- Option to allow overselling with back-order flag

### EC-2: Return After Inventory Adjustment
**Scenario:** Customer returns item, but inventory was manually adjusted since sale.
**Handling:**
- Return always increases inventory by 1
- Audit log shows return source
- Warning if return causes inventory to exceed expected max

### EC-3: Variant Out of Stock
**Scenario:** Medium size sold out, but S and L available.
**Handling:**
- Show which variants available
- "Notify me" option for out-of-stock variants
- Suggest alternative (if size is close)
- Don't hide entire product if one variant is out

### EC-4: Bundle Item Unavailable
**Scenario:** Student buys bundle, but one component is out of stock.
**Handling:**
- Bundle shows as unavailable if any component is out
- Or: allow partial bundle with pro-rated discount
- Configuration: strict (all or nothing) vs. flexible

### EC-5: Price Changed After Cart Add
**Scenario:** Price increases while item is in student's cart.
**Handling:**
- Honor original price if checkout within 30 minutes
- Show price update notification if longer
- Allow student to accept or remove item
- Audit log shows honored vs. actual price

### EC-6: Tax Calculation Complexity
**Scenario:** Different tax rates for different product categories, locations.
**Handling:**
- Tax rules per location
- Tax categories: taxable, reduced rate, exempt
- Clear tax breakdown on receipt
- Integration with tax services (Avalara, TaxJar) for complex scenarios

### EC-7: Refund to Deleted Payment Method
**Scenario:** Student requests refund, but original card is deleted.
**Handling:**
- Offer store credit
- Request new payment method for refund
- Or: refund to original card (Stripe allows this)
- Manual override for cash/check refund

### EC-8: Inventory Count During Sale
**Scenario:** Manager doing inventory count while sales are happening.
**Handling:**
- "Freeze" mode pauses POS temporarily (optional)
- Or: count mode shows live decrements
- Reconciliation report: count snapshot + sales since = expected current
- Variance flagged for review

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Retail revenue per student | $5+/month | Total retail revenue / Active students |
| Inventory accuracy | 98%+ | Physical count vs. system |
| Out-of-stock incidents | <5%/month | Stock-outs / Total product-days |
| POS transaction time | <30 seconds | Average transaction duration |
| Student app purchase adoption | 15%+ of retail | App purchases / Total retail sales |
| Attach rate | 10%+ | Bookings with retail / Total bookings |
| Gross margin | 50%+ | (Revenue - COGS) / Revenue |
| Inventory turnover | 4x+/year | COGS / Average inventory value |

---

## Technical Design

### Database Schema

```sql
-- ============================================================================
-- PRODUCTS & CATALOG
-- ============================================================================

-- Product categories
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,

  parent_category_id UUID REFERENCES product_categories(id),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, slug)
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,  -- UPC/EAN for scanner
  description TEXT,

  -- Categorization
  category_id UUID REFERENCES product_categories(id),
  tags TEXT[],

  -- Pricing
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  member_price_cents INTEGER,  -- null = no member discount
  cost_cents INTEGER,          -- for margin calculations

  -- Tax
  is_taxable BOOLEAN DEFAULT true,
  tax_category TEXT DEFAULT 'standard',  -- standard, reduced, exempt

  -- Media
  images JSONB DEFAULT '[]',  -- [{ "url": "...", "alt": "...", "sort_order": 0 }]

  -- Inventory settings
  track_inventory BOOLEAN DEFAULT true,
  allow_backorder BOOLEAN DEFAULT false,
  low_stock_threshold INTEGER DEFAULT 5,

  -- Variants
  has_variants BOOLEAN DEFAULT false,
  variant_options JSONB,  -- [{ "name": "Size", "values": ["S", "M", "L"] }]

  -- Availability
  is_active BOOLEAN DEFAULT true,
  available_online BOOLEAN DEFAULT true,
  available_in_studio BOOLEAN DEFAULT true,

  -- Consignment
  is_consignment BOOLEAN DEFAULT false,
  consignment_partner_id UUID REFERENCES consignment_partners(id),
  consignment_split_studio_pct INTEGER,  -- Studio's percentage (0-100)

  -- Metadata
  weight_oz INTEGER,          -- for shipping if ever needed
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, slug),
  UNIQUE(studio_id, sku)
);

-- Product variants (e.g., Size: Medium, Color: Blue)
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  -- Variant specification
  sku TEXT,
  barcode TEXT,
  option_values JSONB NOT NULL,  -- { "Size": "M", "Color": "Blue" }

  -- Pricing (override product level)
  price_cents INTEGER,
  member_price_cents INTEGER,
  cost_cents INTEGER,

  -- Media
  image_url TEXT,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(product_id, option_values)
);

-- ============================================================================
-- INVENTORY
-- ============================================================================

-- Inventory levels per location
CREATE TABLE inventory_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,

  -- Product (variant or base product)
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,

  -- Quantities
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,      -- In carts, pending orders
  quantity_available INTEGER GENERATED ALWAYS AS (
    quantity_on_hand - quantity_reserved
  ) STORED,

  -- Thresholds
  reorder_point INTEGER,
  reorder_quantity INTEGER,

  -- Cost tracking
  avg_cost_cents INTEGER,   -- Weighted average cost

  last_counted_at TIMESTAMPTZ,
  last_counted_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(location_id, product_id, variant_id)
);

-- Inventory transactions (all movements)
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,

  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),

  -- Transaction type
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'sale',             -- Sold to customer
    'return',           -- Customer return
    'receive',          -- Received from supplier
    'transfer_in',      -- Transferred from another location
    'transfer_out',     -- Transferred to another location
    'adjustment_up',    -- Positive adjustment
    'adjustment_down',  -- Negative adjustment (shrinkage, damage)
    'count'             -- Physical count correction
  )),

  -- Quantities
  quantity INTEGER NOT NULL,  -- Positive for increases, negative for decreases
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,

  -- Cost (for COGS tracking)
  unit_cost_cents INTEGER,

  -- References
  retail_order_id UUID REFERENCES retail_orders(id),
  retail_order_item_id UUID REFERENCES retail_order_items(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  transfer_id UUID REFERENCES inventory_transfers(id),

  -- Audit
  reason TEXT,
  performed_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inventory transfers between locations
CREATE TABLE inventory_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  from_location_id UUID NOT NULL REFERENCES locations(id),
  to_location_id UUID NOT NULL REFERENCES locations(id),

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_transit',
    'received',
    'cancelled'
  )),

  notes TEXT,

  initiated_by UUID REFERENCES profiles(id),
  received_by UUID REFERENCES profiles(id),

  shipped_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transfer line items
CREATE TABLE inventory_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES inventory_transfers(id) ON DELETE CASCADE,

  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),

  quantity_sent INTEGER NOT NULL,
  quantity_received INTEGER,  -- null until received

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PURCHASE ORDERS (Receiving inventory)
-- ============================================================================

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address JSONB,

  default_lead_time_days INTEGER,
  payment_terms TEXT,
  notes TEXT,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Consignment partners
CREATE TABLE consignment_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,

  default_studio_split_pct INTEGER DEFAULT 60,  -- Studio keeps this %
  payment_terms TEXT,  -- e.g., "Monthly payout, net 15"

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Purchase orders
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id),

  po_number TEXT NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'submitted',
    'confirmed',
    'partially_received',
    'received',
    'cancelled'
  )),

  -- Totals
  subtotal_cents INTEGER DEFAULT 0,
  tax_cents INTEGER DEFAULT 0,
  shipping_cents INTEGER DEFAULT 0,
  total_cents INTEGER DEFAULT 0,

  -- Dates
  order_date DATE,
  expected_date DATE,
  received_date DATE,

  notes TEXT,

  created_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, po_number)
);

-- Purchase order line items
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,

  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),

  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,

  unit_cost_cents INTEGER NOT NULL,
  line_total_cents INTEGER GENERATED ALWAYS AS (
    quantity_ordered * unit_cost_cents
  ) STORED,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- RETAIL ORDERS (Sales)
-- ============================================================================

-- Retail orders
CREATE TABLE retail_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id),

  -- Order number for display
  order_number TEXT NOT NULL,

  -- Customer
  customer_profile_id UUID REFERENCES profiles(id),
  customer_email TEXT,
  customer_name TEXT,

  -- Order type
  order_type TEXT NOT NULL DEFAULT 'in_store' CHECK (order_type IN (
    'in_store',     -- Sold at front desk
    'app',          -- Sold through student app
    'booking_addon' -- Added to class booking
  )),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Cart, not completed
    'completed',    -- Paid and fulfilled
    'partially_refunded',
    'refunded',
    'voided'
  )),

  -- Associated booking (if addon)
  booking_id UUID REFERENCES bookings(id),

  -- Totals
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER DEFAULT 0,
  tax_cents INTEGER DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,

  -- Payment
  payment_method TEXT,  -- card, cash, credit_balance, mixed
  transaction_id UUID REFERENCES transactions(id),

  -- Discount/promo
  promo_code_id UUID REFERENCES promo_codes(id),
  discount_reason TEXT,

  -- Pickup
  pickup_status TEXT CHECK (pickup_status IN (
    'pending',
    'ready',
    'picked_up'
  )),
  pickup_notes TEXT,
  picked_up_at TIMESTAMPTZ,

  -- Staff
  sold_by UUID REFERENCES profiles(id),
  attributed_teacher_id UUID REFERENCES profiles(id),  -- For commission

  -- Timestamps
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, order_number)
);

-- Retail order line items
CREATE TABLE retail_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES retail_orders(id) ON DELETE CASCADE,

  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),

  -- Snapshot of product at time of sale
  product_name TEXT NOT NULL,
  variant_name TEXT,
  sku TEXT,

  quantity INTEGER NOT NULL DEFAULT 1,

  -- Pricing
  unit_price_cents INTEGER NOT NULL,
  discount_cents INTEGER DEFAULT 0,
  tax_cents INTEGER DEFAULT 0,
  line_total_cents INTEGER NOT NULL,

  -- Cost (for margin tracking)
  unit_cost_cents INTEGER,

  -- Refund tracking
  quantity_refunded INTEGER DEFAULT 0,
  refund_amount_cents INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- PRODUCT BUNDLES
-- ============================================================================

-- Bundles (collections of products at a set price)
CREATE TABLE product_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Pricing
  price_cents INTEGER NOT NULL,
  member_price_cents INTEGER,
  compare_at_cents INTEGER,  -- "Was $X" price (sum of components)

  -- Availability
  is_active BOOLEAN DEFAULT true,
  available_online BOOLEAN DEFAULT true,

  -- Auto-offer settings
  auto_offer_on TEXT[] DEFAULT '{}',  -- ['first_membership', 'first_booking']

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(studio_id, slug)
);

-- Bundle components
CREATE TABLE product_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,

  product_id UUID NOT NULL REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),

  quantity INTEGER NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_products_studio ON products(studio_id, is_active);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(studio_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_variants_barcode ON product_variants(barcode) WHERE barcode IS NOT NULL;

CREATE INDEX idx_inventory_location ON inventory_levels(location_id);
CREATE INDEX idx_inventory_product ON inventory_levels(product_id, variant_id);
CREATE INDEX idx_inventory_low_stock ON inventory_levels(studio_id, quantity_on_hand)
  WHERE quantity_on_hand <= COALESCE(reorder_point, 0);

CREATE INDEX idx_inventory_txn_product ON inventory_transactions(product_id, variant_id);
CREATE INDEX idx_inventory_txn_location ON inventory_transactions(location_id, created_at DESC);

CREATE INDEX idx_orders_studio ON retail_orders(studio_id, status);
CREATE INDEX idx_orders_customer ON retail_orders(customer_profile_id);
CREATE INDEX idx_orders_location ON retail_orders(location_id, created_at DESC);
CREATE INDEX idx_orders_booking ON retail_orders(booking_id) WHERE booking_id IS NOT NULL;

CREATE INDEX idx_order_items_order ON retail_order_items(order_id);
CREATE INDEX idx_order_items_product ON retail_order_items(product_id, variant_id);
```

### API Endpoints

```
# ============================================================================
# PRODUCTS - Admin
# ============================================================================

GET    /api/manage/products                    # List products
POST   /api/manage/products                    # Create product
GET    /api/manage/products/:id                # Get product detail
PUT    /api/manage/products/:id                # Update product
DELETE /api/manage/products/:id                # Deactivate product
POST   /api/manage/products/import             # Bulk import from CSV

GET    /api/manage/products/categories         # List categories
POST   /api/manage/products/categories         # Create category
PUT    /api/manage/products/categories/:id     # Update category

GET    /api/manage/products/:id/variants       # List variants
POST   /api/manage/products/:id/variants       # Create variant
PUT    /api/manage/products/variants/:id       # Update variant

# ============================================================================
# BUNDLES - Admin
# ============================================================================

GET    /api/manage/bundles                     # List bundles
POST   /api/manage/bundles                     # Create bundle
GET    /api/manage/bundles/:id                 # Get bundle detail
PUT    /api/manage/bundles/:id                 # Update bundle
DELETE /api/manage/bundles/:id                 # Deactivate bundle

# ============================================================================
# INVENTORY - Admin
# ============================================================================

GET    /api/manage/inventory                   # Inventory summary
GET    /api/manage/inventory/levels            # Detailed levels
PUT    /api/manage/inventory/levels/:id        # Update level (adjustment)
POST   /api/manage/inventory/count             # Record count
GET    /api/manage/inventory/low-stock         # Low stock alerts
GET    /api/manage/inventory/transactions      # Transaction history

POST   /api/manage/inventory/transfers         # Create transfer
GET    /api/manage/inventory/transfers         # List transfers
PUT    /api/manage/inventory/transfers/:id     # Update transfer
POST   /api/manage/inventory/transfers/:id/receive  # Receive transfer

# ============================================================================
# PURCHASE ORDERS - Admin
# ============================================================================

GET    /api/manage/suppliers                   # List suppliers
POST   /api/manage/suppliers                   # Create supplier
PUT    /api/manage/suppliers/:id               # Update supplier

GET    /api/manage/purchase-orders             # List POs
POST   /api/manage/purchase-orders             # Create PO
GET    /api/manage/purchase-orders/:id         # Get PO detail
PUT    /api/manage/purchase-orders/:id         # Update PO
POST   /api/manage/purchase-orders/:id/receive # Receive items

# ============================================================================
# ORDERS/POS - Admin & Front Desk
# ============================================================================

GET    /api/manage/retail/orders               # List orders
POST   /api/manage/retail/orders               # Create order (POS)
GET    /api/manage/retail/orders/:id           # Get order detail
POST   /api/manage/retail/orders/:id/complete  # Complete order
POST   /api/manage/retail/orders/:id/void      # Void order
POST   /api/manage/retail/orders/:id/refund    # Refund order

GET    /api/manage/retail/pos/products         # Quick-access product list
POST   /api/manage/retail/pos/lookup           # Barcode/SKU lookup

# ============================================================================
# ORDERS - Student App
# ============================================================================

GET    /api/shop/products                      # Browse products
GET    /api/shop/products/:slug                # Product detail
GET    /api/shop/categories                    # Browse categories
GET    /api/shop/bundles                       # Available bundles

POST   /api/shop/cart                          # Create/update cart
GET    /api/shop/cart                          # Get current cart
DELETE /api/shop/cart                          # Clear cart

POST   /api/shop/checkout                      # Complete purchase
GET    /api/shop/orders                        # My order history
GET    /api/shop/orders/:id                    # Order detail

# ============================================================================
# RETAIL ANALYTICS - Admin
# ============================================================================

GET    /api/manage/retail/reports/sales        # Sales report
GET    /api/manage/retail/reports/inventory    # Inventory report
GET    /api/manage/retail/reports/margins      # Margin report
GET    /api/manage/retail/reports/velocity     # Sell-through rates
GET    /api/manage/retail/reports/top-sellers  # Top products

# ============================================================================
# CONSIGNMENT
# ============================================================================

GET    /api/manage/consignment/partners        # List partners
POST   /api/manage/consignment/partners        # Create partner
GET    /api/manage/consignment/partners/:id    # Partner detail
GET    /api/manage/consignment/payout-report   # Consignment payout report
```

### Real-Time Updates (WebSocket Events)

```
# Inventory events
inventory.low_stock        # Product hit reorder point
inventory.out_of_stock     # Product/variant at 0
inventory.received         # PO items received

# Order events
order.created              # New order started
order.completed            # Order completed
order.pickup_ready         # App order ready for pickup
```

### UI Routes

```
# Student App
/shop                         # Product browse
/shop/:category              # Category view
/shop/product/:slug          # Product detail
/shop/cart                   # Shopping cart
/shop/checkout               # Checkout
/account/orders              # Order history

# Studio Admin
/manage/retail                # Retail dashboard
/manage/retail/products       # Product catalog
/manage/retail/products/new   # New product
/manage/retail/products/:id   # Edit product
/manage/retail/categories     # Manage categories
/manage/retail/bundles        # Manage bundles

/manage/retail/inventory      # Inventory management
/manage/retail/inventory/count  # Physical count mode
/manage/retail/inventory/transfers  # Transfers

/manage/retail/orders         # Order history
/manage/retail/pos            # Point of sale interface

/manage/retail/suppliers      # Supplier management
/manage/retail/purchase-orders  # Purchase orders
/manage/retail/consignment    # Consignment management

/manage/retail/reports        # Retail analytics
```

---

## Open Questions

1. **Shipping capability:** Should we support shipping products, or start with in-studio pickup only?

2. **Rental program:** Should we include equipment rental (mats, props) with deposit tracking?

3. **Digital products:** Should the system support selling digital products (videos, guides)?

4. **Loyalty/points:** Should retail purchases earn loyalty points toward classes?

5. **Scanner hardware:** What barcode scanner models should we officially support?

6. **Tax service integration:** Should we integrate with Avalara/TaxJar for tax calculation, or keep it simple?

7. **Consignment payout automation:** Should we auto-generate and send consignment payments, or just report?

---

## Dependencies

- Stripe for payment processing
- Barcode scanner support (hardware)
- Receipt printer support (optional)
- Tax calculation engine

---

## Rollout Plan

### Phase 1A: Product Catalog & POS (Weeks 1-4)
1. Product management (CRUD, variants, categories)
2. Basic inventory tracking
3. Front desk POS interface
4. In-store sales flow

### Phase 1B: Student App & Checkout (Weeks 5-7)
1. Student product browse
2. Cart and checkout
3. Order confirmation and pickup flow
4. Order history

### Phase 1C: Inventory Management (Weeks 8-10)
1. Multi-location inventory
2. Transfers between locations
3. Purchase orders and receiving
4. Low stock alerts

### Phase 1D: Bundles & Reporting (Weeks 11-12)
1. Product bundles
2. Auto-offer on first purchase
3. Retail analytics dashboard
4. Margin and velocity reports

### Phase 1E: Advanced (Future)
1. Teacher product commission
2. Consignment support
3. Equipment rental
4. Tax service integration

### Rollout Strategy
1. **Alpha:** 5 studios with active retail (varied product types)
2. **Beta:** 20 studios with inventory and POS training
3. **GA:** Full release with scanner recommendations

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-02-05 | 1.0 | Claude | Initial PRD |
