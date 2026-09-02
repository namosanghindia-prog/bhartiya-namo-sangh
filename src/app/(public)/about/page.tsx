import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | Bhartiya Namo Sangh",
  description:
    "Bhartiya Namo Sangh (BNMS) is a social organisation devoted to national interest and community service — its vision, mission, focus areas and organisational structure.",
};

/* ------------------------------------------------------------------
   All copy is bilingual: an English rendering with the original Hindi
   beneath it. Hindi strings carry lang="hi" and the `font-devanagari`
   utility (see globals.css) so they render in a proper Indic face.
   ------------------------------------------------------------------ */

const CORE_BELIEFS = [
  { en: "Nation first, always.", hi: "राष्ट्र प्रथम की भावना।" },
  {
    en: "Respect for every section of society.",
    hi: "समाज के प्रत्येक वर्ग का सम्मान।",
  },
  {
    en: "Service treated as a social duty.",
    hi: "सेवा को सामाजिक दायित्व मानना।",
  },
  {
    en: "Connecting youth to nation-building.",
    hi: "युवाओं को राष्ट्र निर्माण से जोड़ना।",
  },
  {
    en: "Promoting the participation and empowerment of women.",
    hi: "महिलाओं की भागीदारी एवं सशक्तिकरण को बढ़ावा देना।",
  },
  {
    en: "Public awareness of education, health and sanitation.",
    hi: "शिक्षा, स्वास्थ्य एवं स्वच्छता के प्रति जनजागरूकता।",
  },
  {
    en: "Environmental protection and social responsibility.",
    hi: "पर्यावरण संरक्षण एवं सामाजिक जिम्मेदारी।",
  },
  {
    en: "Help for the needy, the poor, the helpless and the deprived.",
    hi: "जरूरतमंद, गरीब, असहाय और वंचित लोगों की सहायता।",
  },
  {
    en: "Strengthening social harmony, brotherhood and unity.",
    hi: "सामाजिक समरसता, भाईचारे और एकता को मजबूत करना।",
  },
  {
    en: "Making citizens aware of their rights and of government welfare schemes.",
    hi: "नागरिकों को उनके अधिकारों एवं सरकारी जनकल्याणकारी योजनाओं के प्रति जागरूक करना।",
  },
  {
    en: "Raising awareness against corruption and social evils.",
    hi: "भ्रष्टाचार और सामाजिक कुरीतियों के विरुद्ध जनजागरूकता पैदा करना।",
  },
];

const VISION = [
  {
    titleEn: "A Strong Bharat",
    titleHi: "सशक्त भारत",
    en: "Every citizen aware of their rights and duties, and playing their part in the country's development.",
    hi: "हर नागरिक अपने अधिकारों और कर्तव्यों के प्रति जागरूक हो तथा देश के विकास में अपनी भूमिका निभाए।",
  },
  {
    titleEn: "A Self-Reliant Bharat",
    titleHi: "आत्मनिर्भर भारत",
    en: "Youth, farmers, workers, women and small entrepreneurs moving forward towards self-reliance.",
    hi: "युवा, किसान, श्रमिक, महिलाएँ और छोटे उद्यमी आत्मनिर्भर बनने के लिए आगे बढ़ें।",
  },
  {
    titleEn: "A Socially United Bharat",
    titleHi: "सामाजिक रूप से एकजुट भारत",
    en: "Rising above divisions of caste, region and language so that national interest and social harmony grow stronger.",
    hi: "जाति, क्षेत्र, भाषा और सामाजिक विभाजनों से ऊपर उठकर राष्ट्रहित एवं सामाजिक सद्भाव की भावना मजबूत हो।",
  },
  {
    titleEn: "A Cultured Bharat",
    titleHi: "संस्कारित भारत",
    en: "Carrying Indian culture, traditions, moral values and love for the nation to the next generation.",
    hi: "भारतीय संस्कृति, परंपराओं, नैतिक मूल्यों और राष्ट्रप्रेम की भावना को नई पीढ़ी तक पहुँचाया जाए।",
  },
  {
    titleEn: "An Aware Bharat",
    titleHi: "जागरूक भारत",
    en: "Every citizen informed about government schemes, social rights and their own responsibilities.",
    hi: "हर नागरिक सरकारी योजनाओं, सामाजिक अधिकारों और अपने कर्तव्यों के प्रति जागरूक बने।",
  },
];

const MISSION = [
  {
    titleEn: "Information on welfare schemes",
    titleHi: "जनकल्याणकारी योजनाओं की जानकारी",
    en: "Helping carry information about the welfare schemes and facilities of the Government of India and allied institutions to ordinary citizens.",
    hi: "भारत सरकार एवं संबंधित संस्थाओं की जनकल्याणकारी योजनाओं और सुविधाओं की जानकारी आम नागरिकों तक पहुँचाने में सहयोग करना।",
  },
  {
    titleEn: "Awareness about education",
    titleHi: "शिक्षा के प्रति जागरूकता",
    en: "Encouraging the education of poor and needy children, and creating awareness in society about why education matters.",
    hi: "गरीब एवं जरूरतमंद बच्चों की शिक्षा को प्रोत्साहित करना तथा शिक्षा के महत्व के प्रति समाज में जागरूकता पैदा करना।",
  },
  {
    titleEn: "Health and sanitation",
    titleHi: "स्वास्थ्य एवं स्वच्छता",
    en: "Promoting health check-ups, blood donation, cleanliness drives and health awareness programmes.",
    hi: "स्वास्थ्य जांच, रक्तदान, स्वच्छता अभियान तथा स्वास्थ्य संबंधी जागरूकता कार्यक्रमों को बढ़ावा देना।",
  },
  {
    titleEn: "Farmers and workers",
    titleHi: "किसान एवं श्रमिक हित",
    en: "Helping bring the social and public-interest issues of farmers and labourers to the appropriate forum.",
    hi: "किसानों, मजदूरों एवं श्रमिकों से जुड़े सामाजिक एवं जनहित के मुद्दों को उचित मंच तक पहुँचाने में सहयोग करना।",
  },
  {
    titleEn: "Women's empowerment",
    titleHi: "महिला सशक्तिकरण",
    en: "Encouraging awareness and training activities that connect women to the social, economic and leadership mainstream.",
    hi: "महिलाओं को सामाजिक, आर्थिक एवं नेतृत्व की मुख्यधारा से जोड़ने के लिए जागरूकता एवं प्रशिक्षण गतिविधियों को प्रोत्साहित करना।",
  },
  {
    titleEn: "The strength of youth",
    titleHi: "युवा शक्ति",
    en: "Developing leadership, discipline, national service, social responsibility and positive thinking among young people.",
    hi: "युवाओं में नेतृत्व क्षमता, अनुशासन, राष्ट्रसेवा, सामाजिक जिम्मेदारी और सकारात्मक सोच का विकास करना।",
  },
  {
    titleEn: "Environmental protection",
    titleHi: "पर्यावरण संरक्षण",
    en: "Running campaigns for tree plantation, cleanliness, water conservation and environmental awareness.",
    hi: "वृक्षारोपण, स्वच्छता, जल संरक्षण और पर्यावरण के प्रति जनजागरूकता अभियान चलाना।",
  },
  {
    titleEn: "Help for those in need",
    titleHi: "जरूरतमंदों की सहायता",
    en: "Providing help and service to poor, helpless and needy citizens according to their circumstances.",
    hi: "गरीब, असहाय एवं जरूरतमंद नागरिकों की परिस्थितियों के अनुसार सहायता एवं सेवा कार्य करना।",
  },
];

const FOCUS_AREAS = [
  {
    icon: "🤝",
    titleEn: "Social Service",
    titleHi: "सामाजिक सेवा",
    en: "BNMS works through social service programmes held from time to time to reach the needy sections of society.",
    hi: "भारतीय नमो संघ समय-समय पर विभिन्न सामाजिक सेवा कार्यक्रमों के माध्यम से समाज के जरूरतमंद वर्ग तक पहुँचने का प्रयास करता है।",
    items: [
      { en: "Blood donation camps", hi: "रक्तदान शिविर" },
      { en: "Health check-up camps", hi: "स्वास्थ्य जांच शिविर" },
      { en: "Help for the poor and needy", hi: "गरीब एवं जरूरतमंदों की सहायता" },
      {
        en: "Distribution of blankets and essentials",
        hi: "कंबल एवं आवश्यक सामग्री वितरण",
      },
      {
        en: "Relief work during disaster and crisis",
        hi: "आपदा एवं संकट के समय राहत कार्य",
      },
      {
        en: "Food and public-service programmes",
        hi: "भोजन एवं जनसेवा कार्यक्रम",
      },
      { en: "Cleanliness drives", hi: "स्वच्छता अभियान" },
    ],
  },
  {
    icon: "📢",
    titleEn: "Public Awareness Campaigns",
    titleHi: "जनजागरूकता अभियान",
    en: "The organisation may run campaigns to raise public awareness on subjects of social and national importance.",
    hi: "संगठन सामाजिक एवं राष्ट्रीय महत्व के विषयों पर जनजागरूकता बढ़ाने के लिए विभिन्न अभियान आयोजित कर सकता है।",
    items: [
      { en: "Education awareness", hi: "शिक्षा जागरूकता" },
      { en: "Health awareness", hi: "स्वास्थ्य जागरूकता" },
      { en: "Cleanliness drives", hi: "स्वच्छता अभियान" },
      { en: "Environmental protection", hi: "पर्यावरण संरक्षण" },
      { en: "De-addiction awareness", hi: "नशामुक्ति जागरूकता" },
      { en: "Safety and dignity of women", hi: "महिला सुरक्षा एवं सम्मान" },
      { en: "Children's education", hi: "बाल शिक्षा" },
      { en: "Civic rights and duties", hi: "नागरिक अधिकार एवं कर्तव्य" },
    ],
  },
  {
    icon: "💪",
    titleEn: "Youth & Leadership Development",
    titleHi: "युवा एवं नेतृत्व विकास",
    en: "Positively connecting India's youth to nation-building is among the organisation's foremost priorities.",
    hi: "भारत की युवा शक्ति को राष्ट्र निर्माण की दिशा में सकारात्मक रूप से जोड़ना संगठन की प्रमुख प्राथमिकताओं में शामिल है।",
    items: [
      { en: "Leadership training", hi: "नेतृत्व प्रशिक्षण" },
      { en: "Social service activities", hi: "सामाजिक सेवा गतिविधियाँ" },
      {
        en: "Nation-building programmes",
        hi: "राष्ट्र निर्माण संबंधी कार्यक्रम",
      },
      { en: "Personality development", hi: "व्यक्तित्व विकास" },
      {
        en: "Sports and cultural activities",
        hi: "खेल एवं सांस्कृतिक गतिविधियाँ",
      },
      { en: "Social awareness campaigns", hi: "सामाजिक जागरूकता अभियान" },
    ],
  },
  {
    icon: "👩",
    titleEn: "Women's Empowerment",
    titleHi: "महिला सशक्तिकरण",
    en: "BNMS regards women as an important strength of society, and will work to give them greater opportunity in service, leadership, education, self-employment and awareness work — advancing women workers into organisational responsibilities and raising awareness of their dignity and safety.",
    hi: "भारतीय नमो संघ महिलाओं को समाज की महत्वपूर्ण शक्ति मानता है। संगठन का प्रयास रहेगा कि महिलाओं को सामाजिक सेवा, नेतृत्व, शिक्षा, स्वरोजगार एवं जनजागरूकता से जुड़े कार्यों में अधिक से अधिक अवसर प्राप्त हों। महिला कार्यकर्ताओं को संगठनात्मक जिम्मेदारियों में आगे बढ़ाने तथा समाज में महिलाओं के सम्मान एवं सुरक्षा के प्रति जागरूकता बढ़ाने पर विशेष ध्यान दिया जाएगा।",
    items: [],
  },
  {
    icon: "🌾",
    titleEn: "Respect for Farmers & Workers",
    titleHi: "किसान एवं श्रमिक सम्मान",
    en: "Farmers and workers play a vital role in India's economy and society. BNMS will work to understand the public-interest issues that concern them, make relevant information available, and carry their problems to the appropriate forum through proper constitutional and democratic means.",
    hi: "भारत की अर्थव्यवस्था और सामाजिक व्यवस्था में किसानों एवं श्रमिकों की महत्वपूर्ण भूमिका है। भारतीय नमो संघ किसानों और श्रमिकों से जुड़े जनहित के मुद्दों को समझने, संबंधित जानकारी उपलब्ध कराने तथा उचित संवैधानिक एवं लोकतांत्रिक माध्यमों से उनकी समस्याओं को संबंधित मंच तक पहुँचाने के लिए कार्य करने का प्रयास करेगा।",
    items: [],
  },
  {
    icon: "🌱",
    titleEn: "Environment & Clean India",
    titleHi: "पर्यावरण एवं स्वच्छ भारत अभियान",
    en: "A clean and healthy environment is both the right and the responsibility of every citizen.",
    hi: "स्वच्छ एवं स्वस्थ वातावरण प्रत्येक नागरिक का अधिकार और जिम्मेदारी है।",
    items: [
      { en: "🌳 Tree plantation drives", hi: "वृक्षारोपण अभियान" },
      { en: "🧹 Cleanliness drives", hi: "स्वच्छता अभियान" },
      { en: "💧 Water conservation awareness", hi: "जल संरक्षण जागरूकता" },
      { en: "♻️ Environmental protection", hi: "पर्यावरण संरक्षण" },
      {
        en: "🌍 Plastic and waste management awareness",
        hi: "प्लास्टिक एवं कचरा प्रबंधन जागरूकता",
      },
    ],
  },
];

const STRUCTURE = [
  {
    levelEn: "National Level",
    levelHi: "राष्ट्रीय स्तर",
    roles: [
      { en: "National President", hi: "राष्ट्रीय अध्यक्ष" },
      { en: "National Vice-President", hi: "राष्ट्रीय उपाध्यक्ष" },
      { en: "National General Secretary", hi: "राष्ट्रीय महासचिव" },
      { en: "National Secretary", hi: "राष्ट्रीय सचिव" },
      { en: "National Treasurer", hi: "राष्ट्रीय कोषाध्यक्ष" },
      { en: "Central Executive / Committee", hi: "केंद्रीय कार्यकारिणी/समिति" },
      { en: "Other national office-bearers", hi: "अन्य राष्ट्रीय पदाधिकारी" },
    ],
  },
  {
    levelEn: "State Level",
    levelHi: "प्रदेश स्तर",
    roles: [
      { en: "State President", hi: "प्रदेश अध्यक्ष" },
      { en: "State General Secretary", hi: "प्रदेश महासचिव" },
      { en: "State Secretary", hi: "प्रदेश सचिव" },
      { en: "State Treasurer", hi: "प्रदेश कोषाध्यक्ष" },
      { en: "State Executive", hi: "प्रदेश कार्यकारिणी" },
    ],
  },
  {
    levelEn: "District Level",
    levelHi: "जिला स्तर",
    roles: [
      { en: "District President", hi: "जिला अध्यक्ष" },
      { en: "District General Secretary / Secretary", hi: "जिला महासचिव/सचिव" },
      { en: "District Treasurer", hi: "जिला कोषाध्यक्ष" },
      { en: "District Executive", hi: "जिला कार्यकारिणी" },
    ],
  },
  {
    levelEn: "Local Level",
    levelHi: "स्थानीय स्तर",
    roles: [
      {
        en: "Mandal / block-level office-bearers",
        hi: "मंडल/ब्लॉक स्तर के पदाधिकारी",
      },
      { en: "Town / ward unit", hi: "नगर/वार्ड इकाई" },
      { en: "Village unit", hi: "ग्राम इकाई" },
      { en: "Active members and volunteers", hi: "सक्रिय सदस्य एवं स्वयंसेवक" },
    ],
  },
];

const DISTINCTIONS = [
  {
    // null → rendered as the inline tricolour rather than an emoji.
    icon: null,
    titleEn: "Nation First",
    titleHi: "राष्ट्रहित सर्वोपरि",
    en: "National and public interest come first in every effort the organisation makes.",
    hi: "संगठन के सभी सामाजिक प्रयासों में राष्ट्रहित एवं जनहित को प्राथमिकता दी जाती है।",
  },
  {
    icon: "🤝",
    titleEn: "Spirit of Service",
    titleHi: "सेवा भावना",
    en: "BNMS treats service as a responsibility owed to society.",
    hi: "भारतीय नमो संघ सेवा को समाज के प्रति जिम्मेदारी मानता है।",
  },
  {
    icon: "👥",
    titleEn: "Public Participation",
    titleHi: "जनभागीदारी",
    en: "An effort to bring every section of society into social work.",
    hi: "समाज के विभिन्न वर्गों को सामाजिक कार्यों में जोड़ने का प्रयास।",
  },
  {
    icon: "💪",
    titleEn: "Youth Strength",
    titleHi: "युवा शक्ति",
    en: "Connecting young people to positive social and nation-building activity.",
    hi: "युवाओं को सकारात्मक सामाजिक एवं राष्ट्र निर्माण की गतिविधियों से जोड़ना।",
  },
  {
    icon: "👩",
    titleEn: "Women's Participation",
    titleHi: "महिला भागीदारी",
    en: "Offering women leadership opportunities in the organisation and in social work.",
    hi: "महिलाओं को संगठन एवं सामाजिक कार्यों में नेतृत्व के अवसर प्रदान करना।",
  },
  {
    icon: "🌱",
    titleEn: "Social Responsibility",
    titleHi: "सामाजिक जिम्मेदारी",
    en: "Work on education, health, sanitation, environment and social harmony.",
    hi: "शिक्षा, स्वास्थ्य, स्वच्छता, पर्यावरण और सामाजिक समरसता जैसे विषयों पर कार्य।",
  },
];

const CITIZEN_ROLE = [
  { en: "knows their rights,", hi: "अपने अधिकार जानता है," },
  { en: "understands their duties,", hi: "अपने कर्तव्यों को समझता है," },
  { en: "helps society,", hi: "समाज की सहायता करता है," },
  { en: "respects the law of the land,", hi: "देश के कानून का सम्मान करता है" },
  {
    en: "and contributes to the nation's progress.",
    hi: "और राष्ट्र की प्रगति में योगदान देता है।",
  },
];

const GOAL_LINES = [
  { en: "where citizens are aware,", hi: "जहाँ नागरिक जागरूक हों," },
  { en: "youth are confident,", hi: "युवा आत्मविश्वासी हों," },
  { en: "women are empowered,", hi: "महिलाएँ सशक्त हों," },
  { en: "farmers are honoured,", hi: "किसान सम्मानित हों," },
  { en: "workers are secure,", hi: "श्रमिक सुरक्षित हों," },
  { en: "the needy receive support,", hi: "जरूरतमंदों को सहयोग मिले," },
  { en: "society lives in brotherhood,", hi: "समाज में भाईचारा हो" },
  {
    en: "and every citizen plays their part in nation-building.",
    hi: "और प्रत्येक नागरिक राष्ट्र निर्माण में अपनी भूमिका निभाए।",
  },
];

/* Contact points published on this page. The footer and /contact read these
   from `organization_settings`; these are spelled out here so the About page
   ends with a direct way to reach the organisation. Keep them in step with
   that table if the numbers change. */
const CONTACT_PHONES = ["9811615500", "7669099111"];
const CONTACT_WEBSITE = "www.bhartiyanamosangh.com";

const LEADERSHIP = [
  {
    name: "Dr. Manoj Kumar Tomar “Mannu”",
    nameHi: "डॉ. मन्नू सिंह तोमर",
    titleEn: "National President",
    titleHi: "राष्ट्रीय अध्यक्ष",
    initials: "MT",
  },
];

/** Tricolour mark, drawn inline.
 *
 * The 🇮🇳 emoji is a regional-indicator pair, and Windows' Segoe UI Emoji has
 * no country-flag glyphs — it falls back to rendering the bare letters "IN".
 * An SVG looks the same on every platform. */
function TricolourMark({ className = "h-6 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 24"
      className={`inline-block align-middle rounded-[2px] ring-1 ring-navy/10 ${className}`}
      role="img"
      aria-label="Flag of India"
    >
      <rect width="36" height="8" fill="#FF9933" />
      <rect y="8" width="36" height="8" fill="#FFFFFF" />
      <rect y="16" width="36" height="8" fill="#138808" />
      <circle
        cx="18"
        cy="12"
        r="3.2"
        fill="none"
        stroke="#000080"
        strokeWidth="0.9"
      />
    </svg>
  );
}

/** Hindi text run — carries the right lang attribute and Devanagari face. */
function Hi({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span lang="hi" className={`font-devanagari ${className}`}>
      {children}
    </span>
  );
}

/** Section heading with the English title above its Hindi equivalent. */
function SectionHeading({
  en,
  hi,
  tone = "navy",
}: {
  en: string;
  hi: string;
  tone?: "navy" | "white";
}) {
  const light = tone === "white";
  return (
    <div className="text-center">
      <h2
        className={`font-heading text-3xl font-semibold ${
          light ? "text-white" : "text-navy"
        }`}
      >
        {en}
      </h2>
      <p
        className={`mt-2 text-lg ${
          light ? "text-saffron-300" : "text-saffron-800"
        }`}
      >
        <Hi>{hi}</Hi>
      </p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      {/* PAGE HEADER */}
      <section className="bg-saffron-gradient text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold">
            About Bhartiya Namo Sangh
          </h1>
          <p className="mt-3 text-xl text-white/90">
            <Hi>भारतीय नमो संघ — संगठन का परिचय</Hi>
          </p>
          <blockquote className="mt-8 mx-auto max-w-2xl border-t border-white/25 pt-6">
            <p className="text-lg leading-relaxed">
              <Hi>
                &ldquo;व्यवस्था परिवर्तन, सत्ता नहीं;
                <br />
                सेवा ही संगठन, राष्ट्रहित ही सर्वोपरि।&rdquo;
              </Hi>
            </p>
            <footer className="mt-3 text-sm text-white/80">
              &ldquo;Change the system, not the seat of power; the organisation
              is service itself, and the nation comes first.&rdquo;
            </footer>
          </blockquote>
        </div>
      </section>

      {/* WHO WE ARE */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeading en="Who We Are" hi="संगठन का परिचय" />
          <div className="mt-10 space-y-8">
            <div>
              <p className="text-base leading-relaxed text-navy/80">
                Bhartiya Namo Sangh (BNMS) is a social organisation devoted to
                the national interest and to community service. Its core aim is
                to carry every section of society along in advancing national
                development, social unity, public awareness and service work.
              </p>
              <p className="mt-3 text-base leading-relaxed text-navy/70">
                <Hi>
                  भारतीय नमो संघ (BNMS) एक राष्ट्रहित एवं समाजसेवा के लिए समर्पित
                  सामाजिक संगठन है। संगठन का मूल उद्देश्य समाज के प्रत्येक वर्ग
                  को साथ लेकर राष्ट्र के विकास, सामाजिक एकता, जनजागरूकता और सेवा
                  कार्यों को आगे बढ़ाना है।
                </Hi>
              </p>
            </div>

            <div>
              <p className="text-base leading-relaxed text-navy/80">
                BNMS believes that the real strength of any nation lies in the
                unity, awareness, discipline, values and spirit of service of
                its citizens. On this idea the organisation works to promote
                social and public-welfare activity across different regions of
                the country.
              </p>
              <p className="mt-3 text-base leading-relaxed text-navy/70">
                <Hi>
                  भारतीय नमो संघ का विश्वास है कि किसी भी राष्ट्र की वास्तविक
                  शक्ति उसके नागरिकों की एकता, जागरूकता, अनुशासन, संस्कार और सेवा
                  भावना में निहित होती है। इसी विचार को आधार बनाकर संगठन देश के
                  विभिन्न क्षेत्रों में सामाजिक एवं जनकल्याणकारी गतिविधियों को
                  बढ़ावा देने के लिए कार्य करता है।
                </Hi>
              </p>
            </div>

            <div>
              <p className="text-base leading-relaxed text-navy/80">
                BNMS does not treat the politics of power as its goal. Its
                primary purpose is to remain among the people, create awareness
                on matters of public interest, assist those in need, and ensure
                the active participation of citizens in nation-building.
              </p>
              <p className="mt-3 text-base leading-relaxed text-navy/70">
                <Hi>
                  भारतीय नमो संघ सत्ता की राजनीति को अपना लक्ष्य नहीं मानता।
                  संगठन का प्राथमिक उद्देश्य समाज के बीच रहकर जनहित के विषयों पर
                  जागरूकता पैदा करना, जरूरतमंद लोगों की सहायता करना तथा राष्ट्र
                  निर्माण में नागरिकों की सक्रिय भागीदारी सुनिश्चित करना है।
                </Hi>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE BELIEFS */}
      <section className="bg-white border-y border-saffron-100 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading en="Our Core Beliefs" hi="संगठन के मूल विचार" />
          <p className="mt-4 text-center text-sm text-navy/60 max-w-2xl mx-auto">
            Bhartiya Namo Sangh treats the following as the foundation of all
            its work.
          </p>
          <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            {CORE_BELIEFS.map((belief) => (
              <li key={belief.en} className="flex items-start gap-3">
                <span
                  className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-saffron-700"
                  aria-hidden="true"
                />
                <span>
                  <span className="block text-sm font-medium text-navy">
                    {belief.en}
                  </span>
                  <span className="mt-0.5 block text-sm text-navy/60">
                    <Hi>{belief.hi}</Hi>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* VISION */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading en="Our Vision" hi="संगठन की दृष्टि" />
          <p className="mt-4 text-center text-sm text-navy/60 max-w-3xl mx-auto">
            The long-term goal of Bhartiya Namo Sangh is to contribute to the
            building of a strong and aware Bharat.
          </p>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VISION.map((item) => (
              <div
                key={item.titleEn}
                className="rounded-xl border border-saffron-200 bg-white p-6 hover:shadow-lg transition-shadow"
              >
                <div className="mb-3">
                  <TricolourMark />
                </div>
                <h3 className="font-heading text-xl font-semibold text-saffron-700">
                  {item.titleEn}
                </h3>
                <p className="mt-1 text-base font-medium text-navy">
                  <Hi>{item.titleHi}</Hi>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-navy/75">
                  {item.en}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-navy/55">
                  <Hi>{item.hi}</Hi>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="bg-white border-y border-saffron-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading en="Our Mission" hi="संगठन का मिशन" />
          <p className="mt-4 text-center text-sm text-navy/60 max-w-3xl mx-auto">
            Under its mission, Bhartiya Namo Sangh is committed to working
            continuously in the following areas.
          </p>
          <ol className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            {MISSION.map((item, index) => (
              <li
                key={item.titleEn}
                className="rounded-xl bg-saffron-50 border border-saffron-200 p-6"
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-heading text-2xl font-semibold text-saffron-700"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-navy">{item.titleEn}</h3>
                    <p className="text-sm text-saffron-800">
                      <Hi>{item.titleHi}</Hi>
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-navy/75">
                  {item.en}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-navy/55">
                  <Hi>{item.hi}</Hi>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FOCUS AREAS */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            en="Our Focus Areas"
            hi="संगठन के प्रमुख कार्यक्षेत्र"
          />
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {FOCUS_AREAS.map((area) => (
              <div
                key={area.titleEn}
                className="rounded-xl border border-saffron-200 bg-white p-7"
              >
                <div className="text-3xl mb-3" aria-hidden="true">
                  {area.icon}
                </div>
                <h3 className="font-heading text-xl font-semibold text-saffron-700">
                  {area.titleEn}
                </h3>
                <p className="mt-1 text-base font-medium text-navy">
                  <Hi>{area.titleHi}</Hi>
                </p>
                <p className="mt-4 text-sm leading-relaxed text-navy/75">
                  {area.en}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-navy/55">
                  <Hi>{area.hi}</Hi>
                </p>
                {area.items.length > 0 && (
                  <ul className="mt-5 space-y-2 border-t border-saffron-100 pt-5">
                    {area.items.map((item) => (
                      <li
                        key={item.en}
                        className="flex items-start gap-3 text-sm"
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-saffron-400"
                          aria-hidden="true"
                        />
                        <span>
                          <span className="text-navy/80">{item.en}</span>
                          <span className="text-navy/50">
                            {" — "}
                            <Hi>{item.hi}</Hi>
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ORGANISATIONAL STRUCTURE */}
      <section className="bg-white border-y border-saffron-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading en="Organisational Structure" hi="संगठनात्मक संरचना" />
          <p className="mt-4 text-center text-sm text-navy/60 max-w-3xl mx-auto">
            To run Bhartiya Namo Sangh in an organised and effective way,
            organisational units are formed at several levels.
          </p>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STRUCTURE.map((level) => (
              <div
                key={level.levelEn}
                className="rounded-xl bg-saffron-50 border border-saffron-200 p-6"
              >
                <h3 className="font-heading text-lg font-semibold text-navy">
                  {level.levelEn}
                </h3>
                <p className="text-sm text-saffron-800">
                  <Hi>{level.levelHi}</Hi>
                </p>
                <ul className="mt-4 space-y-2.5">
                  {level.roles.map((role) => (
                    <li key={role.en} className="text-sm">
                      <span className="block text-navy/80">{role.en}</span>
                      <span className="block text-navy/50">
                        <Hi>{role.hi}</Hi>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-navy/60 max-w-3xl mx-auto">
            Organisational posts and responsibilities may be determined
            according to the rules and requirements laid down by the
            organisation.
            <span className="mt-1 block text-navy/45">
              <Hi>
                संगठनात्मक पद एवं जिम्मेदारियाँ संगठन के निर्धारित नियमों एवं
                आवश्यकताओं के अनुसार निर्धारित की जा सकती हैं।
              </Hi>
            </span>
          </p>
        </div>
      </section>

      {/* WHAT SETS US APART */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading en="What Sets Us Apart" hi="संगठन की विशेषताएँ" />
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DISTINCTIONS.map((item) => (
              <div
                key={item.titleEn}
                className="rounded-xl border border-saffron-200 bg-white p-6 hover:shadow-lg transition-shadow"
              >
                {item.icon ? (
                  <div className="text-2xl mb-3" aria-hidden="true">
                    {item.icon}
                  </div>
                ) : (
                  <div className="mb-3">
                    <TricolourMark className="h-6 w-9" />
                  </div>
                )}
                <h3 className="font-semibold text-navy">{item.titleEn}</h3>
                <p className="text-sm text-saffron-800">
                  <Hi>{item.titleHi}</Hi>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-navy/75">
                  {item.en}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-navy/55">
                  <Hi>{item.hi}</Hi>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CITIZEN'S ROLE */}
      <section className="bg-navy text-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            en="The Citizen's Role in Nation-Building"
            hi="राष्ट्रनिर्माण में नागरिक की भूमिका"
            tone="white"
          />
          <p className="mt-8 text-center text-base leading-relaxed text-white/75">
            Bhartiya Namo Sangh believes that nation-building is not the
            government&rsquo;s responsibility alone. Every citizen has their own
            responsibility and role.
          </p>
          <p className="mt-3 text-center text-sm leading-relaxed text-white/50">
            <Hi>
              भारतीय नमो संघ का मानना है कि राष्ट्र निर्माण केवल सरकार की
              जिम्मेदारी नहीं है। प्रत्येक नागरिक की अपनी जिम्मेदारी और भूमिका
              है।
            </Hi>
          </p>
          <div className="mt-10 rounded-xl border border-white/15 bg-white/5 p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-saffron-400">
              An aware citizen
              <span className="ml-2 normal-case tracking-normal text-white/60">
                <Hi>एक जागरूक नागरिक—</Hi>
              </span>
            </p>
            <ul className="mt-5 space-y-3">
              {CITIZEN_ROLE.map((line) => (
                <li key={line.en} className="flex items-start gap-3">
                  <span
                    className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-saffron-400"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block text-sm text-white/85">
                      {line.en}
                    </span>
                    <span className="block text-sm text-white/50">
                      <Hi>{line.hi}</Hi>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-8 text-center text-sm text-white/60">
            Strengthening this civic spirit is among the organisation&rsquo;s
            foremost objectives.
          </p>
        </div>
      </section>

      {/* RESOLVE & GOAL */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Resolve */}
            <div className="rounded-xl bg-saffron-50 border border-saffron-200 p-8">
              <h2 className="font-heading text-2xl font-semibold text-navy">
                Our Resolve
              </h2>
              <p className="text-base text-saffron-800">
                <Hi>हमारा संकल्प</Hi>
              </p>
              <p className="mt-5 text-sm leading-relaxed text-navy/75">
                Through its workers and members, Bhartiya Namo Sangh resolves to
                strengthen the spirit of service, discipline, awareness,
                brotherhood and love for the nation in society. Our effort is
                that every worker of the organisation should be not merely an
                office-bearer, but a social worker, a responsible citizen and a
                participant in nation-building.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-navy/55">
                <Hi>
                  भारतीय नमो संघ अपने कार्यकर्ताओं और सदस्यों के माध्यम से समाज
                  में सेवा, अनुशासन, जागरूकता, भाईचारा और राष्ट्रप्रेम की भावना
                  को मजबूत करने का संकल्प लेता है। हमारा प्रयास है कि संगठन का
                  प्रत्येक कार्यकर्ता केवल पदाधिकारी न होकर समाजसेवी, जिम्मेदार
                  नागरिक और राष्ट्र निर्माण का सहभागी बने।
                </Hi>
              </p>
            </div>

            {/* Goal */}
            <div className="rounded-xl bg-saffron-50 border border-saffron-200 p-8">
              <h2 className="font-heading text-2xl font-semibold text-navy">
                Our Goal
              </h2>
              <p className="text-base text-saffron-800">
                <Hi>हमारा लक्ष्य</Hi>
              </p>
              <p className="mt-5 text-sm font-medium text-navy">
                A Bharat —{" "}
                <span className="text-navy/60">
                  <Hi>एक ऐसा भारत—</Hi>
                </span>
              </p>
              <ul className="mt-4 space-y-2.5">
                {GOAL_LINES.map((line) => (
                  <li key={line.en} className="flex items-start gap-3">
                    <span
                      className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-saffron-700"
                      aria-hidden="true"
                    />
                    <span className="text-sm">
                      <span className="block text-navy/80">{line.en}</span>
                      <span className="block text-navy/50">
                        <Hi>{line.hi}</Hi>
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-10 text-center font-heading text-lg font-semibold text-saffron-700">
            <TricolourMark className="h-5 w-7 mr-2" />
            <Hi>सशक्त भारत • आत्मनिर्भर भारत • संस्कारित भारत • एकजुट भारत</Hi>
          </p>
          <p className="mt-1 text-center text-sm text-navy/55">
            Strong Bharat • Self-Reliant Bharat • Cultured Bharat • United
            Bharat
          </p>
        </div>
      </section>

      {/* LEADERSHIP */}
      <section className="bg-white border-y border-saffron-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading en="Leadership" hi="नेतृत्व" />
          <div className="mt-12 flex flex-wrap justify-center gap-10">
            {LEADERSHIP.map((person) => (
              <div key={person.name} className="text-center">
                <div className="mx-auto h-24 w-24 rounded-full bg-saffron-200 flex items-center justify-center font-heading text-2xl font-semibold text-saffron-800">
                  {person.initials}
                </div>
                <h3 className="mt-4 font-semibold text-navy">{person.name}</h3>
                <p className="text-sm text-navy/60">
                  <Hi>{person.nameHi}</Hi>
                </p>
                <p className="mt-2 text-sm text-saffron-800">
                  {person.titleEn}
                  <span className="ml-1.5 text-navy/50">
                    <Hi>{person.titleHi}</Hi>
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOIN US */}
      <section className="bg-saffron-gradient text-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="font-heading text-3xl font-semibold">
            Join Bhartiya Namo Sangh
          </h2>
          <p className="mt-2 text-lg text-white/90">
            <Hi>भारतीय नमो संघ से जुड़ें</Hi>
          </p>
          <p className="mt-6 text-base leading-relaxed text-white/85">
            If you wish to contribute to the national interest, community
            service, public awareness and social development, you can join
            Bhartiya Namo Sangh.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            <Hi>
              यदि आप राष्ट्रहित, समाजसेवा, जनजागरूकता और सामाजिक विकास के कार्यों
              में अपना योगदान देना चाहते हैं, तो भारतीय नमो संघ से जुड़ सकते हैं।
            </Hi>
          </p>
          <div className="mt-8 rounded-xl border border-white/25 bg-white/10 p-6">
            <p className="text-sm text-white/85">
              For membership, social service activities and organisational
              information, get in touch:
            </p>
            <p className="mt-1 text-sm text-white/65">
              <Hi>
                संगठन से जुड़ने, सदस्यता, सामाजिक सेवा गतिविधियों एवं संगठनात्मक
                जानकारी के लिए संपर्क करें:
              </Hi>
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {CONTACT_PHONES.map((phone) => (
                <a
                  key={phone}
                  href={`tel:+91${phone}`}
                  className="flex items-center gap-2 text-lg font-semibold hover:text-white/80 transition-colors"
                >
                  <span aria-hidden="true">📞</span>
                  {phone}
                </a>
              ))}
              <a
                href={`https://${CONTACT_WEBSITE}`}
                className="flex items-center gap-2 text-sm font-medium hover:text-white/80 transition-colors"
              >
                <span aria-hidden="true">🌐</span>
                {CONTACT_WEBSITE}
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/contact"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-saffron-800 hover:bg-white/90 transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/branches"
              className="rounded-md border border-white/40 px-6 py-3 text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              Find a Branch
            </Link>
          </div>
          <p className="mt-10 border-t border-white/25 pt-6 text-sm text-white/85">
            <Hi>
              &ldquo;राष्ट्रहित में समर्पण • समाजसेवा में योगदान • संगठन में
              अनुशासन&rdquo;
            </Hi>
            <span className="mt-1 block text-white/65">
              Devotion to the nation • Contribution through service • Discipline
              within the organisation
            </span>
          </p>
        </div>
      </section>
    </>
  );
}
