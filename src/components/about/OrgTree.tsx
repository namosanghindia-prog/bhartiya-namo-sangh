"use client";

import { useState } from "react";
import { T, useLocale } from "@/lib/locale";
import { STRUCTURE } from "@/lib/about-content";
import Reveal from "@/components/home/Reveal";

export default function OrgTree() {
  const { locale } = useLocale();
  const [open, setOpen] = useState<string>("national");

  return (
    <section id="structure" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
            <T>{{ en: "Organisational Structure", hi: "संगठनात्मक संरचना" }}</T>
          </p>
          <T
            as="h2"
            className="mt-3 font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
          >
            {{
              en: "National to village, one discipline.",
              hi: "राष्ट्र से ग्राम तक, एक अनुशासन।",
            }}
          </T>
        </Reveal>

        <ol className="mt-14">
          {STRUCTURE.map((level, i) => {
            const expanded = open === level.id;
            return (
              <li key={level.id} className="relative pl-8">
                {i < STRUCTURE.length - 1 ? (
                  <span
                    className="absolute bottom-0 left-[11px] top-6 w-px bg-navy/15"
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className={`absolute left-0 top-2 h-6 w-6 rounded-full border-2 ${
                    expanded
                      ? "border-saffron-700 bg-saffron-700"
                      : "border-navy/20 bg-white"
                  }`}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? "" : level.id)}
                  className="w-full rounded-2xl border border-navy/8 bg-[#f6f4f0] px-5 py-4 text-left transition-colors hover:border-saffron-600"
                  aria-expanded={expanded}
                >
                  <T as="h3" className="font-heading text-xl font-semibold text-navy">
                    {level.level}
                  </T>
                  {expanded ? (
                    <ul className="mt-4 space-y-2 border-t border-navy/10 pt-4">
                      {level.roles.map((role) => (
                        <li
                          key={role.en}
                          lang={locale === "hi" ? "hi" : undefined}
                          className={`text-sm text-navy/70 ${
                            locale === "hi" ? "font-devanagari" : ""
                          }`}
                        >
                          {locale === "hi" ? role.hi : role.en}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-navy/40">
                      <T>{{ en: "View offices", hi: "पद देखें" }}</T>
                    </p>
                  )}
                </button>
                <div className="h-6" aria-hidden="true" />
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-sm text-navy/50">
          <T>
            {{
              en: "Posts and responsibilities may be determined according to the organisation’s rules.",
              hi: "पद एवं जिम्मेदारियाँ संगठन के निर्धारित नियमों के अनुसार निर्धारित की जा सकती हैं।",
            }}
          </T>
        </p>
      </div>
    </section>
  );
}
