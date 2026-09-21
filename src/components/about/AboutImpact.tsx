"use client";

import { T } from "@/lib/locale";
import { IMPACT_STATS } from "@/lib/home-content";
import ImpactCounters from "@/components/home/ImpactCounters";
import Reveal from "@/components/home/Reveal";

export default function AboutImpact() {
  return (
    <div id="about-impact" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
            <T>{{ en: "Our Impact", hi: "हमारा प्रभाव" }}</T>
          </p>
          <T
            as="h2"
            className="mt-3 font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
          >
            {{
              en: "Scale we can stand behind.",
              hi: "वे आँकड़े जिनके साथ हम खड़े हैं।",
            }}
          </T>
          <T as="p" className="mt-4 max-w-2xl text-navy/60">
            {{
              en: `${IMPACT_STATS.length} figures already published by the organisation: members, events, branches and funds raised.`,
              hi: "संगठन द्वारा पहले से प्रकाशित आँकड़े: सदस्य, कार्यक्रम, शाखाएँ और जुटाई गई राशि।",
            }}
          </T>
        </Reveal>
      </div>
      <ImpactCounters />
    </div>
  );
}
