-- Close a hole in confirm_membership_payment.
--
-- Migration 013 guarded the function with:
--
--   IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN RAISE ...
--
-- which skips the check entirely for an anonymous caller, because auth.uid()
-- is NULL for one. The function is SECURITY DEFINER and EXECUTE is granted to
-- PUBLIC, so nothing else stood behind it: anyone holding the anon key — it
-- ships in the browser bundle — could activate any member sitting in
-- approved_awaiting_payment and issue them a membership number, without
-- logging in. Verified against the live project before writing this.
--
-- The auth.uid() IS NULL escape existed so the service role and SQL run
-- straight against the database stay unaffected. Those cases are now
-- identified positively rather than by the absence of a user id:
--
--   * a JWT whose role is service_role,
--   * no request context at all (psql, the SQL editor) — auth.jwt() is NULL,
--
-- and every other caller, anon included, must satisfy is_admin().

CREATE OR REPLACE FUNCTION public.confirm_membership_payment(member_id UUID, admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mem_type TEXT;
  updated  INTEGER;
BEGIN
  IF NOT (
    public.is_admin()
    OR auth.role() = 'service_role'
    OR auth.jwt() IS NULL
  ) THEN
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
    AND membership_payment_status IS DISTINCT FROM 'confirmed';

  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated > 0;
END;
$$;

-- Defence in depth: even with the guard above, an unauthenticated caller has
-- no business being able to invoke this at all.
REVOKE ALL ON FUNCTION public.confirm_membership_payment(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_membership_payment(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.confirm_membership_payment(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_membership_payment(UUID, UUID) TO service_role;

NOTIFY pgrst, 'reload schema';
