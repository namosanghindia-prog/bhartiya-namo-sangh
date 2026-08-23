-- Rebuild the public membership verification view.
--
-- The live view had drifted from migration 004 (it exposed first_name /
-- last_name / avatar_url instead of name / photo), which crashed
-- /verify/[id]. This version exposes both shapes plus designation and the
-- branch state (needed for the BNMS/{STATE}/MEM/{0000} membership ID), and
-- uses a LEFT JOIN so members without a branch can still be verified.

DROP VIEW IF EXISTS public.public_membership_verification;

CREATE VIEW public.public_membership_verification AS
SELECT
  m.id,
  m.first_name,
  m.last_name,
  (m.first_name || ' ' || m.last_name) AS name,
  m.avatar_url,
  m.avatar_url AS photo,
  m.designation,
  m.membership_number,
  m.membership_type,
  m.membership_issued_at,
  m.membership_expires_at,
  m.status,
  b.name  AS branch_name,
  b.state AS branch_state
FROM public.members m
LEFT JOIN public.branches b ON b.id = m.branch_id
WHERE m.status = 'active'
  AND m.membership_number IS NOT NULL;

GRANT SELECT ON public.public_membership_verification TO anon;
GRANT SELECT ON public.public_membership_verification TO authenticated;
