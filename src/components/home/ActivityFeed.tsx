"use client";

import Link from "next/link";
import { T, useLocale, useT } from "@/lib/locale";
import {
  ACTIVITY_TITLES_HI,
  FALLBACK_ACTIVITIES,
  formatHomeDate,
  type HomeEvent,
} from "@/lib/home-content";
import Reveal from "@/components/home/Reveal";

export default function ActivityFeed({
  events,
  live,
}: {
  events: HomeEvent[];
  live: boolean;
}) {
  const { locale } = useLocale();
  const t = useT();
  const cards =
    events.length >= 3 ? events.slice(0, 6) : [...events, ...FALLBACK_ACTIVITIES].slice(0, 6);

  return (
    <section id="action" className="bg-[#f6f4f0] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-light opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-forest-light" />
                </span>
                <T>{{ en: "India in Action", hi: "कर्मशील भारत" }}</T>
              </p>
              <T
                as="h2"
                className="mt-3 font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
              >
                {{
                  en: "What we’re doing across Bharat",
                  hi: "भारत भर में हम क्या कर रहे हैं",
                }}
              </T>
            </div>
            <Link
              href="/events"
              className="text-sm font-semibold text-navy/70 underline-offset-4 hover:text-saffron-800 hover:underline"
            >
              <T>{{ en: "All events", hi: "सभी कार्यक्रम" }}</T>
            </Link>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((event, i) => {
            const title =
              locale === "hi"
                ? ACTIVITY_TITLES_HI[event.title] || event.title
                : event.title;
            const href = live && !event.id.startsWith("act-") ? `/events/${event.slug}` : "/events";
            return (
              <Reveal key={event.id} className={`home-delay-${(i % 3) + 1}`}>
                <article className="flex h-full flex-col rounded-2xl border border-navy/8 bg-white p-6 shadow-[0_1px_0_rgba(10,25,41,0.04)] transition-shadow hover:shadow-lg">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-saffron-800">
                      {event.city || event.location}
                    </p>
                    <span className="rounded-full bg-[#f6f4f0] px-2 py-1 text-[11px] text-navy/55">
                      {event.category}
                    </span>
                  </div>
                  <h3
                    lang={locale === "hi" ? "hi" : undefined}
                    className={`mt-4 font-heading text-2xl font-semibold text-navy ${
                      locale === "hi" ? "font-devanagari" : ""
                    }`}
                  >
                    {title}
                  </h3>
                  <p className="mt-3 text-sm text-navy/60">
                    {formatHomeDate(event.date, locale)}
                    {event.participants > 0
                      ? ` · ${event.participants.toLocaleString("en-IN")} ${t({
                          en: "participants",
                          hi: "प्रतिभागी",
                        })}`
                      : ""}
                  </p>
                  <Link
                    href={href}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-saffron-800"
                  >
                    <T>{{ en: "View activity", hi: "गतिविधि देखें" }}</T>
                    <span aria-hidden="true">→</span>
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
