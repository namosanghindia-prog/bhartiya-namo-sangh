-- Published contact details: two numbers, and the .com domain.
--
-- Self-sufficient on purpose. Migration 010 introduced phone_tertiary, but a
-- live database was found still holding the retired 8383996578 in
-- phone_secondary, which means 010 had not been applied there and the column
-- may not exist. Adding it here first means this file can be run on its own,
-- and is a no-op on databases where 010 did land.
--
-- The organisation publishes two numbers, so the third slot is cleared rather
-- than dropped; every surface that reads it (the appointment letter's contact
-- bar, the public contact page, the admin settings form) already guards
-- against a NULL there.
--
-- The website also moves to .com, superseding the .org address seeded in 006.

ALTER TABLE organization_settings
  ADD COLUMN IF NOT EXISTS phone_tertiary TEXT;

UPDATE organization_settings
SET
  phone_primary   = '9811615500',
  phone_secondary = '7669099111',
  phone_tertiary  = NULL,
  website_url     = 'https://www.bhartiyanamosangh.com',
  updated_at      = NOW()
WHERE id = 1;
