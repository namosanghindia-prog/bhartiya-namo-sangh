/**
 * Membership plans offered on the application forms. Plain module: the forms
 * show the prices, and the server works the fee out from the chosen plan
 * rather than taking an amount from the browser.
 */
export const MEMBERSHIP_TIERS = {
  volunteer: { name: "Volunteer", nameHi: "स्वयंसेवक", price: 101, period: "/year", periodHi: "/वर्ष" },
  normal: { name: "Normal", nameHi: "सामान्य", price: 1100, period: "/year", periodHi: "/वर्ष" },
  premium: { name: "Premium", nameHi: "प्रीमियम", price: 11000, period: "/year", periodHi: "/वर्ष" },
  lifetime: { name: "Lifetime", nameHi: "आजीवन", price: 99999, period: "one-time", periodHi: "एकमुश्त" },
} as const;

export type MembershipTier = keyof typeof MEMBERSHIP_TIERS;

export function isMembershipTier(value: unknown): value is MembershipTier {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(MEMBERSHIP_TIERS, value);
}
