"use client";

import Link from "next/link";
import { T } from "@/lib/locale";
import { CONTRIBUTION_CAUSES } from "@/lib/home-content";
import Reveal from "@/components/home/Reveal";

export default function Contribution() {
  return (
    <section id="give" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
            <T>{{ en: "Transparent Contribution", hi: "पारदर्शी योगदान" }}</T>
          </p>
          <T
            as="h2"
            className="mt-3 max-w-3xl font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
          >
            {{
              en: "Choose where your contribution goes.",
              hi: "चुनें कि आपका योगदान कहाँ जाए।",
            }}
          </T>
          <T as="p" className="mt-4 max-w-2xl text-navy/65">
            {{
              en: "Amounts matter less than direction. Pick a cause, then give with a clear line of sight to the work.",
              hi: "राशि से अधिक दिशा मायने रखती है। एक कार्य चुनें, फिर स्पष्ट दृष्टि के साथ दें।",
            }}
          </T>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CONTRIBUTION_CAUSES.map((cause, i) => (
            <Reveal key={cause.id} className={i === 4 ? "lg:col-start-2 home-delay-2" : `home-delay-${(i % 3) + 1}`}>
              <Link
                href={`/donate?purpose=${cause.purpose}`}
                className="group flex h-full flex-col rounded-2xl border border-navy/10 bg-[#f6f4f0] p-7 transition-colors hover:border-saffron-600 hover:bg-white"
              >
                <T as="h3" className="font-heading text-2xl font-semibold text-navy">
                  {cause.title}
                </T>
                <T as="p" className="mt-3 flex-1 text-sm leading-relaxed text-navy/70">
                  {cause.impact}
                </T>
                <T as="p" className="mt-5 text-sm font-medium text-saffron-800">
                  {cause.example}
                </T>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-navy">
                  <T>{{ en: "Give to this cause", hi: "इस कार्य के लिए दें" }}</T>
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
