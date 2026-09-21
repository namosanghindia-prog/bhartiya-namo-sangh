"use client";

import { T, useLocale } from "@/lib/locale";
import { PHILOSOPHY } from "@/lib/about-content";
import Reveal from "@/components/home/Reveal";
import DragRow from "@/components/about/DragRow";

function Card({
  item,
  compact = false,
}: {
  item: (typeof PHILOSOPHY)[number];
  compact?: boolean;
}) {
  const { locale } = useLocale();
  return (
    <article
      className={`group relative h-[240px] overflow-hidden rounded-2xl about-glass p-6 ${
        compact ? "w-[78vw] shrink-0 snap-start" : "w-full min-h-[240px]"
      }`}
    >
      <T as="h3" className="font-heading text-2xl font-semibold text-navy">
        {item.title}
      </T>
      <p
        lang={locale === "hi" ? "hi" : undefined}
        className={`mt-4 text-sm leading-relaxed text-navy/70 opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 ${
          locale === "hi" ? "font-devanagari" : ""
        }`}
      >
        {item[locale]}
      </p>
      <p className="pointer-events-none absolute bottom-6 left-6 hidden text-xs uppercase tracking-[0.2em] text-navy/35 sm:block sm:group-hover:opacity-0">
        <T>{{ en: "Hover to read", hi: "पढ़ने के लिए स्पर्श करें" }}</T>
      </p>
    </article>
  );
}

export default function Philosophy() {
  return (
    <section id="philosophy" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
            <T>{{ en: "Our Philosophy", hi: "हमारे मूल विचार" }}</T>
          </p>
          <T
            as="h2"
            className="mt-3 max-w-3xl font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
          >
            {{
              en: "The ground every programme stands on.",
              hi: "जिस आधार पर हर कार्यक्रम खड़ा है।",
            }}
          </T>
        </Reveal>
      </div>

      <div className="mt-12 sm:hidden">
        <DragRow className="px-4">
          {PHILOSOPHY.map((item) => (
            <Card key={item.title.en} item={item} compact />
          ))}
        </DragRow>
      </div>

      <div className="mx-auto mt-12 hidden max-w-7xl grid-cols-2 gap-5 px-4 sm:grid sm:px-6 lg:grid-cols-5 lg:px-8">
        {PHILOSOPHY.map((item) => (
          <Card key={item.title.en} item={item} />
        ))}
      </div>
    </section>
  );
}
