-- Temporary moderator access, requested by a member and granted by an admin.
--
-- A member asks from their dashboard; an admin approves the request with an
-- expiry. Until then — or until an admin revokes it — the member can read every
-- row of public_event_registrations. Access is time-boxed on purpose: that table
-- holds visitors' mobile numbers, emails and home addresses, so nobody keeps it
-- by default after the job is done.
--
-- The grant lives only in this table; members.role is untouched, so none of the
-- policies keyed on role hand a moderator anything else.

CREATE TABLE IF NOT EXISTS public.moderator_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- NOT NULL + CASCADE, per 017: the request cannot outlive the member.
  member_id        UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  reason           TEXT NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),

  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected', 'revoked')),

  requested_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- "Who did this" columns: SET NULL, per 017.
  reviewed_by      UUID REFERENCES public.members(id) ON DELETE SET NULL,
  reviewed_at      TIMESTAMPTZ,
  rejection_reason TEXT CHECK (rejection_reason IS NULL OR char_length(rejection_reason) <= 500),

  expires_at       TIMESTAMPTZ,
  revoked_by       UUID REFERENCES public.members(id) ON DELETE SET NULL,
  revoked_at       TIMESTAMPTZ,

  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- An approval without an end date would not be temporary.
  CONSTRAINT moderator_requests_approved_has_expiry
    CHECK (status <> 'approved' OR expires_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_moderator_requests_member
  ON public.moderator_requests(member_id, status);

-- At most one open request per member.
CREATE UNIQUE INDEX IF NOT EXISTS moderator_requests_one_pending_per_member
  ON public.moderator_requests(member_id)
  WHERE status = 'pending';

DROP TRIGGER IF EXISTS moderator_requests_updated_at ON public.moderator_requests;
CREATE TRIGGER moderator_requests_updated_at
  BEFORE UPDATE ON public.moderator_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- is_moderator()
-- ============================================
-- True while the caller holds an approved, unexpired, unrevoked grant and is
-- still an active member — suspending someone ends their moderator access with
-- it. SECURITY DEFINER for the same reason as is_admin(): policies call it, and
-- it must read members and moderator_requests regardless of the caller's RLS.
CREATE OR REPLACE FUNCTION public.is_moderator()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM moderator_requests r
    JOIN members m ON m.id = r.member_id
    WHERE r.member_id = auth.uid()
      AND r.status = 'approved'
      AND r.expires_at > now()
      AND m.status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_moderator() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_moderator() TO authenticated;

-- ============================================
-- ROW LEVEL SECURITY — moderator_requests
-- ============================================
ALTER TABLE public.moderator_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view own moderator requests" ON public.moderator_requests;
CREATE POLICY "Members can view own moderator requests" ON public.moderator_requests
  FOR SELECT USING (member_id = auth.uid());

-- A member can only file a bare pending request for themself: every review
-- column must be empty, so a crafted insert cannot arrive pre-approved. Only
-- active members may ask, and not while they already hold access.
DROP POLICY IF EXISTS "Members can request moderator access" ON public.moderator_requests;
CREATE POLICY "Members can request moderator access" ON public.moderator_requests
  FOR INSERT WITH CHECK (
    member_id = auth.uid()
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND rejection_reason IS NULL
    AND expires_at IS NULL
    AND revoked_by IS NULL
    AND revoked_at IS NULL
    AND EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND status = 'active')
    AND NOT public.is_moderator()
  );

-- Withdrawing a request that nobody has reviewed yet. There is deliberately no
-- member UPDATE policy: only an admin moves a request out of pending.
DROP POLICY IF EXISTS "Members can withdraw pending moderator requests" ON public.moderator_requests;
CREATE POLICY "Members can withdraw pending moderator requests" ON public.moderator_requests
  FOR DELETE USING (member_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Admins can manage moderator requests" ON public.moderator_requests;
CREATE POLICY "Admins can manage moderator requests" ON public.moderator_requests
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

REVOKE ALL ON public.moderator_requests FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.moderator_requests TO authenticated;

-- ============================================
-- ROW LEVEL SECURITY — public_event_registrations
-- ============================================
-- Read-only: moderators see every entry but cannot change or delete any. The
-- admin FOR ALL policy from 022 is unchanged.
DROP POLICY IF EXISTS "Moderators can view public event registrations" ON public.public_event_registrations;
CREATE POLICY "Moderators can view public event registrations" ON public.public_event_registrations
  FOR SELECT USING (public.is_moderator());
