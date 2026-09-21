"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Branch } from "@/lib/supabase/types";
import { T, useLocale, useT } from "@/lib/locale";
import { BANK_ACCOUNTS, CONTACT_FAQ, CONTACT_TOPICS } from "@/lib/contact-content";
import type { PublicContactInfo } from "@/lib/contact-query";
import { INDIA_MAP_VIEW, INDIA_STATE_PATHS } from "@/lib/india-official-map";
import { statesForPolygon } from "@/lib/home-content";
import Reveal from "@/components/home/Reveal";

const FIELD =
  "w-full min-h-12 rounded-xl border border-navy/15 bg-white px-4 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-saffron-400";

export default function ContactExperience({
  branches,
  contact,
}: {
  branches: Branch[];
  contact: PublicContactInfo;
}) {
  const { locale } = useLocale();
  const t = useT();
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState("general");
  const [bankOpen, setBankOpen] = useState<string | null>(null);
  const [upiOpen, setUpiOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [paySent, setPaySent] = useState(false);
  const [branchQuery, setBranchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const byState = useMemo(() => {
    const map = new Map<string, Branch[]>();
    for (const b of branches) {
      const list = map.get(b.state) ?? [];
      list.push(b);
      map.set(b.state, list);
    }
    return map;
  }, [branches]);

  const filteredBranches = useMemo(() => {
    const q = branchQuery.trim().toLowerCase();
    return branches.filter((b) => {
      const blob = `${b.name} ${b.city} ${b.state}`.toLowerCase();
      const matchesQ = !q || blob.includes(q);
      const matchesState = !selectedState || b.state === selectedState;
      return matchesQ && matchesState;
    });
  }, [branches, branchQuery, selectedState]);

  const offices = contact.offices;
  const phones = [contact.phone_primary, contact.phone_secondary, contact.phone_tertiary].filter(
    (p): p is string => Boolean(p)
  );

  async function handleContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const message = String(form.get("message") || "").trim();
    const topicValue = String(form.get("topic") || "general");
    const topicMeta = CONTACT_TOPICS.find((item) => item.value === topicValue) ?? CONTACT_TOPICS[0];

    const supabase = createClient();
    const { error: insertError } = await supabase.from("contact_submissions").insert({
      name,
      email,
      phone: phone || null,
      subject: topicMeta.subject,
      message,
      category: topicMeta.category,
    });
    setSubmitting(false);
    if (insertError) {
      console.error("[contact] submit failed:", insertError);
      setError("We could not send that just then. Please try again or use the phone numbers on this page.");
      return;
    }
    setSent(true);
  }

  async function handlePaymentMatch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("payName") || "").trim();
    const membership = String(form.get("membershipNumber") || "").trim();
    const amount = String(form.get("amount") || "").trim();
    const method = String(form.get("method") || "").trim();
    const txn = String(form.get("txn") || "").trim();
    const date = String(form.get("payDate") || "").trim();
    const message = [
      "Payment matching request",
      `Membership number: ${membership || "not given"}`,
      `Amount: ${amount}`,
      `Method: ${method}`,
      `Transaction ID: ${txn}`,
      `Date: ${date}`,
    ].join("\n");

    const supabase = createClient();
    const { error: insertError } = await supabase.from("contact_submissions").insert({
      name,
      email: "payment-match@bhartiyanamosangh.com",
      phone: null,
      subject: "Payment confirmation",
      message,
      category: "donation",
    });
    if (insertError) {
      console.error("[contact] payment match failed:", insertError);
      setError("We could not record those payment details. Please mention your name and membership number in the bank reference.");
      return;
    }
    setPaySent(true);
  }

  return (
    <>
      <section className="relative isolate min-h-[80svh] overflow-hidden bg-navy text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/home/community.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/55 to-navy/90" />
        <div className="relative mx-auto flex min-h-[80svh] max-w-4xl flex-col items-center justify-end px-4 pb-20 pt-28 text-center sm:px-6 lg:justify-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/70">
            Let&apos;s Connect
          </p>
          <h1 lang="hi" className="font-devanagari mt-4 text-4xl font-semibold sm:text-6xl">
            हमसे जुड़िए
          </h1>
          <p lang="hi" className="font-devanagari mt-5 max-w-2xl text-base text-white/80 sm:text-lg">
            राष्ट्रहित, समाजसेवा और जनभागीदारी के इस अभियान में आपका स्वागत है।
          </p>
          <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <a href="#write" className="inline-flex min-h-12 items-center justify-center rounded-full bg-saffron-700 px-7 text-sm font-semibold hover:bg-saffron-800">
              <T>{{ en: "Contact Us", hi: "संपर्क करें" }}</T>
            </a>
            <Link href="/auth/signup" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-navy">
              <T>{{ en: "Become a Member", hi: "सदस्य बनें" }}</T>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { href: "#write", en: "Contact Us", hi: "संपर्क", text: { en: "Ask a question or send an enquiry.", hi: "प्रश्न या पूछताछ भेजें।" } },
            { href: "/auth/signup", en: "Become a Member", hi: "सदस्य बनें", text: { en: "Join Bhartiya Namo Sangh.", hi: "भारतीय नमो संघ से जुड़ें।" } },
            { href: "#branches", en: "Find a Branch", hi: "शाखा खोजें", text: { en: "Connect with your nearest branch.", hi: "निकटतम शाखा से जुड़ें।" } },
            { href: "#support", en: "Support Our Work", hi: "सहयोग करें", text: { en: "Contribute to social initiatives.", hi: "सामाजिक कार्यों में योगदान दें।" } },
          ].map((card) => (
            <Link key={card.en} href={card.href} className="rounded-2xl border border-navy/8 bg-[#f6f4f0] p-6 hover:border-saffron-600">
              <T as="h2" className="font-heading text-xl font-semibold text-navy">{{ en: card.en, hi: card.hi }}</T>
              <T as="p" className="mt-2 text-sm text-navy/60">{card.text}</T>
            </Link>
          ))}
        </div>
      </section>

      <section id="write" className="bg-[#f6f4f0] py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
                Get in touch
              </p>
              <T as="h2" className="mt-3 font-heading text-3xl font-semibold text-navy sm:text-5xl">
                {{ en: "We'd love to hear from you.", hi: "हम आपसे सुनना चाहेंगे।" }}
              </T>
              <T as="p" className="mt-4 text-navy/65">
                {{
                  en: "Write with a membership question, a volunteer offer, or a note for your nearest branch.",
                  hi: "सदस्यता, स्वयंसेवा, या निकटतम शाखा के लिए लिखें।",
                }}
              </T>
            </Reveal>
            <dl className="mt-10 space-y-6">
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-navy/40">Office · कार्यालय</dt>
                <dd className="mt-1 text-navy">
                  {offices.length > 0
                    ? offices.map((o) => (
                        <p key={o.address}>
                          {o.label ? <span className="font-medium">{o.label} — </span> : null}
                          {o.address}
                        </p>
                      ))
                    : "New Delhi, India"}
                </dd>
              </div>
              {contact.primary_email ? (
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-navy/40">Email</dt>
                  <dd className="mt-1">
                    <a href={`mailto:${contact.primary_email}`} className="text-navy hover:text-saffron-800">
                      {contact.primary_email}
                    </a>
                  </dd>
                </div>
              ) : null}
              {phones.length > 0 ? (
                <div>
                  <dt className="text-xs uppercase tracking-[0.2em] text-navy/40">Phone · फ़ोन</dt>
                  <dd className="mt-1 space-y-1">
                    {phones.map((p) => (
                      <a key={p} href={`tel:${p.replace(/\s/g, "")}`} className="block text-navy hover:text-saffron-800">
                        {p}
                      </a>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-white p-6 sm:p-8">
              <h3 className="font-heading text-2xl font-semibold text-navy">
                <T>{{ en: "Send us a message", hi: "संदेश भेजें" }}</T>
              </h3>
              {sent ? (
                <p className="mt-6 rounded-xl bg-forest/10 px-4 py-4 text-sm text-forest">
                  Thank you. Your message has been received.
                </p>
              ) : (
                <form onSubmit={handleContact} className="mt-6 space-y-4">
                  <input name="name" required placeholder={t({ en: "Full name", hi: "पूरा नाम" })} className={FIELD} />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input name="email" type="email" required placeholder="Email" className={FIELD} />
                    <input name="phone" type="tel" inputMode="tel" placeholder={t({ en: "Phone", hi: "फ़ोन" })} className={FIELD} />
                  </div>
                  <select name="topic" value={topic} onChange={(e) => setTopic(e.target.value)} className={FIELD}>
                    {CONTACT_TOPICS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {locale === "hi" ? item.label.hi : item.label.en}
                      </option>
                    ))}
                  </select>
                  <textarea name="message" required rows={6} placeholder={t({ en: "Message", hi: "संदेश" })} className={`${FIELD} py-3`} />
                  {error ? <p className="text-sm text-red-600">{error}</p> : null}
                  <button type="submit" disabled={submitting} className="min-h-12 rounded-full bg-saffron-700 px-7 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60">
                    {submitting ? "Sending…" : "Send message →"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="branches" className="bg-[#0c1220] py-20 text-white sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-300">
              Find your nearest BNMS branch
            </p>
            <T as="h2" className="mt-3 font-heading text-3xl font-semibold sm:text-5xl">
              {{ en: "Search by state, district or city.", hi: "राज्य, जिला या शहर से खोजें।" }}
            </T>
          </Reveal>
          <input
            value={branchQuery}
            onChange={(e) => setBranchQuery(e.target.value)}
            placeholder={t({ en: "Search by state / district / city", hi: "राज्य / जिला / शहर खोजें" })}
            className="mt-8 w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-saffron-400"
          />
          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
            <svg
              viewBox={`0 0 ${INDIA_MAP_VIEW.w} ${INDIA_MAP_VIEW.h}`}
              className="h-auto w-full lg:col-span-7"
              role="img"
              aria-label="India map of published branches"
            >
              {INDIA_STATE_PATHS.map((state) => {
                const names = statesForPolygon(state.name);
                const has = names.some((n) => byState.has(n));
                const selected = selectedState ? names.includes(selectedState) : false;
                return (
                  <path
                    key={state.id}
                    d={state.d}
                    fill={selected ? "rgba(255,107,53,0.35)" : has ? "rgba(255,166,81,0.16)" : "rgba(255,255,255,0.04)"}
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth="0.8"
                    className={has ? "cursor-pointer" : undefined}
                    onClick={() => {
                      const match = names.find((n) => byState.has(n));
                      if (match) setSelectedState(match);
                    }}
                  >
                    <title>{locale === "hi" ? state.nameHi : state.name}</title>
                  </path>
                );
              })}
            </svg>
            <aside className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-5">
              <h3 className="font-heading text-xl font-semibold">
                {selectedState || t({ en: "Select a state", hi: "राज्य चुनें" })}
              </h3>
              <ul className="mt-5 max-h-80 space-y-3 overflow-y-auto text-sm">
                {filteredBranches.slice(0, 40).map((b) => (
                  <li key={b.id} className="border-b border-white/10 pb-3">
                    <p className="font-medium">{b.name}</p>
                    <p className="text-white/55">{b.city}, {b.state}</p>
                    {b.phone ? (
                      <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="text-saffron-300">{b.phone}</a>
                    ) : null}
                  </li>
                ))}
              </ul>
              <Link href="/branches" className="mt-6 inline-block text-sm font-semibold text-saffron-300">
                <T>{{ en: "View all branches", hi: "सभी शाखाएँ देखें" }}</T> →
              </Link>
              <p className="mt-4 text-[11px] text-white/35">
                International boundary as per Survey of India. Only published branches are listed.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section id="support" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">Support our work</p>
            <T as="h2" className="mt-3 max-w-3xl font-heading text-3xl font-semibold text-navy sm:text-5xl">
              {{
                en: "Your support helps BNMS continue social, charitable, environmental and educational initiatives.",
                hi: "आपका सहयोग सामाजिक, सेवा, पर्यावरण और शिक्षा के कार्यों को आगे बढ़ाता है।",
              }}
            </T>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { href: "/auth/signup", en: "Membership", hi: "सदस्यता", text: { en: "Join the organisation.", hi: "संगठन से जुड़ें।" } },
              { href: "/donate", en: "Donation", hi: "दान", text: { en: "Support ongoing initiatives.", hi: "चल रहे कार्यों का समर्थन करें।" } },
              { href: "#write", en: "Partnership", hi: "साझेदारी", text: { en: "Collaborate with BNMS.", hi: "BNMS के साथ सहयोग करें।" } },
            ].map((card) => (
              <Link key={card.en} href={card.href} className="rounded-2xl border border-navy/10 p-8 hover:border-saffron-600">
                <T as="h3" className="font-heading text-2xl font-semibold text-navy">{{ en: card.en, hi: card.hi }}</T>
                <T as="p" className="mt-2 text-sm text-navy/60">{card.text}</T>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="scan" className="bg-[#f6f4f0] py-20 sm:py-28">
        <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">Scan & contribute</p>
          <div className="mx-auto mt-8 rounded-3xl bg-white p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/payment-qr.png" alt="Scan this QR code to pay Bhartiya Namo Sangh" className="mx-auto w-[240px]" />
            <p className="mt-4 text-sm text-navy/55">Works with any UPI app</p>
            <button type="button" onClick={() => setUpiOpen((v) => !v)} className="mt-6 text-sm font-semibold text-saffron-800">
              {upiOpen ? "Hide UPI details" : "View UPI details"}
            </button>
            {upiOpen ? (
              <p className="mt-3 text-sm text-navy/70">
                Scan the QR with any UPI app. For bank transfer, open the account cards below. Please mention your name and membership number in the payment reference.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-heading text-3xl font-semibold text-navy">Bank details</h2>
          <div className="mt-8 space-y-4">
            {BANK_ACCOUNTS.map((account) => {
              const open = bankOpen === account.id;
              return (
                <div key={account.id} className="rounded-2xl border border-navy/10">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-6 py-5 text-left"
                    onClick={() => setBankOpen(open ? null : account.id)}
                    aria-expanded={open}
                  >
                    <span>
                      <span className="block font-heading text-xl font-semibold text-navy">{account.name}</span>
                      <span className="text-sm text-navy/50">{account.place}</span>
                    </span>
                    <span className="text-sm font-semibold text-saffron-800">{open ? "Hide" : "View bank details +"}</span>
                  </button>
                  {open ? (
                    <dl className="border-t border-navy/10 px-6 py-4">
                      {account.fields.map(([label, value]) => (
                        <div key={label} className="flex flex-wrap justify-between gap-2 py-2">
                          <dt className="text-sm text-navy/50">{label}</dt>
                          <dd className="font-mono text-sm font-semibold text-navy">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f4f0] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-heading text-3xl font-semibold text-navy">Already contributed?</h2>
          <p className="mt-3 text-navy/65">
            Help us match your contribution with your membership record. Name and membership number in the payment reference still help most.
          </p>
          {paySent ? (
            <p className="mt-6 rounded-xl bg-forest/10 px-4 py-4 text-sm text-forest">Thank you. We have recorded these details for matching.</p>
          ) : (
            <form onSubmit={handlePaymentMatch} className="mt-8 space-y-4 rounded-3xl bg-white p-6 sm:p-8">
              <input name="payName" required placeholder="Name" className={FIELD} />
              <input name="membershipNumber" placeholder="Membership number (if you have one)" className={FIELD} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input name="amount" required placeholder="Amount (₹)" className={FIELD} />
                <select name="method" required className={FIELD} defaultValue="">
                  <option value="" disabled>Payment method</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank transfer</option>
                </select>
              </div>
              <input name="txn" required placeholder="Transaction ID" className={FIELD} />
              <input name="payDate" type="date" required className={FIELD} />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button type="submit" className="min-h-12 rounded-full bg-navy px-7 text-sm font-semibold text-white">
                Submit payment details
              </button>
            </form>
          )}
        </div>
      </section>

      <section id="faq" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-heading text-3xl font-semibold text-navy">Frequently asked questions</h2>
          <div className="mt-10 divide-y divide-navy/10">
            {CONTACT_FAQ.map((item, i) => {
              const open = faqOpen === i;
              return (
                <div key={item.q.en}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-5 text-left font-heading text-lg text-navy"
                    aria-expanded={open}
                    onClick={() => setFaqOpen(open ? null : i)}
                  >
                    <T>{item.q}</T>
                    <span>{open ? "−" : "+"}</span>
                  </button>
                  {open ? (
                    <T as="p" className="pb-5 text-sm leading-relaxed text-navy/65">{item.a}</T>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden py-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/home/skyline.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-navy/88" />
        <div className="relative mx-auto max-w-3xl px-4 text-center text-white">
          <p className="text-xs uppercase tracking-[0.28em] text-saffron-300">Your next step starts here</p>
          <p className="mt-4 font-heading text-3xl font-semibold sm:text-5xl">Connect. Participate. Serve. Contribute.</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/auth/signup" className="inline-flex min-h-12 items-center rounded-full bg-saffron-700 px-7 text-sm font-semibold">
              Join Bhartiya Namo Sangh
            </Link>
            <a href="#write" className="inline-flex min-h-12 items-center rounded-full border border-white/30 px-7 text-sm font-semibold">
              Contact us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
