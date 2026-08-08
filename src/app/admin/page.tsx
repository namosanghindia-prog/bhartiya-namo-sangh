"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface KPIData {
  totalMembers: number;
  activeMembers: number;
  totalEvents: number;
  totalDonations: number;
}

interface RecentMember {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
  branch_name: string | null;
  created_at: string;
}

interface TopEvent {
  id: string;
  title: string;
  registered: number;
  target: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [kpis, setKpis] = useState<KPIData>({
    totalMembers: 0,
    activeMembers: 0,
    totalEvents: 0,
    totalDonations: 0,
  });
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([]);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const supabase = createClient();

      // Fetch all counts in parallel
      const [
        pendingRes,
        totalMembersRes,
        activeMembersRes,
        totalEventsRes,
        donationsRes,
        recentMembersRes,
        eventsRes,
      ] = await Promise.all([
        // Pending approvals count
        supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "pending"),

        // Total members
        supabase.from("members").select("*", { count: "exact", head: true }),

        // Active members
        supabase.from("members").select("*", { count: "exact", head: true }).eq("status", "active"),

        // Total events
        supabase.from("events").select("*", { count: "exact", head: true }),

        // Total verified donations
        supabase.from("donations").select("amount").eq("status", "verified"),

        // Recent member signups
        supabase
          .from("members")
          .select("id, first_name, last_name, status, created_at, branch:branches(name)")
          .order("created_at", { ascending: false })
          .limit(5),

        // Events with registration counts
        supabase
          .from("events")
          .select("id, title, target_participants")
          .eq("is_published", true)
          .order("date", { ascending: false })
          .limit(10),
      ]);

      setPendingCount(pendingRes.count || 0);

      // Calculate total donations
      const totalDonations = donationsRes.data?.reduce((sum, d) => sum + d.amount, 0) || 0;

      setKpis({
        totalMembers: totalMembersRes.count || 0,
        activeMembers: activeMembersRes.count || 0,
        totalEvents: totalEventsRes.count || 0,
        totalDonations,
      });

      // Process recent members
      if (recentMembersRes.data) {
        const members = recentMembersRes.data.map((m) => ({
          id: m.id,
          first_name: m.first_name,
          last_name: m.last_name,
          status: m.status,
          branch_name: Array.isArray(m.branch) ? m.branch[0]?.name : (m.branch as { name: string } | null)?.name || null,
          created_at: m.created_at,
        }));
        setRecentMembers(members);
      }

      // Get registration counts for events
      if (eventsRes.data) {
        const eventsWithCounts: TopEvent[] = [];

        for (const event of eventsRes.data) {
          const { count } = await supabase
            .from("event_registrations")
            .select("*", { count: "exact", head: true })
            .eq("event_id", event.id)
            .in("status", ["registered", "confirmed", "attended"]);

          eventsWithCounts.push({
            id: event.id,
            title: event.title,
            registered: count || 0,
            target: event.target_participants,
          });
        }

        // Sort by registration count and take top 4
        eventsWithCounts.sort((a, b) => b.registered - a.registered);
        setTopEvents(eventsWithCounts.slice(0, 4));
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  const activePercent = kpis.totalMembers > 0
    ? Math.round((kpis.activeMembers / kpis.totalMembers) * 100)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-semibold text-navy">
          Admin Dashboard
        </h1>
        <p className="text-sm text-navy/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold text-navy">
        Admin Dashboard
      </h1>

      {/* Pending approvals alert */}
      {pendingCount > 0 && (
        <Link
          href="/admin/approvals"
          className="block rounded-xl border-2 border-amber-300 bg-amber-50 p-4 hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div className="flex-1">
              <div className="font-heading font-semibold text-amber-800">
                {pendingCount} member{pendingCount !== 1 ? "s" : ""} awaiting approval
              </div>
              <div className="text-sm text-amber-700">
                Click here to review and approve new registrations
              </div>
            </div>
            <span className="text-amber-600">→</span>
          </div>
        </Link>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-saffron-200 bg-white p-5">
          <div className="font-heading text-2xl font-semibold text-saffron-700">
            {kpis.totalMembers.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-xs text-navy/60">Total Members</div>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-5">
          <div className="font-heading text-2xl font-semibold text-saffron-700">
            {kpis.totalEvents}
          </div>
          <div className="mt-1 text-xs text-navy/60">Events Organized</div>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-5">
          <div className="font-heading text-2xl font-semibold text-saffron-700">
            ₹{kpis.totalDonations >= 10000000
              ? `${(kpis.totalDonations / 10000000).toFixed(2)} Cr`
              : kpis.totalDonations >= 100000
              ? `${(kpis.totalDonations / 100000).toFixed(2)} L`
              : kpis.totalDonations.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-xs text-navy/60">Total Raised</div>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-5">
          <div className="font-heading text-2xl font-semibold text-saffron-700">
            {activePercent}%
          </div>
          <div className="mt-1 text-xs text-navy/60">Active Members</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            Recent Signups
          </h2>
          {recentMembers.length === 0 ? (
            <p className="text-sm text-navy/60">No recent signups.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {recentMembers.map((m) => (
                <li key={m.id} className="flex justify-between text-navy/70">
                  <span>
                    <span className="font-medium text-navy">
                      {m.first_name} {m.last_name}
                    </span>{" "}
                    — {m.branch_name || "No branch"}
                  </span>
                  <span
                    className={`text-xs rounded-full px-2 py-0.5 ${
                      m.status === "active"
                        ? "bg-forest/10 text-forest"
                        : m.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-navy/10 text-navy/60"
                    }`}
                  >
                    {m.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top events */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            Top Events (by registration)
          </h2>
          {topEvents.length === 0 ? (
            <p className="text-sm text-navy/60">No events yet.</p>
          ) : (
            <ul className="space-y-3">
              {topEvents.map((e) => {
                const pct = e.target > 0 ? Math.round((e.registered / e.target) * 100) : 0;
                return (
                  <li key={e.id}>
                    <div className="flex justify-between text-sm text-navy mb-1">
                      <span className="truncate">{e.title}</span>
                      <span className="text-navy/50 flex-shrink-0 ml-2">
                        {e.registered}/{e.target}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-saffron-100 overflow-hidden">
                      <div
                        className="h-full bg-saffron-700"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
