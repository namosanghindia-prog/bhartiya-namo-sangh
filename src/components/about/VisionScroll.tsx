"use client";

import { T, useLocale } from "@/lib/locale";
import { VISION } from "@/lib/about-content";
import Reveal from "@/components/home/Reveal";
import DragRow from "@/components/about/DragRow";
import LearnMore from "@/components/about/LearnMore";

export default function VisionScroll() {
  const { locale } = useLocale();

  return (
    <section id="our-vision" className="bg-navy py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-300">
            <T>{{ en: "Our Vision", hi: "संगठन की दृष्टि" }}</T>
          </p>
          <T
            as="h2"
            className="mt-3 max-w-3xl font-heading text-3xl font-semibold tracking-tight sm:text-5xl"
          >
            {{
              en: "A strong, self-reliant, united, cultured and aware Bharat.",
              hi: "एक सशक्त, आत्मनिर्भर, एकजुट, संस्कारित और जागरूक भारत।",
            }}
          </T>
        </Reveal>
      </div>

      <DragRow className="mt-12 px-4 sm:px-6 lg:px-8">
        {VISION.map((item) => (
          <article
            key={item.n}
            className="relative h-[70vh] min-h-[480px] w-[86vw] shrink-0 snap-start overflow-hidden rounded-2xl sm:w-[520px] lg:w-[640px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/45 to-navy/10" />
            <div className="relative flex h-full flex-col justify-end p-7 sm:p-10">
              <p className="text-sm tracking-[0.28em] text-saffron-300">{item.n}</p>
              <h3
                lang="hi"
                className="font-devanagari mt-3 text-3xl font-semibold sm:text-5xl"
              >
                {item.titleHi}
              </h3>
              <p className="mt-2 text-sm uppercase tracking-[0.18em] text-white/70">
                {item.titleEn}
              </p>
              <p
                lang={locale === "hi" ? "hi" : undefined}
                className={`mt-4 max-w-md text-sm leading-relaxed text-white/80 ${
                  locale === "hi" ? "font-devanagari" : ""
                }`}
              >
                {item[locale === "hi" ? "hi" : "en"]}
              </p>
            </div>
          </article>
        ))}
      </DragRow>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <LearnMore>
          <p className="max-w-3xl text-sm leading-relaxed text-white/65">
            <T>
              {{
                en: "The long-term goal of Bhartiya Namo Sangh is to contribute to the building of a strong and aware Bharat — where every citizen knows their rights and duties, and plays their part.",
                hi: "भारतीय नमो संघ का दीर्घकालिक लक्ष्य एक सशक्त और जागरूक भारत के निर्माण में योगदान देना है — जहाँ प्रत्येक नागरिक अपने अधिकार और कर्तव्य जाने, और अपनी भूमिका निभाए।",
              }}
            </T>
          </p>
        </LearnMore>
      </div>
    </section>
  );
}
