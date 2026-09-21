"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { T, useLocale } from "@/lib/locale";

function subscribeScroll(onStoreChange: () => void) {
  window.addEventListener("scroll", onStoreChange, { passive: true });
  return () => window.removeEventListener("scroll", onStoreChange);
}

const NAV_LINKS = [
  { href: "/about", label: { en: "About", hi: "परिचय" } },
  { href: "/branches", label: { en: "Branches", hi: "शाखाएँ" } },
  { href: "/members", label: { en: "Members", hi: "सदस्य" } },
  { href: "/businesses", label: { en: "Businesses", hi: "व्यवसाय" } },
  { href: "/events", label: { en: "Events", hi: "कार्यक्रम" } },
  { href: "/gallery", label: { en: "Gallery", hi: "गैलरी" } },
  { href: "/contact", label: { en: "Contact", hi: "संपर्क" } },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 24,
    () => false
  );
  const pathname = usePathname();
  const { locale, setLocale } = useLocale();
  const isHome = pathname === "/" || pathname === "/about";
  const overlay = (isHome && !scrolled) || open;
  const barText = overlay ? "text-white" : "text-navy";

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={`${
          isHome ? "fixed" : "sticky"
        } top-0 z-50 border-b transition-colors duration-300 ${
          overlay
            ? "border-white/15 bg-transparent"
            : "border-navy/10 bg-white/95 backdrop-blur"
        }`}
      >
        <nav
          className="mx-auto flex h-20 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10"
          aria-label="Primary"
        >
          <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
            <Image
              src="/logo.png"
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 shrink-0"
            />
            <span className={`font-heading truncate text-xl font-semibold sm:text-2xl ${barText}`}>
              Bhartiya Namo Sangh
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block">
              <LanguageToggle overlay={overlay} locale={locale} setLocale={setLocale} />
            </div>
            <Link
              href="/donate"
              className="hidden min-h-11 items-center rounded-full bg-saffron-700 px-5 text-sm font-semibold text-white hover:bg-saffron-800 sm:inline-flex"
              onClick={() => setOpen(false)}
            >
              <T>{{ en: "Donate Now", hi: "अभी दान करें" }}</T>
            </Link>
            <button
              type="button"
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold uppercase tracking-[0.18em] sm:px-4 ${barText}`}
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <T>{open ? { en: "Close", hi: "बंद करें" } : { en: "Menu", hi: "मेनू" }}</T>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                {open ? (
                  <path
                    d="M6 6l12 12M6 18L18 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M4 7h16M4 12h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {open ? (
        <div
          id="site-menu"
          className="home-menu-in fixed inset-0 z-40 overflow-y-auto bg-navy text-white"
          role="dialog"
          aria-modal="true"
          aria-label={locale === "hi" ? "मुख्य मेनू" : "Main menu"}
        >
          <div className="mx-auto flex min-h-svh max-w-[90rem] flex-col justify-center px-6 pb-16 pt-28 sm:px-10 lg:px-16">
            <div className="grid items-end gap-12 lg:grid-cols-12">
              <ul className="flex flex-col gap-1 lg:col-span-8">
                {NAV_LINKS.map((link, i) => {
                  const active = pathname === link.href;
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`group flex items-baseline gap-4 border-b border-white/10 py-3 transition-colors sm:py-4 ${
                          active ? "text-saffron-300" : "text-white hover:text-saffron-300"
                        }`}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setOpen(false)}
                      >
                        <span className="w-8 shrink-0 text-xs tracking-[0.22em] text-white/40">
                          0{i + 1}
                        </span>
                        <T
                          as="span"
                          className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-7xl"
                        >
                          {link.label}
                        </T>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="flex flex-col gap-6 lg:col-span-4 lg:pb-6">
                <p
                  lang="hi"
                  className="font-devanagari text-sm tracking-[0.22em] text-saffron-300"
                >
                  सेवा • जागरूकता • सहभागिता • राष्ट्र निर्माण
                </p>
                <LanguageToggle overlay locale={locale} setLocale={setLocale} />
                <Link
                  href="/auth/login"
                  className="text-lg font-medium text-white/80 hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  <T>{{ en: "Login", hi: "लॉगिन" }}</T>
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-lg font-medium text-white/80 hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  <T>{{ en: "Join the Movement", hi: "आंदोलन से जुड़ें" }}</T>
                </Link>
                <Link
                  href="/donate"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-saffron-700 px-6 text-base font-semibold text-white hover:bg-saffron-800"
                  onClick={() => setOpen(false)}
                >
                  <T>{{ en: "Donate Now", hi: "अभी दान करें" }}</T>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
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
  const frame = overlay
    ? "border-white/30 text-white"
    : "border-navy/15 text-navy";

  return (
    <div
      className={`inline-flex items-center rounded-full border p-1 text-sm font-semibold ${frame}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-full px-3 py-1.5 ${
          locale === "en"
            ? overlay
              ? "bg-white text-navy"
              : "bg-navy text-white"
            : overlay
              ? "text-white/70 hover:text-white"
              : "text-navy/50 hover:text-navy"
        }`}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("hi")}
        lang="hi"
        className={`font-devanagari rounded-full px-3 py-1.5 ${
          locale === "hi"
            ? overlay
              ? "bg-white text-navy"
              : "bg-navy text-white"
            : overlay
              ? "text-white/70 hover:text-white"
              : "text-navy/50 hover:text-navy"
        }`}
        aria-pressed={locale === "hi"}
      >
        हिं
      </button>
    </div>
  );
}
