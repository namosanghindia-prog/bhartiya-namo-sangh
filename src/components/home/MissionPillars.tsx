"use client";

import { T } from "@/lib/locale";
import { PILLARS } from "@/lib/home-content";
import Reveal from "@/components/home/Reveal";

export default function MissionPillars() {
  return (
    <section id="mission" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
            <T>{{ en: "Our Mission", hi: "हमारा ध्येय" }}</T>
          </p>
          <T
            as="h2"
            className="mt-3 max-w-3xl font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
          >
            {{
              en: "Four duties, carried in every branch.",
              hi: "चार कर्तव्य, हर शाखा में।",
            }}
          </T>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar, i) => (
            <Reveal key={pillar.id} className={`home-delay-${i + 1}`}>
              <article className="group relative isolate h-full min-h-[420px] overflow-hidden rounded-2xl bg-navy text-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pillar.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 group-hover:opacity-0"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pillar.hoverImage}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100 group-hover:scale-105 group-focus-within:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/55 to-navy/10 transition-colors duration-500 group-hover:from-navy/95" />
                <div className="relative flex h-full flex-col justify-end p-6">
                  <span className="text-[11px] uppercase tracking-[0.28em] text-saffron-300">
                    0{i + 1}
                  </span>
                  <T as="h3" className="mt-2 font-heading text-2xl font-semibold">
                    {pillar.title}
                  </T>
                  <T as="p" className="mt-3 text-sm leading-relaxed text-white/80">
                    {pillar.description}
                  </T>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
