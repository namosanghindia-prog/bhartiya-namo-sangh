import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import {
  EVENT,
  EVENT_SLUG,
  formatRegistrationNumber,
  isUuid,
} from "@/lib/namo-sewa-samman";

export const metadata: Metadata = {
  title: `Registration Verification | ${EVENT.nameHi}`,
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

interface VerifiedRegistration {
  full_name: string;
  registration_number: number;
}

/**
 * Looked up with the service role because public_event_registrations is
 * admin-read-only. Only the name and number leave this function — never the
 * mobile, email or address — and every failure (malformed id, unknown id,
 * another event's row, a database error) collapses into the same null, so the
 * page cannot be used to probe which ids exist.
 */
async function findRegistration(id: string): Promise<VerifiedRegistration | null> {
  if (!isUuid(id)) return null;

  const supabase = createServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("public_event_registrations")
    .select("full_name, registration_number")
    .eq("id", id)
    .eq("event_slug", EVENT_SLUG)
    .maybeSingle();

  if (error) {
    console.error("[verify-registration] Lookup failed:", error);
    return null;
  }

  return data;
}

export default async function VerifyRegistrationPage({ params }: Props) {
  const { id } = await params;
  const registration = await findRegistration(id);

  if (!registration) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              Registration Not Found
            </h1>
            <p className="font-devanagari text-sm text-gray-500 mb-3">पंजीकरण नहीं मिला</p>
            <p className="text-gray-600 text-sm">
              This registration could not be verified. The link may be invalid.
            </p>
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                If you believe this is an error, please contact Bhartiya Namo Sangh
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-saffron-50 to-white px-4 py-12">
      <div className="max-w-md w-full">
        {/* Tricolor bar */}
        <div className="h-2 flex rounded-t-2xl overflow-hidden">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        <div className="bg-white rounded-b-2xl shadow-lg border border-saffron-200 overflow-hidden">
          <div className="bg-gradient-to-r from-saffron-700 to-saffron-500 px-6 py-4 text-center">
            <h1 className="font-devanagari text-lg font-bold text-white">{EVENT.nameHi}</h1>
            <p className="font-devanagari text-xs text-white/90">{EVENT.taglineHi}</p>
          </div>

          <div className="flex justify-center -mt-6">
            <div className="bg-[#138808] rounded-full p-3 shadow-lg border-4 border-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div className="px-6 pt-4 pb-6">
            <h2 className="text-center text-xl font-semibold text-[#138808] mb-1">
              ✓ Registered
            </h2>
            <p className="font-devanagari text-center text-sm text-gray-500 mb-6">
              पंजीकृत अतिथि
            </p>

            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-500">Name</span>
                <span className="text-right font-semibold text-gray-900">
                  {registration.full_name}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-500">Registration No.</span>
                <span className="font-mono font-semibold text-gray-900">
                  {formatRegistrationNumber(registration.registration_number)}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-right text-sm text-gray-900">{EVENT.dateEn}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-sm text-gray-500">Venue</span>
                <span className="text-right text-sm text-gray-900">{EVENT.venue}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Bhartiya Namo Sangh Event Registration Verification
        </p>
      </div>
    </div>
  );
}
