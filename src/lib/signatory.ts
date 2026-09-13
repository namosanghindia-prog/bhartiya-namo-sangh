/**
 * The office-bearer who signs on the organisation's behalf.
 *
 * One definition, deliberately. This lived inside AppointmentLetter as a local
 * const, and when the welcome email grew its own signature block the two
 * drifted — a member could receive a welcome from one name and an appointment
 * letter signed by another. Anything that signs for the organisation reads it
 * from here.
 *
 * Plain module with neither "use client" nor "server-only", because the letter
 * is a client component and the email templates are server-only, and both need
 * it.
 */
export const SIGNATORY = {
  /** Rendered on the letter. Missing from public/ at present, which the
   *  SignatureImage fallback handles by leaving the space blank. */
  image: "/signature-president.png",
  name: "डॉ. मनोज कुमार (मनु तोमर)",
  role: "राष्ट्रीय अध्यक्ष",
  org: "भारतीय नमो संघ (BNMS)",
  note: "पूर्व राष्ट्रीय प्रवक्ता – वर्ल्ड वेदांत इंस्टीट्यूट",

  /** Transliterated, for the email signature only — the letter is Hindi
   *  throughout and uses none of these. */
  nameEn: "Dr. Manoj Kumar (Manu Tomar)",
  roleEn: "National President",
} as const;
