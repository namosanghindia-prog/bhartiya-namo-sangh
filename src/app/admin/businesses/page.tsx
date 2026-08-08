"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Business, BusinessStatus } from "@/lib/supabase/types";

const STATUS_LABELS: Record<BusinessStatus, { label: string; color: string }> = {
  pending_payment: { label: "Pending Payment", color: "bg-amber-100 text-amber-800" },
  active: { label: "Active", color: "bg-forest/10 text-forest" },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-600" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
};

interface BusinessWithMember extends Omit<Business, 'member'> {
  member: { first_name: string; last_name: string; email: string } | null;
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessWithMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BusinessStatus | "all">("all");
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("businesses")
      .select("*, member:members(first_name, last_name, email)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load businesses:", error);
    } else if (data) {
      setBusinesses(data as BusinessWithMember[]);
    }
    setLoading(false);
  }

  async function handleActivate(businessId: string) {
    setProcessing(businessId);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { error } = await supabase
      .from("businesses")
      .update({
        status: "active",
        registration_fee_paid: true,
        payment_confirmed_at: new Date().toISOString(),
        payment_confirmed_by: user?.id,
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", businessId);

    setProcessing(null);

    if (error) {
      alert("Failed to activate: " + error.message);
      return;
    }

    loadBusinesses();
  }

  async function handleReject(businessId: string) {
    if (!rejectReason.trim()) {
      alert("Please enter a rejection reason");
      return;
    }

    setProcessing(businessId);

    const supabase = createClient();
    const { error } = await supabase
      .from("businesses")
      .update({
        status: "rejected",
        rejection_reason: rejectReason.trim(),
      })
      .eq("id", businessId);

    setProcessing(null);
    setRejectingId(null);
    setRejectReason("");

    if (error) {
      alert("Failed to reject: " + error.message);
      return;
    }

    loadBusinesses();
  }

  const filtered = filter === "all"
    ? businesses
    : businesses.filter((b) => b.status === filter);

  if (loading) {
    return <p className="text-sm text-navy/60">Loading businesses...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy">
            Manage Businesses
          </h1>
          <p className="mt-1 text-sm text-navy/60">
            Review and manage business directory listings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadBusinesses}
            className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
          >
            Refresh
          </button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as BusinessStatus | "all")}
            className="rounded-md border border-saffron-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
          >
            <option value="all">All ({businesses.length})</option>
            <option value="pending_payment">
              Pending Payment ({businesses.filter((b) => b.status === "pending_payment").length})
            </option>
            <option value="active">
              Active ({businesses.filter((b) => b.status === "active").length})
            </option>
            <option value="rejected">
              Rejected ({businesses.filter((b) => b.status === "rejected").length})
            </option>
            <option value="expired">
              Expired ({businesses.filter((b) => b.status === "expired").length})
            </option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-saffron-200 bg-white p-12 text-center">
          <p className="text-navy/60">No businesses found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-saffron-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-saffron-50 border-b border-saffron-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-navy/70 uppercase">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-navy/70 uppercase">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-navy/70 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-navy/70 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-navy/70 uppercase">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-navy/70 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-saffron-100">
                {filtered.map((business) => (
                  <tr key={business.id} className="hover:bg-saffron-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {business.logo_url ? (
                          <img src={business.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-saffron-100 flex items-center justify-center">🏢</div>
                        )}
                        <div>
                          <div className="font-medium text-navy">{business.business_name}</div>
                          {business.phone && <div className="text-xs text-navy/60">{business.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {business.member ? (
                        <div>
                          <div className="text-sm text-navy">
                            {business.member.first_name} {business.member.last_name}
                          </div>
                          <div className="text-xs text-navy/60">{business.member.email}</div>
                        </div>
                      ) : (
                        <span className="text-navy/40">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-navy">
                      {business.category}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[business.status]?.color}`}>
                        {STATUS_LABELS[business.status]?.label}
                      </span>
                      {business.payment_submitted_at && business.status === "pending_payment" && (
                        <div className="mt-1 text-xs text-amber-600">
                          Payment submitted {new Date(business.payment_submitted_at).toLocaleDateString("en-IN")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-navy/70">
                      {new Date(business.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {business.status === "pending_payment" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleActivate(business.id)}
                            disabled={processing === business.id}
                            className="rounded-md bg-forest px-3 py-1.5 text-sm font-medium text-white hover:bg-forest/90 disabled:opacity-60"
                          >
                            {processing === business.id ? "..." : "Activate"}
                          </button>
                          {rejectingId === business.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason"
                                className="w-32 rounded-md border px-2 py-1 text-sm"
                              />
                              <button
                                onClick={() => handleReject(business.id)}
                                disabled={processing === business.id}
                                className="rounded-md bg-red-600 px-2 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectReason("");
                                }}
                                className="text-sm text-navy/60 hover:text-navy"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRejectingId(business.id)}
                              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      )}
                      {business.status === "active" && business.expires_at && (
                        <span className="text-xs text-navy/60">
                          Expires: {new Date(business.expires_at).toLocaleDateString("en-IN")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
