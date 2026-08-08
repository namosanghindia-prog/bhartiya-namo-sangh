"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Branch } from "@/lib/supabase/types";

interface BranchWithCount extends Branch {
  member_count: number;
}

type BranchFormData = {
  name: string;
  slug: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  manager_name: string;
  established_year: string;
  is_active: boolean;
};

const emptyForm: BranchFormData = {
  name: "",
  slug: "",
  city: "",
  state: "",
  address: "",
  phone: "",
  email: "",
  manager_name: "",
  established_year: new Date().getFullYear().toString(),
  is_active: true,
};

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<BranchWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchWithCount | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadBranches() {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .order("name");

    if (error) {
      console.error("Failed to load branches:", error);
      setLoading(false);
      return;
    }

    setBranches((data || []) as BranchWithCount[]);
    setLoading(false);
  }

  useEffect(() => {
    loadBranches();
  }, []);

  function openNewBranchModal() {
    setEditingBranch(null);
    setFormData(emptyForm);
    setShowModal(true);
  }

  function openEditModal(branch: BranchWithCount) {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      slug: branch.slug,
      city: branch.city,
      state: branch.state,
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
      manager_name: branch.manager_name || "",
      established_year: branch.established_year?.toString() || "",
      is_active: branch.is_active,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingBranch(null);
    setFormData(emptyForm);
  }

  function handleNameChange(name: string) {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingBranch ? prev.slug : generateSlug(name),
    }));
  }

  async function handleSave() {
    if (!formData.name.trim() || !formData.city.trim() || !formData.state.trim()) {
      alert("Please fill in required fields: Name, City, and State");
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const branchData = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || generateSlug(formData.name),
      city: formData.city.trim(),
      state: formData.state.trim(),
      address: formData.address.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      manager_name: formData.manager_name.trim() || null,
      established_year: formData.established_year ? parseInt(formData.established_year) : null,
      is_active: formData.is_active,
    };

    if (editingBranch) {
      const { error } = await supabase
        .from("branches")
        .update(branchData)
        .eq("id", editingBranch.id);

      setSaving(false);

      if (error) {
        console.error("Failed to update branch:", error);
        alert("Failed to update branch: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("branches").insert(branchData);

      setSaving(false);

      if (error) {
        console.error("Failed to create branch:", error);
        if (error.message.includes("duplicate") || error.message.includes("unique")) {
          alert("A branch with this slug already exists. Please use a different name.");
        } else {
          alert("Failed to create branch: " + error.message);
        }
        return;
      }
    }

    await loadBranches();
    closeModal();
  }

  async function handleDelete(branch: BranchWithCount) {
    setDeleting(branch.id);
    const supabase = createClient();

    const { count, error: countError } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("branch_id", branch.id);

    if (countError) {
      console.error("Failed to check members:", countError);
      alert("Failed to check if branch has members: " + countError.message);
      setDeleting(null);
      return;
    }

    if (count && count > 0) {
      alert(
        `Cannot delete "${branch.name}" — ${count} member${count > 1 ? "s are" : " is"} assigned to this branch.\n\n` +
        `Please reassign or deactivate them first.`
      );
      setDeleting(null);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${branch.name}"?\n\nThis action cannot be undone.`)) {
      setDeleting(null);
      return;
    }

    const { error } = await supabase.from("branches").delete().eq("id", branch.id);

    setDeleting(null);

    if (error) {
      console.error("Failed to delete branch:", error);
      alert("Failed to delete branch: " + error.message);
      return;
    }

    setBranches((prev) => prev.filter((b) => b.id !== branch.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold text-navy">
          Branches
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={loadBranches}
            className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
          >
            Refresh
          </button>
          <button
            onClick={openNewBranchModal}
            className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
          >
            + Add Branch
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">Loading branches...</p>
        </div>
      ) : (
        <div className="rounded-xl border border-saffron-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-saffron-50 text-navy/70">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Branch</th>
                <th className="text-left px-4 py-3 font-medium">Location</th>
                <th className="text-left px-4 py-3 font-medium">Manager</th>
                <th className="text-left px-4 py-3 font-medium">Members</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Established</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className="border-t border-saffron-100">
                  <td className="px-4 py-3 font-medium text-navy">{b.name}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {b.city}, {b.state}
                  </td>
                  <td className="px-4 py-3 text-navy/70">{b.manager_name || "—"}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {b.member_count.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.is_active
                          ? "bg-forest/10 text-forest"
                          : "bg-navy/10 text-navy/60"
                      }`}
                    >
                      {b.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {b.established_year || "—"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(b)}
                      className="text-xs font-medium text-saffron-700 hover:text-saffron-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(b)}
                      disabled={deleting === b.id}
                      className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {deleting === b.id ? "..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
              {branches.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-navy/50">
                    No branches found. Click &quot;+ Add Branch&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-navy/50">
        Showing {branches.length} branch{branches.length !== 1 ? "es" : ""}
      </p>

      {/* Branch Modal (Create/Edit) */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={closeModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold text-navy">
                  {editingBranch ? "Edit Branch" : "Add New Branch"}
                </h2>
                <button onClick={closeModal} className="text-navy/50 hover:text-navy">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">
                    Branch Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., Delhi HQ"
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">
                    Slug (URL-friendly ID)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated from name"
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                  <p className="mt-1 text-xs text-navy/50">Leave blank to auto-generate</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g., New Delhi"
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g., Delhi"
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    placeholder="Full address"
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="branch@example.com"
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">Manager Name</label>
                    <input
                      type="text"
                      value={formData.manager_name}
                      onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                      placeholder="Branch manager's name"
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy/70 mb-1">Established Year</label>
                    <input
                      type="number"
                      value={formData.established_year}
                      onChange={(e) => setFormData({ ...formData, established_year: e.target.value })}
                      min="2000"
                      max={new Date().getFullYear()}
                      className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                    />
                  </div>
                </div>

                {editingBranch && (
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded border-saffron-300 text-saffron-700 focus:ring-saffron-400"
                      />
                      <span className="text-sm text-navy/70">Branch is active</span>
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={closeModal}
                    className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : editingBranch ? "Save Changes" : "Create Branch"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
