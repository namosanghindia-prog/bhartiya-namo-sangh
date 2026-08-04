import { ADMIN_KPIS, ADMIN_MEMBERS, EVENTS } from "@/lib/admin-data";

export default function AdminDashboardPage() {
  const topEvents = [...EVENTS]
    .sort((a, b) => b.registered - a.registered)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold text-navy">
        Admin Dashboard
      </h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-saffron-200 bg-white p-5">
          <div className="font-heading text-2xl font-semibold text-saffron-700">
            {ADMIN_KPIS.totalMembers.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-xs text-navy/60">Total Members</div>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-5">
          <div className="font-heading text-2xl font-semibold text-saffron-700">
            {ADMIN_KPIS.totalEvents}
          </div>
          <div className="mt-1 text-xs text-navy/60">Events Organized</div>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-5">
          <div className="font-heading text-2xl font-semibold text-saffron-700">
            ₹{(ADMIN_KPIS.totalDonations / 10000000).toFixed(2)} Cr
          </div>
          <div className="mt-1 text-xs text-navy/60">Total Raised</div>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-5">
          <div className="font-heading text-2xl font-semibold text-saffron-700">
            {ADMIN_KPIS.activePercent}%
          </div>
          <div className="mt-1 text-xs text-navy/60">Active Members</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent activity */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            Recent Activity
          </h2>
          <ul className="space-y-3 text-sm">
            {ADMIN_MEMBERS.slice(0, 5).map((m) => (
              <li key={m.id} className="flex justify-between text-navy/70">
                <span>
                  <span className="font-medium text-navy">{m.name}</span> —{" "}
                  {m.branch}
                </span>
                <span
                  className={`text-xs rounded-full px-2 py-0.5 ${
                    m.status === "active"
                      ? "bg-forest/10 text-forest"
                      : "bg-navy/10 text-navy/60"
                  }`}
                >
                  {m.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top events */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            Top Events (by registration)
          </h2>
          <ul className="space-y-3">
            {topEvents.map((e) => {
              const pct = Math.round(
                (e.registered / e.targetParticipants) * 100
              );
              return (
                <li key={e.id}>
                  <div className="flex justify-between text-sm text-navy mb-1">
                    <span>{e.title}</span>
                    <span className="text-navy/50">
                      {e.registered}/{e.targetParticipants}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-saffron-100 overflow-hidden">
                    <div
                      className="h-full bg-saffron-700"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
