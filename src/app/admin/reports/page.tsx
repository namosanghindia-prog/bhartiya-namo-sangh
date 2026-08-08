"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Branch } from "@/lib/supabase/types";

export default function AdminReportsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .order("member_count", { ascending: false });

      if (error) {
        console.error("Failed to load branches:", error);
      } else if (data) {
        setBranches(data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const maxMembers = branches.length > 0
    ? Math.max(...branches.map((b) => b.member_count))
    : 1;

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
          onClick={() => window.location.reload()}
          className="rounded-md border border-saffron-300 px-4 py-2 text-sm font-medium text-navy hover:bg-saffron-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members by branch */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            Members by branch
          </h2>
          {branches.length === 0 ? (
            <p className="text-sm text-navy/60">No branches found.</p>
          ) : (
            <div className="space-y-3">
              {branches.map((b) => (
                <div key={b.id}>
                  <div className="flex justify-between text-xs text-navy/70 mb-1">
                    <span>{b.name}</span>
                    <span>{b.member_count.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="h-2 rounded-full bg-saffron-100 overflow-hidden">
                    <div
                      className="h-full bg-saffron-700"
                      style={{
                        width: `${(b.member_count / maxMembers) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary stats */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            Summary
          </h2>
          <dl className="space-y-4">
            <div className="flex justify-between">
              <dt className="text-sm text-navy/60">Total branches</dt>
              <dd className="font-semibold text-navy">{branches.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-navy/60">Active branches</dt>
              <dd className="font-semibold text-navy">
                {branches.filter((b) => b.is_active).length}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-navy/60">Total members (all branches)</dt>
              <dd className="font-semibold text-navy">
                {branches.reduce((sum, b) => sum + b.member_count, 0).toLocaleString("en-IN")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-navy/60">Avg. members per branch</dt>
              <dd className="font-semibold text-navy">
                {branches.length > 0
                  ? Math.round(branches.reduce((sum, b) => sum + b.member_count, 0) / branches.length).toLocaleString("en-IN")
                  : 0}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Branch-wise performance table */}
      <div className="rounded-xl border border-saffron-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-saffron-50 text-navy/70">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Branch</th>
              <th className="text-left px-4 py-3 font-medium">Location</th>
              <th className="text-left px-4 py-3 font-medium">Members</th>
              <th className="text-left px-4 py-3 font-medium">Est. Year</th>
              <th className="text-left px-4 py-3 font-medium">Manager</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id} className="border-t border-saffron-100">
                <td className="px-4 py-3 font-medium text-navy">{b.name}</td>
                <td className="px-4 py-3 text-navy/70">
                  {b.city}, {b.state}
                </td>
                <td className="px-4 py-3 text-navy/70">
                  {b.member_count.toLocaleString("en-IN")}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
