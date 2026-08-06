"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface PendingMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  father_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  avatar_url: string | null;
  membership_type: string | null;
  membership_fee_amount: number | null;
  created_at: string;
  branch: { name: string }[] | null;
}

const MEMBERSHIP_LABELS: Record<string, string> = {
  normal: "Normal (₹1,100/year)",
  premium: "Premium (₹11,000/year)",
  lifetime: "Lifetime (₹99,999)",
};

export default function ApprovalsPage() {
  const [members, setMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  async function loadPendingMembers() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("members")
      .select(`
        id, first_name, last_name, email, phone, father_name,
        address, city, state, avatar_url, membership_type,
        membership_fee_amount, created_at,
        branch:branches(name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load pending members:", error);
    } else if (data) {
      setMembers(data as PendingMember[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPendingMembers();
  }, []);

  async function handleApprove(memberId: string) {
    setProcessing(memberId);
    const supabase = createClient();

    const { error } = await supabase.rpc("approve_member_eligibility", {
      member_id: memberId,
    });

    if (error) {
      if (error.message.includes("does not exist")) {
        const { error: fallbackError } = await supabase
          .from("members")
          .update({ status: "approved_awaiting_payment" })
          .eq("id", memberId);

        if (fallbackError) {
          console.error("Failed to approve member:", fallbackError);
          alert("Failed to approve member: " + fallbackError.message);
          setProcessing(null);
          return;
        }
      } else {
        console.error("Failed to approve member:", error);
        alert("Failed to approve member: " + error.message);
        setProcessing(null);
        return;
      }
    }

    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    setExpandedMember(null);
    setProcessing(null);
  }

  async function handleReject(memberId: string) {
    if (!confirm("Are you sure you want to reject this member? Their account will be suspended.")) {
      return;
    }

    setProcessing(memberId);
    const supabase = createClient();

    const { error } = await supabase
      .from("members")
      .update({ status: "suspended" })
      .eq("id", memberId);

    if (error) {
      console.error("Failed to reject member:", error);
      alert("Failed to reject member: " + error.message);
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setExpandedMember(null);
    }
    setProcessing(null);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function toggleExpand(memberId: string) {
    setExpandedMember(expandedMember === memberId ? null : memberId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy">
            Member Approvals
          </h1>
          <p className="mt-1 text-sm text-navy/60">
            Review and approve new member registrations
          </p>
        </div>
        <button
          onClick={loadPendingMembers}
          className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">Loading pending members...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="font-heading text-lg font-semibold text-navy">
            All caught up!
          </h2>
          <p className="mt-2 text-sm text-navy/60">
            No pending member approvals at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="rounded-xl border border-saffron-200 bg-white overflow-hidden"
            >
              {/* Collapsed row header */}
              <div
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-saffron-50/50"
                onClick={() => toggleExpand(member.id)}
              >
                <div className="flex items-center gap-4">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-saffron-200 flex items-center justify-center font-heading text-sm font-semibold text-saffron-800">
                      {member.first_name[0]}
                      {member.last_name[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-navy">
                      {member.first_name} {member.last_name}
                    </div>
                    <div className="text-sm text-navy/60">
                      {member.branch?.[0]?.name || "No branch"} | Applied {formatDate(member.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-navy/50">
                    {expandedMember === member.id ? "▲ Hide Details" : "▼ View Details"}
                  </span>
                </div>
              </div>

              {/* Expanded details */}
              {expandedMember === member.id && (
                <div className="border-t border-saffron-100 px-6 py-5 bg-saffron-50/30">
                  <h3 className="font-heading text-sm font-semibold text-navy mb-4">
                    Application Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-navy/60">Full Name:</span>
                      <p className="font-medium text-navy">
                        {member.first_name} {member.last_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-navy/60">Father&apos;s / Husband&apos;s Name:</span>
                      <p className="font-medium text-navy">
                        {member.father_name || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-navy/60">Mobile:</span>
                      <p className="font-medium text-navy">
                        {member.phone || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-navy/60">Email:</span>
                      <p className="font-medium text-navy">
                        {member.email || "—"}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-navy/60">Full Address:</span>
                      <p className="font-medium text-navy">
                        {member.address || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-navy/60">District:</span>
                      <p className="font-medium text-navy">
                        {member.city || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-navy/60">State:</span>
                      <p className="font-medium text-navy">
                        {member.state || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-navy/60">Branch:</span>
                      <p className="font-medium text-navy">
                        {member.branch?.[0]?.name || "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-navy/60">Signed Up:</span>
                      <p className="font-medium text-navy">
                        {formatDate(member.created_at)}
                      </p>
                    </div>
                    <div>
                      <span className="text-navy/60">Membership Type:</span>
                      <p className="font-medium text-navy">
                        {member.membership_type
                          ? MEMBERSHIP_LABELS[member.membership_type] || member.membership_type
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-navy/60">Membership Fee:</span>
                      <p className="font-medium text-navy">
                        {member.membership_fee_amount
                          ? `₹${member.membership_fee_amount.toLocaleString("en-IN")}`
                          : "—"}
                      </p>
                    </div>
                    {member.avatar_url && (
                      <div className="md:col-span-2">
                        <span className="text-navy/60">Photo:</span>
                        <div className="mt-2">
                          <img
                            src={member.avatar_url}
                            alt="Member photo"
                            className="h-24 w-24 rounded-lg object-cover border border-saffron-200"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-saffron-100">
                    <button
                      onClick={() => handleReject(member.id)}
                      disabled={processing === member.id}
                      className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {processing === member.id ? "..." : "Reject"}
                    </button>
                    <button
                      onClick={() => handleApprove(member.id)}
                      disabled={processing === member.id}
                      className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest/90 disabled:opacity-60"
                    >
                      {processing === member.id ? "..." : "Approve Application"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-saffron-200 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold text-navy mb-3">
          Approval Guidelines
        </h2>
        <ul className="space-y-2 text-sm text-navy/70">
          <li className="flex items-start gap-2">
            <span className="text-forest">✓</span>
            Verify the member&apos;s email appears legitimate (not disposable)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-forest">✓</span>
            Check if the phone number format is valid for India (+91...)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-forest">✓</span>
            Review the address and district details for accuracy
          </li>
          <li className="flex items-start gap-2">
            <span className="text-forest">✓</span>
            Confirm the selected branch exists and is active
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-600">✗</span>
            Reject obvious spam accounts or duplicate registrations
          </li>
        </ul>
        <p className="mt-4 text-xs text-navy/50">
          Upon approval, the member will be prompted to pay their membership fee.
          Membership number is assigned after payment confirmation.
        </p>
      </div>
    </div>
  );
}
