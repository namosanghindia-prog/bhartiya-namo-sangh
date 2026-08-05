"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface PendingMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  branch: { name: string }[] | null;
}

export default function ApprovalsPage() {
  const [members, setMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  async function loadPendingMembers() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("members")
      .select("id, first_name, last_name, email, phone, created_at, branch:branches(name)")
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

    const { error } = await supabase
      .from("members")
      .update({ status: "active" })
      .eq("id", memberId);

    if (error) {
      console.error("Failed to approve member:", error);
      alert("Failed to approve member: " + error.message);
    } else {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    }
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
        <div className="rounded-xl border border-saffron-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-saffron-50 border-b border-saffron-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-navy/70 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-navy/70 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-navy/70 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-navy/70 uppercase tracking-wider">
                    Signed Up
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-navy/70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-saffron-100">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-saffron-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-saffron-200 flex items-center justify-center font-heading text-sm font-semibold text-saffron-800">
                          {member.first_name[0]}
                          {member.last_name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-navy">
                            {member.first_name} {member.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-navy">{member.email}</div>
                      {member.phone && (
                        <div className="text-xs text-navy/60">{member.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-navy">
                        {member.branch?.[0]?.name || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-navy/70">
                        {formatDate(member.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(member.id)}
                          disabled={processing === member.id}
                          className="rounded-md bg-forest px-3 py-1.5 text-sm font-medium text-white hover:bg-forest/90 disabled:opacity-60"
                        >
                          {processing === member.id ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleReject(member.id)}
                          disabled={processing === member.id}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            Confirm the selected branch exists and is active
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-600">✗</span>
            Reject obvious spam accounts or duplicate registrations
          </li>
        </ul>
      </div>
    </div>
  );
}
