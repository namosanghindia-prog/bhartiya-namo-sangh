"use client";

import { useState } from "react";
import { T, useLocale } from "@/lib/locale";
import { MOSAIC } from "@/lib/about-content";
import Reveal from "@/components/home/Reveal";

export default function WorkMosaic() {
  const { locale } = useLocale();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="what-we-do" className="bg-[#f6f4f0] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
            <T>{{ en: "What We Do", hi: "हम क्या करते हैं" }}</T>
          </p>
          <T
            as="h2"
            className="mt-3 font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
          >
            {{ en: "Service, in the field.", hi: "सेवा, मैदान में।" }}
          </T>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-3">
          {MOSAIC.map((tile) => {
            const open = openId === tile.id;
            return (
              <article
                key={tile.id}
                className={`relative min-h-[240px] overflow-hidden rounded-2xl ${tile.span} ${
                  tile.id === "social" ? "min-h-[360px] lg:min-h-full" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tile.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
                <div className="relative flex h-full flex-col justify-end p-6 text-white">
                  <T as="h3" className="font-heading text-2xl font-semibold sm:text-3xl">
                    {tile.title}
                  </T>
                  <p
                    lang={locale === "hi" ? "hi" : undefined}
                    className={`mt-2 max-w-md text-sm text-white/80 ${
                      locale === "hi" ? "font-devanagari" : ""
                    }`}
                  >
                    {tile[locale === "hi" ? "hi" : "en"]}
                  </p>
                  {tile.items.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : tile.id)}
                      className="mt-4 self-start text-sm font-semibold underline-offset-4 hover:underline"
                    >
                      <T>
                        {open
                          ? { en: "Show less", hi: "संक्षेप" }
                          : { en: "Learn more", hi: "और पढ़ें" }}
                      </T>
                    </button>
                  ) : null}
                  {open && tile.items.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-sm text-white/75">
                      {tile.items.map((item) => (
                        <li key={item.en}>
                          {locale === "hi" ? item.hi : item.en}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
