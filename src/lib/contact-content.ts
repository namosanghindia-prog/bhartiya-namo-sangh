import type { Copy } from "@/lib/locale";
import type { ContactCategory } from "@/lib/supabase/types";

export const CONTACT_TOPICS: {
  value: string;
  category: ContactCategory;
  subject: string;
  label: Copy;
}[] = [
  { value: "general", category: "general", subject: "General enquiry", label: { en: "General enquiry", hi: "सामान्य पूछताछ" } },
  { value: "membership", category: "membership", subject: "Membership", label: { en: "Membership", hi: "सदस्यता" } },
  { value: "volunteer", category: "volunteer", subject: "Volunteer", label: { en: "Volunteer", hi: "स्वयंसेवा" } },
  { value: "branch", category: "other", subject: "Branch information", label: { en: "Branch information", hi: "शाखा जानकारी" } },
  { value: "partnership", category: "other", subject: "Partnership", label: { en: "Partnership", hi: "साझेदारी" } },
  { value: "events", category: "other", subject: "Events", label: { en: "Events", hi: "कार्यक्रम" } },
  { value: "media", category: "other", subject: "Media", label: { en: "Media", hi: "मीडिया" } },
  { value: "other", category: "other", subject: "Other", label: { en: "Other", hi: "अन्य" } },
];

export const BANK_ACCOUNTS = [
  {
    id: "axis",
    name: "Axis Bank",
    place: "Dwarka, New Delhi",
    fields: [
      ["Account Name", "BHARTIYA NAMO SANGH"],
      ["Account Number", "92202000547190"],
      ["IFSC", "UTIB0003893"],
      ["Branch", "Dwarka, New Delhi – 110075"],
    ],
  },
  {
    id: "bandhan",
    name: "Bandhan Bank",
    place: "Dwarka, New Delhi",
    fields: [
      ["Account Name", "BHARTIYA NAMO SANGH"],
      ["Account Number", "10170004386075"],
      ["Account Category", "Current Account – TASC/INR"],
      ["IFSC", "BDBL0001726"],
      ["Branch", "Dwarka, New Delhi"],
    ],
  },
] as const;

export const CONTACT_FAQ: { q: Copy; a: Copy }[] = [
  {
    q: { en: "How can I become a member?", hi: "सदस्य कैसे बनें?" },
    a: {
      en: "Complete the membership application on Join BNMS. Your information is reviewed, then you receive confirmation and can take part through your branch.",
      hi: "Join BNMS पर आवेदन पूरा करें। जानकारी की समीक्षा होती है, फिर पुष्टि मिलती है और आप अपनी शाखा के साथ भाग ले सकते हैं।",
    },
  },
  {
    q: { en: "How can I find my nearest branch?", hi: "निकटतम शाखा कैसे खोजें?" },
    a: {
      en: "Use Find your nearest branch on this page: search by state, district or city, or select a state on the map. The Branches page lists every published office.",
      hi: "इस पृष्ठ पर राज्य, जिला या शहर से खोजें, या मानचित्र पर राज्य चुनें। शाखाएँ पृष्ठ पर सभी प्रकाशित कार्यालय हैं।",
    },
  },
  {
    q: { en: "How can I volunteer?", hi: "स्वयंसेवा कैसे करें?" },
    a: {
      en: "Choose Volunteer on the contact form, or apply as a Volunteer member. You can also write to us describing the time and skills you can offer.",
      hi: "संपर्क फ़ॉर्म पर स्वयंसेवा चुनें, या स्वयंसेवक सदस्यता लें। समय और कौशल लिखकर भी संपर्क करें।",
    },
  },
  {
    q: { en: "How can I support BNMS?", hi: "BNMS का सहयोग कैसे करें?" },
    a: {
      en: "Join as a member, donate through the QR or bank transfer on this page, or propose a partnership. Mention your name and membership number in the payment reference.",
      hi: "सदस्य बनें, इस पृष्ठ पर QR या बैंक से दान करें, या साझेदारी प्रस्तावित करें। भुगतान संदर्भ में नाम और सदस्यता संख्या लिखें।",
    },
  },
  {
    q: { en: "How can I contact my district team?", hi: "जिला टीम से कैसे संपर्क करें?" },
    a: {
      en: "Select your state on the map to see published branches, then write through this form with Branch information, or visit the Branches page.",
      hi: "मानचित्र पर राज्य चुनकर प्रकाशित शाखाएँ देखें, फिर शाखा जानकारी के साथ फ़ॉर्म भेजें, या शाखाएँ पृष्ठ देखें।",
    },
  },
  {
    q: { en: "How can an organisation collaborate with BNMS?", hi: "कोई संस्था BNMS से कैसे सहयोग करे?" },
    a: {
      en: "Choose Partnership on the form and describe the collaboration. The organisation will review it through the same contact process.",
      hi: "फ़ॉर्म पर साझेदारी चुनें और सहयोग बताएँ। संगठन उसी संपर्क प्रक्रिया से समीक्षा करेगा।",
    },
  },
];
