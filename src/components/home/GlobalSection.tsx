"use client";

import { T } from "@/lib/locale";
import { GLOBAL_STEPS } from "@/lib/home-content";
import Reveal from "@/components/home/Reveal";

export default function GlobalSection() {
  return (
    <section id="world" className="overflow-hidden bg-navy py-20 text-white sm:py-28">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-300">
            <T>{{ en: "Bharat Connected to the World", hi: "विश्व से जुड़ा भारत" }}</T>
          </p>
          <T
            as="h2"
            className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-5xl"
          >
            {{
              en: "A national movement with room to travel.",
              hi: "एक राष्ट्रीय आंदोलन, जिसे और दूर जाना है।",
            }}
          </T>
          <T as="p" className="mt-4 max-w-xl text-white/65">
            {{
              en: "The work is rooted in Bharat. The presentation is ready for partnerships, diaspora communities, and international friends as that chapter opens.",
              hi: "कार्य भारत में जड़ा है। साझेदारी, प्रवासी समुदायों और अंतरराष्ट्रीय मित्रों के लिए यह प्रस्तुति तैयार है, जब वह अध्याय खुले।",
            }}
          </T>
          <ol className="mt-10 space-y-6">
            {GLOBAL_STEPS.map((step, i) => (
              <li key={step.title.en} className="flex gap-4">
                <span className="font-heading text-sm text-saffron-300">0{i + 1}</span>
                <div>
                  <T as="h3" className="font-heading text-xl font-semibold">
                    {step.title}
                  </T>
                  <T as="p" className="mt-1 text-sm text-white/65">
                    {step.text}
                  </T>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="relative mx-auto h-[340px] w-[340px] sm:h-[420px] sm:w-[420px]">
          <div className="home-globe absolute inset-0 rounded-full" />
          <div className="home-globe-spin pointer-events-none absolute inset-[8%] rounded-full" />
          <svg viewBox="0 0 420 420" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <path
              d="M210 210 C 250 120, 340 90, 390 70"
              fill="none"
              stroke="rgba(255,166,81,0.7)"
              strokeWidth="1.5"
              className="home-dash"
            />
            <path
              d="M210 210 C 140 160, 80 80, 40 55"
              fill="none"
              stroke="rgba(76,175,80,0.55)"
              strokeWidth="1.5"
              className="home-dash"
            />
            <path
              d="M210 210 C 280 240, 360 280, 400 330"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.5"
              className="home-dash"
            />
            <circle cx="210" cy="210" r="6" fill="#ff6b35" />
            <circle cx="210" cy="210" r="14" fill="rgba(255,107,53,0.25)" className="home-map-pulse" />
          </svg>
          <span className="absolute left-1/2 top-[46%] -translate-x-1/2 text-[11px] uppercase tracking-[0.28em] text-saffron-300">
            Bharat
          </span>
        </div>
      </div>
    </section>
  );
}
