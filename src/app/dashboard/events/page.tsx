"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface RegisteredEvent {
  id: string;
  registration_id: string;
  title: string;
  date: string;
  status: string;
  hours_logged: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MyEventsPage() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [upcomingEvents, setUpcomingEvents] = useState<RegisteredEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<RegisteredEvent[]>([]);
  const [unregistering, setUnregistering] = useState<string | null>(null);

  async function loadEvents() {
    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    // Load all registrations with event details
    const { data: registrations, error } = await supabase
      .from("event_registrations")
      .select("id, status, hours_logged, event:events(id, title, date)")
      .eq("member_id", user.id)
      .order("event(date)", { ascending: false });

    if (error) {
      console.error("Failed to load registrations:", error);
      setLoading(false);
      return;
    }

    const upcoming: RegisteredEvent[] = [];
    const past: RegisteredEvent[] = [];

    for (const reg of registrations || []) {
      if (!reg.event) continue;
      const event = reg.event as unknown as { id: string; title: string; date: string };

      const eventData: RegisteredEvent = {
        id: event.id,
        registration_id: reg.id,
        title: event.title,
        date: event.date,
        status: reg.status,
        hours_logged: reg.hours_logged || 0,
      };

      if (event.date >= today && ["registered", "confirmed"].includes(reg.status)) {
        upcoming.push(eventData);
      } else {
        past.push(eventData);
      }
    }

    // Sort upcoming by date ascending
    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setUpcomingEvents(upcoming);
    setPastEvents(past);
    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleUnregister(registrationId: string) {
    if (!confirm("Are you sure you want to unregister from this event?")) {
      return;
    }

    setUnregistering(registrationId);
    const supabase = createClient();

    const { error } = await supabase
      .from("event_registrations")
      .update({ status: "cancelled" })
      .eq("id", registrationId);

    setUnregistering(null);

    if (error) {
      console.error("Failed to unregister:", error);
      alert("Failed to unregister: " + error.message);
      return;
    }

    // Reload events
    await loadEvents();
  }

  const totalHours = pastEvents.reduce((sum, e) => sum + e.hours_logged, 0);
  const attendedCount = pastEvents.filter((e) => e.status === "attended").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-semibold text-navy">
          My Events
        </h1>
        <p className="text-sm text-navy/60">Loading...</p>
      </div>
    );
  }

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
            {t === "upcoming" ? `Upcoming (${upcomingEvents.length})` : `Past (${pastEvents.length})`}
          </button>
        ))}
      </div>

      {tab === "upcoming" ? (
        <div className="space-y-3">
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-navy/60">
              No upcoming registrations yet — browse the{" "}
              <Link href="/events" className="text-saffron-700 font-medium">
                events page
              </Link>
              .
            </p>
          ) : (
            upcomingEvents.map((e) => (
              <div
                key={e.registration_id}
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
                  <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-medium text-forest capitalize">
                    {e.status}
                  </span>
                  <button
                    onClick={() => handleUnregister(e.registration_id)}
                    disabled={unregistering === e.registration_id}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    {unregistering === e.registration_id ? "..." : "Unregister"}
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
              <div className="text-xs text-navy/60">Hours logged</div>
            </div>
            <div>
              <div className="font-heading text-xl font-semibold text-saffron-700">
                {attendedCount}
              </div>
              <div className="text-xs text-navy/60">Events attended</div>
            </div>
          </div>
          {pastEvents.length === 0 ? (
            <p className="text-sm text-navy/60">No past event registrations.</p>
          ) : (
            pastEvents.map((e) => (
              <div
                key={e.registration_id}
                className="rounded-xl border border-saffron-200 bg-white p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-navy">{e.title}</p>
                  <p className="text-xs text-navy/50">{formatDate(e.date)}</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    e.status === "attended"
                      ? "bg-forest/10 text-forest"
                      : e.status === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : "bg-navy/10 text-navy/60"
                  }`}>
                    {e.status}
                  </span>
                  {e.hours_logged > 0 && (
                    <p className="text-sm text-navy/70 mt-1">
                      {e.hours_logged} hrs logged
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
