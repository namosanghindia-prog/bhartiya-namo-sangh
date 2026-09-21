"use client";

import { T } from "@/lib/locale";
import { CITIZEN_STEPS } from "@/lib/about-content";
import Reveal from "@/components/home/Reveal";

export default function CitizenRole() {
  return (
    <section id="citizen" className="bg-navy py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-300">
            <T>{{ en: "Citizen’s Role", hi: "नागरिक की भूमिका" }}</T>
          </p>
          <p
            lang="hi"
            className="font-devanagari mt-5 max-w-4xl text-3xl font-semibold leading-tight sm:text-5xl"
          >
            राष्ट्र निर्माण केवल सरकार की जिम्मेदारी नहीं।
          </p>
          <p className="mt-4 max-w-2xl text-xl text-white/70 sm:text-2xl">
            Every citizen has a role.
          </p>
        </Reveal>

        <ol className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {CITIZEN_STEPS.map((step, i) => (
            <Reveal key={step.enTitle} className={`home-delay-${(i % 3) + 1}`}>
              <li className="border-t border-white/20 pt-6">
                <span className="text-[11px] tracking-[0.28em] text-saffron-300">
                  0{i + 1}
                </span>
                <p className="mt-3 font-heading text-3xl font-semibold">{step.enTitle}</p>
                <p className="mt-1 text-sm uppercase tracking-[0.16em] text-white/55">
                  {step.en}
                </p>
                <p lang="hi" className="font-devanagari mt-4 text-lg text-saffron-300">
                  {step.hiTitle}
                </p>
                <p lang="hi" className="font-devanagari text-sm text-white/55">
                  {step.hi}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
