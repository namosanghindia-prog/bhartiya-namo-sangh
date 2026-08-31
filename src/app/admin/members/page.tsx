"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MembershipCard from "@/components/MembershipCard";
import AppointmentLetter from "@/components/AppointmentLetter";
import type { Branch } from "@/lib/supabase/types";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: string;
  role: string;
  designation: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  branch_id: string | null;
  membership_type: string | null;
  membership_number: number | null;
  membership_issued_at: string | null;
  membership_expires_at: string | null;
  created_at: string;
  branch: { name: string; state: string | null }[] | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive" | "pending" | "suspended">("all");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showIdCard, setShowIdCard] = useState(false);
  const [showAppointmentLetter, setShowAppointmentLetter] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    const [membersRes, branchesRes] = await Promise.all([
      supabase
        .from("members")
        .select(`
          id, first_name, last_name, email, phone, avatar_url, status, role,
          designation, address, city, state, branch_id,
          membership_type, membership_number, membership_issued_at,
          membership_expires_at, created_at,
          branch:branches(name, state)
        `)
        .order("created_at", { ascending: false }),
      supabase
        .from("branches")
        .select("*")
        .eq("is_active", true)
        .order("name"),
    ]);

    if (membersRes.error) {
      console.error("Failed to load members:", membersRes.error);
    } else if (membersRes.data) {
      setMembers(membersRes.data as Member[]);
    }

    if (branchesRes.data) {
      setBranches(branchesRes.data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
      const matchesQuery =
        query.trim() === "" ||
        fullName.includes(query.toLowerCase()) ||
        (m.email && m.email.toLowerCase().includes(query.toLowerCase()));
      const matchesStatus = status === "all" || m.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [members, query, status]);

  function handleViewIdCard(member: Member) {
    setSelectedMember(member);
    setShowIdCard(true);
  }

  function closeIdCardModal() {
    setShowIdCard(false);
    setSelectedMember(null);
  }

  function handleViewAppointmentLetter(member: Member) {
    setSelectedMember(member);
    setShowAppointmentLetter(true);
  }

  function closeAppointmentLetterModal() {
    setShowAppointmentLetter(false);
    setSelectedMember(null);
  }

  function handleEdit(member: Member) {
    setEditingMember({ ...member });
    setShowEditModal(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingMember(null);
  }

  async function handleSaveEdit() {
    if (!editingMember) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("members")
      .update({
        first_name: editingMember.first_name,
        last_name: editingMember.last_name,
        phone: editingMember.phone,
        branch_id: editingMember.branch_id || null,
        role: editingMember.role,
        designation: editingMember.designation,
        address: editingMember.address,
        city: editingMember.city,
        state: editingMember.state,
      })
      .eq("id", editingMember.id);

    setSaving(false);

    if (error) {
      console.error("Failed to save member:", error);
      alert("Failed to save changes: " + error.message);
      return;
    }

    await loadData();
    closeEditModal();
  }

  async function handleToggleStatus(member: Member) {
    const newStatus = member.status === "active" ? "inactive" : "active";
    const action = newStatus === "inactive" ? "deactivate" : "activate";

    if (newStatus === "inactive") {
      if (!confirm(`Are you sure you want to deactivate ${member.first_name} ${member.last_name}?`)) {
        return;
      }
    }

    setProcessing(member.id);
    const supabase = createClient();

    const { error } = await supabase
      .from("members")
      .update({ status: newStatus })
      .eq("id", member.id);

    setProcessing(null);

    if (error) {
      console.error(`Failed to ${action} member:`, error);
      alert(`Failed to ${action} member: ` + error.message);
      return;
    }

    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, status: newStatus } : m))
    );
  }

  async function handleDelete(member: Member) {
    const message = `Are you sure you want to PERMANENTLY DELETE ${member.first_name} ${member.last_name}?\n\n` +
      `⚠️ This action CANNOT be undone.\n\n` +
      `This will delete their login account and all related records:\n` +
      `• Event registrations\n` +
      `• Donations\n` +
      `• Businesses\n` +
      `• Messages\n` +
      `• Activity logs\n\n` +
      `They will be able to sign up again with the same email as a new member.\n\n` +
      `Consider using "Deactivate" instead if you want to preserve their history.`;

    if (!confirm(message)) {
      return;
    }

    setProcessing(member.id);

    try {
      const response = await fetch("/api/admin/delete-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete member");
      }

      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (err) {
      console.error("Failed to delete member:", err);
      alert("Failed to delete member: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-navy">
          Members
        </h1>
        <button
          onClick={loadData}
          className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">Loading members...</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="rounded-xl border border-saffron-200 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-saffron-50 text-navy/70">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Branch</th>
                  <th className="text-left px-4 py-3 font-medium">Membership #</th>
                  <th className="text-left px-4 py-3 font-medium">Joined</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-t border-saffron-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {m.avatar_url ? (
                          <img
                            src={m.avatar_url}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-saffron-200 flex items-center justify-center text-xs font-semibold text-saffron-800">
                            {m.first_name[0]}{m.last_name[0]}
                          </div>
                        )}
                        <span className="font-medium text-navy">
                          {m.first_name} {m.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-navy/70">{m.email || "—"}</td>
                    <td className="px-4 py-3 text-navy/70">{m.branch?.[0]?.name || "—"}</td>
                    <td className="px-4 py-3 text-navy/70 font-mono text-xs">
                      {m.membership_number
                        ? `BNMS/${m.membership_number.toString().padStart(4, "0")}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-navy/70">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.status === "active"
                            ? "bg-forest/10 text-forest"
                            : m.status === "pending"
                            ? "bg-saffron-100 text-saffron-800"
                            : m.status === "suspended"
                            ? "bg-red-100 text-red-700"
                            : m.status === "approved_awaiting_payment"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-navy/10 text-navy/60"
                        }`}
                      >
                        {m.status === "approved_awaiting_payment" ? "awaiting payment" : m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {m.status === "active" && m.membership_number && (
                        <>
                          <button
                            onClick={() => handleViewIdCard(m)}
                            className="text-xs font-medium text-saffron-700 hover:text-saffron-800"
                          >
                            ID Card
                          </button>
                          <button
                            onClick={() => handleViewAppointmentLetter(m)}
                            className="text-xs font-medium text-saffron-700 hover:text-saffron-800"
                          >
                            Appointment Letter
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEdit(m)}
                        className="text-xs font-medium text-navy/60 hover:text-navy"
                      >
                        Edit
                      </button>
                      {(m.status === "active" || m.status === "inactive") && (
                        <button
                          onClick={() => handleToggleStatus(m)}
                          disabled={processing === m.id}
                          className={`text-xs font-medium ${
                            m.status === "active"
                              ? "text-orange-600 hover:text-orange-700"
                              : "text-forest hover:text-forest/80"
                          } disabled:opacity-50`}
                        >
                          {processing === m.id
                            ? "..."
                            : m.status === "active"
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(m)}
                        disabled={processing === m.id}
                        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {processing === m.id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-navy/50">
                      No members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-navy/50">
            Showing {filtered.length} of {members.length} members
          </p>
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && editingMember && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={closeEditModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold text-navy">
                  Edit Member
                </h2>
                <button onClick={closeEditModal} className="text-navy/50 hover:text-navy">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">First Name</label>
                    <input
                      type="text"
                      value={editingMember.first_name}
                      onChange={(e) => setEditingMember({ ...editingMember, first_name: e.target.value })}
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editingMember.last_name}
                      onChange={(e) => setEditingMember({ ...editingMember, last_name: e.target.value })}
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingMember.phone || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">Branch</label>
                  <select
                    value={editingMember.branch_id || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, branch_id: e.target.value || null })}
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  >
                    <option value="">No branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} — {b.city}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">Role</label>
                    <select
                      value={editingMember.role}
                      onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    >
                      <option value="member">Member</option>
                      <option value="branch_admin">Branch Admin</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">Designation</label>
                    <input
                      type="text"
                      value={editingMember.designation || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, designation: e.target.value })}
                      placeholder="e.g., Volunteer Lead"
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">Address</label>
                  <textarea
                    value={editingMember.address || ""}
                    onChange={(e) => setEditingMember({ ...editingMember, address: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">City/District</label>
                    <input
                      type="text"
                      value={editingMember.city || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, city: e.target.value })}
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">State</label>
                    <input
                      type="text"
                      value={editingMember.state || ""}
                      onChange={(e) => setEditingMember({ ...editingMember, state: e.target.value })}
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={closeEditModal}
                    className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ID Card Modal */}
      {showIdCard && selectedMember && selectedMember.membership_number && selectedMember.membership_issued_at && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={closeIdCardModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold text-navy">Member ID Card</h2>
                <button onClick={closeIdCardModal} className="text-navy/50 hover:text-navy">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex justify-center">
                <MembershipCard
                  member={{
                    id: selectedMember.id,
                    first_name: selectedMember.first_name,
                    last_name: selectedMember.last_name,
                    avatar_url: selectedMember.avatar_url,
                    membership_number: selectedMember.membership_number,
                    membership_issued_at: selectedMember.membership_issued_at,
                    membership_type: selectedMember.membership_type,
                    membership_expires_at: selectedMember.membership_expires_at,
                    designation: selectedMember.designation,
                    phone: selectedMember.phone,
                    branch: selectedMember.branch?.[0] || null,
                  }}
                  showDownload={true}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Appointment Letter Modal */}
      {showAppointmentLetter &&
        selectedMember &&
        selectedMember.membership_number &&
        selectedMember.membership_issued_at && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={closeAppointmentLetterModal} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-lg font-semibold text-navy">
                    Member Appointment Letter
                  </h2>
                  <button
                    onClick={closeAppointmentLetterModal}
                    className="text-navy/50 hover:text-navy"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex justify-center">
                  <AppointmentLetter
                    member={{
                      id: selectedMember.id,
                      first_name: selectedMember.first_name,
                      last_name: selectedMember.last_name,
                      avatar_url: selectedMember.avatar_url,
                      membership_number: selectedMember.membership_number,
                      membership_issued_at: selectedMember.membership_issued_at,
                      designation: selectedMember.designation,
                      branch: selectedMember.branch?.[0] || null,
                    }}
                    showDownload={true}
                  />
                </div>
              </div>
            </div>
          </>
        )}
    </div>
  );
}
