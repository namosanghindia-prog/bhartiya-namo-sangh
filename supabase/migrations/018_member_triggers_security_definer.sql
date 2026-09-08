-- Let the cascade that deletes a member actually run its triggers.
--
-- Deleting a member goes through GoTrue, which deletes auth.users as its own
-- role (supabase_auth_admin). The delete cascades to public.members, and the
-- AFTER triggers on members then fire *as that same role* — which has no
-- rights on public.branches, public.badges or public.user_badges. Postgres
-- refuses with "permission denied for table branches", GoTrue reports it as an
-- empty error, and the admin sees "Failed to delete member: {}".
--
-- These three are internal denormalization triggers: they keep a cached count
-- or award a badge, and they are supposed to run regardless of who touched the
-- row. SECURITY DEFINER makes them run as the function owner, which is how
-- this schema already handles the same problem in handle_new_user() and
-- is_admin(). search_path is pinned because a SECURITY DEFINER function that
-- resolves names through the caller's search_path is a privilege escalation
-- waiting to happen.
--
-- Bodies are unchanged from 001 apart from that.

CREATE OR REPLACE FUNCTION update_branch_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.branch_id IS NOT NULL THEN
      UPDATE branches SET member_count = (
        SELECT COUNT(*) FROM members WHERE branch_id = NEW.branch_id AND status = 'active'
      ) WHERE id = NEW.branch_id;
    END IF;
  END IF;
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    IF OLD.branch_id IS NOT NULL THEN
      UPDATE branches SET member_count = (
        SELECT COUNT(*) FROM members WHERE branch_id = OLD.branch_id AND status = 'active'
      ) WHERE id = OLD.branch_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fires on the UPDATE half of the cascade: clearing a deleted admin out of
-- members.membership_payment_confirmed_by is an update to every member they
-- confirmed, and each one runs this.
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  badge_record RECORD;
BEGIN
  FOR badge_record IN
    SELECT * FROM badges
    WHERE is_active = true AND criteria_type IS NOT NULL
  LOOP
    IF badge_record.criteria_type = 'volunteer_hours' AND NEW.volunteer_hours >= badge_record.criteria_value THEN
      INSERT INTO user_badges (member_id, badge_id, reason)
      VALUES (NEW.id, badge_record.id, 'Auto-awarded for reaching ' || badge_record.criteria_value || ' volunteer hours')
      ON CONFLICT (member_id, badge_id) DO NOTHING;
    END IF;

    IF badge_record.criteria_type = 'donations' AND NEW.total_donations >= badge_record.criteria_value THEN
      INSERT INTO user_badges (member_id, badge_id, reason)
      VALUES (NEW.id, badge_record.id, 'Auto-awarded for total donations of ₹' || badge_record.criteria_value)
      ON CONFLICT (member_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Reached the same way: donations.member_id is ON DELETE SET NULL, so deleting
-- a donor updates their donations. The guard means it touches no table in that
-- case, but leaving one of the three unhardened just hides the next instance
-- of this bug.
CREATE OR REPLACE FUNCTION update_member_donations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'verified' AND NEW.member_id IS NOT NULL THEN
    UPDATE members SET total_donations = (
      SELECT COALESCE(SUM(amount), 0) FROM donations
      WHERE member_id = NEW.member_id AND status = 'verified'
    ) WHERE id = NEW.member_id;
  END IF;
  RETURN NEW;
END;
$$;
