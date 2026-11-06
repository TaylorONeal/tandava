\i helpers.sql
DO $$
DECLARE
  v_off uuid := 'aaaaaaaa-2000-0000-0000-000000000001';
  v_other uuid := 'aaaaaaaa-2000-0000-0000-000000000002';
  v_other_occ uuid := 'aaaaaaaa-3000-0000-0000-000000000002';
  v_pt uuid := 'aaaaaaaa-4000-0000-0000-000000000001';
  v_mt uuid; v_pack uuid; v_mem uuid; v_booking bookings; n integer; denied boolean;
  s jsonb;
BEGIN
  PERFORM pg_temp.ok((SELECT purchase_scope FROM offerings WHERE id=v_off)='unknown', 'SCOPE-01', 'legacy classes are not assumed physical');
  PERFORM pg_temp.as_user(pg_temp.id('staff_b'));
  UPDATE offerings SET purchase_scope='in_person' WHERE id=v_off;
  GET DIAGNOSTICS n=ROW_COUNT;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n=0,'SCOPE-02','another studio cannot classify this class');
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  UPDATE class_pack_types SET purchase_scope='in_person' WHERE id=v_pt;
  GET DIAGNOSTICS n=ROW_COUNT;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(n=0,'SCOPE-03','a buyer cannot classify a product');
  PERFORM pg_temp.as_user(pg_temp.id('staff_a'));
  UPDATE offerings SET purchase_scope='in_person' WHERE id=v_off;
  UPDATE class_pack_types SET purchase_scope='in_person' WHERE id=v_pt;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok((SELECT purchase_scope FROM offerings WHERE id=v_off)='in_person','SCOPE-04','owner classifies their product');
  BEGIN
    UPDATE offerings SET purchase_scope='digital_or_mixed' WHERE id=v_off;
    denied:=false;
  EXCEPTION WHEN check_violation THEN denied:=true; END;
  PERFORM pg_temp.ok(denied,'SCOPE-05','physical product cannot be widened after checkout');
  BEGIN
    UPDATE class_occurrences SET offering_id=v_other WHERE id=pg_temp.id('occ_a_open');
    denied:=false;
  EXCEPTION WHEN check_violation THEN denied:=true; END;
  PERFORM pg_temp.ok(denied,'SCOPE-06','physical scheduled class cannot be rebound to digital class');

  s:=jsonb_build_object('id','cs_scope','payment_intent','pi_scope','amount_total',10000,'currency','usd',
    'metadata',jsonb_build_object('type','class_pack','studio_id',pg_temp.id('studio_a'),
      'profile_id',pg_temp.id('student_a1'),'class_pack_type_id',v_pt,'purchase_scope','in_person'));
  EXECUTE 'SET LOCAL ROLE service_role';
  PERFORM fulfill_stripe_checkout('evt_scope','checkout.session.completed',s);
  PERFORM fulfill_stripe_checkout('evt_scope','checkout.session.completed',s);
  EXECUTE 'RESET ROLE';
  SELECT id INTO v_pack FROM class_packs WHERE stripe_payment_intent_id='pi_scope';
  PERFORM pg_temp.ok((SELECT count(*) FROM class_packs WHERE stripe_payment_intent_id='pi_scope' AND purchase_scope='in_person')=1,
    'SCOPE-07','webhook freezes physical scope exactly once');
  BEGIN
    UPDATE class_packs SET purchase_scope='unknown' WHERE id=v_pack;
    denied:=false;
  EXCEPTION WHEN check_violation THEN denied:=true; END;
  PERFORM pg_temp.ok(denied,'SCOPE-08','purchased scope cannot be removed');
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  BEGIN
    PERFORM book_class(v_other_occ,'class_pack',v_pack);
    denied:=false;
  EXCEPTION WHEN check_violation THEN denied:=true; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(denied AND (SELECT classes_remaining FROM class_packs WHERE id=v_pack)=5,
    'SCOPE-09','unknown class rejected without consuming credits');
  UPDATE offerings SET purchase_scope='digital_or_mixed' WHERE id=v_other;
  BEGIN
    INSERT INTO bookings(studio_id,profile_id,class_occurrence_id,class_pack_id,status)
      VALUES(pg_temp.id('studio_a'),pg_temp.id('student_a1'),v_other_occ,v_pack,'waitlisted');
    denied:=false;
  EXCEPTION WHEN check_violation THEN denied:=true; END;
  PERFORM pg_temp.ok(denied,'SCOPE-10','direct waitlist insert cannot bypass digital restriction');
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  v_booking:=book_class(pg_temp.id('occ_a_open'),'class_pack',v_pack);
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(v_booking.status='confirmed' AND (SELECT classes_remaining FROM class_packs WHERE id=v_pack)=4,
    'SCOPE-11','physical redemption consumes one credit');
  UPDATE bookings SET status='cancelled' WHERE id=v_booking.id;
  PERFORM pg_temp.ok((SELECT classes_remaining FROM class_packs WHERE id=v_pack)=5,'SCOPE-12','cancellation still returns credit');

  INSERT INTO membership_types(studio_id,name,price_cents,purchase_scope)
    VALUES(pg_temp.id('studio_a'),'Physical membership',15000,'in_person') RETURNING id INTO v_mt;
  s:=jsonb_build_object('id','cs_scope_mem','subscription','sub_scope','amount_total',15000,
    'metadata',jsonb_build_object('type','membership','studio_id',pg_temp.id('studio_a'),
      'profile_id',pg_temp.id('student_a1'),'membership_type_id',v_mt,'purchase_scope','in_person'));
  EXECUTE 'SET LOCAL ROLE service_role';
  PERFORM fulfill_stripe_checkout('evt_scope_mem','checkout.session.completed',s);
  EXECUTE 'RESET ROLE';
  SELECT id INTO v_mem FROM memberships WHERE stripe_subscription_id='sub_scope';
  PERFORM pg_temp.ok((SELECT purchase_scope FROM memberships WHERE id=v_mem)='in_person','SCOPE-13','membership freezes purchased scope');
  PERFORM pg_temp.as_user(pg_temp.id('student_a1'));
  BEGIN
    PERFORM book_class(v_other_occ,'membership',v_mem); denied:=false;
  EXCEPTION WHEN check_violation THEN denied:=true; END;
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok(denied,'SCOPE-14','physical membership cannot buy a digital class');

  s:=jsonb_build_object('id','cs_legacy_scope','payment_intent','pi_legacy_scope','amount_total',10000,
    'metadata',jsonb_build_object('type','class_pack','studio_id',pg_temp.id('studio_a'),
      'profile_id',pg_temp.id('student_a2'),'class_pack_type_id',v_pt));
  EXECUTE 'SET LOCAL ROLE service_role';
  PERFORM fulfill_stripe_checkout('evt_legacy_scope','checkout.session.completed',s);
  EXECUTE 'RESET ROLE';
  PERFORM pg_temp.ok((SELECT purchase_scope FROM class_packs WHERE stripe_payment_intent_id='pi_legacy_scope')='unknown',
    'SCOPE-15','old checkout retains old terms after owner classifies product');
END $$;
