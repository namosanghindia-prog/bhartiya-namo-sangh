"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Donation, DonationCategory, PaymentMethod } from "@/lib/supabase/types";

interface DonationWithMember extends Omit<Donation, "member"> {
  member: { first_name: string; last_name: string } | null;
}

interface MemberOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
}

const CATEGORIES: DonationCategory[] = [
  "General",
  "Education",
  "Environment",
  "Disaster Relief",
  "Healthcare",
  "Infrastructure",
  "Events",
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState<DonationWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [generatingReceipt, setGeneratingReceipt] = useState<string | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const [formData, setFormData] = useState({
    donor_name: "",
    donor_email: "",
    donor_phone: "",
    amount: "",
    category: "General" as DonationCategory,
    payment_method: "upi" as PaymentMethod,
  });

  async function loadDonations() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("donations")
      .select("*, member:members(first_name, last_name)")
      .order("donated_at", { ascending: false });

    if (error) {
      console.error("Failed to load donations:", error);
    } else if (data) {
      setDonations(data as DonationWithMember[]);
    }
    setLoading(false);
  }

  async function searchMembers(query: string) {
    if (query.length < 2) {
      setMembers([]);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from("members")
      .select("id, first_name, last_name, email")
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);

    if (data) {
      setMembers(data);
    }
  }

  useEffect(() => {
    loadDonations();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => searchMembers(memberSearch), 300);
    return () => clearTimeout(timeout);
  }, [memberSearch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: newDonation, error } = await supabase
      .from("donations")
      .insert({
        donor_name: formData.donor_name,
        donor_email: formData.donor_email || null,
        donor_phone: formData.donor_phone || null,
        amount: parseInt(formData.amount, 10),
        category: formData.category,
        payment_method: formData.payment_method,
        member_id: selectedMember?.id || null,
        status: "verified",
        verified_at: new Date().toISOString(),
        verified_by: user?.id,
        donated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      alert("Failed to record donation: " + error.message);
      setSaving(false);
      return;
    }

    if (newDonation) {
      await generateReceipt(newDonation.id);
    }

    setFormData({
      donor_name: "",
      donor_email: "",
      donor_phone: "",
      amount: "",
      category: "General",
      payment_method: "upi",
    });
    setSelectedMember(null);
    setMemberSearch("");
    setShowForm(false);
    setSaving(false);
    loadDonations();
  }

  async function handleDelete(donationId: string) {
    if (!confirm("Are you sure you want to delete this donation? This action cannot be undone.")) {
      return;
    }

    setDeleting(donationId);
    const supabase = createClient();

    const donation = donations.find((d) => d.id === donationId);
    if (donation?.receipt_url) {
      await supabase.storage.from("receipts").remove([donation.receipt_url]);
    }

    const { error } = await supabase.from("donations").delete().eq("id", donationId);

    setDeleting(null);

    if (error) {
      alert("Failed to delete donation: " + error.message);
      return;
    }

    setDonations((prev) => prev.filter((d) => d.id !== donationId));
  }

  async function generateReceipt(donationId: string) {
    setGeneratingReceipt(donationId);

    const res = await fetch("/api/donations/generate-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donationId }),
    });

    setGeneratingReceipt(null);

    if (!res.ok) {
      const data = await res.json();
      alert("Failed to generate receipt: " + (data.error || "Unknown error"));
      return;
    }

    loadDonations();
  }

  async function downloadReceipt(donationId: string) {
    setDownloadingReceipt(donationId);

    const res = await fetch("/api/donations/receipt-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donationId }),
    });

    setDownloadingReceipt(null);

    if (!res.ok) {
      const data = await res.json();
      alert("Failed to get receipt URL: " + (data.error || "Unknown error"));
      return;
    }

    const { url } = await res.json();
    window.open(url, "_blank");
  }

  function selectMember(member: MemberOption) {
    setSelectedMember(member);
    setFormData((prev) => ({
      ...prev,
      donor_name: `${member.first_name} ${member.last_name}`,
      donor_email: member.email || prev.donor_email,
    }));
    setMemberSearch("");
    setShowMemberDropdown(false);
  }

  const stats = {
    thisMonth: donations
      .filter((d) => {
        const date = new Date(d.donated_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, d) => sum + d.amount, 0),
    thisYear: donations
      .filter((d) => new Date(d.donated_at).getFullYear() === new Date().getFullYear())
      .reduce((sum, d) => sum + d.amount, 0),
    avgDonation: donations.length > 0
      ? Math.round(donations.reduce((sum, d) => sum + d.amount, 0) / donations.length)
      : 0,
    totalDonors: new Set(donations.map((d) => d.donor_name)).size,
  };

  if (loading) {
    return <p className="text-sm text-navy/60">Loading donations...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold text-navy">Donations</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDonations}
            className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
          >
            + Record Donation
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            Record New Donation
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="block text-sm text-navy/70 mb-1">
                Link to Member (optional)
              </label>
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value);
                  setShowMemberDropdown(true);
                }}
                onFocus={() => setShowMemberDropdown(true)}
                placeholder="Search by name or email..."
                className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
              />
              {selectedMember && (
                <div className="mt-1 flex items-center gap-2 text-sm text-forest">
                  <span>
                    Linked to: {selectedMember.first_name} {selectedMember.last_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedMember(null)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
              {showMemberDropdown && members.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-saffron-200 bg-white shadow-lg max-h-48 overflow-auto">
                  {members.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => selectMember(m)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-saffron-50"
                    >
                      {m.first_name} {m.last_name}
                      {m.email && (
                        <span className="text-navy/50 ml-2">{m.email}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  Donor Name *
                </label>
                <input
                  type="text"
                  value={formData.donor_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, donor_name: e.target.value }))
                  }
                  required
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  required
                  min="1"
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.donor_email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, donor_email: e.target.value }))
                  }
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.donor_phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, donor_phone: e.target.value }))
                  }
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value as DonationCategory,
                    }))
                  }
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  Payment Method *
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      payment_method: e.target.value as PaymentMethod,
                    }))
                  }
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>
                      {pm.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Record & Generate Receipt"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedMember(null);
                  setMemberSearch("");
                }}
                className="rounded-md border border-saffron-200 px-5 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-saffron-200 bg-white p-5">
          <div className="font-heading text-xl font-semibold text-saffron-700">
            ₹{(stats.thisMonth / 100000).toFixed(1)} L
          </div>
          <div className="text-xs text-navy/60">This Month</div>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-5">
          <div className="font-heading text-xl font-semibold text-saffron-700">
            ₹{stats.thisYear >= 10000000
              ? `${(stats.thisYear / 10000000).toFixed(2)} Cr`
              : `${(stats.thisYear / 100000).toFixed(1)} L`}
          </div>
          <div className="text-xs text-navy/60">This Year</div>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-5">
          <div className="font-heading text-xl font-semibold text-saffron-700">
            ₹{stats.avgDonation.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-navy/60">Avg Donation</div>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-5">
          <div className="font-heading text-xl font-semibold text-saffron-700">
            {stats.totalDonors.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-navy/60">Donors</div>
        </div>
      </div>

      <div className="rounded-xl border border-saffron-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-saffron-50 text-navy/70">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Donor</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((d) => (
              <tr key={d.id} className="border-t border-saffron-100">
                <td className="px-4 py-3">
                  <div className="font-medium text-navy">
                    {d.is_anonymous ? "Anonymous" : d.donor_name}
                  </div>
                  {d.member && (
                    <div className="text-xs text-navy/50">
                      Member: {d.member.first_name} {d.member.last_name}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-navy/70">
                  ₹{d.amount.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-navy/70">
                  {formatDate(d.donated_at)}
                </td>
                <td className="px-4 py-3 text-navy/70">{d.category}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      d.status === "verified"
                        ? "bg-forest/10 text-forest"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {d.receipt_url ? (
                    <button
                      onClick={() => downloadReceipt(d.id)}
                      disabled={downloadingReceipt === d.id}
                      className="text-xs font-medium text-saffron-700 hover:text-saffron-800 disabled:opacity-50"
                    >
                      {downloadingReceipt === d.id ? "..." : "Download Receipt"}
                    </button>
                  ) : (
                    <button
                      onClick={() => generateReceipt(d.id)}
                      disabled={generatingReceipt === d.id}
                      className="text-xs font-medium text-forest hover:text-forest/80 disabled:opacity-50"
                    >
                      {generatingReceipt === d.id ? "Generating..." : "Generate Receipt"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(d.id)}
                    disabled={deleting === d.id}
                    className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {deleting === d.id ? "..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {donations.length === 0 && (
          <div className="p-12 text-center text-navy/60">
            No donations recorded yet. Click &quot;+ Record Donation&quot; to add one.
          </div>
        )}
      </div>
      <p className="text-xs text-navy/50">
        Showing {donations.length} donation{donations.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
