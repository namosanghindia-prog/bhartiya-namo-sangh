"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { T, useLocale } from "@/lib/locale";
import { ABOUT_QUOTE } from "@/lib/about-content";

export default function AboutHero() {
  const { locale } = useLocale();
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function onScroll() {
      if (!img) return;
      img.style.transform = `translate3d(0, ${window.scrollY * 0.18}px, 0) scale(1.08)`;
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      className="relative isolate min-h-[100svh] overflow-hidden bg-navy text-white"
      aria-label={locale === "hi" ? "भारतीय नमो संघ" : "Bhartiya Namo Sangh"}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src="/home/community.jpg"
        alt=""
        className="absolute inset-0 h-[120%] w-full object-cover will-change-transform"
        fetchPriority="high"
      />
      <div className="about-tricolour-wash pointer-events-none absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy/55 via-navy/50 to-navy/92" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-5xl flex-col items-center justify-end px-4 pb-24 pt-28 text-center sm:px-6 sm:pb-28 lg:justify-center lg:pb-16 lg:pt-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-white/70 sm:text-xs">
          About
        </p>
        <h1 className="mt-5 font-heading text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
          BHARTIYA NAMO SANGH
        </h1>
        <p
          lang="hi"
          className="font-devanagari mt-6 text-base tracking-[0.18em] text-saffron-300 sm:text-xl sm:tracking-[0.28em]"
        >
          राष्ट्रहित • समाजसेवा • जनभागीदारी
        </p>
        <blockquote className="mt-10 max-w-2xl">
          <p
            lang="hi"
            className="font-devanagari text-lg leading-relaxed text-white/90 sm:text-2xl"
          >
            “{ABOUT_QUOTE.hi}”
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/60 sm:text-base">
            “{ABOUT_QUOTE.en}”
          </p>
        </blockquote>
        <div className="mt-10 flex w-full max-w-xl flex-col items-center gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Link
            href="#mission"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-saffron-700 px-7 text-sm font-semibold text-white hover:bg-saffron-800 sm:w-auto"
          >
            <T>{{ en: "Our Mission", hi: "हमारा मिशन" }}</T>
          </Link>
          <Link
            href="#join"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-navy hover:bg-saffron-50 sm:w-auto"
          >
            <T>{{ en: "Join the Movement", hi: "आंदोलन से जुड़ें" }}</T>
          </Link>
        </div>
      </div>
    </section>
  );
}
