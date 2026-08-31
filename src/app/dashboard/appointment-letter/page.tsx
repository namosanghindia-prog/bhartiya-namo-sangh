"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppointmentLetter, { formatAppointmentSerial } from "@/components/AppointmentLetter";

interface MemberWithBranch {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  status: string;
  membership_number: number | null;
  membership_issued_at: string | null;
  designation: string | null;
  branch: { name: string; state: string | null } | null;
}

function PageHeading() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-navy">Appointment Letter</h1>
      <p className="mt-1 text-sm text-navy/60">
        Your official नियुक्ति पत्र from Bhartiya Namo Sangh
      </p>
    </div>
  );
}

export default function AppointmentLetterPage() {
  const [member, setMember] = useState<MemberWithBranch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMember() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("members")
          .select(
            "id, first_name, last_name, avatar_url, status, membership_number, membership_issued_at, designation, branch:branches(name, state)"
          )
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Failed to load member:", error);
        } else if (data) {
          setMember(data as unknown as MemberWithBranch);
        }
      }
      setLoading(false);
    }
    loadMember();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeading />
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-6">
        <PageHeading />
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">Unable to load your information.</p>
        </div>
      </div>
    );
  }

  // Same gating as the ID card: an approved, numbered membership.
  const isApproved = member.status === "active" && member.membership_number !== null;

  return (
    <div className="space-y-6">
      <PageHeading />

      {isApproved ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <div className="flex flex-col items-center">
            <AppointmentLetter
              member={{
                id: member.id,
                first_name: member.first_name,
                last_name: member.last_name,
                avatar_url: member.avatar_url,
                membership_number: member.membership_number!,
                membership_issued_at: member.membership_issued_at!,
                designation: member.designation,
                branch: member.branch,
              }}
              showDownload={true}
            />
          </div>

          <div className="mt-6 border-t border-saffron-100 pt-6">
            <h3 className="font-heading mb-2 text-sm font-semibold text-navy">
              About your Appointment Letter
            </h3>
            <ul className="space-y-2 text-sm text-navy/70">
              <li className="flex items-start gap-2">
                <span className="text-saffron-600">•</span>
                Download it as an A4 PDF and print it at 100% scale
              </li>
              <li className="flex items-start gap-2">
                <span className="text-saffron-600">•</span>
                The QR code is the same one on your ID card and verifies your membership
              </li>
              <li className="flex items-start gap-2">
                <span className="text-saffron-600">•</span>
                Letter serial number:{" "}
                {formatAppointmentSerial(member.membership_number!, member.branch?.state)}
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <div className="mb-3 text-4xl">⏳</div>
          <h2 className="font-heading text-lg font-semibold text-navy">
            Your Appointment Letter is Pending
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-navy/60">
            Your appointment letter will be available once your membership is approved by an
            administrator. You will receive a notification when your membership is activated.
          </p>
          {member.status === "pending" && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-saffron-100 px-3 py-1 text-sm text-saffron-800">
              <span className="h-2 w-2 animate-pulse rounded-full bg-saffron-500" />
              Application under review
            </div>
          )}
        </div>
      )}
    </div>
  );
}
