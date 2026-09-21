"use client";

import { useEffect, useRef, useState } from "react";
import { T } from "@/lib/locale";
import { TIMELINE } from "@/lib/home-content";
import Reveal from "@/components/home/Reveal";

export default function Timeline() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onScroll() {
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.75;
      const end = -rect.height + vh * 0.25;
      const p = (start - rect.top) / (start - end);
      setProgress(Math.min(1, Math.max(0, p)));
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section id="journey" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
            <T>{{ en: "Our Bharat", hi: "हमारा भारत" }}</T>
          </p>
          <T
            as="h2"
            className="mt-3 font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
          >
            {{ en: "A timeline of a living movement.", hi: "एक जीवंत आंदोलन की समय-रेखा।" }}
          </T>
        </Reveal>
      </div>

      <div
        ref={ref}
        className="relative mt-12 overflow-x-auto px-4 pb-6 sm:px-6 lg:px-8"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="relative flex min-w-[980px] gap-6">
          <div className="absolute left-0 right-0 top-8 h-px bg-navy/10" />
          <div
            className="absolute left-0 top-8 h-px bg-saffron-700 origin-left"
            style={{ width: `${progress * 100}%` }}
          />
          {TIMELINE.map((item, i) => {
            const active = progress > i / (TIMELINE.length - 1) - 0.05;
            return (
              <article
                key={item.id}
                className={`relative w-[240px] shrink-0 pt-14 transition-opacity duration-500 ${
                  active ? "opacity-100" : "opacity-40"
                }`}
              >
                <span
                  className={`absolute left-0 top-[26px] h-3 w-3 rounded-full border-2 ${
                    active
                      ? "border-saffron-700 bg-saffron-700"
                      : "border-navy/20 bg-white"
                  }`}
                />
                <p className="font-heading text-2xl font-semibold text-saffron-800">
                  {item.year}
                </p>
                <T as="h3" className="mt-2 font-heading text-xl font-semibold text-navy">
                  {item.title}
                </T>
                <T as="p" className="mt-2 text-sm leading-relaxed text-navy/65">
                  {item.text}
                </T>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
