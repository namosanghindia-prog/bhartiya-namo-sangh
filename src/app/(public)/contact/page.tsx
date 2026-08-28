"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Branch } from "@/lib/supabase/types";

interface Office {
  label: string;
  address: string;
}

interface ContactInfo {
  primary_email: string | null;
  phone_primary: string | null;
  phone_secondary: string | null;
  whatsapp_number: string | null;
  offices: Office[] | null;
  founder_name: string | null;
  founder_title: string | null;
  website_url: string | null;
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
          .select("primary_email, phone_primary, phone_secondary, whatsapp_number, offices, founder_name, founder_title, website_url, facebook_url, instagram_url, youtube_url")
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

  const offices = (contactInfo?.offices ?? []).filter(
    (o) => o && o.address && o.address.trim()
  );
  const websiteHref = contactInfo?.website_url
    ? /^https?:\/\//i.test(contactInfo.website_url)
      ? contactInfo.website_url
      : `https://${contactInfo.website_url}`
    : null;
  const websiteLabel = contactInfo?.website_url
    ? contactInfo.website_url.replace(/^https?:\/\//i, "").replace(/\/$/, "")
    : null;
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
                {contactInfo?.founder_name && (
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0">👤</span>
                    <span>
                      <span className="font-medium text-navy">
                        {contactInfo.founder_name}
                      </span>
                      {contactInfo.founder_title && (
                        <span className="block text-xs text-navy/50">
                          {contactInfo.founder_title}
                        </span>
                      )}
                    </span>
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
                {websiteHref && (
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0">🌐</span>
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-saffron-700 transition-colors"
                    >
                      {websiteLabel}
                    </a>
                  </li>
                )}
              </ul>

              {offices.length > 0 && (
                <div className="mt-4 pt-4 border-t border-saffron-100">
                  <p className="text-xs text-navy/50 mb-2">Our offices</p>
                  <ul className="space-y-3 text-sm text-navy/70">
                    {offices.map((o, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="flex-shrink-0">📍</span>
                        <span>
                          {o.label && (
                            <span className="block font-medium text-navy">
                              {o.label}
                            </span>
                          )}
                          {o.address}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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

      {/* Bank details + payment QR for membership fees and donations. */}
      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-saffron-200 bg-saffron-50/40 p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-semibold text-navy">
              Contribute to the Sangh
            </h2>
            <p className="mt-1 text-sm text-navy/60">
              For membership fees, donations and other regular payments, use the
              bank details below or scan the QR code.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Bank account */}
              <div className="md:col-span-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-navy/50 mb-3">
                  Bank transfer / NEFT / IMPS
                </h3>
                <dl className="divide-y divide-saffron-100 rounded-lg border border-saffron-200 bg-white">
                  {[
                    ["Account Name", "BHARTIYA NAMO SANGH"],
                    ["Bank", "Axis Bank Ltd."],
                    ["Branch", "Dwarka, New Delhi – 110075"],
                    ["Account Number", "92202000547190"],
                    ["IFSC Code", "UTIB0003893"],
                    ["Branch Code", "000460"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5"
                    >
                      <dt className="text-sm text-navy/60">{label}</dt>
                      <dd className="font-mono text-sm font-semibold text-navy break-all">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-navy/50">
                  Please mention your name and membership number in the payment
                  reference so we can match your contribution to your record.
                </p>
              </div>

              {/* Payment QR */}
              <div className="flex flex-col items-center">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-navy/50 mb-3">
                  Scan to pay
                </h3>
                <div className="rounded-lg border border-saffron-200 bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/payment-qr.png"
                    alt="Scan this QR code to pay Bhartiya Namo Sangh"
                    width={250}
                    height={368}
                    className="w-[220px] h-auto"
                  />
                </div>
                <p className="mt-2 text-xs text-navy/50 text-center">
                  Any UPI app
                </p>
              </div>
            </div>

            {/* Thank-you notice */}
            <div className="mt-8 rounded-lg border border-[#138808]/30 bg-[#138808]/5 px-5 py-4">
              <p className="font-heading text-base font-semibold text-[#0f6b1f]">
                हृदय से धन्यवाद · Thank You
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-navy/75">
                आपके सहयोग और विश्वास के लिए भारतीय नमो संघ आपका हृदय से आभारी है।
                आपका योगदान संगठन के सेवा कार्यों को आगे बढ़ाता है।
              </p>
              <p className="mt-2 text-sm leading-relaxed text-navy/75">
                Every contribution, however small, directly supports our work in
                the community. Thank you for standing with Bhartiya Namo Sangh.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
