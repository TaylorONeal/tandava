-- Tandava Studio Management Platform
-- Migration 004: Advanced Analytics Infrastructure
--
-- Adds: MRR snapshots, revenue forecasting, customer lifetime value cohorts,
--       P&L summaries, promo performance tracking, conversion funnels,
--       seasonality patterns, industry benchmarks, scheduled reports,
--       and expansion analysis indicators.
--
-- These tables power the studio dashboard's financial intelligence layer.
-- Most are populated by periodic compute jobs (Edge Functions / cron),
-- not real-time writes. They give studio owners the insight they need
-- to make confident decisions about pricing, hiring, and growth.

-- ============================================================================
-- MRR SNAPSHOTS (Monthly Recurring Revenue tracking)
-- Point-in-time snapshots of MRR broken down by movement category.
-- Computed nightly or on-demand. Enables MRR trend charts, churn analysis,
-- and net revenue retention calculations.
-- ============================================================================

CREATE TABLE mrr_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  -- MRR breakdown
  total_mrr_cents BIGINT DEFAULT 0,              -- total MRR at this point
  new_mrr_cents BIGINT DEFAULT 0,                -- from new memberships
  expansion_mrr_cents BIGINT DEFAULT 0,           -- from upgrades
  contraction_mrr_cents BIGINT DEFAULT 0,         -- from downgrades
  churned_mrr_cents BIGINT DEFAULT 0,             -- from cancellations
  reactivation_mrr_cents BIGINT DEFAULT 0,        -- from reactivated memberships
  paused_mrr_cents BIGINT DEFAULT 0,              -- currently paused (not contributing)
  -- Membership counts
  active_memberships INTEGER DEFAULT 0,
  new_memberships INTEGER DEFAULT 0,
  churned_memberships INTEGER DEFAULT 0,
  paused_memberships INTEGER DEFAULT 0,
  net_membership_change INTEGER DEFAULT 0,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id, snapshot_date)
);

COMMENT ON TABLE mrr_snapshots IS 'Daily snapshots of MRR broken down by movement category (new, expansion, contraction, churn, reactivation). Computed by periodic job.';

CREATE INDEX idx_mrr_snapshots_studio ON mrr_snapshots(studio_id);
CREATE INDEX idx_mrr_snapshots_studio_date ON mrr_snapshots(studio_id, snapshot_date);
CREATE INDEX idx_mrr_snapshots_date ON mrr_snapshots(snapshot_date);

-- ============================================================================
-- REVENUE FORECAST CONFIGS
-- Studios can create multiple "what-if" forecast scenarios with different
-- assumptions. One is marked as the default for dashboard display.
-- ============================================================================

CREATE TABLE revenue_forecast_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Assumptions JSONB stores all forecast parameters:
  -- {
  --   expected_churn_rate: 0.05,
  --   expected_growth_rate: 0.03,
  --   avg_new_students_per_month: 15,
  --   avg_revenue_per_student_cents: 12000,
  --   seasonal_adjustments: { "1": 1.2, "2": 0.9, ... "12": 1.1 },
  --   pause_rate: 0.02,
  --   app_store_cut_pct: 0.0,
  --   payment_processing_fee_pct: 0.029,
  --   expected_payroll_pct: 0.35,
  --   rent_cents_monthly: 500000,
  --   other_fixed_costs_cents: 200000
  -- }
  assumptions JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE revenue_forecast_configs IS 'Named forecast scenarios with configurable assumptions. Studios can model best-case, worst-case, and expected scenarios.';

CREATE INDEX idx_revenue_forecast_configs_studio ON revenue_forecast_configs(studio_id);

-- ============================================================================
-- REVENUE FORECASTS (computed projections)
-- Each row is a single month's projection for a given config.
-- Computed from the config assumptions + current MRR baseline.
-- Confidence decreases as the forecast extends further out.
-- ============================================================================

CREATE TABLE revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES revenue_forecast_configs(id) ON DELETE CASCADE,
  forecast_month DATE NOT NULL,
  -- Projected revenue
  projected_mrr_cents BIGINT DEFAULT 0,
  projected_total_revenue_cents BIGINT DEFAULT 0,
  projected_membership_revenue_cents BIGINT DEFAULT 0,
  projected_pack_revenue_cents BIGINT DEFAULT 0,
  projected_dropin_revenue_cents BIGINT DEFAULT 0,
  projected_event_revenue_cents BIGINT DEFAULT 0,
  -- Projected expenses
  projected_expenses_cents BIGINT DEFAULT 0,
  projected_payroll_cents BIGINT DEFAULT 0,
  projected_platform_fees_cents BIGINT DEFAULT 0,  -- app store cuts, Stripe fees
  -- Bottom line
  projected_net_revenue_cents BIGINT DEFAULT 0,
  projected_active_members INTEGER DEFAULT 0,
  -- Confidence (0.00-1.00, decreases as months go further out)
  confidence_level DECIMAL(3,2) DEFAULT 1.00,
  -- When this projection was computed
  computed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id, config_id, forecast_month)
);

COMMENT ON TABLE revenue_forecasts IS 'Month-by-month revenue projections computed from forecast config assumptions. Confidence decreases for further-out months.';

CREATE INDEX idx_revenue_forecasts_studio ON revenue_forecasts(studio_id);
CREATE INDEX idx_revenue_forecasts_config ON revenue_forecasts(config_id);
CREATE INDEX idx_revenue_forecasts_studio_month ON revenue_forecasts(studio_id, forecast_month);

-- ============================================================================
-- CUSTOMER LIFETIME VALUE COHORTS
-- Cohort-based CLV analysis grouped by join month and acquisition source.
-- Enables "students who joined in March via referral are worth 2x more
-- than those from promos" type insights.
-- ============================================================================

CREATE TABLE clv_cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  cohort_month DATE NOT NULL,                     -- month they joined
  acquisition_source TEXT,                        -- organic, referral, promo, event, landing_page, walk_in, import
  -- Cohort size
  total_students INTEGER DEFAULT 0,
  still_active INTEGER DEFAULT 0,
  -- Lifetime metrics
  avg_lifetime_days DECIMAL DEFAULT 0,
  avg_total_revenue_cents BIGINT DEFAULT 0,
  avg_classes_attended DECIMAL DEFAULT 0,
  median_total_revenue_cents BIGINT DEFAULT 0,
  -- Retention rates (% still active at each milestone)
  retention_rate_30d DECIMAL(5,2) DEFAULT 0,
  retention_rate_90d DECIMAL(5,2) DEFAULT 0,
  retention_rate_180d DECIMAL(5,2) DEFAULT 0,
  retention_rate_365d DECIMAL(5,2) DEFAULT 0,
  -- Projected future lifetime value
  projected_clv_cents BIGINT DEFAULT 0,
  -- Computation tracking
  computed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id, cohort_month, acquisition_source)
);

COMMENT ON TABLE clv_cohorts IS 'Cohort-based customer lifetime value analysis. Groups students by join month and acquisition source to identify highest-value channels.';

CREATE INDEX idx_clv_cohorts_studio ON clv_cohorts(studio_id);
CREATE INDEX idx_clv_cohorts_studio_month ON clv_cohorts(studio_id, cohort_month);
CREATE INDEX idx_clv_cohorts_source ON clv_cohorts(studio_id, acquisition_source);

-- ============================================================================
-- STUDIO P&L MONTHLY SUMMARIES
-- Partial profit & loss statements. Revenue lines are auto-computed from
-- transactions; expense lines are a mix of auto (payroll, processing fees)
-- and manual entry (rent, utilities, insurance). Studios can finalize
-- a month to lock it for reporting.
-- ============================================================================

CREATE TABLE pl_monthly_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  -- ---- REVENUE ----
  membership_revenue_cents BIGINT DEFAULT 0,
  pack_revenue_cents BIGINT DEFAULT 0,
  dropin_revenue_cents BIGINT DEFAULT 0,
  event_revenue_cents BIGINT DEFAULT 0,
  gift_card_revenue_cents BIGINT DEFAULT 0,
  other_revenue_cents BIGINT DEFAULT 0,
  total_gross_revenue_cents BIGINT DEFAULT 0,
  refunds_cents BIGINT DEFAULT 0,
  discounts_cents BIGINT DEFAULT 0,              -- promo codes, intro offers
  total_net_revenue_cents BIGINT DEFAULT 0,
  -- ---- EXPENSES (auto-computed) ----
  payroll_cents BIGINT DEFAULT 0,                -- auto from payroll_entries
  payment_processing_fees_cents BIGINT DEFAULT 0, -- auto from Stripe
  platform_fees_cents BIGINT DEFAULT 0,          -- Tandava hosted platform fee
  -- ---- EXPENSES (manual entry) ----
  rent_cents BIGINT DEFAULT 0,
  utilities_cents BIGINT DEFAULT 0,
  insurance_cents BIGINT DEFAULT 0,
  marketing_cents BIGINT DEFAULT 0,
  software_cents BIGINT DEFAULT 0,
  other_expenses_cents BIGINT DEFAULT 0,
  total_expenses_cents BIGINT DEFAULT 0,
  -- ---- BOTTOM LINE ----
  net_operating_income_cents BIGINT DEFAULT 0,
  operating_margin_pct DECIMAL(5,2),
  -- Notes & finalization
  notes TEXT,
  is_finalized BOOLEAN DEFAULT FALSE,
  finalized_by UUID REFERENCES profiles(id),
  finalized_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id, month)
);

COMMENT ON TABLE pl_monthly_summaries IS 'Monthly P&L summaries. Revenue is auto-computed from transactions; some expenses are auto (payroll, processing), others are manual entry (rent, utilities). Can be finalized to lock.';

CREATE INDEX idx_pl_monthly_studio ON pl_monthly_summaries(studio_id);
CREATE INDEX idx_pl_monthly_studio_month ON pl_monthly_summaries(studio_id, month);

-- ============================================================================
-- PROMO PERFORMANCE TRACKING
-- Aggregated promo code performance for a given period. Tracks not just
-- redemptions but downstream revenue: did promo users stick around?
-- Enables ROI analysis per promotion.
-- ============================================================================

CREATE TABLE promo_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  period_start DATE,
  period_end DATE,
  -- Usage metrics
  total_redemptions INTEGER DEFAULT 0,
  unique_students INTEGER DEFAULT 0,
  total_discount_cents BIGINT DEFAULT 0,
  -- Revenue impact
  total_revenue_from_promo_users_cents BIGINT DEFAULT 0,  -- what promo users paid overall
  new_students_acquired INTEGER DEFAULT 0,
  returning_students INTEGER DEFAULT 0,
  -- Downstream behavior
  subsequent_purchases INTEGER DEFAULT 0,         -- purchases AFTER the promo-discounted one
  subsequent_revenue_cents BIGINT DEFAULT 0,
  -- ROI
  estimated_roi_pct DECIMAL(7,2),                 -- revenue generated / discount given
  -- Computation tracking
  computed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE promo_performance IS 'Aggregated promo code performance. Tracks redemptions, downstream revenue, new student acquisition, and estimated ROI per promotion.';

CREATE INDEX idx_promo_performance_studio ON promo_performance(studio_id);
CREATE INDEX idx_promo_performance_promo ON promo_performance(promo_code_id);
CREATE INDEX idx_promo_performance_period ON promo_performance(studio_id, period_start, period_end);

-- ============================================================================
-- CONVERSION FUNNELS
-- Pre-computed funnel analyses for common studio conversion paths.
-- Each row represents a complete funnel for a given period.
-- Steps are stored as a JSONB array with drop-off rates per step.
-- ============================================================================

CREATE TABLE conversion_funnels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  period_start DATE,
  period_end DATE,
  -- Funnel type
  funnel_type TEXT NOT NULL,                      -- site_to_signup, signup_to_booking, booking_to_member, trial_to_paid, event_registration
  -- Steps data: array of { step_name, count, drop_off_rate, conversion_rate }
  steps JSONB NOT NULL DEFAULT '[]',
  -- Summary metrics
  overall_conversion_rate DECIMAL(5,2),
  top_drop_off_step TEXT,
  -- Computation tracking
  computed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE conversion_funnels IS 'Pre-computed conversion funnel analyses. Each row is a complete funnel (e.g., site_to_signup) for a given period with per-step drop-off rates.';

CREATE INDEX idx_conversion_funnels_studio ON conversion_funnels(studio_id);
CREATE INDEX idx_conversion_funnels_type ON conversion_funnels(studio_id, funnel_type);
CREATE INDEX idx_conversion_funnels_period ON conversion_funnels(studio_id, period_start, period_end);

-- ============================================================================
-- SEASONALITY PATTERNS
-- Annual seasonality analysis per metric type. Monthly values and seasonal
-- indexes (1.0 = average month) enable studios to understand and forecast
-- their natural business rhythms.
-- ============================================================================

CREATE TABLE seasonality_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  -- What metric this is tracking
  metric_type TEXT NOT NULL,                      -- revenue, bookings, new_students, check_ins, cancellations
  -- Monthly data
  monthly_values JSONB NOT NULL DEFAULT '{}',     -- { "1": 45000, "2": 38000, ... "12": 52000 }
  monthly_indexes JSONB NOT NULL DEFAULT '{}',    -- { "1": 1.15, "2": 0.87, ... "12": 1.08 } where 1.0 = average
  -- Summary
  peak_month INTEGER,                             -- 1-12
  trough_month INTEGER,                           -- 1-12
  seasonal_variance DECIMAL(5,2),                 -- how much seasonality affects this metric
  -- Computation tracking
  computed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id, year, metric_type)
);

COMMENT ON TABLE seasonality_patterns IS 'Annual seasonality analysis per metric. Monthly indexes (1.0 = average) help studios understand and predict seasonal patterns.';

CREATE INDEX idx_seasonality_studio ON seasonality_patterns(studio_id);
CREATE INDEX idx_seasonality_studio_year ON seasonality_patterns(studio_id, year);

-- ============================================================================
-- BENCHMARKS
-- Industry benchmark data for different studio types and sizes.
-- Studios can opt in to contribute anonymized metrics to improve
-- benchmark accuracy. Initial data is seeded from rule-of-thumb values.
-- ============================================================================

CREATE TABLE benchmark_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                             -- e.g., "yoga_studio_small", "pilates_reformer"
  display_name TEXT NOT NULL,
  description TEXT,
  studio_size TEXT,                                -- small (1 location), medium (2-3 locations), large (4+)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE benchmark_categories IS 'Industry benchmark categories by studio type and size. Used to compare studio performance against peers.';

CREATE TABLE benchmark_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES benchmark_categories(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,                      -- e.g., avg_revenue_per_student, monthly_churn_rate
  display_name TEXT NOT NULL,
  description TEXT,
  unit TEXT,                                      -- currency_cents, percentage, count, decimal
  -- Percentile distribution
  p25 DECIMAL,                                    -- 25th percentile
  p50 DECIMAL,                                    -- median
  p75 DECIMAL,                                    -- 75th percentile
  p90 DECIMAL,                                    -- 90th percentile
  -- Data source
  source TEXT DEFAULT 'rule_of_thumb',            -- rule_of_thumb, contributed_aggregate
  sample_size INTEGER,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(category_id, metric_name)
);

COMMENT ON TABLE benchmark_metrics IS 'Percentile-based benchmark metrics per category. Source is either rule-of-thumb estimates or aggregated from contributing studios.';

CREATE TABLE studio_benchmark_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  benchmark_category_id UUID NOT NULL REFERENCES benchmark_categories(id) ON DELETE CASCADE,
  -- Opt-in to contribute anonymized metrics
  contribute_anonymous_metrics BOOLEAN DEFAULT FALSE,
  contributing_since TIMESTAMPTZ,
  last_contributed_at TIMESTAMPTZ,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(studio_id)
);

COMMENT ON TABLE studio_benchmark_config IS 'Per-studio benchmark configuration. Links a studio to its benchmark category and tracks opt-in status for contributing anonymized metrics.';

CREATE INDEX idx_studio_benchmark_config_studio ON studio_benchmark_config(studio_id);

-- ============================================================================
-- SCHEDULED REPORTS
-- Studios configure recurring reports delivered via email, CSV, or PDF.
-- A cron job checks next_send_at and generates/delivers the report.
-- ============================================================================

CREATE TABLE scheduled_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  -- Report configuration
  report_type TEXT NOT NULL,                      -- daily_summary, weekly_summary, monthly_financials, monthly_pl, member_engagement, teacher_performance, promo_performance
  frequency TEXT NOT NULL,                        -- daily, weekly, monthly
  delivery_day INTEGER,                           -- 0=Sunday for weekly, 1-28 for monthly
  delivery_hour INTEGER DEFAULT 8,                -- hour of day (0-23) in studio timezone
  -- Recipients: array of { profile_id, email }
  recipients JSONB NOT NULL DEFAULT '[]',
  -- Optional filters
  filters JSONB,                                  -- { date_range, location_id, offering_ids, ... }
  -- Delivery format
  format TEXT DEFAULT 'email',                    -- email, csv, pdf
  -- Status & scheduling
  is_active BOOLEAN DEFAULT TRUE,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  -- Ownership
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE scheduled_reports IS 'Recurring report definitions. A cron job checks next_send_at and generates/delivers reports to configured recipients.';

CREATE INDEX idx_scheduled_reports_studio ON scheduled_reports(studio_id);
CREATE INDEX idx_scheduled_reports_next_send ON scheduled_reports(next_send_at) WHERE is_active = TRUE;

-- ============================================================================
-- EXPANSION INDICATORS (should I open a new studio?)
-- Comprehensive analysis combining capacity, demand, and financial signals
-- to help studio owners evaluate expansion readiness. Computed on-demand
-- or periodically, resulting in a scored recommendation.
-- ============================================================================

CREATE TABLE expansion_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- ---- CAPACITY SIGNALS ----
  avg_class_fill_rate DECIMAL(5,2),               -- average across all classes
  peak_hour_fill_rate DECIMAL(5,2),               -- fill rate during peak hours
  classes_at_capacity_pct DECIMAL(5,2),           -- % of classes that hit max
  waitlist_frequency DECIMAL(5,2),                -- % of classes with waitlist
  -- ---- DEMAND SIGNALS ----
  new_student_growth_rate DECIMAL(5,2),           -- month over month
  student_zip_code_distribution JSONB,            -- { "90210": 45, "90211": 32, ... }
  search_demand_notes TEXT,                       -- for manual research input
  -- ---- FINANCIAL SIGNALS ----
  current_monthly_net_income_cents BIGINT,
  revenue_growth_rate_3m DECIMAL(5,2),
  revenue_growth_rate_12m DECIMAL(5,2),
  operating_margin_pct DECIMAL(5,2),
  -- ---- RECOMMENDATION ----
  expansion_score INTEGER,                        -- 0-100
  recommendation TEXT,                            -- not_ready, building_momentum, strong_candidate, compelling
  reasoning JSONB,                                -- array of { signal, value, interpretation }
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE expansion_indicators IS 'Expansion readiness analysis combining capacity, demand, and financial signals into a scored recommendation for opening a new location.';

CREATE INDEX idx_expansion_indicators_studio ON expansion_indicators(studio_id);
CREATE INDEX idx_expansion_indicators_analyzed ON expansion_indicators(studio_id, analyzed_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- All analytics tables are restricted to studio owners and admins.
-- Financial data should never leak to front_desk, teachers, or students.
-- ============================================================================

ALTER TABLE mrr_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_forecast_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clv_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pl_monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonality_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_benchmark_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE expansion_indicators ENABLE ROW LEVEL SECURITY;

-- MRR Snapshots: owners and admins only
CREATE POLICY "Admins can view MRR snapshots"
  ON mrr_snapshots FOR SELECT
  USING (studio_id IN (
    SELECT studio_id FROM studio_staff
    WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can manage MRR snapshots"
  ON mrr_snapshots FOR ALL
  USING (studio_id IN (
    SELECT studio_id FROM studio_staff
    WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Revenue Forecast Configs: owners and admins
CREATE POLICY "Admins can manage forecast configs"
  ON revenue_forecast_configs FOR ALL
  USING (studio_id IN (
    SELECT studio_id FROM studio_staff
    WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Revenue Forecasts: owners and admins
CREATE POLICY "Admins can manage forecasts"
  ON revenue_forecasts FOR ALL
  USING (studio_id IN (
    SELECT studio_id FROM studio_staff
    WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- CLV Cohorts: owners and admins
CREATE POLICY "Admins can view CLV cohorts"
  ON clv_cohorts FOR ALL
  USING (studio_id IN (
    SELECT studio_id FROM studio_staff
    WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- P&L Summaries: owners and admins
CREATE POLICY "Admins can manage P&L summaries"
  ON pl_monthly_summaries FOR ALL
  USING (studio_id IN (
    SELECT studio_id FROM studio_staff
    WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Promo Performance: staff can view (marketing relevance), admins can manage
CREATE POLICY "Staff can view promo performance"
  ON promo_performance FOR SELECT
  USING (studio_id IN (
    SELECT studio_id FROM studio_staff
    WHERE profile_id = auth.uid()
  ));

CREATE POLICY "Admins can manage promo performance"
  ON promo_performance FOR ALL
  USING (studio_id IN (
    SELECT studio_id FROM studio_staff
    WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Conversion Funnels: owners and admins
CREATE POLICY "Admins can view conversion funnels"
  ON conversion_funnels FOR ALL
  USING (studio_id IN (
    SELECT studio_id FROM studio_staff
    WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Seasonality Patterns: owners and admins
CREATE POLICY "Admins can view seasonality patterns"
  ON seasonality_patterns FOR ALL
  USING (studio_id IN (
    SELECT studio_id FROM studio_staff
    WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Benchmark Categories: publicly readable (reference data)
CREATE POLICY "Anyone can view benchmark categories"
  ON benchmark_categories FOR SELECT
  USING (TRUE);

-- Benchmark Metrics: publicly readable (reference data)
CREATE POLICY "Anyone can view benchmark metrics"
  ON benchmark_metrics FOR SELECT
  USING (TRUE);

-- Studio Benchmark Config: owners and admins
CREATE POLICY "Admins can manage benchmark config"
  ON studio_benchmark_config FOR ALL
  USING (studio_id IN (
    SELECT studio_id FROM studio_staff
    WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Scheduled Reports: owners and admins
CREATE POLICY "Admins can manage scheduled reports"
  ON scheduled_reports FOR ALL
  USING (studio_id IN (
    SELECT studio_id FROM studio_staff
    WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Expansion Indicators: owners and admins
CREATE POLICY "Admins can view expansion indicators"
  ON expansion_indicators FOR ALL
  USING (studio_id IN (
    SELECT studio_id FROM studio_staff
    WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_revenue_forecast_configs_updated_at BEFORE UPDATE ON revenue_forecast_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_pl_monthly_summaries_updated_at BEFORE UPDATE ON pl_monthly_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_studio_benchmark_config_updated_at BEFORE UPDATE ON studio_benchmark_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_scheduled_reports_updated_at BEFORE UPDATE ON scheduled_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SEED DATA: BENCHMARK CATEGORIES
-- Initial benchmark categories covering the most common studio types.
-- These are reference data — not studio-specific.
-- ============================================================================

INSERT INTO benchmark_categories (id, name, display_name, description, studio_size) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'yoga_studio_small', 'Small Yoga Studio', 'Single-location yoga studio with 1-3 rooms, offering vinyasa, hatha, yin, and similar styles.', 'small'),
  ('b0000000-0000-0000-0000-000000000002', 'hot_yoga', 'Hot Yoga Studio', 'Studio specializing in heated yoga (Bikram-style, hot vinyasa, hot power). Higher price point, dedicated HVAC.', 'small'),
  ('b0000000-0000-0000-0000-000000000003', 'pilates_reformer', 'Pilates Reformer Studio', 'Reformer-based Pilates studio with equipment classes. Smaller class sizes, higher per-class revenue.', 'small'),
  ('b0000000-0000-0000-0000-000000000004', 'general_fitness', 'General Fitness / Movement Studio', 'Multi-discipline studio offering a mix of yoga, barre, HIIT, dance, and other movement classes.', 'small'),
  ('b0000000-0000-0000-0000-000000000005', 'martial_arts', 'Martial Arts Studio', 'Martial arts school (BJJ, karate, muay thai, MMA). Higher retention, belt/rank systems, longer student tenure.', 'small');

-- ============================================================================
-- SEED DATA: BENCHMARK METRICS
-- Rule-of-thumb industry benchmarks. These are reasonable starting values
-- based on industry reports and studio owner surveys. They will be refined
-- over time as contributing studios opt in with anonymized data.
--
-- Values vary by studio type to reflect real differences:
--   - Hot yoga: higher revenue per student, higher churn (intensity burnout)
--   - Pilates reformer: highest revenue, smaller classes, moderate retention
--   - Martial arts: highest retention, moderate revenue, high class frequency
--   - General fitness: broader appeal, moderate across the board
-- ============================================================================

-- ---- Small Yoga Studio ----
INSERT INTO benchmark_metrics (category_id, metric_name, display_name, description, unit, p25, p50, p75, p90, source, last_updated) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'avg_revenue_per_student', 'Avg Revenue per Student', 'Average monthly revenue per active student across all revenue streams.', 'currency_cents', 8000, 11000, 15000, 20000, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000001', 'monthly_churn_rate', 'Monthly Churn Rate', 'Percentage of active members who cancel or lapse each month.', 'percentage', 3.0, 5.0, 8.0, 12.0, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000001', 'avg_class_fill_rate', 'Avg Class Fill Rate', 'Average percentage of capacity filled across all classes.', 'percentage', 45.0, 60.0, 75.0, 85.0, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000001', 'avg_clv_cents', 'Average Customer Lifetime Value', 'Total revenue a student generates over their entire relationship with the studio.', 'currency_cents', 60000, 120000, 240000, 480000, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000001', 'classes_per_student_month', 'Classes per Student per Month', 'Average number of classes attended per active student per month.', 'count', 2.0, 4.0, 8.0, 12.0, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000001', 'new_student_monthly_rate', 'New Students per Month', 'Average number of new students joining per month.', 'count', 5.0, 12.0, 25.0, 50.0, 'rule_of_thumb', NOW());

-- ---- Hot Yoga Studio (higher revenue, slightly higher churn) ----
INSERT INTO benchmark_metrics (category_id, metric_name, display_name, description, unit, p25, p50, p75, p90, source, last_updated) VALUES
  ('b0000000-0000-0000-0000-000000000002', 'avg_revenue_per_student', 'Avg Revenue per Student', 'Average monthly revenue per active student across all revenue streams.', 'currency_cents', 10000, 14000, 18000, 24000, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'monthly_churn_rate', 'Monthly Churn Rate', 'Percentage of active members who cancel or lapse each month.', 'percentage', 4.0, 6.0, 9.0, 14.0, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'avg_class_fill_rate', 'Avg Class Fill Rate', 'Average percentage of capacity filled across all classes.', 'percentage', 50.0, 65.0, 80.0, 90.0, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'avg_clv_cents', 'Average Customer Lifetime Value', 'Total revenue a student generates over their entire relationship with the studio.', 'currency_cents', 55000, 110000, 220000, 420000, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'classes_per_student_month', 'Classes per Student per Month', 'Average number of classes attended per active student per month.', 'count', 2.5, 4.5, 8.0, 12.0, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000002', 'new_student_monthly_rate', 'New Students per Month', 'Average number of new students joining per month.', 'count', 6.0, 15.0, 30.0, 55.0, 'rule_of_thumb', NOW());

-- ---- Pilates Reformer Studio (highest per-student revenue, smaller classes) ----
INSERT INTO benchmark_metrics (category_id, metric_name, display_name, description, unit, p25, p50, p75, p90, source, last_updated) VALUES
  ('b0000000-0000-0000-0000-000000000003', 'avg_revenue_per_student', 'Avg Revenue per Student', 'Average monthly revenue per active student across all revenue streams.', 'currency_cents', 15000, 20000, 28000, 38000, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000003', 'monthly_churn_rate', 'Monthly Churn Rate', 'Percentage of active members who cancel or lapse each month.', 'percentage', 3.0, 4.5, 7.0, 10.0, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000003', 'avg_class_fill_rate', 'Avg Class Fill Rate', 'Average percentage of capacity filled across all classes. Reformer classes are typically 8-14 students.', 'percentage', 50.0, 65.0, 80.0, 92.0, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000003', 'avg_clv_cents', 'Average Customer Lifetime Value', 'Total revenue a student generates over their entire relationship with the studio.', 'currency_cents', 90000, 180000, 360000, 700000, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000003', 'classes_per_student_month', 'Classes per Student per Month', 'Average number of classes attended per active student per month.', 'count', 2.0, 3.0, 6.0, 10.0, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000003', 'new_student_monthly_rate', 'New Students per Month', 'Average number of new students joining per month. Smaller class sizes limit intake.', 'count', 3.0, 8.0, 18.0, 35.0, 'rule_of_thumb', NOW());

-- ---- General Fitness / Movement Studio (broad appeal, moderate metrics) ----
INSERT INTO benchmark_metrics (category_id, metric_name, display_name, description, unit, p25, p50, p75, p90, source, last_updated) VALUES
  ('b0000000-0000-0000-0000-000000000004', 'avg_revenue_per_student', 'Avg Revenue per Student', 'Average monthly revenue per active student across all revenue streams.', 'currency_cents', 7500, 10000, 14000, 19000, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000004', 'monthly_churn_rate', 'Monthly Churn Rate', 'Percentage of active members who cancel or lapse each month.', 'percentage', 4.0, 6.0, 9.0, 13.0, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000004', 'avg_class_fill_rate', 'Avg Class Fill Rate', 'Average percentage of capacity filled across all classes.', 'percentage', 40.0, 55.0, 70.0, 82.0, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000004', 'avg_clv_cents', 'Average Customer Lifetime Value', 'Total revenue a student generates over their entire relationship with the studio.', 'currency_cents', 50000, 100000, 200000, 400000, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000004', 'classes_per_student_month', 'Classes per Student per Month', 'Average number of classes attended per active student per month.', 'count', 2.0, 3.5, 7.0, 11.0, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000004', 'new_student_monthly_rate', 'New Students per Month', 'Average number of new students joining per month.', 'count', 5.0, 14.0, 28.0, 55.0, 'rule_of_thumb', NOW());

-- ---- Martial Arts Studio (highest retention, strong class frequency) ----
INSERT INTO benchmark_metrics (category_id, metric_name, display_name, description, unit, p25, p50, p75, p90, source, last_updated) VALUES
  ('b0000000-0000-0000-0000-000000000005', 'avg_revenue_per_student', 'Avg Revenue per Student', 'Average monthly revenue per active student. Includes belt testing fees and gear.', 'currency_cents', 9000, 13000, 17000, 22000, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000005', 'monthly_churn_rate', 'Monthly Churn Rate', 'Percentage of active members who cancel or lapse each month. Belt systems improve retention.', 'percentage', 2.0, 3.5, 6.0, 9.0, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000005', 'avg_class_fill_rate', 'Avg Class Fill Rate', 'Average percentage of capacity filled across all classes.', 'percentage', 40.0, 55.0, 70.0, 85.0, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000005', 'avg_clv_cents', 'Average Customer Lifetime Value', 'Total revenue a student generates over their entire relationship. Martial arts students tend to stay longer.', 'currency_cents', 80000, 160000, 350000, 650000, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000005', 'classes_per_student_month', 'Classes per Student per Month', 'Average number of classes attended per active student per month. Martial arts encourages high frequency.', 'count', 3.0, 5.0, 9.0, 14.0, 'rule_of_thumb', NOW()),
  ('b0000000-0000-0000-0000-000000000005', 'new_student_monthly_rate', 'New Students per Month', 'Average number of new students joining per month.', 'count', 4.0, 10.0, 22.0, 45.0, 'rule_of_thumb', NOW());
