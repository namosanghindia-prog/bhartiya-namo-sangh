"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Branch, EventCategory, DonationCategory, MembershipType } from "@/lib/supabase/types";

interface BranchMemberCount {
  branch_id: string | null;
  branch_name: string;
  count: number;
}

interface EventCategoryCount {
  category: EventCategory;
  count: number;
}

interface DonationCategorySum {
  category: DonationCategory;
  total: number;
  count: number;
}

interface MembershipTierStats {
  tier: MembershipType;
  count: number;
  total: number;
}

const MEMBERSHIP_PRICES: Record<MembershipType, number> = {
  volunteer: 101,
  normal: 1100,
  premium: 11000,
  lifetime: 99999,
};

const TIER_LABELS: Record<MembershipType, string> = {
  volunteer: "Volunteer",
  normal: "Normal",
  premium: "Premium",
  lifetime: "Lifetime",
};

const BUSINESS_FEE = 2000;
const PROMOTION_FEE = 15000;

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [membersByBranch, setMembersByBranch] = useState<BranchMemberCount[]>([]);
  const [eventsByCategory, setEventsByCategory] = useState<EventCategoryCount[]>([]);
  const [donationsByCategory, setDonationsByCategory] = useState<DonationCategorySum[]>([]);
  const [membershipStats, setMembershipStats] = useState<MembershipTierStats[]>([]);
  const [businessCount, setBusinessCount] = useState(0);
  const [promotionCount, setPromotionCount] = useState(0);
  const [totalDonations, setTotalDonations] = useState(0);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    const currentYear = new Date().getFullYear();
    const yearStart = `${currentYear}-01-01`;

    const [
      branchesRes,
      membersRes,
      eventsRes,
      donationsRes,
      membershipRes,
      businessesRes,
      promotionsRes,
    ] = await Promise.all([
      // All branches for table
      supabase.from("branches").select("*").order("name"),

      // Active members with branch info
      supabase
        .from("members")
        .select("branch_id, branches(name)")
        .eq("status", "active"),

      // Events by category
      supabase.from("events").select("category"),

      // Verified donations
      supabase
        .from("donations")
        .select("category, amount")
        .eq("status", "verified"),

      // Confirmed membership payments
      supabase
        .from("members")
        .select("membership_type, membership_fee_amount")
        .eq("membership_payment_status", "confirmed")
        .not("membership_type", "is", null),

      // Active businesses
      supabase
        .from("businesses")
        .select("id")
        .eq("status", "active"),

      // Live or completed promotions
      supabase
        .from("business_promotions")
        .select("id, status")
        .in("status", ["live", "expired"]),
    ]);

    // Set branches
    if (branchesRes.data) {
      setBranches(branchesRes.data);
    }

    // Calculate members by branch
    if (membersRes.data) {
      const branchCounts: Record<string, { name: string; count: number }> = {};
      let unassignedCount = 0;

      for (const m of membersRes.data) {
        if (m.branch_id && m.branches) {
          const branchData = m.branches as unknown as { name: string };
          if (!branchCounts[m.branch_id]) {
            branchCounts[m.branch_id] = { name: branchData.name, count: 0 };
          }
          branchCounts[m.branch_id].count++;
        } else {
          unassignedCount++;
        }
      }

      const result: BranchMemberCount[] = Object.entries(branchCounts)
        .map(([id, data]) => ({
          branch_id: id,
          branch_name: data.name,
          count: data.count,
        }))
        .sort((a, b) => b.count - a.count);

      if (unassignedCount > 0) {
        result.push({
          branch_id: null,
          branch_name: "Unassigned",
          count: unassignedCount,
        });
      }

      setMembersByBranch(result);
    }

    // Calculate events by category
    if (eventsRes.data) {
      const categoryCounts: Record<string, number> = {};
      for (const e of eventsRes.data) {
        categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
      }

      const result: EventCategoryCount[] = Object.entries(categoryCounts)
        .map(([category, count]) => ({
          category: category as EventCategory,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      setEventsByCategory(result);
    }

    // Calculate donations by category
    if (donationsRes.data) {
      const categoryTotals: Record<string, { total: number; count: number }> = {};
      let grandTotal = 0;

      for (const d of donationsRes.data) {
        if (!categoryTotals[d.category]) {
          categoryTotals[d.category] = { total: 0, count: 0 };
        }
        categoryTotals[d.category].total += d.amount;
        categoryTotals[d.category].count++;
        grandTotal += d.amount;
      }

      const result: DonationCategorySum[] = Object.entries(categoryTotals)
        .map(([category, data]) => ({
          category: category as DonationCategory,
          total: data.total,
          count: data.count,
        }))
        .sort((a, b) => b.total - a.total);

      setDonationsByCategory(result);
      setTotalDonations(grandTotal);
    }

    // Calculate membership revenue by tier
    if (membershipRes.data) {
      const tierStats: Record<MembershipType, { count: number; total: number }> = {
        volunteer: { count: 0, total: 0 },
        normal: { count: 0, total: 0 },
        premium: { count: 0, total: 0 },
        lifetime: { count: 0, total: 0 },
      };

      for (const m of membershipRes.data) {
        const tier = m.membership_type as MembershipType;
        if (tier && tierStats[tier]) {
          tierStats[tier].count++;
          tierStats[tier].total += m.membership_fee_amount || MEMBERSHIP_PRICES[tier];
        }
      }

      const result: MembershipTierStats[] = (
        ["volunteer", "normal", "premium", "lifetime"] as MembershipType[]
      ).map((tier) => ({
        tier,
        count: tierStats[tier].count,
        total: tierStats[tier].total,
      }));

      setMembershipStats(result);
    }

    // Business & promotion counts
    setBusinessCount(businessesRes.data?.length || 0);
    setPromotionCount(promotionsRes.data?.length || 0);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Calculate totals
  const totalMembershipRevenue = membershipStats.reduce((sum, t) => sum + t.total, 0);
  const totalBusinessRevenue = businessCount * BUSINESS_FEE + promotionCount * PROMOTION_FEE;
  const totalRevenue = totalDonations + totalMembershipRevenue + totalBusinessRevenue;
  const totalActiveMembers = membersByBranch.reduce((sum, b) => sum + b.count, 0);

  // Max values for bar charts
  const maxMemberCount = Math.max(...membersByBranch.map((b) => b.count), 1);
  const maxEventCount = Math.max(...eventsByCategory.map((e) => e.count), 1);
  const maxDonationTotal = Math.max(...donationsByCategory.map((d) => d.total), 1);

  if (loading) {
    return <p className="text-sm text-navy/60">Loading reports...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold text-navy">
          Reports & Analytics
        </h1>
        <button
          onClick={loadData}
          className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
        >
          Refresh
        </button>
      </div>

      {/* Top-line revenue card */}
      <div className="rounded-xl border-2 border-saffron-300 bg-gradient-to-r from-saffron-50 to-white p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-navy/60">Total Revenue (All Time)</h2>
            <p className="font-heading text-3xl font-bold text-saffron-800">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-navy/60">Donations</span>
              <p className="font-semibold text-navy">₹{totalDonations.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <span className="text-navy/60">Memberships</span>
              <p className="font-semibold text-navy">₹{totalMembershipRevenue.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <span className="text-navy/60">Business</span>
              <p className="font-semibold text-navy">₹{totalBusinessRevenue.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Members by branch + Events by category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members by branch (active only) */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-1">
            Active Members by Branch
          </h2>
          <p className="text-xs text-navy/50 mb-4">
            {totalActiveMembers.toLocaleString("en-IN")} total active members
          </p>
          {membersByBranch.length === 0 ? (
            <p className="text-sm text-navy/60">No active members found.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {membersByBranch.map((b) => (
                <div key={b.branch_id || "unassigned"}>
                  <div className="flex justify-between text-xs text-navy/70 mb-1">
                    <span className={b.branch_id ? "" : "italic"}>{b.branch_name}</span>
                    <span>{b.count.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="h-2 rounded-full bg-saffron-100 overflow-hidden">
                    <div
                      className="h-full bg-saffron-700"
                      style={{ width: `${(b.count / maxMemberCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Events by category */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-1">
            Events by Category
          </h2>
          <p className="text-xs text-navy/50 mb-4">
            {eventsByCategory.reduce((sum, e) => sum + e.count, 0)} total events
          </p>
          {eventsByCategory.length === 0 ? (
            <p className="text-sm text-navy/60">No events found.</p>
          ) : (
            <div className="space-y-3">
              {eventsByCategory.map((e) => (
                <div key={e.category}>
                  <div className="flex justify-between text-xs text-navy/70 mb-1">
                    <span>{e.category}</span>
                    <span>{e.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-forest/10 overflow-hidden">
                    <div
                      className="h-full bg-forest"
                      style={{ width: `${(e.count / maxEventCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Donations + Membership revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donations by category */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-1">
            Donations by Category
          </h2>
          <p className="text-xs text-navy/50 mb-4">
            ₹{totalDonations.toLocaleString("en-IN")} total verified donations
          </p>
          {donationsByCategory.length === 0 ? (
            <p className="text-sm text-navy/60">No verified donations found.</p>
          ) : (
            <div className="space-y-3">
              {donationsByCategory.map((d) => (
                <div key={d.category}>
                  <div className="flex justify-between text-xs text-navy/70 mb-1">
                    <span>{d.category} ({d.count})</span>
                    <span>₹{d.total.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-600"
                      style={{ width: `${(d.total / maxDonationTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Membership revenue */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-1">
            Membership Revenue by Tier
          </h2>
          <p className="text-xs text-navy/50 mb-4">
            ₹{totalMembershipRevenue.toLocaleString("en-IN")} total from{" "}
            {membershipStats.reduce((sum, t) => sum + t.count, 0)} confirmed memberships
          </p>
          <div className="space-y-3">
            {membershipStats.map((t) => (
              <div key={t.tier}>
                <div className="flex justify-between text-xs text-navy/70 mb-1">
                  <span>
                    {TIER_LABELS[t.tier]} ({t.count} members)
                  </span>
                  <span>₹{t.total.toLocaleString("en-IN")}</span>
                </div>
                <div className="h-2 rounded-full bg-purple-100 overflow-hidden">
                  <div
                    className="h-full bg-purple-600"
                    style={{
                      width: `${
                        totalMembershipRevenue > 0
                          ? (t.total / totalMembershipRevenue) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Business revenue summary */}
      <div className="rounded-xl border border-saffron-200 bg-white p-6">
        <h2 className="font-heading text-lg font-semibold text-navy mb-4">
          Business Directory Revenue
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg bg-saffron-50 p-4">
            <p className="text-sm text-navy/60">Active Businesses</p>
            <p className="font-heading text-2xl font-bold text-navy">
              {businessCount}
            </p>
            <p className="text-xs text-navy/50">
              × ₹{BUSINESS_FEE.toLocaleString("en-IN")} = ₹{(businessCount * BUSINESS_FEE).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-lg bg-saffron-50 p-4">
            <p className="text-sm text-navy/60">Slider Promotions</p>
            <p className="font-heading text-2xl font-bold text-navy">
              {promotionCount}
            </p>
            <p className="text-xs text-navy/50">
              × ₹{PROMOTION_FEE.toLocaleString("en-IN")} = ₹{(promotionCount * PROMOTION_FEE).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-lg bg-forest/10 p-4">
            <p className="text-sm text-forest/80">Total Business Revenue</p>
            <p className="font-heading text-2xl font-bold text-forest">
              ₹{totalBusinessRevenue.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Branch-wise performance table */}
      <div className="rounded-xl border border-saffron-200 bg-white overflow-x-auto">
        <div className="px-4 py-3 border-b border-saffron-100">
          <h2 className="font-heading text-lg font-semibold text-navy">
            Branch Directory
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-saffron-50 text-navy/70">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Branch</th>
              <th className="text-left px-4 py-3 font-medium">Location</th>
              <th className="text-left px-4 py-3 font-medium">Active Members</th>
              <th className="text-left px-4 py-3 font-medium">Est. Year</th>
              <th className="text-left px-4 py-3 font-medium">Manager</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => {
              const branchMembers = membersByBranch.find((m) => m.branch_id === b.id);
              return (
                <tr key={b.id} className="border-t border-saffron-100">
                  <td className="px-4 py-3 font-medium text-navy">{b.name}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {b.city}, {b.state}
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {(branchMembers?.count || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {b.established_year || "—"}
                  </td>
                  <td className="px-4 py-3 text-navy/70">{b.manager_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        b.is_active
                          ? "bg-forest/10 text-forest"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {b.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {branches.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-navy/50">
                  No branches found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
