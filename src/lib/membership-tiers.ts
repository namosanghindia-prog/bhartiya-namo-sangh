/**
 * Membership plans offered on the application forms. Plain module: the forms
 * show the prices, and the server works the fee out from the chosen plan
 * rather than taking an amount from the browser.
 */
export const MEMBERSHIP_TIERS = {
  volunteer: {
    name: "Volunteer",
    nameHi: "स्वयंसेवक",
    price: 101,
    period: "/year",
    periodHi: "/वर्ष",
    blurbEn: "Annual membership for those who wish to contribute through volunteering.",
    blurbHi: "स्वयंसेवा के माध्यम से योगदान देने वालों के लिए वार्षिक सदस्यता।",
  },
  normal: {
    name: "General",
    nameHi: "सामान्य",
    price: 1100,
    period: "/year",
    periodHi: "/वर्ष",
    blurbEn: "Regular annual membership in the organisation.",
    blurbHi: "संगठन में नियमित वार्षिक सदस्यता।",
  },
  premium: {
    name: "Premium",
    nameHi: "प्रीमियम",
    price: 11000,
    period: "/year",
    periodHi: "/वर्ष",
    blurbEn: "Annual membership at the premium contribution.",
    blurbHi: "प्रीमियम योगदान पर वार्षिक सदस्यता।",
  },
  lifetime: {
    name: "Lifetime",
    nameHi: "आजीवन",
    price: 99999,
    period: "one-time",
    periodHi: "एकमुश्त",
    blurbEn: "A one-time membership contribution. Best value over the long term.",
    blurbHi: "एकमुश्त सदस्यता योगदान। लंबे समय में सर्वोत्तम मूल्य।",
  },
} as const;

/** Benefits every confirmed member actually receives in the current system. */
export const MEMBERSHIP_SHARED_BENEFITS = [
  { en: "Membership in Bhartiya Namo Sangh", hi: "भारतीय नमो संघ की सदस्यता" },
  { en: "Application reviewed by the organisation", hi: "आवेदन संगठन द्वारा समीक्षित" },
  { en: "Digital ID card after membership is confirmed", hi: "सदस्यता पुष्टि के बाद डिजिटल पहचान पत्र" },
  { en: "Participate in published events", hi: "प्रकाशित कार्यक्रमों में भाग लेना" },
  { en: "Volunteer in organisational programmes", hi: "संगठन के कार्यक्रमों में स्वयंसेवा" },
] as const;

export type MembershipTier = keyof typeof MEMBERSHIP_TIERS;

export function isMembershipTier(value: unknown): value is MembershipTier {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(MEMBERSHIP_TIERS, value);
}
