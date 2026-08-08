-- Function to get next value from donation_receipt_seq
-- The sequence donation_receipt_seq already exists in the database
CREATE OR REPLACE FUNCTION nextval_donation_receipt_seq()
RETURNS INTEGER AS $$
BEGIN
  RETURN nextval('donation_receipt_seq')::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
