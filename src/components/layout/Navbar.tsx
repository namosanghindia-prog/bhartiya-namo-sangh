"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { T, useLocale } from "@/lib/locale";
import { createClient } from "@/lib/supabase/client";

function subscribeScroll(onStoreChange: () => void) {
  window.addEventListener("scroll", onStoreChange, { passive: true });
  return () => window.removeEventListener("scroll", onStoreChange);
}

type NavLink = { href: string; en: string; hi: string };
type NavGroup = { en: string; hi: string; links: NavLink[] };

const MENU_GROUPS: NavGroup[] = [
  {
    en: "About",
    hi: "परिचय",
    links: [
      { href: "/about#who", en: "Who We Are", hi: "हम कौन हैं" },
      { href: "/about#our-vision", en: "Our Vision", hi: "हमारी दृष्टि" },
      { href: "/about#mission", en: "Our Mission", hi: "हमारा मिशन" },
      { href: "/about#leadership", en: "Our Leadership", hi: "हमारा नेतृत्व" },
    ],
  },
  {
    en: "Members",
    hi: "सदस्य",
    links: [
      { href: "/members", en: "Member Directory", hi: "सदस्य निर्देशिका" },
      { href: "/members#national-leadership", en: "Leadership", hi: "नेतृत्व" },
      { href: "/auth/signup", en: "Join Us", hi: "जुड़ें" },
    ],
  },
  {
    en: "Initiatives",
    hi: "पहल",
    links: [
      { href: "/about#what-we-do", en: "Social Service", hi: "समाज सेवा" },
      { href: "/donate?purpose=education", en: "Education", hi: "शिक्षा" },
      { href: "/donate?purpose=healthcare", en: "Health", hi: "स्वास्थ्य" },
      { href: "/about#focus", en: "Youth", hi: "युवा" },
    ],
  },
  {
    en: "Resources",
    hi: "संसाधन",
    links: [
      { href: "/events", en: "Events", hi: "कार्यक्रम" },
      { href: "/gallery", en: "Gallery", hi: "गैलरी" },
      { href: "/businesses", en: "Businesses", hi: "व्यवसाय" },
    ],
  },
  {
    en: "Connect",
    hi: "संपर्क",
    links: [
      { href: "/contact", en: "Contact Us", hi: "संपर्क करें" },
      { href: "/branches", en: "Branches", hi: "शाखाएँ" },
      { href: "/contact", en: "FAQ", hi: "प्रश्न" },
    ],
  },
  {
    en: "Get Involved",
    hi: "सहभागिता",
    links: [
      { href: "/auth/signup", en: "Become a Member", hi: "सदस्य बनें" },
      { href: "/contact", en: "Volunteer", hi: "स्वयंसेवक बनें" },
      { href: "/donate", en: "Support Our Work", hi: "कार्य का समर्थन" },
    ],
  },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mobileSection, setMobileSection] = useState<string | null>("About");
  const [social, setSocial] = useState<{
    facebook_url: string | null;
    instagram_url: string | null;
    youtube_url: string | null;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const closeMenuRef = useRef<() => void>(() => {});
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 24,
    () => false
  );
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const isHome =
    pathname === "/" || pathname === "/about" || pathname === "/members";
  const overlay = (isHome && !scrolled) || open;
  const barText = overlay ? "text-white" : "text-navy";

  function closeMenu() {
    if (!open || closing) return;
    setEntered(false);
    setClosing(true);
    setSearchOpen(false);
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 450);
  }

  useEffect(() => {
    closeMenuRef.current = closeMenu;
  });

  function openMenu() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setClosing(false);
    setOpen(true);
  }

  useEffect(() => {
    if (!open || closing) return;
    const id = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(id);
  }, [open, closing]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = menuRef.current;
    const focusable = root?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenuRef.current();
        return;
      }
      if (e.key !== "Tab" || !focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase
      .from("organization_settings")
      .select("facebook_url, instagram_url, youtube_url")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) setSocial(data);
      });
  }, [open]);

  const q = query.trim().toLowerCase();
  const groups = MENU_GROUPS.map((group) => ({
    ...group,
    links: q
      ? group.links.filter(
          (link) =>
            link.en.toLowerCase().includes(q) ||
            link.hi.toLowerCase().includes(q) ||
            group.en.toLowerCase().includes(q) ||
            group.hi.toLowerCase().includes(q)
        )
      : group.links,
  })).filter((group) => group.links.length > 0);

  return (
    <>
      <header
        className={`${
          isHome ? "fixed" : "sticky"
        } top-0 border-b transition-colors duration-300 ${
          open ? "z-[10000]" : "z-50"
        } ${
          overlay
            ? "border-white/15 bg-transparent"
            : "border-navy/10 bg-white/95 backdrop-blur"
        }`}
      >
        <nav
          className="mx-auto flex h-20 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-10"
          aria-label="Primary"
        >
          <Link href="/" className="flex min-w-0 items-center gap-3" onClick={closeMenu}>
            <Image src="/logo.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0" />
            <span className={`font-heading truncate text-xl font-semibold sm:text-2xl ${barText}`}>
              Bhartiya Namo Sangh
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {open ? (
              <button
                type="button"
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${barText}`}
                aria-label={locale === "hi" ? "खोजें" : "Search"}
                onClick={() => setSearchOpen((v) => !v)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            ) : null}
            <button
              type="button"
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold uppercase tracking-[0.18em] sm:px-4 ${barText}`}
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => (open ? closeMenu() : openMenu())}
            >
              <T>{open ? { en: "Close", hi: "बंद करें" } : { en: "Menu", hi: "मेनू" }}</T>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                {open ? (
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {open || closing ? (
        <div
          ref={menuRef}
          id="site-menu"
          className={`menu-overlay text-white ${closing ? "is-closing" : entered ? "is-open" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={locale === "hi" ? "मुख्य मेनू" : "Main menu"}
          onClick={closeMenu}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/home/skyline.jpg"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.07]"
          />
          <div
            className="relative flex h-full flex-col overflow-y-auto pt-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col px-5 pb-10 sm:px-8 lg:px-12">
              {searchOpen ? (
                <form
                  className="menu-item mb-8"
                  onSubmit={(e) => {
                    e.preventDefault();
                    closeMenu();
                    router.push(`/members`);
                  }}
                >
                  <label htmlFor="menu-search" className="sr-only">
                    {locale === "hi" ? "खोजें" : "Search"}
                  </label>
                  <input
                    id="menu-search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      locale === "hi"
                        ? "सदस्य, शाखा या पृष्ठ खोजें"
                        : "Search members, branches or pages"
                    }
                    className="w-full rounded-none border-b border-white/25 bg-transparent py-3 text-lg text-white placeholder:text-white/40 focus:border-saffron-300 focus:outline-none"
                    autoFocus
                  />
                </form>
              ) : null}

              <p className="menu-item text-xs font-semibold uppercase tracking-[0.32em] text-saffron-300">
                <T>{{ en: "Explore BNMS", hi: "BNMS देखें" }}</T>
              </p>

              <div className="mt-8 hidden md:grid md:grid-cols-2 md:gap-x-12 md:gap-y-12 lg:grid-cols-3">
                {groups.map((group, gi) => (
                  <div
                    key={group.en}
                    className="menu-item"
                    style={{ animationDelay: `${120 + gi * 70}ms` }}
                  >
                    <h2 className="font-heading text-xl font-semibold tracking-tight text-white lg:text-2xl">
                      {locale === "hi" ? group.hi : group.en}
                    </h2>
                    <ul className="mt-4 space-y-2">
                      {group.links.map((link) => (
                        <li key={`${group.en}-${link.href}-${link.en}`}>
                          <Link
                            href={link.href}
                            className="text-sm text-white/70 hover:text-saffron-300 lg:text-base"
                            onClick={closeMenu}
                          >
                            {locale === "hi" ? link.hi : link.en}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col md:hidden">
                {groups.map((group) => {
                  const expanded = mobileSection === group.en;
                  return (
                    <div key={group.en} className="menu-item border-b border-white/10">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between py-4 text-left font-heading text-2xl"
                        aria-expanded={expanded}
                        onClick={() => setMobileSection(expanded ? null : group.en)}
                      >
                        {locale === "hi" ? group.hi : group.en}
                        <span aria-hidden="true" className="text-saffron-300">
                          {expanded ? "−" : "+"}
                        </span>
                      </button>
                      {expanded ? (
                        <ul className="space-y-3 pb-5">
                          {group.links.map((link) => (
                            <li key={`${group.en}-${link.en}`}>
                              <Link
                                href={link.href}
                                className="text-base text-white/70"
                                onClick={closeMenu}
                              >
                                {locale === "hi" ? link.hi : link.en}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="menu-item mt-auto flex flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p lang="hi" className="font-devanagari text-sm tracking-[0.18em] text-saffron-300">
                    राष्ट्रहित • समाजसेवा • जनभागीदारी
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <LanguageToggle overlay locale={locale} setLocale={setLocale} />
                    {social?.facebook_url || social?.instagram_url || social?.youtube_url ? (
                      <div className="flex gap-2">
                        {social.facebook_url ? (
                          <Social href={social.facebook_url} label="Facebook">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                          </Social>
                        ) : null}
                        {social.instagram_url ? (
                          <Social href={social.instagram_url} label="Instagram">
                            <rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
                            <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
                          </Social>
                        ) : null}
                        {social.youtube_url ? (
                          <Social href={social.youtube_url} label="YouTube">
                            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                          </Social>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
                <Link
                  href="/auth/signup"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-saffron-700 px-7 text-sm font-semibold text-white hover:bg-saffron-800"
                  onClick={closeMenu}
                >
                  <T>{{ en: "Join BNMS", hi: "BNMS से जुड़ें" }}</T>
                  <span aria-hidden="true">&nbsp;→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Social({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/80 hover:bg-white/10"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        {children}
      </svg>
    </a>
  );
}

function LanguageToggle({
  overlay,
  locale,
  setLocale,
}: {
  overlay: boolean;
  locale: "en" | "hi";
  setLocale: (locale: "en" | "hi") => void;
}) {
  const mute = overlay ? "text-white/55 hover:text-white" : "text-navy/40 hover:text-navy";
  const on = overlay ? "text-white" : "text-navy";

  return (
    <div className="flex items-center gap-2 text-sm font-semibold" role="group" aria-label="Language">
      <button type="button" onClick={() => setLocale("hi")} lang="hi" className={`font-devanagari ${locale === "hi" ? on : mute}`} aria-pressed={locale === "hi"}>
        हिंदी
      </button>
      <span className={overlay ? "text-white/30" : "text-navy/20"} aria-hidden="true">
        |
      </span>
      <button type="button" onClick={() => setLocale("en")} className={locale === "en" ? on : mute} aria-pressed={locale === "en"}>
        English
      </button>
    </div>
  );
}
