import { BRANCHES, EVENTS } from "@/lib/admin-data";

export default function AdminReportsPage() {
  const maxMembers = Math.max(...BRANCHES.map((b) => b.memberCount));

  const categoryCounts = EVENTS.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1;
    return acc;
  }, {});
  const maxCategoryCount = Math.max(...Object.values(categoryCounts));

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold text-navy">
        Reports & Analytics
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members by branch */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            Members by branch
          </h2>
          <div className="space-y-3">
            {BRANCHES.map((b) => (
              <div key={b.id}>
                <div className="flex justify-between text-xs text-navy/70 mb-1">
                  <span>{b.name}</span>
                  <span>{b.memberCount.toLocaleString("en-IN")}</span>
                </div>
                <div className="h-2 rounded-full bg-saffron-100 overflow-hidden">
                  <div
                    className="h-full bg-saffron-700"
                    style={{
                      width: `${(b.memberCount / maxMembers) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Events by category */}
        <div className="rounded-xl border border-saffron-200 bg-white p-6">
          <h2 className="font-heading text-lg font-semibold text-navy mb-4">
            Events by category
          </h2>
          <div className="space-y-3">
            {Object.entries(categoryCounts).map(([category, count]) => (
              <div key={category}>
                <div className="flex justify-between text-xs text-navy/70 mb-1">
                  <span>{category}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 rounded-full bg-saffron-100 overflow-hidden">
                  <div
                    className="h-full bg-forest"
                    style={{
                      width: `${(count / maxCategoryCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Branch-wise performance table */}
      <div className="rounded-xl border border-saffron-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-saffron-50 text-navy/70">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Branch</th>
              <th className="text-left px-4 py-3 font-medium">Members</th>
              <th className="text-left px-4 py-3 font-medium">Est. Year</th>
              <th className="text-left px-4 py-3 font-medium">Manager</th>
            </tr>
          </thead>
          <tbody>
            {BRANCHES.map((b) => (
              <tr key={b.id} className="border-t border-saffron-100">
                <td className="px-4 py-3 font-medium text-navy">{b.name}</td>
                <td className="px-4 py-3 text-navy/70">
                  {b.memberCount.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-navy/70">
                  {b.establishedYear}
                </td>
                <td className="px-4 py-3 text-navy/70">{b.managerName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-navy/50">
        Note: production version will use a charting library (Recharts) once
        connected to live Supabase data.
      </p>
    </div>
  );
}
