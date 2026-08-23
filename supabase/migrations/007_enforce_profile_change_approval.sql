-- Enforce the name/designation approval flow at the database level.
--
-- Members may not change their own first_name, last_name or designation
-- directly; those changes must go through profile_change_requests and be
-- applied by an admin. Admins (is_admin()), the service role and SQL run
-- without a JWT (auth.uid() IS NULL) are unaffected.

CREATE OR REPLACE FUNCTION public.enforce_profile_change_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.first_name  IS DISTINCT FROM OLD.first_name
  OR NEW.last_name   IS DISTINCT FROM OLD.last_name
  OR NEW.designation IS DISTINCT FROM OLD.designation THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      RAISE EXCEPTION
        'Changes to name or designation require admin approval. Please submit a profile change request.'
        USING ERRCODE = 'P0001',
              HINT = 'Insert a row into profile_change_requests instead.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_change_approval ON public.members;
CREATE TRIGGER trg_enforce_profile_change_approval
  BEFORE UPDATE OF first_name, last_name, designation ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_change_approval();

-- A member can have at most one pending request at a time.
CREATE UNIQUE INDEX IF NOT EXISTS profile_change_requests_one_pending_per_member
  ON public.profile_change_requests (member_id)
  WHERE status = 'pending';
