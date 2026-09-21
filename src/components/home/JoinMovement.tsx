"use client";

import Link from "next/link";
import { T } from "@/lib/locale";
import { JOIN_PATHS } from "@/lib/home-content";
import Reveal from "@/components/home/Reveal";

export default function JoinMovement() {
  return (
    <section id="join" className="relative isolate overflow-hidden py-20 sm:py-28">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/home/skyline.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-navy/88" />
      <div className="relative mx-auto max-w-7xl px-4 text-white sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-300">
            <T>{{ en: "Join the Movement", hi: "आंदोलन से जुड़ें" }}</T>
          </p>
          <T
            as="h2"
            className="mt-3 max-w-3xl font-heading text-3xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
          >
            {{
              en: "Your time can change a community.",
              hi: "आपका समय एक समुदाय बदल सकता है।",
            }}
          </T>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {JOIN_PATHS.map((path, i) => (
            <Reveal key={path.id} className={`home-delay-${i + 1}`}>
              <Link
                href={path.href}
                className="group flex h-full flex-col rounded-2xl border border-white/15 bg-white/8 p-8 backdrop-blur-sm transition-colors hover:bg-white/14"
              >
                <span className="font-heading text-sm tracking-[0.2em] text-saffron-300">
                  {path.kicker.en}
                </span>
                <T
                  as="h3"
                  className="mt-4 font-heading text-2xl font-semibold uppercase tracking-wide"
                >
                  {path.title}
                </T>
                <T as="p" className="mt-3 flex-1 text-sm leading-relaxed text-white/70">
                  {path.text}
                </T>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  <T>{path.cta}</T>
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
