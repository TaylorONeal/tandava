-- 00023: a signed-in member books a free class (PRD-020 member path)
--
-- book_class() (00012) needs a membership or a class pack, and express-book
-- diverts any claimed account to an emailed link. So a signed-in member with
-- no entitlement had no way to book a class that costs nothing. This wraps
-- create_guest_booking() for the caller's own profile, only when the class is
-- free and the studio is discoverable. Same capacity lock and idempotency.

CREATE OR REPLACE FUNCTION book_free_class(p_occurrence_id UUID)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price INTEGER;
  v_discoverable BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to book';
  END IF;

  SELECT o.drop_in_price_cents, s.discoverable
    INTO v_price, v_discoverable
  FROM class_occurrences co
  JOIN offerings o ON o.id = co.offering_id
  JOIN studios s ON s.id = co.studio_id
  WHERE co.id = p_occurrence_id;

  IF NOT FOUND OR NOT COALESCE(v_discoverable, FALSE) THEN
    RAISE EXCEPTION 'Class not found';
  END IF;
  IF COALESCE(v_price, -1) <> 0 THEN
    RAISE EXCEPTION 'This class is not free';
  END IF;

  RETURN create_guest_booking(p_occurrence_id, auth.uid(), NULL);
END;
$$;

COMMENT ON FUNCTION book_free_class(UUID) IS
  'Books the signed-in caller into a zero-price class via create_guest_booking (capacity lock, idempotent). Authenticated only.';

REVOKE ALL ON FUNCTION book_free_class(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION book_free_class(UUID) TO authenticated;
