"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SLIDES, type Slide } from "@/lib/slider-types";

export default function HeroSlider() {
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/slider")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.slides) && data.slides.length > 0) {
          setSlides(data.slides);
        }
      })
      .catch(() => {
        // Keep defaults on failure
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Autoplay every 6 seconds, pauses correctly on slide-count change
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  // Clamp index if slides shrink
  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  const slide = slides[index];
  if (!slide) return null;

  return (
    <section
      className="relative text-white overflow-hidden transition-colors duration-700"
      style={{ backgroundColor: slide.bgColor }}
      aria-live="polite"
      aria-busy={!loaded}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight">
          {slide.headline}
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
          {slide.subtext}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={slide.ctaHref}
            className="w-full sm:w-auto rounded-md bg-navy px-8 py-3 text-sm font-semibold text-white hover:bg-navy-light transition-colors"
          >
            {slide.ctaLabel}
          </Link>
          <Link
            href="/donate"
            className="w-full sm:w-auto rounded-md bg-white px-8 py-3 text-sm font-semibold text-saffron-800 hover:bg-saffron-50 transition-colors"
          >
            Donate Now
          </Link>
        </div>
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
          >
            ›
          </button>

          {/* Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-6 bg-white" : "w-2 bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
