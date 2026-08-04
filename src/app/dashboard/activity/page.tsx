"use client";

import { useState } from "react";
import { MY_ACTIVITY } from "@/lib/dashboard-data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const TYPE_ICON: Record<string, string> = {
  event: "📅",
  donation: "💚",
  hours: "⏱️",
  badge: "🏆",
};

export default function ActivityPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold text-navy">
        Activity & Hours
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity feed */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            Activity feed
          </h2>
          <ul className="space-y-4">
            {MY_ACTIVITY.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden="true">{TYPE_ICON[item.type]}</span>
                <div>
                  <p className="text-sm text-navy">{item.title}</p>
                  <p className="text-xs text-navy/40">
                    {formatDate(item.date)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Manual hours log */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            Log volunteer hours
          </h2>
          {submitted ? (
            <p className="text-sm text-forest bg-forest/10 rounded-md px-3 py-2">
              Hours submitted for review (locally only — not yet saved to a
              database).
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  Hours
                </label>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  required
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Participated in..."
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-saffron-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
              >
                Submit Hours
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
