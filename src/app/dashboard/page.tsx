"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface MemberData {
  first_name: string;
  volunteer_hours: number;
  total_donations: number;
  joined_date: string;
  branch: { name: string } | null;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<MemberData | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [eventsAttended, setEventsAttended] = useState(0);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Load member data
      const { data: memberData } = await supabase
        .from("members")
        .select("first_name, volunteer_hours, total_donations, joined_date, branch:branches(name)")
        .eq("id", user.id)
        .single();

      if (memberData) {
        setMember({
          first_name: memberData.first_name,
          volunteer_hours: memberData.volunteer_hours,
          total_donations: memberData.total_donations,
          joined_date: memberData.joined_date,
          branch: Array.isArray(memberData.branch) ? memberData.branch[0] : memberData.branch,
        });
      }

      // Load upcoming registered events
      const today = new Date().toISOString().split("T")[0];
      const { data: registrations } = await supabase
        .from("event_registrations")
        .select("event:events(id, title, date)")
        .eq("member_id", user.id)
        .in("status", ["registered", "confirmed"])
        .gte("event.date", today)
        .order("event(date)", { ascending: true })
        .limit(5);

      if (registrations) {
        const events = registrations
          .filter((r) => r.event)
          .map((r) => {
            const event = r.event as unknown as { id: string; title: string; date: string };
            return {
              id: event.id,
              title: event.title,
              date: event.date,
            };
          });
        setUpcomingEvents(events);
      }

      // Count events attended
      const { count: attendedCount } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("member_id", user.id)
        .eq("status", "attended");

      setEventsAttended(attendedCount || 0);

      // Load recent activity
      const { data: activityData } = await supabase
        .from("activity_logs")
        .select("id, type, title, created_at")
        .eq("member_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (activityData) {
        setActivity(activityData);
      }

      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-saffron-gradient text-white p-6">
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl bg-saffron-gradient text-white p-6">
        <h1 className="font-heading text-2xl font-semibold">
          Welcome back, {member?.first_name || "Member"}!
        </h1>
        <p className="mt-1 text-white/90 text-sm">
          {member?.branch?.name || "No Branch"} Branch &middot; Member since{" "}
          {member?.joined_date ? formatDate(member.joined_date) : "—"}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-saffron-200 bg-white p-5 text-center">
          <div className="font-heading text-2xl font-semibold text-saffron-700">
            {member?.volunteer_hours || 0}
          </div>
          <div className="mt-1 text-xs text-navy/60">Volunteer Hours</div>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-5 text-center">
          <div className="font-heading text-2xl font-semibold text-saffron-700">
            {eventsAttended}
          </div>
          <div className="mt-1 text-xs text-navy/60">Events Attended</div>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-5 text-center col-span-2 sm:col-span-1">
          <div className="font-heading text-2xl font-semibold text-saffron-700">
            ₹{(member?.total_donations || 0).toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-xs text-navy/60">Total Donated</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming events */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold text-navy">
              Upcoming Events
            </h2>
            <Link
              href="/dashboard/events"
              className="text-xs font-medium text-saffron-700 hover:text-saffron-800"
            >
              View all →
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-navy/60">
              You haven&apos;t registered for any upcoming events yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {upcomingEvents.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/events/${e.id}`}
                    className="flex items-center justify-between rounded-md border border-saffron-100 px-3 py-2 hover:border-saffron-300 transition-colors"
                  >
                    <span className="text-sm text-navy">{e.title}</span>
                    <span className="text-xs text-navy/50">
                      {formatDate(e.date)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Activity feed */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            Recent Activity
          </h2>
          {activity.length === 0 ? (
            <p className="text-sm text-navy/60">No recent activity.</p>
          ) : (
            <ul className="space-y-4">
              {activity.map((item) => (
                <li key={item.id} className="text-sm">
                  <p className="text-navy">{item.title}</p>
                  <p className="text-xs text-navy/40">
                    {formatDate(item.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
