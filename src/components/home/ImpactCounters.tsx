"use client";

import { useEffect, useRef, useState } from "react";
import { T } from "@/lib/locale";
import { IMPACT_STATS } from "@/lib/home-content";

function useCountUp(target: number, enabled: boolean, duration = 1600) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ms = reduce ? 0 : duration;
    let start: number | null = null;
    let raf = 0;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      if (start === null) start = now;
      const p = ms === 0 ? 1 : Math.min(1, (now - start) / ms);
      setValue(Math.round(ease(p) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, target, duration]);

  return value;
}

function Stat({
  value,
  prefix,
  suffix,
  label,
  enabled,
}: {
  value: number;
  prefix?: string;
  suffix: string;
  label: { en: string; hi: string };
  enabled: boolean;
}) {
  const n = useCountUp(value, enabled);
  const formatted =
    value >= 1000 ? n.toLocaleString("en-IN") : String(n);

  return (
    <div className="text-center">
      <div className="font-heading text-4xl font-semibold tracking-tight text-navy sm:text-5xl lg:text-6xl">
        {prefix}
        {formatted}
        {suffix}
      </div>
      <T as="p" className="mt-2 text-sm uppercase tracking-[0.18em] text-navy/55">
        {label}
      </T>
    </div>
  );
}

export default function ImpactCounters() {
  const ref = useRef<HTMLElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEnabled(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      id="impact"
      ref={ref}
      className="border-b border-navy/8 bg-white"
      aria-label="Impact"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8 lg:py-20">
        {IMPACT_STATS.map((stat) => (
          <Stat
            key={stat.key}
            value={stat.value}
            prefix={"prefix" in stat ? stat.prefix : undefined}
            suffix={stat.suffix}
            label={stat.label}
            enabled={enabled}
          />
        ))}
      </div>
    </section>
  );
}
