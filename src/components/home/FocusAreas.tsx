"use client";

import { useRef } from "react";
import { T } from "@/lib/locale";
import { FOCUS_AREAS } from "@/lib/home-content";
import Reveal from "@/components/home/Reveal";

export default function FocusAreas() {
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scroll: 0 });

  return (
    <section id="people" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
            <T>{{ en: "Our Focus Areas", hi: "हमारे कार्यक्षेत्र" }}</T>
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <T
              as="h2"
              className="font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
            >
              {{
                en: "The people this work is for.",
                hi: "जिन लोगों के लिए यह कार्य है।",
              }}
            </T>
            <p className="text-sm text-navy/50">
              <T>{{ en: "Drag to explore", hi: "खींचकर देखें" }}</T>
            </p>
          </div>
        </Reveal>
      </div>

      <div
        ref={scroller}
        className="mt-10 flex cursor-grab snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 active:cursor-grabbing sm:px-6 lg:px-8"
        style={{ scrollbarWidth: "thin" }}
        onPointerDown={(e) => {
          const el = scroller.current;
          if (!el) return;
          drag.current = { active: true, startX: e.clientX, scroll: el.scrollLeft };
          el.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current.active || !scroller.current) return;
          scroller.current.scrollLeft =
            drag.current.scroll - (e.clientX - drag.current.startX);
        }}
        onPointerUp={() => {
          drag.current.active = false;
        }}
        onPointerCancel={() => {
          drag.current.active = false;
        }}
      >
        {FOCUS_AREAS.map((area) => (
          <article
            key={area.id}
            className="relative w-[78vw] shrink-0 snap-start overflow-hidden rounded-2xl sm:w-[340px]"
          >
            <div className="relative aspect-[3/4]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={area.image}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <T as="h3" className="font-heading text-3xl font-semibold">
                  {area.title}
                </T>
                <T as="p" className="mt-2 text-sm text-white/80">
                  {area.line}
                </T>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
