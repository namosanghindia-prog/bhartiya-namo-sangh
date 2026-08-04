import Link from "next/link";
import {
  CURRENT_MEMBER,
  MY_REGISTERED_EVENTS,
  MY_ACTIVITY,
} from "@/lib/dashboard-data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl bg-saffron-gradient text-white p-6">
        <h1 className="font-heading text-2xl font-semibold">
          Welcome back, {CURRENT_MEMBER.firstName}!
        </h1>
        <p className="mt-1 text-white/90 text-sm">
          {CURRENT_MEMBER.branch} Branch &middot; Member since{" "}
          {formatDate(CURRENT_MEMBER.joinedDate)}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-saffron-200 bg-white p-5 text-center">
          <div className="font-heading text-2xl font-semibold text-saffron-700">
            {CURRENT_MEMBER.volunteerHours}
          </div>
          <div className="mt-1 text-xs text-navy/60">Volunteer Hours</div>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-5 text-center">
          <div className="font-heading text-2xl font-semibold text-saffron-700">
            {CURRENT_MEMBER.totalEvents}
          </div>
          <div className="mt-1 text-xs text-navy/60">Events Attended</div>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-5 text-center col-span-2 sm:col-span-1">
          <div className="font-heading text-2xl font-semibold text-saffron-700">
            ₹{CURRENT_MEMBER.totalDonations.toLocaleString("en-IN")}
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
          {MY_REGISTERED_EVENTS.length === 0 ? (
            <p className="text-sm text-navy/60">
              You haven&apos;t registered for any upcoming events yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {MY_REGISTERED_EVENTS.map((e) => (
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
          <ul className="space-y-4">
            {MY_ACTIVITY.slice(0, 5).map((item, i) => (
              <li key={i} className="text-sm">
                <p className="text-navy">{item.title}</p>
                <p className="text-xs text-navy/40">
                  {formatDate(item.date)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
