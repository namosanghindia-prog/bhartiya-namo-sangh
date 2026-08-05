-- Businesses and Promotions Schema
-- Run this in Supabase SQL Editor if the tables don't exist yet

-- ============================================
-- BUSINESSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Retail', 'Services', 'Food & Beverage', 'Healthcare', 'Education', 'Technology', 'Manufacturing', 'Real Estate', 'Finance', 'Other')),
  description TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'active', 'expired', 'rejected')),
  registration_fee_paid BOOLEAN DEFAULT false,
  payment_submitted_at TIMESTAMPTZ,
  payment_confirmed_at TIMESTAMPTZ,
  payment_confirmed_by UUID REFERENCES members(id),
  expires_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id)
);

-- ============================================
-- BUSINESS PROMOTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS business_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  website_link TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved_awaiting_payment', 'payment_submitted', 'payment_confirmed', 'live', 'rejected', 'expired')),
  admin_approved_at TIMESTAMPTZ,
  payment_deadline TIMESTAMPTZ,
  payment_submitted_at TIMESTAMPTZ,
  payment_confirmed_at TIMESTAMPTZ,
  payment_confirmed_by UUID REFERENCES members(id),
  ad_review_deadline TIMESTAMPTZ,
  ad_approved_at TIMESTAMPTZ,
  ad_approved_by UUID REFERENCES members(id),
  live_from TIMESTAMPTZ,
  live_until TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_businesses_member ON businesses(member_id);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_promotions_business ON business_promotions(business_id);
CREATE INDEX IF NOT EXISTS idx_promotions_member ON business_promotions(member_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON business_promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_live ON business_promotions(status, live_until) WHERE status = 'live';

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_promotions ENABLE ROW LEVEL SECURITY;

-- Businesses: public read active, members manage own, admins manage all
CREATE POLICY "Active businesses are viewable by everyone" ON businesses
  FOR SELECT USING (status = 'active');

CREATE POLICY "Members can view own business" ON businesses
  FOR SELECT USING (member_id = auth.uid());

CREATE POLICY "Members can insert own business" ON businesses
  FOR INSERT WITH CHECK (member_id = auth.uid());

CREATE POLICY "Members can update own business" ON businesses
  FOR UPDATE USING (member_id = auth.uid());

CREATE POLICY "Admins can manage all businesses" ON businesses
  FOR ALL USING (is_admin());

-- Promotions: members manage own, admins manage all
CREATE POLICY "Members can view own promotions" ON business_promotions
  FOR SELECT USING (member_id = auth.uid());

CREATE POLICY "Members can insert own promotions" ON business_promotions
  FOR INSERT WITH CHECK (member_id = auth.uid());

CREATE POLICY "Members can update own promotions" ON business_promotions
  FOR UPDATE USING (member_id = auth.uid());

CREATE POLICY "Admins can manage all promotions" ON business_promotions
  FOR ALL USING (is_admin());

-- Public can read live promotions (for homepage slider)
CREATE POLICY "Live promotions are viewable by everyone" ON business_promotions
  FOR SELECT USING (status = 'live' AND live_until > NOW());

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER promotions_updated_at
  BEFORE UPDATE ON business_promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
