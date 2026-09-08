"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  AVATAR_ACCEPTED_TYPES,
  AVATAR_MAX_BYTES,
  removeSupersededAvatars,
  uploadAvatar,
} from "@/lib/avatar";
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
  gender: string | null;
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

/**
 * Statuses a member reaches only once an admin has approved their application.
 * A photo an admin sets becomes that member's ID card and appointment letter
 * photo, so it is offered for approved members only — never for an application
 * still awaiting review, or one that was turned down.
 */
const APPROVED_STATUSES = ["active", "inactive", "approved_awaiting_payment"];

function isApproved(member: Member) {
  return APPROVED_STATUSES.includes(member.status);
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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    const [membersRes, branchesRes] = await Promise.all([
      supabase
        .from("members")
        .select(`
          id, first_name, last_name, email, phone, avatar_url, status, role,
          designation, gender, address, city, state, branch_id,
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

  // The two columns. Approval is the split that matters day to day: who is a
  // member, and who is still waiting on (or was refused) a decision.
  const approved = useMemo(() => filtered.filter(isApproved), [filtered]);
  const unapproved = useMemo(
    () => filtered.filter((m) => !isApproved(m)),
    [filtered]
  );

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
    setPhotoError(null);
    setShowEditModal(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingMember(null);
    setPhotoError(null);
  }

  /**
   * Replaces a member's profile photo on the admin's behalf.
   *
   * This saves on its own rather than waiting for "Save Changes": the file has
   * already been uploaded to storage by then, so writing the URL immediately is
   * what keeps the record and the bucket agreeing with each other.
   */
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Clear the input so picking the same file again still fires a change.
    e.target.value = "";
    if (!file || !editingMember) return;

    if (!AVATAR_ACCEPTED_TYPES.includes(file.type)) {
      setPhotoError("Please select a JPG, PNG, or WebP image");
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      setPhotoError("Image must be less than 2MB");
      return;
    }

    setUploadingPhoto(true);
    setPhotoError(null);

    const supabase = createClient();
    const memberId = editingMember.id;

    const { publicUrl, error: uploadError } = await uploadAvatar(
      supabase,
      memberId,
      file,
      file.type
    );

    if (uploadError || !publicUrl) {
      setUploadingPhoto(false);
      setPhotoError(uploadError || "Upload failed");
      return;
    }

    const { error: updateError } = await supabase
      .from("members")
      .update({ avatar_url: publicUrl })
      .eq("id", memberId);

    if (updateError) {
      setUploadingPhoto(false);
      setPhotoError(updateError.message);
      return;
    }

    await removeSupersededAvatars(supabase, memberId, publicUrl);

    setUploadingPhoto(false);
    setEditingMember((prev) =>
      prev && prev.id === memberId ? { ...prev, avatar_url: publicUrl } : prev
    );
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, avatar_url: publicUrl } : m))
    );
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
      // The route's message already says what went wrong; prefixing it again
      // is what produced "Failed to delete member: Failed to delete member:".
      alert(err instanceof Error ? err.message : "Failed to delete member.");
    } finally {
      setProcessing(null);
    }
  }

  function renderMemberCard(m: Member) {
    return (
      <li key={m.id} className="border-t border-saffron-100 p-4">
        <div className="flex items-start gap-3">
          {m.avatar_url ? (
            <img
              src={m.avatar_url}
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-full bg-saffron-200 flex items-center justify-center text-xs font-semibold text-saffron-800">
              {m.first_name[0]}
              {m.last_name[0]}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-navy break-words">
                {m.first_name} {m.last_name}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
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
                {m.status === "approved_awaiting_payment"
                  ? "awaiting payment"
                  : m.status}
              </span>
            </div>

            <p className="text-xs text-navy/70 break-all">{m.email || "—"}</p>
            <p className="mt-1 text-xs text-navy/50">
              {m.branch?.[0]?.name || "No branch"}
              {" · "}
              {m.membership_number
                ? `BNMS/${m.membership_number.toString().padStart(4, "0")}`
                : "No membership number"}
              {" · joined "}
              {formatDate(m.created_at)}
            </p>

            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
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
            </div>
          </div>
        </div>
      </li>
    );
  }

  function renderColumn(title: string, list: Member[], emptyText: string) {
    return (
      <div className="rounded-xl border border-saffron-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3 bg-saffron-50 rounded-t-xl">
          <h2 className="font-heading text-sm font-semibold text-navy">
            {title}
          </h2>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-navy/60">
            {list.length}
          </span>
        </div>
        {list.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-navy/50">
            {emptyText}
          </p>
        ) : (
          <ul>{list.map(renderMemberCard)}</ul>
        )}
      </div>
    );
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
          {/* Approved and unapproved side by side */}
          <div className="grid gap-6 lg:grid-cols-2 items-start">
            {renderColumn(
              "Approved members",
              approved,
              "No approved members match this filter."
            )}
            {renderColumn(
              "Not yet approved",
              unapproved,
              "No unapproved members match this filter."
            )}
          </div>
          <p className="text-xs text-navy/50">
            Showing {filtered.length} of {members.length} members —{" "}
            {approved.length} approved, {unapproved.length} not approved
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
                {isApproved(editingMember) && (
                  <div className="rounded-lg border border-saffron-100 bg-saffron-50/50 p-4">
                    <label className="block text-sm font-medium text-navy/70 mb-2">
                      Profile Photo
                    </label>
                    <div className="flex items-center gap-4">
                      {editingMember.avatar_url ? (
                        <img
                          src={editingMember.avatar_url}
                          alt=""
                          className="h-16 w-16 rounded-full object-cover border-2 border-saffron-200"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-saffron-200 flex items-center justify-center font-heading text-lg font-semibold text-saffron-800 border-2 border-saffron-300">
                          {editingMember.first_name[0]}
                          {editingMember.last_name[0]}
                        </div>
                      )}
                      <div>
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept={AVATAR_ACCEPTED_TYPES.join(",")}
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50 disabled:opacity-60"
                        >
                          {uploadingPhoto
                            ? "Uploading..."
                            : editingMember.avatar_url
                            ? "Change Photo"
                            : "Upload Photo"}
                        </button>
                        <p className="mt-1 text-xs text-navy/50">
                          JPG, PNG or WebP. Max 2MB. Saves straight away.
                        </p>
                      </div>
                    </div>
                    {photoError && (
                      <p className="mt-2 text-xs text-red-600">{photoError}</p>
                    )}
                  </div>
                )}

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
                      gender: selectedMember.gender,
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
