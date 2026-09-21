"use client";

import { T, useLocale } from "@/lib/locale";
import { WHO_DETAIL, WHO_INTRO, WHO_PILLARS } from "@/lib/about-content";
import Reveal from "@/components/home/Reveal";
import LearnMore from "@/components/about/LearnMore";

export default function WhoWeAre() {
  const { locale } = useLocale();

  return (
    <section id="who" className="bg-[#f6f4f0] py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <Reveal className="lg:col-span-5">
          <p
            lang="hi"
            className="font-devanagari text-4xl font-semibold tracking-tight text-navy sm:text-6xl"
          >
            हम कौन हैं?
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
            Who we are
          </p>
        </Reveal>
        <Reveal className="lg:col-span-7">
          <p
            lang={locale === "hi" ? "hi" : undefined}
            className={`text-lg leading-relaxed text-navy/80 sm:text-xl ${
              locale === "hi" ? "font-devanagari" : ""
            }`}
          >
            {WHO_INTRO[locale]}
          </p>
          <LearnMore>
            {WHO_DETAIL.map((para) => (
              <p
                key={para.en}
                lang={locale === "hi" ? "hi" : undefined}
                className={`text-base leading-relaxed text-navy/70 ${
                  locale === "hi" ? "font-devanagari" : ""
                }`}
              >
                {para[locale]}
              </p>
            ))}
          </LearnMore>
        </Reveal>
      </div>

      <div className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {WHO_PILLARS.map((pillar, i) => (
          <Reveal key={pillar.title.en} className={`home-delay-${(i % 3) + 1}`}>
            <article className="h-full rounded-2xl border border-navy/8 bg-white p-6">
              <span className="text-[11px] uppercase tracking-[0.28em] text-saffron-800">
                0{i + 1}
              </span>
              <T as="h3" className="mt-3 font-heading text-2xl font-semibold text-navy">
                {pillar.title}
              </T>
              <T as="p" className="mt-2 text-sm text-navy/60">
                {pillar.line}
              </T>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
