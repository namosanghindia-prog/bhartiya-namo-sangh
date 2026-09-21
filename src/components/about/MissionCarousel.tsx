"use client";

import Link from "next/link";
import { T, useLocale } from "@/lib/locale";
import { MISSION } from "@/lib/about-content";
import Reveal from "@/components/home/Reveal";
import DragRow from "@/components/about/DragRow";

export default function MissionCarousel() {
  const { locale } = useLocale();

  return (
    <section id="mission" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
            <T>{{ en: "Our Mission", hi: "संगठन का मिशन" }}</T>
          </p>
          <T
            as="h2"
            className="mt-3 max-w-3xl font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
          >
            {{
              en: "Eight duties, carried continuously.",
              hi: "आठ कर्तव्य, निरंतर।",
            }}
          </T>
        </Reveal>
      </div>

      <DragRow className="mt-12 px-4 sm:px-6 lg:px-8">
        {MISSION.map((item) => (
          <article
            key={item.n}
            className="w-[82vw] shrink-0 snap-start overflow-hidden rounded-2xl border border-navy/8 bg-[#f6f4f0] sm:w-[380px]"
          >
            <div className="relative aspect-[16/10]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="p-6">
              <p className="font-heading text-3xl text-saffron-800">{item.n}</p>
              <h3
                lang="hi"
                className="font-devanagari mt-2 text-2xl font-semibold text-navy"
              >
                {item.titleHi}
              </h3>
              <p className="mt-1 text-sm text-navy/50">{item.titleEn}</p>
              <p
                lang={locale === "hi" ? "hi" : undefined}
                className={`mt-3 text-sm leading-relaxed text-navy/70 ${
                  locale === "hi" ? "font-devanagari" : ""
                }`}
              >
                {item[locale === "hi" ? "hi" : "en"]}
              </p>
              <Link
                href={item.href}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-saffron-800"
              >
                <T>{{ en: "Explore", hi: "और देखें" }}</T>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </DragRow>
    </section>
  );
}
