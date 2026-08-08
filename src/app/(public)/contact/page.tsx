"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Branch } from "@/lib/supabase/types";

export default function ContactPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function loadBranches() {
      const supabase = createClient();
      const { data } = await supabase
        .from("branches")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (data) setBranches(data);
    }
    loadBranches();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setSent(true);
  }

  return (
    <>
      {/* HEADER */}
      <section className="bg-saffron-gradient text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold">
            Contact Us
          </h1>
          <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
            Have a question or want to get involved? We&apos;d love to hear
            from you.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact form */}
          <div className="lg:col-span-3">
            <h2 className="font-heading text-2xl font-semibold text-navy mb-6">
              Send us a message
            </h2>

            {sent ? (
              <div className="rounded-md bg-forest/10 border border-forest/20 px-4 py-4 text-sm text-forest">
                Thank you! Your message has been received — we&apos;ll get
                back to you soon.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Full name"
                    required
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    required
                    className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                </div>
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
                <select
                  defaultValue=""
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                >
                  <option value="">Select a branch (optional)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.city}, {b.state}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="Your message"
                  required
                  rows={5}
                  className="w-full rounded-md border border-saffron-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-saffron-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-saffron-800 transition-colors disabled:opacity-60"
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>

          {/* Contact info + branches */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-saffron-200 bg-white p-6">
              <h3 className="font-heading text-lg font-semibold text-navy mb-4">
                Get in touch
              </h3>
              <ul className="space-y-3 text-sm text-navy/70">
                <li>📍 New Delhi, India (Head Office)</li>
                <li>✉️ contact@bnsindia.org</li>
                <li>📞 +91 11 4567 8900</li>
              </ul>
            </div>

            <div className="rounded-xl border border-saffron-200 bg-white p-6">
              <h3 className="font-heading text-lg font-semibold text-navy mb-4">
                Our branches
              </h3>
              <ul className="space-y-2 text-sm text-navy/70 max-h-64 overflow-y-auto">
                {branches.map((b) => (
                  <li key={b.id} className="flex justify-between">
                    <span>{b.name}</span>
                    <span className="text-navy/40">
                      {b.city}, {b.state}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href="/branches"
                className="mt-4 inline-block text-sm font-medium text-saffron-700 hover:text-saffron-800"
              >
                View all branches →
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
