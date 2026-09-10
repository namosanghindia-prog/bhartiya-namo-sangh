-- Let members set their own designation.
--
-- Migration 007 routed first_name, last_name and designation through
-- profile_change_requests. Members kept filling in a designation next to their
-- address and photo and expected it to show up the same way; instead it sat in
-- the admin queue and never reached the website. Designation now saves
-- directly. Name changes still need admin approval — the name is what the ID
-- card vouches for.

CREATE OR REPLACE FUNCTION public.enforce_profile_change_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.first_name IS DISTINCT FROM OLD.first_name
  OR NEW.last_name  IS DISTINCT FROM OLD.last_name THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      RAISE EXCEPTION
        'Changes to your name require admin approval. Please submit a profile change request.'
        USING ERRCODE = 'P0001',
              HINT = 'Insert a row into profile_change_requests instead.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_profile_change_approval ON public.members;
CREATE TRIGGER trg_enforce_profile_change_approval
  BEFORE UPDATE OF first_name, last_name ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_change_approval();

-- Designations already waiting in the queue: apply them now, as if they had
-- been saved directly. Skipped when the member's designation has changed since
-- the request was filed (an admin edited it), so nothing newer is overwritten.
UPDATE public.members m
SET designation = NULLIF(btrim(r.requested_designation), '')
FROM public.profile_change_requests r
WHERE r.member_id = m.id
  AND r.status = 'pending'
  AND COALESCE(btrim(r.requested_designation), '') <> COALESCE(btrim(r.current_designation), '')
  AND COALESCE(btrim(m.designation), '') = COALESCE(btrim(r.current_designation), '');

-- Pending requests that asked for nothing but that designation are now done.
-- Requests that also change the name stay pending for an admin; approving
-- them later leaves the designation alone, since it is already in place.
UPDATE public.profile_change_requests r
SET status = 'approved',
    reviewed_at = now(),
    rejection_reason = NULL
FROM public.members m
WHERE m.id = r.member_id
  AND r.status = 'pending'
  AND COALESCE(btrim(r.requested_first_name), '') = COALESCE(btrim(r.current_first_name), '')
  AND COALESCE(btrim(r.requested_last_name), '') = COALESCE(btrim(r.current_last_name), '')
  AND COALESCE(btrim(m.designation), '') = COALESCE(btrim(r.requested_designation), '');
