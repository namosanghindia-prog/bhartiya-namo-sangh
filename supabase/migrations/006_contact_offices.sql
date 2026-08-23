-- Contact details: multiple offices, founder info, website
-- Replaces the single address_line/city/state/pincode address with a list of
-- labelled offices. The old columns are kept for backwards compatibility but
-- are no longer used by the app.

ALTER TABLE organization_settings
  ADD COLUMN IF NOT EXISTS offices JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS founder_name TEXT,
  ADD COLUMN IF NOT EXISTS founder_title TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT;

UPDATE organization_settings
SET
  org_name      = 'Bhartiya Namo Sangh',
  primary_email = 'bhartiyanamosangh@gmail.com',
  phone_primary = '9811615500',
  founder_name  = 'Dr. Manoj Kumar Tomar "Mannu"',
  founder_title = 'National President & Founder',
  website_url   = 'https://www.bhartiyanamosangh.org',
  offices = '[
    {"label": "Campus Office",   "address": "Building No. 5, Second Floor, Scindia House, Connaught Place, New Delhi - 110001"},
    {"label": "Head Office",     "address": "2nd Floor, A-222, Dwarka Sector 8, New Delhi - 110077"},
    {"label": "UP State Office", "address": "66-A, Panki Road, Kalyanpur, Kanpur Nagar, UP - 208017"}
  ]'::jsonb,
  updated_at = NOW()
WHERE id = 1;
