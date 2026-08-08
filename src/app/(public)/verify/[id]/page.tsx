import { createClient } from "@/lib/supabase/server";
import type { PublicMembershipVerification } from "@/lib/supabase/types";

interface Props {
  params: Promise<{ id: string }>;
}

function formatMembershipNumber(membershipNumber: number, issuedAt: string): string {
  const year = new Date(issuedAt).getFullYear().toString().slice(-2);
  const paddedNumber = membershipNumber.toString().padStart(4, "0");
  return `BNMS/MEM/${paddedNumber}/${year}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const MEMBERSHIP_TYPE_LABELS: Record<string, string> = {
  volunteer: "Volunteer Member",
  normal: "Member",
  premium: "Premium Member",
  lifetime: "Lifetime Member",
};

export default async function VerifyMemberPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("public_membership_verification")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 text-sm">
              This membership could not be verified. The membership ID may be
              invalid or the member may not be active.
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

  const verifiedMember = member as PublicMembershipVerification;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-saffron-50 to-white px-4 py-8">
      <div className="max-w-md w-full">
        {/* Tricolor bar */}
        <div className="h-2 flex rounded-t-2xl overflow-hidden">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white" />
          <div className="flex-1 bg-[#138808]" />
        </div>

        <div className="bg-white rounded-b-2xl shadow-lg border border-saffron-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-saffron-700 to-saffron-500 px-6 py-4 text-center">
            <h1 className="text-lg font-bold text-white">
              भारतीय नमो संघ
            </h1>
            <p className="text-xs text-white/90">
              BHARTIYA NAMO SANGH
            </p>
          </div>

          {/* Verified badge */}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <div className="px-6 pt-4 pb-6">
            <h2 className="text-center text-xl font-semibold text-[#138808] mb-1">
              Verified Member
            </h2>
            <p className="text-center text-sm text-gray-500 mb-6">
              सत्यापित सदस्य
            </p>

            {/* Membership type badge */}
            {verifiedMember.membership_type && verifiedMember.membership_type !== "normal" && verifiedMember.membership_type !== "volunteer" && (
              <div className="flex justify-center mb-4">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    verifiedMember.membership_type === "lifetime"
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
                      : "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white"
                  }`}
                >
                  {verifiedMember.membership_type === "lifetime" && <span>★</span>}
                  {MEMBERSHIP_TYPE_LABELS[verifiedMember.membership_type]}
                </span>
              </div>
            )}

            {/* Member info */}
            <div className="flex items-center gap-4 mb-6">
              {verifiedMember.photo ? (
                <img
                  src={verifiedMember.photo}
                  alt=""
                  className={`h-20 w-20 rounded-full object-cover border-2 ${
                    verifiedMember.membership_type === "lifetime"
                      ? "border-yellow-400"
                      : verifiedMember.membership_type === "premium"
                      ? "border-saffron-400"
                      : "border-saffron-200"
                  }`}
                />
              ) : (
                <div className={`h-20 w-20 rounded-full bg-saffron-100 flex items-center justify-center border-2 ${
                  verifiedMember.membership_type === "lifetime"
                    ? "border-yellow-400"
                    : verifiedMember.membership_type === "premium"
                    ? "border-saffron-400"
                    : "border-saffron-200"
                }`}>
                  <span className="text-2xl font-bold text-saffron-700">
                    {verifiedMember.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {verifiedMember.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {verifiedMember.branch_name || "Member"}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Membership No.</span>
                <span className="font-mono font-semibold text-gray-900">
                  {formatMembershipNumber(
                    verifiedMember.membership_number,
                    verifiedMember.membership_issued_at
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#138808]/10 text-[#138808] text-sm font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#138808]" />
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Member Since</span>
                <span className="text-sm text-gray-900">
                  {formatDate(verifiedMember.membership_issued_at)}
                </span>
              </div>
              {verifiedMember.branch_name && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Branch</span>
                  <span className="text-sm text-gray-900">
                    {verifiedMember.branch_name}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Valid Until</span>
                <span className={`text-sm font-medium ${
                  verifiedMember.membership_type === "lifetime" ? "text-yellow-600" : "text-gray-900"
                }`}>
                  {verifiedMember.membership_type === "lifetime"
                    ? "Lifetime"
                    : verifiedMember.membership_expires_at
                    ? formatDate(verifiedMember.membership_expires_at)
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-100 px-6 py-3 text-center">
            <p className="text-xs text-gray-400">
              Verified on {new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>

        {/* Attribution */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Bhartiya Namo Sangh Membership Verification System
        </p>
      </div>
    </div>
  );
}
