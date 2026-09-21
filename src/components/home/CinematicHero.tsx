"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { T, useLocale } from "@/lib/locale";
import { HERO_SCENES } from "@/lib/home-content";
import IndiaNetwork from "@/components/home/IndiaNetwork";

export default function CinematicHero({ sliderImages }: { sliderImages: string[] }) {
  const { locale } = useLocale();
  const scenes = [
    ...HERO_SCENES.map((s) => s.src),
    ...sliderImages.filter((url) => !HERO_SCENES.some((s) => s.src === url)),
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (scenes.length <= 1) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % scenes.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [scenes.length]);

  return (
    <section
      id="vision"
      className="relative isolate min-h-[100svh] overflow-hidden bg-navy text-white"
      aria-label={
        locale === "hi"
          ? "एक कर्म से भारत का निर्माण"
          : "Building Bharat, One Action at a Time"
      }
    >
      {scenes.map((src, i) => {
        const isCurrent = i === index;
        const isPrev = i === (index - 1 + scenes.length) % scenes.length;
        const isNext = i === (index + 1) % scenes.length;
        if (!isCurrent && !isPrev && !isNext) return null;
        return (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${
              isCurrent ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              fetchPriority={isCurrent && index === 0 ? "high" : "low"}
              className={`h-full w-full object-cover ${isCurrent ? "home-kenburns" : ""}`}
            />
          </div>
        );
      })}

      <div className="absolute inset-0 bg-gradient-to-b from-navy/55 via-navy/45 to-navy/90" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.28] mix-blend-screen">
        <IndiaNetwork className="h-full w-full origin-center scale-110 sm:scale-100 object-contain" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col items-center justify-end px-4 pb-24 pt-28 text-center sm:px-6 sm:pb-28 lg:justify-center lg:pb-16 lg:pt-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.42em] text-white/70 sm:text-xs">
          Bhartiya Namo Sangh
        </p>
        <T
          as="h1"
          className="mt-5 max-w-5xl font-heading text-[2.35rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl"
        >
          {{
            en: "Building Bharat, One Action at a Time",
            hi: "एक कर्म से भारत का निर्माण",
          }}
        </T>
        {locale === "hi" ? (
          <p className="mt-4 max-w-3xl text-lg text-white/75 sm:text-xl">
            Building Bharat, One Action at a Time
          </p>
        ) : null}
        <p
          lang="hi"
          className="font-devanagari mt-6 text-base tracking-[0.18em] text-saffron-300 sm:text-xl sm:tracking-[0.28em]"
        >
          सेवा • जागरूकता • सहभागिता • राष्ट्र निर्माण
        </p>

        <div className="mt-10 flex w-full max-w-xl flex-col items-center gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <Link
            href="#join"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-saffron-700 px-7 text-sm font-semibold text-white transition-colors hover:bg-saffron-800 sm:w-auto"
          >
            <T>{{ en: "Join the Movement", hi: "आंदोलन से जुड़ें" }}</T>
          </Link>
          <Link
            href="#action"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/35 bg-white/10 px-7 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:w-auto"
          >
            <T>{{ en: "Explore Our Work", hi: "हमारा कार्य देखें" }}</T>
          </Link>
          <Link
            href="#give"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-navy transition-colors hover:bg-saffron-50 sm:w-auto"
          >
            <T>{{ en: "Support a Cause", hi: "एक कार्य का समर्थन करें" }}</T>
          </Link>
        </div>

        <p className="mt-8 hidden text-xs uppercase tracking-[0.28em] text-white/50 sm:block">
          <T>
            {{
              en: "Vision → People → Action → Impact → Participation → Future",
              hi: "दृष्टि → जन → कर्म → प्रभाव → सहभागिता → भविष्य",
            }}
          </T>
        </p>
      </div>

      <a
        href="#impact"
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-white/70 transition-colors hover:text-white"
      >
        <span className="sr-only">
          {locale === "hi" ? "प्रभाव आँकड़ों तक जाएँ" : "Continue to impact figures"}
        </span>
        <span className="home-scroll-cue h-9 w-5 rounded-full border border-white/40">
          <span className="mx-auto mt-1.5 block h-2 w-0.5 rounded-full bg-white" />
        </span>
      </a>
    </section>
  );
}
