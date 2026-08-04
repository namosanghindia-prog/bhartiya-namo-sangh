// Placeholder "current member" data — replace with the authenticated
// user's session/profile from Supabase + NextAuth once connected.
export const CURRENT_MEMBER = {
  firstName: "Amresh",
  lastName: "Singh",
  email: "amresh@example.com",
  phone: "+91 98765 43210",
  branch: "Jaipur",
  joinedDate: "2023-03-10",
  volunteerHours: 150,
  totalDonations: 25000,
  totalEvents: 8,
};

export const MY_REGISTERED_EVENTS = [
  { id: "independence-day-drive", title: "Independence Day Celebration Drive", date: "2026-08-15", status: "registered" as const },
  { id: "community-cleanup", title: "Community Clean-Up Initiative", date: "2026-08-20", status: "registered" as const },
];

export const MY_PAST_EVENTS = [
  { id: "past-1", title: "Republic Day Parade Support", date: "2026-01-26", hoursLogged: 4 },
  { id: "past-2", title: "Winter Blanket Distribution Drive", date: "2025-12-18", hoursLogged: 3 },
  { id: "past-3", title: "Tree Plantation Weekend", date: "2025-11-02", hoursLogged: 5 },
];

export const MY_DONATIONS = [
  { date: "2026-08-01", amount: 1000, category: "Education", status: "Received" as const },
  { date: "2026-07-15", amount: 5000, category: "General", status: "Received" as const },
  { date: "2026-06-10", amount: 2500, category: "Environment", status: "Received" as const },
];

export const MY_ACTIVITY = [
  { date: "2026-08-15", title: "Registered for Independence Day Celebration Drive", type: "event" as const },
  { date: "2026-08-01", title: "Donated ₹1,000 to Education Fund", type: "donation" as const },
  { date: "2026-07-20", title: "Logged 4 volunteer hours", type: "hours" as const },
  { date: "2026-07-15", title: "Donated ₹5,000 to General Fund", type: "donation" as const },
  { date: "2026-06-10", title: "Unlocked badge: Silver Member (100+ hours)", type: "badge" as const },
];
