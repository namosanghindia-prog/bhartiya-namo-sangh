export type EventCategory =
  | "Social"
  | "Charity"
  | "Environmental"
  | "Education"
  | "Political";

export type EventItem = {
  id: string;
  title: string;
  category: EventCategory;
  description: string;
  date: string; // ISO date
  startTime: string;
  endTime: string;
  location: string;
  branch: string;
  registered: number;
  targetParticipants: number;
  agenda: { time: string; activity: string }[];
};

// Placeholder data — replace with a Supabase/Prisma query once the database is connected
export const EVENTS: EventItem[] = [
  {
    id: "independence-day-drive",
    title: "Independence Day Celebration Drive",
    category: "Social",
    description:
      "A community celebration marking India's Independence Day with flag hoisting, cultural performances, and a felicitation of local volunteers.",
    date: "2026-08-15",
    startTime: "10:00 AM",
    endTime: "2:00 PM",
    location: "Community Ground, Connaught Place",
    branch: "Delhi HQ",
    registered: 120,
    targetParticipants: 200,
    agenda: [
      { time: "10:00 AM", activity: "Flag hoisting ceremony" },
      { time: "10:30 AM", activity: "Cultural performances" },
      { time: "12:00 PM", activity: "Volunteer felicitation" },
      { time: "1:00 PM", activity: "Community lunch" },
    ],
  },
  {
    id: "community-cleanup",
    title: "Community Clean-Up Initiative",
    category: "Environmental",
    description:
      "Join hundreds of volunteers cleaning up local parks and waterways, followed by a tree plantation drive.",
    date: "2026-08-20",
    startTime: "6:00 PM",
    endTime: "9:00 PM",
    location: "Bandra Bandstand",
    branch: "Mumbai",
    registered: 85,
    targetParticipants: 150,
    agenda: [
      { time: "6:00 PM", activity: "Registration & safety briefing" },
      { time: "6:30 PM", activity: "Clean-up drive begins" },
      { time: "8:00 PM", activity: "Tree plantation" },
      { time: "8:45 PM", activity: "Closing remarks" },
    ],
  },
  {
    id: "digital-literacy-workshop",
    title: "Digital Literacy Workshop for Seniors",
    category: "Education",
    description:
      "A hands-on workshop teaching senior citizens how to use smartphones for banking, communication, and safety.",
    date: "2026-08-25",
    startTime: "11:00 AM",
    endTime: "1:00 PM",
    location: "Community Hall, Koramangala",
    branch: "Bangalore",
    registered: 40,
    targetParticipants: 60,
    agenda: [
      { time: "11:00 AM", activity: "Introduction to smartphones" },
      { time: "11:45 AM", activity: "UPI & digital banking basics" },
      { time: "12:30 PM", activity: "Q&A and one-on-one help" },
    ],
  },
  {
    id: "blood-donation-camp",
    title: "Blood Donation Camp",
    category: "Charity",
    description:
      "A blood donation camp organized in partnership with the local hospital blood bank to support patients in need.",
    date: "2026-09-05",
    startTime: "9:00 AM",
    endTime: "3:00 PM",
    location: "SMS Hospital Grounds",
    branch: "Jaipur",
    registered: 95,
    targetParticipants: 120,
    agenda: [
      { time: "9:00 AM", activity: "Registration & health screening" },
      { time: "9:30 AM", activity: "Donation begins" },
      { time: "2:30 PM", activity: "Refreshments for donors" },
    ],
  },
  {
    id: "voter-awareness-rally",
    title: "Voter Awareness Rally",
    category: "Political",
    description:
      "A civic-participation rally encouraging first-time voters to register and understand the electoral process.",
    date: "2026-09-10",
    startTime: "4:00 PM",
    endTime: "6:00 PM",
    location: "Gomti Nagar Grounds",
    branch: "Lucknow",
    registered: 210,
    targetParticipants: 300,
    agenda: [
      { time: "4:00 PM", activity: "Opening remarks" },
      { time: "4:30 PM", activity: "Voter registration helpdesk" },
      { time: "5:30 PM", activity: "Community march" },
    ],
  },
];

export const CATEGORIES: EventCategory[] = [
  "Social",
  "Charity",
  "Environmental",
  "Education",
  "Political",
];

export function getEventById(id: string) {
  return EVENTS.find((e) => e.id === id);
}
