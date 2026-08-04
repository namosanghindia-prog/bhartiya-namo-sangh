"use client";

import { useState } from "react";

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<"general" | "email" | "payments">("general");

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-heading text-2xl font-semibold text-navy">
        Settings
      </h1>

      <div className="flex gap-2 border-b border-saffron-200">
        {(["general", "email", "payments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${
              tab === t
                ? "border-saffron-700 text-saffron-800"
                : "border-transparent text-navy/60 hover:text-navy"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="rounded-xl border border-saffron-200 bg-white p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-navy">
            General settings
          </h2>
          <div>
            <label className="block text-sm text-navy/70 mb-1">
              Organization name
            </label>
            <input
              defaultValue="Bhartiya Namo Sangh"
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-navy/70 mb-1">
                Founded year
              </label>
              <input
                defaultValue="2022"
                className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
              />
            </div>
            <div>
              <label className="block text-sm text-navy/70 mb-1">
                Primary email
              </label>
              <input
                defaultValue="contact@bnsindia.org"
                className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
              />
            </div>
          </div>
          <button className="rounded-md bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800">
            Update
          </button>
        </div>
      )}

      {tab === "email" && (
        <div className="rounded-xl border border-saffron-200 bg-white p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-navy">
            Email settings
          </h2>
          <p className="text-xs text-navy/50">
            Configure SendGrid/AWS SES credentials once the email backend is
            connected.
          </p>
          <div>
            <label className="block text-sm text-navy/70 mb-1">
              SMTP server
            </label>
            <input
              placeholder="smtp.sendgrid.net"
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
          <div>
            <label className="block text-sm text-navy/70 mb-1">
              Sender email
            </label>
            <input
              placeholder="noreply@bnsindia.org"
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
          <div className="flex gap-3">
            <button className="rounded-md border border-saffron-200 px-5 py-2 text-sm font-medium text-navy hover:bg-saffron-50">
              Test Email
            </button>
            <button className="rounded-md bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800">
              Update
            </button>
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div className="rounded-xl border border-saffron-200 bg-white p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-navy">
            Payment settings (Razorpay)
          </h2>
          <p className="text-xs text-navy/50">
            Add your Razorpay key/secret once you're ready to accept live
            donations.
          </p>
          <div>
            <label className="block text-sm text-navy/70 mb-1">
              Razorpay Key ID
            </label>
            <input
              placeholder="rzp_test_..."
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
          <div>
            <label className="block text-sm text-navy/70 mb-1">
              Razorpay Secret Key
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
          </div>
          <button className="rounded-md bg-saffron-700 px-5 py-2 text-sm font-semibold text-white hover:bg-saffron-800">
            Update
          </button>
        </div>
      )}
    </div>
  );
}
