"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MembershipType } from "@/lib/supabase/types";

interface VipCoupon {
  id: string;
  code: string;
  membership_type_granted: MembershipType;
  note: string | null;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_by: string | null;
  created_at: string;
  redeemer?: { first_name: string; last_name: string } | null;
}

const TIER_LABELS: Record<MembershipType, string> = {
  volunteer: "Volunteer",
  normal: "Normal",
  premium: "Premium",
  lifetime: "Lifetime",
};

const TIER_COLORS: Record<MembershipType, string> = {
  volunteer: "bg-green-100 text-green-800",
  normal: "bg-blue-100 text-blue-800",
  premium: "bg-purple-100 text-purple-800",
  lifetime: "bg-amber-100 text-amber-800",
};

function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VIP-${code}`;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<VipCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [newTier, setNewTier] = useState<MembershipType>("premium");
  const [newNote, setNewNote] = useState("");

  async function loadCoupons() {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("vip_coupons")
      .select("*, redeemer:members!vip_coupons_used_by_fkey(first_name, last_name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load coupons:", error);
    } else if (data) {
      setCoupons(data as VipCoupon[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  async function handleGenerate() {
    setSaving(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Not authenticated");
      setSaving(false);
      return;
    }

    const code = generateCouponCode();

    const { error } = await supabase.from("vip_coupons").insert({
      code,
      membership_type_granted: newTier,
      note: newNote.trim() || null,
      created_by: user.id,
    });

    setSaving(false);

    if (error) {
      console.error("Failed to create coupon:", error);
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        alert("A coupon with this code already exists. Please try again.");
      } else {
        alert("Failed to create coupon: " + error.message);
      }
      return;
    }

    setShowModal(false);
    setNewTier("premium");
    setNewNote("");
    await loadCoupons();
  }

  async function handleDelete(coupon: VipCoupon) {
    if (coupon.is_used) {
      alert("Cannot delete a redeemed coupon (audit trail).");
      return;
    }

    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(coupon.id);
    const supabase = createClient();

    const { error } = await supabase
      .from("vip_coupons")
      .delete()
      .eq("id", coupon.id);

    setDeleting(null);

    if (error) {
      console.error("Failed to delete coupon:", error);
      alert("Failed to delete coupon: " + error.message);
      return;
    }

    setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
  }

  function handleCopy(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy">
            VIP Coupons
          </h1>
          <p className="mt-1 text-sm text-navy/60">
            Generate single-use codes for instant free membership
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadCoupons}
            className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800"
          >
            + Generate Coupon
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">Loading coupons...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">No coupons generated yet.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-sm font-medium text-saffron-700 hover:text-saffron-800"
          >
            Generate your first coupon →
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-saffron-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-saffron-50 text-navy/70">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Code</th>
                <th className="text-left px-4 py-3 font-medium">Tier Granted</th>
                <th className="text-left px-4 py-3 font-medium">Note</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-t border-saffron-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-semibold text-navy bg-saffron-50 px-2 py-0.5 rounded">
                        {coupon.code}
                      </code>
                      <button
                        onClick={() => handleCopy(coupon.code, coupon.id)}
                        className="text-xs text-saffron-700 hover:text-saffron-800"
                        title="Copy code"
                      >
                        {copiedId === coupon.id ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[coupon.membership_type_granted]}`}>
                      {TIER_LABELS[coupon.membership_type_granted]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy/70 max-w-xs truncate">
                    {coupon.note || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {coupon.is_used ? (
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Used
                        </span>
                        {coupon.redeemer && (
                          <p className="text-xs text-navy/50 mt-0.5">
                            by {coupon.redeemer.first_name} {coupon.redeemer.last_name}
                            {coupon.used_at && ` on ${formatDate(coupon.used_at)}`}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-forest/10 text-forest">
                        Unused
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {formatDate(coupon.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!coupon.is_used && (
                      <button
                        onClick={() => handleDelete(coupon)}
                        disabled={deleting === coupon.id}
                        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deleting === coupon.id ? "..." : "Delete"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-navy/50">
        {coupons.filter((c) => !c.is_used).length} unused / {coupons.length} total coupons
      </p>

      {/* Generate Coupon Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-semibold text-navy">
                  Generate VIP Coupon
                </h2>
                <button onClick={() => setShowModal(false)} className="text-navy/50 hover:text-navy">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">
                    Membership Tier to Grant
                  </label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value as MembershipType)}
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  >
                    <option value="volunteer">Volunteer (₹101/year)</option>
                    <option value="normal">Normal (₹1,100/year)</option>
                    <option value="premium">Premium (₹11,000/year)</option>
                    <option value="lifetime">Lifetime (₹99,999 one-time)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy/70 mb-1">
                    Note (optional)
                  </label>
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="e.g., For Mr. Sharma, district president"
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                  <p className="mt-1 text-xs text-navy/50">
                    For your reference only — not shown to the user
                  </p>
                </div>

                <div className="rounded-lg bg-saffron-50 border border-saffron-200 p-3">
                  <p className="text-sm text-navy/70">
                    A unique code like <code className="font-mono bg-white px-1 rounded">VIP-X3K9M2</code> will be generated.
                    The recipient can enter this code during signup to bypass approval and payment.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={saving}
                    className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
                  >
                    {saving ? "Generating..." : "Generate Coupon"}
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
