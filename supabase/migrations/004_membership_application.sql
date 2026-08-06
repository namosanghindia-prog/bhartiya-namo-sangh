-- Membership Application & ID Card Schema
-- Adds father_name, declaration_accepted, membership fields to members

-- Add new columns to members table
ALTER TABLE members
ADD COLUMN father_name TEXT,
ADD COLUMN declaration_accepted BOOLEAN DEFAULT false,
ADD COLUMN membership_type TEXT CHECK (membership_type IN ('normal', 'premium', 'lifetime')),
ADD COLUMN membership_fee_amount INTEGER,
ADD COLUMN membership_payment_status TEXT DEFAULT 'pending' CHECK (membership_payment_status IN ('pending', 'submitted', 'confirmed')),
ADD COLUMN membership_payment_submitted_at TIMESTAMPTZ,
ADD COLUMN membership_payment_confirmed_at TIMESTAMPTZ,
ADD COLUMN membership_payment_confirmed_by UUID REFERENCES members(id),
ADD COLUMN membership_number INTEGER,
ADD COLUMN membership_issued_at TIMESTAMPTZ,
ADD COLUMN membership_expires_at TIMESTAMPTZ;

-- Update status constraint to include new value
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_status_check;
ALTER TABLE members ADD CONSTRAINT members_status_check
  CHECK (status IN ('active', 'inactive', 'suspended', 'pending', 'approved_awaiting_payment'));

-- Create sequence for membership numbers (starts at 1)
CREATE SEQUENCE IF NOT EXISTS membership_number_seq START 1;

-- Create index on membership_number for faster lookups
CREATE INDEX idx_members_membership_number ON members(membership_number);

-- Create public view for membership verification (exposes only safe fields)
CREATE OR REPLACE VIEW public_membership_verification AS
SELECT
  m.id,
  m.first_name || ' ' || m.last_name AS name,
  m.avatar_url AS photo,
  m.membership_type,
  m.membership_number,
  b.name AS branch_name,
  m.status,
  m.membership_issued_at,
  m.membership_expires_at
FROM members m
LEFT JOIN branches b ON m.branch_id = b.id
WHERE m.status = 'active'
  AND m.membership_number IS NOT NULL;

-- Grant select on the public view to anon and authenticated roles
GRANT SELECT ON public_membership_verification TO anon;
GRANT SELECT ON public_membership_verification TO authenticated;

-- Update handle_new_user to include new fields from signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve member (eligibility approval only, sets status to awaiting payment)
CREATE OR REPLACE FUNCTION approve_member_eligibility(member_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE members
  SET status = 'approved_awaiting_payment'
  WHERE id = member_id AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to confirm payment and fully activate member
CREATE OR REPLACE FUNCTION confirm_membership_payment(member_id UUID, admin_id UUID)
RETURNS VOID AS $$
DECLARE
  mem_type TEXT;
BEGIN
  SELECT membership_type INTO mem_type FROM members WHERE id = member_id;

  UPDATE members
  SET
    status = 'active',
    membership_payment_status = 'confirmed',
    membership_payment_confirmed_at = NOW(),
    membership_payment_confirmed_by = admin_id,
    membership_number = nextval('membership_number_seq'),
    membership_issued_at = NOW(),
    membership_expires_at = CASE
      WHEN mem_type = 'lifetime' THEN NULL
      ELSE NOW() + INTERVAL '1 year'
    END
  WHERE id = member_id
    AND status = 'approved_awaiting_payment'
    AND membership_payment_status = 'submitted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
