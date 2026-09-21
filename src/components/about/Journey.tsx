"use client";

import { T } from "@/lib/locale";
import { JOURNEY } from "@/lib/about-content";
import Reveal from "@/components/home/Reveal";
import DragRow from "@/components/about/DragRow";

export default function Journey() {
  return (
    <section id="journey" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
            <T>{{ en: "Our Journey", hi: "हमारी यात्रा" }}</T>
          </p>
          <T
            as="h2"
            className="mt-3 font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
          >
            {{
              en: "A living movement, still taking root.",
              hi: "एक जीवंत आंदोलन, जो अभी जड़ें जमा रहा है।",
            }}
          </T>
        </Reveal>
      </div>

      <DragRow className="relative mt-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute left-4 right-4 top-8 hidden h-px bg-navy/10 sm:block" />
        {JOURNEY.map((item, i) => (
          <article
            key={item.title.en}
            className="relative w-[240px] shrink-0 snap-start pt-14"
          >
            <span className="absolute left-0 top-[26px] h-3 w-3 rounded-full bg-saffron-700" />
            <p className="text-[11px] tracking-[0.22em] text-saffron-800">0{i + 1}</p>
            <T as="h3" className="mt-2 font-heading text-xl font-semibold text-navy">
              {item.title}
            </T>
            <T as="p" className="mt-2 text-sm leading-relaxed text-navy/65">
              {item.text}
            </T>
          </article>
        ))}
      </DragRow>
    </section>
  );
}
