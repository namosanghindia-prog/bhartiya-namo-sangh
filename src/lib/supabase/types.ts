// Enums
export type MemberRole = "member" | "branch_admin" | "admin" | "super_admin";
export type MemberStatus = "active" | "inactive" | "suspended" | "pending";
export type Gender = "male" | "female" | "other";
export type EventCategory = "Social" | "Charity" | "Environmental" | "Education" | "Political" | "Cultural" | "Sports" | "Health";
export type RegistrationStatus = "registered" | "confirmed" | "attended" | "cancelled" | "no_show";
export type UpdateType = "info" | "important" | "urgent" | "cancellation" | "reschedule";
export type DonationCategory = "General" | "Education" | "Environment" | "Disaster Relief" | "Healthcare" | "Infrastructure" | "Events";
export type DonationStatus = "pending" | "processing" | "verified" | "failed" | "refunded";
export type PaymentMethod = "razorpay" | "upi" | "bank_transfer" | "cash" | "cheque";
export type RecurringFrequency = "monthly" | "quarterly" | "yearly";
export type BadgeCategory = "achievement" | "milestone" | "special" | "role" | "event";
export type BadgeCriteriaType = "volunteer_hours" | "donations" | "events_attended" | "events_organized" | "referrals" | "tenure" | "manual";
export type MessageType = "direct" | "broadcast" | "announcement" | "system";
export type MessagePriority = "low" | "normal" | "high" | "urgent";
export type ActivityType = "event" | "donation" | "hours" | "badge" | "profile" | "login" | "message" | "registration";
export type ContactCategory = "general" | "membership" | "donation" | "volunteer" | "feedback" | "complaint" | "other";
export type ContactStatus = "new" | "in_progress" | "resolved" | "closed";

// 1. Branch
export interface Branch {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  manager_name: string | null;
  member_count: number;
  established_year: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 2. Member
export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  branch_id: string | null;
  role: MemberRole;
  status: MemberStatus;
  volunteer_hours: number;
  total_donations: number;
  joined_date: string;
  last_login_at: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  branch?: Branch;
  badges?: UserBadge[];
}

// 3. Event
export interface Event {
  id: string;
  slug: string;
  title: string;
  category: EventCategory;
  description: string | null;
  short_description: string | null;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  address: string | null;
  city: string | null;
  state: string | null;
  map_url: string | null;
  branch_id: string | null;
  organizer_id: string | null;
  target_participants: number;
  max_participants: number | null;
  registration_deadline: string | null;
  entry_fee: number;
  agenda: { time: string; activity: string }[];
  requirements: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  is_cancelled: boolean;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined/computed fields
  branch?: Branch;
  organizer?: Member;
  registered_count?: number;
  gallery?: EventGallery[];
  updates?: EventUpdate[];
}

// 4. Event Registration
export interface EventRegistration {
  id: string;
  event_id: string;
  member_id: string;
  status: RegistrationStatus;
  hours_logged: number;
  check_in_at: string | null;
  check_out_at: string | null;
  feedback: string | null;
  rating: number | null;
  registered_at: string;
  updated_at: string;
  // Joined fields
  event?: Event;
  member?: Member;
}

// 5. Event Gallery
export interface EventGallery {
  id: string;
  event_id: string;
  uploaded_by: string | null;
  image_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  is_cover: boolean;
  display_order: number;
  created_at: string;
  // Joined fields
  uploader?: Member;
}

// 6. Event Update
export interface EventUpdate {
  id: string;
  event_id: string;
  posted_by: string | null;
  title: string;
  content: string;
  update_type: UpdateType;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  poster?: Member;
}

// 7. Donation
export interface Donation {
  id: string;
  member_id: string | null;
  donor_name: string;
  donor_email: string | null;
  donor_phone: string | null;
  donor_pan: string | null;
  amount: number;
  currency: string;
  category: DonationCategory;
  campaign_name: string | null;
  status: DonationStatus;
  payment_method: PaymentMethod | null;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  razorpay_signature: string | null;
  transaction_id: string | null;
  receipt_number: string | null;
  receipt_url: string | null;
  is_anonymous: boolean;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  tax_receipt_sent: boolean;
  notes: string | null;
  donated_at: string;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  // Joined fields
  member?: Member;
  verifier?: Member;
}

// 8. Badge
export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  color: string;
  category: BadgeCategory;
  criteria_type: BadgeCriteriaType | null;
  criteria_value: number | null;
  points: number;
  is_active: boolean;
  created_at: string;
}

// 9. User Badge
export interface UserBadge {
  id: string;
  member_id: string;
  badge_id: string;
  awarded_at: string;
  awarded_by: string | null;
  reason: string | null;
  is_featured: boolean;
  // Joined fields
  badge?: Badge;
  member?: Member;
  awarder?: Member;
}

// 10. Message
export interface Message {
  id: string;
  sender_id: string | null;
  recipient_id: string | null;
  branch_id: string | null;
  subject: string | null;
  content: string;
  message_type: MessageType;
  priority: MessagePriority;
  is_read: boolean;
  read_at: string | null;
  is_archived: boolean;
  parent_id: string | null;
  created_at: string;
  // Joined fields
  sender?: Member;
  recipient?: Member;
  branch?: Branch;
  replies?: Message[];
}

// 11. Activity Log
export interface ActivityLog {
  id: string;
  member_id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// 12. Contact Submission
export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  category: ContactCategory;
  status: ContactStatus;
  assigned_to: string | null;
  response: string | null;
  responded_at: string | null;
  created_at: string;
  // Joined fields
  assignee?: Member;
}
