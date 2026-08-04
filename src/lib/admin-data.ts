import { BRANCHES } from "./branches-data";
import { EVENTS } from "./events-data";

export type AdminMember = {
  id: string;
  name: string;
  email: string;
  branch: string;
  joinedDate: string;
  status: "active" | "inactive";
  hours: number;
  donations: number;
};

// Placeholder data — replace with a Supabase/Prisma query once connected
export const ADMIN_MEMBERS: AdminMember[] = [
  { id: "m1", name: "Rajesh Kumar", email: "rajesh@example.com", branch: "Delhi HQ", joinedDate: "2022-03-15", status: "active", hours: 320, donations: 45000 },
  { id: "m2", name: "Priya Singh", email: "priya@example.com", branch: "Mumbai", joinedDate: "2022-05-02", status: "active", hours: 280, donations: 38000 },
  { id: "m3", name: "Amresh Singh", email: "amresh@example.com", branch: "Jaipur", joinedDate: "2023-03-10", status: "active", hours: 150, donations: 25000 },
  { id: "m4", name: "Anil Sharma", email: "anil@example.com", branch: "Bhopal", joinedDate: "2024-01-20", status: "active", hours: 95, donations: 12000 },
  { id: "m5", name: "Meena Iyer", email: "meena@example.com", branch: "Jaipur", joinedDate: "2023-06-18", status: "inactive", hours: 60, donations: 5000 },
  { id: "m6", name: "Vikram Yadav", email: "vikram@example.com", branch: "Lucknow", joinedDate: "2023-09-01", status: "active", hours: 210, donations: 30000 },
  { id: "m7", name: "Neha Patel", email: "neha@example.com", branch: "Ahmedabad", joinedDate: "2023-11-11", status: "active", hours: 175, donations: 22000 },
];

export const ADMIN_KPIS = {
  totalMembers: 10245,
  totalEvents: 524,
  totalDonations: 52345600,
  activePercent: 98,
};

export const ADMIN_DONATIONS = [
  { id: "d1", donor: "Rajesh Kumar", amount: 5000, date: "2026-08-01", category: "Education", status: "Verified" as const },
  { id: "d2", donor: "Priya Singh", amount: 2500, date: "2026-07-30", category: "General", status: "Verified" as const },
  { id: "d3", donor: "Anonymous", amount: 1000, date: "2026-07-29", category: "Environment", status: "Verified" as const },
  { id: "d4", donor: "Vikram Yadav", amount: 10000, date: "2026-07-28", category: "Disaster Relief", status: "Pending" as const },
];

export { BRANCHES, EVENTS };
