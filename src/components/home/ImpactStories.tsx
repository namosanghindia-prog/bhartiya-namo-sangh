"use client";

import { T } from "@/lib/locale";
import { IMPACT_STORIES } from "@/lib/home-content";
import Reveal from "@/components/home/Reveal";

export default function ImpactStories() {
  const [featured, ...rest] = IMPACT_STORIES;

  return (
    <section id="stories" className="bg-navy py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-300">
            <T>{{ en: "Impact Stories", hi: "प्रभाव कथाएँ" }}</T>
          </p>
          <T
            as="h2"
            className="mt-3 max-w-4xl font-heading text-3xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
          >
            {{
              en: "One Person. One Community. One Change.",
              hi: "एक व्यक्ति। एक समुदाय। एक परिवर्तन।",
            }}
          </T>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <StoryCard story={featured} featured />
          </Reveal>
          <div className="grid gap-5 lg:col-span-2">
            {rest.map((story, i) => (
              <Reveal key={story.id} className={`home-delay-${i + 1}`}>
                <StoryCard story={story} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryCard({
  story,
  featured = false,
}: {
  story: (typeof IMPACT_STORIES)[number];
  featured?: boolean;
}) {
  return (
    <article
      className={`group relative isolate overflow-hidden rounded-2xl ${
        featured ? "min-h-[520px]" : "min-h-[250px]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={story.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
      <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
        <T as="p" className="text-[11px] uppercase tracking-[0.28em] text-saffron-300">
          {story.kicker}
        </T>
        <T
          as="h3"
          className={`mt-2 font-heading font-semibold leading-tight ${
            featured ? "text-2xl sm:text-4xl" : "text-xl"
          }`}
        >
          {story.title}
        </T>
        <T as="p" className="mt-2 text-sm text-white/70">
          {story.location}
        </T>
        {featured ? (
          <T as="p" className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            {story.story}
          </T>
        ) : (
          <T as="p" className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/75">
            {story.story}
          </T>
        )}
      </div>
    </article>
  );
}
