"use client";

import Link from "next/link";
import { T, useLocale } from "@/lib/locale";
import { CONTACT_PHONES, GOAL_LINES, RESOLVE } from "@/lib/about-content";
import Reveal from "@/components/home/Reveal";
import LearnMore from "@/components/about/LearnMore";

export default function ResolveJoin() {
  const { locale } = useLocale();

  return (
    <>
      <section id="resolve" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
              <T>{{ en: "Our Resolve", hi: "हमारा संकल्प" }}</T>
            </p>
            <p
              lang="hi"
              className="font-devanagari mt-6 text-3xl font-semibold leading-tight text-navy sm:text-5xl"
            >
              सशक्त भारत • आत्मनिर्भर भारत • संस्कारित भारत • एकजुट भारत
            </p>
            <p
              lang={locale === "hi" ? "hi" : undefined}
              className={`mt-8 text-lg leading-relaxed text-navy/75 ${
                locale === "hi" ? "font-devanagari" : ""
              }`}
            >
              {RESOLVE[locale]}
            </p>
            <LearnMore>
              <p className="text-sm font-medium text-navy">
                <T>{{ en: "A Bharat —", hi: "एक ऐसा भारत—" }}</T>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-navy/65">
                {GOAL_LINES.map((line) => (
                  <li key={line.en}>{locale === "hi" ? line.hi : line.en}</li>
                ))}
              </ul>
            </LearnMore>
          </Reveal>
        </div>
      </section>

      <section id="join" className="relative isolate overflow-hidden py-24 sm:py-32">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/home/skyline.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-navy/88" />
        <div className="relative mx-auto max-w-4xl px-4 text-center text-white sm:px-6 lg:px-8">
          <Reveal>
            <p
              lang="hi"
              className="font-devanagari text-3xl font-semibold leading-tight sm:text-5xl"
            >
              राष्ट्र निर्माण में आपकी भूमिका क्या होगी?
            </p>
            <p className="mt-5 text-sm uppercase tracking-[0.28em] text-saffron-300">
              Serve • Participate • Contribute • Build
            </p>
            <p
              lang="hi"
              className="font-devanagari mt-6 text-lg text-white/75"
            >
              राष्ट्रहित, समाजसेवा और जनजागरूकता के कार्यों से जुड़ें।
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/signup"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-saffron-700 px-7 text-sm font-semibold hover:bg-saffron-800 sm:w-auto"
              >
                <T>{{ en: "Become a member", hi: "सदस्य बनें" }}</T>
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/30 px-7 text-sm font-semibold hover:bg-white/10 sm:w-auto"
              >
                <T>{{ en: "Volunteer", hi: "स्वयंसेवक बनें" }}</T>
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-navy hover:bg-saffron-50 sm:w-auto"
              >
                <T>{{ en: "Contact us", hi: "संपर्क करें" }}</T>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-white/70">
              {CONTACT_PHONES.map((phone) => (
                <a key={phone} href={`tel:+91${phone}`} className="hover:text-white">
                  {phone}
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
