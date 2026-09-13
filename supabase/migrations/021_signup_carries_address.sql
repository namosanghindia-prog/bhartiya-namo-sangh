-- Make sure the signup trigger still copies the address into the member row.
--
-- Members fill in a full address, district and state on the signup form. The
-- form sends them as auth metadata and handle_new_user() is what turns that
-- into columns on public.members, so if the live function is an older revision
-- than 004 those three fields are silently dropped and the address never shows
-- up anywhere on the site.
--
-- Migrations here are applied by hand, and 002 defines a version of this
-- function that inserts only name/email/phone/branch — re-running that file
-- after 004 is all it takes to lose the address. This re-applies the full
-- version, and adds the search_path pinning that 018 gave the other
-- SECURITY DEFINER triggers.
--
-- The application no longer depends on this: /api/signup/complete writes the
-- address and the profile photo with the service role right after signup.
-- Both paths only ever fill columns that are empty, so they cannot fight.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO members (
    id, first_name, last_name, email, phone, branch_id,
    father_name, address, city, state, declaration_accepted,
    membership_type, membership_fee_amount, membership_payment_status, status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Member'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'branch_id')::UUID,
    NEW.raw_user_meta_data->>'father_name',
    NEW.raw_user_meta_data->>'address',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'state',
    COALESCE((NEW.raw_user_meta_data->>'declaration_accepted')::BOOLEAN, false),
    NEW.raw_user_meta_data->>'membership_type',
    (NEW.raw_user_meta_data->>'membership_fee_amount')::INTEGER,
    'pending',
    'pending'
  );
  RETURN NEW;
END;
$$;

-- Backfill everyone who signed up while the address was being dropped. Their
-- answers are still on the auth user, where the form put them; only rows whose
-- column is empty are touched, so nothing anyone has edited is overwritten.
UPDATE public.members m
SET father_name = COALESCE(NULLIF(btrim(m.father_name), ''),
                           NULLIF(btrim(u.raw_user_meta_data->>'father_name'), '')),
    address     = COALESCE(NULLIF(btrim(m.address), ''),
                           NULLIF(btrim(u.raw_user_meta_data->>'address'), '')),
    city        = COALESCE(NULLIF(btrim(m.city), ''),
                           NULLIF(btrim(u.raw_user_meta_data->>'city'), '')),
    state       = COALESCE(NULLIF(btrim(m.state), ''),
                           NULLIF(btrim(u.raw_user_meta_data->>'state'), ''))
FROM auth.users u
WHERE u.id = m.id
  AND (
    (COALESCE(btrim(m.address), '') = '' AND COALESCE(btrim(u.raw_user_meta_data->>'address'), '') <> '')
    OR (COALESCE(btrim(m.city), '') = '' AND COALESCE(btrim(u.raw_user_meta_data->>'city'), '') <> '')
    OR (COALESCE(btrim(m.state), '') = '' AND COALESCE(btrim(u.raw_user_meta_data->>'state'), '') <> '')
    OR (COALESCE(btrim(m.father_name), '') = '' AND COALESCE(btrim(u.raw_user_meta_data->>'father_name'), '') <> '')
  );
