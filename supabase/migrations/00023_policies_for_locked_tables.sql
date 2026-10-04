-- 00023: Policies for the 26 tables that had RLS enabled and no policy.
--
-- With RLS on and no policy, clients get zero rows and only the service role
-- works. That was safe, but it means the feature behind each table cannot
-- work from the app. This migration gives every one of them an explicit,
-- least-privilege policy so the next feature does not start by guessing.
--
-- Policy classes (see docs/developer/06-launch-architecture.md):
--   A  studio config      staff read, owner/admin write       (studio_id column)
--   B  member activity    member reads own, staff read        (studio_id + profile_id)
--   C  child of a parent  tenant reached through the parent
--   D  household / queue  member reads own, staff read
--   E  event detail       staff read, owner/admin write       (public reads go through an RPC)
--   F  restricted         owner/admin only, or proposer/recipient
--
-- Writes by members (redemptions, requests, deliveries, ledger rows) happen in
-- edge functions and SECURITY DEFINER RPCs, so those tables are read-only to
-- clients on purpose. Add a write policy only together with the feature that
-- needs it, and a test in supabase/tests/.

-- ---------------------------------------------------------------------------
-- Class A: studio configuration. Staff read; owners and admins write.
-- ---------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'membership_addons', 'purchase_orders', 'referral_programs',
    'seo_recommendations', 'nudge_rules', 'notification_templates_v2',
    'video_series', 'video_collections'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "Staff view %1$s" ON %1$I FOR SELECT USING (studio_id IN (SELECT my_staff_studio_ids()))', t);
    EXECUTE format(
      'CREATE POLICY "Admins manage %1$s" ON %1$I FOR ALL
         USING (studio_id IN (SELECT my_admin_studio_ids()))
         WITH CHECK (studio_id IN (SELECT my_admin_studio_ids()))', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Class B: member activity. The member reads their own rows; staff read all.
-- Rows are written by edge functions / RPCs (service role).
-- ---------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'promo_redemptions', 'intro_offer_redemptions', 'review_requests', 'engagement_events'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "Members view own %1$s" ON %1$I FOR SELECT USING (profile_id = (SELECT auth.uid()))', t);
    EXECUTE format(
      'CREATE POLICY "Staff view %1$s" ON %1$I FOR SELECT USING (studio_id IN (SELECT my_staff_studio_ids()))', t);
  END LOOP;
END $$;

-- Delivery log: the recipient sees what was sent to them; staff see the studio's.
CREATE POLICY "Recipients view own notification delivery log"
  ON notification_delivery_log FOR SELECT
  USING (recipient_id = (SELECT auth.uid()));
CREATE POLICY "Staff view notification delivery log"
  ON notification_delivery_log FOR SELECT
  USING (studio_id IN (SELECT my_staff_studio_ids()));

-- ---------------------------------------------------------------------------
-- Class C: children reached through their parent row.
-- ---------------------------------------------------------------------------

-- landing_page_variants never had its foreign key; add it (NOT VALID so any
-- existing orphan row does not block the migration, new rows are enforced).
ALTER TABLE landing_page_variants
  ADD CONSTRAINT landing_page_variants_landing_page_id_fkey
  FOREIGN KEY (landing_page_id) REFERENCES landing_pages(id) ON DELETE CASCADE NOT VALID;

CREATE POLICY "Staff view landing page variants"
  ON landing_page_variants FOR SELECT
  USING (EXISTS (SELECT 1 FROM landing_pages p
    WHERE p.id = landing_page_variants.landing_page_id
      AND p.studio_id IN (SELECT my_staff_studio_ids())));
CREATE POLICY "Admins manage landing page variants"
  ON landing_page_variants FOR ALL
  USING (EXISTS (SELECT 1 FROM landing_pages p
    WHERE p.id = landing_page_variants.landing_page_id
      AND p.studio_id IN (SELECT my_admin_studio_ids())))
  WITH CHECK (EXISTS (SELECT 1 FROM landing_pages p
    WHERE p.id = landing_page_variants.landing_page_id
      AND p.studio_id IN (SELECT my_admin_studio_ids())));

CREATE POLICY "Staff view purchase order items"
  ON purchase_order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM purchase_orders o
    WHERE o.id = purchase_order_items.purchase_order_id
      AND o.studio_id IN (SELECT my_staff_studio_ids())));
CREATE POLICY "Admins manage purchase order items"
  ON purchase_order_items FOR ALL
  USING (EXISTS (SELECT 1 FROM purchase_orders o
    WHERE o.id = purchase_order_items.purchase_order_id
      AND o.studio_id IN (SELECT my_admin_studio_ids())))
  WITH CHECK (EXISTS (SELECT 1 FROM purchase_orders o
    WHERE o.id = purchase_order_items.purchase_order_id
      AND o.studio_id IN (SELECT my_admin_studio_ids())));

-- Stock and gift card ledgers are append-only records written by the server.
CREATE POLICY "Staff view inventory movements"
  ON inventory_movements FOR SELECT
  USING (EXISTS (SELECT 1 FROM products p
    WHERE p.id = inventory_movements.product_id
      AND p.studio_id IN (SELECT my_staff_studio_ids())));

CREATE POLICY "Admins view gift card transactions"
  ON gift_card_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM gift_cards g
    WHERE g.id = gift_card_transactions.gift_card_id
      AND g.studio_id IN (SELECT my_admin_studio_ids())));

CREATE POLICY "Staff view sms messages"
  ON sms_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM sms_conversations c
    WHERE c.id = sms_messages.conversation_id
      AND c.studio_id IN (SELECT my_staff_studio_ids())));

CREATE POLICY "Members view own addon subscriptions"
  ON membership_addon_subscriptions FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m
    WHERE m.id = membership_addon_subscriptions.membership_id
      AND m.profile_id = (SELECT auth.uid())));
CREATE POLICY "Staff view addon subscriptions"
  ON membership_addon_subscriptions FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m
    WHERE m.id = membership_addon_subscriptions.membership_id
      AND m.studio_id IN (SELECT my_staff_studio_ids())));

-- ---------------------------------------------------------------------------
-- Class D: households and the waitlist offer queue.
-- ---------------------------------------------------------------------------
-- households <-> household_members referenced each other in their policies
-- (infinite recursion, same failure mode as 00020). Break the cycle with
-- SECURITY DEFINER helpers, and make the households policy is_active aware.
CREATE OR REPLACE FUNCTION my_household_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT household_id FROM household_members WHERE profile_id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION my_staff_household_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM households WHERE studio_id IN (SELECT my_staff_studio_ids()); $$;

REVOKE ALL ON FUNCTION my_household_ids(), my_staff_household_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION my_household_ids(), my_staff_household_ids() TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Household members can view their household" ON households;
CREATE POLICY "Household members and staff view households"
  ON households FOR SELECT
  USING (id IN (SELECT my_household_ids()) OR studio_id IN (SELECT my_staff_studio_ids()));

CREATE POLICY "Members view own household membership"
  ON household_members FOR SELECT
  USING (profile_id = (SELECT auth.uid()));
CREATE POLICY "Staff view household members"
  ON household_members FOR SELECT
  USING (household_id IN (SELECT my_staff_household_ids()));

CREATE POLICY "Members view own waitlist offers"
  ON waitlist_promotions FOR SELECT
  USING (profile_id = (SELECT auth.uid()));
CREATE POLICY "Staff view waitlist offers"
  ON waitlist_promotions FOR SELECT
  USING (EXISTS (SELECT 1 FROM class_occurrences co
    WHERE co.id = waitlist_promotions.class_occurrence_id
      AND co.studio_id IN (SELECT my_staff_studio_ids())));

-- ---------------------------------------------------------------------------
-- Class E: event detail. Public event pages read through an RPC, not these tables.
-- ---------------------------------------------------------------------------
CREATE POLICY "Staff view event sessions"
  ON event_sessions FOR SELECT
  USING (studio_id IN (SELECT my_staff_studio_ids()));
CREATE POLICY "Admins manage event sessions"
  ON event_sessions FOR ALL
  USING (studio_id IN (SELECT my_admin_studio_ids()))
  WITH CHECK (studio_id IN (SELECT my_admin_studio_ids()));

CREATE POLICY "Staff view event teachers"
  ON event_teachers FOR SELECT
  USING (EXISTS (SELECT 1 FROM events e
    WHERE e.id = event_teachers.event_id
      AND e.studio_id IN (SELECT my_staff_studio_ids())));
CREATE POLICY "Admins manage event teachers"
  ON event_teachers FOR ALL
  USING (EXISTS (SELECT 1 FROM events e
    WHERE e.id = event_teachers.event_id
      AND e.studio_id IN (SELECT my_admin_studio_ids())))
  WITH CHECK (EXISTS (SELECT 1 FROM events e
    WHERE e.id = event_teachers.event_id
      AND e.studio_id IN (SELECT my_admin_studio_ids())));

CREATE POLICY "Staff view event pricing tiers"
  ON event_pricing_tiers FOR SELECT
  USING (EXISTS (SELECT 1 FROM events e
    WHERE e.id = event_pricing_tiers.event_id
      AND e.studio_id IN (SELECT my_staff_studio_ids())));
CREATE POLICY "Admins manage event pricing tiers"
  ON event_pricing_tiers FOR ALL
  USING (EXISTS (SELECT 1 FROM events e
    WHERE e.id = event_pricing_tiers.event_id
      AND e.studio_id IN (SELECT my_admin_studio_ids())))
  WITH CHECK (EXISTS (SELECT 1 FROM events e
    WHERE e.id = event_pricing_tiers.event_id
      AND e.studio_id IN (SELECT my_admin_studio_ids())));

-- ---------------------------------------------------------------------------
-- Class F: restricted.
-- ---------------------------------------------------------------------------
CREATE POLICY "Employees view own corporate membership"
  ON corporate_employees FOR SELECT
  USING (profile_id = (SELECT auth.uid()));
CREATE POLICY "Admins manage corporate employees"
  ON corporate_employees FOR ALL
  USING (EXISTS (SELECT 1 FROM corporate_accounts a
    WHERE a.id = corporate_employees.corporate_account_id
      AND a.studio_id IN (SELECT my_admin_studio_ids())))
  WITH CHECK (EXISTS (SELECT 1 FROM corporate_accounts a
    WHERE a.id = corporate_employees.corporate_account_id
      AND a.studio_id IN (SELECT my_admin_studio_ids())));

CREATE POLICY "Parties view own shift trades"
  ON shift_trades FOR SELECT
  USING (proposer_id = (SELECT auth.uid()) OR recipient_id = (SELECT auth.uid()));
CREATE POLICY "Admins manage shift trades"
  ON shift_trades FOR ALL
  USING (studio_id IN (SELECT my_admin_studio_ids()))
  WITH CHECK (studio_id IN (SELECT my_admin_studio_ids()));
