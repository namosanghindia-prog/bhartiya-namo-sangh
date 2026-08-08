"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Donation } from "@/lib/supabase/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MyDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(null);

  useEffect(() => {
    async function loadDonations() {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .eq("member_id", user.id)
        .order("donated_at", { ascending: false });

      if (error) {
        console.error("Failed to load donations:", error);
      } else if (data) {
        setDonations(data);
      }
      setLoading(false);
    }

    loadDonations();
  }, []);

  async function downloadReceipt(donationId: string) {
    setDownloadingReceipt(donationId);

    const res = await fetch("/api/donations/receipt-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donationId }),
    });

    setDownloadingReceipt(null);

    if (!res.ok) {
      const data = await res.json();
      alert("Failed to get receipt: " + (data.error || "Unknown error"));
      return;
    }

    const { url } = await res.json();
    window.open(url, "_blank");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-navy/60">Loading donations...</div>
      </div>
    );
  }

  const total = donations.reduce((sum, d) => sum + d.amount, 0);
  const avg = donations.length > 0 ? Math.round(total / donations.length) : 0;
  const nextMilestone = 50000;
  const pct = Math.min(Math.round((total / nextMilestone) * 100), 100);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-semibold text-navy">
        My Donations
      </h1>

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
              {donations.length}
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
            {donations.map((d) => (
              <tr key={d.id} className="border-t border-saffron-100">
                <td className="px-4 py-3 text-navy/70">
                  {formatDate(d.donated_at)}
                </td>
                <td className="px-4 py-3 font-medium text-navy">
                  ₹{d.amount.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-navy/70">{d.category}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      d.status === "verified"
                        ? "bg-forest/10 text-forest"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {d.status === "verified" ? "✓ Received" : d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {d.receipt_url ? (
                    <button
                      onClick={() => downloadReceipt(d.id)}
                      disabled={downloadingReceipt === d.id}
                      className="text-xs font-medium text-saffron-700 hover:text-saffron-800 disabled:opacity-50"
                    >
                      {downloadingReceipt === d.id ? "..." : "Download PDF"}
                    </button>
                  ) : (
                    <span className="text-xs text-navy/40">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {donations.length === 0 && (
          <div className="p-12 text-center text-navy/60">
            You haven&apos;t made any donations yet.
          </div>
        )}
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
