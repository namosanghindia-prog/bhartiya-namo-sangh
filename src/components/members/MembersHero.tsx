"use client";

import Link from "next/link";
import { T, useLocale } from "@/lib/locale";

export default function MembersHero() {
  const { locale } = useLocale();

  return (
    <section
      className="relative isolate min-h-[88svh] overflow-hidden bg-navy text-white"
      aria-label={locale === "hi" ? "हमारे लोग" : "Our People"}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/home/community.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      <div className="about-tricolour-wash pointer-events-none absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/55 via-navy/55 to-navy/92" />

      <div className="relative z-10 mx-auto flex min-h-[88svh] max-w-4xl flex-col items-center justify-end px-4 pb-20 pt-28 text-center sm:px-6 lg:justify-center lg:pb-16 lg:pt-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-white/70 sm:text-xs">
          <T>{{ en: "Our People", hi: "हमारे लोग" }}</T>
        </p>
        <T
          as="h1"
          className="mt-5 font-heading text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl"
        >
          {{
            en: "The People Building Bharat",
            hi: "भारत का निर्माण करने वाले लोग",
          }}
        </T>
        <T as="p" className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
          {{
            en: "Meet the leaders, volunteers and members working together to serve communities and contribute to nation-building.",
            hi: "उन नेताओं, स्वयंसेवकों और सदस्यों से मिलें जो समुदायों की सेवा और राष्ट्र निर्माण में साथ कार्य करते हैं।",
          }}
        </T>
        <div className="mt-10 flex w-full max-w-xl flex-col items-center gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Link
            href="/auth/signup"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-saffron-700 px-7 text-sm font-semibold text-white hover:bg-saffron-800 sm:w-auto"
          >
            <T>{{ en: "Become a Member", hi: "सदस्य बनें" }}</T>
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-navy hover:bg-saffron-50 sm:w-auto"
          >
            <T>{{ en: "Volunteer With Us", hi: "स्वयंसेवक बनें" }}</T>
          </Link>
        </div>
      </div>
    </section>
  );
}
