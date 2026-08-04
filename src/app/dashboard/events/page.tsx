"use client";

import { useState } from "react";
import Link from "next/link";
import { MY_REGISTERED_EVENTS, MY_PAST_EVENTS } from "@/lib/dashboard-data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MyEventsPage() {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const totalHours = MY_PAST_EVENTS.reduce((sum, e) => sum + e.hoursLogged, 0);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold text-navy">
        My Events
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-saffron-200">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-saffron-700 text-saffron-800"
                : "border-transparent text-navy/60 hover:text-navy"
            }`}
          >
            {t === "upcoming" ? "Upcoming / Registered" : "Past"}
          </button>
        ))}
      </div>

      {tab === "upcoming" ? (
        <div className="space-y-3">
          {MY_REGISTERED_EVENTS.length === 0 ? (
            <p className="text-sm text-navy/60">
              No upcoming registrations yet — browse the{" "}
              <Link href="/events" className="text-saffron-700 font-medium">
                events page
              </Link>
              .
            </p>
          ) : (
            MY_REGISTERED_EVENTS.map((e) => (
              <div
                key={e.id}
                className="rounded-xl border border-saffron-200 bg-white p-4 flex items-center justify-between"
              >
                <div>
                  <Link
                    href={`/events/${e.id}`}
                    className="font-medium text-navy hover:text-saffron-700"
                  >
                    {e.title}
                  </Link>
                  <p className="text-xs text-navy/50">
                    {formatDate(e.date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-medium text-forest">
                    Registered
                  </span>
                  <button className="text-xs text-red-600 hover:underline">
                    Unregister
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-saffron-200 bg-white p-4 flex flex-wrap gap-6">
            <div>
              <div className="font-heading text-xl font-semibold text-saffron-700">
                {totalHours}
              </div>
              <div className="text-xs text-navy/60">Hours (past events)</div>
            </div>
            <div>
              <div className="font-heading text-xl font-semibold text-saffron-700">
                {MY_PAST_EVENTS.length}
              </div>
              <div className="text-xs text-navy/60">Events attended</div>
            </div>
          </div>
          {MY_PAST_EVENTS.map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-saffron-200 bg-white p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-navy">{e.title}</p>
                <p className="text-xs text-navy/50">{formatDate(e.date)}</p>
              </div>
              <span className="text-sm text-navy/70">
                {e.hoursLogged} hrs logged
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
