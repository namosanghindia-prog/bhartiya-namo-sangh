"use client";

import { useState } from "react";

const PRESET_AMOUNTS = [500, 1000, 5000, 10000];

const PURPOSES = [
  { id: "general", label: "General Fund" },
  { id: "education", label: "Education" },
  { id: "environment", label: "Environment" },
  { id: "disaster", label: "Disaster Relief" },
  { id: "healthcare", label: "Healthcare" },
  { id: "community", label: "Community Development" },
];

const IMPACT = [
  { amount: "₹500", provides: "School supplies for 5 children" },
  { amount: "₹1,000", provides: "A day of disaster relief food kits" },
  { amount: "₹5,000", provides: "A full digital literacy workshop" },
];

const RECENT_DONATIONS = [
  { name: "Anonymous", amount: "₹1,000", time: "2 hours ago" },
  { name: "Rajesh Kumar", amount: "₹5,000", time: "1 day ago" },
  { name: "Priya Singh", amount: "₹2,500", time: "2 days ago" },
];

export default function DonatePage() {
  const [amount, setAmount] = useState<number | "custom">(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [purpose, setPurpose] = useState("general");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const finalAmount =
    amount === "custom" ? Number(customAmount) || 0 : amount;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (finalAmount <= 0) {
      setMessage("Please enter a valid donation amount.");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    // NOTE: Razorpay is not wired up yet. Once RAZORPAY_KEY_ID/SECRET are
    // configured, this should create an order via /api/razorpay/order and
    // open the Razorpay checkout modal with the returned order_id.
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setMessage(
      `Payment isn't connected yet — this would have started a ₹${finalAmount.toLocaleString(
        "en-IN"
      )} donation via Razorpay.`
    );
  }

  return (
    <>
      {/* HERO */}
      <section className="bg-saffron-gradient text-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold">
            Support Our Mission
          </h1>
          <p className="mt-4 text-lg text-white/90">
            Your contribution helps us create lasting impact across India
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-8">
            {/* Amount selector */}
            <div>
              <h2 className="font-heading text-xl font-semibold text-navy mb-3">
                Choose an amount
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRESET_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmount(a)}
                    className={`rounded-md border px-4 py-3 text-sm font-semibold transition-colors ${
                      amount === a
                        ? "border-saffron-700 bg-saffron-700 text-white"
                        : "border-saffron-200 text-navy hover:border-saffron-400"
                    }`}
                  >
                    ₹{a.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <label className="block text-sm text-navy/70 mb-1">
                  Or enter a custom amount
                </label>
                <div className="flex items-center rounded-md border border-saffron-200 focus-within:ring-2 focus-within:ring-saffron-400">
                  <span className="pl-3 text-navy/50 text-sm">₹</span>
                  <input
                    type="number"
                    min={1}
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setAmount("custom");
                    }}
                    placeholder="0"
                    className="w-full px-2 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Purpose */}
            <div>
              <h2 className="font-heading text-xl font-semibold text-navy mb-3">
                Donation purpose
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {PURPOSES.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ${
                      purpose === p.id
                        ? "border-saffron-700 bg-saffron-50"
                        : "border-saffron-200 hover:border-saffron-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="purpose"
                      value={p.id}
                      checked={purpose === p.id}
                      onChange={() => setPurpose(p.id)}
                      className="text-saffron-700"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Donor info */}
            <div>
              <h2 className="font-heading text-xl font-semibold text-navy mb-3">
                Your details
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Full name"
                  required={!anonymous}
                  disabled={anonymous}
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400 disabled:bg-saffron-50 disabled:text-navy/40"
                />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
                <label className="flex items-center gap-2 text-sm text-navy/70">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="rounded border-saffron-300"
                  />
                  Donate anonymously
                </label>
                <label className="flex items-center gap-2 text-sm text-navy/70">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-saffron-300"
                  />
                  Send receipt &amp; thank-you letter
                </label>
              </div>
            </div>

            {message && (
              <p className="text-sm text-saffron-800 bg-saffron-50 border border-saffron-200 rounded-md px-3 py-2">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-saffron-700 px-4 py-3 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors disabled:opacity-60"
            >
              {submitting
                ? "Processing..."
                : `Donate ₹${finalAmount.toLocaleString("en-IN")} via Razorpay`}
            </button>
            <p className="text-xs text-navy/50 text-center">
              🔒 Secured by Razorpay | 100% safe &amp; encrypted
            </p>
          </form>

          {/* Sidebar: impact + recent donations */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-saffron-200 bg-white p-6">
              <h3 className="font-heading text-lg font-semibold text-navy mb-4">
                Your impact
              </h3>
              <div className="space-y-3">
                {IMPACT.map((item) => (
                  <div key={item.amount} className="text-sm">
                    <span className="font-semibold text-saffron-700">
                      {item.amount}
                    </span>{" "}
                    <span className="text-navy/70">{item.provides}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-saffron-200 bg-white p-6">
              <h3 className="font-heading text-lg font-semibold text-navy mb-4">
                Recent donations
              </h3>
              <ul className="space-y-3">
                {RECENT_DONATIONS.map((d, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-semibold text-navy">
                      {d.amount}
                    </span>{" "}
                    <span className="text-navy/70">donated by {d.name}</span>
                    <div className="text-xs text-navy/40">{d.time}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
