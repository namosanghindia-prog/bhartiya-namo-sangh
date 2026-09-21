"use client";

import { T } from "@/lib/locale";
import { WOMEN_POINTS, YOUTH_POINTS } from "@/lib/home-content";
import Reveal from "@/components/home/Reveal";

export default function YouthWomen() {
  return (
    <section id="youth" className="bg-white">
      <Split
        id="youth-power"
        image="/home/youth-workshop.jpg"
        kicker={{ en: "Youth Power", hi: "युवा शक्ति" }}
        title={{
          en: "Empowering India’s next generation",
          hi: "भारत की अगली पीढ़ी को सशक्त करना",
        }}
        points={YOUTH_POINTS}
        reverse={false}
      />
      <Split
        id="women"
        image="/home/women-lead.jpg"
        kicker={{ en: "Women’s Power", hi: "महिला शक्ति" }}
        title={{
          en: "Participation. Leadership. Opportunity.",
          hi: "भागीदारी। नेतृत्व। अवसर।",
        }}
        points={WOMEN_POINTS}
        reverse
      />
    </section>
  );
}

function Split({
  id,
  image,
  kicker,
  title,
  points,
  reverse,
}: {
  id: string;
  image: string;
  kicker: { en: string; hi: string };
  title: { en: string; hi: string };
  points: { en: string; hi: string }[];
  reverse: boolean;
}) {
  return (
    <div id={id} className="grid min-h-[70vh] grid-cols-1 lg:grid-cols-2">
      <div className={`relative min-h-[50vh] ${reverse ? "lg:order-2" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div
        className={`flex items-center bg-[#f6f4f0] px-6 py-16 sm:px-12 lg:px-16 ${
          reverse ? "lg:order-1" : ""
        }`}
      >
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-saffron-800">
            <T>{kicker}</T>
          </p>
          <T
            as="h2"
            className="mt-4 max-w-lg font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
          >
            {title}
          </T>
          <ul className="mt-8 space-y-3">
            {points.map((point) => (
              <li key={point.en} className="flex items-center gap-3 text-lg text-navy/80">
                <span className="h-px w-8 bg-saffron-700" aria-hidden="true" />
                <T>{point}</T>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </div>
  );
}
