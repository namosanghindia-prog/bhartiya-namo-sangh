import { ADMIN_DONATIONS, ADMIN_KPIS } from "@/lib/admin-data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDonationsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold text-navy">
        Donations
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-saffron-200 bg-white p-5">
          <div className="font-heading text-xl font-semibold text-saffron-700">
            ₹45 L
          </div>
          <div className="text-xs text-navy/60">This Month</div>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-5">
          <div className="font-heading text-xl font-semibold text-saffron-700">
            ₹{(ADMIN_KPIS.totalDonations / 10000000).toFixed(2)} Cr
          </div>
          <div className="text-xs text-navy/60">This Year</div>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-5">
          <div className="font-heading text-xl font-semibold text-saffron-700">
            ₹2,400
          </div>
          <div className="text-xs text-navy/60">Avg Donation</div>
        </div>
        <div className="rounded-xl border border-saffron-200 bg-white p-5">
          <div className="font-heading text-xl font-semibold text-saffron-700">
            {ADMIN_KPIS.totalMembers.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-navy/60">Donors</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-saffron-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-saffron-50 text-navy/70">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Donor</th>
              <th className="text-left px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ADMIN_DONATIONS.map((d) => (
              <tr key={d.id} className="border-t border-saffron-100">
                <td className="px-4 py-3 font-medium text-navy">
                  {d.donor}
                </td>
                <td className="px-4 py-3 text-navy/70">
                  ₹{d.amount.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-navy/70">
                  {formatDate(d.date)}
                </td>
                <td className="px-4 py-3 text-navy/70">{d.category}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      d.status === "Verified"
                        ? "bg-forest/10 text-forest"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button className="text-xs font-medium text-saffron-700 hover:text-saffron-800">
                    View Receipt
                  </button>
                  <button className="text-xs font-medium text-navy/70 hover:text-navy">
                    Send Thanks
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-navy/50">
        Showing {ADMIN_DONATIONS.length} of 8,234 sample donations (production
        dataset)
      </p>
    </div>
  );
}
