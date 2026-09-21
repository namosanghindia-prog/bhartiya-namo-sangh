"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { PublicMember } from "@/lib/supabase/types";
import { fetchPositions, orderMembers } from "@/lib/member-order";
import { T, useLocale, useT } from "@/lib/locale";
import {
  classifyTier,
  enrichMember,
  isPresident,
  TIER_LABEL,
  type BranchLookup,
  type MemberTier,
} from "@/lib/members-public";
import { INDIA_MAP_VIEW, INDIA_STATE_PATHS } from "@/lib/india-official-map";
import { statesForPolygon } from "@/lib/home-content";
import Reveal from "@/components/home/Reveal";
import DragRow from "@/components/about/DragRow";
import MemberCard from "@/components/members/MemberCard";

function useCountUp(target: number, enabled: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ms = reduce || target === 0 ? 0 : 1200;
    let start: number | null = null;
    let raf = 0;
    const tick = (now: number) => {
      if (start === null) start = now;
      const p = ms === 0 ? 1 : Math.min(1, (now - start) / ms);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled, target]);
  return value;
}

export default function MembersExperience() {
  const { locale } = useLocale();
  const t = useT();
  const [members, setMembers] = useState<PublicMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedMapState, setSelectedMapState] = useState<string | null>(null);
  const statsRef = useRef<HTMLElement>(null);
  const [statsOn, setStatsOn] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data, error }, positions, branchesRes] = await Promise.all([
        supabase.from("public_members").select("*"),
        fetchPositions(supabase),
        supabase.from("branches").select("name, city, state").eq("is_active", true),
      ]);
      if (error) {
        console.error("Failed to fetch members:", error);
        setLoading(false);
        return;
      }
      const branches = (branchesRes.data || []) as BranchLookup[];
      const ordered = orderMembers(data || [], positions).map((m) =>
        enrichMember(m, branches)
      );
      setMembers(ordered);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loading]);

  const states = useMemo(() => {
    return Array.from(
      new Set(
        members
          .map((m) => m.branch_state || m.state)
          .filter((s): s is string => Boolean(s))
      )
    ).sort();
  }, [members]);

  const cities = useMemo(() => {
    return Array.from(
      new Set(members.map((m) => m.city).filter((s): s is string => Boolean(s)))
    ).sort();
  }, [members]);

  const branches = useMemo(() => {
    return Array.from(
      new Set(members.map((m) => m.branch_name).filter((s): s is string => Boolean(s)))
    ).sort();
  }, [members]);

  const designations = useMemo(() => {
    return Array.from(
      new Set(
        members.map((m) => m.designation).filter((s): s is string => Boolean(s))
      )
    ).sort();
  }, [members]);

  const president = members.find(isPresident) ?? null;
  const national = members.filter((m) => classifyTier(m.designation) === "national");
  const nationalRest = national.filter((m) => !president || m.id !== president.id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      const blob = `${m.first_name} ${m.last_name} ${m.designation ?? ""} ${m.branch_name ?? ""} ${m.city ?? ""} ${m.state ?? ""} ${m.branch_state ?? ""}`.toLowerCase();
      const matchesQuery = q === "" || blob.includes(q);
      const matchesRole =
        roleFilter === "all" ||
        m.designation === roleFilter ||
        classifyTier(m.designation) === roleFilter;
      const matchesState =
        stateFilter === "all" ||
        m.branch_state === stateFilter ||
        m.state === stateFilter;
      const matchesCity = cityFilter === "all" || m.city === cityFilter;
      const matchesBranch = branchFilter === "all" || m.branch_name === branchFilter;
      return matchesQuery && matchesRole && matchesState && matchesCity && matchesBranch;
    });
  }, [members, query, roleFilter, stateFilter, cityFilter, branchFilter]);

  const tierCounts = useMemo(() => {
    const counts = new Map<MemberTier, number>();
    for (const m of members) {
      const tier = classifyTier(m.designation);
      counts.set(tier, (counts.get(tier) || 0) + 1);
    }
    return (["national", "state", "district", "mandal", "local", "volunteer", "member"] as MemberTier[])
      .map((tier) => ({ tier, count: counts.get(tier) || 0 }))
      .filter((row) => row.count > 0);
  }, [members]);

  const byState = useMemo(() => {
    const map = new Map<string, { city: string; count: number }[]>();
    for (const m of members) {
      const state = m.branch_state || m.state;
      if (!state) continue;
      const city = m.city || m.branch_name || t({ en: "Unspecified", hi: "अनिर्दिष्ट" });
      const list = map.get(state) ?? [];
      const existing = list.find((row) => row.city === city);
      if (existing) existing.count += 1;
      else list.push({ city, count: 1 });
      map.set(state, list);
    }
    return map;
  }, [members, t]);

  const mapStates = Array.from(byState.keys());
  const activeMapState = selectedMapState && byState.has(selectedMapState)
    ? selectedMapState
    : mapStates[0] ?? null;

  const volunteerCount = members.filter((m) => classifyTier(m.designation) === "volunteer").length;

  const statMembers = useCountUp(members.length, statsOn);
  const statStates = useCountUp(states.length, statsOn);
  const statBranches = useCountUp(branches.length, statsOn);
  const statVolunteers = useCountUp(volunteerCount, statsOn);

  function applyStateFromMap(state: string) {
    setSelectedMapState(state);
    setStateFilter(state);
    document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" });
  }

  function resetFilters() {
    setQuery("");
    setRoleFilter("all");
    setStateFilter("all");
    setCityFilter("all");
    setBranchFilter("all");
  }

  const filters = (
    <>
      <select
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="rounded-full border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy"
      >
        <option value="all">{t({ en: "All roles", hi: "सभी भूमिकाएँ" })}</option>
        {designations.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      {states.length > 0 ? (
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-full border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy"
        >
          <option value="all">{t({ en: "All states", hi: "सभी राज्य" })}</option>
          {states.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ) : null}
      {cities.length > 0 ? (
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="rounded-full border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy"
        >
          <option value="all">{t({ en: "All districts / cities", hi: "सभी जिले / शहर" })}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      ) : null}
      {branches.length > 0 ? (
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="rounded-full border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy"
        >
          <option value="all">{t({ en: "All branches", hi: "सभी शाखाएँ" })}</option>
          {branches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      ) : null}
    </>
  );

  if (loading) {
    return (
      <p className="py-24 text-center text-navy/55">
        <T>{{ en: "Loading members…", hi: "सदस्य लोड हो रहे हैं…" }}</T>
      </p>
    );
  }

  return (
    <>
      <section
        ref={statsRef}
        className="border-b border-navy/8 bg-white"
        aria-label={t({ en: "Directory figures", hi: "निर्देशिका के आँकड़े" })}
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-center text-xs uppercase tracking-[0.22em] text-navy/40">
            <T>
              {{
                en: "Published in this directory",
                hi: "इस निर्देशिका में प्रकाशित",
              }}
            </T>
          </p>
          <div className="mt-8 grid grid-cols-2 gap-8 lg:grid-cols-4">
            <Stat n={statMembers} label={{ en: "Members", hi: "सदस्य" }} />
            {states.length > 0 ? (
              <Stat n={statStates} label={{ en: "States", hi: "राज्य" }} />
            ) : null}
            {branches.length > 0 ? (
              <Stat n={statBranches} label={{ en: "Branches", hi: "शाखाएँ" }} />
            ) : null}
            {volunteerCount > 0 ? (
              <Stat n={statVolunteers} label={{ en: "Volunteers", hi: "स्वयंसेवक" }} />
            ) : null}
          </div>
        </div>
      </section>

      {president || nationalRest.length > 0 ? (
        <section id="national-leadership" className="bg-[#f6f4f0] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
                <T>{{ en: "National Leadership", hi: "राष्ट्रीय नेतृत्व" }}</T>
              </p>
              <T
                as="h2"
                className="mt-3 font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
              >
                {{
                  en: "Those who hold the centre.",
                  hi: "जो केंद्र संभालते हैं।",
                }}
              </T>
            </Reveal>
            {president ? (
              <div className="mt-12">
                <MemberCard member={president} featured />
              </div>
            ) : null}
            {nationalRest.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {nationalRest.map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {tierCounts.length > 1 ? (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
              <T>{{ en: "Explore our organisation", hi: "संगठन को देखें" }}</T>
            </p>
          </div>
          <DragRow className="mt-8 px-4 sm:px-6 lg:px-8">
            {tierCounts.map((row) => (
              <button
                key={row.tier}
                type="button"
                onClick={() => {
                  setRoleFilter(row.tier);
                  document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-[220px] shrink-0 snap-start rounded-2xl border border-navy/10 bg-[#f6f4f0] p-6 text-left hover:border-saffron-600"
              >
                <T as="h3" className="font-heading text-lg font-semibold text-navy">
                  {TIER_LABEL[row.tier]}
                </T>
                <p className="mt-3 font-heading text-3xl text-saffron-800">{row.count}</p>
              </button>
            ))}
          </DragRow>
        </section>
      ) : null}

      <section
        id="directory"
        className="bg-white py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
              <T>{{ en: "Member Directory", hi: "सदस्य निर्देशिका" }}</T>
            </p>
            <T
              as="h2"
              className="mt-3 font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
            >
              {{
                en: "Search the people of BNMS.",
                hi: "भारतीय नमो संघ के लोगों को खोजें।",
              }}
            </T>
          </Reveal>

          <div className="mt-10">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t({
                en: "Search members by name, role or location",
                hi: "नाम, भूमिका या स्थान से सदस्य खोजें",
              })}
              className="w-full rounded-2xl border border-navy/15 bg-[#f6f4f0] px-5 py-4 text-base text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-saffron-400"
            />
            <div className="mt-4 hidden flex-wrap gap-2 md:flex">{filters}</div>
            <button
              type="button"
              className="mt-4 inline-flex min-h-11 rounded-full border border-navy/15 px-5 text-sm font-semibold text-navy md:hidden"
              onClick={() => setSheetOpen(true)}
            >
              <T>{{ en: "Filters", hi: "फ़िल्टर" }}</T>
            </button>
            <p className="mt-6 text-sm text-navy/55">
              {filtered.length.toLocaleString(locale === "hi" ? "hi-IN" : "en-IN")}{" "}
              <T>{{ en: "members", hi: "सदस्य" }}</T>
              {filtered.length !== members.length
                ? ` · ${members.length.toLocaleString(locale === "hi" ? "hi-IN" : "en-IN")} ${t({ en: "in total", hi: "कुल" })}`
                : ""}
            </p>
          </div>

          {filtered.length === 0 ? (
            <p className="py-16 text-center text-navy/55">
              {members.length === 0
                ? t({ en: "No members to display yet.", hi: "अभी कोई सदस्य नहीं।" })
                : t({ en: "No members match your search.", hi: "आपकी खोज से कोई सदस्य नहीं मिला।" })}
            </p>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>
          )}
        </div>
      </section>

      {mapStates.length > 0 ? (
        <section id="across-india" className="bg-[#0c1220] py-20 text-white sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-300">
                <T>{{ en: "Bhartiya Namo Sangh Across India", hi: "भारत भर में भारतीय नमो संघ" }}</T>
              </p>
              <T
                as="h2"
                className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-5xl"
              >
                {{
                  en: "Members where the directory has them.",
                  hi: "जहाँ निर्देशिका में सदस्य हैं।",
                }}
              </T>
            </Reveal>
            <div className="mt-12 grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
              <svg
                viewBox={`0 0 ${INDIA_MAP_VIEW.w} ${INDIA_MAP_VIEW.h}`}
                className="h-auto w-full lg:col-span-7"
                role="img"
                aria-label={t({
                  en: "India map of members in this directory",
                  hi: "इस निर्देशिका के सदस्यों का भारत मानचित्र",
                })}
              >
                {INDIA_STATE_PATHS.map((state) => {
                  const names = statesForPolygon(state.name);
                  const has = names.some((n) => byState.has(n));
                  const selected = activeMapState ? names.includes(activeMapState) : false;
                  return (
                    <path
                      key={state.id}
                      d={state.d}
                      fill={
                        selected
                          ? "rgba(255,107,53,0.35)"
                          : has
                            ? "rgba(255,166,81,0.16)"
                            : "rgba(255,255,255,0.04)"
                      }
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth="0.8"
                      className={has ? "cursor-pointer" : undefined}
                      onClick={() => {
                        const match = names.find((n) => byState.has(n));
                        if (match) setSelectedMapState(match);
                      }}
                    >
                      <title>{locale === "hi" ? state.nameHi : state.name}</title>
                    </path>
                  );
                })}
              </svg>
              <aside className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-5">
                {activeMapState ? (
                  <>
                    <h3 className="font-heading text-2xl font-semibold">{activeMapState}</h3>
                    <ul className="mt-5 space-y-2 text-sm text-white/80">
                      {(byState.get(activeMapState) ?? [])
                        .sort((a, b) => b.count - a.count)
                        .map((row) => (
                          <li key={row.city} className="flex justify-between gap-4">
                            <span>{row.city}</span>
                            <span className="text-saffron-300">
                              {row.count}{" "}
                              {t({ en: "members", hi: "सदस्य" })}
                            </span>
                          </li>
                        ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => applyStateFromMap(activeMapState)}
                      className="mt-6 text-sm font-semibold text-saffron-300 hover:text-white"
                    >
                      <T>{{ en: "View members", hi: "सदस्य देखें" }}</T>
                      <span aria-hidden="true"> →</span>
                    </button>
                  </>
                ) : (
                  <T as="p" className="text-white/60">
                    {{
                      en: "Select a highlighted state to see published members.",
                      hi: "प्रकाशित सदस्य देखने के लिए हाइलाइट राज्य चुनें।",
                    }}
                  </T>
                )}
                <p className="mt-8 text-[11px] text-white/35">
                  <T>
                    {{
                      en: "Counts are from members published in this directory, placed by branch. International boundary as per Survey of India.",
                      hi: "गिनती इस निर्देशिका में प्रकाशित सदस्यों की है, शाखा के अनुसार। अंतरराष्ट्रीय सीमा सर्वे ऑफ इंडिया के अनुसार।",
                    }}
                  </T>
                </p>
              </aside>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-[#f6f4f0] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-saffron-800">
              <T>{{ en: "Why become a member?", hi: "सदस्य क्यों बनें?" }}</T>
            </p>
            <T
              as="h2"
              className="mt-3 font-heading text-3xl font-semibold tracking-tight text-navy sm:text-5xl"
            >
              {{ en: "Be part of the journey.", hi: "यात्रा का हिस्सा बनें।" }}
            </T>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: { en: "Serve", hi: "सेवा" },
                text: {
                  en: "Participate in social initiatives in your community.",
                  hi: "अपने समुदाय में सामाजिक पहलों में भाग लें।",
                },
              },
              {
                title: { en: "Contribute", hi: "योगदान" },
                text: {
                  en: "Take part in nation-building activities.",
                  hi: "राष्ट्र निर्माण की गतिविधियों में हिस्सा लें।",
                },
              },
              {
                title: { en: "Connect", hi: "जुड़ाव" },
                text: {
                  en: "Work with people across communities and branches.",
                  hi: "समुदायों और शाखाओं के लोगों के साथ कार्य करें।",
                },
              },
              {
                title: { en: "Lead", hi: "नेतृत्व" },
                text: {
                  en: "Take responsibility and create local impact.",
                  hi: "जिम्मेदारी लें और स्थानीय प्रभाव बनाएँ।",
                },
              },
            ].map((card) => (
              <article key={card.title.en} className="rounded-2xl bg-white p-7">
                <T as="h3" className="font-heading text-2xl font-semibold text-navy">
                  {card.title}
                </T>
                <T as="p" className="mt-3 text-sm leading-relaxed text-navy/65">
                  {card.text}
                </T>
              </article>
            ))}
          </div>
          <Link
            href="/auth/signup"
            className="mt-10 inline-flex min-h-12 items-center rounded-full bg-saffron-700 px-7 text-sm font-semibold text-white hover:bg-saffron-800"
          >
            <T>{{ en: "Join Bhartiya Namo Sangh", hi: "भारतीय नमो संघ से जुड़ें" }}</T>
            <span aria-hidden="true">&nbsp;→</span>
          </Link>
        </div>
      </section>

      {sheetOpen ? (
        <div className="fixed inset-0 z-[80] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/50"
            aria-label={t({ en: "Close filters", hi: "फ़िल्टर बंद करें" })}
            onClick={() => setSheetOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-6 pb-10"
          >
            <p className="font-heading text-lg font-semibold text-navy">
              <T>{{ en: "Filters", hi: "फ़िल्टर" }}</T>
            </p>
            <div className="mt-4 flex flex-col gap-3">{filters}</div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-11 flex-1 rounded-full border border-navy/15 text-sm font-semibold"
              >
                <T>{{ en: "Reset", hi: "रीसेट" }}</T>
              </button>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="min-h-11 flex-1 rounded-full bg-navy text-sm font-semibold text-white"
              >
                <T>{{ en: "Show results", hi: "परिणाम दिखाएँ" }}</T>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Stat({
  n,
  label,
}: {
  n: number;
  label: { en: string; hi: string };
}) {
  return (
    <div className="text-center">
      <div className="font-heading text-4xl font-semibold text-navy sm:text-5xl">
        {n.toLocaleString("en-IN")}
      </div>
      <T as="p" className="mt-2 text-sm uppercase tracking-[0.18em] text-navy/50">
        {label}
      </T>
    </div>
  );
}
