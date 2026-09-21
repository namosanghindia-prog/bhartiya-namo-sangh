"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { T, useT } from "@/lib/locale";

export default function NewsletterSubscribe() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value.includes("@") || !value.includes(".")) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.from("contact_submissions").insert({
      name: "Newsletter subscriber",
      email: value,
      phone: null,
      subject: "Newsletter subscribe",
      message: "Please add this address to official updates and newsletters.",
      category: "other",
    });
    if (error) {
      console.error("[newsletter] subscribe failed:", error);
      setStatus("error");
      return;
    }
    setStatus("done");
    setEmail("");
  }

  return (
    <section className="bg-[#f6f4f0]" aria-labelledby="newsletter-heading">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-navy px-6 py-10 text-white sm:px-10 sm:py-12">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-saffron-300">
                Newsletter
              </p>
              <h2 id="newsletter-heading" className="mt-3 font-heading text-3xl font-semibold sm:text-4xl">
                <T>{{ en: "Stay with the work.", hi: "कार्य से जुड़े रहें।" }}</T>
              </h2>
              <p className="mt-3 max-w-md text-sm text-white/70">
                <T>
                  {{
                    en: "Official updates from Bhartiya Namo Sangh — events, service drives and branch news.",
                    hi: "भारतीय नमो संघ की आधिकारिक जानकारी — कार्यक्रम, सेवा अभियान और शाखा समाचार।",
                  }}
                </T>
              </p>
            </div>
            <div className="lg:col-span-6">
              {status === "done" ? (
                <p className="rounded-2xl bg-white/10 px-5 py-4 text-sm text-white/90">
                  <T>
                    {{
                      en: "Thank you. We have recorded your request for official updates.",
                      hi: "धन्यवाद। आधिकारिक अपडेट के लिए आपका अनुरोध दर्ज हो गया है।",
                    }}
                  </T>
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                  <label htmlFor="newsletter-email" className="sr-only">
                    {t({ en: "Email address", hi: "ईमेल पता" })}
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder={t({ en: "Your email address", hi: "आपका ईमेल पता" })}
                    className="min-h-12 flex-1 rounded-full border border-white/15 bg-white/10 px-5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-saffron-400"
                  />
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="min-h-12 rounded-full bg-saffron-700 px-7 text-sm font-semibold text-white hover:bg-saffron-800 disabled:opacity-60"
                  >
                    {status === "sending"
                      ? t({ en: "Subscribing…", hi: "जुड़ रहे हैं…" })
                      : t({ en: "Subscribe", hi: "सदस्यता लें" })}
                  </button>
                </form>
              )}
              {status === "error" ? (
                <p className="mt-3 text-sm text-saffron-300" role="alert">
                  <T>
                    {{
                      en: "Please enter a valid email and try again.",
                      hi: "कृपया सही ईमेल लिखें और फिर प्रयास करें।",
                    }}
                  </T>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
