"use client";

import { useState } from "react";
import { EVENTS } from "@/lib/admin-data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminEventsPage() {
  const [query, setQuery] = useState("");

  const filtered = EVENTS.filter(
    (e) =>
      query.trim() === "" ||
      e.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold text-navy">
          Events
        </h1>
        <button className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800">
          + New Event
        </button>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search events..."
        className="w-full sm:w-96 rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
      />

      <div className="rounded-xl border border-saffron-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-saffron-50 text-navy/70">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Event</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Branch</th>
              <th className="text-left px-4 py-3 font-medium">
                Registrations
              </th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => {
              const pct = Math.round(
                (e.registered / e.targetParticipants) * 100
              );
              return (
                <tr key={e.id} className="border-t border-saffron-100">
                  <td className="px-4 py-3 font-medium text-navy">
                    {e.title}
                    <span className="ml-2 inline-block rounded-full bg-saffron-100 px-2 py-0.5 text-xs text-saffron-800">
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {formatDate(e.date)}
                  </td>
                  <td className="px-4 py-3 text-navy/70">{e.branch}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-saffron-100 overflow-hidden">
                        <div
                          className="h-full bg-saffron-700"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-navy/60">
                        {e.registered}/{e.targetParticipants}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button className="text-xs font-medium text-saffron-700 hover:text-saffron-800">
                      Edit
                    </button>
                    <button className="text-xs font-medium text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
