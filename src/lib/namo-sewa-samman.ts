/**
 * नमो सेवा सम्मान - 2026 — the one-off public event with its own registration
 * form, invitation letter and QR verification.
 *
 * Plain module with neither "use client" nor "server-only": the admin list
 * (client) formats registration numbers, and the register route and the
 * verification page (server) need the same formatting and URLs.
 */
import { SITE_URL } from "@/lib/membership";

/** Matches the column default on public_event_registrations.event_slug. */
export const EVENT_SLUG = "namo-sewa-samman-2026";

export const EVENT = {
  nameHi: "नमो सेवा सम्मान - 2026",
  taglineHi: "एक शाम मोदी जी के नाम",
  dateHi: "बुधवार, 16 सितम्बर, 2026",
  dateEn: "Wednesday, 16 September 2026",
  timeHi: "सायं 3:00 बजे से",
  timeEn: "From 3:00 PM",
  venue: "NDMC Convention Centre, New Delhi",
  poster: "/namo-sewa-samman-2026-poster.jpg",
  pagePath: `/events/${EVENT_SLUG}`,
} as const;

/** e.g. registration_number 7 → "BNMS/NSS2026/0007" */
export function formatRegistrationNumber(registrationNumber: number): string {
  return `BNMS/NSS2026/${registrationNumber.toString().padStart(4, "0")}`;
}

/** Where the invitation letter's QR code points. Canonical domain, as on the ID card. */
export function registrationVerificationUrl(registrationId: string): string {
  return `${SITE_URL}/verify-registration/${registrationId}`;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Rejects anything that is not a uuid before it reaches a query. */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
