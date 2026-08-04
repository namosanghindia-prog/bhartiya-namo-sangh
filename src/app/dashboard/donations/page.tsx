import { MY_DONATIONS } from "@/lib/dashboard-data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MyDonationsPage() {
  const total = MY_DONATIONS.reduce((sum, d) => sum + d.amount, 0);
  const avg = Math.round(total / MY_DONATIONS.length);
  const nextMilestone = 50000;
  const pct = Math.min(Math.round((total / nextMilestone) * 100), 100);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold text-navy">
        My Donations
      </h1>

      {/* Stats */}
      <div className="rounded-xl border border-saffron-200 bg-white p-6">
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <div className="font-heading text-2xl font-semibold text-saffron-700">
              ₹{total.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-navy/60">Total Donated</div>
          </div>
          <div>
            <div className="font-heading text-2xl font-semibold text-saffron-700">
              {MY_DONATIONS.length}
            </div>
            <div className="text-xs text-navy/60">Donations</div>
          </div>
          <div>
            <div className="font-heading text-2xl font-semibold text-saffron-700">
              ₹{avg.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-navy/60">Average</div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-navy/60 mb-1">
          <span>Next milestone: Premium Member</span>
          <span>
            ₹{total.toLocaleString("en-IN")} / ₹
            {nextMilestone.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="h-2 rounded-full bg-saffron-100 overflow-hidden">
          <div
            className="h-full bg-saffron-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* History table */}
      <div className="rounded-xl border border-saffron-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-saffron-50 text-navy/70">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {MY_DONATIONS.map((d, i) => (
              <tr key={i} className="border-t border-saffron-100">
                <td className="px-4 py-3 text-navy/70">
                  {formatDate(d.date)}
                </td>
                <td className="px-4 py-3 font-medium text-navy">
                  ₹{d.amount.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-navy/70">{d.category}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-forest/10 px-2 py-0.5 text-xs font-medium text-forest">
                    ✓ {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-xs font-medium text-saffron-700 hover:text-saffron-800">
                    Download PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <a
        href="/donate"
        className="inline-block rounded-md bg-saffron-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800"
      >
        Make Another Donation
      </a>
    </div>
  );
}
