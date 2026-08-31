-- A third contact number.
--
-- organization_settings carried exactly two phone columns, which capped every
-- surface that lists them (the appointment letter's contact bar, the public
-- contact page, the admin settings form) at two numbers. The organisation now
-- publishes three, so add one more slot rather than overloading an existing
-- column with a comma-separated pair — the contact page builds a tel: link out
-- of each column, and those links only work on a single number.

ALTER TABLE organization_settings
  ADD COLUMN IF NOT EXISTS phone_tertiary TEXT;

-- 8383996578 is retired; the two new numbers take the second and third slots.
UPDATE organization_settings
SET
  phone_primary   = '9811615500',
  phone_secondary = '7669099111',
  phone_tertiary  = '7669230001',
  updated_at      = NOW()
WHERE id = 1;
