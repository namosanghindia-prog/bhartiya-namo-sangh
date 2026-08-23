"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import MembershipCard, { formatMembershipId } from "@/components/MembershipCard";

interface MemberWithBranch {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  status: string;
  membership_type: string | null;
  membership_number: number | null;
  membership_issued_at: string | null;
  membership_expires_at: string | null;
  designation: string | null;
  branch: { name: string; state: string | null } | null;
}

export default function IDCardPage() {
  const [member, setMember] = useState<MemberWithBranch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMember() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("members")
          .select("*, branch:branches(name, state)")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Failed to load member:", error);
        } else if (data) {
          setMember(data as MemberWithBranch);
        }
      }
      setLoading(false);
    }
    loadMember();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy">
            My ID Card
          </h1>
          <p className="mt-1 text-sm text-navy/60">
            Your official membership ID card
          </p>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy">
            My ID Card
          </h1>
          <p className="mt-1 text-sm text-navy/60">
            Your official membership ID card
          </p>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">Unable to load your information.</p>
        </div>
      </div>
    );
  }

  const isApproved = member.status === "active" && member.membership_number !== null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-navy">
          My ID Card
        </h1>
        <p className="mt-1 text-sm text-navy/60">
          Your official membership ID card
        </p>
      </div>

      {isApproved ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <div className="flex flex-col items-center">
            <MembershipCard
              member={{
                id: member.id,
                first_name: member.first_name,
                last_name: member.last_name,
                avatar_url: member.avatar_url,
                membership_number: member.membership_number!,
                membership_issued_at: member.membership_issued_at!,
                membership_type: member.membership_type,
                membership_expires_at: member.membership_expires_at,
                designation: member.designation,
                branch: member.branch,
              }}
              showDownload={true}
            />
          </div>

          <div className="mt-6 pt-6 border-t border-saffron-100">
            <h3 className="font-heading text-sm font-semibold text-navy mb-2">
              About your ID Card
            </h3>
            <ul className="space-y-2 text-sm text-navy/70">
              <li className="flex items-start gap-2">
                <span className="text-saffron-600">•</span>
                This is your official Bhartiya Namo Sangh membership ID card
              </li>
              <li className="flex items-start gap-2">
                <span className="text-saffron-600">•</span>
                Download the card and keep it safe for events and activities
              </li>
              <li className="flex items-start gap-2">
                <span className="text-saffron-600">•</span>
                The QR code can be scanned to verify your membership
              </li>
              <li className="flex items-start gap-2">
                <span className="text-saffron-600">•</span>
                Your unique membership number: {formatMembershipId(member.membership_number!, member.branch?.state)}
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <div className="text-4xl mb-3">⏳</div>
          <h2 className="font-heading text-lg font-semibold text-navy">
            Your ID Card is Pending
          </h2>
          <p className="mt-2 text-sm text-navy/60 max-w-md mx-auto">
            Your ID card will be available once your membership is approved by an administrator.
            You will receive a notification when your membership is activated.
          </p>
          {member.status === "pending" && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-saffron-100 px-3 py-1 text-sm text-saffron-800">
              <span className="h-2 w-2 rounded-full bg-saffron-500 animate-pulse" />
              Application under review
            </div>
          )}
        </div>
      )}
    </div>
  );
}

