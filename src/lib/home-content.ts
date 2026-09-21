import type { Copy } from "@/lib/locale";
import { INDIA_MAP_BOUNDS, INDIA_MAP_VIEW } from "@/lib/india-official-map";

export type HomeBranch = {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  memberCount: number;
  managerName: string | null;
  establishedYear: number | null;
};

export type HomeEvent = {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  location: string;
  city: string;
  state: string;
  participants: number;
};

export type HomePhoto = {
  id: string;
  imageUrl: string;
  caption: string | null;
  folderSlug: string | null;
  folderName: string | null;
};

export const HERO_SCENES = [
  { src: "/home/community.jpg", label: { en: "Communities", hi: "समुदाय" } },
  { src: "/home/youth.jpg", label: { en: "Youth", hi: "युवा" } },
  { src: "/home/women.jpg", label: { en: "Women", hi: "महिलाएँ" } },
  { src: "/home/farmers.jpg", label: { en: "Farmers", hi: "किसान" } },
  { src: "/home/education.jpg", label: { en: "Education", hi: "शिक्षा" } },
  { src: "/home/environment.jpg", label: { en: "Environment", hi: "पर्यावरण" } },
  { src: "/home/service.jpg", label: { en: "Social service", hi: "समाज सेवा" } },
] as const;

export const IMPACT_STATS = [
  { key: "members", value: 10000, suffix: "+", label: { en: "Members", hi: "सदस्य" } },
  { key: "events", value: 500, suffix: "+", label: { en: "Events", hi: "कार्यक्रम" } },
  { key: "branches", value: 28, suffix: "+", label: { en: "Branches", hi: "शाखाएँ" } },
  {
    key: "funds",
    value: 5,
    prefix: "₹",
    suffix: " Cr+",
    label: { en: "Funds Raised", hi: "जुटाई गई राशि" },
  },
] as const;

export const PILLARS = [
  {
    id: "social",
    title: { en: "Social Impact", hi: "सामाजिक प्रभाव" },
    description: {
      en: "Community programmes that reach the needy — blood donation, health camps, relief, and service as a public duty.",
      hi: "जरूरतमंदों तक पहुँचने वाले सामुदायिक कार्यक्रम — रक्तदान, स्वास्थ्य शिविर, राहत और सेवा को सामाजिक दायित्व मानकर।",
    },
    image: "/home/kitchen.jpg",
    hoverImage: "/home/service.jpg",
  },
  {
    id: "environment",
    title: { en: "Environmental Action", hi: "पर्यावरणीय कार्य" },
    description: {
      en: "Tree plantation, cleanliness drives, water conservation and a cleaner, greener Bharat.",
      hi: "वृक्षारोपण, स्वच्छता अभियान, जल संरक्षण और एक स्वच्छ, हरित भारत।",
    },
    image: "/home/environment.jpg",
    hoverImage: "/home/youth.jpg",
  },
  {
    id: "education",
    title: { en: "Education", hi: "शिक्षा" },
    description: {
      en: "Literacy, skill-building and learning initiatives for students, workers and whole communities.",
      hi: "छात्रों, श्रमिकों और पूरे समुदायों के लिए साक्षरता, कौशल विकास और शिक्षा पहल।",
    },
    image: "/home/education.jpg",
    hoverImage: "/home/youth-workshop.jpg",
  },
  {
    id: "civic",
    title: { en: "Civic Awareness", hi: "नागरिक जागरूकता" },
    description: {
      en: "Helping citizens know their rights, duties, and the welfare schemes meant for them.",
      hi: "नागरिकों को उनके अधिकार, कर्तव्य और उनके लिए बनी जनकल्याणकारी योजनाओं से जोड़ना।",
    },
    image: "/home/civic.jpg",
    hoverImage: "/home/community.jpg",
  },
] as const;

export const FOCUS_AREAS = [
  {
    id: "youth",
    title: { en: "Youth", hi: "युवा" },
    image: "/home/youth.jpg",
    line: { en: "Leadership for the next generation", hi: "अगली पीढ़ी का नेतृत्व" },
  },
  {
    id: "women",
    title: { en: "Women", hi: "महिलाएँ" },
    image: "/home/women.jpg",
    line: { en: "Participation, leadership, opportunity", hi: "भागीदारी, नेतृत्व, अवसर" },
  },
  {
    id: "farmers",
    title: { en: "Farmers", hi: "किसान" },
    image: "/home/farmers.jpg",
    line: { en: "Dignity for those who feed Bharat", hi: "भारत को भोजन देने वालों का सम्मान" },
  },
  {
    id: "workers",
    title: { en: "Workers", hi: "श्रमिक" },
    image: "/home/workers.jpg",
    line: { en: "Security, respect and a public voice", hi: "सुरक्षा, सम्मान और जनस्वर" },
  },
  {
    id: "education",
    title: { en: "Education", hi: "शिक्षा" },
    image: "/home/education.jpg",
    line: { en: "Learning that opens a door", hi: "शिक्षा जो द्वार खोलती है" },
  },
  {
    id: "health",
    title: { en: "Health", hi: "स्वास्थ्य" },
    image: "/home/service.jpg",
    line: { en: "Camps, care and blood donation", hi: "शिविर, देखभाल और रक्तदान" },
  },
  {
    id: "environment",
    title: { en: "Environment", hi: "पर्यावरण" },
    image: "/home/environment.jpg",
    line: { en: "Trees, water, a cleaner country", hi: "वृक्ष, जल, स्वच्छ देश" },
  },
  {
    id: "service",
    title: { en: "Social Service", hi: "समाज सेवा" },
    image: "/home/kitchen.jpg",
    line: { en: "Seva as a duty, not a favour", hi: "सेवा कर्तव्य है, उपकार नहीं" },
  },
] as const;

export const FALLBACK_ACTIVITIES: HomeEvent[] = [
  {
    id: "act-jaipur-blood",
    slug: "blood-donation-camp",
    title: "Blood Donation Camp",
    category: "Health",
    date: "2026-09-21",
    location: "Jaipur, Rajasthan",
    city: "Jaipur",
    state: "Rajasthan",
    participants: 320,
  },
  {
    id: "act-delhi-youth",
    slug: "youth-leadership-programme",
    title: "Youth Leadership Programme",
    category: "Education",
    date: "2026-09-18",
    location: "New Delhi",
    city: "New Delhi",
    state: "Delhi",
    participants: 180,
  },
  {
    id: "act-haryana-trees",
    slug: "tree-plantation-drive",
    title: "Tree Plantation Drive",
    category: "Environmental",
    date: "2026-09-15",
    location: "Sonipat, Haryana",
    city: "Sonipat",
    state: "Haryana",
    participants: 450,
  },
  {
    id: "act-mumbai-literacy",
    slug: "digital-literacy-workshop",
    title: "Digital Literacy Workshop",
    category: "Education",
    date: "2026-09-12",
    location: "Mumbai, Maharashtra",
    city: "Mumbai",
    state: "Maharashtra",
    participants: 90,
  },
  {
    id: "act-lucknow-civic",
    slug: "voter-awareness-rally",
    title: "Civic Awareness Rally",
    category: "Political",
    date: "2026-09-10",
    location: "Lucknow, Uttar Pradesh",
    city: "Lucknow",
    state: "Uttar Pradesh",
    participants: 210,
  },
  {
    id: "act-ahmedabad-health",
    slug: "health-checkup-camp",
    title: "Health Check-up Camp",
    category: "Health",
    date: "2026-09-08",
    location: "Ahmedabad, Gujarat",
    city: "Ahmedabad",
    state: "Gujarat",
    participants: 260,
  },
];

export const ACTIVITY_TITLES_HI: Record<string, string> = {
  "Blood Donation Camp": "रक्तदान शिविर",
  "Youth Leadership Programme": "युवा नेतृत्व कार्यक्रम",
  "Tree Plantation Drive": "वृक्षारोपण अभियान",
  "Digital Literacy Workshop": "डिजिटल साक्षरता कार्यशाला",
  "Civic Awareness Rally": "नागरिक जागरूकता रैली",
  "Health Check-up Camp": "स्वास्थ्य जांच शिविर",
  "Community Clean-Up Initiative": "सामुदायिक स्वच्छता पहल",
  "Independence Day Celebration Drive": "स्वतंत्रता दिवस समारोह",
};

export const IMPACT_STORIES = [
  {
    id: "scale",
    kicker: { en: "One Person", hi: "एक व्यक्ति" },
    title: {
      en: "From a small community initiative to 500+ events.",
      hi: "एक छोटे सामुदायिक प्रयास से 500+ कार्यक्रमों तक।",
    },
    location: { en: "New Delhi", hi: "नई दिल्ली" },
    story: {
      en: "What began as neighbours gathering to serve has become a national rhythm of camps, classrooms and relief — carried by members who treat seva as a duty.",
      hi: "जो पड़ोसियों के इकट्ठा होकर सेवा करने से शुरू हुआ, वह शिविरों, कक्षाओं और राहत कार्य की राष्ट्रीय लय बन गया — उन सदस्यों के साथ जो सेवा को कर्तव्य मानते हैं।",
    },
    image: "/home/community.jpg",
  },
  {
    id: "community",
    kicker: { en: "One Community", hi: "एक समुदाय" },
    title: {
      en: "A blood camp in Jaipur that filled a city hospital’s shelves.",
      hi: "जयपुर का रक्तदान शिविर, जिसने शहर के अस्पताल को संबल दिया।",
    },
    location: { en: "Jaipur, Rajasthan", hi: "जयपुर, राजस्थान" },
    story: {
      en: "Volunteers, nurses and first-time donors stood in one line. By evening, 320 units had been pledged — and a local blood bank had room to breathe.",
      hi: "स्वयंसेवक, नर्सें और पहली बार दान देने वाले एक पंक्ति में खड़े हुए। शाम तक 320 यूनिट का संकल्प हो चुका था — और स्थानीय ब्लड बैंक को राहत मिली।",
    },
    image: "/home/service.jpg",
  },
  {
    id: "change",
    kicker: { en: "One Change", hi: "एक परिवर्तन" },
    title: {
      en: "Villages along a highway, planted one sapling at a time.",
      hi: "राजमार्ग के गाँव, एक-एक पौधे से हरे होते गए।",
    },
    location: { en: "Haryana", hi: "हरियाणा" },
    story: {
      en: "Youth units and farmers shared a morning. The count of trees matters less than the habit: every season, the same stretch of earth is tended again.",
      hi: "युवा इकाइयों और किसानों ने एक सुबह साझा की। पेड़ों की गिनती से अधिक महत्वपूर्ण आदत है: हर मौसम उसी धरती की फिर से देखभाल।",
    },
    image: "/home/environment.jpg",
  },
] as const;

export const YOUTH_POINTS: Copy[] = [
  { en: "Leadership", hi: "नेतृत्व" },
  { en: "Skill Development", hi: "कौशल विकास" },
  { en: "Social Service", hi: "समाज सेवा" },
  { en: "Sports", hi: "खेल" },
  { en: "Culture", hi: "संस्कृति" },
];

export const WOMEN_POINTS: Copy[] = [
  { en: "Training", hi: "प्रशिक्षण" },
  { en: "Leadership", hi: "नेतृत्व" },
  { en: "Education", hi: "शिक्षा" },
  { en: "Self-employment", hi: "स्वरोजगार" },
  { en: "Social participation", hi: "सामाजिक भागीदारी" },
];

export const TIMELINE = [
  {
    id: "founded",
    year: "2022",
    title: { en: "Founded", hi: "स्थापना" },
    text: {
      en: "Bhartiya Namo Sangh takes form in New Delhi — nation first, service as duty.",
      hi: "नई दिल्ली में भारतीय नमो संघ का रूप — राष्ट्र प्रथम, सेवा कर्तव्य।",
    },
  },
  {
    id: "first",
    year: "2022",
    title: { en: "First Initiative", hi: "पहला प्रयास" },
    text: {
      en: "The first community camps and awareness drives set the pattern for every branch that followed.",
      hi: "पहले सामुदायिक शिविर और जागरूकता अभियान ने आने वाली हर शाखा की दिशा तय की।",
    },
  },
  {
    id: "members",
    year: "10,000+",
    title: { en: "Members", hi: "सदस्य" },
    text: {
      en: "A living membership of citizens who show up — youth, women, workers, farmers.",
      hi: "नागरिकों की जीवंत सदस्यता — युवा, महिलाएँ, श्रमिक, किसान।",
    },
  },
  {
    id: "branches",
    year: "28+",
    title: { en: "Branches", hi: "शाखाएँ" },
    text: {
      en: "A national network, from state units to local mandals, carrying the same four duties.",
      hi: "राष्ट्रीय नेटवर्क — प्रदेश इकाइयों से स्थानीय मंडलों तक, एक ही चार कर्तव्य।",
    },
  },
  {
    id: "events",
    year: "500+",
    title: { en: "Events", hi: "कार्यक्रम" },
    text: {
      en: "Camps, classrooms, plantations and relief — action, repeated until it becomes culture.",
      hi: "शिविर, कक्षाएँ, वृक्षारोपण और राहत — कर्म, जो दोहराए जाने पर संस्कृति बनता है।",
    },
  },
  {
    id: "next",
    year: "Next",
    title: { en: "Next Milestone", hi: "अगला पड़ाव" },
    text: {
      en: "Deeper local units, more trained youth, and a Bharat where participation is ordinary.",
      hi: "गहरी स्थानीय इकाइयाँ, अधिक प्रशिक्षित युवा, और एक भारत जहाँ सहभागिता सामान्य हो।",
    },
  },
] as const;

export const JOIN_PATHS = [
  {
    id: "member",
    href: "/auth/signup",
    kicker: { en: "01", hi: "०१" },
    title: { en: "Become a Member", hi: "सदस्य बनें" },
    text: {
      en: "Join the organisation. Carry a branch, a duty, and a national network.",
      hi: "संगठन से जुड़ें। एक शाखा, एक कर्तव्य, और एक राष्ट्रीय नेटवर्क संभालें।",
    },
    cta: { en: "Join as member", hi: "सदस्य के रूप में जुड़ें" },
  },
  {
    id: "volunteer",
    href: "/contact",
    kicker: { en: "02", hi: "०२" },
    title: { en: "Become a Volunteer", hi: "स्वयंसेवक बनें" },
    text: {
      en: "Give your time and skills — camps, teaching, relief, and the work of showing up.",
      hi: "अपना समय और कौशल दें — शिविर, शिक्षण, राहत, और उपस्थित रहने का कार्य।",
    },
    cta: { en: "Offer your time", hi: "समय दें" },
  },
  {
    id: "support",
    href: "/donate",
    kicker: { en: "03", hi: "०३" },
    title: { en: "Support a Cause", hi: "एक कार्य का समर्थन करें" },
    text: {
      en: "Contribute to a specific initiative — education, health, environment, relief.",
      hi: "एक निश्चित पहल में योगदान दें — शिक्षा, स्वास्थ्य, पर्यावरण, राहत।",
    },
    cta: { en: "Choose a cause", hi: "कार्य चुनें" },
  },
] as const;

export const CONTRIBUTION_CAUSES = [
  {
    id: "education",
    purpose: "education",
    title: { en: "Education", hi: "शिक्षा" },
    impact: {
      en: "Literacy workshops, school supplies and skill-building for learners who need a start.",
      hi: "साक्षरता कार्यशालाएँ, विद्यालय सामग्री और उन शिक्षार्थियों के लिए कौशल विकास जिन्हें शुरुआत चाहिए।",
    },
    example: {
      en: "₹1,000 can equip a digital literacy session.",
      hi: "₹1,000 एक डिजिटल साक्षरता सत्र चला सकते हैं।",
    },
  },
  {
    id: "health",
    purpose: "healthcare",
    title: { en: "Health", hi: "स्वास्थ्य" },
    impact: {
      en: "Health camps, blood donation and care for families with nowhere else to turn.",
      hi: "स्वास्थ्य शिविर, रक्तदान, और उन परिवारों की देखभाल जिनके पास और कोई सहारा नहीं।",
    },
    example: {
      en: "₹5,000 can underwrite a full health check-up camp.",
      hi: "₹5,000 एक पूर्ण स्वास्थ्य जांच शिविर चला सकते हैं।",
    },
  },
  {
    id: "environment",
    purpose: "environment",
    title: { en: "Environment", hi: "पर्यावरण" },
    impact: {
      en: "Saplings, cleanliness drives and water-conservation awareness along living streets.",
      hi: "पौधे, स्वच्छता अभियान और जीवित सड़कों पर जल संरक्षण की जागरूकता।",
    },
    example: {
      en: "₹500 plants a grove that a branch will tend.",
      hi: "₹500 एक बाग लगाते हैं जिसकी शाखा देखभाल करेगी।",
    },
  },
  {
    id: "community",
    purpose: "community",
    title: { en: "Community Service", hi: "सामुदायिक सेवा" },
    impact: {
      en: "Meals, blankets, and the quiet work of standing with a neighbourhood in ordinary weeks.",
      hi: "भोजन, कंबल, और सामान्य हफ्तों में एक मोहल्ले के साथ खड़े रहने का शांत कार्य।",
    },
    example: {
      en: "₹1,000 fills a day of community kitchen seva.",
      hi: "₹1,000 सामुदायिक रसोई की एक दिन की सेवा चलाते हैं।",
    },
  },
  {
    id: "disaster",
    purpose: "disaster",
    title: { en: "Emergency Relief", hi: "आपातकालीन राहत" },
    impact: {
      en: "Rapid kits and volunteers when flood, fire or crisis hits a district we already know.",
      hi: "बाढ़, आग या संकट जब किसी परिचित जिले को छूए, तब त्वरित सामग्री और स्वयंसेवक।",
    },
    example: {
      en: "₹5,000 sends a day of relief food kits.",
      hi: "₹5,000 एक दिन के राहत खाद्य किट भेजते हैं।",
    },
  },
] as const;

export const MEDIA_CATEGORIES = [
  { id: "all", label: { en: "All", hi: "सभी" } },
  { id: "events", label: { en: "Events", hi: "कार्यक्रम" } },
  { id: "campaigns", label: { en: "Campaigns", hi: "अभियान" } },
  { id: "environment", label: { en: "Environment", hi: "पर्यावरण" } },
  { id: "women", label: { en: "Women", hi: "महिलाएँ" } },
  { id: "farmers", label: { en: "Farmers", hi: "किसान" } },
  { id: "education", label: { en: "Education", hi: "शिक्षा" } },
  { id: "service", label: { en: "Social Service", hi: "समाज सेवा" } },
] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number]["id"];

export type MediaItem = {
  id: string;
  src: string;
  caption: Copy;
  category: Exclude<MediaCategory, "all">;
  href?: string;
};

export const FALLBACK_MEDIA: MediaItem[] = [
  { id: "m-community", src: "/home/community.jpg", category: "events", caption: { en: "A community gathering at dusk", hi: "संध्या में सामुदायिक सभा" } },
  { id: "m-youth", src: "/home/youth.jpg", category: "campaigns", caption: { en: "Youth on a plantation morning", hi: "वृक्षारोपण की सुबह युवा" } },
  { id: "m-women", src: "/home/women.jpg", category: "women", caption: { en: "Women leading a courtyard meeting", hi: "आँगन की बैठक में महिला नेतृत्व" } },
  { id: "m-farmers", src: "/home/farmers.jpg", category: "farmers", caption: { en: "Farmers in the field at golden hour", hi: "सुनहरी घड़ी में खेत में किसान" } },
  { id: "m-education", src: "/home/education.jpg", category: "education", caption: { en: "A skill-development classroom", hi: "कौशल विकास की कक्षा" } },
  { id: "m-environment", src: "/home/environment.jpg", category: "environment", caption: { en: "Rows of new saplings", hi: "नए पौधों की पंक्तियाँ" } },
  { id: "m-service", src: "/home/service.jpg", category: "service", caption: { en: "A blood donation and health camp", hi: "रक्तदान एवं स्वास्थ्य शिविर" } },
  { id: "m-civic", src: "/home/civic.jpg", category: "campaigns", caption: { en: "Civic awareness in the neighbourhood", hi: "मोहल्ले में नागरिक जागरूकता" } },
  { id: "m-workers", src: "/home/workers.jpg", category: "campaigns", caption: { en: "Workers, dignity at dusk", hi: "श्रमिक, संध्या में सम्मान" } },
  { id: "m-kitchen", src: "/home/kitchen.jpg", category: "service", caption: { en: "Community kitchen seva", hi: "सामुदायिक रसोई सेवा" } },
  { id: "m-youth-ws", src: "/home/youth-workshop.jpg", category: "education", caption: { en: "Youth leadership workshop", hi: "युवा नेतृत्व कार्यशाला" } },
  { id: "m-women-tr", src: "/home/women-training.jpg", category: "women", caption: { en: "Vocational training for women", hi: "महिलाओं का व्यावसायिक प्रशिक्षण" } },
];

export const GLOBAL_STEPS = [
  {
    title: { en: "Bharat", hi: "भारत" },
    text: { en: "A national organisation rooted in local units.", hi: "स्थानीय इकाइयों में जड़ा राष्ट्रीय संगठन।" },
  },
  {
    title: { en: "Communities", hi: "समुदाय" },
    text: { en: "Service that starts on a street, a farm, a classroom.", hi: "सेवा जो गली, खेत, कक्षा से शुरू होती है।" },
  },
  {
    title: { en: "Partnerships", hi: "साझेदारी" },
    text: { en: "Hospitals, schools and civic bodies we already work beside.", hi: "अस्पताल, विद्यालय और नागरिक संस्थाएँ जिनके साथ हम पहले से कार्य करते हैं।" },
  },
  {
    title: { en: "Global Outreach", hi: "वैश्विक पहुँच" },
    text: {
      en: "Room to grow with the Indian diaspora and international friends of this work.",
      hi: "भारतीय प्रवास और इस कार्य के अंतरराष्ट्रीय मित्रों के साथ बढ़ने का स्थान।",
    },
  },
] as const;

export type NetworkCity = {
  city: string;
  cityHi: string;
  state: string;
  stateHi: string;
  lon: number;
  lat: number;
};

export const NETWORK_CITIES: NetworkCity[] = [
  { city: "Srinagar", cityHi: "श्रीनगर", state: "Jammu and Kashmir", stateHi: "जम्मू और कश्मीर", lon: 74.8, lat: 34.08 },
  { city: "Shimla", cityHi: "शिमला", state: "Himachal Pradesh", stateHi: "हिमाचल प्रदेश", lon: 77.17, lat: 31.1 },
  { city: "Chandigarh", cityHi: "चंडीगढ़", state: "Chandigarh", stateHi: "चंडीगढ़", lon: 76.78, lat: 30.73 },
  { city: "Amritsar", cityHi: "अमृतसर", state: "Punjab", stateHi: "पंजाब", lon: 74.87, lat: 31.63 },
  { city: "New Delhi", cityHi: "नई दिल्ली", state: "Delhi", stateHi: "दिल्ली", lon: 77.21, lat: 28.61 },
  { city: "Dehradun", cityHi: "देहरादून", state: "Uttarakhand", stateHi: "उत्तराखंड", lon: 78.03, lat: 30.32 },
  { city: "Jaipur", cityHi: "जयपुर", state: "Rajasthan", stateHi: "राजस्थान", lon: 75.79, lat: 26.91 },
  { city: "Lucknow", cityHi: "लखनऊ", state: "Uttar Pradesh", stateHi: "उत्तर प्रदेश", lon: 80.95, lat: 26.85 },
  { city: "Patna", cityHi: "पटना", state: "Bihar", stateHi: "बिहार", lon: 85.14, lat: 25.59 },
  { city: "Gangtok", cityHi: "गंगटोक", state: "Sikkim", stateHi: "सिक्किम", lon: 88.61, lat: 27.33 },
  { city: "Guwahati", cityHi: "गुवाहाटी", state: "Assam", stateHi: "असम", lon: 91.74, lat: 26.14 },
  { city: "Itanagar", cityHi: "ईटानगर", state: "Arunachal Pradesh", stateHi: "अरुणाचल प्रदेश", lon: 93.62, lat: 27.08 },
  { city: "Shillong", cityHi: "शिलांग", state: "Meghalaya", stateHi: "मेघालय", lon: 91.88, lat: 25.58 },
  { city: "Kohima", cityHi: "कोहिमा", state: "Nagaland", stateHi: "नागालैंड", lon: 94.11, lat: 25.67 },
  { city: "Imphal", cityHi: "इंफाल", state: "Manipur", stateHi: "मणिपुर", lon: 93.94, lat: 24.82 },
  { city: "Aizawl", cityHi: "आइजोल", state: "Mizoram", stateHi: "मिजोरम", lon: 92.72, lat: 23.73 },
  { city: "Agartala", cityHi: "अगरतला", state: "Tripura", stateHi: "त्रिपुरा", lon: 91.29, lat: 23.83 },
  { city: "Kolkata", cityHi: "कोलकाता", state: "West Bengal", stateHi: "पश्चिम बंगाल", lon: 88.36, lat: 22.57 },
  { city: "Ranchi", cityHi: "राँची", state: "Jharkhand", stateHi: "झारखंड", lon: 85.31, lat: 23.34 },
  { city: "Bhubaneswar", cityHi: "भुवनेश्वर", state: "Odisha", stateHi: "ओडिशा", lon: 85.82, lat: 20.3 },
  { city: "Raipur", cityHi: "रायपुर", state: "Chhattisgarh", stateHi: "छत्तीसगढ़", lon: 81.63, lat: 21.25 },
  { city: "Bhopal", cityHi: "भोपाल", state: "Madhya Pradesh", stateHi: "मध्य प्रदेश", lon: 77.41, lat: 23.26 },
  { city: "Ahmedabad", cityHi: "अहमदाबाद", state: "Gujarat", stateHi: "गुजरात", lon: 72.57, lat: 23.02 },
  { city: "Mumbai", cityHi: "मुंबई", state: "Maharashtra", stateHi: "महाराष्ट्र", lon: 72.88, lat: 19.08 },
  { city: "Hyderabad", cityHi: "हैदराबाद", state: "Telangana", stateHi: "तेलंगाना", lon: 78.49, lat: 17.39 },
  { city: "Bengaluru", cityHi: "बेंगलुरु", state: "Karnataka", stateHi: "कर्नाटक", lon: 77.59, lat: 12.97 },
  { city: "Chennai", cityHi: "चेन्नई", state: "Tamil Nadu", stateHi: "तमिल नाडु", lon: 80.27, lat: 13.08 },
  { city: "Thiruvananthapuram", cityHi: "तिरुवनंतपुरम", state: "Kerala", stateHi: "केरल", lon: 76.94, lat: 8.52 },
];

export const FALLBACK_BRANCHES: HomeBranch[] = [
  { id: "delhi-hq", slug: "delhi-hq", name: "Delhi HQ", city: "New Delhi", state: "Delhi", memberCount: 850, managerName: "Rajesh Kumar", establishedYear: 2022 },
  { id: "mumbai", slug: "mumbai", name: "Mumbai", city: "Mumbai", state: "Maharashtra", memberCount: 620, managerName: "Priya Singh", establishedYear: 2022 },
  { id: "bangalore", slug: "bangalore", name: "Bangalore", city: "Bengaluru", state: "Karnataka", memberCount: 540, managerName: "Arjun Reddy", establishedYear: 2023 },
  { id: "jaipur", slug: "jaipur", name: "Jaipur", city: "Jaipur", state: "Rajasthan", memberCount: 410, managerName: "Meena Iyer", establishedYear: 2023 },
  { id: "lucknow", slug: "lucknow", name: "Lucknow", city: "Lucknow", state: "Uttar Pradesh", memberCount: 480, managerName: "Vikram Yadav", establishedYear: 2023 },
  { id: "ahmedabad", slug: "ahmedabad", name: "Ahmedabad", city: "Ahmedabad", state: "Gujarat", memberCount: 390, managerName: "Neha Patel", establishedYear: 2023 },
  { id: "kolkata", slug: "kolkata", name: "Kolkata", city: "Kolkata", state: "West Bengal", memberCount: 355, managerName: "Suman Das", establishedYear: 2024 },
  { id: "chennai", slug: "chennai", name: "Chennai", city: "Chennai", state: "Tamil Nadu", memberCount: 410, managerName: "Karthik Subramaniam", establishedYear: 2024 },
  { id: "bhopal", slug: "bhopal", name: "Bhopal", city: "Bhopal", state: "Madhya Pradesh", memberCount: 275, managerName: "Anil Sharma", establishedYear: 2024 },
];

export const NETWORK_EDGES: [string, string][] = [
  ["New Delhi", "Jaipur"],
  ["New Delhi", "Lucknow"],
  ["New Delhi", "Chandigarh"],
  ["New Delhi", "Dehradun"],
  ["New Delhi", "Bhopal"],
  ["New Delhi", "Mumbai"],
  ["New Delhi", "Kolkata"],
  ["Chandigarh", "Amritsar"],
  ["Chandigarh", "Shimla"],
  ["Shimla", "Srinagar"],
  ["Lucknow", "Patna"],
  ["Patna", "Ranchi"],
  ["Kolkata", "Bhubaneswar"],
  ["Kolkata", "Guwahati"],
  ["Guwahati", "Shillong"],
  ["Guwahati", "Itanagar"],
  ["Guwahati", "Kohima"],
  ["Kohima", "Imphal"],
  ["Imphal", "Aizawl"],
  ["Aizawl", "Agartala"],
  ["Guwahati", "Gangtok"],
  ["Mumbai", "Ahmedabad"],
  ["Mumbai", "Hyderabad"],
  ["Bhopal", "Raipur"],
  ["Hyderabad", "Bengaluru"],
  ["Bengaluru", "Chennai"],
  ["Bengaluru", "Thiruvananthapuram"],
  ["Chennai", "Thiruvananthapuram"],
];

export function projectLonLat(
  lon: number,
  lat: number,
  w = INDIA_MAP_VIEW.w,
  h = INDIA_MAP_VIEW.h
) {
  const x =
    ((lon - INDIA_MAP_BOUNDS.minLon) /
      (INDIA_MAP_BOUNDS.maxLon - INDIA_MAP_BOUNDS.minLon)) *
    w;
  const y =
    ((INDIA_MAP_BOUNDS.maxLat - lat) /
      (INDIA_MAP_BOUNDS.maxLat - INDIA_MAP_BOUNDS.minLat)) *
    h;
  return { x, y };
}

/** GADM-era polygons keep Telangana inside Andhra Pradesh. */
export function statesForPolygon(polygonName: string) {
  if (polygonName === "Andhra Pradesh") return ["Andhra Pradesh", "Telangana"];
  if (
    polygonName === "Dadra and Nagar Haveli" ||
    polygonName === "Daman and Diu"
  ) {
    return [
      "Dadra and Nagar Haveli",
      "Daman and Diu",
      "Dadra and Nagar Haveli and Daman and Diu",
    ];
  }
  return [polygonName];
}

export function formatHomeDate(iso: string, locale: "en" | "hi") {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(locale === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function matchBranchToCity(branch: HomeBranch, city: NetworkCity) {
  const bCity = branch.city.toLowerCase();
  const cCity = city.city.toLowerCase();
  if (bCity === cCity) return true;
  if (bCity.includes(cCity) || cCity.includes(bCity)) return true;
  if (branch.state === city.state && (bCity.includes("delhi") && cCity.includes("delhi"))) {
    return true;
  }
  return false;
}
