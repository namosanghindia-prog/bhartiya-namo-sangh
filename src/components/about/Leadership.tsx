"use client";

import Image from "next/image";
import { T } from "@/lib/locale";
import { ABOUT_QUOTE, LEADERSHIP } from "@/lib/about-content";
import Reveal from "@/components/home/Reveal";

export default function Leadership() {
  return (
    <section id="leadership" className="bg-[#f6f4f0] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
            <T>{{ en: "Leadership", hi: "नेतृत्व" }}</T>
          </p>
          <T
            as="h2"
            className="mt-3 font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
          >
            {{ en: "National leadership.", hi: "राष्ट्रीय नेतृत्व।" }}
          </T>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <article className="rounded-2xl bg-navy p-10 text-white">
              <div className="relative h-36 w-36 overflow-hidden rounded-full ring-2 ring-white/20">
                <Image
                  src="/leadership/mannu.png"
                  alt={LEADERSHIP.name}
                  fill
                  sizes="144px"
                  className="object-cover object-[center_18%]"
                />
              </div>
              <h3 className="mt-8 font-heading text-2xl font-semibold sm:text-3xl">
                {LEADERSHIP.name}
              </h3>
              <p lang="hi" className="font-devanagari mt-2 text-white/70">
                {LEADERSHIP.nameHi}
              </p>
              <p className="mt-4 text-sm uppercase tracking-[0.2em] text-saffron-300">
                {LEADERSHIP.titleEn}
                <span lang="hi" className="font-devanagari ml-2 normal-case tracking-normal text-white/55">
                  {LEADERSHIP.titleHi}
                </span>
              </p>
            </article>
          </Reveal>
          <Reveal className="lg:col-span-7">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-saffron-800">
              <T>{{ en: "The organisation’s creed", hi: "संगठन का सूत्र" }}</T>
            </p>
            <p
              lang="hi"
              className="font-devanagari mt-5 text-2xl leading-relaxed text-navy sm:text-3xl"
            >
              “{ABOUT_QUOTE.hi}”
            </p>
            <p className="mt-4 text-base leading-relaxed text-navy/65">
              “{ABOUT_QUOTE.en}”
            </p>
            <p className="mt-8 text-sm text-navy/50">
              <T>
                {{
                  en: "A searchable directory of office-bearers will grow here as the organisation publishes them.",
                  hi: "जैसे-जैसे संगठन पदाधिकारियों के नाम प्रकाशित करेगा, यहाँ एक खोज योग्य निर्देशिका बनेगी।",
                }}
              </T>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
