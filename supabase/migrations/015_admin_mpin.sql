-- Admin MPIN: a 6-digit PIN that stands in for the old password when an admin
-- changes their password from the admin panel.
--
-- The MPIN is the only thing guarding that change, so its hash must never be
-- readable by a browser. This table is therefore reachable by the service role
-- alone: RLS is enabled with zero policies (which denies anon and authenticated
-- outright) and the table grants are revoked on top of that, so even a future
-- policy added by mistake still has no privilege to work with. Every read and
-- write goes through /api/admin/mpin and /api/admin/change-password, which
-- authenticate the caller with their own session first.
--
-- Hashes are scrypt, produced by src/lib/mpin.ts, and stored in a self
-- describing format so the parameters can be raised later without a migration.
--
-- Forgot the MPIN? There is deliberately no in-app recovery — an MPIN anyone
-- could reset from a signed-in session would verify nothing. Clear it from the
-- database instead, and the admin sets a fresh one on their next visit:
--
--   DELETE FROM admin_security WHERE member_id = '<the admin uuid>';
--
-- The account itself is never stranded: /auth/forgot still resets a password
-- by email without touching the MPIN.

CREATE TABLE IF NOT EXISTS admin_security (
  member_id            UUID PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  mpin_hash            TEXT NOT NULL,
  mpin_set_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- A 6-digit PIN is only a million guesses, so failures are counted and the
  -- MPIN locks out for a spell once there are too many of them.
  failed_attempts      INTEGER NOT NULL DEFAULT 0,
  locked_until         TIMESTAMPTZ,
  password_changed_at  TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS admin_security_updated_at ON admin_security;
CREATE TRIGGER admin_security_updated_at
  BEFORE UPDATE ON admin_security
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE admin_security ENABLE ROW LEVEL SECURITY;

-- No policies are created on purpose: with RLS on, a table with no policy
-- denies every row to anon and authenticated.
REVOKE ALL ON TABLE admin_security FROM PUBLIC;
REVOKE ALL ON TABLE admin_security FROM anon;
REVOKE ALL ON TABLE admin_security FROM authenticated;
GRANT ALL ON TABLE admin_security TO service_role;

NOTIFY pgrst, 'reload schema';
