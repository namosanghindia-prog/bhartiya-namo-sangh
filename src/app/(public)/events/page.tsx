"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EVENTS, CATEGORIES, type EventCategory } from "@/lib/events-data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function EventsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<EventCategory | "all">("all");

  const filtered = useMemo(() => {
    return EVENTS.filter((e) => {
      const matchesQuery =
        query.trim() === "" ||
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.location.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "all" || e.category === category;
      return matchesQuery && matchesCategory;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [query, category]);

  return (
    <>
      {/* PAGE HEADER */}
      <section className="bg-saffron-gradient text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold">
            Upcoming Events
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            Find and register for activities happening across our branches
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <section className="bg-white border-b border-saffron-100 sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events by title or location..."
              className="flex-1 rounded-md border border-saffron-200 px-4 py-2 text-sm text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as EventCategory | "all")
              }
              className="rounded-md border border-saffron-200 px-4 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-saffron-400"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* EVENTS GRID */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <p className="text-navy/60 text-sm">
              No events match your search.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filtered.map((event) => {
                const pct = Math.round(
                  (event.registered / event.targetParticipants) * 100
                );
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="rounded-xl border border-saffron-200 bg-white p-6 hover:border-saffron-400 hover:shadow-md transition-all"
                  >
                    <span className="inline-block rounded-full bg-saffron-100 px-3 py-1 text-xs font-semibold text-saffron-800">
                      {event.category}
                    </span>
                    <h3 className="mt-3 font-heading text-xl font-semibold text-navy">
                      {event.title}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-navy/60">
                      <p>
                        📅 {formatDate(event.date)} &middot; ⏰{" "}
                        {event.startTime} – {event.endTime}
                      </p>
                      <p>📍 {event.location}</p>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-navy/60 mb-1">
                        <span>
                          {event.registered} / {event.targetParticipants}{" "}
                          registered
                        </span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-saffron-100 overflow-hidden">
                        <div
                          className="h-full bg-saffron-700"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
