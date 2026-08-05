"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_SLIDES, type Slide } from "@/lib/slider-types";

export default function HeroSlider() {
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSlides() {
      try {
        // Fetch admin-authored slides
        const sliderRes = await fetch("/api/slider");
        const sliderData = await sliderRes.json();
        let adminSlides: Slide[] = Array.isArray(sliderData.slides) && sliderData.slides.length > 0
          ? sliderData.slides
          : DEFAULT_SLIDES;

        // Fetch live business promotions
        const supabase = createClient();
        const now = new Date().toISOString();
        const { data: promos } = await supabase
          .from("business_promotions")
          .select("id, image_url, website_link, business:businesses(business_name, category, description)")
          .eq("status", "live")
          .gt("live_until", now);

        // Convert promotions to Slide shape
        type PromoRow = {
          id: string;
          image_url: string | null;
          website_link: string;
          business: { business_name: string; category: string; description: string | null }[] | null;
        };
        const promoSlides: Slide[] = (promos as PromoRow[] || []).map((p) => {
          const biz = p.business?.[0];
          return {
            id: `promo-${p.id}`,
            headline: biz?.business_name || "Featured Business",
            subtext: [biz?.category, biz?.description].filter(Boolean).join(" — ") || "Discover this member business",
            ctaLabel: "Visit Website",
            ctaHref: p.website_link || "/businesses",
            bgColor: "#FF6B35",
            imageUrl: p.image_url || undefined,
          };
        });

        if (!cancelled) {
          // Admin slides first, then live promotions appended after
          setSlides([...adminSlides, ...promoSlides]);
        }
      } catch {
        // Keep defaults on failure
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    loadSlides();
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

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  const slide = slides[index];
  if (!slide) return null;

  const hasImage = !!slide.imageUrl;
  const isPromoSlide = slide.id.startsWith("promo-");

  return (
    <section
      className="relative text-white overflow-hidden transition-colors duration-700"
      style={hasImage ? undefined : { backgroundColor: slide.bgColor }}
      aria-live="polite"
      aria-busy={!loaded}
    >
      {/* Background image */}
      {hasImage && (
        <div className="absolute inset-0">
          <img
            src={slide.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Gradient overlay - stronger at bottom where text sits */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/70 z-10" />

      {/* Content container - bottom anchored */}
      <div className="relative aspect-[2.4/1] min-h-[400px] flex flex-col justify-end z-10">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 text-center">
          {isPromoSlide && (
            <span className="inline-block mb-2 px-3 py-1 rounded-full bg-saffron-700/80 text-xs font-medium text-white">
              Sponsored
            </span>
          )}
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight drop-shadow-lg">
            {slide.headline}
          </h1>
          <p className="mt-4 sm:mt-6 text-lg sm:text-xl text-white/90 max-w-2xl mx-auto drop-shadow">
            {slide.subtext}
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {isPromoSlide ? (
              <a
                href={slide.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto rounded-md bg-navy px-8 py-3 text-sm font-semibold text-white hover:bg-navy-light transition-colors"
              >
                {slide.ctaLabel}
              </a>
            ) : (
              <Link
                href={slide.ctaHref}
                className="w-full sm:w-auto rounded-md bg-navy px-8 py-3 text-sm font-semibold text-white hover:bg-navy-light transition-colors"
              >
                {slide.ctaLabel}
              </Link>
            )}
            {!isPromoSlide && (
              <Link
                href="/donate"
                className="w-full sm:w-auto rounded-md bg-white px-8 py-3 text-sm font-semibold text-saffron-800 hover:bg-saffron-50 transition-colors"
              >
                Donate Now
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors z-20"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors z-20"
          >
            ›
          </button>

          {/* Dots - positioned above the text content */}
          <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-30">
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
