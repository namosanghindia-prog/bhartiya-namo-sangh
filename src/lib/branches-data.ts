export type Branch = {
  id: string;
  name: string;
  city: string;
  state: string;
  managerName: string;
  memberCount: number;
  establishedYear: number;
};

// Placeholder data — replace with a Supabase/Prisma query once the database is connected
export const BRANCHES: Branch[] = [
  { id: "delhi-hq", name: "Delhi HQ", city: "New Delhi", state: "Delhi", managerName: "Rajesh Kumar", memberCount: 850, establishedYear: 2022 },
  { id: "mumbai", name: "Mumbai", city: "Mumbai", state: "Maharashtra", managerName: "Priya Singh", memberCount: 620, establishedYear: 2022 },
  { id: "bangalore", name: "Bangalore", city: "Bengaluru", state: "Karnataka", managerName: "Arjun Reddy", memberCount: 540, establishedYear: 2023 },
  { id: "jaipur", name: "Jaipur", city: "Jaipur", state: "Rajasthan", managerName: "Meena Iyer", memberCount: 410, establishedYear: 2023 },
  { id: "lucknow", name: "Lucknow", city: "Lucknow", state: "Uttar Pradesh", managerName: "Vikram Yadav", memberCount: 480, establishedYear: 2023 },
  { id: "ahmedabad", name: "Ahmedabad", city: "Ahmedabad", state: "Gujarat", managerName: "Neha Patel", memberCount: 390, establishedYear: 2023 },
  { id: "kolkata", name: "Kolkata", city: "Kolkata", state: "West Bengal", managerName: "Suman Das", memberCount: 355, establishedYear: 2024 },
  { id: "chennai", name: "Chennai", city: "Chennai", state: "Tamil Nadu", managerName: "Karthik Subramaniam", memberCount: 410, establishedYear: 2024 },
  { id: "bhopal", name: "Bhopal", city: "Bhopal", state: "Madhya Pradesh", managerName: "Anil Sharma", memberCount: 275, establishedYear: 2024 },
];

export const STATES = Array.from(new Set(BRANCHES.map((b) => b.state))).sort();
