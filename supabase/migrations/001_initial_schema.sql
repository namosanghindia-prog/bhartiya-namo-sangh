-- Bhartiya Namo Sangh Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/prkfshuqdhjaxkuzjrwn/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. BRANCHES
-- ============================================
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  manager_name TEXT,
  member_count INTEGER DEFAULT 0,
  established_year INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. MEMBERS (extends Supabase Auth users)
-- ============================================
CREATE TABLE members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  branch_id UUID REFERENCES branches(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'branch_admin', 'admin', 'super_admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
  volunteer_hours INTEGER DEFAULT 0,
  total_donations INTEGER DEFAULT 0,
  joined_date DATE DEFAULT CURRENT_DATE,
  last_login_at TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. EVENTS
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Social', 'Charity', 'Environmental', 'Education', 'Political', 'Cultural', 'Sports', 'Health')),
  description TEXT,
  short_description TEXT,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  map_url TEXT,
  branch_id UUID REFERENCES branches(id),
  organizer_id UUID REFERENCES members(id),
  target_participants INTEGER DEFAULT 100,
  max_participants INTEGER,
  registration_deadline DATE,
  entry_fee INTEGER DEFAULT 0,
  agenda JSONB DEFAULT '[]',
  requirements TEXT,
  cover_image_url TEXT,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_cancelled BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. EVENT REGISTRATIONS
-- ============================================
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'attended', 'cancelled', 'no_show')),
  hours_logged INTEGER DEFAULT 0,
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, member_id)
);

-- ============================================
-- 5. EVENT GALLERY
-- ============================================
CREATE TABLE event_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES members(id),
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  is_cover BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. EVENT UPDATES (announcements/notifications for an event)
-- ============================================
CREATE TABLE event_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  posted_by UUID REFERENCES members(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  update_type TEXT DEFAULT 'info' CHECK (update_type IN ('info', 'important', 'urgent', 'cancellation', 'reschedule')),
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. DONATIONS
-- ============================================
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  donor_name TEXT NOT NULL,
  donor_email TEXT,
  donor_phone TEXT,
  donor_pan TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  category TEXT DEFAULT 'General' CHECK (category IN ('General', 'Education', 'Environment', 'Disaster Relief', 'Healthcare', 'Infrastructure', 'Events')),
  campaign_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'verified', 'failed', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('razorpay', 'upi', 'bank_transfer', 'cash', 'cheque')),
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  razorpay_signature TEXT,
  transaction_id TEXT,
  receipt_number TEXT,
  receipt_url TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('monthly', 'quarterly', 'yearly')),
  tax_receipt_sent BOOLEAN DEFAULT false,
  notes TEXT,
  donated_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. BADGES
-- ============================================
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  color TEXT DEFAULT '#f97316',
  category TEXT DEFAULT 'achievement' CHECK (category IN ('achievement', 'milestone', 'special', 'role', 'event')),
  criteria_type TEXT CHECK (criteria_type IN ('volunteer_hours', 'donations', 'events_attended', 'events_organized', 'referrals', 'tenure', 'manual')),
  criteria_value INTEGER,
  points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. USER BADGES (many-to-many: members <-> badges)
-- ============================================
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  awarded_by UUID REFERENCES members(id),
  reason TEXT,
  is_featured BOOLEAN DEFAULT false,
  UNIQUE(member_id, badge_id)
);

-- ============================================
-- 10. MESSAGES (internal messaging system)
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES members(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES members(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  subject TEXT,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'direct' CHECK (message_type IN ('direct', 'broadcast', 'announcement', 'system')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. ACTIVITY LOG (for member dashboard)
-- ============================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('event', 'donation', 'hours', 'badge', 'profile', 'login', 'message', 'registration')),
  title TEXT NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. CONTACT SUBMISSIONS (public contact form)
-- ============================================
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'membership', 'donation', 'volunteer', 'feedback', 'complaint', 'other')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES members(id),
  response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_members_branch ON members(branch_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_role ON members(role);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_branch ON events(branch_id);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_published ON events(is_published);
CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_member ON event_registrations(member_id);
CREATE INDEX idx_donations_member ON donations(member_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_date ON donations(donated_at);
CREATE INDEX idx_user_badges_member ON user_badges(member_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_unread ON messages(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX idx_activity_log_member ON activity_log(member_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Branches: public read, admin write
CREATE POLICY "Branches are viewable by everyone" ON branches FOR SELECT USING (true);
CREATE POLICY "Admins can manage branches" ON branches FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.id = auth.uid() AND members.role IN ('admin', 'super_admin'))
);

-- Members: users can read/update own profile, admins can manage all
CREATE POLICY "Users can view own profile" ON members FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all members" ON members FOR SELECT USING (
  EXISTS (SELECT 1 FROM members WHERE members.id = auth.uid() AND members.role IN ('admin', 'branch_admin', 'super_admin'))
);
CREATE POLICY "Users can update own profile" ON members FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage members" ON members FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.id = auth.uid() AND members.role IN ('admin', 'super_admin'))
);

-- Events: public read published, admin/branch_admin write
CREATE POLICY "Published events are viewable by everyone" ON events FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can view all events" ON events FOR SELECT USING (
  EXISTS (SELECT 1 FROM members WHERE members.id = auth.uid() AND members.role IN ('admin', 'branch_admin', 'super_admin'))
);
CREATE POLICY "Admins can manage events" ON events FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.id = auth.uid() AND members.role IN ('admin', 'branch_admin', 'super_admin'))
);

-- Event registrations: users manage own, admins see all
CREATE POLICY "Users can view own registrations" ON event_registrations FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Users can register for events" ON event_registrations FOR INSERT WITH CHECK (member_id = auth.uid());
CREATE POLICY "Users can update own registrations" ON event_registrations FOR UPDATE USING (member_id = auth.uid());
CREATE POLICY "Admins can manage registrations" ON event_registrations FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.id = auth.uid() AND members.role IN ('admin', 'branch_admin', 'super_admin'))
);

-- Event gallery: public read, admins write
CREATE POLICY "Event gallery is viewable by everyone" ON event_gallery FOR SELECT USING (true);
CREATE POLICY "Admins can manage gallery" ON event_gallery FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.id = auth.uid() AND members.role IN ('admin', 'branch_admin', 'super_admin'))
);

-- Event updates: public read, admins write
CREATE POLICY "Event updates are viewable by everyone" ON event_updates FOR SELECT USING (true);
CREATE POLICY "Admins can manage updates" ON event_updates FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.id = auth.uid() AND members.role IN ('admin', 'branch_admin', 'super_admin'))
);

-- Donations: users see own, admins see all
CREATE POLICY "Users can view own donations" ON donations FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Anyone can create donations" ON donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage donations" ON donations FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.id = auth.uid() AND members.role IN ('admin', 'super_admin'))
);

-- Badges: public read, admin write
CREATE POLICY "Badges are viewable by everyone" ON badges FOR SELECT USING (true);
CREATE POLICY "Admins can manage badges" ON badges FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.id = auth.uid() AND members.role IN ('admin', 'super_admin'))
);

-- User badges: users see own, public sees featured, admins manage
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Featured badges are public" ON user_badges FOR SELECT USING (is_featured = true);
CREATE POLICY "Admins can manage user badges" ON user_badges FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.id = auth.uid() AND members.role IN ('admin', 'super_admin'))
);

-- Messages: users see own messages
CREATE POLICY "Users can view received messages" ON messages FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "Users can view sent messages" ON messages FOR SELECT USING (sender_id = auth.uid());
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update own received messages" ON messages FOR UPDATE USING (recipient_id = auth.uid());
CREATE POLICY "Admins can manage messages" ON messages FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.id = auth.uid() AND members.role IN ('admin', 'super_admin'))
);

-- Activity log: users see own
CREATE POLICY "Users can view own activity" ON activity_log FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "System can insert activity" ON activity_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all activity" ON activity_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM members WHERE members.id = auth.uid() AND members.role IN ('admin', 'super_admin'))
);

-- Contact submissions: public insert, admins manage
CREATE POLICY "Anyone can submit contact form" ON contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage contact submissions" ON contact_submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.id = auth.uid() AND members.role IN ('admin', 'branch_admin', 'super_admin'))
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER event_registrations_updated_at BEFORE UPDATE ON event_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER event_updates_updated_at BEFORE UPDATE ON event_updates FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create member profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO members (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Member'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update branch member count automatically
CREATE OR REPLACE FUNCTION update_branch_member_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER member_branch_count
  AFTER INSERT OR UPDATE OR DELETE ON members
  FOR EACH ROW EXECUTE FUNCTION update_branch_member_count();

-- Update member total_donations when donation is verified
CREATE OR REPLACE FUNCTION update_member_donations()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'verified' AND NEW.member_id IS NOT NULL THEN
    UPDATE members SET total_donations = (
      SELECT COALESCE(SUM(amount), 0) FROM donations
      WHERE member_id = NEW.member_id AND status = 'verified'
    ) WHERE id = NEW.member_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER donation_update_member_total
  AFTER INSERT OR UPDATE ON donations
  FOR EACH ROW EXECUTE FUNCTION update_member_donations();

-- Auto-award badges based on criteria
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
  badge_record RECORD;
BEGIN
  FOR badge_record IN
    SELECT * FROM badges
    WHERE is_active = true AND criteria_type IS NOT NULL
  LOOP
    -- Check volunteer hours badges
    IF badge_record.criteria_type = 'volunteer_hours' AND NEW.volunteer_hours >= badge_record.criteria_value THEN
      INSERT INTO user_badges (member_id, badge_id, reason)
      VALUES (NEW.id, badge_record.id, 'Auto-awarded for reaching ' || badge_record.criteria_value || ' volunteer hours')
      ON CONFLICT (member_id, badge_id) DO NOTHING;
    END IF;

    -- Check donation badges
    IF badge_record.criteria_type = 'donations' AND NEW.total_donations >= badge_record.criteria_value THEN
      INSERT INTO user_badges (member_id, badge_id, reason)
      VALUES (NEW.id, badge_record.id, 'Auto-awarded for total donations of ₹' || badge_record.criteria_value)
      ON CONFLICT (member_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_badges_on_member_update
  AFTER UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION check_and_award_badges();

-- ============================================
-- SEED DATA
-- ============================================

-- Branches
INSERT INTO branches (slug, name, city, state, manager_name, member_count, established_year) VALUES
  ('delhi-hq', 'Delhi HQ', 'New Delhi', 'Delhi', 'Rajesh Kumar', 850, 2022),
  ('mumbai', 'Mumbai', 'Mumbai', 'Maharashtra', 'Priya Singh', 620, 2022),
  ('bangalore', 'Bangalore', 'Bengaluru', 'Karnataka', 'Arjun Reddy', 540, 2023),
  ('jaipur', 'Jaipur', 'Jaipur', 'Rajasthan', 'Meena Iyer', 410, 2023),
  ('lucknow', 'Lucknow', 'Lucknow', 'Uttar Pradesh', 'Vikram Yadav', 480, 2023),
  ('ahmedabad', 'Ahmedabad', 'Ahmedabad', 'Gujarat', 'Neha Patel', 390, 2023),
  ('kolkata', 'Kolkata', 'Kolkata', 'West Bengal', 'Suman Das', 355, 2024),
  ('chennai', 'Chennai', 'Chennai', 'Tamil Nadu', 'Karthik Subramaniam', 410, 2024),
  ('bhopal', 'Bhopal', 'Bhopal', 'Madhya Pradesh', 'Anil Sharma', 275, 2024);

-- Default Badges
INSERT INTO badges (slug, name, description, category, criteria_type, criteria_value, points, color) VALUES
  ('new-member', 'New Member', 'Welcome to Bhartiya Namo Sangh!', 'milestone', NULL, NULL, 10, '#3b82f6'),
  ('bronze-volunteer', 'Bronze Volunteer', 'Completed 50+ volunteer hours', 'achievement', 'volunteer_hours', 50, 50, '#cd7f32'),
  ('silver-volunteer', 'Silver Volunteer', 'Completed 100+ volunteer hours', 'achievement', 'volunteer_hours', 100, 100, '#c0c0c0'),
  ('gold-volunteer', 'Gold Volunteer', 'Completed 250+ volunteer hours', 'achievement', 'volunteer_hours', 250, 250, '#ffd700'),
  ('platinum-volunteer', 'Platinum Volunteer', 'Completed 500+ volunteer hours', 'achievement', 'volunteer_hours', 500, 500, '#e5e4e2'),
  ('first-donation', 'First Donation', 'Made your first donation', 'milestone', 'donations', 1, 25, '#10b981'),
  ('generous-donor', 'Generous Donor', 'Donated ₹10,000 or more', 'achievement', 'donations', 10000, 100, '#f59e0b'),
  ('champion-donor', 'Champion Donor', 'Donated ₹50,000 or more', 'achievement', 'donations', 50000, 300, '#ef4444'),
  ('event-enthusiast', 'Event Enthusiast', 'Attended 10+ events', 'achievement', 'events_attended', 10, 75, '#8b5cf6'),
  ('community-leader', 'Community Leader', 'Organized 5+ events', 'achievement', 'events_organized', 5, 150, '#ec4899'),
  ('founding-member', 'Founding Member', 'Joined in the founding year (2022)', 'special', 'tenure', 2022, 200, '#1e3a8a'),
  ('anniversary-1', 'One Year Strong', 'Member for 1+ year', 'milestone', NULL, NULL, 50, '#059669');

-- Sample Events (using branch IDs from above - will need actual UUIDs)
-- Note: In production, you'd reference actual branch UUIDs
