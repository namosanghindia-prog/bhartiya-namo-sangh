/**
 * Membership ID helpers shared by the ID card (client) and the public
 * verification page (server).
 */

const STATE_CODES: Record<string, string> = {
  delhi: "DL",
  maharashtra: "MH",
  karnataka: "KA",
  rajasthan: "RJ",
  "uttar pradesh": "UP",
  gujarat: "GJ",
  "west bengal": "WB",
  "tamil nadu": "TN",
  "madhya pradesh": "MP",
};

/** Canonical public site; QR codes on printed cards must resolve here. */
export const SITE_URL = "https://www.bhartiyanamosangh.com";

export function getStateCode(state: string | null | undefined): string {
  if (!state) return "IN";
  return STATE_CODES[state.trim().toLowerCase()] || "IN";
}

/** e.g. membership_number 78 in Maharashtra → "BNMS/MH/MEM/0078" */
export function formatMembershipId(
  membershipNumber: number,
  state: string | null | undefined
): string {
  const padded = membershipNumber.toString().padStart(4, "0");
  return `BNMS/${getStateCode(state)}/MEM/${padded}`;
}

/** Compact value encoded in the Code128 barcode, e.g. "BNMS0078". */
export function barcodeValue(membershipNumber: number): string {
  return `BNMS${membershipNumber.toString().padStart(4, "0")}`;
}

export function verificationUrl(memberId: string): string {
  return `${SITE_URL}/verify/${memberId}`;
}
