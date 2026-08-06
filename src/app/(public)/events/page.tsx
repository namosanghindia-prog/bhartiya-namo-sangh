"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { EventCategory } from "@/lib/supabase/types";

const CATEGORIES: EventCategory[] = [
  "Social",
  "Charity",
  "Environmental",
  "Education",
  "Political",
  "Cultural",
  "Sports",
  "Health",
];

interface EventWithCount {
  id: string;
  slug: string;
  title: string;
  category: EventCategory;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  target_participants: number;
  registered_count: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<EventCategory | "all">("all");

  useEffect(() => {
    async function loadEvents() {
      const supabase = createClient();

      const { data: eventsData, error } = await supabase
        .from("events")
        .select("id, slug, title, category, date, start_time, end_time, location, target_participants")
        .eq("is_published", true)
        .eq("is_cancelled", false)
        .order("date", { ascending: true });

      if (error) {
        console.error("Failed to load events:", error);
        setLoading(false);
        return;
      }

      if (eventsData && eventsData.length > 0) {
        const eventIds = eventsData.map((e) => e.id);
        const { data: regCounts } = await supabase
          .from("event_registrations")
          .select("event_id")
          .in("event_id", eventIds)
          .in("status", ["registered", "confirmed", "attended"]);

        const countMap: Record<string, number> = {};
        regCounts?.forEach((r) => {
          countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
        });

        const eventsWithCounts = eventsData.map((e) => ({
          ...e,
          registered_count: countMap[e.id] || 0,
        }));

        setEvents(eventsWithCounts);
      }

      setLoading(false);
    }

    loadEvents();
  }, []);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchesQuery =
        query.trim() === "" ||
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.location.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "all" || e.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [events, query, category]);

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
              onChange={(e) => setCategory(e.target.value as EventCategory | "all")}
              className="rounded-md border border-saffron-200 px-4 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-saffron-400"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* EVENTS GRID */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <p className="text-navy/60 text-sm">Loading events...</p>
          ) : filtered.length === 0 ? (
            <p className="text-navy/60 text-sm">No events match your search.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filtered.map((event) => {
                const pct = event.target_participants > 0
                  ? Math.round((event.registered_count / event.target_participants) * 100)
                  : 0;
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
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
                        📅 {formatDate(event.date)} &middot; ⏰ {event.start_time} – {event.end_time}
                      </p>
                      <p>📍 {event.location}</p>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-navy/60 mb-1">
                        <span>
                          {event.registered_count} / {event.target_participants} registered
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
