-- Let an admin confirm a membership fee that was paid outside the site.
--
-- Members who pay in cash or by direct bank transfer never press "I have
-- paid", so their membership_payment_status stays 'pending'. The original
-- function only matched rows already marked 'submitted', so confirming such a
-- member updated nothing — and because it returned VOID, the caller could not
-- tell the difference between a confirmation and a silent no-op.
--
-- This version matches any member still awaiting payment and reports whether a
-- row was actually updated. The return type changes, so the function has to be
-- dropped rather than replaced.

DROP FUNCTION IF EXISTS public.confirm_membership_payment(UUID, UUID);

CREATE FUNCTION public.confirm_membership_payment(member_id UUID, admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mem_type TEXT;
  updated  INTEGER;
BEGIN
  -- The function is SECURITY DEFINER and EXECUTE is public, so without this
  -- check any signed-in user could activate a membership by calling it —
  -- previously by first marking their own payment 'submitted', and after the
  -- relaxed match below, directly. Confirming a payment is an admin action.
  -- Mirrors enforce_profile_change_approval(): the service role and SQL run
  -- without a JWT (auth.uid() IS NULL) are unaffected.
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only an admin can confirm a membership payment.'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT membership_type INTO mem_type FROM members WHERE id = member_id;

  UPDATE members
  SET
    status = 'active',
    membership_payment_status = 'confirmed',
    membership_payment_confirmed_at = NOW(),
    membership_payment_confirmed_by = admin_id,
    membership_number = nextval('membership_number_seq'),
    membership_issued_at = NOW(),
    membership_expires_at = CASE
      WHEN mem_type = 'lifetime' THEN NULL
      ELSE NOW() + INTERVAL '1 year'
    END
  WHERE id = member_id
    AND status = 'approved_awaiting_payment'
    -- Was: membership_payment_status = 'submitted'. Now anything except an
    -- already-confirmed payment, so offline payers are covered while a double
    -- confirmation still cannot burn a second membership number.
    AND membership_payment_status IS DISTINCT FROM 'confirmed';

  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated > 0;
END;
$$;
