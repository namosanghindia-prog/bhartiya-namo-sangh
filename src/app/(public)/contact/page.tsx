"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Branch } from "@/lib/supabase/types";

interface ContactInfo {
  primary_email: string | null;
  phone_primary: string | null;
  phone_secondary: string | null;
  whatsapp_number: string | null;
  address_line: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
}

export default function ContactPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const [branchesRes, settingsRes] = await Promise.all([
        supabase
          .from("branches")
          .select("*")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("organization_settings")
          .select("primary_email, phone_primary, phone_secondary, whatsapp_number, address_line, city, state, pincode, facebook_url, instagram_url, youtube_url")
          .eq("id", 1)
          .single(),
      ]);

      if (branchesRes.data) setBranches(branchesRes.data);
      if (settingsRes.data) setContactInfo(settingsRes.data);
    }
    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setSent(true);
  }

  function formatAddress(): string | null {
    if (!contactInfo) return null;
    const parts = [
      contactInfo.address_line,
      contactInfo.city,
      contactInfo.state,
      contactInfo.pincode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  }

  const address = formatAddress();
  const hasSocialLinks = contactInfo && (
    contactInfo.facebook_url || contactInfo.instagram_url || contactInfo.youtube_url
  );

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                {address && (
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0">📍</span>
                    <span>{address}</span>
                  </li>
                )}
                {contactInfo?.primary_email && (
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0">✉️</span>
                    <a
                      href={`mailto:${contactInfo.primary_email}`}
                      className="hover:text-saffron-700 transition-colors"
                    >
                      {contactInfo.primary_email}
                    </a>
                  </li>
                )}
                {contactInfo?.phone_primary && (
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0">📞</span>
                    <a
                      href={`tel:${contactInfo.phone_primary.replace(/\s/g, "")}`}
                      className="hover:text-saffron-700 transition-colors"
                    >
                      {contactInfo.phone_primary}
                    </a>
                  </li>
                )}
                {contactInfo?.phone_secondary && (
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0">📱</span>
                    <a
                      href={`tel:${contactInfo.phone_secondary.replace(/\s/g, "")}`}
                      className="hover:text-saffron-700 transition-colors"
                    >
                      {contactInfo.phone_secondary}
                    </a>
                  </li>
                )}
                {contactInfo?.whatsapp_number && (
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0">💬</span>
                    <a
                      href={`https://wa.me/${contactInfo.whatsapp_number.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-saffron-700 transition-colors"
                    >
                      WhatsApp: {contactInfo.whatsapp_number}
                    </a>
                  </li>
                )}
              </ul>

              {hasSocialLinks && (
                <div className="mt-4 pt-4 border-t border-saffron-100">
                  <p className="text-xs text-navy/50 mb-2">Follow us</p>
                  <div className="flex gap-3">
                    {contactInfo?.facebook_url && (
                      <a
                        href={contactInfo.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 w-9 rounded-full bg-saffron-100 flex items-center justify-center text-saffron-700 hover:bg-saffron-200 transition-colors"
                        aria-label="Facebook"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                        </svg>
                      </a>
                    )}
                    {contactInfo?.instagram_url && (
                      <a
                        href={contactInfo.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 w-9 rounded-full bg-saffron-100 flex items-center justify-center text-saffron-700 hover:bg-saffron-200 transition-colors"
                        aria-label="Instagram"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="17.5" cy="6.5" r="1.5"/>
                        </svg>
                      </a>
                    )}
                    {contactInfo?.youtube_url && (
                      <a
                        href={contactInfo.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 w-9 rounded-full bg-saffron-100 flex items-center justify-center text-saffron-700 hover:bg-saffron-200 transition-colors"
                        aria-label="YouTube"
                      >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {!contactInfo && (
                <p className="text-sm text-navy/50">Loading contact information...</p>
              )}
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
