"use client";

import { useMemo, useState } from "react";
import { ADMIN_MEMBERS } from "@/lib/admin-data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminMembersPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");

  const filtered = useMemo(() => {
    return ADMIN_MEMBERS.filter((m) => {
      const matchesQuery =
        query.trim() === "" ||
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.email.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || m.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold text-navy">
          Members
        </h1>
        <button className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800">
          + Add New Member
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
          onChange={(e) =>
            setStatus(e.target.value as "all" | "active" | "inactive")
          }
          className="rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-saffron-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-saffron-50 text-navy/70">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Branch</th>
              <th className="text-left px-4 py-3 font-medium">Joined</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-saffron-100">
                <td className="px-4 py-3 font-medium text-navy">{m.name}</td>
                <td className="px-4 py-3 text-navy/70">{m.email}</td>
                <td className="px-4 py-3 text-navy/70">{m.branch}</td>
                <td className="px-4 py-3 text-navy/70">
                  {formatDate(m.joinedDate)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.status === "active"
                        ? "bg-forest/10 text-forest"
                        : "bg-navy/10 text-navy/60"
                    }`}
                  >
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button className="text-xs font-medium text-saffron-700 hover:text-saffron-800">
                    Edit
                  </button>
                  <button className="text-xs font-medium text-red-600 hover:text-red-700">
                    {m.status === "active" ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-navy/50">
        Showing {filtered.length} of {ADMIN_MEMBERS.length} sample members
        (10,245 in production dataset)
      </p>
    </div>
  );
}
