"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { T, useLocale, useT } from "@/lib/locale";
import {
  FALLBACK_ACTIVITIES,
  formatHomeDate,
  indiaOutlinePath,
  matchBranchToCity,
  NETWORK_CITIES,
  NETWORK_EDGES,
  projectLonLat,
  type HomeBranch,
  type HomeEvent,
  type HomePhoto,
  type NetworkCity,
} from "@/lib/home-content";
import Reveal from "@/components/home/Reveal";

const VIEW_W = 1000;
const VIEW_H = 1140;
const OUTLINE = indiaOutlinePath(VIEW_W, VIEW_H);
const CITY_INDEX = new Map(NETWORK_CITIES.map((c) => [c.city, c]));

type Pin = NetworkCity & {
  branches: HomeBranch[];
  events: HomeEvent[];
  photos: HomePhoto[];
  members: number;
};

function buildPins(
  branches: HomeBranch[],
  events: HomeEvent[],
  photos: HomePhoto[]
): Pin[] {
  return NETWORK_CITIES.map((city) => {
    const cityBranches = branches.filter((b) => matchBranchToCity(b, city));
    const eventsHere = events.filter((e) => {
      const blob = `${e.city} ${e.state} ${e.location}`.toLowerCase();
      return (
        blob.includes(city.city.toLowerCase()) ||
        blob.includes(city.state.toLowerCase()) ||
        (city.state === "Delhi" && blob.includes("delhi"))
      );
    });
    const photosHere = photos.filter((p) => {
      const blob = `${p.caption ?? ""} ${p.folderName ?? ""}`.toLowerCase();
      return blob.includes(city.city.toLowerCase()) || blob.includes(city.state.toLowerCase());
    });
    return {
      ...city,
      branches: cityBranches,
      events: eventsHere,
      photos: photosHere,
      members: cityBranches.reduce((sum, b) => sum + b.memberCount, 0),
    };
  });
}

export default function IndiaMapSection({
  branches,
  events,
  photos,
}: {
  branches: HomeBranch[];
  events: HomeEvent[];
  photos: HomePhoto[];
}) {
  const { locale } = useLocale();
  const t = useT();
  const pins = useMemo(() => buildPins(branches, events, photos), [branches, events, photos]);
  const activePins = pins.filter((p) => p.branches.length > 0);
  const defaultCity =
    activePins.find((p) => p.city === "New Delhi") || activePins[0] || pins[4];
  const [selectedCity, setSelectedCity] = useState(defaultCity.city);
  const selected = pins.find((p) => p.city === selectedCity) ?? defaultCity;
  const hasBranch = selected.branches.length > 0;
  const relatedEvents =
    selected.events.length > 0
      ? selected.events
      : FALLBACK_ACTIVITIES.filter(
          (e) => e.state === selected.state || e.city === selected.city
        );

  return (
    <section id="where" className="bg-[#0c1220] py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-300">
            <T>{{ en: "Where We Work", hi: "हम जहाँ कार्य करते हैं" }}</T>
          </p>
          <T
            as="h2"
            className="mt-3 max-w-3xl font-heading text-3xl font-semibold tracking-tight sm:text-5xl"
          >
            {{
              en: "A living national network.",
              hi: "एक जीवंत राष्ट्रीय नेटवर्क।",
            }}
          </T>
          <T as="p" className="mt-4 max-w-2xl text-white/65">
            {{
              en: "Click a glowing city to see branches, members and recent work. Dimmer points mark the wider network still taking root.",
              hi: "शाखाएँ, सदस्य और हालिया कार्य देखने के लिए चमकते शहर पर क्लिक करें। हल्के बिंदु उस व्यापक नेटवर्क को दर्शाते हैं जो अभी जड़ें जमा रहा है।",
            }}
          </T>
        </Reveal>

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2 lg:hidden">
          {pins
            .filter((p) => p.branches.length > 0)
            .map((pin) => (
              <button
                key={pin.city}
                type="button"
                onClick={() => setSelectedCity(pin.city)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                  selectedCity === pin.city
                    ? "bg-saffron-700 text-white"
                    : "bg-white/10 text-white/80"
                }`}
              >
                {locale === "hi" ? pin.cityHi : pin.city}
              </button>
            ))}
        </div>

        <div className="mt-6 grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              className="h-auto w-full"
              role="img"
              aria-label={t({
                en: "Interactive map of India showing branch cities",
                hi: "शाखा शहरों वाला भारत का इंटरैक्टिव मानचित्र",
              })}
            >
              <path
                d={OUTLINE}
                fill="rgba(255,255,255,0.04)"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <ellipse
                cx="850"
                cy="980"
                rx="10"
                ry="28"
                fill="rgba(255,255,255,0.05)"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.5"
              />
              {NETWORK_EDGES.map(([a, b]) => {
                const from = CITY_INDEX.get(a);
                const to = CITY_INDEX.get(b);
                if (!from || !to) return null;
                const p1 = projectLonLat(from.lon, from.lat, VIEW_W, VIEW_H);
                const p2 = projectLonLat(to.lon, to.lat, VIEW_W, VIEW_H);
                return (
                  <line
                    key={`${a}-${b}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="rgba(255,166,81,0.28)"
                    strokeWidth="1.3"
                    className="home-dash"
                  />
                );
              })}
              {pins.map((pin) => {
                const p = projectLonLat(pin.lon, pin.lat, VIEW_W, VIEW_H);
                const active = pin.branches.length > 0;
                const isSelected = pin.city === selectedCity;
                return (
                  <g
                    key={pin.city}
                    transform={`translate(${p.x} ${p.y})`}
                    className="cursor-pointer"
                    onClick={() => setSelectedCity(pin.city)}
                  >
                    <title>{locale === "hi" ? `${pin.cityHi}, ${pin.stateHi}` : `${pin.city}, ${pin.state}`}</title>
                    {active ? (
                      <circle r="14" className="home-map-pulse" fill="rgba(255,107,53,0.28)" />
                    ) : null}
                    <circle
                      r={isSelected ? 8 : active ? 5.5 : 3}
                      fill={isSelected ? "#ff6b35" : active ? "#ffa651" : "rgba(255,255,255,0.35)"}
                      stroke={isSelected ? "#fff" : "transparent"}
                      strokeWidth="2"
                    />
                    <circle r="18" fill="transparent">
                      <title>
                        {locale === "hi" ? pin.cityHi : pin.city}
                      </title>
                    </circle>
                  </g>
                );
              })}
            </svg>
            <div className="mt-3 hidden flex-wrap gap-2 lg:flex">
              {activePins.map((pin) => (
                <button
                  key={pin.city}
                  type="button"
                  onClick={() => setSelectedCity(pin.city)}
                  className={`rounded-full px-3 py-1 text-xs ${
                    selectedCity === pin.city
                      ? "bg-saffron-700 text-white"
                      : "bg-white/8 text-white/70 hover:bg-white/15"
                  }`}
                >
                  {locale === "hi" ? pin.cityHi : pin.city}
                </button>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm lg:col-span-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-saffron-300">
              {locale === "hi" ? selected.stateHi : selected.state}
            </p>
            <h3
              lang={locale === "hi" ? "hi" : undefined}
              className={`mt-2 font-heading text-3xl font-semibold ${
                locale === "hi" ? "font-devanagari" : ""
              }`}
            >
              {locale === "hi" ? selected.cityHi : selected.city}
            </h3>

            <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-white/5 px-2 py-3">
                <div className="font-heading text-2xl text-saffron-300">
                  {selected.branches.length || "—"}
                </div>
                <T as="p" className="mt-1 text-[11px] uppercase tracking-wide text-white/55">
                  {{ en: "Branches", hi: "शाखाएँ" }}
                </T>
              </div>
              <div className="rounded-xl bg-white/5 px-2 py-3">
                <div className="font-heading text-2xl text-saffron-300">
                  {selected.members > 0 ? selected.members.toLocaleString("en-IN") : "—"}
                </div>
                <T as="p" className="mt-1 text-[11px] uppercase tracking-wide text-white/55">
                  {{ en: "Members", hi: "सदस्य" }}
                </T>
              </div>
              <div className="rounded-xl bg-white/5 px-2 py-3">
                <div className="font-heading text-2xl text-saffron-300">
                  {relatedEvents.length || "—"}
                </div>
                <T as="p" className="mt-1 text-[11px] uppercase tracking-wide text-white/55">
                  {{ en: "Activities", hi: "गतिविधियाँ" }}
                </T>
              </div>
            </dl>

            {hasBranch ? (
              <ul className="mt-6 space-y-2">
                {selected.branches.map((branch) => (
                  <li key={branch.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm">
                    <p className="font-medium">{branch.name}</p>
                    <p className="text-white/55">
                      {branch.city}
                      {branch.managerName ? ` · ${branch.managerName}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <T as="p" className="mt-6 text-sm leading-relaxed text-white/70">
                {{
                  en: "This part of the network is still taking root. Join us to help open a local unit.",
                  hi: "नेटवर्क का यह हिस्सा अभी जड़ें जमा रहा है। स्थानीय इकाई खोलने में सहयोग के लिए जुड़ें।",
                }}
              </T>
            )}

            {relatedEvents.length > 0 ? (
              <div className="mt-6">
                <T as="p" className="text-xs uppercase tracking-[0.2em] text-white/45">
                  {{ en: "Recent activities", hi: "हालिया गतिविधियाँ" }}
                </T>
                <ul className="mt-3 space-y-2">
                  {relatedEvents.slice(0, 3).map((event) => (
                    <li key={event.id} className="text-sm text-white/80">
                      {event.title}
                      <span className="text-white/45">
                        {" "}
                        · {formatHomeDate(event.date, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {selected.photos.length > 0 ? (
              <div className="mt-6 grid grid-cols-3 gap-2">
                {selected.photos.slice(0, 3).map((photo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={photo.id}
                    src={photo.imageUrl}
                    alt={photo.caption || ""}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            ) : null}

            <Link
              href="/branches"
              className="mt-8 inline-flex text-sm font-semibold text-saffron-300 hover:text-white"
            >
              <T>{{ en: "See all branches", hi: "सभी शाखाएँ देखें" }}</T>
              <span aria-hidden="true">&nbsp;→</span>
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
